## 1. Backend — DTO y lookup por email

- [x] 1.1 Agregar campo `public string? Email { get; set; }` a `WebAuthnAuthBeginRequestDto` en `DTOs/Dtos.cs`
- [x] 1.2 En `AuthController.WebAuthnAuthBegin`: si `request.CredentialIds` está vacío y `request.Email` tiene valor, hacer `db.WebAuthnCredentials.Include(c => c.Usuario).Where(c => c.Usuario!.Email == request.Email)` y usar los resultados para construir `allowedCredentials`

## 2. Frontend — Persistir credentialIds en localStorage

- [x] 2.1 En `BiometricAuthService`, agregar método `getStoredCredentialIds(): string[]` que lee y parsea `localStorage['biometric_credential_ids']`
- [x] 2.2 Agregar método `addCredentialId(id: string): void` que agrega un ID al array en localStorage (sin duplicar)
- [x] 2.3 Agregar método `removeCredentialId(id: string): void` que elimina un ID del array; si queda vacío, elimina la clave de localStorage
- [x] 2.4 En `registerComplete()`, después de la llamada HTTP exitosa, llamar a `addCredentialId(credential.id)`

## 3. Frontend — Usar IDs locales al autenticar

- [x] 3.1 En `authenticateBegin(email)`, leer `getStoredCredentialIds()` antes de la llamada HTTP
- [x] 3.2 Si hay IDs locales, enviar `{ credentialIds: [...] }` (sin email)
- [x] 3.3 Si no hay IDs locales, enviar `{ email, credentialIds: [] }` como fallback

## 4. Frontend — Limpiar localStorage al eliminar credencial

- [x] 4.1 En `deleteCredential(id)`, después de la llamada HTTP exitosa, llamar a `removeCredentialId(id)`

## 5. Validación

- [x] 5.1 Probar registro biométrico desde perfil: verificar que `biometric_credential_ids` aparece en localStorage con el ID correcto
- [x] 5.2 Probar login biométrico inmediatamente después del registro (IDs en localStorage): debe funcionar sin pedir email
- [x] 5.3 Limpiar localStorage manualmente y probar login biométrico con fallback por email: debe funcionar (diseño cambiado — fallback por email eliminado; botón desactivado si no hay IDs locales)
- [x] 5.4 Eliminar credencial desde perfil y verificar que el ID se remueve de localStorage
