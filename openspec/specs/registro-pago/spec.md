### Requirement: Registro de pago con distribución atómica
El endpoint `POST /api/pagos` SHALL persistir exactamente 1 registro `Pago` (trazabilidad de la transacción real), distribuir el valor en cuotas pendientes/parciales en orden ascendente, actualizar `SaldoPagado` y crear los registros `AplicacionCuota` correspondientes — todo en una única transacción de base de datos.

#### Scenario: Pago registrado con trazabilidad completa
- **WHEN** se registra un abono válido
- **THEN** se persiste 1 registro `Pago` con el valor real del abono
- **AND** se actualizan los `SaldoPagado` de las cuotas afectadas
- **AND** se crean registros `AplicacionCuota` vinculando el pago con cada cuota cubierta
- **AND** la respuesta HTTP 201 retorna el `PagoDto` del pago creado

#### Scenario: Consulta de historial refleja la transacción real
- **WHEN** se consulta el historial de pagos de un préstamo
- **THEN** cada registro corresponde a un abono real realizado por el cliente
- **AND** no existen registros artificiales generados por el sistema

### Requirement: Consulta de cuotas lee de la tabla persistida
El endpoint `GET /api/prestamos/{id}/cuotas` SHALL leer directamente de la tabla `Cuota` sin recalcular distribución, retornando `SaldoPagado` y estado derivado por cada cuota.

#### Scenario: Consulta directa sin cálculo
- **WHEN** se consulta el endpoint `/cuotas` de un préstamo con cuotas generadas
- **THEN** la respuesta proviene directamente de la tabla `Cuota`
- **AND** cada cuota incluye `SaldoPagado` y estado derivado (`pagada`/`parcial`/`pendiente`)
