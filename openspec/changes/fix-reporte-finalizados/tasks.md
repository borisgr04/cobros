## 1. Backend — Normalización de fechas

- [x] 1.1 En `ReportesController.GetReporte`, reemplazar `var inicio = fechaInicio` por `var inicio = fechaInicio.Date` y `var fin = fechaFin.AddDays(1)` por `var fin = fechaFin.Date.AddDays(1)` para truncar cualquier componente horario recibido del cliente

## 2. Backend — Query de préstamos finalizados

- [x] 2.1 Reemplazar el filtro `.Where(p => p.FechaFinal >= inicio && p.FechaFinal < fin)` en `qFinalizados` por la condición condicional por estado: `completado` usa `FechaFinal`, `refinanciado` y `cerrado_pronto_pago` usan `FechaCierre`

## 3. Tests

- [x] 3.1 Agregar test: préstamo `refinanciado` con `FechaCierre` en el rango aparece en finalizados
- [x] 3.2 Agregar test: préstamo `cerrado_pronto_pago` con `FechaCierre` en el rango aparece en finalizados
- [x] 3.3 Agregar test: préstamo `completado` sigue usando `FechaFinal` (comportamiento previo no regresa)
- [x] 3.4 Agregar test: cuando `fechaInicio` tiene componente horario (simulando UTC-5), el préstamo del mismo día sí aparece
