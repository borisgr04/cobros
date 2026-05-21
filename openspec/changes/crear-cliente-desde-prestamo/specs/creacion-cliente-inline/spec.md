## ADDED Requirements

### Requirement: Crear cliente inline desde el formulario de préstamo
El sistema SHALL permitir al usuario crear un nuevo cliente directamente desde el modal de registro de préstamo, sin abandonar el flujo.

#### Scenario: Abrir formulario de nuevo cliente
- **WHEN** el usuario hace clic en el botón "+ Nuevo cliente" junto al selector de cliente
- **THEN** el sistema muestra un mini-formulario inline con campos: Nombre, Identificación, Zona y Teléfono (opcional)
- **AND** el selector de cliente queda oculto mientras el formulario está activo

#### Scenario: Crear cliente exitosamente
- **WHEN** el usuario completa los campos requeridos (Nombre, Identificación, Zona) y confirma
- **THEN** el sistema llama a `POST /api/clientes` con los datos ingresados
- **AND** el nuevo cliente queda seleccionado automáticamente en el selector de cliente
- **AND** el mini-formulario colapsa y el selector vuelve a ser visible
- **AND** el nuevo cliente aparece en la lista del selector

#### Scenario: Cancelar creación de cliente
- **WHEN** el usuario hace clic en "Cancelar" dentro del mini-formulario
- **THEN** el mini-formulario colapsa sin realizar ninguna llamada al backend
- **AND** el selector de cliente vuelve a su estado anterior

#### Scenario: Error al crear cliente (identificación duplicada)
- **WHEN** el backend retorna error (ej. 409 identificación duplicada o 400 validación)
- **THEN** el sistema muestra el mensaje de error dentro del mini-formulario
- **AND** no se cierra el formulario ni se modifica el selector

#### Scenario: Sin zonas disponibles
- **WHEN** el usuario abre el mini-formulario y no existen zonas en el sistema
- **THEN** el sistema muestra un mensaje indicando que no hay zonas disponibles
- **AND** el botón de guardar queda deshabilitado
