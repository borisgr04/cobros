## Why

Los campos `llave` y `cuentaBancaria` del modelo `Cliente` nunca fueron adoptados en la operación real del negocio: no se capturan, no se validan y no tienen uso funcional. Adicionalmente, la ruta de consulta pública `GET /api/consulta/{llave}` usa el nombre de parámetro "llave" pero en la práctica el frontend ya envía el `id` numérico del cliente, generando confusión y deuda técnica.

## What Changes

- **BREAKING** Eliminar las columnas `llave` y `cuenta_bancaria` de la tabla `Clientes` en la base de datos (nueva migración EF Core).
- Simplificar `GET /api/consulta/{id}` para que el parámetro de ruta sea explícitamente `id` (entero) en lugar de `llave` (string), eliminando la lógica de búsqueda dual.
- Eliminar las propiedades `Llave` y `CuentaBancaria` del modelo `Cliente` (.NET) y de todos los DTOs de clientes.
- Eliminar los campos `llave` y `cuentaBancaria` del modelo `ICliente` de Angular y de los formularios de creación y edición de clientes.
- Simplificar la generación de URLs de consulta pública en el frontend: siempre usar `cliente.id` directamente (eliminar el fallback `cliente.llave || cliente.id`).

## Capabilities

### New Capabilities

*(ninguna)*

### Modified Capabilities

- `registro-prestamo-campos-manuales`: El modelo `ICliente` usado en el contexto del préstamo ya no tendrá `llave`; la URL de consulta pública se genera con `cliente.id`.
- `recoger-prestamo-notificacion`: La URL de WhatsApp de consulta pública se construía con `p.cliente.llave || p.cliente.id`; ahora siempre es `p.cliente.id`.
- `pronto-pago-notificacion`: Igual que `recoger-prestamo-notificacion`, URL de consulta con `p.cliente.llave || p.cliente.id` → `p.cliente.id`.
- `registro-pago`: URL de consulta pública construida con `p.cliente.llave || p.cliente.id` → `p.cliente.id`.

## Impact

- **Backend**: `Models/Cliente.cs`, `DTOs/Dtos.cs`, `Controllers/ConsultaPublicaController.cs`, `Controllers/ClientesController.cs`, nueva migración EF Core.
- **Base de datos**: DROP COLUMN `llave` y `cuenta_bancaria` en la tabla `Clientes` (requiere migración y ejecución en producción).
- **Frontend Angular**: `features/core/models/cliente.model.ts`, formularios de creación/edición de clientes, 4 componentes que generan URLs de consulta pública, ruta `consulta/:llave` → `consulta/:id`, `consulta-publica.component.ts`, `cliente-mock.service.ts`.
- **Tests**: `SecurityAuthorizationTests.cs` usa la ruta `/api/consulta/llave-no-existe`; deberá actualizarse para usar un id numérico.
