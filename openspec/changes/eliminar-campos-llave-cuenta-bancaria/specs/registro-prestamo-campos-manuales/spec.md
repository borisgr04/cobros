## MODIFIED Requirements

### Requirement: URL de consulta pública en modal de registro de préstamo
La URL de consulta pública generada al crear un préstamo SHALL construirse usando exclusivamente `cliente.id`. Ya no se usa `cliente.llave` ni ningún fallback.

#### Scenario: Generación de URL de consulta en registro de préstamo
- **WHEN** se registra un préstamo y el modal genera la URL de consulta del cliente
- **THEN** la URL SHALL tener la forma `{baseUrl}/consulta/{cliente.id}`

## REMOVED Requirements

### Requirement: Uso de llave como identificador en URL de registro de préstamo
**Reason**: El campo `llave` del modelo `ICliente` se elimina del dominio.
**Migration**: Usar `cliente.id` directamente.
