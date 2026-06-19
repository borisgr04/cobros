using CobrosApi.Data;
using CobrosApi.Features.Reportes;
using CobrosApi.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CobrosApi.Tests.Features.Reportes;

public class GetCierreDiaQueryTests
{
    private static CobrosDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<CobrosDbContext>()
            .UseInMemoryDatabase($"CierreDiaQueryTest_{Guid.NewGuid()}")
            .Options;
        return new CobrosDbContext(options);
    }

    [Fact]
    public async Task ExecuteAsync_DatosConRelacionesHuerfanas_NoLanzaError()
    {
        await using var db = CreateDb();
        var fecha = new DateOnly(2026, 6, 5);
        // 06:00Z cae dentro del día local 2026-06-05 para zona Colombia (UTC-5).
        var fechaDt = new DateTime(2026, 6, 5, 6, 0, 0, DateTimeKind.Utc);

        var zona = new Zona { Nombre = "Centro" };
        db.Zonas.Add(zona);
        await db.SaveChangesAsync();

        var cliente = new Cliente
        {
            Nombre = "Cliente Test",
            Identificacion = $"ID{Guid.NewGuid():N}",
            ZonaId = zona.Id
        };
        db.Clientes.Add(cliente);
        await db.SaveChangesAsync();

        var prestamo = new Prestamo
        {
            ClienteId = cliente.Id,
            FechaPrestamo = fechaDt,
            FechaFinal = fechaDt.AddDays(30),
            ValorPrestado = 100000,
            ValorTotal = 120000,
            InteresProyectado = 20000,
            FrecuenciaPago = "semanal",
            CantidadCuotas = 4,
            ValorCuota = 30000,
            Estado = "activo"
        };
        db.Prestamos.Add(prestamo);
        await db.SaveChangesAsync();

        db.Pagos.Add(new Pago
        {
            PrestamoId = prestamo.Id,
            Valor = 30000,
            FechaPago = fechaDt,
            TipoPago = "regular"
        });

        db.Pagos.Add(new Pago
        {
            PrestamoId = 999999,
            Valor = 50000,
            FechaPago = fechaDt,
            TipoPago = "regular"
        });

        db.Cuotas.Add(new Cuota
        {
            PrestamoId = prestamo.Id,
            NumeroCuota = 1,
            FechaEsperada = fechaDt,
            ValorCuota = 30000,
            Estado = "pendiente"
        });

        db.Cuotas.Add(new Cuota
        {
            PrestamoId = 888888,
            NumeroCuota = 1,
            FechaEsperada = fechaDt,
            ValorCuota = 45000,
            Estado = "pendiente"
        });

        await db.SaveChangesAsync();

        var result = await GetCierreDiaQuery.ExecuteAsync(db, fecha);

        Assert.NotNull(result);
        Assert.NotNull(result.Cobros);
        Assert.Single(result.Cobros.PorZona);
        Assert.Equal(zona.Id, result.Cobros.PorZona[0].ZonaId);
    }
}
