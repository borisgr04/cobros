## Why

El ítem "Reportes" en la bottom navigation se renderiza como `<button>` (panel trigger) en lugar de `<a>` (routerLink), lo que hace que los resets de CSS de navegador no apliquen y el resaltado activo se vea diferente al de los otros ítems. Adicionalmente, la navegación lateral (sidebar) de escritorio no incluye un enlace a "Cierre del Día", dejando esa pantalla completamente inaccesible desde la versión web.

## What Changes

- **Bottom nav – reset de botón**: El `<button class="bottom-nav-item">` del ítem Reportes hereda estilos de botón del navegador (background, border, padding) que no aplican a los `<a>` del mismo listado. Se añaden resets CSS para que `bottom-nav-item` sobre un `<button>` luzca idéntico a los ítems de tipo `<a>`.
- **Sidebar – acceso a Cierre del Día**: La sidebar de escritorio solo enlaza a `/reportes`. Se agrega la ruta `/reportes/cierre-dia` como ítem en el sidebar (o como sub-ítem visual de Reportes) para que sea accesible en web.

## Capabilities

### New Capabilities

_(ninguna — ambos cambios son correcciones de navegación existente)_

### Modified Capabilities

- `bottom-navigation`: Corrección de estilos del ítem Reportes (button resets) para igualar resaltado con los demás ítems `<a>`.
- `mobile-user-header`: _(no aplica — no hay cambio aquí)_

## Impact

- **Frontend – SCSS**: `bottom-navigation.component.scss` — resets de `button` dentro de `.bottom-nav-item`.
- **Frontend – HTML sidebar**: `sidebar-navigation.component.html` — nuevo ítem o sub-ítem para `/reportes/cierre-dia`.
- **Frontend – TS sidebar**: `sidebar-navigation.component.ts` — agregar entrada en `navItems[]`.
- Sin cambios en backend, rutas, guards ni modelos.
