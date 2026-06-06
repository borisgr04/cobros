## MODIFIED Requirements

### Requirement: Bottom navigation component includes all primary navigation items
The app SHALL provide bottom navigation that includes all primary navigation items.
Navigation entries for Zonas SHALL lead to the Clientes view pre-filtered by zone when a zone is selected, not to the Préstamos view.
The "Reportes" item SHALL NOT navigate directly to `/reportes`; instead it SHALL open a panel of report options (same visual pattern as the user profile panel).

#### Scenario: Bottom navigation displays all menu items
- **WHEN** the bottom navigation component renders on a mobile device
- **THEN** it displays menu items for Inicio, Clientes, Zonas, Reportes, and Usuarios

#### Scenario: Tap en zona navega a clientes de esa zona
- **WHEN** el usuario toca la card de una zona
- **THEN** la app navega a `/clientes?zona=<id>` mostrando los clientes de esa zona
- **AND** el botón de acción redundante "Ver Clientes" no aparece en la card

#### Scenario: Each menu item links to correct route
- **WHEN** a user clicks any menu item in the bottom navigation (except Reportes)
- **THEN** the application navigates to the correct route and the menu item shows active state

#### Scenario: Menu items render with correct icons and labels
- **WHEN** the bottom navigation renders
- **THEN** each menu item displays the appropriate icon and Spanish language label

#### Scenario: User profile button remains separate from navigation items
- **WHEN** the bottom navigation renders
- **THEN** the user profile button appears after all navigation items with its own styling

## ADDED Requirements

### Requirement: Panel de opciones de reportes en bottom navigation
Al tocar el ítem "Reportes" en la bottom navigation, el sistema SHALL mostrar un panel deslizante con las opciones de reporte disponibles, usando el mismo mecanismo visual que el panel de usuario (overlay + panel con botones de acción).

#### Scenario: Tap en Reportes abre el panel
- **WHEN** el usuario toca el ítem "Reportes" en la bottom navigation
- **THEN** aparece un overlay y un panel con las opciones: "Reportes" y "Cierre del Día"
- **AND** el ítem "Reportes" se muestra como activo mientras el panel está abierto

#### Scenario: Seleccionar opción navega y cierra el panel
- **WHEN** el usuario toca "Reportes" en el panel
- **THEN** la app navega a `/reportes` y el panel se cierra

#### Scenario: Seleccionar cierre del día navega y cierra el panel
- **WHEN** el usuario toca "Cierre del Día" en el panel
- **THEN** la app navega a `/reportes/cierre-dia` y el panel se cierra

#### Scenario: Tap fuera del panel lo cierra
- **WHEN** el panel de reportes está abierto y el usuario toca el overlay
- **THEN** el panel se cierra sin navegar

#### Scenario: Navegar cierra el panel automáticamente
- **WHEN** el panel de reportes está abierto y se produce un evento NavigationEnd
- **THEN** el panel se cierra automáticamente
