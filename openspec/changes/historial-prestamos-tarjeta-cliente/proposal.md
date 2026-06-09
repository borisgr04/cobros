## Why

La tarjeta de detalle del cliente actualmente muestra el historial completo de préstamos embebido, lo que hace la pantalla muy larga y densa en información. Separar el historial de préstamos en su propia vista mejora la claridad y la usabilidad mobile, aprovechando el filtro por cliente ya existente en Gestión de Préstamos.

## What Changes

- Se elimina la sección de préstamos embebida (`<!-- SECCIÓN DE PRÉSTAMOS -->`) de la tarjeta de detalle del cliente.
- Se agrega un botón/icono "Ver Préstamos" en la tarjeta del cliente que navega a `/prestamos?clienteId=<id>`.
- La pantalla de Gestión de Préstamos aplica automáticamente el filtro por cliente al recibir `clienteId` en la URL.
- En Gestión de Préstamos con filtro de cliente activo, se muestra un botón "Volver al Cliente" que regresa a `/clientes/:id`.
- Se elimina la dependencia de `PrestamoService` y los modales de pago/préstamo en `ClienteDetalleComponent`, simplificando el componente.

## Capabilities

### New Capabilities

- `historial-prestamos-enlace-cliente`: Botón en la tarjeta del cliente que navega a Gestión de Préstamos filtrado por ese cliente, con posibilidad de volver al detalle del cliente.

### Modified Capabilities

- `ux-filtro-prestamos`: La ruta `/prestamos` ya soporta `clienteId` como query param para filtrar; se agrega el comportamiento de "Volver al Cliente" cuando el filtro viene de la navegación desde el detalle del cliente.

## Impact

- **`ClienteDetalleComponent`**: Se simplifica eliminando la sección de préstamos, los modales y sus dependencias.
- **`PrestamosComponent`**: Recibe `clienteId` desde query params (ya soportado) y muestra botón "Volver al Cliente" con la ruta de origen.
- **Rutas**: No se agregan rutas nuevas; se usa la ruta `/prestamos` existente con query params.
- **No hay cambios de API ni de backend.**
