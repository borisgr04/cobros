using CobrosApi.Data;
using CobrosApi.Features.Shared;
using CobrosApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CobrosApi.Features.Pagos;

public record AnularPagoDto(int PagoId, string Motivo);

public class AnularPago(CobrosDbContext db)
{
    private static string RecalcularEstadoCuota(Cuota cuota) =>
        cuota.SaldoPagado >= cuota.ValorCuota ? PrestamoEstados.Cuota.Pagada
        : cuota.SaldoPagado > 0              ? PrestamoEstados.Cuota.Parcial
        :                                      PrestamoEstados.Cuota.Pendiente;

    public async Task<Result<Pago>> ExecuteAsync(AnularPagoDto dto)
    {
        var pago = await db.Pagos.FirstOrDefaultAsync(p => p.Id == dto.PagoId);
        if (pago is null)
            return Result<Pago>.NotFound($"Pago {dto.PagoId} no encontrado");

        if (pago.Anulado)
            return Result<Pago>.Fail("El pago ya está anulado");

        // Verificar que sea el pago activo más reciente del préstamo
        var ultimoPagoActivo = await db.Pagos
            .Where(p => p.PrestamoId == pago.PrestamoId && !p.Anulado)
            .OrderByDescending(p => p.FechaPago)
            .ThenByDescending(p => p.Id)
            .Select(p => (int?)p.Id)
            .FirstOrDefaultAsync();

        if (!PagosRules.EsUltimoPagoActivo(pago.Id, ultimoPagoActivo))
            return Result<Pago>.Fail("Solo se puede anular el pago más reciente");

        using var tx = db.Database.IsInMemory()
            ? null
            : await db.Database.BeginTransactionAsync();

        // Revertir el saldo en cada cuota afectada
        var aplicaciones = await db.AplicacionesCuota
            .Include(a => a.Cuota)
            .Where(a => a.PagoId == dto.PagoId)
            .ToListAsync();

        foreach (var aplicacion in aplicaciones)
        {
            if (aplicacion.Cuota is not null)
            {
                aplicacion.Cuota.SaldoPagado -= aplicacion.ValorAplicado;
                aplicacion.Cuota.Estado       = RecalcularEstadoCuota(aplicacion.Cuota);
            }
        }

        // Marcar el pago como anulado
        pago.Anulado         = true;
        pago.FechaAnulacion  = DateTime.UtcNow;
        pago.MotivoAnulacion = dto.Motivo;

        await db.SaveChangesAsync();
        if (tx is not null) await tx.CommitAsync();

        return Result<Pago>.Ok(pago);
    }
}
