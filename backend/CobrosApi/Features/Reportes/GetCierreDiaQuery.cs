using CobrosApi.Data;
using CobrosApi.DTOs;
using Microsoft.EntityFrameworkCore;

namespace CobrosApi.Features.Reportes;

public static class GetCierreDiaQuery
{
    public static async Task<CierreDiaDto> ExecuteAsync(CobrosDbContext db, DateOnly fecha)
    {
        // El día del cierre se interpreta en hora local de negocio (Colombia).
        var (fechaDt, fechaDtSig) = ReporteRangoFechaHelper.FromLocalDate(fecha);

        // ── Ganancia ─────────────────────────────────────────────────────────
        var intereses = await db.Prestamos
            .Where(p => p.FechaPrestamo >= fechaDt && p.FechaPrestamo < fechaDtSig)
            .SumAsync(p => (decimal?)p.InteresProyectado) ?? 0m;

        var descuentos = await db.NovedadesPrestamo
            .Where(n => n.Tipo == "pronto_pago"
                     && n.FechaNovedad >= fechaDt
                     && n.FechaNovedad < fechaDtSig)
            .SumAsync(n => (decimal?)n.DescuentoAplicado) ?? 0m;

        var ganancia = new GananciaDiaDto(intereses, descuentos, intereses - descuentos);

        // ── Préstamos del día ────────────────────────────────────────────────
        var prestamosDia = await db.Prestamos
            .Where(p => p.FechaPrestamo >= fechaDt && p.FechaPrestamo < fechaDtSig)
            .Select(p => new { p.Id, p.PrestamoOrigenId, p.ValorPrestado, p.FrecuenciaPago })
            .ToListAsync();

        var nuevos   = prestamosDia.Where(p => p.PrestamoOrigenId == null).ToList();
        var renovados = prestamosDia.Where(p => p.PrestamoOrigenId != null).ToList();

        var capitalNuevos = nuevos.Sum(p => p.ValorPrestado);

        // Para renovados: el dinero fresco entregado es DineroAdicional de la novedad recoger_prestamo
        // donde PrestamoDestinoId apunta al nuevo préstamo creado
        var renovadosIds = renovados.Select(p => p.Id).ToList();
        var capitalRenovados = renovadosIds.Count > 0
            ? await db.NovedadesPrestamo
                .Where(n => n.Tipo == "recoger_prestamo"
                         && n.PrestamoDestinoId.HasValue
                         && renovadosIds.Contains(n.PrestamoDestinoId!.Value))
                .SumAsync(n => (decimal?)n.DineroAdicional) ?? 0m
            : 0m;

        var prontoPagoCount = await db.NovedadesPrestamo
            .CountAsync(n => n.Tipo == "pronto_pago"
                          && n.FechaNovedad >= fechaDt
                          && n.FechaNovedad < fechaDtSig);

        var porFrecuencia = nuevos
            .GroupBy(p => p.FrecuenciaPago)
            .Select(g => new FrecuenciaCountDto(g.Key, g.Count()))
            .ToList();

        var prestamosDiaDto = new PrestamosDiaDto(
            nuevos.Count,
            renovados.Count,
            capitalNuevos + capitalRenovados,
            prontoPagoCount,
            porFrecuencia);

        // ── Cobros ───────────────────────────────────────────────────────────
        var recaudadoTotal = await db.Pagos
            .Where(p => !p.Anulado && p.FechaPago >= fechaDt && p.FechaPago < fechaDtSig)
            .SumAsync(p => (decimal?)p.Valor) ?? 0m;

        var prestamosActivosCount = await db.Prestamos
            .CountAsync(p => p.Estado == "activo");

        var pagosConZona = await db.Pagos
            .Where(p => !p.Anulado && p.FechaPago >= fechaDt && p.FechaPago < fechaDtSig)
            .Where(p => p.Prestamo != null
                     && p.Prestamo.Cliente != null
                     && p.Prestamo.Cliente.Zona != null)
            .Select(p => new
            {
                p.Valor,
                p.PrestamoId,
                ZonaId    = p.Prestamo!.Cliente!.ZonaId,
                ZonaNombre = p.Prestamo.Cliente.Zona!.Nombre
            })
            .ToListAsync();

        var cuotasConZona = await db.Cuotas
            .Where(c => c.FechaEsperada >= fechaDt && c.FechaEsperada < fechaDtSig)
            .Where(c => c.Prestamo != null
                     && c.Prestamo.Cliente != null
                     && c.Prestamo.Cliente.Zona != null)
            .Select(c => new
            {
                ZonaId    = c.Prestamo!.Cliente!.ZonaId,
                ZonaNombre = c.Prestamo.Cliente.Zona!.Nombre
            })
            .ToListAsync();

        var zonasConActividad = pagosConZona.Select(p => p.ZonaId)
            .Union(cuotasConZona.Select(c => c.ZonaId))
            .Distinct();

        var porZona = zonasConActividad.Select(zonaId =>
        {
            var nombre      = pagosConZona.FirstOrDefault(p => p.ZonaId == zonaId)?.ZonaNombre
                           ?? cuotasConZona.FirstOrDefault(c => c.ZonaId == zonaId)?.ZonaNombre
                           ?? string.Empty;
            var programados = cuotasConZona.Count(c => c.ZonaId == zonaId);
            var pagaron     = pagosConZona.Where(p => p.ZonaId == zonaId)
                                          .Select(p => p.PrestamoId).Distinct().Count();
            var total       = pagosConZona.Where(p => p.ZonaId == zonaId).Sum(p => p.Valor);
            return new CobrosZonaDto(zonaId, nombre, programados, pagaron, total);
        }).ToList();

        var cobros = new CobrosDiaDto(recaudadoTotal, prestamosActivosCount, porZona);

        return new CierreDiaDto(fecha, ganancia, prestamosDiaDto, cobros);
    }
}
