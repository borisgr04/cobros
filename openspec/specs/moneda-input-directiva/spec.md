### Requirement: Directiva appMoneda para inputs de dinero
El sistema SHALL proveer una directiva Angular standalone `appMoneda` que transforme cualquier `<input>` en un campo con formato de moneda colombiana (COP), formateando el valor **en tiempo real** mientras el usuario escribe, y alternando entre número puro al enfocar y valor formateado al salir del foco.

#### Scenario: Input muestra formato en tiempo real
- **WHEN** el usuario ingresa o edita un valor numérico en un input con `appMoneda`
- **THEN** el campo muestra el valor formateado en COP en tiempo real (ej. `$ 1.500.000`)
- **AND** el signal del componente recibe el número puro (ej. `1500000`)

#### Scenario: Input muestra número puro al enfocar
- **WHEN** el usuario hace foco en un input con `appMoneda`
- **THEN** el campo muestra el número puro sin formato (ej. `1500000`) para facilitar edición
- **AND** el teclado numérico del dispositivo se activa (`inputmode="numeric"`)

#### Scenario: Parsing de valor con formato colombiano pegado
- **WHEN** el usuario pega un valor con formato colombiano (ej. `$ 1.500.000`) en el input
- **THEN** el sistema extrae el número puro (`1500000`) y lo muestra formateado en tiempo real
- **AND** el signal del componente recibe el número correcto

#### Scenario: Campo vacío o cero
- **WHEN** el campo queda vacío o con valor cero
- **THEN** el input muestra el placeholder (no muestra `$ 0`)
- **AND** el signal del componente recibe `0`

#### Scenario: Aplicación en múltiples componentes
- **WHEN** la directiva se aplica en `registro-prestamo-modal`, `edicion-prestamo-modal` y `registro-pago-modal`
- **THEN** todos los campos de dinero exhiben el mismo comportamiento de formato
- **AND** cada componente recibe el valor numérico limpio en su signal correspondiente
