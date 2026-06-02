## ADDED Requirements

### Requirement: AplicarPago como caso de uso independiente
El sistema SHALL exponer la lógica de registro de pago como un handler `AplicarPago` invocable sin la capa HTTP. El handler SHALL validar el estado del préstamo, cargar cuotas pendientes, distribuir el abono, crear el `Pago`, crear los registros `AplicacionCuota` y actualizar `Cuota.SaldoPagado` y `Cuota.Estado` — todo en una transacción.

#### Scenario: Handler rechaza préstamo cerrado
- **WHEN** `AplicarPago.ExecuteAsync` recibe un `PrestamoId` con estado `"completado"`, `"cerrado_pronto_pago"` o `"refinanciado"`
- **THEN** retorna `Result<Pago>.Fail` con error y código HTTP 400
- **AND** no se persiste ningún `Pago`

#### Scenario: Handler registra pago correctamente
- **WHEN** `AplicarPago.ExecuteAsync` recibe datos válidos
- **THEN** retorna `Result<Pago>.Ok` con el `Pago` persistido
- **AND** las cuotas afectadas tienen `SaldoPagado` y `Estado` actualizados
- **AND** existen los registros `AplicacionCuota` correspondientes

### Requirement: AnularPago como caso de uso independiente
El sistema SHALL exponer la lógica de anulación de pago como un handler `AnularPago` invocable sin la capa HTTP. El handler SHALL verificar que el pago existe, no está ya anulado, y es el último pago activo del préstamo — luego revertir `SaldoPagado` y `Estado` en cada cuota y marcar el pago como anulado.

#### Scenario: Handler rechaza anulación de pago no reciente
- **WHEN** `AnularPago.ExecuteAsync` recibe el `id` de un pago que no es el más reciente activo
- **THEN** retorna `Result<Pago>.Fail` con error "Solo se puede anular el pago más reciente" y código 400
- **AND** no se modifica ninguna cuota

#### Scenario: Handler anula pago y revierte cuotas
- **WHEN** `AnularPago.ExecuteAsync` recibe el `id` del último pago activo con motivo válido
- **THEN** retorna `Result<Pago>.Ok` con el `Pago` marcado como anulado
- **AND** las cuotas previamente afectadas tienen `SaldoPagado` y `Estado` revertidos

### Requirement: PagosRules centraliza validaciones de negocio de pagos
El sistema SHALL exponer las reglas de validación de pagos como métodos estáticos en `PagosRules`. Ningún otro archivo SHALL duplicar estas condiciones.

#### Scenario: PagosRules.PrestamoAceptaPagos
- **WHEN** se invoca `PagosRules.PrestamoAceptaPagos(estado)`
- **THEN** retorna `false` si el estado es `"completado"`, `"cerrado_pronto_pago"` o `"refinanciado"`
- **AND** retorna `true` para cualquier otro estado
