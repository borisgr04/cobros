## Context

El sistema gestiona préstamos, pagos y clientes sin ningún rastro de quién realizó cada operación. Cuando ocurre un error o disputa, no hay forma de saber qué usuario creó un préstamo, registró un pago o modificó un cliente, ni cuál era el estado previo del registro.

Las únicas entidades con datos de auditoría parciales son `NovedadPrestamo` (tiene `UsuarioId` y `FechaNovedad`) y `Usuario`/`RefreshToken`/`WebAuthnCredential` (tienen `CreadoEn`/`CreatedAt`). Las entidades de negocio críticas (`Prestamo`, `Pago`, `Cliente`, `Zona`) no tienen nada.

El stack es .NET 8 con EF Core sobre PostgreSQL (Supabase). El usuario autenticado viaja en un JWT cuyo claim `sub` contiene el `UsuarioId`.

## Goals / Non-Goals

**Goals:**
- Registrar automáticamente en una tabla `AuditLog` cada INSERT, UPDATE y DELETE sobre entidades de negocio auditables.
- Capturar en cada registro: entidad, ID, tipo de operación (Created/Updated/Deleted), usuario responsable, timestamp UTC, valores anteriores (JSON) y valores nuevos (JSON).
- Añadir columnas de auditoría rápida (`CreadoEn`, `CreadoPorId`, `ModificadoEn`, `ModificadoPorId`) directamente en las entidades auditables para consultas sin JOIN.
- Hacerlo transparente: cero cambios en controllers ni services.

**Non-Goals:**
- Auditoría de lecturas (solo escrituras).
- UI de auditoría en el frontend (es una capacidad futura).
- Auditoría de entidades técnicas (`RefreshToken`, `WebAuthnCredential`).
- Auditoría de cambios en la tabla `AuditLog` en sí misma.

## Decisions

### D1 — Intercepción en `SaveChangesAsync` vs. triggers de base de datos

**Decisión**: Override de `SaveChangesAsync` en `CobrosDbContext`.

| Opción | Pros | Contras |
|---|---|---|
| Override en DbContext | Código C# mantenible, acceso al contexto HTTP, transaccional con el cambio | Bypass si se usa SQL crudo |
| Triggers en PostgreSQL | Cubre cualquier acceso a la DB | No tiene acceso al usuario de app, difícil de mantener, requiere SQL extra |
| Interceptor de EF Core (`ISaveChangesInterceptor`) | Desacoplado del DbContext | Mayor complejidad sin beneficio extra para este caso |

El override es la opción de menor fricción y cubre el 100% de los accesos del sistema (todo pasa por EF Core).

---

### D2 — Resolución del usuario activo

**Decisión**: Inyectar `IHttpContextAccessor` en el `CobrosDbContext`.

El claim relevante es `"sub"` (o `"nameid"` como lo mapea ASP.NET Core). Se intenta parsear a `int`; si no existe (operaciones de sistema, seeds, migraciones), se guarda `null` en `CreadoPorId`.

---

### D3 — Formato del snapshot de valores

**Decisión**: `System.Text.Json` serializa el estado anterior y nuevo como strings JSON en columnas `AnteriorJson` y `NuevoJson`.

- `AnteriorJson` es `null` en operaciones CREATE.
- `NuevoJson` es `null` en operaciones DELETE.
- Se excluyen de la serialización las propiedades de navegación (objetos relacionados) para evitar ciclos y ruido. Solo se serializa el estado escalar de la entidad.

---

### D4 — Entidades auditables

**Decisión**: Las entidades que implementan `IAuditable` son las de negocio crítico:

| Entidad | Razón |
|---|---|
| `Prestamo` | Operación de mayor valor económico |
| `Pago` | Registro sensible, sujeto a disputas |
| `Cliente` | Datos personales, cambios trazables |
| `Zona` | Cambios de configuración |
| `NovedadPrestamo` | Ya tenía `UsuarioId` parcial; se normaliza |

`Cuota` y `AplicacionCuota` quedan excluidas: son generadas por lógica interna, no por acciones directas de usuario.

---

### D5 — Campos de auditoría en la entidad vs. solo tabla AuditLog

**Decisión**: Ambos. Las columnas `CreadoEn`/`CreadoPorId` en la entidad permiten queries rápidas del tipo "quién creó este préstamo" sin JOIN. La tabla `AuditLog` provee el historial completo.

## Risks / Trade-offs

| Riesgo | Mitigación |
|---|---|
| Overhead de rendimiento en SaveChanges | El overhead es mínimo: serialización JSON liviana solo para entidades IAuditable. Si se vuelve problema, puede convertirse en escritura asíncrona con cola en memoria. |
| Crecimiento ilimitado de la tabla AuditLog | Agregar en el futuro un job de purga o particionamiento por fecha. Por ahora es aceptable para el volumen de la app. |
| SQL crudo (`ExecuteSqlRaw`) no pasa por el interceptor | Revisar que no se use SQL crudo en operaciones sobre entidades auditables. Actualmente no se usa. |
| Serialización circular por propiedades de navegación | Se configuran `JsonSerializerOptions` con `ReferenceHandler.IgnoreCycles` y se ignoran explícitamente las nav-properties. |

## Migration Plan

1. Crear la interfaz `IAuditable` y la entidad `AuditLog`.
2. Hacer que `Prestamo`, `Pago`, `Cliente`, `Zona`, `NovedadPrestamo` implementen `IAuditable`.
3. Modificar `CobrosDbContext`: inyectar `IHttpContextAccessor`, añadir `DbSet<AuditLog>`, sobreescribir `SaveChangesAsync`.
4. Registrar `IHttpContextAccessor` en `Program.cs` (`builder.Services.AddHttpContextAccessor()`).
5. Generar y aplicar migración EF Core.
6. Verificar con prueba manual: crear un préstamo y consultar `AuditLog`.

**Rollback**: Si se debe revertir, la migración EF Core es reversible (`dotnet ef migrations remove` o `Down()`). Las columnas añadidas son nullable donde corresponde, sin impacto en datos existentes.

## Open Questions

- ¿Debe el endpoint de auditoría exponerse en la API (ej. `GET /api/audit?entidad=Prestamo&id=5`) o es suficiente con acceso directo a la DB por ahora? → Se deja para una capacidad futura.
- ¿Se debe auditar el `Usuario` entity también (cambios de nombre, foto)? → Excluido del scope actual por ser poco frecuente.
