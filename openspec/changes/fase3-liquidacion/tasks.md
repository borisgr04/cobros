## 1. CuotasService

- [ ] 1.1 Crear `backend/CobrosApi/Features/Shared/CuotasService.cs` con `public static class CuotasService`
- [ ] 1.2 Mover `CalcularFechaCuota(DateTime fechaInicio, string frecuencia, int numeroCuota)` desde `PrestamosController` a `CuotasService` (mismo algoritmo, mismas 4 frecuencias, lógica de `DateTimeKind.Utc` preservada)
- [ ] 1.3 Implementar `GenerarCuotas(int prestamoId, int cantidadCuotas, decimal valorTotal, decimal valorCuota, DateTime fechaInicio, string frecuencia)` retornando `IEnumerable<Cuota>` (extraída del inline de `PrestamosController.Create`)
- [ ] 1.4 Actualizar `PrestamosController.Create` para llamar `CuotasService.GenerarCuotas(...)` en lugar de la expresión inline
- [ ] 1.5 Compilar y ejecutar tests: `dotnet test backend/` — todos deben pasar

## 2. Handler EjecutarProntoPago

- [ ] 2.1 Crear `backend/CobrosApi/Features/Liquidacion/EjecutarProntoPago.cs` con `public class EjecutarProntoPago(CobrosDbContext db, AplicarPago aplicarPago)`
- [ ] 2.2 Definir `public record EjecutarProntoPagoDto(int PrestamoId, decimal ValorNegociado, string? Notas, int UsuarioId)`
- [ ] 2.3 Implementar `ExecuteAsync(EjecutarProntoPagoDto dto) → Task<Result<ProntoPagoResultadoDto>>` extrayendo la lógica de `PrestamosController.EjecutarProntoPago` (validaciones → calcular saldo → verificar capital mínimo → usar `AplicarPago` para crear y distribuir el pago → cerrar cuotas restantes → `NovedadPrestamo` → cerrar préstamo)
- [ ] 2.4 Usar `PrestamoEstados.*` para todas las comparaciones de estado

## 3. Handler EjecutarAmpliacionPlazo

- [ ] 3.1 Crear `backend/CobrosApi/Features/Liquidacion/EjecutarAmpliacionPlazo.cs` con `public class EjecutarAmpliacionPlazo(CobrosDbContext db)`
- [ ] 3.2 Definir `public record EjecutarAmpliacionPlazoDto(int PrestamoId, decimal InteresAdicional, int CantidadCuotasNuevas, DateTime FechaInicio, string FrecuenciaNueva, string? Observacion, int UsuarioId)`
- [ ] 3.3 Implementar `ExecuteAsync(dto) → Task<Result<AmpliacionPlazoResultadoDto>>` extrayendo la lógica de `PrestamosController.EjecutarAmpliacionPlazo` (reemplazar cuotas pendientes → `CuotasService.GenerarCuotas` para las nuevas → actualizar préstamo → `NovedadPrestamo`)
- [ ] 3.4 Usar `CuotasService.GenerarCuotas` y `PrestamoEstados.*`

## 4. Registro en DI y delegación en Controller

- [ ] 4.1 En `Program.cs`, agregar `builder.Services.AddScoped<EjecutarProntoPago>()` y `builder.Services.AddScoped<EjecutarAmpliacionPlazo>()`
- [ ] 4.2 Modificar `PrestamosController` para recibir `EjecutarProntoPago` y `EjecutarAmpliacionPlazo` vía primary constructor
- [ ] 4.3 Reemplazar el cuerpo de `PrestamosController.EjecutarProntoPago`: resolver `usuarioId` desde claims → mapear a `EjecutarProntoPagoDto` → delegar en handler → mapear `Result<T>` a HTTP
- [ ] 4.4 Reemplazar el cuerpo de `PrestamosController.EjecutarAmpliacionPlazo`: resolver `usuarioId` → mapear → delegar → respuesta HTTP
- [ ] 4.5 Eliminar el método privado `CalcularFechaCuota` del controlador (ahora está en `CuotasService`)

## 5. Tests

- [ ] 5.1 Ejecutar suite completa: `dotnet test backend/` — todos los tests existentes deben pasar
- [ ] 5.2 Agregar test unitario `EjecutarProntoPago_ValorMenorAlCapital_RetornaFail`
- [ ] 5.3 Agregar test unitario `EjecutarProntoPago_ValorValido_CierraPrestamoYCuotas`
- [ ] 5.4 Agregar test unitario `EjecutarAmpliacionPlazo_SinCuotasPendientes_RetornaFail`
- [ ] 5.5 Agregar test unitario `EjecutarAmpliacionPlazo_GeneraNuevasCuotasConFechasCorrectas`
- [ ] 5.6 Agregar test `CuotasService_CalcularFechaCuota_Semanal_EsCorrecta` (evitar regresión de timezone — usar `DateTimeOffset.Parse` al comparar)
