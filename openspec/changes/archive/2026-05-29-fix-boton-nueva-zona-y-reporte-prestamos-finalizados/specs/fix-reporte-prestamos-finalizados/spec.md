## ADDED Requirements

### Requirement: Reporte de préstamos finalizados muestra datos correctos
El sistema SHALL mostrar todos los préstamos finalizados en el reporte correspondiente, asegurando que los datos sean precisos y estén actualizados.

#### Scenario: Existen préstamos finalizados
- **WHEN** existen préstamos con estado "finalizado" en el sistema
- **THEN** el reporte de préstamos finalizados muestra todos esos préstamos con sus datos completos

#### Scenario: No existen préstamos finalizados
- **WHEN** no existen préstamos con estado "finalizado"
- **THEN** el reporte indica que no hay datos disponibles
