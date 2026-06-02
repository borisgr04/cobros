## Why

Tras Fases 1-3, los casos de uso están extraídos pero subsisten tres inconsistencias estructurales: (1) `saldoPendiente` se calcula de dos formas incompatibles — `Pagos.Where(!Anulado).Sum(Valor)` en `GetResumenProntoPago`, `EjecutarProntoPago` y `EjecutarAmpliacionPlazo`; vs. `Cuotas.Sum(SaldoPagado)` en `GetEstadisticas`. La fuente canónica establecida en Fase 1 es `Cuotas.Sum(SaldoPagado)`. (2) `GetActivos()` hace `.Include(p => p.Pagos)` solo para sumar valores — no escala. (3) Las queries LINQ para cargar préstamos con pagos o con cuotas se repiten entre controladores y handlers.

## What Changes

- Nuevo: `CobrosApi/Features/Prestamos/PrestamosQueries.cs` — extension methods sobre `IQueryable<Prestamo>` para las queries comunes: `GetActivosConSaldo()`, `WithPagos()`, `WithCuotas()`
- Unificar el cálculo de `saldoPendiente` a `Cuotas.Sum(c => c.SaldoPagado)` **en todos los handlers y controladores** que aún usen `Pagos.Sum(p => p.Valor)`
- `GetActivos()` reescrito para usar `Cuotas.Sum(SaldoPagado)` en lugar de `Include(Pagos)` — eliminando el N+1 de la carga de pagos

## Capabilities

### New Capabilities

- `prestamos-queries-centralizadas`: Extension methods `PrestamosQueries` reutilizables por todos los handlers; elimina la duplicación de LINQ entre controladores y casos de uso

### Modified Capabilities

- `distribucion-abono`: La validación del saldo pendiente en `PagosController.Create` (y `AplicarPago`) pasa a calcularse desde `Cuotas.Sum(c => c.ValorCuota - c.SaldoPagado)` (ya era así) — se verifica que es consistente con `ValorTotal - Cuotas.Sum(c => c.SaldoPagado)` para detectar posibles divergencias. **No es un BREAKING change** — el resultado es equivalente cuando los datos son coherentes.

## Impact

- `backend/CobrosApi/Controllers/PrestamosController.cs` — `GetActivos` y `GetResumenProntoPago` actualizados
- `backend/CobrosApi/Features/Liquidacion/EjecutarProntoPago.cs` — cálculo de `totalPagado` unificado
- `backend/CobrosApi/Features/Liquidacion/EjecutarAmpliacionPlazo.cs` — ídem
- Nuevo: `CobrosApi/Features/Prestamos/PrestamosQueries.cs`
- Sin cambios en contratos de API
- **Prerrequisito**: Fase 3 completada
