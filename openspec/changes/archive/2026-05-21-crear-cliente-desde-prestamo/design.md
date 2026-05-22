## Context

El modal `registro-prestamo-modal` (creación de préstamos) tiene un `<select>` de solo lectura que carga todos los clientes vía `AbstractClienteService.getAll()`. No existe forma de crear un cliente desde esa pantalla.

El modal `edicion-prestamo-modal` tiene el mismo selector pero es menos prioritario: al editar un préstamo existente el cliente ya está registrado.

Servicios disponibles:
- `AbstractClienteService.create(cliente)` — ya existe, llama a `POST /api/clientes`.
- `AbstractZonaService.getAll()` — disponible para poblar el selector de zona del mini-formulario.

El backend no requiere cambios: `POST /api/clientes` acepta `ClienteInputDto { Nombre, Identificacion, ZonaId, Alias?, Direccion?, Telefono?, CuentaBancaria? }`.

## Goals / Non-Goals

**Goals:**
- Botón "+ Nuevo cliente" junto al selector de cliente en `registro-prestamo-modal`.
- Mini-formulario inline que expande dentro del mismo modal con campos: Nombre, Identificación, Zona (select), Teléfono (opcional).
- Al guardar, el nuevo cliente aparece seleccionado automáticamente en el `<select>`.
- Al cancelar, el formulario colapsa sin cambios.

**Non-Goals:**
- No se modifica `edicion-prestamo-modal` (baja necesidad: el cliente del préstamo ya existe).
- No se implementan todos los campos de `ClienteInputDto` (Alias, Dirección, Cuenta Bancaria quedan fuera — se crean con valores mínimos).
- No se crea un componente reutilizable extraído del modal (overkill para un único uso).
- No se agrega validación de duplicados de identificación en el frontend.

## Decisions

### Decisión 1: Mini-formulario inline dentro del modal, no un modal anidado

Un modal sobre otro modal genera complejidad de z-index y UX confusa en mobile. El mini-formulario inline colapsa/expande dentro del área del selector de cliente, manteniendo el contexto del préstamo visible.

*Alternativa descartada:* abrir un segundo modal para crear cliente — UX fragmentada y compleja de gestionar.

### Decisión 2: Campos mínimos en el formulario inline

Solo se exponen los campos requeridos por el backend (Nombre, Identificación, Zona) más Teléfono como opcional de alta utilidad. El resto (Alias, Dirección, Cuenta Bancaria) se pueden completar luego desde Gestión de Clientes.

### Decisión 3: Cargar zonas al abrir el mini-formulario, no al abrir el modal

Las zonas se cargan `onDemand` cuando el usuario hace clic en "+ Nuevo cliente", evitando una llamada innecesaria si el cliente ya existe.

### Decisión 4: Estado del formulario inline en signals locales del componente

`mostrarFormNuevoCliente`, `nuevoClienteNombre`, `nuevoClienteIdentificacion`, `nuevoClienteZonaId`, `nuevoClienteTelefono`, `zonas`, `guardandoCliente`, `errorNuevoCliente` — todos como signals en el mismo componente. No requiere servicio dedicado.

## Risks / Trade-offs

- **Zona requerida**: el usuario debe conocer la zona del cliente. Si no hay zonas creadas, el formulario no puede proceder. Mitigación: mostrar mensaje "Sin zonas disponibles" y enlace a Gestión de Zonas (o simplemente el mensaje de error).
- **Carga de zonas duplicada**: `registro-prestamo-modal` no carga zonas actualmente; agregar la llamada suma una request HTTP. Es un trade-off aceptable (lazy, solo cuando se necesita).
- **Duplicados de cliente**: si el usuario crea un cliente que ya existe (misma identificación), el backend retorna 409. El componente debe manejar este error y mostrarlo en el formulario inline.
