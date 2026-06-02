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
        // Préstamo guardado como medianoche UTC (como lo hace el sistema al registrar)
        var fechaFinalUtcMidnight = new DateTime(2026, 6, 2, 0, 0, 0, DateTimeKind.Utc);
        await SeedPrestamoAsync(db, "completado",
            fechaFinal:  fechaFinalUtcMidnight,
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
}
