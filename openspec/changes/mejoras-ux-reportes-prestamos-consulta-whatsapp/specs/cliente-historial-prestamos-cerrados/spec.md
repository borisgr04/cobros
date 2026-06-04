## ADDED Requirements

### Requirement: Acceso a historial de préstamos cerrados por cliente
La vista de cliente SHALL ofrecer acceso explícito al historial de préstamos cerrados sin mezclarlos en la lista principal de préstamos activos.

#### Scenario: Lista principal muestra solo activos
- **WHEN** el usuario abre la tarjeta o detalle principal de cliente
- **THEN** visualiza únicamente préstamos en estado activo/mora/vencido
- **AND** los cerrados/completados no aparecen en esa lista principal

#### Scenario: Ver préstamos cerrados
- **WHEN** el usuario selecciona "Ver préstamos cerrados"
- **THEN** el sistema muestra el historial de cerrados
- **AND** los ordena por fecha más reciente primero
