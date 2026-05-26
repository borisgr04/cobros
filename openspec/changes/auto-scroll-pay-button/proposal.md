## Why

Cuando se registra un pago de un préstamo, el botón para enviar comprobante por WhatsApp queda fuera del viewport en la parte inferior y el usuario debe hacer scroll manual para verlo. Esto genera fricción en un flujo crítico y puede ocultar la acción siguiente esperada.

## What Changes

- Ajustar el flujo posterior al registro de pago para desplazar automáticamente la vista hasta la zona de acciones finales del comprobante.
- Garantizar que el botón de enviar a WhatsApp quede visible automáticamente al finalizar el pago, sin requerir interacción adicional del usuario.
- Preservar el comportamiento actual en dispositivos donde el botón ya está visible, evitando saltos de scroll innecesarios.

## Capabilities

### New Capabilities
- `pago-postregistro-cta-visible`: Asegura visibilidad automática de la acción de WhatsApp después de registrar un pago.

### Modified Capabilities
- Ninguna.

## Impact

- Frontend en el flujo de registro de pago de préstamo (pantalla/modal y render de acciones posteriores).
- Experiencia de usuario móvil en el paso de confirmación posterior al pago.
- Sin cambios en APIs backend ni contratos de datos.
