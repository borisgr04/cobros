## ADDED Requirements

### Requirement: Acción inmediata de crear préstamo tras crear cliente
Después de crear un cliente con éxito, el sistema SHALL ofrecer acción directa para crear préstamo al mismo cliente.

#### Scenario: Éxito de creación de cliente muestra CTA
- **WHEN** el usuario finaliza el registro de cliente exitosamente
- **THEN** la UI presenta botón "Crear préstamo"
- **AND** al seleccionarlo abre el flujo de préstamo con cliente preseleccionado
