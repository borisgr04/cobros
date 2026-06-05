## MODIFIED Requirements

### Requirement: Bottom navigation component includes all primary navigation items
The app SHALL provide bottom navigation that includes all primary navigation items.
Navigation entries for Zonas SHALL lead to la vista de Clientes pre-filtrada por zona cuando se selecciona una zona, no a la vista de Préstamos.
El ítem "Reportes" SHALL renderizarse visualmente idéntico a los demás ítems de navegación (mismo color, misma barra indicadora activa, misma tipografía) independientemente de si su elemento HTML es `<a>` o `<button>`.

#### Scenario: Bottom navigation displays all menu items
- **WHEN** the bottom navigation component renders on a mobile device
- **THEN** it displays menu items for Inicio, Clientes, Zonas, Reportes, Tablero, and Usuarios

#### Scenario: Tap en zona navega a clientes de esa zona
- **WHEN** el usuario toca la card de una zona
- **THEN** la app navega a `/clientes?zona=<id>` mostrando los clientes de esa zona
- **AND** el botón de acción redundante "Ver Clientes" no aparece en la card

#### Scenario: Each menu item links to correct route
- **WHEN** a user clicks any menu item in the bottom navigation
- **THEN** the application navigates to the correct route and the menu item shows active state

#### Scenario: Menu items render with correct icons and labels
- **WHEN** the bottom navigation renders
- **THEN** each menu item displays the appropriate icon and Spanish language label

#### Scenario: User profile button remains separate from navigation items
- **WHEN** the bottom navigation renders
- **THEN** the user profile button appears after all navigation items with its own styling

#### Scenario: Ítem Reportes (button) tiene mismo resaltado activo que ítems de tipo enlace
- **WHEN** la URL actual comienza con `/reportes`
- **THEN** el ítem Reportes en la bottom nav muestra exactamente el mismo color de texto y barra indicadora superior que los ítems Inicio, Clientes, Zonas y Usuarios cuando están activos
- **AND** no se observa ningún borde, fondo o padding diferenciador proveniente de estilos por defecto del navegador para `<button>`

## ADDED Requirements

### Requirement: Sidebar de escritorio incluye acceso a Cierre del Día
La sidebar SHALL incluir un ítem de navegación para `/reportes/cierre-dia` con etiqueta "Cierre del Día" e icono de calendario, permitiendo acceder a esa pantalla desde la versión web/escritorio sin necesidad de teclear la URL.

#### Scenario: Cierre del Día aparece en el sidebar de escritorio
- **WHEN** el usuario está autenticado y visualiza la aplicación en escritorio
- **THEN** la sidebar muestra un ítem "Cierre del Día" que navega a `/reportes/cierre-dia`

#### Scenario: Cierre del Día queda activo al estar en esa ruta
- **WHEN** la URL actual es `/reportes/cierre-dia`
- **THEN** el ítem "Cierre del Día" en la sidebar muestra estado activo
- **AND** el ítem "Reportes" de la sidebar NO muestra estado activo simultáneamente

#### Scenario: Reportes y Cierre del Día son ítems independientes en el sidebar
- **WHEN** la URL actual es `/reportes`
- **THEN** sólo el ítem "Reportes" muestra estado activo
- **AND** el ítem "Cierre del Día" no muestra estado activo
