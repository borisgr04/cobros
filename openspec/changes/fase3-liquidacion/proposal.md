## Why

`PrestamosController.EjecutarProntoPago` y `EjecutarAmpliacionPlazo` son métodos de ~100 líneas cada uno con lógica de negocio compleja mezclada con HTTP. Además, la lógica de generación de cuotas (`Enumerable.Range(1, N).Select(...)`) está duplicada entre `PrestamosController.Create` y `EjecutarAmpliacionPlazo`. El helper `CalcularFechaCuota` es privado en el controlador e imposible de reutilizar. Esto genera deuda creciente: cualquier cambio en la regla de fechas debe hacerse en dos lugares.

## What Changes

- Nuevo: `CobrosApi/Features/Liquidacion/EjecutarProntoPago.cs` — handler que encapsula toda la lógica del cierre por pronto pago (validaciones, aplicación de cuotas, auditoría, cierre del préstamo)
- Nuevo: `CobrosApi/Features/Liquidacion/EjecutarAmpliacionPlazo.cs` — handler para la ampliación de plazo (cuotas reemplazadas, nuevas cuotas generadas, actualización del préstamo)
- Nuevo: `CobrosApi/Features/Shared/CuotasService.cs` — servicio con `GenerarCuotas(...)` y `CalcularFechaCuota(...)`, eliminando la duplicación entre `Create` y `EjecutarAmpliacionPlazo`
- `PrestamosController` delega en los handlers — sin cambio de contrato HTTP
- `PrestamosController.Create` usa `CuotasService.GenerarCuotas` en lugar de la expresión inline

## Capabilities

### New Capabilities

- `ejecutar-pronto-pago-caso-uso`: Handler independiente para el cierre anticipado de un préstamo mediante pronto pago; encapsula reglas de capital mínimo, cálculo de descuento e intereses futuros
- `ejecutar-ampliacion-plazo-caso-uso`: Handler independiente para la ampliación de plazo; encapsula reemplazo de cuotas, generación de nuevas cuotas y registro de novedad
- `cuotas-service`: Servicio `CuotasService` con `GenerarCuotas` y `CalcularFechaCuota` como fuente única de verdad para la generación de cuotas

### Modified Capabilities

- `registro-prestamo-campos-manuales`: `PrestamosController.Create` usa `CuotasService.GenerarCuotas` — el comportamiento externo no cambia, pero la lógica de generación deja de estar inline

## Impact

- `backend/CobrosApi/Controllers/PrestamosController.cs` — reducido en los métodos `EjecutarProntoPago`, `EjecutarAmpliacionPlazo` y `Create`
- Nuevos: `CobrosApi/Features/Liquidacion/EjecutarProntoPago.cs`, `EjecutarAmpliacionPlazo.cs`
- Nuevo: `CobrosApi/Features/Shared/CuotasService.cs`
- `backend/CobrosApi/Program.cs` — registrar los handlers y `CuotasService` en DI
- Sin cambios en contratos de API
- **Prerrequisito**: Fase 2 completada (los handlers de liquidación usan `Result<T>` y `PrestamoEstados.*`)
