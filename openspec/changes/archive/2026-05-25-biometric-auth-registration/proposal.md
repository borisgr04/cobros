## Why

El flujo de autenticación biométrica (Face ID / huella dactilar) falla cuando un usuario intenta usarlo sin haber registrado previamente sus credenciales WebAuthn. El componente `BiometricRegistrationComponent` existe y está accesible solo desde `/perfil`, pero no hay ningún punto de entrada visible post-login que invite al usuario a activar esta autenticación. Como resultado, el botón "Entrar con Face ID / Huella" en el login produce un error para usuarios que nunca han registrado su dispositivo, sin explicación de qué deben hacer primero.

## What Changes

- Añadir un **banner/prompt de activación biométrica** que aparezca en la pantalla principal (`/`) inmediatamente después de un login exitoso con Google, si el dispositivo soporta biometría y el usuario aún no tiene credenciales registradas.
- El banner ofrecerá un botón "Activar Face ID / Huella" que navega a `/perfil` (donde ya existe el componente de registro).
- El usuario podrá descartar el banner ("Ahora no") y la decisión se recordará en `localStorage` para no mostrarlo de nuevo en esa sesión.
- En la pantalla de login, si el usuario pulsa el botón biométrico pero no tiene credenciales registradas, mostrar un mensaje de orientación ("Primero debes activar la biometría desde tu perfil") en lugar de un error genérico.

## Capabilities

### New Capabilities

- `biometric-activation-prompt`: Banner post-login que invita al usuario a registrar su dispositivo biométrico tras autenticarse con Google, con opción de navegar al perfil o descartar.

### Modified Capabilities

- `infraestructura`: El `LoginComponent` maneja el caso de no-credenciales registradas para biometría mostrando orientación en lugar de error.

## Impact

- **Frontend**: `LoginComponent`, `HomeComponent` (o componente que envuelva la ruta `/`), `BiometricAuthService` (nuevo método para saber si hay credenciales registradas), `AppRoutes` (sin cambios de rutas).
- **Backend**: Sin cambios. El endpoint `GET /api/auth/webauthn/credentials` ya existe y retorna la lista de credenciales.
- **UX**: Mejora el descubrimiento de la funcionalidad biométrica y elimina el error de usuario al intentar login sin registro previo.
