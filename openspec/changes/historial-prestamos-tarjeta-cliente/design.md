## Context

La tarjeta de detalle del cliente (`ClienteDetalleComponent`) carga y muestra una lista completa de préstamos embebida junto con dos modales (registro de préstamo y pago). Esto crea una pantalla densa y acoplada que mezcla responsabilidades: datos del cliente + historial de préstamos + acciones de cobro.

La ruta `/prestamos` ya soporta `clienteId` como query param para filtrar préstamos por cliente (spec `ux-filtro-prestamos`). Esta capacidad existente permite desacoplar el historial del detalle del cliente sin necesidad de nueva infraestructura.

## Goals / Non-Goals

**Goals:**
- Simplificar `ClienteDetalleComponent` eliminando la sección inline de préstamos y sus dependencias.
- Navegar a `/prestamos?clienteId=<id>` al hacer clic en el botón "Ver Préstamos" de la tarjeta del cliente.
- Mostrar un botón "Volver al Cliente" en `PrestamosComponent` cuando el usuario llega desde el detalle de un cliente.
- Preservar el flujo "Nuevo Préstamo" desde la tarjeta del cliente (navegar a préstamos con cliente preseleccionado equivale a eliminar ese entry point; se mantiene redirigiendo con `nuevoPrestamoClienteId` o conservando el botón "Nuevo Préstamo" que abre el modal antes de ir a la lista).

**Non-Goals:**
- Cambios en el backend o en la API.
- Modificar la lógica de filtrado ya implementada en `PrestamosComponent`.
- Crear una nueva ruta o página dedicada para el historial.

## Decisions

### Decisión 1: Usar query param `clienteId` existente para la navegación

**Elegido**: Navegar a `/prestamos?clienteId=<id>` reutilizando el filtro ya implementado.

**Alternativa descartada**: Crear una ruta nueva `/clientes/:id/prestamos`. Agrega complejidad de routing sin beneficio real, dado que el filtro ya funciona.

**Rationale**: Reutiliza infraestructura existente y reduce el scope de cambios al mínimo necesario.

---

### Decisión 2: Pasar `returnTo` como query param para el botón "Volver"

**Elegido**: Al navegar a `/prestamos?clienteId=<id>`, incluir también `returnTo=/clientes/<id>` como query param. `PrestamosComponent` detecta `returnTo` y muestra el botón "Volver al Cliente".

**Alternativa descartada**: Usar el historial del navegador (`history.back()`). Frágil en PWA y en accesos directos desde URL.

**Rationale**: La URL como fuente de verdad es más robusta y testeable.

---

### Decisión 3: Eliminar los modales de préstamo y pago del componente de detalle

**Elegido**: Eliminar `RegistroPrestamoModalComponent` y `RegistroPagoModalComponent` de `ClienteDetalleComponent`. El flujo de nuevo préstamo pasa a ser: navegar a la lista de préstamos con el cliente ya filtrado, y desde allí usar el flujo normal de nuevo préstamo.

**Alternativa descartada**: Conservar los modales solo para el botón "Nuevo Préstamo". Mantiene la complejidad innecesariamente; el flujo de creación de préstamo ya existe en `PrestamosComponent`.

**Rationale**: Un componente con única responsabilidad es más mantenible.

---

### Decisión 4: Botón "Ver Préstamos" con contador badge

El botón en la tarjeta del cliente mostrará un badge con el número de préstamos activos del cliente (disponible en `cliente.prestamosActivos.length`), sin necesidad de una llamada adicional a la API.

## Risks / Trade-offs

- **Pérdida del acceso rápido a pago desde detalle del cliente** → El usuario debe navegar a Préstamos para registrar un pago. Se mitiga con el botón "Ver Préstamos" prominente y el botón "Volver al Cliente".
- **`whitespace`**: Si el `returnTo` tiene caracteres especiales, Angular Router los codifica automáticamente, no es un riesgo real.
