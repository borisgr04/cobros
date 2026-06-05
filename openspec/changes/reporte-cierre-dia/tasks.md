# Tasks: reporte-cierre-dia

## Backend

### 1. Crear DTOs para cierre del día
**File**: `backend/CobrosApi/DTOs/Dtos.cs`

Agregar al final del archivo los siguientes records:

```csharp
public record CobrosZonaDto(int ZonaId, string ZonaNombre, int CobrosProgramados, int PagaronCount, decimal Total);
public record CobrosDiaDto(decimal RecaudadoTotal, int PrestamosActivosCount, List<CobrosZonaDto> PorZona);
public record FrecuenciaCountDto(string Frecuencia, int Count);
public record PrestamosDiaDto(int NuevosCount, int RenovadosCount, decimal CapitalEntregadoTotal, int ProntoPagoCount, List<FrecuenciaCountDto> NuevosPorFrecuencia);
public record GananciaDiaDto(decimal InteresesPactadosTotal, decimal DescuentosProntoPagoTotal, decimal GananciaNeta);
public record CierreDiaDto(DateOnly Fecha, GananciaDiaDto Ganancia, PrestamosDiaDto PrestamosDia, CobrosDiaDto Cobros);
```

---

### 2. Crear query handler GetCierreDia
**File**: `backend/CobrosApi/Features/Reportes/GetCierreDiaQuery.cs` *(nuevo archivo)*

Crear el handler que calcula los tres bloques:

```csharp
using CobrosApi.Data;
using CobrosApi.DTOs;
using Microsoft.EntityFrameworkCore;

namespace CobrosApi.Features.Reportes;

public static class GetCierreDiaQuery
{
    public static async Task<CierreDiaDto> ExecuteAsync(CobrosDbContext db, DateOnly fecha)
    {
        // --- Ganancia ---
        var intereses = await db.Prestamos
            .Where(p => DateOnly.FromDateTime(p.FechaPrestamo) == fecha)
            .SumAsync(p => (decimal?)p.InteresProyectado) ?? 0m;

        var descuentos = await db.NovedadesPrestamo
            .Where(n => n.Tipo == "pronto_pago" && DateOnly.FromDateTime(n.FechaNovedad) == fecha)
            .SumAsync(n => (decimal?)n.DescuentoAplicado) ?? 0m;

        var ganancia = new GananciaDiaDto(intereses, descuentos, intereses - descuentos);

        // --- Préstamos del día ---
        var prestamosDia = await db.Prestamos
            .Where(p => DateOnly.FromDateTime(p.FechaPrestamo) == fecha)
            .Select(p => new { p.Id, p.PrestamoOrigenId, p.ValorPrestado, p.FrecuenciaPago })
            .ToListAsync();

        var nuevos = prestamosDia.Where(p => p.PrestamoOrigenId == null).ToList();
        var renovados = prestamosDia.Where(p => p.PrestamoOrigenId != null).ToList();

        // Capital entregado: nuevos = ValorPrestado; renovados = DineroAdicional de su novedad
        var renovadosIds = renovados.Select(p => p.Id).ToList();
        var dinerosAdicionales = await db.NovedadesPrestamo
            .Where(n => renovadosIds.Contains(n.PrestamoId) && n.Tipo == "recoger_prestamo")
            .Select(n => new { n.PrestamoId, n.DineroAdicional })
            .ToListAsync();

        var capitalNuevos = nuevos.Sum(p => p.ValorPrestado);
        var capitalRenovados = dinerosAdicionales.Sum(n => n.DineroAdicional ?? 0m);

        var prontoPagoCount = await db.NovedadesPrestamo
            .CountAsync(n => n.Tipo == "pronto_pago" && DateOnly.FromDateTime(n.FechaNovedad) == fecha);

        var porFrecuencia = nuevos
            .GroupBy(p => p.FrecuenciaPago)
            .Select(g => new FrecuenciaCountDto(g.Key, g.Count()))
            .ToList();

        var prestamosDiaDto = new PrestamosDiaDto(
            nuevos.Count,
            renovados.Count,
            capitalNuevos + capitalRenovados,
            prontoPagoCount,
            porFrecuencia
        );

        // --- Cobros ---
        var pagosDelDia = await db.Pagos
            .Include(p => p.Cuota)
                .ThenInclude(c => c.Prestamo)
                    .ThenInclude(p => p.Cliente)
                        .ThenInclude(c => c.Zona)
            .Where(p => !p.Anulado && DateOnly.FromDateTime(p.FechaPago) == fecha)
            .Select(p => new
            {
                p.Valor,
                p.Cuota.PrestamoId,
                ZonaId = p.Cuota.Prestamo.Cliente.ZonaId,
                ZonaNombre = p.Cuota.Prestamo.Cliente.Zona.Nombre
            })
            .ToListAsync();

        var recaudadoTotal = pagosDelDia.Sum(p => p.Valor);
        var prestamosActivosCount = await db.Prestamos.CountAsync(p => p.Estado == "activo");

        var cuotasProgramadas = await db.Cuotas
            .Include(c => c.Prestamo).ThenInclude(p => p.Cliente)
            .Where(c => c.FechaEsperada == fecha)
            .Select(c => new { ZonaId = c.Prestamo.Cliente.ZonaId, ZonaNombre = c.Prestamo.Cliente.Zona.Nombre })
            .ToListAsync();

        var zonasConActividad = pagosDelDia.Select(p => p.ZonaId)
            .Union(cuotasProgramadas.Select(c => c.ZonaId))
            .Distinct();

        var porZona = zonasConActividad.Select(zonaId =>
        {
            var nombre = pagosDelDia.FirstOrDefault(p => p.ZonaId == zonaId)?.ZonaNombre
                ?? cuotasProgramadas.FirstOrDefault(c => c.ZonaId == zonaId)?.ZonaNombre
                ?? "";
            var programados = cuotasProgramadas.Count(c => c.ZonaId == zonaId);
            var pagaron = pagosDelDia.Select(p => p.PrestamoId).Distinct().Count();
            var total = pagosDelDia.Where(p => p.ZonaId == zonaId).Sum(p => p.Valor);
            return new CobrosZonaDto(zonaId, nombre, programados, pagaron, total);
        }).ToList();

        var cobros = new CobrosDiaDto(recaudadoTotal, prestamosActivosCount, porZona);

        return new CierreDiaDto(fecha, ganancia, prestamosDiaDto, cobros);
    }
}
```

---

### 3. Agregar endpoint en ReportesController
**File**: `backend/CobrosApi/Controllers/ReportesController.cs`

Agregar action al controlador existente:

```csharp
[HttpGet("cierre-dia")]
public async Task<ActionResult<CierreDiaDto>> GetCierreDia([FromQuery] DateOnly? fecha)
{
    var fechaConsulta = fecha ?? DateOnly.FromDateTime(DateTime.Today);
    var resultado = await GetCierreDiaQuery.ExecuteAsync(_db, fechaConsulta);
    return Ok(resultado);
}
```

---

## Frontend

### 4. Agregar modelos TypeScript para cierre del día
**File**: `cobros-iu/src/app/features/reportes/models/reporte.models.ts` *(crear si no existe)*

```typescript
export interface GananciaDia {
  interesesPactadosTotal: number;
  descuentosProntoPagoTotal: number;
  gananciaNeta: number;
}

export interface FrecuenciaCount {
  frecuencia: string;
  count: number;
}

export interface PrestamosDia {
  nuevosCount: number;
  renovadosCount: number;
  capitalEntregadoTotal: number;
  prontoPagoCount: number;
  nuevosPorFrecuencia: FrecuenciaCount[];
}

export interface CobrosZona {
  zonaId: number;
  zonaNombre: string;
  cobrosProgramados: number;
  pagaronCount: number;
  total: number;
}

export interface CobrosDia {
  recaudadoTotal: number;
  prestamosActivosCount: number;
  porZona: CobrosZona[];
}

export interface CierreDia {
  fecha: string;
  ganancia: GananciaDia;
  prestamosDia: PrestamosDia;
  cobros: CobrosDia;
}
```

---

### 5. Agregar método getCierreDia en ReporteService
**File**: `cobros-iu/src/app/features/reportes/services/reporte.service.ts`

Agregar método al servicio existente:

```typescript
getCierreDia(fecha: string): Observable<CierreDia> {
  return this.http.get<CierreDia>(`${environment.apiUrl}/api/reportes/cierre-dia?fecha=${fecha}`);
}
```

Agregar importación de `CierreDia` desde los modelos.

---

### 6. Agregar ruta `/reportes/cierre-dia` en app.routes.ts
**File**: `cobros-iu/src/app/app.routes.ts`

Agregar ruta lazy al array de rutas de reportes o junto a la ruta de reportes:

```typescript
{
  path: 'reportes/cierre-dia',
  loadComponent: () =>
    import('./features/reportes/components/cierre-dia/cierre-dia.component').then(
      m => m.CierreDiaComponent
    ),
  canActivate: [authGuard]
},
```

---

### 7. Crear CierreDiaComponent
**File**: `cobros-iu/src/app/features/reportes/components/cierre-dia/cierre-dia.component.ts` *(nuevo)*
**File**: `cobros-iu/src/app/features/reportes/components/cierre-dia/cierre-dia.component.html` *(nuevo)*
**File**: `cobros-iu/src/app/features/reportes/components/cierre-dia/cierre-dia.component.scss` *(nuevo)*

Componente standalone que:
- Tiene `fecha = signal(hoy en formato YYYY-MM-DD)`
- Llama `ReporteService.getCierreDia(this.fecha())` en `effect(() => ...)`
- Maneja estados: loading (skeleton), error, datos
- Muestra 3 bloques: Ganancia, Préstamos del día, Cobros del día
- Usa `AbreviarMonedaPipe` para valores ≥ 1.000 (formato `$NNNk`)
- El selector de fecha dispara recarga automáticamente al cambiar

El pipe `AbreviarMonedaPipe` (si no existe) convierte números ≥ 1000 a `$Nk` sin decimales. Si ya existe en el proyecto, importarlo desde su ubicación actual.

---

### 8. Modificar bottom-navigation para panel de reportes
**File**: `cobros-iu/src/app/shared/components/bottom-navigation/bottom-navigation.component.ts`

- Agregar `mostrarMenuReportes = signal<boolean>(false)`
- Agregar `toggleMenuReportes()` y `cerrarMenuReportes()`
- Suscribirse a `NavigationEnd` para llamar `cerrarMenuReportes()` (igual que con el menú usuario)
- Quitar la entrada de Reportes de `navItems[]` (o marcarla como panel trigger en lugar de ruta)

**File**: `cobros-iu/src/app/shared/components/bottom-navigation/bottom-navigation.component.html`

- Agregar botón "Reportes" en la nav bar que llame `toggleMenuReportes()` en lugar de `routerLink`
- Agregar bloque overlay + panel con dos botones:
  - "Reportes" → navega a `/reportes` + cierra panel
  - "Cierre del Día" → navega a `/reportes/cierre-dia` + cierra panel
- El botón Reportes muestra estado activo cuando `mostrarMenuReportes()` es true o cuando la ruta activa empieza con `/reportes`

---

## Verificación

### 9. Build frontend sin errores
Ejecutar `ng build` en `cobros-iu/` y confirmar que no hay errores de compilación.

### 10. Tests backend pasan
Ejecutar `dotnet test` en `backend/CobrosApi.Tests/` y confirmar que los tests existentes siguen pasando.
