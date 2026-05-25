## 1. Backend – Refresh Token

- [ ] 1.1 Agregar modelo `RefreshToken` en `Models/RefreshToken.cs` con campos `Id (Guid)`, `UsuarioId`, `TokenHash`, `Expires`, `Revoked`, `CreatedAt`, `ReplacedByTokenHash`
- [ ] 1.2 Registrar `DbSet<RefreshToken>` en `CobrosDbContext` y crear migración EF Core `AddRefreshTokens`
- [ ] 1.3 Actualizar `TokenService.GenerateToken` para que también genere y persista un refresh token opaco, devolviendo `(accessToken, expires, refreshToken)`
- [ ] 1.4 Actualizar `AuthController.GoogleLogin` y `AuthController.DevLogin` para escribir el refresh token en cookie HttpOnly `cobros_refresh` (Secure, SameSite=Strict, expiración configurable)
- [ ] 1.5 Implementar `POST /api/auth/refresh`: valida cookie, rota el refresh token (invalida el anterior, emite uno nuevo), retorna nuevo JWT en body + nueva cookie
- [ ] 1.6 Implementar `POST /api/auth/logout`: marca refresh token como revocado, limpia la cookie `cobros_refresh`
- [ ] 1.7 Configurar CORS en `Program.cs` para permitir credenciales (`AllowCredentials`) con el origen del frontend

## 2. Backend – WebAuthn / Biometría

- [ ] 2.1 Agregar `Fido2NetLib` al proyecto `CobrosApi.csproj` (`dotnet add package Fido2NetLib`)
- [ ] 2.2 Registrar `IFido2` en `Program.cs` con la configuración del servidor (origin, rpId)
- [ ] 2.3 Agregar modelo `WebAuthnCredential` en `Models/WebAuthnCredential.cs` con `Id`, `UsuarioId`, `CredentialId (byte[])`, `PublicKey (byte[])`, `SignCount`, `CreatedAt`, `LastUsedAt`, `DeviceName`
- [ ] 2.4 Registrar `DbSet<WebAuthnCredential>` en `CobrosDbContext` y crear migración `AddWebAuthnCredentials`
- [ ] 2.5 Implementar `POST /api/auth/webauthn/register/begin`: genera `PublicKeyCredentialCreationOptions`, almacena challenge en caché distribuida (IDistributedCache) con TTL 2 min
- [ ] 2.6 Implementar `POST /api/auth/webauthn/register/complete`: valida respuesta con Fido2NetLib, persiste `WebAuthnCredential`
- [ ] 2.7 Implementar `POST /api/auth/webauthn/authenticate/begin`: genera `PublicKeyCredentialRequestOptions` con las credenciales del usuario/dispositivo, almacena challenge
- [ ] 2.8 Implementar `POST /api/auth/webauthn/authenticate/complete`: verifica aserción, incrementa `SignCount`, retorna JWT + refresh token cookie igual que Google login
- [ ] 2.9 Implementar `GET /api/auth/webauthn/credentials`: lista credenciales del usuario autenticado (id, deviceName, lastUsedAt)
- [ ] 2.10 Implementar `DELETE /api/auth/webauthn/credentials/{id}`: elimina una credencial del usuario autenticado
- [ ] 2.11 Agregar tests de integración para los endpoints WebAuthn en `CobrosApi.Tests/Controllers/WebAuthnTests.cs`

## 3. Frontend – Refresh Token Silencioso

- [ ] 3.1 Actualizar `AuthService`: almacenar access token en signal de memoria (eliminar `localStorage.setItem(TOKEN_KEY, ...)`) y exponer signal `tokenExpira`
- [ ] 3.2 Agregar método `AuthService.silentRefresh()`: llama a `POST /api/auth/refresh` (con `withCredentials: true`), actualiza token en memoria; si falla, llama a `logout()`
- [ ] 3.3 Agregar método `AuthService.initSession()`: llamado al arrancar la app; intenta refresh silencioso si no hay token en memoria; si falla, limpia sesión
- [ ] 3.4 Actualizar `auth.interceptor.ts`: antes de despachar un request, verificar si el token expira en ≤5 min; si sí, llamar `silentRefresh()` primero; serializar múltiples refreshes concurrentes con `BehaviorSubject`
- [ ] 3.5 Actualizar `APP_INITIALIZER` en `app.config.ts` para llamar `AuthService.initSession()` al arrancar
- [ ] 3.6 Actualizar `AuthService.logout()` para llamar a `POST /api/auth/logout` con `withCredentials: true`

## 4. Frontend – PWA

- [ ] 4.1 Ejecutar `ng add @angular/pwa` en el directorio `cobros-iu` para generar `manifest.webmanifest`, `ngsw-config.json` e íconos base
- [ ] 4.2 Personalizar `manifest.webmanifest`: `name: "Cobros"`, `short_name: "Cobros"`, colores de tema acordes a la UI actual, `display: standalone`
- [ ] 4.3 Agregar íconos PNG 192x192 y 512x512 en `public/icons/` referenciados en el manifest
- [ ] 4.4 Configurar `ngsw-config.json`: estrategia `prefetch` para assets, `freshness` para llamadas API (excluir `/api/` del caché de datos)
- [ ] 4.5 Agregar meta tags en `index.html`: `apple-touch-icon`, `apple-mobile-web-app-capable`, `theme-color`
- [ ] 4.6 Verificar que el service worker NO se registra en modo `ng serve` (comportamiento default de @angular/pwa)

## 5. Frontend – Autenticación Biométrica

- [ ] 5.1 Crear `BiometricAuthService` en `features/auth/services/biometric-auth.service.ts` con métodos: `isSupported()`, `getStoredCredentialIds()`, `register(userId)`, `authenticate()`
- [ ] 5.2 Implementar `BiometricAuthService.register()`: llama a begin/complete endpoints, invoca `navigator.credentials.create()`, almacena `credentialId` en localStorage para este dispositivo
- [ ] 5.3 Implementar `BiometricAuthService.authenticate()`: llama a begin/complete endpoints, invoca `navigator.credentials.get()`, retorna el JWT recibido
- [ ] 5.4 Actualizar `LoginComponent`: mostrar botón "Entrar con Face ID / Huella" si `BiometricAuthService.isSupported()` y existen credenciales locales; manejar éxito/error del flujo biométrico
- [ ] 5.5 Crear componente `BiometricRegistrationComponent` en `features/auth/components/`: lista credenciales existentes, botón "Registrar este dispositivo", botón eliminar por credencial
- [ ] 5.6 Integrar `BiometricRegistrationComponent` en la pantalla de perfil/usuario existente

## 6. Validación y Ajustes Finales

- [ ] 6.1 Ejecutar build de producción Angular (`ng build`) y verificar que el service worker se genera correctamente
- [ ] 6.2 Ejecutar `dotnet build` y verificar que todas las migraciones están aplicadas
- [ ] 6.3 Probar flujo completo de refresh silencioso: login → esperar expiración cercana → verificar que no hay redirección al login
- [ ] 6.4 Probar flujo WebAuthn en Chrome (Android o desktop con Windows Hello) y Safari (iOS)
- [ ] 6.5 Ejecutar tests de integración del backend (`dotnet test`)
- [ ] 6.6 Documentar las variables de configuración nuevas en `README.md`: `Jwt:RefreshTokenExpiryDays`, CORS origin, Fido2 rpId/origin
