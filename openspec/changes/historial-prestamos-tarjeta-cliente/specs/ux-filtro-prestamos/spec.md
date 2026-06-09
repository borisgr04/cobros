## ADDED Requirements

### Requirement: Botón "Volver al Cliente" cuando se navega desde el detalle del cliente
Cuando el usuario llega a Gestión de Préstamos con el query param `returnTo` apuntando a un detalle de cliente, el sistema SHALL mostrar un botón "Volver al Cliente" que regrese a esa ruta.

#### Scenario: Botón visible al navegar desde detalle del cliente
- **WHEN** el usuario navega a `/prestamos` con los params `clienteId` y `returnTo=/clientes/<id>`
- **THEN** aparece un botón "Volver al Cliente" junto al chip de filtro o en el encabezado de la sección
- **AND** el filtro de cliente está activo mostrando solo los préstamos de ese cliente

#### Scenario: Botón "Volver al Cliente" regresa al detalle
- **WHEN** el usuario hace clic en "Volver al Cliente"
- **THEN** el sistema navega a la ruta indicada en `returnTo`

#### Scenario: Sin returnTo no aparece el botón de volver
- **WHEN** el usuario llega a `/prestamos?clienteId=<id>` sin el param `returnTo`
- **THEN** el chip de filtro de cliente es visible
- **AND** no aparece el botón "Volver al Cliente"
