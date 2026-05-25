## Context

El flujo actual tiene una desconexión entre frontend y backend en el paso `authenticate/begin`:

- El frontend envía `{ email: "..." }` al endpoint
- El backend deserializa `WebAuthnAuthBeginRequestDto` que solo tiene `CredentialIds: List<string>`
- El email es ignorado → `allowedCredentials` siempre es lista vacía
- El browser, sin saber qué clave usar, lanza un "discoverable credential picker" o falla silenciosamente dependiendo del dispositivo

Además, tras el registro, el frontend guarda solo un boolean (`biometric_registered = 'true'`) en localStorage pero nunca el `credentialId`. Sin él, el cliente no puede construir la lista de credenciales para el challenge.

## Goals / Non-Goals

**Goals:**
- El usuario puede autenticarse con biometría desde la pantalla de login sin tener que ingresar nada más que su email
- El `credentialId` se persiste localmente para que el flujo funcione sin depender del lookup por email
- El backend soporta lookup por email como fallback robusto
- Sin breaking changes: clientes que ya envíen `credentialIds` siguen funcionando igual

**Non-Goals:**
- Soporte multi-dispositivo sincronizado (si el usuario registra en el teléfono, no aparece en otro dispositivo automáticamente)
- Passkeys cross-device (iCloud Keychain, Google Password Manager) — requiere configuración adicional de rpId y está fuera de scope
- Eliminar el flag `biometric_registered` de localStorage (se mantiene por compatibilidad)

## Decisions

### Decisión 1: Agregar `Email` como campo opcional en `WebAuthnAuthBeginRequestDto`

**Elección**: Extender el DTO existente con `public string? Email { get; set; }` y en el endpoint, si `CredentialIds` está vacío y `Email` tiene valor, hacer un `db.WebAuthnCredentials.Where(c => c.Usuario.Email == email)`.

**Alternativa descartada**: Crear un endpoint separado `/authenticate/begin-by-email`. Agrega complejidad sin beneficio; un solo endpoint flexible es más simple.

**Alternativa descartada**: Hacer que el frontend solo use localStorage. Si el usuario borra datos del navegador o cambia de dispositivo, queda sin forma de recuperar el flujo. El email como fallback es necesario.

### Decisión 2: Guardar `credentialId` en localStorage al registrar

**Elección**: Al completar `registerComplete`, extraer `credential.id` (que es la representación base64url del `rawId`) y guardarlo en `localStorage` como array JSON bajo la clave `biometric_credential_ids`.

**Formato**: `localStorage['biometric_credential_ids'] = JSON.stringify(["abc123...", "xyz456..."])` — array para soportar múltiples registros del mismo dispositivo.

**Alternativa descartada**: Guardar solo el más reciente. Un usuario podría registrar el mismo dispositivo varias veces (si borró la clave anterior). Guardar todos los IDs es más seguro.

### Decisión 3: Prioridad en el flujo de authenticate

```
┌─────────────────────────────────────────────────────────┐
│  authenticateBegin(email)                               │
│                                                         │
│  1. Leer localStorage['biometric_credential_ids']       │
│     ┌─ IDs encontrados → enviar { credentialIds: [...] }│
│     └─ No hay IDs → enviar { email, credentialIds: [] } │
│                                                         │
│  Backend:                                               │
│  1. Si credentialIds no vacío → usarlos directamente    │
│  2. Si vacío y email presente → lookup en BD por email  │
│  3. Si ninguno → retornar options con allowCredentials  │
│     vacío (browser pedirá authenticator genérico)       │
└─────────────────────────────────────────────────────────┘
```

### Decisión 4: Limpieza de IDs al eliminar credencial

Cuando el usuario elimina una credencial desde el perfil, el frontend debe también remover el ID correspondiente de localStorage para mantener consistencia.

## Risks / Trade-offs

- **[Riesgo] Enumeración de emails**: El endpoint `authenticate/begin` responde con credenciales si el email existe. Un atacante podría saber si un email tiene biometría registrada. → **Mitigación**: El endpoint no confirma existencia del email; si no hay credenciales simplemente devuelve `allowCredentials: []` sin error ni diferencia de timing observable.

- **[Riesgo] localStorage en iOS Safari en modo privado**: En modo privado, localStorage tiene límites y puede estar deshabilitado. → **Mitigación**: El fallback por email cubre este caso.

- **[Riesgo] credentialIds en localStorage se desincroniza si se eliminan credenciales desde otro dispositivo**: → **Mitigación**: Si el ID ya no existe en BD, el backend simplemente lo ignora; el browser lo descartará también.

## Migration Plan

1. Desplegar cambio de backend primero (es retrocompatible — campo nuevo opcional)
2. Desplegar cambio de frontend
3. No requiere migración de datos ni limpieza de localStorage existente
4. Rollback: revertir backend a versión anterior sin efecto en frontend (el campo extra es ignorado)

## Open Questions

- ¿Deberíamos mostrar un mensaje diferente en login cuando el dispositivo tiene biometría disponible pero no tiene IDs en localStorage? Actualmente el botón aparece igual. Podría ser útil mostrar "Configura biometría en tu perfil" si no hay IDs pero el dispositivo soporta WebAuthn.
