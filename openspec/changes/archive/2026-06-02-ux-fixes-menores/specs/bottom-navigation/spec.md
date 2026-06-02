## MODIFIED Requirements

### Requirement: Bottom navigation component includes all primary navigation items
The app SHALL provide bottom navigation that includes all primary navigation items.
Navigation entries for Zonas SHALL lead to the Clientes view pre-filtered by zone when a zone is selected, not to the Préstamos view.

#### Scenario: Tap en zona navega a clientes de esa zona
- **WHEN** el usuario toca la card de una zona
- **THEN** la app navega a `/clientes?zona=<id>` mostrando los clientes de esa zona
- **AND** el botón de acción redundante "Ver Clientes" no aparece en la card

#### Scenario: Bottom nav items presentes
- **WHEN** el usuario ve la barra de navegación inferior
- **THEN** se muestran los ítems Inicio, Clientes, Zonas, Reportes, Tablero y Usuarios
