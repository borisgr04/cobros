## Why

Tres bugs de UX descubiertos en el flujo cliente → préstamos generan confusión al usuario:

1. Al navegar desde Gestión de Clientes a Préstamos, el filtro por cliente se activa silenciosamente. Solo se muestra un número en el botón "Filtros" pero no se indica qué cliente está filtrado — el usuario no sabe por qué ve pocos préstamos.
2. El formulario de Gestión de Clientes permite guardar un cliente con una cédula ya registrada: el backend no rechaza la operación (sin constraint único ni validación en el endpoint) y el frontend tampoco valida antes de enviar.
3. Al crear un préstamo desde el flujo "Nuevo préstamo para este cliente", si el usuario crea el cliente inline con una identidad diferente al filtro activo, el préstamo recién creado no aparece en la lista. El usuario cree que la operación falló.

## What Changes

- **Chip de filtro activo**: mostrar un chip/etiqueta visible debajo de la barra de búsqueda con el nombre del cliente filtrado y un botón "×" para eliminar el filtro.
- **Validación de cédula duplicada (frontend + backend)**: al crear o editar un cliente, verificar en el frontend contra la lista en memoria antes de llamar al backend. Adicionalmente, agregar validación en el endpoint del backend (`ClientesController`) y/o unique constraint en base de datos para garantizar integridad aun si se llama directamente al API.
- **Limpiar filtro tras crear préstamo**: si se crea un préstamo y su `clienteId` no coincide con el filtro activo, limpiar el filtro para que el nuevo préstamo sea visible.

## Capabilities

### New Capabilities
<!-- No hay nuevas capacidades -->

### Modified Capabilities
- `creacion-cliente-inline`: agregar validación de identificación duplicada al guardar desde el mini-formulario inline en `registro-prestamo-modal`.
- `registro-pago`: no aplica

## Impact

- **Frontend + Backend**.
- `prestamos.component.ts` y `.html`: chip de filtro activo + limpiar filtro al crear préstamo.
- `clientes.component.ts`: validación de identificación duplicada al crear/editar (check en memoria antes del POST/PUT).
- `registro-prestamo-modal.component.ts`: validación de identificación duplicada al crear cliente inline (check en memoria antes del POST).
- `ClientesController.cs` (backend): validar unicidad de `Identificacion` antes de insertar/actualizar, retornar `400 Bad Request` con mensaje claro si ya existe.
- Migración EF Core: agregar `HasIndex(c => c.Identificacion).IsUnique()` en `CobrosDbContext` para garantizar la restricción a nivel de base de datos.
