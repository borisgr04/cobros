## ADDED Requirements

### Requirement: Endpoints operativos protegidos por autenticación
Los endpoints operativos de APIs internas SHALL requerir autenticación y autorización según política definida.

#### Scenario: Acceso no autenticado a endpoint operativo
- **WHEN** una solicitud sin token válido accede a endpoint operativo protegido
- **THEN** la API responde código de no autorizado
- **AND** no expone datos operativos

#### Scenario: Auditoría de protección de controllers operativos
- **WHEN** se ejecuta validación de seguridad del backend
- **THEN** se verifica que controllers operativos tienen protección activa
- **AND** se reportan explícitamente excepciones públicas intencionales
