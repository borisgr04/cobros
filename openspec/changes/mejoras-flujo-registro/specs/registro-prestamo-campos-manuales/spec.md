## ADDED Requirements

### Requirement: Formulario de registro de préstamos con entrada directa de valores
El sistema SHALL proveer un formulario de registro de préstamos donde el usuario ingresa directamente los valores que conoce: valor prestado, valor del interés, valor de la cuota, fecha de inicio y cantidad de períodos. El sistema calcula el valor total y la fecha final como valores derivados.

#### Scenario: Usuario ingresa los campos directos y el sistema deriva el total
- **WHEN** el usuario completa los campos: valor prestado, valor interés, valor cuota, fecha inicio y cantidad de períodos
- **THEN** el sistema calcula automáticamente `valorTotal = valorPrestado + valorInteres`
- **AND** el sistema calcula `fechaFinal = fechaInicio + (cantidad × periodicidad)`
- **AND** el número de cuotas del préstamo queda igual a la cantidad ingresada

#### Scenario: Fecha de inicio predeterminada al día actual
- **WHEN** el usuario abre el modal de registro de préstamo
- **THEN** el campo fecha de inicio muestra la fecha de hoy por defecto
- **AND** el usuario puede modificarla si lo necesita

#### Scenario: Resumen calculado visible antes de guardar
- **WHEN** el usuario ha completado todos los campos obligatorios
- **THEN** el formulario muestra el valor total calculado y la fecha final derivada
- **AND** el usuario puede revisar los valores antes de confirmar el registro

#### Scenario: Validación de coherencia de valores
- **WHEN** el usuario intenta guardar el préstamo
- **THEN** el sistema valida que valor prestado > 0, valor interés >= 0, valor cuota > 0, cantidad > 0
- **AND** muestra un error descriptivo si algún campo obligatorio está incompleto o inválido
