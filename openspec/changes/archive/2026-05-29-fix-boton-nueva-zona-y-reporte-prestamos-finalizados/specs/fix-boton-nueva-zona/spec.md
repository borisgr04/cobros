## ADDED Requirements

### Requirement: Botón "nueva zona" siempre visible y alineado
El sistema SHALL asegurar que el botón "nueva zona" permanezca dentro del card y correctamente alineado en todas las resoluciones de pantalla.

#### Scenario: Pantalla de tamaño reducido
- **WHEN** el usuario reduce el tamaño de la ventana o accede desde un dispositivo móvil
- **THEN** el botón "nueva zona" permanece dentro del card y no se desborda visualmente

#### Scenario: Pantalla de tamaño normal o grande
- **WHEN** el usuario accede desde una pantalla de tamaño normal o grande
- **THEN** el botón "nueva zona" se muestra correctamente alineado dentro del card
