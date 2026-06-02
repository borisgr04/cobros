using CobrosApi.Data;
using CobrosApi.Features.Shared;
using CobrosApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CobrosApi.Features.Pagos;

public record AplicarPagoDto(int PrestamoId, decimal Valor, DateTime FechaPago);

public class AplicarPago(CobrosDbContext db)
{
    private static string RecalcularEstadoCuota(Cuota cuota) =>
        cuota.SaldoPagado >= cuota.ValorCuota ? PrestamoEstados.Cuota.Pagada
        : cuota.SaldoPagado > 0              ? PrestamoEstados.Cuota.Parcial
        :                                      PrestamoEstados.Cuota.Pendiente;

    public async Task<Result<Pago>> ExecuteAsync(AplicarPagoDto dto)
    {
        var prestamo = await db.Prestamos.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == dto.PrestamoId);

        if (prestamo is null)
            return Result<Pago>.Fail($"Préstamo {dto.PrestamoId} no existe");

        if (!PagosRules.PrestamoAceptaPagos(prestamo.Estado))
            return Result<Pago>.Fail("No se pueden registrar pagos en un préstamo cerrado");

        // Cargar cuotas no completamente pagadas, ordenadas por NumeroCuota
        var cuotas = await db.Cuotas
            .Where(c => c.PrestamoId == dto.PrestamoId && c.SaldoPagado < c.ValorCuota)
            .OrderBy(c => c.NumeroCuota)
            .ToListAsync();

        // Validar que el abono no supere el saldo pendiente total
        var saldoPendiente = cuotas.Sum(c => c.ValorCuota - c.SaldoPagado);
        if (cuotas.Count > 0 && dto.Valor > saldoPendiente)
            return Result<Pago>.Fail($"El abono (${dto.Valor:N0}) supera el saldo pendiente (${saldoPendiente:N0})");

        using var tx = db.Database.IsInMemory()
            ? null
            : await db.Database.BeginTransactionAsync();

        var pago = new Pago
        {
            PrestamoId = dto.PrestamoId,
            Valor      = dto.Valor,
            FechaPago  = dto.FechaPago
        };
        db.Pagos.Add(pago);
        await db.SaveChangesAsync(); // necesitamos pago.Id para AplicacionCuota

        // Distribuir el abono en cuotas pendientes/parciales
        var restante = dto.Valor;
        foreach (var cuota in cuotas)
        {
            if (restante <= 0) break;

            var espacio       = cuota.ValorCuota - cuota.SaldoPagado;
            var valorAplicado = Math.Min(restante, espacio);

            cuota.SaldoPagado += valorAplicado;
            cuota.Estado       = RecalcularEstadoCuota(cuota);
            db.AplicacionesCuota.Add(new AplicacionCuota
            {
                PagoId        = pago.Id,
                CuotaId       = cuota.Id,
                ValorAplicado = valorAplicado
            });

            restante -= valorAplicado;
        }

        await db.SaveChangesAsync();
        if (tx is not null) await tx.CommitAsync();

        return Result<Pago>.Ok(pago);
    }
}
