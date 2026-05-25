## ADDED Requirements

### Requirement: Registro de credencial biométrica
El sistema SHALL permitir a un usuario autenticado registrar su dispositivo biométrico (Face ID, huella dactilar) para uso futuro.

#### Scenario: Usuario registra biometría por primera vez
- **WHEN** el usuario navega a su perfil y selecciona "Registrar biometría"
- **AND** el dispositivo soporta WebAuthn (`PublicKeyCredential` disponible en el navegador)
- **THEN** el frontend solicita `POST /api/auth/webauthn/register/begin` y obtiene las opciones de creación
- **AND** invoca `navigator.credentials.create()` con esas opciones
- **AND** el navegador solicita autenticación biométrica al usuario
- **AND** al confirmar, el frontend envía la respuesta a `POST /api/auth/webauthn/register/complete`
- **AND** el backend guarda la credencial en `WebAuthnCredentials` asociada al usuario
- **AND** se muestra confirmación "Biometría registrada correctamente"

#### Scenario: Dispositivo no soporta WebAuthn
- **WHEN** el usuario navega a su perfil en un dispositivo sin soporte WebAuthn
- **THEN** la opción "Registrar biometría" no se muestra

#### Scenario: Usuario cancela el registro biométrico
- **WHEN** el sistema del dispositivo solicita biometría durante el registro
- **AND** el usuario cancela o falla la autenticación
- **THEN** el registro falla sin guardar credenciales
- **AND** se muestra el mensaje "Registro cancelado"

### Requirement: Autenticación con biometría en el login
El sistema SHALL permitir autenticarse usando una credencial biométrica previamente registrada.

#### Scenario: Login con biometría disponible
- **WHEN** el usuario abre la pantalla de login
- **AND** existe una credencial WebAuthn registrada para ese dispositivo
- **THEN** se muestra el botón "Entrar con Face ID / Huella"

#### Scenario: Autenticación biométrica exitosa
- **WHEN** el usuario pulsa "Entrar con Face ID / Huella"
- **THEN** el frontend solicita `POST /api/auth/webauthn/authenticate/begin` (con identificador de credencial del dispositivo)
- **AND** invoca `navigator.credentials.get()` con las opciones recibidas
- **AND** el dispositivo solicita y verifica la biometría del usuario
- **AND** el frontend envía la aserción a `POST /api/auth/webauthn/authenticate/complete`
- **AND** el backend verifica la firma, incrementa `SignCount` y retorna un JWT + refresh token
- **AND** el usuario queda autenticado y es redirigido al inicio

#### Scenario: Credencial biométrica inválida o revocada
- **WHEN** el backend no puede verificar la aserción WebAuthn
- **THEN** retorna HTTP 401
- **AND** el frontend muestra "No se pudo verificar la biometría. Intenta con Google."

#### Scenario: Autenticación biométrica sin red
- **WHEN** el usuario intenta autenticarse con biometría sin conexión a internet
- **THEN** la verificación del backend falla con error de red
- **AND** el frontend muestra "Sin conexión. Por favor conéctate para iniciar sesión."

### Requirement: Gestión de credenciales biométricas
El sistema SHALL permitir al usuario ver y eliminar sus credenciales biométricas registradas.

#### Scenario: Usuario ve sus dispositivos registrados
- **WHEN** el usuario navega a su perfil
- **THEN** ve una lista de credenciales biométricas registradas con nombre de dispositivo y fecha de último uso

#### Scenario: Usuario elimina una credencial biométrica
- **WHEN** el usuario selecciona "Eliminar" en una credencial de la lista
- **THEN** el frontend llama a `DELETE /api/auth/webauthn/credentials/{id}`
- **AND** la credencial se elimina de la BD
- **AND** el dispositivo ya no puede autenticarse con biometría hasta registrarse nuevamente

### Requirement: Endpoints WebAuthn en el backend
El backend SHALL exponer los endpoints WebAuthn necesarios para el flujo FIDO2.

#### Scenario: Endpoint begin registration genera opciones válidas
- **WHEN** `POST /api/auth/webauthn/register/begin` recibe un request autenticado
- **THEN** retorna `PublicKeyCredentialCreationOptions` compatibles con WebAuthn Level 2
- **AND** almacena el challenge en caché temporal (máximo 2 minutos)

#### Scenario: Endpoint complete registration valida y persiste
- **WHEN** `POST /api/auth/webauthn/register/complete` recibe la respuesta del authenticator
- **THEN** valida la firma y el challenge usando Fido2NetLib
- **AND** persiste `CredentialId`, `PublicKey`, `SignCount` en `WebAuthnCredentials`

#### Scenario: Endpoint begin authentication genera challenge
- **WHEN** `POST /api/auth/webauthn/authenticate/begin` recibe identificadores de credenciales del dispositivo
- **THEN** retorna `PublicKeyCredentialRequestOptions` con las credenciales permitidas para ese usuario/dispositivo

#### Scenario: Endpoint complete authentication verifica firma
- **WHEN** `POST /api/auth/webauthn/authenticate/complete` recibe la aserción
- **THEN** valida firma y anti-replay con `SignCount`
- **AND** si es válida, retorna JWT + establece refresh token cookie igual que el login Google
