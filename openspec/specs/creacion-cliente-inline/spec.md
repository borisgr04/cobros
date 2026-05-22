### Requirement: Crear cliente inline desde el formulario de préstamo
El sistema SHALL permitir al usuario crear un nuevo cliente directamente desde el modal de registro de préstamo, sin abandonar el flujo. El mini-formulario incluye los campos Nombre (requerido), Alias (opcional), Identificación (requerido, validado en tiempo real), Zona (requerido), y Teléfono (requerido).

#### Scenario: Abrir formulario de nuevo cliente
- **WHEN** el usuario hace clic en el botón "+ Nuevo cliente" junto al selector de cliente
- **THEN** el sistema muestra un mini-formulario inline con campos: Nombre, Alias (opcional), Identificación, Zona y Teléfono
- **AND** el selector de cliente queda oculto mientras el formulario está activo

#### Scenario: Validación de cédula en tiempo real
- **WHEN** el usuario escribe en el campo Identificación del mini-formulario
- **THEN** el sistema verifica en tiempo real si ya existe un cliente con esa identificación en la lista cargada
- **AND** si existe duplicado, muestra un hint "Ya existe un cliente con esta identificación" debajo del campo
- **AND** el botón "Guardar cliente" permanece deshabilitado mientras haya duplicado

#### Scenario: Crear cliente exitosamente
- **WHEN** el usuario completa los campos requeridos (Nombre, Identificación única, Zona, Teléfono) y confirma
- **THEN** el sistema llama a `POST /api/clientes` con los datos ingresados incluyendo Alias si fue completado
- **AND** el nuevo cliente queda seleccionado automáticamente en el selector de cliente
- **AND** el mini-formulario colapsa y el selector vuelve a ser visible
- **AND** el nuevo cliente aparece en la lista del selector

#### Scenario: Cancelar creación de cliente
- **WHEN** el usuario hace clic en "Cancelar" dentro del mini-formulario
- **THEN** el mini-formulario colapsa sin realizar ninguna llamada al backend
- **AND** el selector de cliente vuelve a su estado anterior

#### Scenario: Error al crear cliente
- **WHEN** el backend retorna error al crear el cliente
- **THEN** el sistema muestra el mensaje de error dentro del mini-formulario
- **AND** no se cierra el formulario ni se modifica el selector

#### Scenario: Sin zonas disponibles
- **WHEN** el usuario abre el mini-formulario y no existen zonas en el sistema
- **THEN** el sistema muestra un mensaje indicando que no hay zonas disponibles
- **AND** el botón de guardar queda deshabilitado

### Requirement: Teléfono obligatorio en Gestión de Clientes
El sistema SHALL requerir el campo Teléfono al crear o editar un cliente desde el formulario principal de Gestión de Clientes.

#### Scenario: Guardar cliente sin teléfono
- **WHEN** el usuario intenta guardar un cliente desde Gestión de Clientes sin completar el campo Teléfono
- **THEN** el sistema muestra el mensaje "El teléfono es obligatorio"
- **AND** no se realiza ninguna llamada al backend
- **AND** el formulario permanece abierto

### Requirement: Mensaje de error visible en formulario de Gestión de Clientes
El sistema SHALL mostrar mensajes de error de forma visible en el formulario de Gestión de Clientes cuando ocurra un error al guardar.

#### Scenario: Error al guardar cliente
- **WHEN** ocurre un error al crear o actualizar un cliente desde Gestión de Clientes
- **THEN** el mensaje de error se muestra de forma visible en el formulario activo
- **AND** el formulario permanece abierto para que el usuario corrija los datos
