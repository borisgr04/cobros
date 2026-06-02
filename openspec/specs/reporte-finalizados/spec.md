## ADDED Requirements

### Requirement: Reporte de finalizados filtra por fecha real de cierre

El sistema SHALL incluir en el listado de préstamos finalizados a todos los préstamos cuyo cierre ocurrió dentro del período consultado, independientemente de si el cierre fue en la fecha programada o anticipado.

- Los préstamos con estado `completado` DEBEN filtrarse por `FechaFinal` (terminaron en su fecha programada).
- Los préstamos con estado `refinanciado` o `cerrado_pronto_pago` DEBEN filtrarse por `FechaCierre` (cerraron antes de lo programado).
- Un préstamo recogido o pagado por pronto pago hoy DEBE aparecer en el reporte del día de hoy.

#### Scenario: Préstamo recogido hoy aparece en el reporte de hoy

- **WHEN** existe un préstamo con estado `refinanciado`, `FechaCierre = 2026-06-02` y `FechaFinal = 2026-09-01`
- **AND** el usuario consulta el reporte del período `2026-06-02` a `2026-06-02`
- **THEN** ese préstamo aparece en la lista de finalizados con `estadoFinalizacion = "refinanciado"`

#### Scenario: Préstamo pronto pago hoy aparece en el reporte de hoy

- **WHEN** existe un préstamo con estado `cerrado_pronto_pago`, `FechaCierre = 2026-06-02` y `FechaFinal = 2026-08-15`
- **AND** el usuario consulta el reporte del período `2026-06-02` a `2026-06-02`
- **THEN** ese préstamo aparece en la lista de finalizados con `estadoFinalizacion = "pronto_pago"`

#### Scenario: Préstamo completado sigue usando FechaFinal

- **WHEN** existe un préstamo con estado `completado`, `FechaFinal = 2026-06-02` y `FechaCierre = null`
- **AND** el usuario consulta el reporte del período `2026-06-02` a `2026-06-02`
- **THEN** ese préstamo aparece en la lista de finalizados con `estadoFinalizacion = "pagado_completo"`

#### Scenario: Préstamo recogido en otro período no aparece

- **WHEN** existe un préstamo con estado `refinanciado`, `FechaCierre = 2026-05-10`
- **AND** el usuario consulta el reporte del período `2026-06-01` a `2026-06-07`
- **THEN** ese préstamo NO aparece en la lista de finalizados

### Requirement: Reporte de finalizados no excluye préstamos del mismo día por timezone

El sistema SHALL incluir un préstamo en el reporte del día en que se registró su fecha de cierre, sin importar la hora exacta almacenada en base de datos.

- El backend DEBE truncar `fechaInicio` y `fechaFin` recibidos a fecha pura (`DateTime.Date`) antes de calcular el rango, eliminando cualquier desfase de timezone proveniente del cliente.

#### Scenario: Préstamo del día 2 aparece en reporte del día 2

- **WHEN** existe un préstamo con `FechaFinal = 2026-06-02T00:00:00Z`
- **AND** el frontend envía `fechaInicio = 2026-06-02T05:00:00Z` (UTC-5 Colombia) y `fechaFin = 2026-06-02T05:00:00Z`
- **THEN** el backend normaliza ambas fechas a `2026-06-02T00:00:00Z` y el préstamo aparece en los resultados

#### Scenario: Rango de un solo día incluye todo ese día

- **WHEN** el usuario selecciona inicio = fin = `2026-06-02`
- **AND** existen préstamos con `FechaFinal` en cualquier hora del `2026-06-02`
- **THEN** todos esos préstamos aparecen en el resultado
