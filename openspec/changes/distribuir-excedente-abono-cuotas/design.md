## Context

El sistema actual proyecta las cuotas dinámicamente desde `Prestamo.CantidadCuotas` y `Prestamo.ValorCuota`; no existe una tabla `Cuota` en la DB. Los pagos (`Pago { Id, PrestamoId, Valor, FechaPago }`) son registros planos sin referencia a cuota alguna. El frontend calcula el estado de cada cuota mapeando `pago[i-1] → cuota[i]` por índice, ignorando el valor del pago.

El stack es: backend .NET 8 con EF Core + PostgreSQL, frontend Angular con signals.

## Goals / Non-Goals

**Goals:**
- Crear tabla `Cuota` con campo `SaldoPagado` que persiste explícitamente cuánto se ha abonado a cada cuota
- Al crear un préstamo, generar automáticamente N registros `Cuota` con `SaldoPagado = 0`
- `POST /api/pagos` guarda 1 `Pago` (trazabilidad de la transacción) y distribuye el valor actualizando `SaldoPagado` en las cuotas pendientes/parciales
- `GET /api/prestamos/{id}/cuotas` hace un query directo a la tabla `Cuota`, sin recalcular nada
- El frontend solo renderiza el estado que devuelve el backend

**Non-Goals:**
- No se implementa reversión/anulación de pagos en este cambio
- No se cambia la UI de registro de pagos
- No se migran préstamos históricos (los existentes sin cuotas generadas quedan con proyección calculada)

## Decisions

### Decisión 1: Nueva tabla `Cuota` con `SaldoPagado`

Persistir `SaldoPagado` en cada cuota elimina recálculos en cada consulta y hace el estado auditable directamente en la DB. El `estado` se deriva trivialmente al leer: `SaldoPagado == 0` → pendiente, `0 < SaldoPagado < ValorCuota` → parcial, `SaldoPagado >= ValorCuota` → pagada.

```
Cuota { Id, PrestamoId, NumeroCuota, FechaEsperada, ValorCuota, SaldoPagado }
```

*Alternativa descartada:* calcular on-the-fly en el endpoint — correcto pero recalcula en cada consulta y no persiste el estado por cuota.

### Decisión 2: 1 `Pago` por transacción + `AplicacionCuota` para trazabilidad bidireccional

El registro `Pago` preserva la trazabilidad del abono real. `AplicacionCuota` vincula cada pago con las cuotas que cubre y el valor aplicado — permite responder "qué pagos cubrieron la cuota X" y "qué cuotas cubre el pago Y". Todo se persiste en una sola transacción DB.

```
Pago { Id, PrestamoId, Valor, FechaPago }          ← transacción real
  └─ AplicacionCuota { Id, PagoId, CuotaId, ValorAplicado }
       └─ Cuota { Id, PrestamoId, NumeroCuota, FechaEsperada, ValorCuota, SaldoPagado }
```

Flujo para abono de $55.000 con `ValorCuota` = $20.000:
```
INSERT Pago { Valor: 55.000 }
INSERT AplicacionCuota { CuotaId: 1, ValorAplicado: 20.000 }
UPDATE Cuota 1: SaldoPagado = 20.000   → pagada
INSERT AplicacionCuota { CuotaId: 2, ValorAplicado: 20.000 }
UPDATE Cuota 2: SaldoPagado = 20.000   → pagada
INSERT AplicacionCuota { CuotaId: 3, ValorAplicado: 15.000 }
UPDATE Cuota 3: SaldoPagado = 15.000   → parcial
```

### Decisión 3: Generación de cuotas al crear préstamo

Al hacer `POST /api/prestamos`, el backend genera N registros `Cuota` con `SaldoPagado = 0`. Las fechas se calculan igual que la proyección actual (frecuencia de pago × número de cuota).

### Decisión 4: Frontend consume el estado del backend

La función `generarProyeccionCuotas` en el frontend se simplifica: consume directamente el endpoint `/cuotas` que retorna el estado persistido, sin lógica de distribución local.

## Risks / Trade-offs

- **Préstamos existentes sin registros `Cuota`**: el endpoint `/cuotas` deberá detectar si existen registros en la tabla y, si no, caer en la proyección calculada como fallback para backward-compatibility
- **Abono mayor al saldo pendiente**: `POST /api/pagos` rechazará con `400 Bad Request` si `Valor > SUM(ValorCuota - SaldoPagado)` de cuotas no completamente pagadas
- **Concurrencia**: dos pagos simultáneos en el mismo préstamo podrían producir race condition en los `UPDATE` de `SaldoPagado`; mitigado con transacción DB en el método `Create`
- **Migración**: requiere migración EF Core para tablas `Cuotas` y `AplicacionesCuota`

## Migration Plan

- Agregar migración EF Core para tablas `Cuotas` y `AplicacionesCuota`
- `POST /api/prestamos` pasa a generar N registros `Cuota` automáticamente
- `GET /api/prestamos/{id}/cuotas` usa fallback a proyección calculada si no existen registros `Cuota` (backward-compat con préstamos anteriores)
- Rollback: revertir migración, restaurar endpoint `/cuotas`, método `Create` de `PagosController` y `PrestamosController.Create`
