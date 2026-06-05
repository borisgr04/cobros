## MODIFIED Requirements

### Requirement: URL de consulta pública en notificación de pronto pago
La URL de consulta pública compartida por WhatsApp SHALL construirse usando exclusivamente `prestamo.cliente.id`. Ya no se usa `prestamo.cliente.llave` ni ningún fallback.

#### Scenario: Generación de URL de consulta sin campo llave
- **WHEN** el sistema genera la URL de consulta pública para el cliente de un préstamo con pronto pago
- **THEN** la URL SHALL tener la forma `{baseUrl}/consulta/{cliente.id}`

## REMOVED Requirements

### Requirement: Uso de llave como identificador en URL de pronto pago
**Reason**: El campo `llave` del modelo `ICliente` se elimina del dominio.
**Migration**: Usar `cliente.id` directamente.
