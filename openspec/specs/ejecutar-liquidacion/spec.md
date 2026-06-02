## Requirements

### Requirement: EjecutarProntoPago como caso de uso independiente
El sistema SHALL exponer la lógica de cierre por pronto pago como un handler `EjecutarProntoPago` invocable sin la capa HTTP. El handler SHALL: validar que el préstamo está activo y tiene saldo pendiente, verificar que el valor negociado no es menor al capital pendiente, crear el pago de tipo `"pronto_pago"`, distribuir en cuotas pendientes, cerrar cuotas restantes con `"cerrada_pronto_pago"`, registrar la `NovedadPrestamo` y marcar el préstamo como `"cerrado_pronto_pago"`.

#### Scenario: Handler rechaza valor negociado menor al capital
- **WHEN** `EjecutarProntoPago.ExecuteAsync` recibe `ValorNegociado < capitalPendiente`
- **THEN** retorna `Result.Fail` con mensaje indicando que no se puede descontar capital
- **AND** no se crea ningún pago ni se modifica el préstamo

#### Scenario: Handler cierra el préstamo correctamente
- **WHEN** `EjecutarProntoPago.ExecuteAsync` recibe datos válidos
- **THEN** el préstamo queda con `Estado = "cerrado_pronto_pago"` y `FechaCierre` asignada
- **AND** todas las cuotas pendientes quedan en `"cerrada_pronto_pago"` o `"pagada"`
- **AND** se crea 1 registro `Pago` de tipo `"pronto_pago"`
- **AND** se crea 1 registro `NovedadPrestamo` con tipo `"pronto_pago"`

### Requirement: EjecutarAmpliacionPlazo como caso de uso independiente
El sistema SHALL exponer la lógica de ampliación de plazo como un handler `EjecutarAmpliacionPlazo`. El handler SHALL: reemplazar cuotas pendientes marcándolas como `"reemplazada_por_ampliacion"`, generar las nuevas cuotas usando `CuotasService.GenerarCuotas`, actualizar `ValorTotal`, `CantidadCuotas`, `FechaFinal` y `FrecuenciaPago` del préstamo, y registrar la `NovedadPrestamo`.

#### Scenario: Handler rechaza préstamo sin cuotas pendientes
- **WHEN** `EjecutarAmpliacionPlazo.ExecuteAsync` se invoca sobre un préstamo sin cuotas pendientes
- **THEN** retorna `Result.Fail` con error "No hay cuotas pendientes para ampliar el plazo"
- **AND** no se modifica el préstamo

#### Scenario: Handler amplía el plazo correctamente
- **WHEN** `EjecutarAmpliacionPlazo.ExecuteAsync` recibe datos válidos
- **THEN** las cuotas pendientes anteriores quedan con `Estado = "reemplazada_por_ampliacion"`
- **AND** se generan N nuevas cuotas con fechas calculadas desde `CuotasService.CalcularFechaCuota`
- **AND** `Prestamo.CantidadCuotas`, `ValorTotal`, `FechaFinal` y `FrecuenciaPago` se actualizan
- **AND** se crea 1 registro `NovedadPrestamo` con tipo `"ampliacion_plazo"`

### Requirement: CuotasService como fuente única de generación de cuotas
El sistema SHALL centralizar la generación de cuotas en `CuotasService.GenerarCuotas` y el cálculo de fechas en `CuotasService.CalcularFechaCuota`. Ningún otro componente SHALL duplicar estos algoritmos.

#### Scenario: GenerarCuotas genera N cuotas con última cuota de ajuste
- **WHEN** se invoca `CuotasService.GenerarCuotas` con `cantidadCuotas = N` y `valorTotal`
- **THEN** genera N cuotas con `ValorCuota = Math.Round(valorTotal / N, 2)` para cuotas 1 a N-1
- **AND** la cuota N tiene `ValorCuota = valorTotal - (N-1) * valorCuota` (ajuste para evitar diferencias de redondeo)

#### Scenario: CalcularFechaCuota respeta la frecuencia de pago
- **WHEN** se invoca `CuotasService.CalcularFechaCuota(fechaInicio, frecuencia, numeroCuota)`
- **THEN** retorna `fechaInicio + (numeroCuota * período)` según la frecuencia: `"diario"` (+1 día), `"semanal"` (+7 días), `"quincenal"` (+15 días), `"mensual"` (+1 mes)
- **AND** el `DateTime` retornado tiene `Kind = Utc`
