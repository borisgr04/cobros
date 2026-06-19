using CobrosApi.Controllers;
using CobrosApi.Data;
using CobrosApi.DTOs;
using CobrosApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CobrosApi.Tests.Controllers;

/// <summary>
/// Tests unitarios del ReportesController enfocados en el filtrado de préstamos finalizados.
/// Usan base de datos InMemory para aislar cada test.
/// </summary>
public class ReportesControllerTests
{
    private static CobrosDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<CobrosDbContext>()
            .UseInMemoryDatabase($"ReportesTest_{Guid.NewGuid()}")
            .Options;
        return new CobrosDbContext(options);
    }

    private static async Task<(CobrosDbContext db, Prestamo prestamo)> SeedPrestamoAsync(
        CobrosDbContext db,
        string estado,
        DateTime fechaFinal,
        DateTime? fechaCierre = null)
    {
        var zona = new Zona { Nombre = "Z1" };
        var cliente = new Cliente
        {
            Nombre = "Test Cliente",
            Identificacion = $"ID{Guid.NewGuid():N}",
            ZonaId = 0
        };
        db.Zonas.Add(zona);
        db.Clientes.Add(cliente);
        await db.SaveChangesAsync();
        cliente.ZonaId = zona.Id;

        var prestamo = new Prestamo
        {
            ClienteId         = cliente.Id,
            FechaPrestamo     = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            FechaFinal        = fechaFinal,
            ValorPrestado     = 500000,
            ValorTotal        = 600000,
            InteresProyectado = 100000,
            FrecuenciaPago    = "semanal",
            CantidadCuotas    = 12,
            ValorCuota        = 50000,
            Estado            = estado,
            FechaCierre       = fechaCierre
        };
        db.Prestamos.Add(prestamo);
        await db.SaveChangesAsync();

        return (db, prestamo);
    }

    // ── 3.1: refinanciado con FechaCierre en rango ────────────────────────

    [Fact]
    public async Task GetReporte_PrestamoRefinanciado_UsaFechaCierreParaFiltrar()
    {
        var db = CreateDb();
        // FechaFinal en septiembre, FechaCierre hoy (2 de junio)
        var fechaRango = new DateTime(2026, 6, 2, 0, 0, 0, DateTimeKind.Utc);
        await SeedPrestamoAsync(db, "refinanciado",
            fechaFinal:   new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc),
            fechaCierre:  fechaRango);

        var controller = new ReportesController(db);
        var result = await controller.GetReporte(fechaRango, fechaRango, zonaId: null) as OkObjectResult;

        Assert.NotNull(result);
        var reporte = result.Value as ReporteCompletoDto;
        Assert.NotNull(reporte);
        Assert.Single(reporte.PrestamosFinalizados);
        Assert.Equal("refinanciado", reporte.PrestamosFinalizados[0].EstadoFinalizacion);
    }

    // ── 3.2: cerrado_pronto_pago con FechaCierre en rango ─────────────────

    [Fact]
    public async Task GetReporte_PrestamoProntoPago_UsaFechaCierreParaFiltrar()
    {
        var db = CreateDb();
        var fechaRango = new DateTime(2026, 6, 2, 0, 0, 0, DateTimeKind.Utc);
        await SeedPrestamoAsync(db, "cerrado_pronto_pago",
            fechaFinal:  new DateTime(2026, 8, 15, 0, 0, 0, DateTimeKind.Utc),
            fechaCierre: fechaRango);

        var controller = new ReportesController(db);
        var result = await controller.GetReporte(fechaRango, fechaRango, zonaId: null) as OkObjectResult;

        Assert.NotNull(result);
        var reporte = result.Value as ReporteCompletoDto;
        Assert.NotNull(reporte);
        Assert.Single(reporte.PrestamosFinalizados);
        Assert.Equal("pronto_pago", reporte.PrestamosFinalizados[0].EstadoFinalizacion);
    }

    // ── 3.3: completado sigue usando FechaFinal ───────────────────────────

    [Fact]
    public async Task GetReporte_PrestamoCompletado_UsaFechaFinalParaFiltrar()
    {
        var db = CreateDb();
        var fechaFinal = new DateTime(2026, 6, 2, 0, 0, 0, DateTimeKind.Utc);
        await SeedPrestamoAsync(db, "completado",
            fechaFinal:  fechaFinal,
            fechaCierre: null);

        var controller = new ReportesController(db);
        var result = await controller.GetReporte(fechaFinal, fechaFinal, zonaId: null) as OkObjectResult;

        Assert.NotNull(result);
        var reporte = result.Value as ReporteCompletoDto;
        Assert.NotNull(reporte);
        Assert.Single(reporte.PrestamosFinalizados);
        Assert.Equal("pagado_completo", reporte.PrestamosFinalizados[0].EstadoFinalizacion);
    }

    // ── 3.4: timezone — fechaInicio con hora UTC-5 no excluye préstamo del mismo día ──

    [Fact]
    public async Task GetReporte_FechaInicioConComponenteHorario_PrestamoDelMismoDiaAparece()
    {
        var db = CreateDb();
        // Fecha dentro del día local 2026-06-02 (UTC-5): 06:00Z = 01:00 local.
        var fechaFinalUtcDiaLocal = new DateTime(2026, 6, 2, 6, 0, 0, DateTimeKind.Utc);
        await SeedPrestamoAsync(db, "completado",
            fechaFinal:  fechaFinalUtcDiaLocal,
            fechaCierre: null);

        // Simular el cliente enviando T05:00:00Z (Colombia UTC-5 interpretado como medianoche local)
        var fechaConHoraColombiana = new DateTime(2026, 6, 2, 5, 0, 0, DateTimeKind.Utc);
        var controller = new ReportesController(db);
        var result = await controller.GetReporte(fechaConHoraColombiana, fechaConHoraColombiana, zonaId: null) as OkObjectResult;

        Assert.NotNull(result);
        var reporte = result.Value as ReporteCompletoDto;
        Assert.NotNull(reporte);
        Assert.Single(reporte.PrestamosFinalizados);
    }

    [Fact]
    public async Task GetReporte_FiltroDiaLocal_NoIncluyePrestamosDelDiaAnteriorLocal()
    {
        var db = CreateDb();

        var zona = new Zona { Nombre = "Z2" };
        var cliente = new Cliente
        {
            Nombre = "Cliente TZ",
            Identificacion = $"ID{Guid.NewGuid():N}",
            ZonaId = 0
        };
        db.Zonas.Add(zona);
        db.Clientes.Add(cliente);
        await db.SaveChangesAsync();
        cliente.ZonaId = zona.Id;

        // 2026-06-15 02:00Z = 2026-06-14 21:00 (Colombia). Debe pertenecer al 14 local.
        var prestamoDiaAnteriorLocal = new Prestamo
        {
            ClienteId = cliente.Id,
            FechaPrestamo = new DateTime(2026, 6, 15, 2, 0, 0, DateTimeKind.Utc),
            FechaFinal = new DateTime(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc),
            ValorPrestado = 100000,
            ValorTotal = 120000,
            InteresProyectado = 20000,
            FrecuenciaPago = "semanal",
            CantidadCuotas = 4,
            ValorCuota = 30000,
            Estado = "activo"
        };

        // 2026-06-15 06:00Z = 2026-06-15 01:00 (Colombia). Debe pertenecer al 15 local.
        var prestamoDiaFiltrado = new Prestamo
        {
            ClienteId = cliente.Id,
            FechaPrestamo = new DateTime(2026, 6, 15, 6, 0, 0, DateTimeKind.Utc),
            FechaFinal = new DateTime(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc),
            ValorPrestado = 200000,
            ValorTotal = 240000,
            InteresProyectado = 40000,
            FrecuenciaPago = "semanal",
            CantidadCuotas = 8,
            ValorCuota = 30000,
            Estado = "activo"
        };

        db.Prestamos.Add(prestamoDiaAnteriorLocal);
        db.Prestamos.Add(prestamoDiaFiltrado);
        await db.SaveChangesAsync();

        // El frontend envía el día 15 local como ISO UTC: 2026-06-15T05:00:00Z.
        var fechaFiltro = new DateTime(2026, 6, 15, 5, 0, 0, DateTimeKind.Utc);

        var controller = new ReportesController(db);
        var result = await controller.GetReporte(fechaFiltro, fechaFiltro, zonaId: null) as OkObjectResult;

        Assert.NotNull(result);
        var reporte = result.Value as ReporteCompletoDto;
        Assert.NotNull(reporte);
        Assert.Single(reporte.PrestamosNuevos);
        Assert.Equal(prestamoDiaFiltrado.Id.ToString(), reporte.PrestamosNuevos[0].PrestamoId);
    }
}
