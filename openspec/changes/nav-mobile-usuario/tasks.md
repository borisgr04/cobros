## 1. Directiva appMoneda — alineación a la derecha

- [ ] 1.1 Agregar `@HostBinding('style.text-align') readonly textAlign = 'right'` en `MonedaInputDirective`

## 2. Valores monetarios en tarjetas

- [ ] 2.1 En `prestamos.component.scss`: agregar `text-align: right` a `.stat-value` y a los valores dentro de `.stat-card`
- [ ] 2.2 En `registro-prestamo-modal.component.scss`: agregar `text-align: right` a `.derivado-valor` y `.derivado-label` cuando sea valor numérico
- [ ] 2.3 Revisar `clientes.component.scss` y ajustar alineación de valores numéricos en las cards si aplica

## 3. Bottom navigation — ítem "Más" y panel usuario

- [ ] 3.1 Inyectar `AuthService` en `BottomNavigationComponent` y exponer `user = this.auth.currentUser` y método `logout()`
- [ ] 3.2 Agregar signal `panelAbierto = signal(false)` en `BottomNavigationComponent`
- [ ] 3.3 Agregar ítem "Más" al array `navItems` o renderizarlo como botón separado (no `routerLink`) al final del bottom nav
- [ ] 3.4 En `bottom-navigation.component.html`: agregar `@if (panelAbierto())` con overlay + panel. El panel muestra: avatar/fallback, nombre, email, separador, enlace "Gestión de Usuarios" (routerLink a `/usuarios`), separador, botón "Cerrar sesión"
- [ ] 3.5 En `bottom-navigation.component.scss`: agregar estilos del overlay (fondo semitransparente, `z-index` alto) y del panel (fondo blanco, `border-radius` top, padding generoso, `min-height` de cada ítem `44px`, animación slide-up)
- [ ] 3.6 Suscribirse a `Router.events` (filtrar `NavigationEnd`) para cerrar el panel automáticamente al navegar; desuscribirse en `ngOnDestroy`

## 4. Verificación

- [ ] 4.1 En mobile: tocar "Más" → panel se abre con nombre y email del usuario logueado y enlace a Gestión de Usuarios
- [ ] 4.2 En mobile: tocar "Gestión de Usuarios" en el panel → navega a `/usuarios` y el panel se cierra
- [ ] 4.2 En mobile: tocar overlay o botón cerrar → panel se cierra
- [ ] 4.3 En mobile: tocar "Cerrar sesión" → sesión termina, redirige al login
- [ ] 4.4 Navegar a otra sección con el panel abierto → panel se cierra automáticamente
- [ ] 4.5 Abrir modal de préstamo → los inputs de dinero muestran valores alineados a la derecha
- [ ] 4.6 Ver lista de préstamos → valores en tarjetas de estadísticas alineados a la derecha
