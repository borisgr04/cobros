## 1. Constantes de estado

- [ ] 1.1 Crear `backend/CobrosApi/Features/Shared/PrestamoEstados.cs` con la clase estática `PrestamoEstados` y sus nested classes `Prestamo` y `Cuota` con todas las constantes de string
- [ ] 1.2 Reemplazar todos los magic strings de estado en `PagosController.cs` con `PrestamoEstados.*`
- [ ] 1.3 Reemplazar todos los magic strings de estado en `PrestamosController.cs` con `PrestamoEstados.*`
- [ ] 1.4 Compilar y verificar que no hay errores: `dotnet build backend/CobrosApi`

## 2. Fix PagosController.Create

- [ ] 2.1 Agregar método privado estático `RecalcularEstadoCuota(Cuota cuota)` en `PagosController.cs` que retorne `PrestamoEstados.Cuota.Pagada / Parcial / Pendiente` según `SaldoPagado`
- [ ] 2.2 En el `foreach` de distribución de abono, llamar `cuota.Estado = RecalcularEstadoCuota(cuota)` después de actualizar `cuota.SaldoPagado`

## 3. Fix PagosController.Anular

- [ ] 3.1 En el `foreach` de reversión de `aplicaciones`, llamar `aplicacion.Cuota.Estado = RecalcularEstadoCuota(aplicacion.Cuota)` después de revertir `SaldoPagado`

## 4. Corrección de datos existentes en producción

- [ ] 4.1 Escribir script SQL de corrección (en `backend/scripts/fix-cuota-estado.sql`):
  ```sql
  BEGIN;
  UPDATE "Cuotas"
  SET "Estado" = CASE
      WHEN "SaldoPagado" >= "ValorCuota" THEN 'pagada'
      WHEN "SaldoPagado" > 0             THEN 'parcial'
      ELSE 'pendiente'
  END
  WHERE "Estado" = 'pendiente' AND "SaldoPagado" > 0;
  -- Verificar filas afectadas antes de COMMIT
  COMMIT;
  ```
- [ ] 4.2 Ejecutar el script en la BD de producción antes del deploy (dentro de una transacción; usar ROLLBACK si el conteo de filas es inesperado)

## 5. Tests

- [ ] 5.1 Agregar test `PagosController_Create_CuotaCompletamente_Pagada_EstadoEsPagada`: registrar un pago de valor exactamente `ValorCuota` y verificar que la cuota queda con `Estado = "pagada"`
- [ ] 5.2 Agregar test `PagosController_Create_CuotaParcialmente_Pagada_EstadoEsParcial`: registrar un pago menor a `ValorCuota` y verificar que la cuota queda con `Estado = "parcial"`
- [ ] 5.3 Agregar test `PagosController_Anular_Restaura_EstadoCuota_APendiente`: anular un pago previo y verificar que la cuota vuelve a `Estado = "pendiente"`
- [ ] 5.4 Agregar test `GetEstadisticas_CuotasPagadas_Correctas_DepuesDePago`: verificar que `cuotasPagadas` en estadísticas es correcto después de registrar pagos por `PagosController`
- [ ] 5.5 Ejecutar suite completa: `dotnet test backend/` — todos los tests deben pasar (mínimo 70 existentes + 4 nuevos)
