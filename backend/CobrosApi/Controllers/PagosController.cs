using CobrosApi.Data;
using CobrosApi.DTOs;
using CobrosApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;

namespace CobrosApi.Controllers;

[ApiController]
[Route("api/pagos")]
[Authorize]
[Produces("application/json")]
public class PagosController(CobrosDbContext db) : ControllerBase
{
    private static PagoDto ToDto(Pago p) => new()
    {
        Id              = p.Id.ToString(),
        PrestamoId      = p.PrestamoId.ToString(),
        Valor           = p.Valor,
        FechaPago       = p.FechaPago,
        Anulado         = p.Anulado,
        FechaAnulacion  = p.FechaAnulacion,
        MotivoAnulacion = p.MotivoAnulacion,
        TipoPago        = p.TipoPago
    };

    // GET /api/pagos
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PagoDto>), 200)]
    public async Task<IActionResult> GetAll()
    {
        var pagos = await db.Pagos.AsNoTracking().ToListAsync();
        return Ok(pagos.Select(ToDto));
    }

    // GET /api/pagos/prestamo/{prestamoId}
    [HttpGet("prestamo/{prestamoId:int}")]
    [ProducesResponseType(typeof(IEnumerable<PagoDto>), 200)]
    public async Task<IActionResult> GetByPrestamo(int prestamoId)
    {
        var pagos = await db.Pagos
            .AsNoTracking()
            .Where(p => p.PrestamoId == prestamoId)
            .ToListAsync();
        return Ok(pagos.Select(ToDto));
    }

    // GET /api/pagos/prestamo/{prestamoId}/total
    [HttpGet("prestamo/{prestamoId:int}/total")]
    [ProducesResponseType(typeof(TotalPagadoDto), 200)]
    public async Task<IActionResult> GetTotal(int prestamoId)
    {
        var total = await db.Pagos
            .AsNoTracking()
            .Where(p => p.PrestamoId == prestamoId && !p.Anulado)
            .SumAsync(p => p.Valor);

        return Ok(new TotalPagadoDto
        {
            PrestamoId  = prestamoId.ToString(),
            TotalPagado = total
        });
    }

    // GET /api/pagos/{id}
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(PagoDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    public async Task<IActionResult> GetById(int id)
    {
        var pago = await db.Pagos.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        if (pago is null)
            return NotFound(new ErrorDto { Error = $"Pago {id} no encontrado" });
        return Ok(ToDto(pago));
    }

    // POST /api/pagos
    [HttpPost]
    [ProducesResponseType(typeof(PagoDto), 201)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    public async Task<IActionResult> Create([FromBody] PagoInputDto input)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorDto { Error = "Datos inválidos" });

        if (!int.TryParse(input.PrestamoId, out int prestamoId))
            return BadRequest(new ErrorDto { Error = "PrestamoId inválido" });

        var prestamo = await db.Prestamos.AnyAsync(p => p.Id == prestamoId);
        if (!prestamo)
            return BadRequest(new ErrorDto { Error = $"Préstamo {input.PrestamoId} no existe" });

        // Rechazar préstamos cerrados
        var prestamoEnt = await db.Prestamos.AsNoTracking().FirstAsync(p => p.Id == prestamoId);
        if (prestamoEnt.Estado == "cerrado_pronto_pago" || prestamoEnt.Estado == "completado" || prestamoEnt.Estado == "refinanciado")
            return BadRequest(new ErrorDto { Error = "No se pueden registrar pagos en un préstamo cerrado" });

        // Cargar cuotas no completamente pagadas, ordenadas por NumeroCuota
        var cuotas = await db.Cuotas
            .Where(c => c.PrestamoId == prestamoId && c.SaldoPagado < c.ValorCuota)
            .OrderBy(c => c.NumeroCuota)
            .ToListAsync();

        // Validar que el abono no supere el saldo pendiente total
        var saldoPendiente = cuotas.Sum(c => c.ValorCuota - c.SaldoPagado);
        if (cuotas.Count > 0 && input.Valor > saldoPendiente)
            return BadRequest(new ErrorDto { Error = $"El abono (${input.Valor:N0}) supera el saldo pendiente (${saldoPendiente:N0})" });

        using var tx = db.Database.IsInMemory()
            ? null
            : await db.Database.BeginTransactionAsync();

        var pago = new Pago
        {
            PrestamoId = prestamoId,
            Valor      = input.Valor,
            FechaPago  = input.FechaPago
        };
        db.Pagos.Add(pago);
        await db.SaveChangesAsync(); // necesitamos pago.Id para AplicacionCuota

        // Distribuir el abono en cuotas pendientes/parciales
        var restante = input.Valor;
        foreach (var cuota in cuotas)
        {
            if (restante <= 0) break;

            var espacio      = cuota.ValorCuota - cuota.SaldoPagado;
            var valorAplicado = Math.Min(restante, espacio);

            cuota.SaldoPagado += valorAplicado;
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

        return CreatedAtAction(nameof(GetById), new { id = pago.Id }, ToDto(pago));
    }

    // PUT /api/pagos/{id}
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(PagoDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    public async Task<IActionResult> Update(int id, [FromBody] PagoInputDto input)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorDto { Error = "Datos inválidos" });

        var pago = await db.Pagos.FindAsync(id);
        if (pago is null)
            return NotFound(new ErrorDto { Error = $"Pago {id} no encontrado" });

        if (!int.TryParse(input.PrestamoId, out int prestamoId))
            return BadRequest(new ErrorDto { Error = "PrestamoId inválido" });

        pago.PrestamoId = prestamoId;
        pago.Valor      = input.Valor;
        pago.FechaPago  = input.FechaPago;

        await db.SaveChangesAsync();
        return Ok(ToDto(pago));
    }

    // POST /api/pagos/{id}/anular
    [HttpPost("{id:int}/anular")]
    [ProducesResponseType(typeof(PagoDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    public async Task<IActionResult> Anular(int id, [FromBody] AnularPagoInputDto input)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorDto { Error = "Datos inválidos" });

        var pago = await db.Pagos.FirstOrDefaultAsync(p => p.Id == id);
        if (pago is null)
            return NotFound(new ErrorDto { Error = $"Pago {id} no encontrado" });

        if (pago.Anulado)
            return BadRequest(new ErrorDto { Error = "El pago ya está anulado" });

        // Verificar que sea el pago activo más reciente del préstamo
        var ultimoPagoActivo = await db.Pagos
            .Where(p => p.PrestamoId == pago.PrestamoId && !p.Anulado)
            .OrderByDescending(p => p.FechaPago)
            .ThenByDescending(p => p.Id)
            .FirstOrDefaultAsync();

        if (ultimoPagoActivo is null || ultimoPagoActivo.Id != id)
            return BadRequest(new ErrorDto { Error = "Solo se puede anular el pago más reciente" });

        using var tx = db.Database.IsInMemory()
            ? null
            : await db.Database.BeginTransactionAsync();

        // Revertir el saldo en cada cuota afectada
        var aplicaciones = await db.AplicacionesCuota
            .Include(a => a.Cuota)
            .Where(a => a.PagoId == id)
            .ToListAsync();

        foreach (var aplicacion in aplicaciones)
        {
            if (aplicacion.Cuota is not null)
                aplicacion.Cuota.SaldoPagado -= aplicacion.ValorAplicado;
        }

        // Marcar el pago como anulado
        pago.Anulado          = true;
        pago.FechaAnulacion   = DateTime.UtcNow;
        pago.MotivoAnulacion  = input.Motivo;

        await db.SaveChangesAsync();
        if (tx is not null) await tx.CommitAsync();

        return Ok(ToDto(pago));
    }

    // DELETE /api/pagos/{id}
    [HttpDelete("{id:int}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    public async Task<IActionResult> Delete(int id)
    {
        var pago = await db.Pagos.FindAsync(id);
        if (pago is null)
            return NotFound(new ErrorDto { Error = $"Pago {id} no encontrado" });

        db.Pagos.Remove(pago);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
