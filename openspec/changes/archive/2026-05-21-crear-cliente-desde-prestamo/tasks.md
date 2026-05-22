## 1. Signals y estado del mini-formulario

- [x] 1.1 Agregar signals en `registro-prestamo-modal.component.ts`: `mostrarFormNuevoCliente`, `nuevoNombre`, `nuevoIdentificacion`, `nuevoZonaId`, `nuevoTelefono`, `guardandoCliente`, `errorNuevoCliente`
- [x] 1.2 Inyectar `AbstractZonaService` en `registro-prestamo-modal.component.ts` y agregar signal `zonas = signal<IZona[]>([])`
- [x] 1.3 Implementar método `abrirFormNuevoCliente()`: cargar zonas (lazy) y poner `mostrarFormNuevoCliente(true)`
- [x] 1.4 Implementar método `cancelarFormNuevoCliente()`: resetear campos y poner `mostrarFormNuevoCliente(false)`
- [x] 1.5 Implementar método `guardarNuevoCliente()`: llamar a `clienteService.create()`, agregar a `clientes`, auto-seleccionar, colapsar formulario; manejar errores HTTP en `errorNuevoCliente`

## 2. Template HTML

- [x] 2.1 Agregar botón "+ Nuevo cliente" junto al `<select>` de cliente (visible solo cuando `!mostrarFormNuevoCliente()`)
- [x] 2.2 Agregar bloque condicional `@if (mostrarFormNuevoCliente())` con campos: Nombre (required), Identificación (required), Zona (select, required), Teléfono (optional)
- [x] 2.3 Agregar botón "Guardar cliente" (disabled si guardandoCliente o campos requeridos vacíos) y botón "Cancelar"
- [x] 2.4 Mostrar `errorNuevoCliente()` debajo del formulario cuando tenga contenido
- [x] 2.5 Mostrar mensaje "Sin zonas disponibles" y deshabilitar guardar cuando `zonas().length === 0`

## 3. Estilos SCSS

- [x] 3.1 Agregar estilos para `.form-nuevo-cliente`: borde diferenciado, fondo sutil, padding interior
- [x] 3.2 Agregar estilos para `.btn-nuevo-cliente`: botón secundario pequeño alineado al lado del select
- [x] 3.3 Agregar estilos para `.form-nuevo-cliente__error`: texto de error en rojo

## 4. Verificación

- [x] 4.1 Flujo happy path: abrir modal → clic "+ Nuevo cliente" → completar campos → guardar → cliente aparece seleccionado en el select
- [x] 4.2 Flujo cancelar: abrir mini-form → cancelar → select visible sin cambios
- [x] 4.3 Flujo error: crear cliente con identificación duplicada → mensaje de error visible, formulario permanece abierto
- [x] 4.4 Sin zonas: si la API retorna lista vacía de zonas, guardar está deshabilitado con mensaje
