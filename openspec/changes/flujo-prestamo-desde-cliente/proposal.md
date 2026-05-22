## Why

El cobrador siempre sabe a quién le está prestando antes de abrir el modal — llega al cliente en la app y registra el préstamo ahí. El flujo actual obliga a buscar el cliente desde un `<select>` de 100+ registros dentro del modal, lo que es lento, propenso a errores y no refleja cómo trabaja el cobrador. Adicionalmente, desde un préstamo activo no hay forma directa de registrar otro préstamo al mismo cliente sin volver a buscar.

## What Changes

- El modal de registro de préstamo **elimina** la sección de selección de cliente (`<select>` + mini-form inline). El cliente siempre llega preseleccionado; el modal lo muestra en una banda de solo lectura.
- Desde la lista de clientes, cada fila/card expone un botón **"Nuevo Préstamo"** que abre el modal directamente (sin navegar a otra página).
- Desde una tarjeta de préstamo existente, se agrega un botón **"Otro préstamo"** que abre el modal con el mismo cliente preseleccionado.
- Todos los modales de la app dejan de cerrarse al hacer clic en el overlay; solo responden a la tecla **Escape** o a los botones explícitos de cancelar/cerrar.
- El botón **"Nuevo Préstamo"** en la página de préstamos (sin cliente relacionado) **se elimina**. Un préstamo solo puede crearse desde el contexto de un cliente específico.
- El botón **"Nuevo Préstamo"** sin cliente en `prestamos.component` se elimina — la única forma de crear un préstamo es desde un cliente.

## Capabilities

### New Capabilities

- `prestamo-desde-cliente`: El sistema permite crear un préstamo directamente desde el contexto de un cliente, con el cliente preseleccionado y en modo solo lectura dentro del modal.
- `otro-prestamo-desde-prestamo`: Desde la tarjeta de un préstamo existente se puede iniciar un nuevo préstamo para el mismo cliente.
- `cierre-modal-seguro`: Los modales solo se cierran con Escape o botón explícito, nunca con click en el overlay.

### Modified Capabilities

- `registro-prestamo-campos-manuales`: La sección de selección de cliente desaparece del modal — el cliente siempre se recibe como parámetro y se muestra en readonly. El campo de selección y el mini-form inline de nuevo cliente se eliminan del componente.
- `creacion-cliente-inline`: La capacidad de crear cliente inline desde el modal de préstamo **se elimina** — si el cliente no existe, debe crearse primero en Gestión de Clientes.

## Impact

- `registro-prestamo-modal.component.ts/.html`: nuevo `Input()` para `clientePreseleccionado: ICliente`; eliminar toda la sección de selección de cliente (`<select>`, carga de lista, mini-form inline, signal `clienteId`, signal `clientes[]`).
- `clientes.component.ts/.html`: importar y usar `RegistroPrestamoModalComponent` directamente; botón "Nuevo Préstamo" en cada fila.
- `prestamos.component.ts/.html`: botón "Otro préstamo" en tarjeta; eliminar setTimeout + queryParam `nuevo=true`.
- Todos los modales (`registro-prestamo-modal`, `edicion-prestamo-modal`, `registro-pago-modal`, form modal de clientes, modal de filtros): quitar `(click)="cerrar()"` del overlay y agregar `@HostListener('document:keydown.escape')`.
- Sin cambios en backend ni base de datos.
