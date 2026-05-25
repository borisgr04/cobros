# bottom-navigation

## Purpose

Display all primary navigation items in the mobile bottom navigation component to ensure feature parity between mobile and desktop interfaces.

## Requirements

### Requirement: Bottom navigation component includes all primary navigation items
The mobile bottom navigation component SHALL display all primary navigation items including home, clients, zones, reports, dashboard, and users, ensuring feature parity with the desktop sidebar navigation.

#### Scenario: Bottom navigation displays all menu items
- **WHEN** the bottom navigation component renders on a mobile device
- **THEN** it displays menu items for Inicio, Clientes, Zonas, Reportes, Tablero, and Usuarios

#### Scenario: Each menu item links to correct route
- **WHEN** a user clicks any menu item in the bottom navigation
- **THEN** the application navigates to the correct route and the menu item shows active state

#### Scenario: Menu items render with correct icons and labels
- **WHEN** the bottom navigation renders
- **THEN** each menu item displays the appropriate icon and Spanish language label

#### Scenario: User profile button remains separate from navigation items
- **WHEN** the bottom navigation renders
- **THEN** the user profile button appears after all navigation items with its own styling
