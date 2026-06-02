using CobrosApi.Data;
using CobrosApi.Features.Liquidacion;
using CobrosApi.Features.Pagos;
using CobrosApi.Features.Shared;
using CobrosApi.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CobrosApi.Tests.Features.Liquidacion;

/// <summary>
/// Tests unitarios sobre los handlers EjecutarProntoPago y EjecutarAmpliacionPlazo,
/// y sobre CuotasService.
/// </summary>
public class LiquidacionHandlerTests
{
    private static CobrosDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<CobrosDbContext>()
            .UseInMemoryDatabase($"LiqHandlerTest_{Guid.NewGuid()}")
            .Options;
        return new CobrosDbContext(options);
    }

    private static async Task<(CobrosDbContext db, Prestamo prestamo, Usuario usuario)> SeedAsync(
        int    cantidadCuotas  = 3,
        decimal valorCuota     = 100m,
        decimal valorPrestado  = 0m)
    {
        var db = CreateDb();

        var zona    = new Zona    { Nombre = "Z1" };
        var cliente = new Cliente { Nombre = "C1", Identificacion = $"ID{Guid.NewGuid():N}", ZonaId = 0 };
        var usuario = new Usuario { Nombre = "U1", Email = $"u{Guid.NewGuid():N}@test.com" };
        db.Zonas.Add(zona);
        db.Clientes.Add(cliente);
        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();
        cliente.ZonaId = zona.Id;

        var capital = valorPrestado > 0 ? valorPrestado : valorCuota * cantidadCuotas;
        var prestamo = new Prestamo
        {
            ClienteId          = cliente.Id,
            FechaPrestamo      = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            FechaFinal         = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(cantidadCuotas),
            ValorPrestado      = capital,
            ValorTotal         = valorCuota * cantidadCuotas,
            InteresProyectado  = 0,
            CantidadCuotas     = cantidadCuotas,
            ValorCuota         = valorCuota,
            Estado             = PrestamoEstados.Prestamo.Activo,
            FrecuenciaPago     = "semanal"
        };
        db.Prestamos.Add(prestamo);
        await db.SaveChangesAsync();

        for (int i = 1; i <= cantidadCuotas; i++)
        {
            db.Cuotas.Add(new Cuota
            {
                PrestamoId    = prestamo.Id,
                NumeroCuota   = i,
                FechaEsperada = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc).AddDays(i * 7),
                ValorCuota    = valorCuota,
                SaldoPagado   = 0,
                Estado        = PrestamoEstados.Cuota.Pendiente
            });
        }
        await db.SaveChangesAsync();

        return (db, prestamo, usuario);
    }

    // ── EjecutarProntoPago ────────────────────────────────────────────────

    [Fact]
    public async Task EjecutarProntoPago_ValorMenorAlCapital_RetornaFail()
    {
        // Préstamo: capital 300, valor total 300 (sin interés), 3 cuotas de 100
        var (db, prestamo, usuario) = await SeedAsync(cantidadCuotas: 3, valorCuota: 100m, valorPrestado: 300m);

        var handler = new EjecutarProntoPago(db, new AplicarPago(db));
        var result  = await handler.ExecuteAsync(
            new EjecutarProntoPagoDto(prestamo.Id, ValorNegociado: 50m, Notas: null, UsuarioId: usuario.Id));

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
        Assert.Contains("capital", result.Error, StringComparison.OrdinalIgnoreCase);

        // Sin pagos creados
        Assert.Empty(await db.Pagos.ToListAsync());
    }

    [Fact]
    public async Task EjecutarProntoPago_ValorValido_CierraPrestamoYCuotas()
    {
        // Préstamo: capital 300, valor total 330 (con interés), 3 cuotas de 110
        var (db, prestamo, usuario) = await SeedAsync(cantidadCuotas: 3, valorCuota: 110m, valorPrestado: 300m);
        // Actualizamos ValorTotal para que coincida con cuotas
        prestamo.ValorTotal         = 330m;
        prestamo.InteresProyectado  = 30m;
        await db.SaveChangesAsync();

        var handler = new EjecutarProntoPago(db, new AplicarPago(db));
        // ValorNegociado = 300 (capital exacto, descuenta el interés de 30)
        var result = await handler.ExecuteAsync(
            new EjecutarProntoPagoDto(prestamo.Id, ValorNegociado: 300m, Notas: "test", UsuarioId: usuario.Id));

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);

        var dto = result.Value!;
        Assert.Equal(30m,  dto.DescuentoAplicado);
        Assert.Equal(300m, dto.ValorNegociado);

        // Préstamo cerrado
        var prestamoDb = await db.Prestamos.FindAsync(prestamo.Id);
        Assert.Equal(PrestamoEstados.Prestamo.CerradoProntoPago, prestamoDb!.Estado);
        Assert.NotNull(prestamoDb.FechaCierre);

        // Todas las cuotas deben estar cerradas o pagadas
        var cuotas = await db.Cuotas.Where(c => c.PrestamoId == prestamo.Id).ToListAsync();
        Assert.All(cuotas, c =>
            Assert.True(
                c.Estado == PrestamoEstados.Cuota.Pagada ||
                c.Estado == PrestamoEstados.Cuota.CerradaProntoPago,
                $"Cuota {c.NumeroCuota} tiene estado inesperado: {c.Estado}"));

        // Existe 1 pago de tipo pronto_pago
        var pagos = await db.Pagos.Where(p => p.PrestamoId == prestamo.Id).ToListAsync();
        Assert.Single(pagos);
        Assert.Equal("pronto_pago", pagos[0].TipoPago);

        // Existe 1 novedad
        var novedades = await db.NovedadesPrestamo.Where(n => n.PrestamoId == prestamo.Id).ToListAsync();
        Assert.Single(novedades);
        Assert.Equal("pronto_pago", novedades[0].Tipo);
    }

    // ── EjecutarAmpliacionPlazo ───────────────────────────────────────────

    [Fact]
    public async Task EjecutarAmpliacionPlazo_SinCuotasPendientes_RetornaFail()
    {
        var (db, prestamo, usuario) = await SeedAsync(cantidadCuotas: 2, valorCuota: 100m);

        // Marcar todas las cuotas como pagadas
        var cuotas = await db.Cuotas.Where(c => c.PrestamoId == prestamo.Id).ToListAsync();
        foreach (var c in cuotas)
        {
            c.Estado      = PrestamoEstados.Cuota.Pagada;
            c.SaldoPagado = c.ValorCuota;
        }
        await db.SaveChangesAsync();

        var handler = new EjecutarAmpliacionPlazo(db);
        var result  = await handler.ExecuteAsync(new EjecutarAmpliacionPlazoDto(
            PrestamoId:         prestamo.Id,
            InteresAdicional:   50m,
            CantidadCuotasNuevas: 3,
            FechaInicio:        new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            FrecuenciaNueva:    "semanal",
            Observacion:        null,
            UsuarioId:          usuario.Id));

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
        Assert.Contains("cuotas pendientes", result.Error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task EjecutarAmpliacionPlazo_GeneraNuevasCuotasConFechasCorrectas()
    {
        // 3 cuotas pendientes de 100 → saldo 300
        var (db, prestamo, usuario) = await SeedAsync(cantidadCuotas: 3, valorCuota: 100m);
        var fechaInicio = new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc);

        var handler = new EjecutarAmpliacionPlazo(db);
        var result  = await handler.ExecuteAsync(new EjecutarAmpliacionPlazoDto(
            PrestamoId:           prestamo.Id,
            InteresAdicional:     50m,          // nuevoSaldo = 300 + 50 = 350
            CantidadCuotasNuevas: 4,
            FechaInicio:          fechaInicio,
            FrecuenciaNueva:      "semanal",
            Observacion:          "ampliacion test",
            UsuarioId:            usuario.Id));

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);

        var dto = result.Value!;
        Assert.Equal(300m, dto.SaldoPendienteAnterior);
        Assert.Equal(350m, dto.NuevoSaldo);
        Assert.Equal(4,    dto.CantidadCuotasNuevas);

        // Cuotas originales → reemplazadas
        var cuotasOriginales = await db.Cuotas
            .Where(c => c.PrestamoId == prestamo.Id && c.NumeroCuota <= 3)
            .ToListAsync();
        Assert.All(cuotasOriginales, c =>
            Assert.Equal(PrestamoEstados.Cuota.ReemplazadaAmpliacion, c.Estado));

        // Nuevas cuotas → pendientes con fechas correctas (semanal)
        var nuevasCuotas = await db.Cuotas
            .Where(c => c.PrestamoId == prestamo.Id && c.NumeroCuota > 3)
            .OrderBy(c => c.NumeroCuota)
            .ToListAsync();
        Assert.Equal(4, nuevasCuotas.Count);

        for (int i = 0; i < nuevasCuotas.Count; i++)
        {
            var esperada = CuotasService.CalcularFechaCuota(fechaInicio, "semanal", i + 1);
            Assert.Equal(esperada, nuevasCuotas[i].FechaEsperada);
        }

        // Prestamo actualizado
        var prestamoDb = await db.Prestamos.FindAsync(prestamo.Id);
        Assert.Equal(3 + 4, prestamoDb!.CantidadCuotas);
        Assert.Equal("semanal", prestamoDb.FrecuenciaPago);

        // 1 novedad
        var novedades = await db.NovedadesPrestamo.Where(n => n.PrestamoId == prestamo.Id).ToListAsync();
        Assert.Single(novedades);
        Assert.Equal("ampliacion_plazo", novedades[0].Tipo);
    }

    // ── CuotasService ─────────────────────────────────────────────────────

    [Fact]
    public void CuotasService_CalcularFechaCuota_Semanal_EsCorrecta()
    {
        // Verifica que el cálculo no pierde timezone (Kind=Utc)
        var fechaInicio = new DateTime(2025, 1, 6, 0, 0, 0, DateTimeKind.Utc); // lunes

        var fecha1 = CuotasService.CalcularFechaCuota(fechaInicio, "semanal", 1);
        var fecha2 = CuotasService.CalcularFechaCuota(fechaInicio, "semanal", 2);
        var fecha4 = CuotasService.CalcularFechaCuota(fechaInicio, "semanal", 4);

        Assert.Equal(DateTimeKind.Utc, fecha1.Kind);
        Assert.Equal(DateTimeKind.Utc, fecha2.Kind);

        // Usar DateTimeOffset para comparar sin ambigüedad de timezone
        Assert.Equal(
            DateTimeOffset.Parse("2025-01-13T00:00:00Z"),
            new DateTimeOffset(fecha1, TimeSpan.Zero));
        Assert.Equal(
            DateTimeOffset.Parse("2025-01-20T00:00:00Z"),
            new DateTimeOffset(fecha2, TimeSpan.Zero));
        Assert.Equal(
            DateTimeOffset.Parse("2025-02-03T00:00:00Z"),
            new DateTimeOffset(fecha4, TimeSpan.Zero));
    }
}
