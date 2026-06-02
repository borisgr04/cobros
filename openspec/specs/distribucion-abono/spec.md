### Requirement: Cuota como entidad persistida con SaldoPagado
El sistema SHALL generar N registros `Cuota` al crear un préstamo, cada uno con `SaldoPagado = 0`. El estado de cada cuota se deriva de `SaldoPagado`: `0` → pendiente, `0 < SaldoPagado < ValorCuota` → parcial, `SaldoPagado >= ValorCuota` → pagada.

#### Scenario: Generación automática de cuotas al crear préstamo
- **WHEN** se crea un préstamo con `CantidadCuotas = N`
- **THEN** el sistema genera N registros `Cuota` con `SaldoPagado = 0`
- **AND** cada cuota tiene su `FechaEsperada` calculada según la `FrecuenciaPago`

### Requirement: Distribución de abono actualiza SaldoPagado y registra AplicacionCuota
Al registrar un abono, el sistema SHALL distribuir el valor en las cuotas pendientes o parciales en orden ascendente por `NumeroCuota`, actualizar `SaldoPagado` **y `Estado`** en cada cuota afectada y crear un registro `AplicacionCuota` por cada cuota cubierta.

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

### Requirement: Validación de abono contra saldo pendiente
El sistema SHALL rechazar un pago cuyo valor supere el saldo pendiente total del préstamo.

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
