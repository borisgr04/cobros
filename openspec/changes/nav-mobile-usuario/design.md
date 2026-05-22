## Context

El `BottomNavigationComponent` tiene 6 ítems de navegación fijos y no tiene ninguna referencia al usuario. El sidebar sí tiene el `user-card` con avatar, nombre, email y botón de logout — pero el sidebar está oculto en mobile (`display: none` via media query). El cobrador en su celular no tiene forma de ver quién está logueado ni de cerrar sesión.

La directiva `appMoneda` formatea los valores pero no establece `text-align`, por lo que los inputs quedan alineados a la izquierda (default). Los valores en tarjetas tampoco tienen alineación explícita.

## Goals / Non-Goals

**Goals:**
- El cobrador puede ver su nombre/email y cerrar sesión desde el bottom nav en mobile.
- Los inputs de dinero y valores en tarjetas tienen `text-align: right`.
- El bottom sheet del menú usuario es táctil, con área de toque generosa (`min-height: 44px`).

**Non-Goals:**
- No se implementa un sistema de roles/permisos para el ítem "Usuarios" — se muestra siempre o se reutiliza la lógica existente del sidebar.
- No se rediseña el bottom nav completo — solo se agrega el ítem "Más".
- No se crea un componente separado para el bottom sheet — se implementa inline en el componente.

## Decisions

### D1: Ítem "Más" con panel superpuesto (bottom sheet inline)
**Decisión**: Agregar un ítem "Más ···" al bottom nav que toglea un panel que aparece desde abajo con overlay oscuro.  
**Rationale**: Patrón estándar en apps mobile (iOS/Android). No requiere librería. El panel muestra lo que el sidebar muestra en footer: user card + logout.  
**Alternativa descartada**: Agregar directamente el avatar del usuario como ítem del bottom nav que navega a un perfil — requiere crear una ruta nueva.

### D2: `text-align: right` en la directiva `appMoneda` via `@HostBinding`
**Decisión**: Agregar `@HostBinding('style.text-align') textAlign = 'right'` en `MonedaInputDirective`.  
**Rationale**: Un solo lugar, aplica a todos los inputs con `appMoneda` automáticamente, sin tocar cada template.  
**Alternativa descartada**: CSS global `input[appMoneda]` — los custom attributes en Angular se procesan en tiempo de compilación y no son selectores CSS confiables.

### D3: Valores en tarjetas — clase CSS `.valor-monetario`
**Decisión**: Agregar `text-align: right` a las clases existentes que muestran valores monetarios en tarjetas (`.stat-value`, `.derivado-valor`, `.cartera-value`).  
**Rationale**: Más preciso que un selector global. Se puede aplicar en el SCSS de cada componente.

## Risks / Trade-offs

- **[Riesgo] Bottom sheet se queda abierto al navegar** → El panel debe cerrarse al cambiar de ruta. Mitigación: suscribirse a `Router.events` o usar `ngOnDestroy` para cerrar.
- **[Trade-off] Ítem "Más" ocupa espacio en una barra ya con 6 ítems** → En pantallas de 320px puede quedar muy apretado. Mitigación: en 5 ítems o menos el layout actual funciona bien (6 ítems ya caben); el ítem "Más" reemplaza a "Tablero" o "Reportes" si se siente apretado — decisión a confirmar en verificación visual.
