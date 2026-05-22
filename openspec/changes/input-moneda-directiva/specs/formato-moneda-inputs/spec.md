## MODIFIED Requirements

### Requirement: Formato de moneda en campos numéricos del modal de préstamo
El sistema SHALL mostrar el valor de los campos Valor Prestado y Valor Total formateado en pesos colombianos **dentro del propio campo** en tiempo real mientras el usuario escribe, usando el formato `$ 1.500.000`. Al enfocar, el campo muestra el número puro para facilitar la digitación. Este comportamiento se implementa mediante la directiva `appMoneda`.

#### Scenario: Formato dentro del input en tiempo real
- **WHEN** el usuario ingresa o edita un número en el campo Valor Prestado o Valor Total
- **THEN** el campo muestra el valor formateado en COP dentro del mismo input (ej. `$ 1.500.000`) en tiempo real
- **AND** no aparece ningún texto de preview separado debajo del campo

#### Scenario: Número puro al editar
- **WHEN** el usuario hace foco en el campo Valor Prestado o Valor Total
- **THEN** el campo muestra el número puro (ej. `1500000`) para facilitar la edición

#### Scenario: Campo vacío o cero
- **WHEN** el campo está vacío o contiene cero
- **THEN** el input muestra el placeholder, no `$ 0`
