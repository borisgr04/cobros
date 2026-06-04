## 1. Backend — Modelo y DTOs

- [ ] 1.1 Eliminar propiedades `CuentaBancaria` y `Llave` del modelo `Models/Cliente.cs`
- [ ] 1.2 Eliminar propiedades `CuentaBancaria` y `Llave` de `ClienteDto` en `DTOs/Dtos.cs`
- [ ] 1.3 Eliminar propiedades `CuentaBancaria` y `Llave` de `CreateClienteDto` en `DTOs/Dtos.cs`
- [ ] 1.4 Eliminar propiedades `CuentaBancaria` y `Llave` de `UpdateClienteDto` en `DTOs/Dtos.cs`

## 2. Backend — Controller de Clientes

- [ ] 2.1 Eliminar asignaciones `CuentaBancaria` y `Llave` en el método `ToDto` de `ClientesController.cs`
- [ ] 2.2 Eliminar asignaciones `CuentaBancaria` y `Llave` en los métodos `Post` y `Put` de `ClientesController.cs`

## 3. Backend — Consulta Pública

- [ ] 3.1 Cambiar la firma del action a `[HttpGet("{id:int}")]` con parámetro `int id` en `ConsultaPublicaController.cs`
- [ ] 3.2 Eliminar la lógica de búsqueda dual (`c.Llave == llave || ...`); buscar únicamente por `c.Id == id`
- [ ] 3.3 Actualizar el comentario XML del action para reflejar que se busca por `id`

## 4. Backend — Migración de Base de Datos

- [ ] 4.1 Generar migración EF Core: `dotnet ef migrations add RemoveLlaveYCuentaBancaria --project CobrosApi`
- [ ] 4.2 Verificar que la migración generada contiene `DropColumn` para `llave` y `cuenta_bancaria` en la tabla `Clientes`
- [ ] 4.3 Aplicar la migración en el entorno de desarrollo: `dotnet ef database update`

## 5. Backend — Tests

- [ ] 5.1 Actualizar `SecurityAuthorizationTests.cs`: cambiar la URL de prueba de `/api/consulta/llave-no-existe` a `/api/consulta/999999`
- [ ] 5.2 Ejecutar suite de tests y verificar que no hay regresiones: `dotnet test`

## 6. Frontend — Modelo de dominio

- [ ] 6.1 Eliminar propiedades `cuentaBancaria` y `llave` de la interfaz `ICliente` en `features/core/models/cliente.model.ts`

## 7. Frontend — Servicios mock

- [ ] 7.1 Eliminar los valores de `cuentaBancaria` en todos los clientes del mock en `features/clientes/services/cliente-mock.service.ts`

## 8. Frontend — Ruta de consulta pública

- [ ] 8.1 Renombrar el parámetro de ruta de `consulta/:llave` a `consulta/:id` en `app.routes.ts`
- [ ] 8.2 Actualizar `consulta-publica.component.ts`: cambiar `paramMap.get('llave')` a `paramMap.get('id')` y la propiedad `llave` interna a `clienteId` (o `id`)

## 9. Frontend — Componentes con URL de consulta

- [ ] 9.1 `recoger-prestamo-modal.component.ts`: reemplazar `p.cliente.llave || p.cliente.id` por `p.cliente.id`
- [ ] 9.2 `pronto-pago-modal.component.ts`: reemplazar `p.cliente.llave || p.cliente.id` por `p.cliente.id`
- [ ] 9.3 `registro-pago-modal.component.ts`: reemplazar `p.cliente.llave || p.cliente.id` por `p.cliente.id`
- [ ] 9.4 `registro-prestamo-modal.component.ts`: reemplazar `cliente.llave || cliente.id` por `cliente.id`
- [ ] 9.5 `clientes.component.ts`: reemplazar `(cliente as any).llave || cliente.id` por `cliente.id`
- [ ] 9.6 `cliente-detalle.component.ts`: reemplazar `(c as any).llave || c.id` por `c.id`

## 10. Frontend — Formularios de cliente

- [ ] 10.1 Identificar y eliminar los campos `llave` y `cuentaBancaria` del formulario de creación de cliente
- [ ] 10.2 Identificar y eliminar los campos `llave` y `cuentaBancaria` del formulario de edición de cliente
- [ ] 10.3 Eliminar cualquier binding, control de formulario o validación asociada a esos campos en los componentes correspondientes

## 11. Verificación final

- [ ] 11.1 Ejecutar `ng build` y verificar que no hay errores de compilación TypeScript
- [ ] 11.2 Probar manualmente el flujo de consulta pública: navegar a `/consulta/{id}` con un id válido y verificar que muestra datos correctos
- [ ] 11.3 Probar la creación y edición de un cliente en la UI: verificar que los campos eliminados no aparecen
