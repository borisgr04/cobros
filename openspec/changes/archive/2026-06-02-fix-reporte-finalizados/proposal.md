## Why

El reporte de préstamos finalizados tiene tres defectos que hacen que la información mostrada sea incompleta o incorrecta: préstamos del mismo día no aparecen por inconsistencia de timezone, y préstamos recogidos y pagados por pronto pago no aparecen aunque cerraron dentro del período consultado.

## What Changes

- Corregir el filtro de fecha en el query de finalizados para usar `FechaCierre` cuando el cierre fue anticipado (`refinanciado`, `cerrado_pronto_pago`) y `FechaFinal` solo cuando el préstamo terminó en su fecha programada (`completado`).
- Corregir la inconsistencia de timezone entre la creación de préstamos (fechas guardadas como UTC midnight) y la consulta del reporte (fechas enviadas como hora local Colombia), de modo que préstamos del mismo día siempre sean visibles.

## Capabilities

### New Capabilities

_(ninguna — solo correcciones a comportamiento existente)_

### Modified Capabilities

- `reporte-finalizados`: Los préstamos recogidos (`refinanciado`) y los pagados por pronto pago (`cerrado_pronto_pago`) ahora aparecen en el período en que realmente cerraron (usando `FechaCierre`), no en la fecha de vencimiento programada original. Los préstamos `completado` siguen usando `FechaFinal`. Además, un préstamo con `FechaFinal` igual a la fecha del reporte ya no queda excluido por desfase de timezone.

## Impact

- **Backend**: `ReportesController.cs` — query de `qFinalizados` y lógica de normalización de fechas (`inicio`/`fin`)
- **Frontend**: `reporte.service.ts` — forma en que se construyen los parámetros `fechaInicio`/`fechaFin` enviados al API
- **Sin cambios en modelos, migraciones ni DTOs**
