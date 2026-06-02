## Context

La tabla `Cuota` tiene un campo `Estado string = "pendiente"` por defecto. `EjecutarProntoPago` y `EjecutarAmpliacionPlazo` ya actualizan `Estado` al ejecutarse. Sin embargo, `PagosController.Create` y `Anular` solo tocan `SaldoPagado`, dejando `Estado` desactualizado.

`ToCuotaDetalleDto` sí computa `Estado` dinámicamente desde `SaldoPagado` (fallback correcto para la vista), pero `GetEstadisticas` usa el campo persistido `c.Estado == "pagada"` para contar `cuotasPagadas`. Esto crea una discrepancia observable: el usuario ve cuotas marcadas como pagadas en la tabla, pero el contador de "cuotas pagadas" muestra 0.

Los magic strings de estado están dispersos en ~13 literales a lo largo de los dos controllers.

## Goals / Non-Goals

**Goals:**
- `PagosController.Create`: actualizar `Cuota.Estado` tras cada actualización de `SaldoPagado`
- `PagosController.Anular`: actualizar `Cuota.Estado` tras cada reversión de `SaldoPagado`
- Crear `PrestamoEstados.cs` y reemplazar todos los magic strings
- Establecer la carpeta `CobrosApi/Features/Shared/` (que Fases 2-4 completarán)

**Non-Goals:**
- Extraer casos de uso (Fases 2 y 3)
- Unificar el cálculo de `saldoPendiente` (Fase 4)
- Cambiar la lógica de distribución de abonos

## Decisions

### 1. `RecalcularEstadoCuota` como método privado estático en `PagosController`

La lógica es una expresión de 3 ramas (`>= ValorCuota` → `pagada`, `> 0` → `parcial`, else → `pendiente`). Se extrae a un método privado estático para reutilizarla en `Create` y `Anular`. Se moverá a `CuotasService` en Fase 4.

**Alternativa descartada**: inline en el foreach — duplica la lógica entre los dos métodos.

### 2. `PrestamoEstados` con nested classes

```csharp
public static class PrestamoEstados
{
    public static class Prestamo
    {
        public const string Activo               = "activo";
        public const string Completado           = "completado";
        public const string CerradoProntoPago    = "cerrado_pronto_pago";
        public const string Refinanciado         = "refinanciado";
    }

    public static class Cuota
    {
        public const string Pendiente              = "pendiente";
        public const string Parcial                = "parcial";
        public const string Pagada                 = "pagada";
        public const string CerradaProntoPago      = "cerrada_pronto_pago";
        public const string ReemplazadaAmpliacion  = "reemplazada_por_ampliacion";
    }
}
```

**Alternativa descartada**: un enum — EF Core y las comparaciones LINQ se complican con enums de string.

### 3. Script SQL de corrección de datos existentes

Cuotas ya pagadas vía `PagosController.Create` (antes del fix) tienen `Estado = "pendiente"` en BD. El script corrige a `"pagada"` donde `SaldoPagado >= ValorCuota` y a `"parcial"` donde `SaldoPagado > 0`.

```sql
UPDATE "Cuotas"
SET "Estado" = CASE
    WHEN "SaldoPagado" >= "ValorCuota" THEN 'pagada'
    WHEN "SaldoPagado" > 0            THEN 'parcial'
    ELSE 'pendiente'
END
WHERE "Estado" = 'pendiente' AND "SaldoPagado" > 0;
```

## Risks / Trade-offs

- **[Risk] Script de datos en producción** → Ejecutar en una transacción con `BEGIN/ROLLBACK` primero para verificar las filas afectadas. Hacer backup previo.
- **[Trade-off] RecalcularEstadoCuota duplicado** → Temporal hasta Fase 4. Aceptable dado que es una expresión de 3 líneas.

## Migration Plan

1. Crear `PrestamoEstados.cs`, compilar y verificar sin errores
2. Reemplazar magic strings (no cambia comportamiento)
3. Fix `PagosController.Create` y `Anular` (bug fix)
4. Ejecutar `dotnet test` — todos los tests deben pasar
5. Ejecutar script SQL de corrección en producción (antes o después del deploy)
6. Deploy

## Open Questions

- ¿El script SQL de corrección se ejecuta antes o después del deploy? (Recomendado: antes, para que `GetEstadisticas` empiece a reportar correctamente desde el primer request post-deploy)
