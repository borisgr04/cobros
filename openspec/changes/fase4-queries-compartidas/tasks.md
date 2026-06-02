## 1. PrestamosQueries

- [x] 1.1 Crear `backend/CobrosApi/Features/Prestamos/PrestamosQueries.cs` con `public static class PrestamosQueries`
- [x] 1.2 Implementar extension method `GetActivosConSaldo(this IQueryable<Prestamo> q)` que filtra por `Estado == PrestamoEstados.Prestamo.Activo`, incluye cuotas vía `Include(p => p.Cuotas)` y filtra por `p.Cuotas.Sum(c => c.SaldoPagado) < p.ValorTotal`
- [x] 1.3 Implementar extension method `WithCuotas(this IQueryable<Prestamo> q)` que agrega `Include(p => p.Cuotas)`
- [x] 1.4 Compilar: `dotnet build backend/CobrosApi`

## 2. Unificar cálculo de saldoPendiente en PrestamosController

- [x] 2.1 En `PrestamosController.GetActivos`: reemplazar el código con `db.Prestamos.GetActivosConSaldo()` — eliminar el `.Include(p => p.Pagos)` y el filtro in-memory que sumaba pagos
- [x] 2.2 En `PrestamosController.GetResumenProntoPago`: cambiar `totalPagado = prestamo.Pagos.Where(!Anulado).Sum(Valor)` por `totalPagado = prestamo.Cuotas.Sum(c => c.SaldoPagado)` (requiere Include de Cuotas en lugar de Pagos)
- [x] 2.3 En `PrestamosController.GetResumenAmpliacion`: mismo cambio que 2.2

## 3. Unificar cálculo de saldoPendiente en handlers de Liquidación

- [x] 3.1 En `EjecutarProntoPago.ExecuteAsync`: cambiar `totalPagado = prestamo.Pagos.Where(!Anulado).Sum(Valor)` por `totalPagado = prestamo.Cuotas.Sum(c => c.SaldoPagado)` (cambiar el `Include` de la query de `Pagos` a `Cuotas`)
- [x] 3.2 En `EjecutarAmpliacionPlazo.ExecuteAsync`: mismo cambio

## 4. Verificar capitalPendiente en EjecutarProntoPago

- [x] 4.1 Revisar el cálculo de `capitalPendiente` en `EjecutarProntoPago`: actualmente es `Math.Max(0, prestamo.ValorPrestado - totalPagado)` donde `totalPagado` venía de Pagos. Con la forma B, `totalPagado = Cuotas.Sum(SaldoPagado)` y el cálculo sigue siendo correcto. Confirmar que los tests de pronto pago siguen pasando.

## 5. Tests y validación

- [x] 5.1 Ejecutar suite completa: `dotnet test backend/` — todos los tests deben pasar
- [x] 5.2 Agregar test `PrestamosController_GetActivos_UsaCuotasNoIncludePagos`: verificar que la respuesta de `/activos` no incluye préstamos con todas las cuotas pagadas
- [x] 5.3 Agregar test `EjecutarProntoPago_SaldoPendiente_CalculadoDesdeCuotas`: verificar que el `SaldoPendienteOriginal` en la novedad es correcto al calcularse desde cuotas
- [x] 5.4 Verificar manualmente en staging que `/api/prestamos/activos` retorna el mismo conjunto de préstamos antes y después del cambio
