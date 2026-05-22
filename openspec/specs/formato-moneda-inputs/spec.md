### Requirement: Formato de moneda en campos numéricos del modal de préstamo
El sistema SHALL mostrar una previsualización formateada en pesos colombianos debajo de los campos Valor Prestado y Valor Total mientras el usuario escribe, usando el formato `$1.500.000`.

#### Scenario: Preview de moneda al escribir valor
- **WHEN** el usuario escribe un número en el campo Valor Prestado o Valor Total
- **THEN** aparece debajo del campo un texto con el valor formateado en COP (ej. `$1.500.000`)
- **AND** el campo de entrada sigue aceptando el número puro para el binding

#### Scenario: Campo vacío o cero
- **WHEN** el campo está vacío o contiene cero
- **THEN** no se muestra ningún preview de moneda
