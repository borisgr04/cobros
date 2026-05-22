## 1. Validación de cédula en tiempo real (formulario inline)

- [x] 1.1 Agregar `computed` `cedulaDuplicada` en `registro-prestamo-modal.component.ts` que retorna `true` si `nuevoIdentificacion().trim()` ya existe en `clientes()`
- [x] 1.2 En `registro-prestamo-modal.component.html`: deshabilitar el botón "Guardar cliente" cuando `cedulaDuplicada()` sea `true` (además de los campos vacíos)
- [x] 1.3 Mostrar hint debajo del campo Identificación cuando `cedulaDuplicada()` sea `true`: "Ya existe un cliente con esta identificación"
- [x] 1.4 Eliminar la validación de duplicado en `guardarNuevoCliente()` ya que ahora el botón queda deshabilitado antes del submit

## 2. Formato de moneda en controles numéricos

- [x] 2.1 Agregar `computed` `valorPrestadoFormateado` y `valorTotalFormateado` en `registro-prestamo-modal.component.ts` usando `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`
- [x] 2.2 En `registro-prestamo-modal.component.html`: agregar `<span class="input-moneda-preview">` debajo de cada campo numérico que muestre el computed formateado (solo visible cuando el valor > 0)
- [x] 2.3 Agregar estilos `.input-moneda-preview` en `registro-prestamo-modal.component.scss`

## 3. Filtro automático al cliente del préstamo creado

- [x] 3.1 En `prestamos.component.ts → onPrestamoRegistrado(prestamo)`: reemplazar la lógica actual (limpiar si cliente difiere) por `filtroClienteId.set(prestamo.clienteId)` siempre

## 4. Teléfono obligatorio en formulario inline

- [x] 4.1 En `registro-prestamo-modal.component.ts → guardarNuevoCliente()`: agregar validación de `nuevoTelefono()` no vacío antes de llamar al backend; si está vacío, setear `errorNuevoCliente`
- [x] 4.2 En `registro-prestamo-modal.component.html`: marcar el campo Teléfono con indicador visual de requerido (`*`) y deshabilitar "Guardar" cuando esté vacío
- [x] 4.3 En `clientes.component.ts → validarFormulario()`: agregar validación de `formulario.telefono` no vacío
- [x] 4.4 En `clientes.component.html`: marcar el campo Teléfono con indicador visual de requerido (`*`) y atributo `required`

## 5. Campo Alias en formulario inline

- [x] 5.1 Agregar `nuevoAlias = signal<string>('')` en `registro-prestamo-modal.component.ts`
- [x] 5.2 Incluir `alias: this.nuevoAlias().trim() || undefined` en el objeto `nuevoCliente` dentro de `guardarNuevoCliente()`
- [x] 5.3 Agregar campo Alias (opcional) en `registro-prestamo-modal.component.html` entre Nombre e Identificación
- [x] 5.4 Limpiar `nuevoAlias` en `cancelarFormNuevoCliente()` y en `resetearFormulario()`

## 6. Fix mensaje de error visible en Gestión de Clientes

- [x] 6.1 Inspeccionar `clientes.component.html`: localizar el bloque que renderiza `mensaje()` y verificar que el `@if` y clases CSS sean correctos
- [x] 6.2 Corregir el binding/visibilidad para que el mensaje de error sea visible cuando `mensaje()` tiene tipo `'error'`

## 7. Verificación

- [x] 7.1 Formulario inline: escribir cédula duplicada → hint visible, botón deshabilitado; cambiar cédula → hint desaparece, botón activo
- [x] 7.2 Modal de préstamo: escribir valor → preview de moneda aparece debajo del campo
- [x] 7.3 Crear préstamo → filtro se activa al cliente del préstamo, chip visible con su nombre
- [x] 7.4 Formulario inline: dejar Teléfono vacío → botón deshabilitado; completarlo → botón activo
- [x] 7.5 Formulario inline: campo Alias visible y se envía al guardar
- [x] 7.6 Gestión de Clientes: provocar error → mensaje visible en el formulario
