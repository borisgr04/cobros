using CobrosApi.Data;
using CobrosApi.Features.Pagos;
using CobrosApi.Features.Shared;
using CobrosApi.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CobrosApi.Tests.Features.Pagos;

/// <summary>
/// Tests unitarios directos sobre los handlers AplicarPago y AnularPago,
/// sin pasar por la capa HTTP.
/// </summary>
public class PagosHandlerTests
{
    private static CobrosDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<CobrosDbContext>()
            .UseInMemoryDatabase($"HandlerTest_{Guid.NewGuid()}")
            .Options;
        return new CobrosDbContext(options);
    }

    private static async Task<(CobrosDbContext db, Prestamo prestamo)> SeedPrestamoConCuotasAsync(
        string estadoPrestamo = PrestamoEstados.Prestamo.Activo,
        int cantidadCuotas   = 3,
        decimal valorCuota   = 100m)
    {
        var db = CreateDb();

        var zona   = new Zona   { Nombre = "Z1" };
        var cliente = new Cliente { Nombre = "C1", Identificacion = $"ID{Guid.NewGuid():N}", ZonaId = 0 };
        db.Zonas.Add(zona);
        db.Clientes.Add(cliente);
        await db.SaveChangesAsync();
        cliente.ZonaId = zona.Id;

        var prestamo = new Prestamo
        {
            ClienteId          = cliente.Id,
            FechaPrestamo      = DateTime.Today,
            FechaFinal         = DateTime.Today.AddMonths(cantidadCuotas),
            ValorPrestado      = valorCuota * cantidadCuotas,
            ValorTotal         = valorCuota * cantidadCuotas,
            InteresProyectado  = 0,
            CantidadCuotas     = cantidadCuotas,
            ValorCuota         = valorCuota,
            Estado             = estadoPrestamo
        };
        db.Prestamos.Add(prestamo);
        await db.SaveChangesAsync();

        for (int i = 1; i <= cantidadCuotas; i++)
        {
            db.Cuotas.Add(new Cuota
            {
                PrestamoId  = prestamo.Id,
                NumeroCuota = i,
                FechaEsperada = DateTime.Today.AddDays(i * 7),
                ValorCuota  = valorCuota,
                SaldoPagado = 0,
                Estado      = PrestamoEstados.Cuota.Pendiente
            });
        }
        await db.SaveChangesAsync();

        return (db, prestamo);
    }

    // ── AplicarPago ───────────────────────────────────────────────────────

    [Fact]
    public async Task AplicarPago_PrestamoCompletado_RetornaFail()
    {
        var (db, prestamo) = await SeedPrestamoConCuotasAsync(
            estadoPrestamo: PrestamoEstados.Prestamo.Completado);

        var handler = new AplicarPago(db);
        var result  = await handler.ExecuteAsync(
            new AplicarPagoDto(prestamo.Id, 100m, DateTime.Today));

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
        Assert.Contains("cerrado", result.Error, StringComparison.OrdinalIgnoreCase);

        // No se persistió ningún pago
        Assert.Empty(await db.Pagos.ToListAsync());
    }

    [Fact]
    public async Task AplicarPago_DistribucionCorrecta_ActualizaSaldoYEstado()
    {
        // 3 cuotas de 100. Abono de 250 → cubre cuotas 1 y 2 completas, cuota 3 parcial (50)
        var (db, prestamo) = await SeedPrestamoConCuotasAsync(cantidadCuotas: 3, valorCuota: 100m);

        var handler = new AplicarPago(db);
        var result  = await handler.ExecuteAsync(
            new AplicarPagoDto(prestamo.Id, 250m, DateTime.Today));

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);

        var cuotas = await db.Cuotas
            .Where(c => c.PrestamoId == prestamo.Id)
            .OrderBy(c => c.NumeroCuota)
            .ToListAsync();

        Assert.Equal(PrestamoEstados.Cuota.Pagada,   cuotas[0].Estado);
        Assert.Equal(100m,                           cuotas[0].SaldoPagado);
        Assert.Equal(PrestamoEstados.Cuota.Pagada,   cuotas[1].Estado);
        Assert.Equal(100m,                           cuotas[1].SaldoPagado);
        Assert.Equal(PrestamoEstados.Cuota.Parcial,  cuotas[2].Estado);
        Assert.Equal(50m,                            cuotas[2].SaldoPagado);

        // 3 aplicaciones creadas
        var aplicaciones = await db.AplicacionesCuota
            .Where(a => a.PagoId == result.Value.Id)
            .ToListAsync();
        Assert.Equal(3, aplicaciones.Count);
    }

    // ── AnularPago ────────────────────────────────────────────────────────

    [Fact]
    public async Task AnularPago_NoEsUltimoPago_RetornaFail()
    {
        var (db, prestamo) = await SeedPrestamoConCuotasAsync(cantidadCuotas: 3, valorCuota: 100m);

        // Crear dos pagos — intentar anular el primero (no es el último)
        var handler = new AplicarPago(db);
        var r1 = await handler.ExecuteAsync(new AplicarPagoDto(prestamo.Id, 100m, DateTime.Today));
        var r2 = await handler.ExecuteAsync(new AplicarPagoDto(prestamo.Id, 100m, DateTime.Today));

        Assert.True(r1.IsSuccess);
        Assert.True(r2.IsSuccess);

        var anular = new AnularPago(db);
        var result = await anular.ExecuteAsync(new AnularPagoDto(r1.Value!.Id, "test"));

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
        Assert.Contains("reciente", result.Error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task AnularPago_UltimoPago_RevierteEstadoCuotas()
    {
        var (db, prestamo) = await SeedPrestamoConCuotasAsync(cantidadCuotas: 2, valorCuota: 100m);

        // Pagar las 2 cuotas completas
        var aplicar = new AplicarPago(db);
        var rPago   = await aplicar.ExecuteAsync(new AplicarPagoDto(prestamo.Id, 200m, DateTime.Today));
        Assert.True(rPago.IsSuccess);

        // Verificar que las cuotas quedaron pagadas
        var cuotasAntesAnulacion = await db.Cuotas
            .Where(c => c.PrestamoId == prestamo.Id)
            .OrderBy(c => c.NumeroCuota)
            .ToListAsync();
        Assert.All(cuotasAntesAnulacion, c => Assert.Equal(PrestamoEstados.Cuota.Pagada, c.Estado));

        // Anular el pago
        var anular = new AnularPago(db);
        var result = await anular.ExecuteAsync(new AnularPagoDto(rPago.Value!.Id, "test reversal"));

        Assert.True(result.IsSuccess);
        Assert.True(result.Value!.Anulado);

        // Las cuotas deben volver a pendiente con SaldoPagado = 0
        var cuotasPostAnulacion = await db.Cuotas
            .Where(c => c.PrestamoId == prestamo.Id)
            .OrderBy(c => c.NumeroCuota)
            .ToListAsync();

        Assert.All(cuotasPostAnulacion, c =>
        {
            Assert.Equal(PrestamoEstados.Cuota.Pendiente, c.Estado);
            Assert.Equal(0m, c.SaldoPagado);
        });
    }
}
