## ADDED Requirements

### Requirement: Generación automática de llave pública de cliente
El sistema SHALL generar automáticamente una llave pública única de consulta para cada cliente nuevo cuando el registro se crea sin llave provista por el usuario.

#### Scenario: Alta de cliente sin llave manual
- **WHEN** se crea un cliente desde la UI sin enviar campo `llave`
- **THEN** el backend genera una llave pública única
- **AND** la llave queda persistida y disponible para consulta pública

#### Scenario: Unicidad de llave
- **WHEN** el sistema intenta persistir una llave generada
- **THEN** valida que no exista previamente
- **AND** en caso de colisión genera una nueva llave antes de confirmar el alta
