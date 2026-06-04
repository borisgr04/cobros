## ADDED Requirements

### Requirement: Consulta pública con detalle expandible de pagos
La consulta pública SHALL permitir expandir cada préstamo para visualizar su historial de pagos.

#### Scenario: Usuario amplía detalle de préstamo
- **WHEN** el usuario hace click en "Detalle" de un préstamo en consulta pública
- **THEN** el sistema muestra un listado de pagos asociados a ese préstamo
- **AND** cada pago incluye al menos fecha y valor

#### Scenario: Préstamo sin pagos registrados
- **WHEN** el usuario amplía un préstamo que no tiene pagos
- **THEN** el sistema muestra estado vacío informativo
- **AND** no presenta error de interfaz
