using CobrosApi.Data;
using CobrosApi.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CobrosApi.Controllers;

[ApiController]
[Route("api/reportes")]
[Authorize]
[Produces("application/json")]
public class ReportesController(CobrosDbContext db) : ControllerBase
{
    /// <summary>
    /// Devuelve el reporte completo para un rango de fechas:
    ///   - Préstamos nuevos (FechaPrestamo en el rango)
    ///   - Préstamos finalizados (FechaFinal en el rango)
    ///   - Recaudo por zona con detalle por cliente (pagos con FechaPago en el rango)
    /// </summary>
    /// <param name="fechaInicio">Inicio del rango (ISO 8601, requerido)</param>
    /// <param name="fechaFin">Fin del rango (ISO 8601, requerido)</param>
    /// <param name="zonaId">Filtro opcional por zona</param>
    [HttpGet]
    [ProducesResponseType(typeof(ReporteCompletoDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    public async Task<IActionResult> GetReporte(
        [FromQuery] DateTime fechaInicio,
        [FromQuery] DateTime fechaFin,
        [FromQuery] int? zonaId = null)
    {
        if (fechaFin < fechaInicio)
            return BadRequest(new ErrorDto { Error = "fechaFin debe ser mayor o igual a fechaInicio" });

        // Normalizar a día completo
        var inicio = fechaInicio.Date;
        var fin = fechaFin.Date.AddDays(1).AddTicks(-1);

        // ── Préstamos nuevos ─────────────────────────────────────────────────
        var qNuevos = db.Prestamos
            .AsNoTracking()
            .Include(p => p.Cliente).ThenInclude(c => c!.Zona)
            .Where(p => p.FechaPrestamo >= inicio && p.FechaPrestamo <= fin);

        if (zonaId.HasValue)
            qNuevos = qNuevos.Where(p => p.Cliente!.ZonaId == zonaId.Value);

        var prestamosNuevos = await qNuevos
            .OrderBy(p => p.FechaPrestamo)
            .Select(p => new ReportePrestamoNuevoDto
            {
                PrestamoId      = p.Id.ToString(),
                ClienteId       = p.ClienteId.ToString(),
                ClienteNombre   = p.Cliente!.Nombre,
                ZonaId          = p.Cliente.ZonaId.ToString(),
                ZonaNombre      = p.Cliente.Zona!.Nombre,
                FechaPrestamo   = p.FechaPrestamo,
                ValorPrestado   = p.ValorPrestado,
                ValorTotal      = p.ValorTotal,
                FrecuenciaPago  = p.FrecuenciaPago,
                CantidadCuotas  = p.CantidadCuotas,
                ValorCuota      = p.ValorCuota,
                PrestamoOrigenId = p.PrestamoOrigenId.HasValue ? p.PrestamoOrigenId.Value.ToString() : null
            })
            .ToListAsync();

        // ── Préstamos finalizados ────────────────────────────────────────────
        var qFinalizados = db.Prestamos
            .AsNoTracking()
            .Include(p => p.Pagos)
            .Include(p => p.Cliente).ThenInclude(c => c!.Zona)
            .Where(p => p.FechaFinal >= inicio && p.FechaFinal <= fin);

        if (zonaId.HasValue)
            qFinalizados = qFinalizados.Where(p => p.Cliente!.ZonaId == zonaId.Value);

        var prestamosFinalizados = await qFinalizados
            .OrderBy(p => p.FechaFinal)
            .Select(p => new ReportePrestamoFinalizadoDto
            {
                PrestamoId     = p.Id.ToString(),
                ClienteId      = p.ClienteId.ToString(),
                ClienteNombre  = p.Cliente!.Nombre,
                ZonaId         = p.Cliente.ZonaId.ToString(),
                ZonaNombre     = p.Cliente.Zona!.Nombre,
                FechaPrestamo  = p.FechaPrestamo,
                FechaFinal     = p.FechaFinal,
                ValorPrestado  = p.ValorPrestado,
                ValorTotal     = p.ValorTotal,
                TotalPagado    = p.Pagos.Where(pg => !pg.Anulado).Sum(pg => pg.Valor),
                EstadoFinalizacion = p.Estado == "refinanciado"
                    ? "refinanciado"
                    : p.Estado == "cerrado_pronto_pago"
                        ? "pronto_pago"
                        : p.Pagos.Where(pg => !pg.Anulado).Sum(pg => pg.Valor) >= p.ValorTotal
                            ? "pagado_completo"
                            : "vencido_sin_pagar"
            })
            .ToListAsync();

        // ── Recaudo por zona con detalle por cliente ─────────────────────────
        // Cargar zonas
        var zonasQuery = db.Zonas.AsNoTracking();
        if (zonaId.HasValue)
            zonasQuery = zonasQuery.Where(z => z.Id == zonaId.Value);
        var zonas = await zonasQuery.ToListAsync();

        // Pagos en el rango, con datos de préstamo y cliente
        var pagosDelPeriodo = await db.Pagos
            .AsNoTracking()
            .Include(pg => pg.Prestamo).ThenInclude(p => p!.Cliente).ThenInclude(c => c!.Zona)
            .Where(pg => pg.FechaPago >= inicio && pg.FechaPago <= fin
                      && !pg.Anulado
                      && (!zonaId.HasValue || pg.Prestamo!.Cliente!.ZonaId == zonaId.Value))
            .ToListAsync();

        // Préstamos activos en el período (para calcular monto esperado)
        // Se excluyen préstamos cerrados (refinanciado, pronto pago) ya que no generan cobro pendiente
        var prestamosActivosEnPeriodo = await db.Prestamos
            .AsNoTracking()
            .Include(p => p.Cliente)
            .Where(p => p.FechaFinal >= inicio
                     && p.Estado != "refinanciado"
                     && p.Estado != "cerrado_pronto_pago"
                     && (!zonaId.HasValue || p.Cliente!.ZonaId == zonaId.Value))
            .ToListAsync();

        // Agrupar pagos por zona → cliente
        var recaudoPorZona = zonas.Select(zona =>
        {
            var pagosZona = pagosDelPeriodo
                .Where(pg => pg.Prestamo?.Cliente?.ZonaId == zona.Id)
                .ToList();

            var prestamosZona = prestamosActivosEnPeriodo
                .Where(p => p.Cliente?.ZonaId == zona.Id)
                .ToList();

            // Agrupar por cliente
            var clienteIds = pagosZona
                .Select(pg => pg.Prestamo!.ClienteId)
                .Union(prestamosZona.Select(p => p.ClienteId))
                .Distinct();

            var clientes = clienteIds.Select(clienteId =>
            {
                var pagosCli = pagosZona
                    .Where(pg => pg.Prestamo!.ClienteId == clienteId)
                    .ToList();
                var prestamosCli = prestamosZona
                    .Where(p => p.ClienteId == clienteId)
                    .ToList();

                var montoCobrado  = pagosCli.Sum(pg => pg.Valor);
                var montoEsperado = prestamosCli.Sum(p => ContarCuotasEnPeriodo(p, inicio, fin) * p.ValorCuota);

                var clienteInfo = pagosCli.FirstOrDefault()?.Prestamo?.Cliente
                               ?? prestamosCli.FirstOrDefault()?.Cliente;

                return new ReporteClienteRecaudoDto
                {
                    ClienteId     = clienteId.ToString(),
                    ClienteNombre = clienteInfo?.Nombre ?? string.Empty,
                    ClienteAlias  = clienteInfo?.Alias,
                    MontoCobrado  = montoCobrado,
                    MontoEsperado = montoEsperado,
                    PagosRealizados = pagosCli.Count,
                    PorcentajeCumplimiento = montoEsperado > 0
                        ? (double)(montoCobrado / montoEsperado) * 100
                        : 0
                };
            })
            .OrderByDescending(c => c.MontoCobrado)
            .ToList();

            var zonaMontoCobrado  = clientes.Sum(c => c.MontoCobrado);
            var zonaMontoEsperado = clientes.Sum(c => c.MontoEsperado);

            return new ReporteRecaudoZonaDto
            {
                ZonaId         = zona.Id.ToString(),
                ZonaNombre     = zona.Nombre,
                MontoCobrado   = zonaMontoCobrado,
                MontoEsperado  = zonaMontoEsperado,
                PagosRealizados = pagosZona.Count,
                PorcentajeCumplimiento = zonaMontoEsperado > 0
                    ? (double)(zonaMontoCobrado / zonaMontoEsperado) * 100
                    : 0,
                Clientes = clientes
            };
        })
        .Where(z => z.MontoCobrado > 0 || z.MontoEsperado > 0)
        .OrderByDescending(z => z.MontoCobrado)
        .ToList();

        return Ok(new ReporteCompletoDto
        {
            FechaInicio          = inicio,
            FechaFin             = fechaFin.Date,
            PrestamosNuevos      = prestamosNuevos,
            PrestamosFinalizados = prestamosFinalizados,
            RecaudoPorZona       = recaudoPorZona
        });
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static int ContarCuotasEnPeriodo(
        CobrosApi.Models.Prestamo prestamo,
        DateTime fechaInicio,
        DateTime fechaFin)
    {
        var diasEntreCuotas = prestamo.FrecuenciaPago switch
        {
            "diario"    => 1,
            "semanal"   => 7,
            "quincenal" => 15,
            "mensual"   => 30,
            _           => 7
        };

        int contador = 0;
        var fechaBase = prestamo.FechaPrestamo.Date;

        for (int i = 1; i <= prestamo.CantidadCuotas; i++)
        {
            var fechaCuota = fechaBase.AddDays((double)i * diasEntreCuotas);
            if (fechaCuota >= fechaInicio && fechaCuota <= fechaFin)
                contador++;
        }

        return contador;
    }
}
