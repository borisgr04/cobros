## Why

`PagosController.Create` contiene ~70 líneas de lógica de negocio (validar préstamo no cerrado, cargar cuotas pendientes, validar que el abono no supere el saldo, crear el `Pago`, distribuir en cuotas, crear `AplicacionCuota`, manejar la transacción). `PagosController.Anular` tiene ~50 líneas similares. Esta lógica vive dentro del controlador HTTP, no puede ser invocada desde otras operaciones (pronto pago en Fase 3 necesitará el mismo mecanismo de distribución), y las pruebas deben pasar por la capa HTTP completa. La extracción a casos de uso independientes abre el camino a Fase 3 sin duplicación.

## What Changes

- Nuevo: `CobrosApi/Features/Pagos/AplicarPago.cs` — handler de caso de uso que recibe `CobrosDbContext` vía primary constructor; su `ExecuteAsync` ejecuta validaciones, distribución de abono, creación de `Pago` y `AplicacionCuota`
- Nuevo: `CobrosApi/Features/Pagos/AnularPago.cs` — handler simétrico para reversión, con las mismas reglas de integridad
- Nuevo: `CobrosApi/Features/Pagos/PagosRules.cs` — validaciones de negocio estáticas: `PrestamoAceptaPagos`, `EsUltimoPagoActivo`
- Nuevo: `CobrosApi/Features/Shared/Result.cs` — tipo `Result<T>` propio (Error / Success) usado por todos los handlers
- `PagosController.Create` y `Anular` delegan en los handlers — sin cambio de contrato HTTP

## Capabilities

### New Capabilities

- `aplicar-pago-caso-uso`: Handler `AplicarPago` ejecutable independientemente del controlador HTTP; encapsula distribución de abono, validaciones de negocio y persistencia
- `anular-pago-caso-uso`: Handler `AnularPago` simétrico; encapsula reversión de cuotas y validaciones de la regla "solo se puede anular el pago más reciente"

### Modified Capabilities

- `registro-pago`: El controlador `PagosController` ahora delega la lógica al handler `AplicarPago`; el contrato HTTP externo (`POST /api/pagos`, HTTP 201, cuerpo `PagoDto`) no cambia

## Impact

- `backend/CobrosApi/Controllers/PagosController.cs` — reducido a delegación HTTP
- Nuevos: `CobrosApi/Features/Pagos/AplicarPago.cs`, `AnularPago.cs`, `PagosRules.cs`
- Nuevo: `CobrosApi/Features/Shared/Result.cs`
- `backend/CobrosApi/Program.cs` — registrar `AplicarPago` y `AnularPago` en el contenedor DI
- Sin cambios en contratos de API
- **Prerrequisito**: Fase 1 completada (los handlers usan `PrestamoEstados.*`)
