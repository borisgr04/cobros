## Context

La app tiene dos niveles de navegación:
- **Mobile** (`bottom-navigation`): barra fija en la parte inferior, visible sólo en pantallas pequeñas (`display: none` por defecto, mostrado con media query).
- **Desktop** (`sidebar-navigation`): sidebar lateral, visible en tablet/escritorio.

Los ítems de la bottom nav son mezcla de `<a routerLink>` (para Inicio, Clientes, Zonas, Usuarios) y un `<button>` (para Reportes, que abre un panel en lugar de navegar directamente). Los `<a>` obtienen el estado `.active` vía `routerLinkActive`; el `<button>` lo fuerza con `[class.active]`. El CSS de `.bottom-nav-item` no incluye resets de botón, por lo que el navegador aplica sus estilos por defecto al `<button>` (background gris, border, padding distinto), haciendo que visualmente difiera de los `<a>`.

La sidebar de escritorio enumera sus rutas en el array `navItems` del componente. La ruta `/reportes/cierre-dia` nunca fue agregada ahí: sólo existe `/reportes`. El único acceso a cierre-día en escritorio es tecleando la URL manualmente.

## Goals / Non-Goals

**Goals:**
- Igualar visualmente el ítem Reportes (button) con los demás ítems (anchor) en la bottom nav.
- Agregar "Cierre del Día" como ítem navegable en la sidebar de escritorio.
- Correcciones limitadas al CSS y a la lista de ítems; sin cambio de arquitectura.

**Non-Goals:**
- No se cambia el modelo de panel-trigger de Reportes en la bottom nav.
- No se agrega lógica de sub-menús ni grupos en la sidebar.
- No se modifican rutas, guards ni lógica de backend.

## Decisions

### D1 — Resets de botón en `.bottom-nav-item`

**Decisión**: Agregar `background: none; border: none; outline: none; font: inherit; padding: …;` directamente al selector `.bottom-nav-item` (o con `:is(button).bottom-nav-item`) en lugar de usar la clase auxiliar `.bottom-nav-user` que ya existe pero no se aplica al botón de Reportes.

**Alternativas consideradas:**
- *Agregar clase `bottom-nav-user` al botón Reportes* — funciona pero `bottom-nav-user` es semánticamente para el avatar de usuario, causaría confusión.
- *Convertir el botón en `<a>` con href="#"* — hackish, genera problemas de accesibilidad.

**Razón elegida**: Centralizar los resets en el selector base es más limpio y previene futuros botones con el mismo problema.

---

### D2 — Cierre del Día en sidebar: ítem plano vs. sub-ítem

**Decisión**: Agregar `/reportes/cierre-dia` como ítem independiente en `navItems[]` del sidebar, con icono propio (`bi-calendar2-check-fill`), al lado de `/reportes`.

**Alternativas consideradas:**
- *Sub-menú expandible bajo Reportes* — introduce estado adicional (expanded/collapsed) y complejidad de CSS; overkill para sólo dos ítems.
- *Ítem único "Reportes" que navega a una landing con opciones* — `/reportes` ya existe y hace eso; pero en desktop el usuario pierde un click.

**Razón elegida**: La sidebar ya tiene 5 ítems planos; agregar un sexto es consistente, cero complejidad adicional.

## Risks / Trade-offs

- **Sidebar más larga**: Con 6 ítems en pantallas pequeñas-tablet el sidebar puede quedar apretado. → Aceptable; la sidebar ya tiene scroll implícito y el ítem es pequeño.
- **`routerLinkActive` en `/reportes` vs `/reportes/cierre-dia`**: Angular marca activo `/reportes` cuando la URL es `/reportes/cierre-dia` (por ser prefijo). El ítem sidebar de `/reportes` quedará resaltado también al estar en cierre-día. → Usar `[routerLinkActiveOptions]="{ exact: true }"` en el ítem `/reportes` para evitar el doble resaltado.
