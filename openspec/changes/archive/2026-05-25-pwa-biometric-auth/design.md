## Context

La app actualmente emite un JWT de corta vida (30 min) almacenado en localStorage. Cuando expira, el primer request falla con 401 y el interceptor llama a `auth.logout()`, forzando navegación a `/login`. No hay refresh token ni verificación proactiva. La autenticación es exclusivamente por Google OAuth. No hay configuración PWA ni WebAuthn.

## Goals / Non-Goals

**Goals:**
- Eliminar la experiencia de "bloqueo" cuando el JWT expira mediante renovación silenciosa proactiva.
- Convertir la app en PWA instalable en Android/iOS.
- Permitir autenticación con biometría nativa del dispositivo (Face ID, huella) usando WebAuthn/FIDO2.
- Mantener compatibilidad con el login Google existente.

**Non-Goals:**
- Soporte offline completo (cache de datos de negocio).
- Eliminar el login con Google; sigue siendo el método principal para nuevos dispositivos.
- Gestión de múltiples credenciales WebAuthn por usuario desde la UI admin (solo registro y uso).

## Decisions

### 1. Refresh token con rotación (refresh token rotation)

**Decisión**: El backend emite un refresh token opaco (UUID) de larga duración (7–30 días) almacenado en la BD (`RefreshTokens` table). En cada uso, el token se invalida y se emite uno nuevo (rotación). El refresh token se envía en una cookie HttpOnly + Secure para no exponerlo a JS.

**Alternativas descartadas**:
- *Long-lived JWT*: no se puede invalidar individualmente si se compromete.
- *Solo extender duración del access token*: aumenta la ventana de ataque si se filtra.

**Flujo**:
1. Login (Google o biometría) → backend retorna `{ token, expira }` en body + `refreshToken` en cookie HttpOnly.
2. El frontend almacena `token` y `expira` en memoria/signal (no localStorage para el access token – mejora seguridad; solo el refresh queda en cookie).
3. Un interceptor revisa `expira`: si faltan ≤5 min, llama a `POST /api/auth/refresh` antes de despachar el request original (solo un refresh simultáneo con un `BehaviorSubject`).
4. Si el refresh falla (cookie expirada o revocada), `logout()` limpio.

> **Nota de migración**: El access token pasa de localStorage a memoria en la misma sesión; al recargar página el interceptor detecta que no hay token y llama inmediatamente al refresh antes de redirigir a login. Se mantiene `cobros_user` en localStorage solo para mostrar nombre/foto sin requerir request adicional.

### 2. PWA con @angular/pwa

**Decisión**: Usar el schematic oficial `ng add @angular/pwa` que genera `ngsw-config.json`, `manifest.webmanifest`, registra el `ServiceWorkerModule` y configura `angular.json`. Estrategia de cache: `prefetch` para assets estáticos, `freshness` para API (no bloquea la UX con respuestas cacheadas de datos de negocio).

**Alternativas descartadas**:
- *Workbox manual*: más flexible pero innecesariamente complejo dado que @angular/pwa cubre el caso de uso.

### 3. WebAuthn con librería Fido2NetLib en el backend

**Decisión**: Usar el paquete NuGet `Fido2NetLib` que implementa la especificación FIDO2/WebAuthn completa. En el frontend, usar la Web Authentication API nativa del navegador (`navigator.credentials.create/get`) sin librerías adicionales.

**Alternativas descartadas**:
- *Implementar CBOR manualmente*: propenso a errores y no vale la pena dado que Fido2NetLib está mantenido activamente.
- *Passkeys via proveedor externo (Auth0, Firebase)*: introduce dependencia de tercero y coste.

**Modelos nuevos en BD**:
- `WebAuthnCredential`: `{ Id, UsuarioId, CredentialId (byte[]), PublicKey (byte[]), SignCount, CreatedAt, LastUsedAt, DeviceName? }`
- Tabla `RefreshTokens`: `{ Id (UUID), UsuarioId, Token (string hash), Expires, Revoked, CreatedAt, ReplacedByToken? }`

### 4. El access token sigue siendo JWT (sin cambio de formato)

**Decisión**: El payload y la validación JWT del backend no cambian. Solo se agrega el endpoint `/api/auth/refresh` y el mecanismo de cookie.

## Risks / Trade-offs

- **Cookies HttpOnly en CORS**: La API y el frontend deben estar en el mismo dominio o configurar `SameSite=None; Secure` + CORS con `AllowCredentials`. → Mitigación: documentar configuración CORS y revisar en deploy.
- **WebAuthn requiere HTTPS**: En desarrollo local se puede usar `localhost` (excepción de WebAuthn) pero staging/prod deben tener certificado válido. → Mitigación: agregar validación en el servicio que deshabilita la opción si `window.isSecureContext === false`.
- **Soporte de plataforma WebAuthn**: iOS Safari ≥ 14, Android Chrome ≥ 67. Dispositivos antiguos no lo soportarán. → Mitigación: ocultar la opción si `PublicKeyCredential` no está disponible y mostrar fallback a Google.
- **Complejidad de refresh con múltiples tabs**: Si dos tabs refrescan simultáneamente, el segundo refresh fallará (token ya rotado). → Mitigación: usar un `BehaviorSubject` compartido en `AuthService` que serialice los refreshes; si el segundo detecta que el token ya fue actualizado, usa el nuevo directamente.
- **Fido2NetLib dependency**: Agrega ~500 KB a la build del backend y una dependencia de tercero. → Riesgo bajo; el paquete está activo y es estándar en el ecosistema .NET.

## Migration Plan

1. Deploy backend con los nuevos endpoints (refresh, WebAuthn) y tablas nuevas (migraciones aditivas).
2. Deploy frontend con PWA + refresh silencioso; usuarios existentes con token en localStorage siguen funcionando hasta que expire; el próximo login ya usa el nuevo flujo con cookie.
3. Usuarios pueden optar por registrar biometría desde la pantalla de perfil post-login.

**Rollback**: Los endpoints nuevos son aditivos. Si hay problemas, se puede reverter el frontend a la versión anterior sin afectar el backend legacy; las tablas nuevas quedan vacías sin impacto.

## Open Questions

- ¿Cuántos días debe durar el refresh token? (sugerencia: 7 días inactivo, 30 días máximo)
- ¿Se permitirá registrar múltiples dispositivos biométricos por usuario? (sugerencia: sí, hasta 5)
- ¿El nombre del dispositivo en `WebAuthnCredential.DeviceName` lo ingresa el usuario o se detecta automáticamente del User-Agent?
