## Context

Tras Fase 2, los handlers de pagos están extraídos. Ahora se extrae la liquidación. `EjecutarProntoPago` y `EjecutarAmpliacionPlazo` en el controlador actual tienen la siguiente estructura:

1. Resolver usuario autenticado desde claims
2. Cargar el préstamo con `Include(Pagos, Cuotas)`
3. Validar estado del préstamo
4. Calcular `totalPagado` desde `Pagos.Where(!Anulado).Sum(Valor)` (pendiente de unificación en Fase 4)
5. Validar saldo pendiente
6. Filtrar cuotas pendientes
7. Ejecutar lógica específica (prontoPago: descuento de intereses; ampliación: reemplazar cuotas + generar nuevas)
8. Registrar `NovedadPrestamo`
9. Actualizar estado del préstamo
10. Retornar DTO de resultado

`CalcularFechaCuota` es privado en el controlador y está duplicado conceptualmente con el loop en `Create`.

## Goals / Non-Goals

**Goals:**
- Extraer `EjecutarProntoPago` y `EjecutarAmpliacionPlazo` como handlers
- Crear `CuotasService` con `GenerarCuotas` y `CalcularFechaCuota` como punto único
- Eliminar `CalcularFechaCuota` del controlador (moverlo a `CuotasService`)

**Non-Goals:**
- Unificar el cálculo de `saldoPendiente` (Fase 4)
- Cambiar las reglas de negocio de pronto pago o ampliación
- Extraer el servicio de usuarios (`resolver usuario desde claims` permanece en el controlador hasta Fase 4 o decisión posterior)

## Decisions

### 1. CuotasService con método estático o de instancia

`CuotasService` no necesita `DbContext` — solo recibe parámetros y retorna cuotas. Se define con métodos `static` para evitar registro innecesario en DI.

```csharp
public static class CuotasService
{
    public static DateTime CalcularFechaCuota(DateTime fechaInicio, string frecuencia, int numeroCuota) { ... }

    public static IEnumerable<Cuota> GenerarCuotas(int prestamoId, int cantidadCuotas,
        decimal valorTotal, decimal valorCuota, DateTime fechaInicio, string frecuencia) { ... }
}
```

**Alternativa descartada**: instancia registrada en DI — sin estado ni DbContext, la instancia no aporta valor.

### 2. EjecutarProntoPago recibe `int usuarioId` (no extrae claims)

La resolución del usuario desde JWT claims pertenece a la capa HTTP. El controlador resuelve el `usuarioId` antes de llamar al handler. El handler recibe `int usuarioId` en su DTO.

```csharp
public record EjecutarProntoPagoDto(int PrestamoId, decimal ValorNegociado, string? Notas, int UsuarioId);
```

**Alternativa descartada**: pasar `ClaimsPrincipal` al handler — acopla el handler a la abstracción HTTP.

### 3. EjecutarProntoPago usa AplicarPago internamente

El pronto pago crea un `Pago` de tipo `"pronto_pago"` y distribuye en cuotas. Esta lógica es idéntica a la de `AplicarPago`. El handler `EjecutarProntoPago` puede instanciar o recibir `AplicarPago` por DI para reutilizarla.

**Alternativa descartada**: duplicar la distribución — viola DRY y el principio de Fase 2.

### 4. Carpeta `Features/Liquidacion/` para pronto pago y ampliación

Ambos son operaciones de cierre/reestructuración del préstamo, no de pagos cotidianos. La separación semántica justifica la carpeta propia.

## Risks / Trade-offs

- **[Trade-off] EjecutarProntoPago usa AplicarPago** → Acopla Fase 3 a Fase 2. Aceptable porque Fase 2 es prerequisito. Si se revierte Fase 2, hay que reinsertar la lógica inline.
- **[Risk] CuotasService.CalcularFechaCuota tiene lógica de timezone** → `DateTime.Kind == Utc` assumption. El test de fechas de Fase 1/inicial ya cubre esto. Verificar que no se pierda al mover a CuotasService.

## Migration Plan

1. Crear `CuotasService.cs` — mover `CalcularFechaCuota` y crear `GenerarCuotas`
2. Actualizar `PrestamosController.Create` para usar `CuotasService.GenerarCuotas`
3. Crear `EjecutarProntoPago.cs`
4. Crear `EjecutarAmpliacionPlazo.cs`
5. Registrar handlers en `Program.cs`
6. Modificar `PrestamosController` para delegar en los handlers
7. Ejecutar `dotnet test` — todos los tests deben pasar

## Open Questions

- ¿`EjecutarProntoPago` reutiliza `AplicarPago` internamente o duplica la distribución? (Decisión: reutilizar, ver punto 3)
