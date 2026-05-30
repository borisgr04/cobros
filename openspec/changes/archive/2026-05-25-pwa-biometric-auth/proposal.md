## Why

El token JWT se vence rápido (30 min por defecto) y la app no reacciona hasta que el usuario intenta hacer una operación y recibe un 401, causando una mala experiencia: la interfaz se congela o responde lentamente antes de redirigir al login. Adicionalmente, la autenticación con Google obliga al usuario a pasar por un flujo web cada vez, mientras que los dispositivos móviles modernos ofrecen Face ID y huella dactilar como alternativa más rápida y cómoda.

## What Changes

- **Token proactivo**: El frontend verifica la expiración del JWT antes de hacer requests y solicita un refresh silencioso cuando el token está próximo a vencer, eliminando los 401 inesperados.
- **Refresh token**: El backend emite un refresh token de larga duración junto al access token; un nuevo endpoint `/api/auth/refresh` permite renovar sesiones sin re-autenticar con Google.
- **PWA**: La app Angular se convierte en Progressive Web App instalable, con `manifest.webmanifest`, service worker (`@angular/pwa`) y soporte offline básico.
- **Autenticación biométrica (WebAuthn/FIDO2)**: Los usuarios pueden registrar su dispositivo (Face ID, huella) y autenticarse con él en lugar de Google. El backend agrega endpoints para registro y verificación de credenciales WebAuthn.

## Capabilities

### New Capabilities

- `token-refresh`: Emisión de refresh tokens en el backend y renovación silenciosa en el frontend antes de que el access token expire.
- `pwa-manifest`: Configuración PWA (manifest, service worker, íconos) para que la app sea instalable en dispositivos móviles.
- `biometric-auth`: Registro y autenticación con WebAuthn (Face ID / huella dactilar) como método alternativo al login con Google.

### Modified Capabilities

- `arquitectura`: Agrega refresh token al flujo de autenticación y WebAuthn como provider de identidad alternativo, sin cambiar el stack tecnológico base.

## Impact

- **Frontend**: `AuthService`, `auth.interceptor.ts`, `login.component.ts`, `app.config.ts`, `angular.json` (PWA), nuevos componentes de biometría.
- **Backend**: `TokenService`, `AuthController` (nuevo endpoint `/api/auth/refresh`, nuevos endpoints WebAuthn), nuevo modelo `RefreshToken` y `WebAuthnCredential` con migraciones EF Core.
- **Dependencias nuevas**: `@angular/pwa` (frontend), `Fido2NetLib` o implementación manual CBOR (backend).
- **Infraestructura**: El servidor debe estar en HTTPS (obligatorio para WebAuthn).
