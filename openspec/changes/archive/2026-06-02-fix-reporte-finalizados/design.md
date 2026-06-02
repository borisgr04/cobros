## Context

El reporte de finalizados (`GET /api/reportes`) actualmente filtra todos los préstamos cerrados por `FechaFinal`:

```sql
WHERE FechaFinal >= inicio AND FechaFinal < fin
```

Esto tiene dos problemas:

1. **Timezone**: Las fechas se almacenan como UTC midnight (ej. `2026-06-02T00:00:00Z`). El frontend construye el parámetro con `new Date("2026-06-02T00:00:00").toISOString()` que produce `2026-06-02T05:00:00.000Z` (UTC-5 Colombia). El backend recibe `inicio = 2026-06-02T05:00:00`, por lo que un préstamo cuya `FechaFinal = 2026-06-02T00:00:00` queda fuera del rango.

2. **Semántica de cierre**: Para préstamos `refinanciado` y `cerrado_pronto_pago`, `FechaFinal` es la fecha de vencimiento **programada** (no cuándo realmente cerraron). El cierre real está en `FechaCierre`. Un préstamo recogido hoy con vencimiento en septiembre nunca aparecería en el reporte de hoy.

## Goals / Non-Goals

**Goals:**
- Préstamos del mismo día siempre aparecen en el reporte del día (fix timezone)
- `refinanciado` y `cerrado_pronto_pago` aparecen según su `FechaCierre`
- `completado` sigue usando `FechaFinal` (terminó en su fecha programada)
- La estadística "Recogidos" en el frontend cuenta correctamente

**Non-Goals:**
- Cambiar el modelo de datos o agregar columnas
- Modificar cómo se almacenan las fechas en BD (no migraciones)
- Cambiar el comportamiento del recaudo o préstamos nuevos

## Decisions

### D1: Normalizar fechas en el backend (no en el frontend)

El frontend envía `new Date("2026-06-02T00:00:00").toISOString()` → `2026-06-02T05:00:00Z`. Opciones:

- **A** _(elegida)_: El backend normaliza: truncar `fechaInicio` y `fechaFin` a fecha pura (ignorar hora) antes de construir el rango UTC. Así `2026-06-02TXX:XX:XX` → `2026-06-02T00:00:00Z` siempre.
- **B**: El frontend envía solo `"2026-06-02"` (DateOnly string). Requiere cambiar el binding del controlador y todos los callers.
- **C**: El frontend envía `T00:00:00Z` explícitamente. Frágil; depende del TZ del dispositivo del usuario.

La opción A es el cambio más pequeño y aislado: modifica solo el backend, sin tocar el frontend ni el contrato HTTP.

```csharp
// Antes
var inicio = fechaInicio;
var fin    = fechaFin.AddDays(1);

// Después
var inicio = fechaInicio.Date;          // truncar a medianoche UTC
var fin    = fechaFin.Date.AddDays(1);  // fin exclusivo del día
```

### D2: Query condicional según estado del préstamo

Para capturar el cierre real de cada tipo:

```sql
WHERE (Estado = 'completado'         AND FechaFinal  >= inicio AND FechaFinal  < fin)
   OR (Estado = 'cerrado_pronto_pago' AND FechaCierre >= inicio AND FechaCierre < fin)
   OR (Estado = 'refinanciado'        AND FechaCierre >= inicio AND FechaCierre < fin)
```

En EF Core:

```csharp
.Where(p =>
    (p.Estado == "completado"          && p.FechaFinal  >= inicio && p.FechaFinal  < fin) ||
    (p.Estado == "cerrado_pronto_pago" && p.FechaCierre >= inicio && p.FechaCierre < fin) ||
    (p.Estado == "refinanciado"        && p.FechaCierre >= inicio && p.FechaCierre < fin))
```

`FechaCierre` es `DateTime?`; solo es null en préstamos `activo` (que no entran en este query), por lo que el cast implícito es seguro.

## Risks / Trade-offs

- **[Riesgo] FechaCierre null en refinanciado/pronto_pago legacy**: Si existen registros históricos con `FechaCierre = null` pero estado `refinanciado`, EF Core los excluiría silenciosamente (null > fecha = false en SQL). → Mitigation: aceptable — registros sin `FechaCierre` no tienen fecha de cierre confiable; no deben aparecer.
- **[Trade-off] D1 trunca la hora del usuario**: Si en el futuro se quiere reportar por hora del día, habrá que revisar. → Mitigation: documentado aquí como decisión explícita.

## Open Questions

_(ninguna — el diseño es completo para los casos identificados)_
