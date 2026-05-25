## MODIFIED Requirements

### Requirement: Stack tecnológico
El proyecto usa un stack fijo que no debe cambiarse salvo cambio de arquitectura explícito.

#### Scenario: Stack backend
- **WHEN** se implementa lógica de servidor
- **THEN** usar .NET 8, ASP.NET Core, Entity Framework Core con Npgsql (PostgreSQL)
- **AND** autenticación con JWT ******
- **AND** refresh tokens opacos almacenados en BD con rotación
- **AND** WebAuthn/FIDO2 con Fido2NetLib para autenticación biométrica
- **AND** patrón Controller con inyección de dependencias por constructor primario

#### Scenario: Stack frontend
- **WHEN** se implementa lógica de cliente
- **THEN** usar Angular (versión actual del proyecto) con Signals para estado reactivo
- **AND** SCSS para estilos, standalone components
- **AND** @angular/pwa para service worker y manifest PWA
- **AND** Web Authentication API nativa del navegador para biometría (sin librerías adicionales)
- **AND** NO usar NgRx ni otras librerías de estado externas
