## Context

El modelo `Cliente` nació con dos campos opcionales: `llave` (referencia externa/clave de consulta pública) y `cuentaBancaria`. Ninguno de los dos fue adoptado en operación real. El campo `llave` creó además una ambigüedad en el endpoint `GET /api/consulta/{param}`: la ruta tiene nombre de parámetro "llave" pero el frontend siempre envía el `id` numérico del cliente. La lógica de búsqueda dual (`c.Llave == llave || c.Id == idNum`) es innecesaria y puede dar resultados inesperados.

En el frontend, cada componente que genera una URL de consulta pública usa `cliente.llave || cliente.id` como fallback, lo que es dead code.

## Goals / Non-Goals

**Goals:**
- Eliminar `Llave` y `CuentaBancaria` del modelo de datos (.NET y Angular).
- Simplificar `GET /api/consulta/{id}` para aceptar exclusivamente `int id`.
- Eliminar los campos de los formularios de creación y edición de clientes.
- Eliminar el fallback `cliente.llave || cliente.id` en todos los componentes; usar siempre `cliente.id`.
- Actualizar tests afectados.

**Non-Goals:**
- No se crean nuevas funcionalidades de consulta pública.
- No se migran datos existentes de `llave`/`cuentaBancaria` a otro campo.
- No se modifica la lógica de autenticación ni de pagos.

## Decisions

### 1. Parámetro de ruta como `int` en lugar de `string`

**Decisión:** Cambiar `[HttpGet("{llave}")]` a `[HttpGet("{id:int}")]` con parámetro `int id`.

**Alternativa descartada:** Mantener `string` y parsear internamente.

**Razón:** El tipo `int` en la constraint de ruta (`{id:int}`) rechaza automáticamente rutas no numéricas con 404, simplifica el código del action y hace explícito el contrato de la API.

### 2. Nueva migración EF Core para eliminar columnas

**Decisión:** Generar una migración `RemoveLlaveYCuentaBancaria` con `migrationBuilder.DropColumn` para ambas columnas.

**Alternativa descartada:** Modificar la migración inicial existente.

**Razón:** Las migraciones existentes ya están aplicadas en producción; siempre se agrega una nueva migración para cambios destructivos.

### 3. Ruta Angular: `consulta/:llave` → `consulta/:id`

**Decisión:** Renombrar el parámetro de ruta en `app.routes.ts` a `:id` para alinearlo con el backend.

**Razón:** El nombre del parámetro es documentación viva; llamarlo `:id` elimina la confusión actual.

### 4. No introducir campo de reemplazo

**Decisión:** Los campos se eliminan sin reemplazo.

**Razón:** No hay uso funcional actual ni previsto. Si en el futuro se necesita una clave de acceso pública, deberá diseñarse como un requisito nuevo con proper spec.

## Risks / Trade-offs

- [Risk] La migración hace DROP COLUMN de dos columnas, que es irreversible una vez aplicada en producción. → Mitigation: Hacer backup antes de migrar. El rollback de la migración EF Core restaura las columnas si se aplica antes de hacer deployment.
- [Risk] El cambio de ruta Angular de `:llave` a `:id` romperá cualquier enlace de WhatsApp ya compartido (si el valor era el `id` numérico, seguirán funcionando; si era una `llave` string, darán 404). → Mitigation: Los datos reales indican que el campo `llave` nunca fue poblado, por tanto todos los links actuales ya usan el id numérico y seguirán funcionando.
- [Risk] El test `SecurityAuthorizationTests` usa `/api/consulta/llave-no-existe` (string); con el tipo `int` en la constraint, la ruta devolverá 404 por constraint failure, no por "no encontrado". → Mitigation: Actualizar el test para usar un id numérico inexistente (e.g., `/api/consulta/999999`).

## Migration Plan

1. Aplicar nueva migración EF Core (`dotnet ef migrations add RemoveLlaveYCuentaBancaria`).
2. Ejecutar `dotnet ef database update` en producción (previo backup).
3. Desplegar backend con el controller y DTOs actualizados.
4. Desplegar frontend con los modelos y componentes actualizados.

**Rollback:** `dotnet ef database update <migration-anterior>` restaura las columnas; hacer re-deploy de las versiones anteriores de backend y frontend.
