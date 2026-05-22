## 1. Chip de filtro activo (prestamos.component)

- [x] 1.1 Agregar `computed` `nombreClienteFiltrado` en `prestamos.component.ts` que busca el nombre del cliente activo en `clientes()`
- [x] 1.2 Agregar método `limpiarFiltroCliente()` que setea `filtroClienteId('')`
- [x] 1.3 Agregar bloque `@if (filtroClienteId())` en `prestamos.component.html` debajo de `.search-bar` con el chip: icono persona + nombre del cliente + botón "×"
- [x] 1.4 Agregar estilos `.chip-filtro-cliente` en `prestamos.component.scss`

## 2. Limpiar filtro al crear préstamo (prestamos.component)

- [x] 2.1 En el handler `onPrestamoRegistrado(prestamo)` de `prestamos.component.ts`: si `prestamo.clienteId !== filtroClienteId()`, llamar a `limpiarFiltroCliente()`

## 3. Validación de cédula duplicada en Gestión de Clientes (frontend)

- [x] 3.1 En `clientes.component.ts → validarFormulario()`: agregar chequeo de `identificacion` única contra `clientes()` (ignorando el cliente en edición por su `id`)
- [x] 3.2 Mostrar el error de duplicado en el mismo lugar donde se muestran otros errores del formulario

## 4. Validación de cédula duplicada en formulario inline (frontend)

- [x] 4.1 En `registro-prestamo-modal.component.ts → guardarNuevoCliente()`: verificar `clientes()` por `identificacion` antes de llamar a `clienteService.create()`
- [x] 4.2 Si hay duplicado, setear `errorNuevoCliente` con mensaje claro y no llamar al backend

## 5. Validación de cédula duplicada en backend

- [x] 5.1 En `ClientesController.cs → POST /clientes`: consultar si ya existe `Identificacion` en base de datos; si existe, retornar `400 Bad Request` con mensaje `"Ya existe un cliente con esta identificación"`
- [x] 5.2 En `ClientesController.cs → PUT /clientes/{id}`: mismo chequeo excluyendo el cliente con el `id` del parámetro
- [x] 5.3 Crear migración EF Core y agregar `HasIndex(c => c.Identificacion).IsUnique()` en `CobrosDbContext`
- [x] 5.4 Aplicar la migración y verificar que la base de datos tiene el unique constraint

## 6. Verificación

- [ ] 6.1 Navegar desde Clientes → Préstamos: chip visible con nombre correcto, "×" limpia el filtro
- [ ] 6.2 Crear cliente con cédula duplicada en Gestión de Clientes: error inmediato sin llamada HTTP
- [ ] 6.3 Crear cliente inline con cédula duplicada: error en mini-formulario
- [ ] 6.4 Llamar POST `/clientes` con cédula duplicada directamente: respuesta `400` del backend
- [ ] 6.5 Crear préstamo para cliente nuevo (diferente al filtro): préstamo visible en lista tras creación
