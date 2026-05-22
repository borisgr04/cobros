## Context

**Bug 1 — Filtro invisible:**  
`prestamos.component.ts` lee `?cliente=ID` del queryParam y setea `filtroClienteId`. El HTML solo muestra un número en `badge-filtros` (ej. "1") en el botón Filtros. No hay ningún elemento visual que indique cuál cliente está siendo filtrado. `clientes` se carga de forma asíncrona, así que para mostrar el nombre hay que buscarlo en `this.clientes()` una vez cargados.

**Bug 2 — Cédula duplicada:**  
`clientes.component.ts` → `validarFormulario()` solo valida que los campos requeridos no estén vacíos. No hay chequeo de `identificacion` única contra la lista en memoria. El backend **tampoco valida**: el endpoint de creación/edición de clientes no verifica unicidad de `Identificacion` y no hay unique constraint en la tabla, por lo que la cédula duplicada se persiste sin error.  
El mismo problema existe en `registro-prestamo-modal` → `guardarNuevoCliente()`.

**Bug 3 — Préstamo invisible tras creación:**  
Al navegar con `?cliente=X&nuevo=true`, `filtroClienteId` queda seteado en X. Si el usuario crea un préstamo para el cliente X, sí aparece. Pero si el usuario usó el formulario inline para crear un cliente nuevo Y y asignó el préstamo a Y, el filtro sigue siendo X → el préstamo de Y no aparece. El usuario cree que no se creó.

## Goals / Non-Goals

**Goals:**
- Chip visible con nombre del cliente filtrado y botón "×" para limpiar.
- Validación frontend de identificación duplicada en `clientes.component` y en `registro-prestamo-modal`.
- Al crear un préstamo cuyo `clienteId` ≠ `filtroClienteId`, limpiar el filtro automáticamente.

**Non-Goals:**
- No se cambia el mecanismo de navegación por queryParams.
- No se agrega paginación ni scroll en la lista de préstamos.

## Decisions

### Decisión 1: Chip de filtro debajo de la barra de búsqueda

Se agrega un bloque `@if (filtroClienteId())` inmediatamente bajo `.search-bar` que muestra un chip con el nombre del cliente (obtenido de `clientes()` por ID) y un `×`. Al hacer clic en `×`, se llama a `limpiarFiltroCliente()` que setea `filtroClienteId('')`.

Para el nombre: `computed(() => this.clientes().find(c => c.id === this.filtroClienteId())?.nombre ?? 'Cliente')`.

### Decisión 2: Validación de duplicado en dos capas

**Frontend (UX rápida):**  
En `clientes.component.ts → validarFormulario()`: antes de llamar al backend, verificar si algún cliente en `clientes()` tiene la misma `identificacion` (ignorando el cliente en edición). Mostrar error de validación inmediato sin llamada HTTP.  
En `registro-prestamo-modal.component.ts → guardarNuevoCliente()`: ídem, mostrar error en `errorNuevoCliente`.

**Backend (integridad garantizada):**  
En `ClientesController.cs` → endpoints `POST /clientes` y `PUT /clientes/{id}`: consultar si ya existe un cliente con la misma `Identificacion` (excluyendo el propio en edición) y retornar `400 Bad Request` con mensaje `"Ya existe un cliente con esta identificación"`.  
Agregar migración EF Core con `HasIndex(c => c.Identificacion).IsUnique()` en `CobrosDbContext` para garantizar la restricción a nivel de base de datos.

### Decisión 3: Limpiar filtro en el evento prestamoRegistrado

`prestamos.component.ts` escucha el evento `prestamoRegistrado` del modal. Tras la creación, si `prestamo.clienteId !== filtroClienteId()`, limpiar `filtroClienteId('')` para que el nuevo préstamo aparezca en la lista sin confusión.

## Risks / Trade-offs

- **Race condition en validación de duplicados**: la lista en memoria podría estar desactualizada si otro usuario creó un cliente. Mitigado — el backend sigue siendo la fuente de verdad y retornará error; la validación frontend solo mejora la UX en el caso común.
- **Nombre del cliente en chip**: si `clientes()` aún no cargó cuando llega el queryParam, el chip mostrará "Cliente" temporalmente. Se actualiza automáticamente cuando el signal cambia.
