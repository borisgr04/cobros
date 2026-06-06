## Why

Actualmente las entidades de negocio (Prestamo, Pago, Cliente, Zona) no registran quién las creó ni quién las modificó, ni guardan historial de cambios. Cuando ocurre un error operativo o una disputa con un cliente, no hay forma de rastrear qué usuario realizó cada acción ni qué valores tenían los campos antes del cambio.

## What Changes

- Se introduce una tabla `AuditLog` que registra automáticamente cada operación `INSERT`, `UPDATE` y `DELETE` sobre las entidades auditables.
- Cada registro de auditoría captura: entidad, ID del registro, tipo de operación, usuario responsable, fecha/hora UTC, y un snapshot JSON con los valores anteriores y nuevos del registro.
- Las entidades auditables implementan una interfaz `IAuditable` que las marca para ser interceptadas por el `DbContext`.
- El `DbContext` sobreescribe `SaveChangesAsync` para inyectar la auditoría de forma transparente, sin requerir cambios en controllers ni services.
- **BREAKING**: Se añaden columnas de auditoría básica (`CreadoEn`, `CreadoPorId`, `ModificadoEn`, `ModificadoPorId`) directamente en las entidades auditables como campos de primer nivel, además de la tabla de historial.

## Capabilities

### New Capabilities

- `auditoria-registro`: Registro automático de cambios en entidades de negocio con historial completo (valores anteriores y nuevos en JSON), usuario responsable y timestamp UTC.

### Modified Capabilities

<!-- No hay specs existentes cuyas REQUISITOS cambien. El cambio es puramente aditivo en el modelo de datos. -->

## Impact

- **Backend — Modelos**: `Prestamo`, `Pago`, `Cliente`, `Zona` implementan `IAuditable`.
- **Backend — DbContext**: `CobrosDbContext.SaveChangesAsync` intercepta cambios y escribe en `AuditLog`; se inyecta `IHttpContextAccessor` para resolver el usuario activo.
- **Backend — Nueva entidad**: `AuditLog` + `DbSet<AuditLog>` en el contexto.
- **Base de datos**: 1 migración EF Core que agrega columnas de auditoría en tablas existentes y crea la tabla `AuditLog`.
- **Dependencias**: `System.Text.Json` (ya disponible en .NET 8) para serializar snapshots; `Microsoft.AspNetCore.Http.Abstractions` para `IHttpContextAccessor`.
- **Sin impacto en frontend**: el cambio es completamente invisible para la capa Angular.
