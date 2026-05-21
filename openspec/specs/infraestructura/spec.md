# Spec: Infraestructura y Configuración del Proyecto

## Requirements

### Requirement: Cadena de conexión via User Secrets (desarrollo)
La cadena de conexión a PostgreSQL se gestiona con **dotnet user secrets** en desarrollo. NO se almacena en `appsettings.json` ni en variables de entorno del sistema en la máquina de desarrollo.

#### Scenario: Obtener la cadena de conexión en desarrollo
- **WHEN** se necesita la cadena de conexión en desarrollo
- **THEN** está disponible vía `dotnet user-secrets list` en el proyecto `CobrosApi`
- **AND** la clave es `ConnectionStrings:DefaultConnection`

### Requirement: Migraciones de Entity Framework Core
Las migraciones EF Core requieren la variable de entorno `ConnectionStrings__DefaultConnection` porque `CobrosDesignTimeDbContextFactory` la lee directamente. User Secrets NO están disponibles en design-time.

#### Scenario: Ejecutar una migración nueva
- **WHEN** se necesita crear o aplicar una migración
- **THEN** se debe establecer la variable de entorno antes de correr `dotnet ef`:
  ```powershell
  # Obtener el valor desde user secrets
  $connStr = (dotnet user-secrets list --project backend/CobrosApi | Select-String "DefaultConnection").ToString().Split('=',2)[1].Trim()
  $env:ConnectionStrings__DefaultConnection = $connStr

  # Crear migración
  dotnet ef migrations add <NombreMigracion> --project backend/CobrosApi

  # Aplicar migración
  dotnet ef database update --project backend/CobrosApi
  ```
- **AND** el directorio de trabajo debe ser la raíz del workspace (`C:\PoC\Cobros`) o el proyecto (`backend/CobrosApi`)

#### Scenario: Modo in-memory para tests
- **WHEN** se ejecutan tests o se corre la API en desarrollo sin PostgreSQL
- **THEN** se usa `"UseInMemoryDb": true` en `appsettings.Development.json`
- **AND** las migraciones EF Core NO son compatibles con InMemory — siempre requieren Npgsql

### Requirement: Configuración por entorno
El proyecto usa el patrón estándar de ASP.NET: `appsettings.json` (base) + `appsettings.Development.json` (override local).

#### Scenario: Valores sensibles en desarrollo
- **WHEN** se agrega un valor sensible (JWT secret, connection string, API keys)
- **THEN** se almacena en user secrets: `dotnet user-secrets set "<clave>" "<valor>" --project backend/CobrosApi`
- **AND** NUNCA se hardcodea en archivos de configuración versionados

### Requirement: Docker Compose para desarrollo
El proyecto incluye `docker-compose.yml` para levantar PostgreSQL localmente.

#### Scenario: Levantar base de datos local
- **WHEN** se necesita PostgreSQL en desarrollo
- **THEN** ejecutar `docker-compose up -d` desde `backend/CobrosApi`

### Requirement: Estructura del workspace
El workspace tiene dos proyectos principales:
- `backend/CobrosApi` — API REST .NET 8
- `backend/CobrosApi.Tests` — Tests de integración xUnit
- `cobros-iu` — Frontend Angular

#### Scenario: Correr el backend
- **WHEN** se necesita correr el backend
- **THEN** ejecutar desde `backend/CobrosApi`: `dotnet run --launch-profile http`

#### Scenario: Correr los tests
- **WHEN** se necesita correr los tests
- **THEN** ejecutar desde `backend/`: `dotnet test`
