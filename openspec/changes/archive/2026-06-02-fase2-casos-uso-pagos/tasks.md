## 1. Tipo Result y estructura base

- [x] 1.1 Crear `backend/CobrosApi/Features/Shared/Result.cs` con la clase genérica `Result<T>` (métodos estáticos `Ok`, `Fail`, `NotFound`; propiedades `IsSuccess`, `Value`, `Error`, `StatusCode`)
- [x] 1.2 Compilar y verificar que no hay errores: `dotnet build backend/CobrosApi`

## 2. PagosRules

- [x] 2.1 Crear `backend/CobrosApi/Features/Pagos/PagosRules.cs` con `public static class PagosRules`
- [x] 2.2 Implementar `PrestamoAceptaPagos(string estado)` → retorna `false` para los 3 estados cerrados
- [x] 2.3 Implementar `EsUltimoPagoActivo(int pagoId, int? ultimoActivoId)` → retorna `ultimoActivoId == pagoId`

## 3. Handler AplicarPago

- [x] 3.1 Crear `backend/CobrosApi/Features/Pagos/AplicarPago.cs` con `public class AplicarPago(CobrosDbContext db)`
- [x] 3.2 Definir `public record AplicarPagoDto(int PrestamoId, decimal Valor, DateTime FechaPago)` (puede ir en el mismo archivo o en `Dtos.cs`)
- [x] 3.3 Implementar `ExecuteAsync(AplicarPagoDto dto) → Task<Result<Pago>>` copiando la lógica de `PagosController.Create` (validar préstamo, cargar cuotas, validar saldo, crear Pago, distribuir abono con `RecalcularEstadoCuota`, crear AplicacionCuota, transacción)
- [x] 3.4 Usar `PagosRules.PrestamoAceptaPagos` y `PrestamoEstados.*` dentro del handler

## 4. Handler AnularPago

- [x] 4.1 Crear `backend/CobrosApi/Features/Pagos/AnularPago.cs` con `public class AnularPago(CobrosDbContext db)`
- [x] 4.2 Definir `public record AnularPagoDto(int PagoId, string Motivo)`
- [x] 4.3 Implementar `ExecuteAsync(AnularPagoDto dto) → Task<Result<Pago>>` copiando la lógica de `PagosController.Anular` (verificar existencia, no anulado, es el más reciente, revertir cuotas con `RecalcularEstadoCuota`, marcar anulado, transacción)
- [x] 4.4 Usar `PagosRules.EsUltimoPagoActivo` y `PrestamoEstados.*`

## 5. Registro en DI y delegación en Controller

- [x] 5.1 En `Program.cs`, agregar `builder.Services.AddScoped<AplicarPago>()` y `builder.Services.AddScoped<AnularPago>()`
- [x] 5.2 Modificar `PagosController` para recibir `AplicarPago` y `AnularPago` vía primary constructor
- [x] 5.3 Reemplazar el cuerpo de `PagosController.Create` por: mapear `PagoInputDto` → `AplicarPagoDto`, llamar `await _aplicarPago.ExecuteAsync(dto)`, mapear `Result<Pago>` a respuesta HTTP
- [x] 5.4 Reemplazar el cuerpo de `PagosController.Anular` por: mapear input → `AnularPagoDto`, llamar `await _anularPago.ExecuteAsync(dto)`, mapear resultado

## 6. Tests

- [x] 6.1 Ejecutar suite existente para validar que ningún test regresionó: `dotnet test backend/` — mínimo 74 tests (70 + 4 de Fase 1) deben pasar
- [x] 6.2 Agregar test unitario `AplicarPago_PrestamoCompletado_RetornaFail` (sin HTTP, instanciar handler directo con DbContext InMemory)
- [x] 6.3 Agregar test unitario `AplicarPago_DistribucionCorrecta_ActualizaSaldoYEstado`
- [x] 6.4 Agregar test unitario `AnularPago_NoEsUltimoPago_RetornaFail`
- [x] 6.5 Agregar test unitario `AnularPago_UltimoPago_RevierteEstadoCuotas`
