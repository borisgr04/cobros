using CobrosApi.Data;
using CobrosApi.DTOs;
using CobrosApi.Features.Shared;
using CobrosApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CobrosApi.Features.Liquidacion;

public record EjecutarAmpliacionPlazoDto(
    int       PrestamoId,
    decimal   InteresAdicional,
    int       CantidadCuotasNuevas,
    DateTime  FechaInicio,
    string    FrecuenciaNueva,
    string?   Observacion,
    int       UsuarioId);

public class EjecutarAmpliacionPlazo(CobrosDbContext db)
{
    public async Task<Result<AmpliacionPlazoResultadoDto>> ExecuteAsync(EjecutarAmpliacionPlazoDto dto)
    {
        var prestamo = await db.Prestamos
            .Include(p => p.Cuotas)
            .FirstOrDefaultAsync(p => p.Id == dto.PrestamoId);

        if (prestamo is null)
            return Result<AmpliacionPlazoResultadoDto>.NotFound($"Préstamo {dto.PrestamoId} no encontrado");

        if (prestamo.Estado == PrestamoEstados.Prestamo.CerradoProntoPago ||
            prestamo.Estado == PrestamoEstados.Prestamo.Completado)
            return Result<AmpliacionPlazoResultadoDto>.Fail("El préstamo ya se encuentra cerrado");

        var cuotasPendientesList = prestamo.Cuotas
            .Where(c =>
                c.Estado != PrestamoEstados.Cuota.Pagada &&
                c.Estado != PrestamoEstados.Cuota.CerradaProntoPago &&
                c.Estado != PrestamoEstados.Cuota.ReemplazadaAmpliacion &&
                c.SaldoPagado < c.ValorCuota)
            .OrderBy(c => c.NumeroCuota)
            .ToList();

        if (cuotasPendientesList.Count == 0)
            return Result<AmpliacionPlazoResultadoDto>.Fail("No hay cuotas pendientes para ampliar el plazo");

        var totalPagado    = prestamo.Cuotas.Sum(c => c.SaldoPagado);
        var saldoPendiente = prestamo.ValorTotal - totalPagado;

        if (saldoPendiente <= 0)
            return Result<AmpliacionPlazoResultadoDto>.Fail("El préstamo no tiene saldo pendiente");

        if (dto.InteresAdicional < 0)
            return Result<AmpliacionPlazoResultadoDto>.Fail("El interés adicional no puede ser negativo");

        var nuevoSaldo         = saldoPendiente + dto.InteresAdicional;
        var valorCuota         = Math.Round(nuevoSaldo / dto.CantidadCuotasNuevas, 2);
        var fechaFinalAnterior = prestamo.FechaFinal;
        var nuevaFechaFinal    = CuotasService.CalcularFechaCuota(dto.FechaInicio, dto.FrecuenciaNueva, dto.CantidadCuotasNuevas);
        var ahora              = DateTime.UtcNow;

        using var tx = db.Database.IsInMemory()
            ? null
            : await db.Database.BeginTransactionAsync();

        // Marcar cuotas pendientes como reemplazadas
        foreach (var cuota in cuotasPendientesList)
        {
            cuota.Estado = PrestamoEstados.Cuota.ReemplazadaAmpliacion;
        }

        // Determinar el siguiente número de cuota
        var maxNumeroCuota = prestamo.Cuotas.Max(c => c.NumeroCuota);

        // Generar nuevas cuotas usando CuotasService
        var nuevasCuotas = CuotasService.GenerarCuotas(
            prestamoId:      prestamo.Id,
            cantidadCuotas:  dto.CantidadCuotasNuevas,
            valorTotal:      nuevoSaldo,
            valorCuota:      valorCuota,
            fechaInicio:     dto.FechaInicio,
            frecuencia:      dto.FrecuenciaNueva).ToList();

        // Ajustar NumeroCuota para que continúe la secuencia del préstamo
        for (int i = 0; i < nuevasCuotas.Count; i++)
            nuevasCuotas[i].NumeroCuota = maxNumeroCuota + i + 1;

        db.Cuotas.AddRange(nuevasCuotas);

        // Actualizar el préstamo
        prestamo.FechaFinal        = nuevaFechaFinal;
        prestamo.ValorTotal        = totalPagado + nuevoSaldo;
        prestamo.InteresProyectado = prestamo.InteresProyectado + dto.InteresAdicional;
        prestamo.CantidadCuotas    = prestamo.CantidadCuotas + dto.CantidadCuotasNuevas;
        prestamo.ValorCuota        = valorCuota;
        prestamo.FrecuenciaPago    = dto.FrecuenciaNueva;

        // Registrar novedad de auditoría
        var novedad = new NovedadPrestamo
        {
            PrestamoId                = prestamo.Id,
            Tipo                      = "ampliacion_plazo",
            FechaNovedad              = ahora,
            UsuarioId                 = dto.UsuarioId,
            SaldoPendienteOriginal    = saldoPendiente,
            InteresesFuturosEstimados = 0,
            ValorNegociado            = nuevoSaldo,
            DescuentoAplicado         = 0,
            Notas                     = dto.Observacion,
            InteresAdicional          = dto.InteresAdicional,
            NuevoSaldo                = nuevoSaldo,
            FechaFinalAnterior        = fechaFinalAnterior,
            NuevaFechaFinal           = nuevaFechaFinal,
            CantidadCuotasNuevas      = dto.CantidadCuotasNuevas
        };
        db.NovedadesPrestamo.Add(novedad);

        await db.SaveChangesAsync();
        if (tx is not null) await tx.CommitAsync();

        return Result<AmpliacionPlazoResultadoDto>.Ok(new AmpliacionPlazoResultadoDto
        {
            NovedadId              = novedad.Id,
            SaldoPendienteAnterior = saldoPendiente,
            InteresAdicional       = dto.InteresAdicional,
            NuevoSaldo             = nuevoSaldo,
            ValorCuota             = valorCuota,
            FechaFinalAnterior     = fechaFinalAnterior,
            NuevaFechaFinal        = nuevaFechaFinal,
            CantidadCuotasNuevas   = dto.CantidadCuotasNuevas
        });
    }
}
