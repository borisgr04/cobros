## Why

El uso principal de la app es desde el celular del cobrador. Hoy la navegación mobile (bottom nav) no expone el menú de usuario: el cobrador no puede ver quién está logueado, no puede cerrar sesión, y — lo más crítico — no puede acceder a la gestión de usuarios para autorizar o registrar nuevos usuarios. El ícono de "Usuarios" simplemente no existe en el bottom nav. Adicionalmente, los valores monetarios en formularios e inputs se muestran alineados a la izquierda, lo que dificulta la comparación visual de cifras — estándar universal para valores numéricos es alineación a la derecha.

## What Changes

- El `BottomNavigationComponent` agrega un ítem **"Más"** que abre un bottom sheet con: info del usuario logueado (nombre + email), enlace a **Gestión de Usuarios** (`/usuarios`), y botón de cerrar sesión.
- Los `input[appMoneda]` y los valores monetarios mostrados en tarjetas/resúmenes se alinean a la derecha (`text-align: right`).

## Capabilities

### New Capabilities

- `menu-usuario-mobile`: En mobile, un ítem "Más" en el bottom nav abre un panel con información del usuario, acceso a gestión de usuarios y opción de cerrar sesión.
- `alineacion-valores-numericos`: Los inputs de dinero y los valores monetarios en la UI se muestran alineados a la derecha.

### Modified Capabilities

_(ninguna — los cambios son presentación pura sin impacto en specs de comportamiento existentes)_

## Impact

- `bottom-navigation.component.ts/.html/.scss`: nuevo ítem "Más", estado de panel abierto/cerrado, mostrar user info + logout.
- `bottom-navigation.component.ts`: inyectar `AuthService` para acceder a `currentUser` y `logout()`.
- `moneda-input.directive.ts`: agregar `text-align: right` al elemento host.
- CSS global o directiva: valores monetarios en tarjetas de préstamos y estadísticas alineados a la derecha.
- Sin cambios en backend ni en lógica de negocio.
