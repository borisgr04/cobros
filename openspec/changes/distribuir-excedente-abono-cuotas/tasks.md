## 1. Modelos y migración de base de datos

- [x] 1.1 Crear `Models/Cuota.cs`: `{ Id, PrestamoId, NumeroCuota, FechaEsperada, ValorCuota, SaldoPagado }` con FK a `Prestamo`
- [x] 1.2 Crear `Models/AplicacionCuota.cs`: `{ Id, PagoId, CuotaId, ValorAplicado }` con FK a `Pago` y `Cuota`
- [x] 1.3 Agregar `DbSet<Cuota>` y `DbSet<AplicacionCuota>` en `CobrosDbContext.cs` con sus relaciones
- [ ] 1.4 Ejecutar `dotnet ef migrations add AddCuotaYAplicacion` y revisar la migración generada

## 2. DTOs

- [ ] 2.1 Agregar `CuotaDetalleDto` en `Dtos.cs`: `{ Id, NumeroCuota, FechaEsperada, ValorCuota, SaldoPagado, Estado }` donde `Estado` se deriva al mapear
- [ ] 2.2 Agregar `AplicacionCuotaDto` en `Dtos.cs`: `{ CuotaId, NumeroCuota, ValorAplicado }`

## 3. PrestamosController — generar cuotas al crear préstamo

- [ ] 3.1 En `PrestamosController.Create`, luego de persistir el `Prestamo`, generar N registros `Cuota` con `SaldoPagado = 0` y `FechaEsperada` según `FrecuenciaPago`
- [ ] 3.2 Actualizar `GET /api/prestamos/{id}/cuotas` para leer de la tabla `Cuota` y retornar `CuotaDetalleDto`; con fallback a proyección calculada si no existen registros (backward-compat)

## 4. PagosController — lógica de distribución

- [ ] 4.1 En `PagosController.Create`, cargar las cuotas del préstamo ordenadas por `NumeroCuota`
- [ ] 4.2 Validar que el abono no supere `SUM(ValorCuota - SaldoPagado)` de cuotas no pagadas; retornar HTTP 400 si excede
- [ ] 4.3 Implementar distribución: iterar cuotas pendientes/parciales, calcular `ValorAplicado` para cada una, crear `AplicacionCuota` y actualizar `Cuota.SaldoPagado`
- [ ] 4.4 Envolver todo (INSERT Pago + INSERT AplicacionCuota + UPDATE Cuota) en una transacción EF Core

## 5. Frontend — simplificar generarProyeccionCuotas

- [ ] 5.1 Actualizar la interface `CuotaProyectada` en `prestamo-calculations.ts` para agregar `saldoPagado` y estado `'parcial'`
- [ ] 5.2 Simplificar `generarProyeccionCuotas` para mapear directamente desde la respuesta del endpoint `/cuotas` en lugar de calcular localmente
- [ ] 5.3 Actualizar el componente de detalle de préstamo para mostrar indicador visual de cuota parcial con `SaldoPagado`

## 6. Tests

- [ ] 6.1 Test: crear préstamo genera N registros `Cuota` con `SaldoPagado = 0`
- [ ] 6.2 Test: abono $55.000 con `ValorCuota` $20.000 → cuotas 1 y 2 `pagada`, cuota 3 `parcial` con `SaldoPagado = 15.000`, 3 `AplicacionCuota` creadas
- [ ] 6.3 Test: abono ≤ `ValorCuota` → 1 cuota parcial o pagada, 1 `AplicacionCuota` (backward-compat)
- [ ] 6.4 Test: abono que supera saldo pendiente retorna HTTP 400 sin modificar ninguna cuota
- [ ] 6.5 Test: `GET /cuotas` lee de tabla y retorna `SaldoPagado` correcto

## 7. Verificación

- [ ] 7.1 Flujo completo: crear préstamo → verificar cuotas generadas → registrar abono $55.000 → verificar cuotas 1 y 2 pagadas, cuota 3 parcial $15.000, historial muestra 1 pago
- [ ] 7.2 Verificar que préstamos existentes (sin tabla `Cuota`) siguen mostrando cuotas vía fallback
