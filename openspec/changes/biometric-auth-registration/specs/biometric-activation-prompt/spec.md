## ADDED Requirements

### Requirement: Banner de activación biométrica post-login
Tras un login exitoso, si el dispositivo soporta autenticación biométrica (WebAuthn platform authenticator) y el usuario no tiene credenciales registradas ni ha descartado el prompt, el sistema SHALL mostrar un banner en la pantalla principal invitando a activar Face ID / huella.

#### Scenario: Mostrar banner al usuario sin credenciales registradas
- **WHEN** el usuario inicia sesión con Google exitosamente
- **AND** el dispositivo tiene soporte de autenticador de plataforma (Face ID / huella)
- **AND** el usuario no tiene credenciales WebAuthn registradas
- **AND** el usuario no ha descartado el banner previamente
- **THEN** el sistema muestra un banner en la pantalla principal con el texto "Activa Face ID / Huella"
- **AND** el banner incluye un botón "Activar" que navega a `/perfil`
- **AND** el banner incluye un botón "Ahora no" para descartarlo

#### Scenario: No mostrar banner si el dispositivo no soporta biometría
- **WHEN** el usuario inicia sesión exitosamente
- **AND** el dispositivo NO tiene soporte de autenticador de plataforma
- **THEN** el sistema NO muestra el banner de activación

#### Scenario: No mostrar banner si el usuario ya tiene credenciales
- **WHEN** el usuario inicia sesión exitosamente
- **AND** el usuario ya tiene al menos una credencial WebAuthn registrada
- **THEN** el sistema NO muestra el banner de activación

#### Scenario: Descartar el banner
- **WHEN** el usuario hace clic en "Ahora no"
- **THEN** el banner se oculta inmediatamente
- **AND** el sistema persiste la decisión en `localStorage` con clave `biometric_prompt_dismissed`
- **AND** el banner NO vuelve a mostrarse en sesiones futuras desde el mismo dispositivo

### Requirement: Orientación en login para biometría sin registro previo
Cuando el usuario intenta autenticarse con biometría desde la pantalla de login pero el sistema detecta que no tiene credenciales registradas en el dispositivo, el sistema SHALL mostrar un mensaje de orientación en lugar de un error genérico.

#### Scenario: Login biométrico sin credenciales registradas (dispositivo conocido)
- **WHEN** el usuario pulsa "Entrar con Face ID / Huella" en la pantalla de login
- **AND** el flag `biometric_registered` NO existe en `localStorage`
- **THEN** el sistema muestra el mensaje "Para usar biometría, primero debes activarla desde tu perfil tras iniciar sesión"
- **AND** el sistema NO lanza el flujo WebAuthn
- **AND** el botón permanece visible para reintento

#### Scenario: Login biométrico cuando el dispositivo sí tiene registro previo
- **WHEN** el usuario pulsa "Entrar con Face ID / Huella"
- **AND** el flag `biometric_registered` existe en `localStorage`
- **THEN** el sistema lanza el flujo WebAuthn normalmente
