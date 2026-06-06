## 1. ClienteDetalleComponent — Simplificación

- [x] 1.1 Eliminar la sección `<!-- SECCIÓN DE PRÉSTAMOS -->` completa del template `cliente-detalle.component.html`
- [x] 1.2 Agregar botón "Ver Préstamos" en la tarjeta del cliente con badge del conteo de `cliente.prestamosActivos.length`
- [x] 1.3 Implementar el método `verPrestamos()` en el componente que navegue a `/prestamos?cliente=<id>&returnTo=/clientes/<id>`
- [x] 1.4 Eliminar las señales `prestamos` y `cargandoPrestamos` del componente
- [x] 1.5 Eliminar el método `cargarEstadisticasPrestamos()` y su llamada en `cargarCliente()`
- [x] 1.6 Eliminar los métodos `abrirPago()`, `nuevoPrestamo()`, `onPrestamoRegistrado()`, `onPagoRegistrado()`, `verDetallePrestamo()` y los helpers de préstamos (`getProgressBarClass`, `getTextoFrecuencia`)
- [x] 1.7 Eliminar las importaciones de `PrestamoService`, `RegistroPrestamoModalComponent`, `RegistroPagoModalComponent` y los `viewChild` de modales
- [x] 1.8 Eliminar el bloque relacionado con préstamos en `compartirWhatsApp()` (sección de préstamos activos en el mensaje)

## 2. Estilos — ClienteDetalleComponent

- [x] 2.1 Eliminar los estilos de `.prestamos-seccion`, `.prestamo-item`, `.prestamo-item-*`, `.btn-nuevo-prestamo`, `.btn-pagar`, `.btn-detalle` y demás clases de la sección de préstamos en `cliente-detalle.component.scss`
- [x] 2.2 Agregar estilos para el botón "Ver Préstamos" consistentes con el resto de la tarjeta del cliente

## 3. PrestamosComponent — Botón "Volver al Cliente"

- [x] 3.1 Leer el query param `returnTo` en `PrestamosComponent` al inicializar (junto con `clienteId`)
- [x] 3.2 Mostrar condicionalmente un botón "Volver al Cliente" en la cabecera/chip de filtros cuando `returnTo` está presente
- [x] 3.3 Implementar la acción del botón que navegue a la ruta almacenada en `returnTo`
- [x] 3.4 Agregar estilos para el botón "Volver al Cliente" alineados con el diseño existente del chip de filtro

## 4. Verificación

- [x] 4.1 Verificar que la tarjeta del cliente no muestra la lista de préstamos embebida
- [x] 4.2 Verificar que el botón "Ver Préstamos" navega correctamente a `/prestamos?cliente=<id>&returnTo=/clientes/<id>`
- [x] 4.3 Verificar que el chip de filtro de cliente es visible en Gestión de Préstamos al llegar desde el detalle
- [x] 4.4 Verificar que el botón "Volver al Cliente" regresa al detalle del cliente
- [x] 4.5 Verificar que sin `returnTo` no aparece el botón "Volver al Cliente"
