## Context

Cinco issues de UX en el modal "Recoger Préstamo" y la vista de detalle de préstamo. Todo el trabajo es frontend Angular; no hay cambios en la API ni en la base de datos.

El patrón de segmented control para frecuencia ya existe implementado en `registro-prestamo-modal` con el array `frecuencias: Array<{value, label, icon}>` y el método `seleccionarFrecuencia()`. El patrón WhatsApp existe en `registro-pago-modal` y `registro-prestamo-modal` con el computed `whatsappLink` usando `DomSanitizer.bypassSecurityTrustUrl`.

El bug de navegación (#8 y #9) tiene una sola causa raíz: `PrestamoDetalleComponent` usa `this.route.snapshot.paramMap.get('id')` en `ngOnInit`. Cuando Angular navega de `/prestamos/5` a `/prestamos/6`, el router reutiliza el componente sin llamar `ngOnInit` de nuevo. La solución es suscribirse al observable `this.route.paramMap` en `ngOnInit`.

## Goals / Non-Goals

**Goals:**
- Segmented buttons para frecuencia de pago en RecogerPrestamo.
- Advertencia de confirmación visible sin encogerse.
- Label "Recogida" (era "Ampliada") para el estado de cuota en detalle de préstamo.
- Links `/prestamos/:id` navegan correctamente entre préstamos del mismo componente.
- Botón WhatsApp en pantalla de resultado de recoger préstamo.

**Non-Goals:**
- No se cambia el valor persistido `"reemplazada_por_ampliacion"` en la base de datos.
- No se crea un servicio genérico de notificaciones ni de navegación.
- No se modifica el backend.
- No se cambian los labels en otros modales (solo en `prestamo-detalle.component.html`).

## Decisions

**Patrón paramMap observable**  
Suscribirse a `this.route.paramMap` en `ngOnInit` y desuscribirse en `ngOnDestroy` (o usar `takeUntilDestroyed()`). Alternativa descartada: usar `RouteReuseStrategy.shouldReuseRoute = () => false` — afecta globalmente toda la navegación de la app.

**Label "Recogida" vs "Refinanciada"**  
El usuario eligió "Recogida" porque la operación en dominio se llama "Recoger Préstamo". El valor de BD `"reemplazada_por_ampliacion"` no cambia para evitar cualquier migración o riesgo de datos.

**Segmented control sin icono en RecogerPrestamo**  
El modal de recoger ya tiene mucho contenido; se usan los botones con solo `label` (sin icono) para economizar espacio, igual que en el proposal de `registro-prestamo-modal` donde el icono es opcional.

**CSS advertencia**  
El bloque `.advertencia-reemplazo` tiene un `min-height` o `max-width` que encoge el texto. Se aplica el fix de flexbox correcto sin rediseñar el modal.

## Risks / Trade-offs

- [paramMap observable introduce desuscripción] → Se usa `takeUntilDestroyed()` de Angular 16+ (ya disponible en el proyecto) para evitar memory leaks, sin `OnDestroy` manual.
- [Label "Recogida" inconsistente con el tipo de novedad `"ampliacion_plazo"`] → El tipo de novedad es interno al backend; el label visible al usuario es independiente y puede tener su propio nombre en el frontend.
