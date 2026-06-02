## Why

`PagosController.Create` distribuye el abono y actualiza `Cuota.SaldoPagado`, pero nunca actualiza `Cuota.Estado`. Lo mismo ocurre en `Anular`. Como resultado, `GET /prestamos/{id}/estadisticas` reporta `cuotasPagadas = 0` incluso tras múltiples pagos normales, porque cuenta por `c.Estado == "pagada"`. Adicionalmente, los strings de estado están hardcodeados como magic strings en ambos controllers, haciendo que cualquier renombre cause regresiones silenciosas.

## What Changes

- `PagosController.Create`: después de actualizar `SaldoPagado` en cada cuota, también actualizar `Estado` (`"pagada"` / `"parcial"` / `"pendiente"`)
- `PagosController.Anular`: después de revertir `SaldoPagado` en cada cuota, recalcular y actualizar `Estado`
- Nuevo archivo `CobrosApi/Features/Shared/PrestamoEstados.cs` con todas las constantes de estado (préstamo y cuota) — establece la estructura de carpetas `Features/` que las fases posteriores completarán
- Reemplazar todos los magic strings en `PrestamosController.cs` y `PagosController.cs` con las constantes

## Capabilities

### New Capabilities

- `prestamo-estados-centralizados`: Clase estática `PrestamoEstados` con constantes para todos los estados de préstamo (`"activo"`, `"completado"`, `"cerrado_pronto_pago"`, `"refinanciado"`) y de cuota (`"pendiente"`, `"parcial"`, `"pagada"`, `"cerrada_pronto_pago"`, `"reemplazada_por_ampliacion"`)

### Modified Capabilities

- `distribucion-abono`: El campo `Cuota.Estado` debe ser **persistido** al registrar o anular un pago (no solo derivado dinámicamente en la proyección DTO), para que `GetEstadisticas` cuente `cuotasPagadas` correctamente

## Impact

- `backend/CobrosApi/Controllers/PagosController.cs` — bug fix en `Create` y `Anular`
- `backend/CobrosApi/Controllers/PrestamosController.cs` — reemplazo de magic strings únicamente
- Nuevo: `backend/CobrosApi/Features/Shared/PrestamoEstados.cs`
- Sin cambios en contratos de API (HTTP 200/201/400 y cuerpos de respuesta no cambian)
- Las cuotas existentes en BD con `Estado` incorrecto requerirán un script de corrección puntual
