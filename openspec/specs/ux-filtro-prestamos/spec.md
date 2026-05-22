### Requirement: Filtro de cliente activo tras crear un préstamo
Tras registrar un nuevo préstamo exitosamente, el sistema SHALL establecer automáticamente el filtro de cliente al cliente del préstamo recién creado, mostrando únicamente sus préstamos en la lista.

#### Scenario: Filtro se establece al cliente del préstamo creado
- **WHEN** se crea un préstamo exitosamente para cualquier cliente
- **THEN** el filtro de cliente se establece al cliente de ese préstamo
- **AND** la lista muestra únicamente los préstamos de ese cliente
- **AND** el chip de filtro activo muestra el nombre del cliente

### Requirement: Filtro de cliente visible con opción de limpieza
Cuando el filtro de cliente está activo en Gestión de Préstamos, el sistema SHALL mostrar un chip visible con el nombre del cliente filtrado y un botón "×" para eliminar el filtro, independientemente de cómo se activó el filtro (URL, modal de filtros, o navegación desde clientes).

#### Scenario: Chip visible al navegar desde clientes
- **WHEN** el usuario navega desde Gestión de Clientes a Préstamos con un cliente seleccionado
- **THEN** aparece un chip con el nombre del cliente debajo de la barra de búsqueda
- **AND** la lista solo muestra los préstamos de ese cliente

#### Scenario: Limpiar filtro de cliente
- **WHEN** el usuario hace clic en "×" del chip de filtro
- **THEN** el filtro se elimina y la lista muestra todos los préstamos
- **AND** el chip desaparece

### Requirement: Validación de identificación duplicada al crear cliente
El sistema SHALL garantizar que no se persistan dos clientes con la misma identificación. La validación ocurre en dos capas: el frontend verifica contra la lista en memoria antes de llamar al backend (UX inmediata), y el backend valida en base de datos retornando `400` si ya existe, respaldado por un unique constraint en la tabla `Clientes`.

#### Scenario: Identificación ya registrada en Gestión de Clientes (frontend)
- **WHEN** el usuario intenta guardar un cliente con una identificación que ya existe en la lista en memoria
- **THEN** el sistema muestra un error "Ya existe un cliente con esta identificación" sin llamar al backend
- **AND** el formulario permanece abierto

#### Scenario: Identificación ya registrada en formulario inline de préstamo (frontend)
- **WHEN** el usuario intenta guardar un nuevo cliente desde el formulario inline con una identificación duplicada
- **THEN** el sistema muestra el error dentro del mini-formulario sin llamar al backend

#### Scenario: Identificación duplicada enviada directamente al backend
- **WHEN** se hace un POST/PUT a `/clientes` con una `Identificacion` ya registrada (sin pasar por el frontend)
- **THEN** el backend retorna `400 Bad Request` con el mensaje "Ya existe un cliente con esta identificación"
- **AND** no se crea ni modifica ningún registro en base de datos

### Requirement: Préstamo recién creado siempre visible en la lista
Tras registrar un nuevo préstamo, el sistema SHALL garantizar que el préstamo aparezca en la lista, ajustando o eliminando el filtro de cliente si es necesario.

#### Scenario: Préstamo creado para cliente diferente al filtro activo
- **WHEN** se crea un préstamo para el cliente Y mientras el filtro activo es el cliente X (X ≠ Y)
- **THEN** el filtro de cliente se limpia automáticamente
- **AND** el nuevo préstamo aparece en la lista
