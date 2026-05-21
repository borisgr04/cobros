# Spec: Arquitectura y Convenciones del Proyecto

## Requirements

### Requirement: Stack tecnológico
El proyecto usa un stack fijo que no debe cambiarse salvo cambio de arquitectura explícito.

#### Scenario: Stack backend
- **WHEN** se implementa lógica de servidor
- **THEN** usar .NET 8, ASP.NET Core, Entity Framework Core con Npgsql (PostgreSQL)
- **AND** autenticación con JWT Bearer (Microsoft.AspNetCore.Authentication.JwtBearer)
- **AND** patrón Controller con inyección de dependencias por constructor primario

#### Scenario: Stack frontend
- **WHEN** se implementa lógica de cliente
- **THEN** usar Angular (versión actual del proyecto) con Signals para estado reactivo
- **AND** SCSS para estilos, standalone components
- **AND** NO usar NgRx ni otras librerías de estado externas

### Requirement: Modelos y DTOs en el backend
El backend separa modelos de dominio (carpeta `Models/`) de objetos de transferencia (carpeta `DTOs/Dtos.cs`).

#### Scenario: Agregar una nueva entidad
- **WHEN** se agrega una nueva entidad al dominio
- **THEN** crear el modelo en `Models/<Entidad>.cs` con Data Annotations para validación
- **AND** registrar el `DbSet<Entidad>` en `CobrosDbContext`
- **AND** crear los DTOs correspondientes en `DTOs/Dtos.cs` (nunca exponer el modelo directamente)
- **AND** crear la migración EF Core correspondiente

#### Scenario: Relaciones entre entidades
- **WHEN** se define una FK entre entidades
- **THEN** usar `[ForeignKey(nameof(PropiedadId))]` en la navigation property
- **AND** las colecciones se inicializan como `[]` (collection expression)

### Requirement: Controllers en el backend
Los controllers siguen el patrón establecido en el proyecto.

#### Scenario: Implementar un endpoint
- **WHEN** se implementa un nuevo endpoint
- **THEN** usar `[ApiController]`, `[Route("api/<recurso>")]`, `[Authorize]` y `[Produces("application/json")]`
- **AND** retornar siempre `IActionResult` con `ProducesResponseType` documentado
- **AND** usar `ErrorDto` para respuestas de error: `new ErrorDto { Error = "mensaje" }`
- **AND** mapear entidades a DTOs con un método estático privado `ToDto(Entidad e)`

### Requirement: Tests de integración
Los tests usan `WebApplicationFactory` con base de datos in-memory.

#### Scenario: Agregar un test de integración
- **WHEN** se agrega un test al proyecto `CobrosApi.Tests`
- **THEN** usar `CobrosWebAppFactory` de `Helpers/` para el cliente HTTP
- **AND** usar `AuthHelper` de `Helpers/` para obtener tokens JWT en tests autenticados
- **AND** los tests se organizan en `Controllers/<Entidad>Tests.cs`

### Requirement: Migraciones sin romper backward-compatibility
Las migraciones deben ser aditivas cuando sea posible para no bloquear deployments.

#### Scenario: Agregar columna a tabla existente
- **WHEN** se agrega una columna nueva a una tabla existente
- **THEN** la columna debe ser nullable o tener un valor por defecto para no romper registros existentes
- **AND** documentar en el design.md si hay script de datos necesario para poblar la columna en registros existentes
