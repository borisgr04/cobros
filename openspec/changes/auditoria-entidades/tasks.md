## 1. Interfaz y entidad AuditLog

- [ ] 1.1 Crear `IAuditable` en `Models/` con propiedades `CreadoEn`, `CreadoPorId`, `ModificadoEn`, `ModificadoPorId`
- [ ] 1.2 Crear `AuditLog` en `Models/` con propiedades `Id`, `Entidad`, `EntidadId`, `Operacion`, `UsuarioId`, `FechaUtc`, `AnteriorJson`, `NuevoJson`

## 2. Entidades auditables

- [ ] 2.1 `Prestamo` implementa `IAuditable` (añadir las 4 propiedades)
- [ ] 2.2 `Pago` implementa `IAuditable`
- [ ] 2.3 `Cliente` implementa `IAuditable`
- [ ] 2.4 `Zona` implementa `IAuditable`
- [ ] 2.5 `NovedadPrestamo` implementa `IAuditable` (reemplaza el `UsuarioId` manual con las propiedades estándar)

## 3. DbContext

- [ ] 3.1 Añadir `DbSet<AuditLog>` en `CobrosDbContext`
- [ ] 3.2 Inyectar `IHttpContextAccessor` en el constructor de `CobrosDbContext`
- [ ] 3.3 Implementar método privado `ObtenerUsuarioActualId()` que extrae el claim `sub`/`nameid` del contexto HTTP y retorna `int?`
- [ ] 3.4 Sobreescribir `SaveChangesAsync`: antes de base, detectar entradas `IAuditable` con estado `Added`/`Modified`/`Deleted`, rellenar columnas de auditoría básica y construir registros `AuditLog` con snapshot JSON (serialización solo de propiedades escalares con `ReferenceHandler.IgnoreCycles`)
- [ ] 3.5 Añadir configuración de `AuditLog` en `OnModelCreating` (índices en `Entidad + EntidadId` y en `UsuarioId`)

## 4. Program.cs

- [ ] 4.1 Registrar `builder.Services.AddHttpContextAccessor()` en `Program.cs`

## 5. Migración

- [ ] 5.1 Generar migración EF Core (`dotnet ef migrations add AddAuditoria`)
- [ ] 5.2 Revisar el script generado: verificar columnas en tablas existentes y creación de tabla `AuditLog`
- [ ] 5.3 Aplicar migración (`dotnet ef database update`)

## 6. Verificación

- [ ] 6.1 Crear un préstamo desde la app y consultar la tabla `AuditLog` para confirmar el registro Created
- [ ] 6.2 Modificar un cliente y verificar registro Updated con `AnteriorJson` y `NuevoJson` correctos
- [ ] 6.3 Verificar que las propiedades de navegación no aparecen en los snapshots JSON
- [ ] 6.4 Verificar que `CreadoEn` / `CreadoPorId` se preservan en una actualización posterior
