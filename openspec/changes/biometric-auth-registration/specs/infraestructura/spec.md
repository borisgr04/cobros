## ADDED Requirements

### Requirement: Flag de biometría registrada en localStorage
El sistema SHALL persistir en `localStorage` un flag `biometric_registered` cuando el usuario registre exitosamente una credencial biométrica desde el componente de registro, para que la pantalla de login pueda determinar si es apropiado lanzar el flujo WebAuthn.

#### Scenario: Establecer flag tras registro exitoso
- **WHEN** el usuario completa exitosamente el registro de una credencial WebAuthn desde `BiometricRegistrationComponent`
- **THEN** el sistema almacena `biometric_registered = "true"` en `localStorage`

#### Scenario: No alterar el flag si el registro falla
- **WHEN** el registro de credencial WebAuthn falla (error de autenticador, timeout, etc.)
- **THEN** el sistema NO modifica el valor de `biometric_registered` en `localStorage`
