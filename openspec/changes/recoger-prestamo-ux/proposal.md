## Why

El modal "Recoger Préstamo" acumula cinco problemas de UX detectados en uso real: el selector de frecuencia usa un `<select>` mientras el resto del flujo usa segmented buttons; el mensaje de advertencia en la confirmación se muestra encogido; el estado de cuota muestra "Ampliada" cuando el término correcto en dominio es "Recogida"; los links al nuevo préstamo y al préstamo original no navegan porque el componente reutiliza el mismo DOM sin reinicializar; y falta la notificación WhatsApp que sí tienen los otros modales de acción.

## What Changes

- **Frecuencia**: `<select>` reemplazado por segmented buttons idénticos a los de `registro-prestamo-modal`.
- **Advertencia**: corrección CSS del bloque `.advertencia-reemplazo` para que se muestre sin encogerse en el modal.
- **Label estado cuota**: "Ampliada" → "Recogida" en `prestamo-detalle.component.html` (solo texto visible; el valor de BD `"reemplazada_por_ampliacion"` no cambia).
- **Link a nuevo préstamo** (#8): `prestamo-detalle.component.ts` suscribe a `route.paramMap` (observable) en lugar de leer `snapshot`, para que el componente se recargue al navegar entre préstamos.
- **Link al préstamo original** (#9): mismo fix, misma causa raíz.
- **WhatsApp al recoger**: pantalla de resultado muestra botón "Notificar por WhatsApp" con mensaje que incluye nombre, total a cobrar, cuotas y fecha final del nuevo préstamo.

## Capabilities

### New Capabilities
- `recoger-prestamo-notificacion`: Al completar el flujo de recoger préstamo, el sistema muestra un botón para notificar al cliente por WhatsApp con los detalles del nuevo préstamo.

### Modified Capabilities

## Impact

- `cobros-iu/src/app/features/prestamos/components/recoger-prestamo-modal/recoger-prestamo-modal.component.html` — frecuencia + warning + WhatsApp en resultado
- `cobros-iu/src/app/features/prestamos/components/recoger-prestamo-modal/recoger-prestamo-modal.component.ts` — array `frecuencias`, `seleccionarFrecuencia()`, `whatsappLink` computed, `DomSanitizer`
- `cobros-iu/src/app/features/prestamos/components/recoger-prestamo-modal/recoger-prestamo-modal.component.scss` — segmented control styles, fix advertencia
- `cobros-iu/src/app/features/prestamos/components/prestamo-detalle.component.html` — label "Ampliada" → "Recogida"
- `cobros-iu/src/app/features/prestamos/components/prestamo-detalle.component.ts` — `ngOnInit` suscribe a `route.paramMap` (observable)
