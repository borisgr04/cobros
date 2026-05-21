## ADDED Requirements

### Requirement: Cuota como entidad persistida con SaldoPagado
El sistema SHALL generar N registros `Cuota` al crear un préstamo, cada uno con `SaldoPagado = 0`. El estado de cada cuota se deriva de `SaldoPagado`: `0` → pendiente, `0 < SaldoPagado < ValorCuota` → parcial, `SaldoPagado >= ValorCuota` → pagada.

#### Scenario: Generación automática de cuotas al crear préstamo
- **WHEN** se crea un préstamo con `CantidadCuotas = N`
- **THEN** el sistema genera N registros `Cuota` con `SaldoPagado = 0`
- **AND** cada cuota tiene su `FechaEsperada` calculada según la `FrecuenciaPago`

### Requirement: Distribución de abono actualiza SaldoPagado y registra AplicacionCuota
Al registrar un abono, el sistema SHALL distribuir el valor en las cuotas pendientes o parciales en orden ascendente por `NumeroCuota`, actualizar `SaldoPagado` en cada cuota afectada y crear un registro `AplicacionCuota` por cada cuota cubierta.

#### Scenario: Abono cubre exactamente N cuotas enteras
- **WHEN** el valor del abono es múltiplo exacto de `ValorCuota`
- **THEN** N cuotas quedan con `SaldoPagado = ValorCuota` (estado `pagada`)
- **AND** se crean N registros `AplicacionCuota` con `ValorAplicado = ValorCuota`

#### Scenario: Abono cubre N cuotas completas y deja un residuo
- **WHEN** el valor del abono supera `ValorCuota * N` pero no alcanza `ValorCuota * (N+1)`
- **THEN** N cuotas quedan con `SaldoPagado = ValorCuota` (estado `pagada`)
- **AND** la cuota N+1 queda con `SaldoPagado = residuo` (estado `parcial`)
- **AND** se crean N+1 registros `AplicacionCuota` con sus respectivos `ValorAplicado`

#### Scenario: Abono menor al valor de una cuota
- **WHEN** el valor del abono es menor a `ValorCuota`
- **THEN** la primera cuota pendiente queda con `SaldoPagado = ValorAbono` (estado `parcial`)
- **AND** se crea 1 registro `AplicacionCuota`

### Requirement: Validación de abono contra saldo pendiente
El sistema SHALL rechazar un pago cuyo valor supere el saldo pendiente total del préstamo.

#### Scenario: Abono excede el saldo pendiente
- **WHEN** el valor del abono supera `SUM(ValorCuota - SaldoPagado)` de todas las cuotas no completamente pagadas
- **THEN** el sistema retorna HTTP 400 con mensaje de error indicando que el abono supera el saldo pendiente
- **AND** no se crea ningún `Pago` ni `AplicacionCuota`
