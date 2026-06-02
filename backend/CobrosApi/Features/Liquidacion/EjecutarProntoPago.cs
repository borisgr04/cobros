using CobrosApi.Data;
using CobrosApi.DTOs;
using CobrosApi.Features.Pagos;
using CobrosApi.Features.Shared;
using CobrosApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CobrosApi.Features.Liquidacion;

public record EjecutarProntoPagoDto(int PrestamoId, decimal ValorNegociado, string? Notas, int UsuarioId);

public class EjecutarProntoPago(CobrosDbContext db, AplicarPago aplicarPago)
{
    public async Task<Result<ProntoPagoResultadoDto>> ExecuteAsync(EjecutarProntoPagoDto dto)
    {
        var prestamo = await db.Prestamos
            .Include(p => p.Pagos)
            .Include(p => p.Cuotas)
            .FirstOrDefaultAsync(p => p.Id == dto.PrestamoId);

        if (prestamo is null)
            return Result<ProntoPagoResultadoDto>.NotFound($"Préstamo {dto.PrestamoId} no encontrado");

        if (!PagosRules.PrestamoAceptaPagos(prestamo.Estado))
            return Result<ProntoPagoResultadoDto>.Fail("El préstamo ya se encuentra cerrado");

        var totalPagado    = prestamo.Pagos.Where(p => !p.Anulado).Sum(p => p.Valor);
        var saldoPendiente = prestamo.ValorTotal - totalPagado;

        if (saldoPendiente <= 0)
            return Result<ProntoPagoResultadoDto>.Fail("El préstamo no tiene saldo pendiente");

        var cuotasPendientesList = prestamo.Cuotas
            .Where(c =>
                c.Estado != PrestamoEstados.Cuota.Pagada &&
                c.Estado != PrestamoEstados.Cuota.CerradaProntoPago &&
                c.SaldoPagado < c.ValorCuota)
            .OrderBy(c => c.NumeroCuota)
            .ToList();

        if (cuotasPendientesList.Count == 0)
            return Result<ProntoPagoResultadoDto>.Fail("No hay cuotas pendientes para aplicar el pronto pago");

        if (dto.ValorNegociado <= 0)
            return Result<ProntoPagoResultadoDto>.Fail("El valor negociado debe ser mayor a cero");

        if (dto.ValorNegociado > saldoPendiente)
            return Result<ProntoPagoResultadoDto>.Fail(
                $"El valor negociado (${dto.ValorNegociado:N0}) supera el saldo pendiente (${saldoPendiente:N0})");

        var capitalPendiente = Math.Max(0, prestamo.ValorPrestado - totalPagado);
        if (dto.ValorNegociado < capitalPendiente)
            return Result<ProntoPagoResultadoDto>.Fail(
                $"El valor negociado no puede ser menor al capital pendiente (${capitalPendiente:N0}). Solo se pueden descontar intereses futuros.");

        var interesesFuturos = prestamo.CantidadCuotas > 0
            ? Math.Round(prestamo.InteresProyectado / prestamo.CantidadCuotas * cuotasPendientesList.Count, 2)
            : 0;
        var descuento   = saldoPendiente - dto.ValorNegociado;
        var fechaCierre = DateTime.UtcNow;

        // Usar AplicarPago para crear y distribuir el pago
        var aplicarResult = await aplicarPago.ExecuteAsync(
            new AplicarPagoDto(dto.PrestamoId, dto.ValorNegociado, fechaCierre));

        if (!aplicarResult.IsSuccess)
            return Result<ProntoPagoResultadoDto>.Fail(aplicarResult.Error!);

        var pago = aplicarResult.Value!;
        pago.TipoPago = "pronto_pago";

        // Cerrar cuotas pendientes que no quedaron completamente pagadas
        foreach (var cuota in cuotasPendientesList.Where(c => c.Estado != PrestamoEstados.Cuota.Pagada))
        {
            cuota.Estado = PrestamoEstados.Cuota.CerradaProntoPago;
        }

        // Registrar novedad de auditoría
        var novedad = new NovedadPrestamo
        {
            PrestamoId                = prestamo.Id,
            Tipo                      = "pronto_pago",
            FechaNovedad              = fechaCierre,
            UsuarioId                 = dto.UsuarioId,
            SaldoPendienteOriginal    = saldoPendiente,
            InteresesFuturosEstimados = interesesFuturos,
            ValorNegociado            = dto.ValorNegociado,
            DescuentoAplicado         = descuento,
            PagoId                    = pago.Id,
            Notas                     = dto.Notas
        };
        db.NovedadesPrestamo.Add(novedad);

        // Cerrar el préstamo
        prestamo.Estado      = PrestamoEstados.Prestamo.CerradoProntoPago;
        prestamo.FechaCierre = fechaCierre;
        prestamo.FechaFinal  = fechaCierre.Date;

        await db.SaveChangesAsync();

        return Result<ProntoPagoResultadoDto>.Ok(new ProntoPagoResultadoDto
        {
            NovedadId                 = novedad.Id,
            PagoId                    = pago.Id,
            SaldoPendienteOriginal    = saldoPendiente,
            InteresesFuturosEstimados = interesesFuturos,
            ValorNegociado            = dto.ValorNegociado,
            DescuentoAplicado         = descuento,
            FechaCierre               = fechaCierre
        });
    }
}
