## MODIFIED Requirements

### Requirement: Selector de frecuencia con segmented buttons
En el formulario de recoger préstamo, la frecuencia de pago SHALL seleccionarse mediante botones segmentados (diario / semanal / quincenal / mensual), idénticos a los del modal de registro de préstamo.

#### Scenario: Selección de frecuencia con botones
- **WHEN** el usuario abre el formulario de recoger préstamo
- **THEN** el campo de frecuencia muestra 4 botones: Diario, Semanal, Quincenal, Mensual
- **AND** el botón activo se diferencia visualmente del resto
- **AND** al tocar un botón la frecuencia queda seleccionada
- **AND** la frecuencia está agrupada visualmente junto al campo valor de cuota y fecha de inicio en la sección "Condiciones del nuevo préstamo"
