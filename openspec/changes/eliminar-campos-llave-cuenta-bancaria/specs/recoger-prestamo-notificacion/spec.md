## MODIFIED Requirements

### Requirement: URL de consulta pública en notificación de recoger préstamo
La URL de consulta pública compartida por WhatsApp SHALL construirse usando exclusivamente `prestamo.cliente.id` como identificador. Ya no se usa `prestamo.cliente.llave` ni ningún fallback.

#### Scenario: Generación de URL de consulta sin campo llave
- **WHEN** el sistema genera la URL de consulta pública para un cliente
- **THEN** la URL SHALL tener la forma `{baseUrl}/consulta/{cliente.id}` donde `cliente.id` es el id numérico del cliente

#### Scenario: Ruta Angular de consulta pública
- **WHEN** el router de Angular resuelve la URL de consulta
- **THEN** el parámetro de ruta SHALL llamarse `:id` (no `:llave`)

## REMOVED Requirements

### Requirement: Uso de llave como identificador alternativo de consulta
**Reason**: El campo `llave` nunca fue poblado en producción. El id numérico es el único identificador real del cliente.
**Migration**: Usar `cliente.id` directamente. Todos los links existentes que ya usaban el id numérico seguirán funcionando.
