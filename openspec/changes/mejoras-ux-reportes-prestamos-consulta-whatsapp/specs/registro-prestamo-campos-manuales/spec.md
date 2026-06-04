## ADDED Requirements

### Requirement: Estado exitoso de registro de préstamo sin acciones duplicadas
La pantalla de éxito de registro de préstamo SHALL mostrar una sola acción principal de cierre.

#### Scenario: Éxito sin doble botón cerrar
- **WHEN** el usuario registra un préstamo y llega al estado exitoso
- **THEN** visualiza únicamente un botón "Cerrar"
- **AND** no existe duplicidad de la misma acción en body y footer simultáneamente
