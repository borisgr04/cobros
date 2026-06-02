### Requirement: Cuota como entidad persistida con SaldoPagado
El sistema SHALL generar N registros `Cuota` al crear un préstamo, cada uno con `SaldoPagado = 0`. El estado de cada cuota se deriva de `SaldoPagado`: `0` → pendiente, `0 < SaldoPagado < ValorCuota` → parcial, `SaldoPagado >= ValorCuota` → pagada.

#### Scenario: Generación automática de cuotas al crear préstamo
- **WHEN** se crea un préstamo con `CantidadCuotas = N`
- **THEN** el sistema genera N registros `Cuota` con `SaldoPagado = 0`
- **AND** cada cuota tiene su `FechaEsperada` calculada según la `FrecuenciaPago`

### Requirement: Distribución de abono actualiza SaldoPagado y registra AplicacionCuota
Al registrar un abono, el sistema SHALL distribuir el valor en las cuotas pendientes o parciales en orden ascendente por `NumeroCuota`, actualizar `SaldoPagado` y `Estado` en cada cuota afectada y crear un registro `AplicacionCuota` por cada cuota cubierta — todo en una única transacción de base de datos. La lógica de negocio SHALL residir en el handler `AplicarPago`. El saldo pendiente SHALL calcularse desde `Cuotas.Sum(c => c.ValorCuota - c.SaldoPagado)`, consistente con `ValorTotal - Cuotas.Sum(c => c.SaldoPagado)`.

#### Scenario: Pago registrado con trazabilidad completa
- **WHEN** se registra un abono válido via `POST /api/pagos`
- **THEN** el controlador delega en `AplicarPago.ExecuteAsync`
- **AND** se persiste 1 registro `Pago` con el valor real del abono
- **AND** se actualizan los `SaldoPagado` y `Estado` de las cuotas afectadas
- **AND** se crean registros `AplicacionCuota` vinculando el pago con cada cuota cubierta
- **AND** la respuesta HTTP 201 retorna el `PagoDto` del pago creado

#### Scenario: Abono cubre exactamente N cuotas enteras
- **WHEN** el valor del abono es múltiplo exacto de `ValorCuota`
- **THEN** N cuotas quedan con `SaldoPagado = ValorCuota` y `Estado = "pagada"`
- **AND** se crean N registros `AplicacionCuota` con `ValorAplicado = ValorCuota`

#### Scenario: Abono cubre N cuotas completas y deja un residuo
- **WHEN** el valor del abono supera `ValorCuota * N` pero no alcanza `ValorCuota * (N+1)`
- **THEN** N cuotas quedan con `SaldoPagado = ValorCuota` y `Estado = "pagada"`
- **AND** la cuota N+1 queda con `SaldoPagado = residuo` y `Estado = "parcial"`
- **AND** se crean N+1 registros `AplicacionCuota` con sus respectivos `ValorAplicado`

#### Scenario: Abono menor al valor de una cuota
- **WHEN** el valor del abono es menor a `ValorCuota`
- **THEN** la primera cuota pendiente queda con `SaldoPagado = ValorAbono` y `Estado = "parcial"`
- **AND** se crea 1 registro `AplicacionCuota`

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

### Requirement: Validación de abono contra saldo pendiente
El sistema SHALL rechazar un pago cuyo valor supere el saldo pendiente total del préstamo.

#### Scenario: Validación de saldo usa fuente canónica desde cuotas
- **WHEN** el valor del abono supera `SUM(ValorCuota - SaldoPagado)` de las cuotas no pagadas
- **THEN** el sistema retorna HTTP 400 con mensaje de error
- **AND** el cálculo proviene de la tabla `Cuota`, no de la tabla `Pago`

#### Scenario: Abono excede el saldo pendiente
- **WHEN** el valor del abono supera `SUM(ValorCuota - SaldoPagado)` de todas las cuotas no completamente pagadas
- **THEN** el sistema retorna HTTP 400 con mensaje de error indicando que el abono supera el saldo pendiente
- **AND** no se crea ningún `Pago` ni `AplicacionCuota`

### Requirement: Anulación de pago revierte SaldoPagado y Estado
Al anular un pago, el sistema SHALL revertir el `SaldoPagado` de cada `Cuota` afectada **y recalcular `Estado`** basándose en el nuevo valor de `SaldoPagado`.

#### Scenario: Anulación restaura cuotas al estado previo al pago
- **WHEN** se anula un pago que había cubierto N cuotas completas
- **THEN** las N cuotas vuelven a `Estado = "pendiente"` con `SaldoPagado = 0`
- **AND** el pago queda marcado como `Anulado = true`

#### Scenario: Anulación restaura cuota parcialmente pagada
- **WHEN** se anula un pago que había dejado una cuota en estado `"parcial"`
- **THEN** la cuota restaura `SaldoPagado` al valor previo y `Estado` al estado correspondiente

#### Scenario: GetEstadisticas refleja cuotas pagadas correctamente
- **WHEN** se consulta `GET /api/prestamos/{id}/estadisticas` tras registrar N cuotas completas
- **THEN** `cuotasPagadas` es igual al número de cuotas con `Estado = "pagada"`
- **AND** el valor es consistente con los pagos registrados

### Requirement: Consulta de cuotas lee de la tabla persistida
El endpoint `GET /api/prestamos/{id}/cuotas` SHALL leer directamente de la tabla `Cuota` sin recalcular distribución, retornando `SaldoPagado` y estado derivado por cada cuota.

#### Scenario: Consulta directa sin cálculo
- **WHEN** se consulta el endpoint `/cuotas` de un préstamo con cuotas generadas
- **THEN** la respuesta proviene directamente de la tabla `Cuota`
- **AND** cada cuota incluye `SaldoPagado` y estado derivado (`pagada`/`parcial`/`pendiente`)
