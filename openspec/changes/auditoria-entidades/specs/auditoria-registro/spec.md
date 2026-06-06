## ADDED Requirements

### Requirement: Registro automático de auditoría en operaciones de escritura
El sistema SHALL registrar automáticamente en la tabla `AuditLog` cada operación INSERT, UPDATE y DELETE realizada sobre entidades que implementen `IAuditable`, como parte de la misma transacción de base de datos.

#### Scenario: Creación de un préstamo genera registro de auditoría
- **WHEN** un usuario autenticado crea un nuevo préstamo
- **THEN** se inserta un registro en `AuditLog` con `Operacion = "Created"`, `Entidad = "Prestamo"`, `EntidadId` igual al ID del préstamo creado, `UsuarioId` del usuario autenticado, `FechaUtc` igual al momento UTC de la operación, `AnteriorJson = null` y `NuevoJson` con el estado escalar del préstamo creado

#### Scenario: Modificación de un cliente genera registro de auditoría
- **WHEN** un usuario autenticado modifica datos de un cliente existente
- **THEN** se inserta un registro en `AuditLog` con `Operacion = "Updated"`, `AnteriorJson` con los valores escalares previos del cliente y `NuevoJson` con los valores escalares nuevos

#### Scenario: Eliminación de una entidad auditable genera registro
- **WHEN** se elimina una entidad que implementa `IAuditable`
- **THEN** se inserta un registro en `AuditLog` con `Operacion = "Deleted"`, `AnteriorJson` con el estado escalar previo y `NuevoJson = null`

#### Scenario: Operación sin usuario autenticado (sistema)
- **WHEN** una operación de escritura se ejecuta fuera de un contexto HTTP (migraciones, seeds, jobs)
- **THEN** se inserta el registro de auditoría con `UsuarioId = null` sin lanzar excepción

---

### Requirement: Columnas de auditoría básica en entidades auditables
Cada entidad que implemente `IAuditable` SHALL exponer las propiedades `CreadoEn` (DateTime UTC), `CreadoPorId` (int? FK a Usuario), `ModificadoEn` (DateTime UTC) y `ModificadoPorId` (int? FK a Usuario), que el sistema mantendrá automáticamente en cada operación de escritura.

#### Scenario: Creación de entidad auditable rellena CreadoEn y CreadoPorId
- **WHEN** se persiste una nueva entidad auditable
- **THEN** `CreadoEn` queda con la fecha/hora UTC del momento de inserción y `CreadoPorId` queda con el ID del usuario autenticado (o null si no hay contexto HTTP)

#### Scenario: Modificación de entidad auditable actualiza ModificadoEn y ModificadoPorId
- **WHEN** se persiste un cambio sobre una entidad auditable existente
- **THEN** `ModificadoEn` se actualiza a la fecha/hora UTC actual y `ModificadoPorId` al ID del usuario autenticado

#### Scenario: CreadoEn y CreadoPorId no se sobreescriben en updates
- **WHEN** se actualiza una entidad auditable
- **THEN** `CreadoEn` y `CreadoPorId` conservan los valores originales de la creación

---

### Requirement: Snapshot JSON no incluye propiedades de navegación
El sistema SHALL serializar únicamente propiedades escalares (no colecciones ni entidades relacionadas) en los campos `AnteriorJson` y `NuevoJson` del `AuditLog`, para evitar ciclos de referencia y ruido en el historial.

#### Scenario: Serialización de Prestamo excluye entidad Cliente
- **WHEN** se audita un cambio en un préstamo que tiene la propiedad de navegación `Cliente` cargada en memoria
- **THEN** `NuevoJson` contiene solo los campos escalares del préstamo (Id, ClienteId, ValorPrestado, etc.) y no incluye el objeto `Cliente` anidado
