## Context

La aplicación tiene soporte completo de WebAuthn/FIDO2 tanto en backend (`/api/auth/webauthn/*`) como en frontend (`BiometricAuthService`, `BiometricRegistrationComponent`). El registro de credenciales ya funciona en `/perfil`, pero ese punto de entrada es desconocido para usuarios nuevos. El login biométrico intenta autenticar contra el backend con el email del usuario, y falla si no existen credenciales registradas para ese email, devolviendo un error genérico que confunde al usuario.

**Problema central:** Falta el puente entre "iniciar sesión con Google por primera vez" y "activar autenticación biométrica". El componente y el servicio ya existen; lo que falta es el flujo de descubrimiento.

## Goals / Non-Goals

**Goals:**
- Mostrar un prompt post-login que invite a activar biometría cuando el dispositivo es compatible y el usuario no tiene credenciales registradas.
- Guiar al usuario al registro antes de intentar login biométrico (prevenir el error de "no credentials found").
- Mantener el prompt dismissable y no intrusivo.

**Non-Goals:**
- No rediseñar el flujo de registro biométrico (ya existe en `/perfil`).
- No añadir registro inline en la pantalla de login.
- No cambiar el backend.
- No forzar el registro biométrico (es opcional).

## Decisions

### 1. Banner en HomeComponent en lugar de modal global

**Decisión:** Mostrar el banner de activación en el `HomeComponent` (ruta `/`) como una sección prominente en la parte superior, condicionada a: (a) biometría disponible en el dispositivo, (b) usuario sin credenciales registradas, (c) usuario no lo haya descartado.

**Alternativas consideradas:**
- *Modal inmediato al login*: Más intrusivo; interrumpe la navegación natural hacia la app.
- *Notificación global en `AppComponent`*: Requiere más lógica de estado global y acopla el componente raíz al servicio biométrico.
- *Notificación en `PerfilComponent`*: El usuario necesita llegar al perfil antes de verlo — no soluciona el descubrimiento.

**Rationale:** El home es la primera pantalla post-login; un banner no modal permite al usuario ignorarlo sin bloquear su flujo.

### 2. Persistencia del dismiss en localStorage

**Decisión:** Al hacer clic en "Ahora no", guardar en `localStorage` la clave `biometric_prompt_dismissed` con valor `true`. No tiene expiración; el usuario puede volver a activarlo desde `/perfil`.

**Alternativas consideradas:**
- *sessionStorage*: Mostraría el banner en cada inicio de sesión, lo que puede volverse molesto.
- *Flag en el servidor*: Requiere cambios de backend y una propiedad extra en el perfil de usuario.

### 3. Detección de credenciales sin credenciales como estado inicial

**Decisión:** `BiometricAuthService.loadCredentials()` ya existe. El `HomeComponent` llamará a `loadCredentials()` al iniciar (solo si el dispositivo soporta biometría) y mostrará el banner si `credentials()` está vacío.

### 4. Mensaje de orientación en LoginComponent para biometría sin registro

**Decisión:** En `LoginComponent.loginWithBiometrics()`, antes de llamar a `authenticateBegin`, verificar si `credentials()` tiene elementos. Si está vacío (la lista aún no fue cargada o está vacía), mostrar el mensaje "Para usar biometría, primero debes activarla desde tu perfil" en lugar de lanzar el flujo WebAuthn que fallará.

**Rationale:** Previene el error en la fuente; guía al usuario con información accionable.

## Risks / Trade-offs

- **[Risk] `loadCredentials()` requiere autenticación** → En `LoginComponent` el usuario no está logueado, por lo que no se puede consultar la lista de credenciales pre-login. **Mitigación:** Usar `localStorage` para cachear si el usuario alguna vez tuvo credenciales registradas (bandera `biometric_registered`), seteada al registrar con éxito desde el perfil.
- **[Risk] `localStorage` puede estar desactualizado** si el usuario borra credenciales desde otro dispositivo → El flujo seguirá intentando y fallará con error WebAuthn. Esto es aceptable ya que la solución mejora el caso más común (primer registro) sin empeorar el existente.
- **[Risk] El banner en `HomeComponent` puede hacer una petición HTTP innecesaria** al cargar la app → Solo se ejecuta si `isPlatformAuthenticatorAvailable()` devuelve `true` y el dismiss no está activo.
