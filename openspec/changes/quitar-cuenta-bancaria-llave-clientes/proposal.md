## Why

El formulario de clientes pide actualmente `cuentaBancaria` y `llave`, pero para la operación diaria estos datos no aportan valor en el alta y generan fricción de captura. Se busca simplificar el registro y reducir errores de digitación sin perder la capacidad de consulta pública.

## What Changes

- Eliminar del formulario de creación/edición de cliente los campos visibles `cuentaBancaria` y `llave`.
- Mantener la capacidad de consulta pública mediante una clave interna generada por sistema (no capturada manualmente por el usuario).
- Ajustar validaciones y UX del formulario para que el alta de cliente no dependa de esos campos.
- Limpiar etiquetas, placeholders y documentación de IU relacionadas con esos campos.

## Capabilities

### New Capabilities
- `cliente-clave-publica-automatica`: Generación automática de clave pública de consulta para clientes sin entrada manual.

### Modified Capabilities
- `creacion-cliente-inline`: El formulario deja de solicitar `cuentaBancaria` y `llave` al usuario.

## Impact

- Frontend clientes (formulario, bindings, validación y mensajes).
- Backend de clientes (contratos de entrada/salida si hoy exponen esos campos en alta/edición).
- Flujo de consulta pública (`/consulta/:llave`) para asegurar continuidad con clave generada internamente.
- Pruebas de UI y API del alta/edición de cliente.
