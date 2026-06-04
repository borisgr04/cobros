## ADDED Requirements

### Requirement: Tarjeta de cliente separa préstamos activos y cerrados
La tarjeta/contexto de cliente SHALL priorizar préstamos activos y ofrecer acceso separado al historial de cerrados.

#### Scenario: Vista principal sin préstamos cerrados
- **WHEN** el usuario visualiza préstamos del cliente en la tarjeta principal
- **THEN** solo aparecen préstamos activos
- **AND** los cerrados quedan fuera de la lista principal

#### Scenario: Acceso a historial cerrado desde CTA
- **WHEN** el usuario usa la acción para ver historial cerrado
- **THEN** el sistema muestra préstamos cerrados en vista dedicada o expandible
- **AND** mantiene navegación de retorno al contexto activo
