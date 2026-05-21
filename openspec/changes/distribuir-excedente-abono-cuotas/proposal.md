## Why

Actualmente el sistema no persiste las cuotas como entidades propias ni registra cómo se aplica cada abono a cuotas específicas. El estado de cada cuota se recalcula en el frontend por índice, sin considerar si un abono supera el valor de una cuota. Esto impide la distribución automática de abonos mayores y obliga a recalcular el estado en cada consulta.

## What Changes

- Se introduce `Cuota` como entidad persistida con campo `SaldoPagado`, generada automáticamente al crear un préstamo
- Se introduce `AplicacionCuota` que vincula cada `Pago` con las cuotas que cubre y el `ValorAplicado` a cada una — trazabilidad completa de cada transacción
- `POST /api/pagos` distribuye el abono en cuotas pendientes en orden, actualiza `SaldoPagado` y registra las `AplicacionCuota`
- `GET /api/prestamos/{id}/cuotas` lee directamente de la tabla `Cuota` — sin recálculo
- El historial de pagos sigue mostrando 1 registro por transacción real
- El frontend simplifica `generarProyeccionCuotas` para consumir el estado del backend

## Capabilities

### New Capabilities
- `cuota-persistida`: Entidad `Cuota` con `SaldoPagado` generada al crear un préstamo
- `aplicacion-cuota`: Entidad `AplicacionCuota` que registra qué pago aplicó cuánto a qué cuota
- `distribucion-abono`: Lógica de distribución automática en `POST /api/pagos`

### Modified Capabilities
- `registro-pago`: Al registrar un pago se distribuye el valor, se actualiza `SaldoPagado` y se crean `AplicacionCuota`
- `consulta-cuotas`: `GET /api/prestamos/{id}/cuotas` lee de la tabla `Cuota` en lugar de calcular on-the-fly

## Impact

- `backend/CobrosApi/Models/Cuota.cs`: nuevo modelo
- `backend/CobrosApi/Models/AplicacionCuota.cs`: nuevo modelo
- `backend/CobrosApi/Data/CobrosDbContext.cs`: nuevos `DbSet<Cuota>` y `DbSet<AplicacionCuota>`
- `backend/CobrosApi/DTOs/Dtos.cs`: nuevos DTOs `CuotaDetalleDto` y `AplicacionCuotaDto`
- `backend/CobrosApi/Controllers/PagosController.cs`: lógica de distribución en `Create`
- `backend/CobrosApi/Controllers/PrestamosController.cs`: generar cuotas al crear préstamo; simplificar endpoint `/cuotas`
- `backend/CobrosApi/Migrations/`: nueva migración
- `cobros-iu/src/app/features/prestamos/utils/prestamo-calculations.ts`: simplificar `generarProyeccionCuotas`
