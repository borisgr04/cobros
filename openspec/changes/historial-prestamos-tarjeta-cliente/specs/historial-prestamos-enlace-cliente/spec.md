## ADDED Requirements

### Requirement: Botón "Ver Préstamos" en tarjeta de detalle del cliente
El sistema SHALL mostrar un botón o icono "Ver Préstamos" en la tarjeta de detalle del cliente que, al ser accionado, navegue a la vista de Gestión de Préstamos filtrada por ese cliente, con posibilidad de regresar al detalle del cliente.

#### Scenario: Botón visible en la tarjeta del cliente
- **WHEN** el usuario está en el detalle de un cliente
- **THEN** la tarjeta muestra un botón "Ver Préstamos" con el conteo de préstamos activos del cliente como badge

#### Scenario: Navegación a préstamos del cliente
- **WHEN** el usuario hace clic en el botón "Ver Préstamos"
- **THEN** el sistema navega a `/prestamos?clienteId=<id>&returnTo=/clientes/<id>`
- **AND** la lista de préstamos muestra únicamente los préstamos de ese cliente
- **AND** el chip de filtro de cliente es visible

#### Scenario: La sección de préstamos inline no aparece en la tarjeta del cliente
- **WHEN** el usuario está en el detalle de un cliente
- **THEN** no se muestra una lista de préstamos embebida en la página
- **AND** no se muestran modales de pago ni de registro de préstamo en esa vista
