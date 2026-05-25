## Why

El flujo de autenticación biométrica (Face ID / huella) está roto en su etapa más crítica: cuando el usuario intenta entrar con biometría desde la pantalla de login, el backend recibe `{ email }` pero espera `{ credentialIds }`, por lo que siempre devuelve una lista vacía de credenciales permitidas y el browser no puede resolver la autenticación. Adicionalmente, el frontend nunca almacena los `credentialId` localmente tras el registro, lo que hace imposible construir la solicitud correcta. El registro en sí puede funcionar (si el rpId está bien configurado), pero la autenticación nunca puede completarse.

## What Changes

- **Backend**: Cambiar `WebAuthnAuthBeginRequestDto` para aceptar `Email` (opcional) además de `CredentialIds`. Si `CredentialIds` está vacío y viene un `Email`, el endpoint busca las credenciales del usuario por email en la base de datos.
- **Frontend**: Al completar el registro biométrico, guardar el `credentialId` en `localStorage` (lista por dispositivo). Al iniciar autenticación, leer los IDs locales y enviarlos al backend en lugar del email.
- **Frontend**: Mantener el email como fallback para el caso en que los IDs locales se hayan perdido (usuario borró localStorage o cambió de dispositivo).

## Capabilities

### New Capabilities

- `biometric-auth-by-email`: El backend puede resolver credenciales biométricas a partir del email del usuario, como mecanismo de fallback cuando el cliente no tiene IDs en local storage.

### Modified Capabilities

- `registro-pago`: _(no aplica)_

## Impact

- `backend/CobrosApi/DTOs/Dtos.cs` — `WebAuthnAuthBeginRequestDto`: agregar campo `Email`
- `backend/CobrosApi/Controllers/AuthController.cs` — `WebAuthnAuthBegin`: lógica de lookup por email
- `cobros-iu/src/app/features/auth/services/biometric-auth.service.ts` — guardar y leer `credentialIds` de localStorage
- No hay cambios de base de datos ni migraciones
- No hay breaking changes en la API existente (se agrega campo opcional)
