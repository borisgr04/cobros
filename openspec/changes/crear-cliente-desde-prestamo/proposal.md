## Why

Al crear un nuevo préstamo, el selector de cliente es de solo lectura: si el cliente no existe en el sistema, el usuario debe salir del flujo, ir a Gestión de Clientes, crear el cliente, y volver a intentar el préstamo. Este cambio elimina esa fricción permitiendo crear el cliente directamente desde el modal de nuevo préstamo.

## What Changes

- Agregar un botón **"+ Nuevo cliente"** junto al selector de cliente en el modal de edición/creación de préstamo.
- Al hacer clic, expandir un mini-formulario inline con los campos requeridos del cliente: Nombre, Identificación y Zona.
- Al confirmar la creación, llamar a `POST /api/clientes`, agregar el nuevo cliente a la lista del selector y seleccionarlo automáticamente.
- El usuario puede cancelar el mini-formulario y volver al selector normal.
- El selector de zona dentro del mini-formulario se carga con las zonas ya disponibles en el contexto (mismas que usa el filtro de la pantalla de préstamos).

## Capabilities

### New Capabilities
- `creacion-cliente-inline`: formulario inline en el modal de préstamo para crear un cliente nuevo y seleccionarlo de inmediato.

### Modified Capabilities
<!-- No hay cambios en specs existentes -->

## Impact

- **Frontend**: `edicion-prestamo-modal` (HTML + TS + SCSS) — agregar formulario inline y lógica de creación.
- **Backend**: ningún cambio — `POST /api/clientes` ya existe y acepta `ClienteInputDto`.
- **Servicio**: `AbstractClienteService.crearCliente()` ya puede existir o necesita agregarse para llamar al endpoint.
- **Tests**: agregar test de integración para el flujo de creación inline (opcional, bajo riesgo dado que el endpoint ya está probado).
