## ADDED Requirements

### Requirement: Mensajes de WhatsApp incluyen enlace de consulta pública
Toda plantilla de mensaje WhatsApp relacionada con préstamos/clientes SHALL incluir enlace de consulta pública cuando exista llave/ruta disponible.

#### Scenario: Mensaje con llave disponible
- **WHEN** el sistema genera mensaje WhatsApp para cliente con llave de consulta
- **THEN** el texto incluye URL de consulta pública
- **AND** la URL permite abrir el estado de préstamos del cliente

#### Scenario: Mensaje sin llave disponible
- **WHEN** el sistema genera mensaje WhatsApp y no existe llave/ruta de consulta
- **THEN** mantiene mensaje base sin enlace
- **AND** no falla la generación del mensaje
