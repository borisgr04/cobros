## 1. Fix navegación entre préstamos (paramMap)

- [x] 1.1 En `prestamo-detalle.component.ts`: importar `takeUntilDestroyed` de `@angular/core/rxjs-interop` y `DestroyRef`
- [x] 1.2 En `prestamo-detalle.component.ts`: reemplazar la lectura de `snapshot.paramMap` por suscripción al observable `this.route.paramMap` con `takeUntilDestroyed()` para recargar datos cuando cambia el ID en la URL

## 2. Label "Recogida" en detalle de préstamo

- [x] 2.1 En `prestamo-detalle.component.html` (línea ~405): cambiar el texto del badge de estado `reemplazada_por_ampliacion` de "Ampliada" a "Recogida"

## 3. Frecuencia — segmented buttons en RecogerPrestamo

- [x] 3.1 En `recoger-prestamo-modal.component.ts`: agregar array `frecuencias` (igual que en `registro-prestamo-modal`) y método `seleccionarFrecuencia(value)`
- [x] 3.2 En `recoger-prestamo-modal.component.html`: reemplazar el `<select>` de frecuencia por el bloque `<div class="frecuencia-segmented">` con `@for (frec of frecuencias; track frec.value)`
- [x] 3.3 En `recoger-prestamo-modal.component.scss`: agregar estilos `.frecuencia-segmented` y `.frecuencia-seg-btn` copiados de `registro-prestamo-modal`

## 4. Fix CSS advertencia de confirmación

- [x] 4.1 En `recoger-prestamo-modal.component.scss`: revisar y corregir el bloque `.advertencia-reemplazo` para que ocupe el ancho completo del modal sin encogerse (quitar `max-width` restrictivo o `flex` mal configurado)

## 5. WhatsApp en resultado de RecogerPrestamo

- [x] 5.1 En `recoger-prestamo-modal.component.ts`: inyectar `DomSanitizer` y agregar computed signal `whatsappLink` usando `resultado()` y `prestamo()?.cliente?.telefono`; el mensaje incluye total a cobrar, cuotas, valor cuota y link de consulta pública
- [x] 5.2 En `recoger-prestamo-modal.component.html`: en el paso resultado, agregar bloque `@if (whatsappLink())` con botón `btn-whatsapp` y fallback de sin teléfono, debajo del `div.resultado-detalles`
- [x] 5.3 En `recoger-prestamo-modal.component.scss`: agregar estilos `.btn-whatsapp` copiados de `registro-pago-modal`
