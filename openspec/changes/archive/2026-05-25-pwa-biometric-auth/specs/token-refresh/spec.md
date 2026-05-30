## ADDED Requirements

### Requirement: Emisión de refresh token en login
El backend SHALL emitir un refresh token opaco junto al access token JWT en cada login exitoso (Google, dev-login o biometría).

#### Scenario: Login exitoso retorna refresh token en cookie
- **WHEN** un usuario se autentica exitosamente por cualquier método
- **THEN** el backend retorna el access token JWT en el body de la respuesta
- **AND** establece una cookie HttpOnly `cobros_refresh` con el refresh token
- **AND** la cookie tiene atributos `Secure`, `SameSite=Strict`, y expiración configurable (default 7 días)

#### Scenario: Refresh token se persiste en base de datos
- **WHEN** se genera un refresh token
- **THEN** el backend almacena un hash SHA-256 del token en la tabla `RefreshTokens` con `UsuarioId`, `Expires`, y `Revoked = false`

### Requirement: Renovación silenciosa del access token
El frontend SHALL renovar el access token automáticamente antes de que expire, sin interrumpir al usuario.

#### Scenario: Interceptor detecta token próximo a vencer
- **WHEN** el interceptor HTTP procesa un request saliente
- **AND** el access token expira en 5 minutos o menos
- **THEN** el interceptor llama a `POST /api/auth/refresh` antes de despachar el request original
- **AND** el request original se despacha con el nuevo access token

#### Scenario: Múltiples requests simultáneos con token próximo a vencer
- **WHEN** varios requests se despachan al mismo tiempo con token próximo a vencer
- **THEN** solo se realiza un único request de refresh
- **AND** todos los requests pendientes esperan el resultado y se reenvían con el nuevo token

#### Scenario: Refresh token exitoso
- **WHEN** el backend recibe `POST /api/auth/refresh` con una cookie `cobros_refresh` válida
- **THEN** invalida el refresh token usado (rotación)
- **AND** retorna un nuevo access token JWT en el body
- **AND** establece una nueva cookie `cobros_refresh` con el nuevo refresh token

#### Scenario: Refresh token inválido o expirado
- **WHEN** el backend recibe `POST /api/auth/refresh` con cookie ausente, inválida o expirada
- **THEN** retorna HTTP 401
- **AND** el frontend llama a `logout()` y redirige al usuario a `/login`

### Requirement: Revocación de sesión en logout
El backend SHALL invalidar el refresh token activo cuando el usuario hace logout.

#### Scenario: Logout revoca el refresh token
- **WHEN** el usuario llama a `POST /api/auth/logout`
- **THEN** el backend marca el refresh token de la cookie como `Revoked = true`
- **AND** limpia la cookie `cobros_refresh`
- **AND** el frontend limpia el access token en memoria y redirige a `/login`

### Requirement: Access token almacenado en memoria (no localStorage)
El frontend SHALL almacenar el access token solo en memoria (Angular signal) para reducir la superficie de ataque XSS.

#### Scenario: Recarga de página restaura sesión via refresh
- **WHEN** el usuario recarga la página y no hay access token en memoria
- **THEN** el frontend intenta `POST /api/auth/refresh` automáticamente al inicializar
- **AND** si tiene éxito, restaura la sesión sin mostrar pantalla de login
- **AND** si falla, redirige a `/login`

#### Scenario: Datos de usuario persisten en localStorage solo para UX
- **WHEN** se almacena la sesión
- **THEN** solo `cobros_user` (nombre, email, foto) se persiste en localStorage para mostrar datos inmediatamente
- **AND** el access token JWT NO se escribe en localStorage ni sessionStorage
