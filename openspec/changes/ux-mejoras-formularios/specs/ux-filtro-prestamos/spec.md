## MODIFIED Requirements

### Requirement: Filtro de cliente activo tras crear un préstamo
Tras registrar un nuevo préstamo exitosamente, el sistema SHALL establecer automáticamente el filtro de cliente al cliente del préstamo recién creado, mostrando únicamente sus préstamos en la lista.

#### Scenario: Filtro se establece al cliente del préstamo creado
- **WHEN** se crea un préstamo exitosamente para cualquier cliente
- **THEN** el filtro de cliente se establece al cliente de ese préstamo
- **AND** la lista muestra únicamente los préstamos de ese cliente
- **AND** el chip de filtro activo muestra el nombre del cliente

#### Scenario: Limpiar filtro de cliente
- **WHEN** el usuario hace clic en "×" del chip de filtro
- **THEN** el filtro se elimina y la lista muestra todos los préstamos
- **AND** el chip desaparece
