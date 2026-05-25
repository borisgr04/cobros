## 1. BiometricAuthService: flag localStorage

- [ ] 1.1 Añadir método `markAsRegistered()` en `BiometricAuthService` que almacena `biometric_registered = "true"` en `localStorage`
- [ ] 1.2 Añadir método `hasRegisteredLocally(): boolean` en `BiometricAuthService` que lee la clave `biometric_registered` de `localStorage`

## 2. BiometricRegistrationComponent: persistir flag tras registro exitoso

- [ ] 2.1 Llamar a `biometric.markAsRegistered()` dentro del bloque `try` de `register()`, después de que `registerComplete` y `loadCredentials` terminen exitosamente

## 3. LoginComponent: orientación para biometría sin registro

- [ ] 3.1 En `loginWithBiometrics()`, verificar `biometric.hasRegisteredLocally()` antes de lanzar `authenticateBegin`
- [ ] 3.2 Si el flag no existe, mostrar mensaje "Para usar biometría, primero debes activarla desde tu perfil tras iniciar sesión" en `error()` y retornar sin lanzar el flujo WebAuthn

## 4. HomeComponent: banner de activación post-login

- [ ] 4.1 Inyectar `BiometricAuthService` y `Router` en `HomeComponent`
- [ ] 4.2 En `ngOnInit` del `HomeComponent`, si `isPlatformAuthenticatorAvailable()` devuelve `true` y `localStorage.getItem('biometric_prompt_dismissed')` es falsy, llamar a `loadCredentials()` y exponer señal `showBiometricPrompt`
- [ ] 4.3 Añadir al template de `HomeComponent` un banner condicional `@if (showBiometricPrompt())` con mensaje, botón "Activar" (navega a `/perfil`) y botón "Ahora no"
- [ ] 4.4 Implementar `dismissBiometricPrompt()` que setea `biometric_prompt_dismissed` en `localStorage` y oculta el banner
- [ ] 4.5 Añadir estilos mínimos al banner (alert Bootstrap con ícono de huella)
