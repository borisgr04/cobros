## Context

El sistema tiene actualmente dos formas de calcular cuánto se ha pagado de un préstamo:

1. **Desde Pagos** (forma A): `prestamo.Pagos.Where(p => !p.Anulado).Sum(p => p.Valor)`
   - Usada en: `GetResumenProntoPago`, `GetResumenAmpliacion`, `EjecutarProntoPago`, `EjecutarAmpliacionPlazo`
   - Requiere `Include(p => p.Pagos)` en la query

2. **Desde Cuotas** (forma B): `prestamo.Cuotas.Sum(c => c.SaldoPagado)`
   - Usada en: `GetEstadisticas`
   - Establecida como canónica en Fase 1 (ya que `SaldoPagado` refleja la distribución real)

Ambas deben ser equivalentes cuando los datos son coherentes, pero divergen en escenarios de error o al inicio del refactor. La fuente canónica debe ser una sola.

Adicionalmente, `GetActivos` carga todos los pagos solo para comparar la suma contra `ValorTotal` — una query costosa que crece con el volumen de pagos.

## Goals / Non-Goals

**Goals:**
- Crear `PrestamosQueries.cs` con extension methods para los patrones de query más usados
- Unificar el cálculo de `saldoPendiente` a la forma B en todos los componentes
- Optimizar `GetActivos` para no cargar la colección de pagos

**Non-Goals:**
- Optimizar queries de `GetEstadisticas` (ya usa forma B)
- Cambiar las reglas de negocio del pronto pago o ampliación
- Agregar paginación u otras features de consulta

## Decisions

### 1. PrestamosQueries como static class con extension methods

```csharp
public static class PrestamosQueries
{
    // Carga cuotas, calcula saldo desde cuotas
    public static IQueryable<Prestamo> WithCuotas(this IQueryable<Prestamo> q)
        => q.Include(p => p.Cuotas);

    // Filtra activos por cuotas no completamente pagadas (sin Include de Pagos)
    public static IQueryable<Prestamo> GetActivosConSaldo(this IQueryable<Prestamo> q)
        => q.Where(p => p.Estado == PrestamoEstados.Prestamo.Activo)
            .Include(p => p.Cuotas)
            .Where(p => p.Cuotas.Sum(c => c.SaldoPagado) < p.ValorTotal);
}
```

**Alternativa descartada**: métodos en el DbContext — acopla queries al contexto de infraestructura.

### 2. Cálculo canónico de saldoPendiente

```csharp
var totalPagado    = prestamo.Cuotas.Sum(c => c.SaldoPagado);
var saldoPendiente = prestamo.ValorTotal - totalPagado;
```

Reemplaza en todos los lugares donde se hacía `Pagos.Where(!Anulado).Sum(Valor)`.

**Por qué forma B es más correcta**: `SaldoPagado` en cuotas refleja exactamente cuánto del préstamo está cubierto. Los pagos anulados ya descontaron `SaldoPagado` en Fase 1. No hay discrepancia posible.

### 3. GetActivos optimizado

Antes:
```csharp
.Include(p => p.Pagos)
.Where(p => p.Estado == "activo")
// in-memory filter:
.Where(p => p.Pagos.Where(pg => !pg.Anulado).Sum(pg => pg.Valor) < p.ValorTotal)
```

Después:
```csharp
db.Prestamos.GetActivosConSaldo()
```

Donde `GetActivosConSaldo` usa `.Where(p => p.Cuotas.Sum(c => c.SaldoPagado) < p.ValorTotal)` — traducible a SQL por EF Core sin cargar la colección de Pagos.

## Risks / Trade-offs

- **[Risk] EF Core traducción de `.Sum` en `.Where`** → EF Core 8 con Npgsql traduce `p.Cuotas.Sum(c => c.SaldoPagado)` a SQL corretamente. Verificar en los tests de integración que la query no falla en la BD InMemory.
- **[Trade-off] Cambio de fuente de verdad** → Si hay deuda de datos (cuotas con `SaldoPagado` incorrecto antes de Fase 1), el cambio expone el error. Mitigación: el script SQL de Fase 1 corrige los datos existentes.

## Migration Plan

1. Crear `PrestamosQueries.cs`
2. Actualizar `GetActivos` en el controlador para usar `GetActivosConSaldo`
3. Actualizar `GetResumenProntoPago` y `GetResumenAmpliacion` en el controlador
4. Actualizar `EjecutarProntoPago` y `EjecutarAmpliacionPlazo` para usar forma B
5. Ejecutar `dotnet test` — todos los tests deben pasar
6. Verificar manualmente que `GetActivos` retorna el mismo conjunto de préstamos

## Open Questions

- ¿`GetActivosConSaldo` debe filtrar también préstamos donde `Cuotas.Count == 0` (préstamos sin cuotas legacy)? (Recomendado: sí, para excluirlos del listado activo — agregar `&& p.Cuotas.Any()` o manejar como edge case)
