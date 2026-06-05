### Requirement: Registro de pago con distribución atómica
El endpoint `POST /api/pagos` SHALL persistir exactamente 1 registro `Pago`, distribuir el valor en cuotas pendientes/parciales en orden ascendente, actualizar `SaldoPagado`, `Estado` y crear los registros `AplicacionCuota` correspondientes — todo en una única transacción de base de datos. La lógica de negocio SHALL residir en el handler `AplicarPago`, no en el controlador.

#### Scenario: Pago registrado con trazabilidad completa
- **WHEN** se registra un abono válido via `POST /api/pagos`
- **THEN** el controlador delega en `AplicarPago.ExecuteAsync`
- **AND** se persiste 1 registro `Pago` con el valor real del abono
- **AND** se actualizan los `SaldoPagado` y `Estado` de las cuotas afectadas
- **AND** se crean registros `AplicacionCuota` vinculando el pago con cada cuota cubierta
- **AND** la respuesta HTTP 201 retorna el `PagoDto` del pago creado

#### Scenario: Consulta de historial refleja la transacción real
- **WHEN** se consulta el historial de pagos de un préstamo
- **THEN** cada registro corresponde a un abono real realizado por el cliente
- **AND** no existen registros artificiales generados por el sistema

#### Scenario: Modal de pago se abre con el valor de la cuota pre-rellenado
- **WHEN** el usuario abre el modal de registro de pago para un préstamo
- **THEN** el campo de monto muestra por defecto el valor de una cuota del préstamo
- **AND** el modo cuotas inicia con cantidad 1 seleccionada

#### Scenario: Campo de cuotas queda seleccionado al recibir foco
- **WHEN** el usuario hace clic o toca el campo de cantidad de cuotas o monto libre
- **THEN** el contenido del campo queda completamente seleccionado
- **AND** el usuario puede escribir directamente sin necesidad de borrar primero

### Requirement: URL de consulta pública en notificación de registro de pago
La URL de consulta pública compartida al registrar un pago SHALL construirse usando exclusivamente `prestamo.cliente.id` como identificador.

#### Scenario: Generación de URL de consulta en registro de pago
- **WHEN** se registra un pago y se genera la URL de consulta para compartir
- **THEN** la URL SHALL tener la forma `{baseUrl}/consulta/{cliente.id}`

### Requirement: Consulta de cuotas lee de la tabla persistida
El endpoint `GET /api/prestamos/{id}/cuotas` SHALL leer directamente de la tabla `Cuota` sin recalcular distribución, retornando `SaldoPagado` y estado derivado por cada cuota.

#### Scenario: Consulta directa sin cálculo
- **WHEN** se consulta el endpoint `/cuotas` de un préstamo con cuotas generadas
- **THEN** la respuesta proviene directamente de la tabla `Cuota`
- **AND** cada cuota incluye `SaldoPagado` y estado derivado (`pagada`/`parcial`/`pendiente`)
