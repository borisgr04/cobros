## MODIFIED Requirements

### Requirement: Distribución de abono actualiza SaldoPagado y registra AplicacionCuota
Al registrar un abono, el sistema SHALL distribuir el valor en las cuotas pendientes o parciales en orden ascendente por `NumeroCuota`, actualizar `SaldoPagado` y `Estado` en cada cuota afectada y crear un registro `AplicacionCuota` por cada cuota cubierta — todo en una única transacción de base de datos. La lógica de negocio SHALL residir en el handler `AplicarPago`. El saldo pendiente SHALL calcularse desde `Cuotas.Sum(c => c.ValorCuota - c.SaldoPagado)`, consistente con `ValorTotal - Cuotas.Sum(c => c.SaldoPagado)`.

#### Scenario: Pago registrado con trazabilidad completa
- **WHEN** se registra un abono válido via `POST /api/pagos`
- **THEN** el controlador delega en `AplicarPago.ExecuteAsync`
- **AND** se persiste 1 registro `Pago` con el valor real del abono
- **AND** se actualizan los `SaldoPagado` y `Estado` de las cuotas afectadas
- **AND** se crean registros `AplicacionCuota` vinculando el pago con cada cuota cubierta
- **AND** la respuesta HTTP 201 retorna el `PagoDto` del pago creado

#### Scenario: Validación de saldo usa fuente canónica desde cuotas
- **WHEN** el valor del abono supera `SUM(ValorCuota - SaldoPagado)` de las cuotas no pagadas
- **THEN** el sistema retorna HTTP 400 con mensaje de error
- **AND** el cálculo proviene de la tabla `Cuota`, no de la tabla `Pago`

#### Scenario: Consulta de historial refleja la transacción real
- **WHEN** se consulta el historial de pagos de un préstamo
- **THEN** cada registro corresponde a un abono real realizado por el cliente

#### Scenario: Modal de pago se abre con el valor de la cuota pre-rellenado
- **WHEN** el usuario abre el modal de registro de pago para un préstamo
- **THEN** el campo de monto muestra por defecto el valor de una cuota del préstamo
- **AND** el modo cuotas inicia con cantidad 1 seleccionada

#### Scenario: Campo de cuotas queda seleccionado al recibir foco
- **WHEN** el usuario hace clic o toca el campo de cantidad de cuotas o monto libre
- **THEN** el contenido del campo queda completamente seleccionado
- **AND** el usuario puede escribir directamente sin necesidad de borrar primero

### Requirement: Consulta de cuotas lee de la tabla persistida
El endpoint `GET /api/prestamos/{id}/cuotas` SHALL leer directamente de la tabla `Cuota` sin recalcular distribución, retornando `SaldoPagado` y estado derivado por cada cuota.

#### Scenario: Consulta directa sin cálculo
- **WHEN** se consulta el endpoint `/cuotas` de un préstamo con cuotas generadas
- **THEN** la respuesta proviene directamente de la tabla `Cuota`
- **AND** cada cuota incluye `SaldoPagado` y estado derivado (`pagada`/`parcial`/`pendiente`)
