# Tasks: fix-nav-reportes

## 1. Bottom nav – resets de botón Reportes

- [x] 1.1 En `bottom-navigation.component.scss`, agregar resets de botón (`background: none; border: none; outline: none; font: inherit;`) al selector `.bottom-nav-item` para que apliquen cuando el elemento es un `<button>` (puede usarse `:is(button).bottom-nav-item` o agregar un reset general al bloque existente)
- [x] 1.2 Verificar visualmente que el ítem Reportes (activo e inactivo) luce idéntico a Inicio/Clientes/Zonas/Usuarios en la bottom nav mobile

## 2. Sidebar – ítem Cierre del Día

- [x] 2.1 En `sidebar-navigation.component.ts`, agregar `{ path: '/reportes/cierre-dia', label: 'Cierre del Día', icon: 'bi-calendar2-check-fill' }` al array `navItems[]`, después del ítem `/reportes`
- [x] 2.2 En `sidebar-navigation.component.html`, agregar `[routerLinkActiveOptions]="{ exact: true }"` al ítem `/reportes` para evitar que quede resaltado cuando la URL es `/reportes/cierre-dia`
- [x] 2.3 Verificar en escritorio que al navegar a `/reportes/cierre-dia` sólo ese ítem queda activo (no el de `/reportes`)
