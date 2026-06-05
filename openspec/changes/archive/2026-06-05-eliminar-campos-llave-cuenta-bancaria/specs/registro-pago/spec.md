## MODIFIED Requirements

### Requirement: URL de consulta pública en notificación de registro de pago
La URL de consulta pública compartida al registrar un pago SHALL construirse usando exclusivamente `prestamo.cliente.id`. Ya no se usa `prestamo.cliente.llave` ni ningún fallback.

#### Scenario: Generación de URL de consulta en registro de pago
- **WHEN** se registra un pago y se genera la URL de consulta para compartir
- **THEN** la URL SHALL tener la forma `{baseUrl}/consulta/{cliente.id}`

## REMOVED Requirements

### Requirement: Uso de llave como identificador en URL de registro de pago
**Reason**: El campo `llave` del modelo `ICliente` se elimina del dominio.
**Migration**: Usar `cliente.id` directamente.
