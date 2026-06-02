## Why

Tres puntos de fricción en la interfaz detectados en uso real: la zona navega a préstamos cuando debe navegar a clientes, el modal de pronto pago tiene un input con estilo inconsistente frente a registrar pago, y tras el pronto pago no hay botón de notificación por WhatsApp como sí tiene registrar pago.

## What Changes

- **Zonas**: el click en una card navega a `/clientes?zona=X` (era `/prestamos?zona=X`); se elimina el botón redundante "Ver Clientes" dentro de la card.
- **ProntoPago — input**: el campo "Valor negociado" adopta el mismo wrapper (`monto-libre-row` + botón clear) que usa `registro-pago-modal`.
- **ProntoPago — WhatsApp**: en la pantalla de éxito del pronto pago se añade el botón "Notificar al cliente por WhatsApp", igual al de `registro-pago-modal`.

## Capabilities

### New Capabilities
- `pronto-pago-notificacion`: El modal de pronto pago debe notificar al cliente por WhatsApp tras ejecutar la liquidación, igual que hace `registro-pago-modal`.

### Modified Capabilities
- `bottom-navigation`: La navegación desde la card de zona pasa a dirigirse a la lista de clientes filtrada por zona, no a préstamos.

## Impact

- `cobros-iu/src/app/features/zonas/components/zonas.component.html` — 2 cambios (click card + eliminar botón)
- `cobros-iu/src/app/features/zonas/components/zonas.component.ts` — título del card corregido
- `cobros-iu/src/app/features/prestamos/components/pronto-pago-modal/pronto-pago-modal.component.html` — wrapper input + sección WhatsApp en éxito
- `cobros-iu/src/app/features/prestamos/components/pronto-pago-modal/pronto-pago-modal.component.ts` — `whatsappLink` computed + `DomSanitizer`
- `cobros-iu/src/app/features/prestamos/components/pronto-pago-modal/pronto-pago-modal.component.scss` — estilos `.monto-libre-row` y `.btn-whatsapp`
