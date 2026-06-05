### Requirement: Formulario de registro de préstamos con entrada directa de valores
El sistema SHALL proveer un formulario de registro de préstamos donde el usuario ingresa los valores que conoce: valor prestado, valor del interés, valor de la cuota, fecha de inicio y frecuencia de pago. El sistema deriva la cantidad de períodos y la fecha final como valores calculados. La cantidad de períodos NO es un campo de entrada.

#### Scenario: Sistema deriva cantidad de cuotas desde los valores ingresados
- **WHEN** el usuario ingresa valor prestado, valor interés y valor cuota (todos > 0)
- **THEN** el sistema calcula `cantidadCuotas = ceil(valorTotal / valorCuota)`
- **AND** muestra la cantidad de períodos como resultado, no como campo editable

#### Scenario: Fecha final derivada de fecha inicio, frecuencia y cantidad calculada
- **WHEN** el usuario ha ingresado fecha de inicio, seleccionado frecuencia y el sistema ha calculado la cantidad
- **THEN** el sistema calcula `fechaFinal = fechaInicio + (cantidadCuotas × periodicidad)`
- **AND** la fecha final se muestra como valor derivado, no como campo editable

#### Scenario: Advertencia cuando el total no divide exacto en la cuota
- **WHEN** `valorTotal % valorCuota ≠ 0`
- **THEN** el sistema muestra una advertencia indicando que el último pago tendrá un valor diferente
- **AND** muestra el monto exacto del último pago: `valorTotal - (cantidadCuotas - 1) × valorCuota`
- **AND** permite al usuario registrar el préstamo sin corregir (es su decisión)

#### Scenario: División exacta sin advertencia
- **WHEN** `valorTotal % valorCuota = 0`
- **THEN** el sistema muestra el resultado sin advertencia: "N pagos de $X"

#### Scenario: Fecha de inicio predeterminada al día actual
- **WHEN** el usuario abre el modal de registro de préstamo
- **THEN** el campo fecha de inicio muestra la fecha de hoy por defecto
- **AND** el usuario puede modificarla si lo necesita

#### Scenario: Frecuencia de pago agrupada con fecha de inicio
- **WHEN** el usuario visualiza el formulario de registro de préstamo
- **THEN** la frecuencia de pago aparece en la misma sección que la fecha de inicio
- **AND** el usuario selecciona la frecuencia antes de ver el resultado de cuotas derivado

#### Scenario: Validación de coherencia de valores
- **WHEN** el usuario intenta guardar el préstamo
- **THEN** el sistema valida que valor prestado > 0, valor interés >= 0, valor cuota > 0 y valor cuota ≤ valor total
- **AND** muestra un error descriptivo si algún campo obligatorio está incompleto o inválido

### Requirement: URL de consulta pública en modal de registro de préstamo
La URL de consulta pública generada al crear un préstamo SHALL construirse usando exclusivamente `cliente.id` como identificador.

#### Scenario: Generación de URL de consulta en registro de préstamo
- **WHEN** se registra un préstamo y el modal genera la URL de consulta del cliente
- **THEN** la URL SHALL tener la forma `{baseUrl}/consulta/{cliente.id}`
