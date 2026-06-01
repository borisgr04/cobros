## ADDED Requirements

### Requirement: Formulario de préstamo puede ser invocado con contexto de refinanciación
El sistema SHALL permitir que el formulario de registro de préstamo reciba opcionalmente un contexto de refinanciación que pre-carga `saldoTrasladado` y `prestamoOrigenId`. Cuando este contexto está presente, los campos de capital se pre-calculan y el formulario muestra un aviso de que se trata de un préstamo refinanciado.

#### Scenario: Capital pre-cargado desde refinanciación
- **WHEN** el formulario se abre con `prestamoOrigenId` y `saldoTrasladado` en el contexto
- **THEN** el campo "Valor prestado" se pre-llena con `saldoTrasladado + dineroAdicional`
- **AND** el campo "Valor prestado" es de solo lectura en este modo

#### Scenario: Aviso de modo refinanciación visible
- **WHEN** el formulario está en modo refinanciación
- **THEN** muestra el aviso: "Este préstamo absorbe el saldo del préstamo #N"
- **AND** el campo "Saldo trasladado" se muestra como informativo (no editable)

#### Scenario: Modo independiente no afectado
- **WHEN** el formulario se abre sin contexto de refinanciación
- **THEN** el comportamiento es idéntico al actual: todos los campos libres sin restricciones de modo
