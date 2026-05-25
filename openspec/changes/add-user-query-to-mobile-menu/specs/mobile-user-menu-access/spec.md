## ADDED Requirements

### Requirement: Mobile users can access user query feature from bottom navigation
The mobile bottom navigation component SHALL include a "Usuarios" menu item that allows users to navigate to the user query/consultation feature, providing feature parity with the desktop sidebar navigation.

#### Scenario: User navigates to Usuarios from mobile menu
- **WHEN** a mobile user clicks the "Usuarios" item in the bottom navigation menu
- **THEN** the application navigates to the `/usuarios` route and displays the user query page

#### Scenario: Active state indicator on Usuarios menu item
- **WHEN** a user is on the `/usuarios` page and viewing the mobile bottom navigation
- **THEN** the "Usuarios" menu item is highlighted with the active state styling to indicate the current location

#### Scenario: Usuarios menu item has correct icon and label
- **WHEN** the mobile bottom navigation renders
- **THEN** the "Usuarios" menu item displays the person-gear icon (`bi-person-gear`) and the label "Usuarios"

#### Scenario: Menu item persists across navigation
- **WHEN** a user navigates away from `/usuarios` and then clicks the "Usuarios" menu item again
- **THEN** the menu item remains functional and the navigation works correctly
