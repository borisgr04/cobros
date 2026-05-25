## ADDED Requirements

### Requirement: El backend resuelve credenciales biométricas por email
Cuando el cliente no tiene IDs de credencial almacenados localmente, el endpoint `POST /api/auth/webauthn/authenticate/begin` SHALL aceptar un campo `email` y buscar las credenciales WebAuthn registradas para ese usuario.

#### Scenario: Cliente envía email sin credentialIds
- **WHEN** el cliente llama a `POST /api/auth/webauthn/authenticate/begin` con `{ "email": "user@example.com", "credentialIds": [] }`
- **THEN** el servidor busca todas las credenciales del usuario con ese email
- **AND** retorna `PublicKeyCredentialRequestOptions` con `allowCredentials` poblado con las credenciales encontradas

#### Scenario: Email no existe o no tiene credenciales registradas
- **WHEN** el cliente envía un email que no tiene credenciales WebAuthn en la BD
- **THEN** el servidor retorna `PublicKeyCredentialRequestOptions` con `allowCredentials: []`
- **AND** responde con HTTP 200 (no revela si el email existe)

#### Scenario: Se envían credentialIds explícitos (comportamiento actual preservado)
- **WHEN** el cliente envía `credentialIds` no vacíos
- **THEN** el servidor usa esos IDs directamente sin consultar por email
- **AND** el campo `email` es ignorado

### Requirement: El frontend persiste los credentialIds en localStorage
Tras completar el registro biométrico, el frontend SHALL almacenar el `credentialId` de la credencial recién creada en `localStorage` bajo la clave `biometric_credential_ids` como array JSON.

#### Scenario: Registro biométrico exitoso
- **WHEN** `registerComplete` finaliza sin error
- **THEN** el `credential.id` se agrega al array en `localStorage['biometric_credential_ids']`
- **AND** no se duplican IDs si el mismo ID ya existe en la lista

#### Scenario: Primera vez registrando en el dispositivo
- **WHEN** no existe `biometric_credential_ids` en localStorage
- **THEN** se crea la clave con un array que contiene el nuevo ID

### Requirement: El frontend prioriza IDs locales al autenticar
Al iniciar el flujo de autenticación biométrica, el frontend SHALL usar los `credentialIds` almacenados en localStorage si existen, y solo usar el email como fallback si la lista local está vacía.

#### Scenario: Hay IDs almacenados localmente
- **WHEN** `localStorage['biometric_credential_ids']` contiene al menos un ID
- **THEN** se envían esos IDs al endpoint `authenticate/begin`
- **AND** no se envía el email en el body

#### Scenario: No hay IDs locales (fallback por email)
- **WHEN** `localStorage['biometric_credential_ids']` está vacío o no existe
- **THEN** se envía `{ email, credentialIds: [] }` al endpoint
- **AND** el backend resuelve las credenciales por email

### Requirement: Al eliminar una credencial, se limpia localStorage
Cuando el usuario elimina una credencial biométrica desde la pantalla de perfil, el frontend SHALL remover el ID correspondiente de `localStorage['biometric_credential_ids']`.

#### Scenario: Eliminación de credencial existente
- **WHEN** el usuario elimina una credencial desde el componente de registro biométrico
- **THEN** `biometric.deleteCredential(id)` remueve el ID del array en localStorage
- **AND** si el array queda vacío, la clave se elimina de localStorage
