using CobrosApi.Data;
using CobrosApi.DTOs;
using CobrosApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CobrosApi.Controllers;

[ApiController]
[Route("api/pagos")]
[Authorize]
[Produces("application/json")]
public class PagosController(CobrosDbContext db) : ControllerBase
{
    private static PagoDto ToDto(Pago p) => new()
    {
        Id         = p.Id.ToString(),
        PrestamoId = p.PrestamoId.ToString(),
        Valor      = p.Valor,
        FechaPago  = p.FechaPago
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
            .Where(p => p.PrestamoId == prestamoId)
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

        var prestamoExiste = await db.Prestamos.AnyAsync(p => p.Id == prestamoId);
        if (!prestamoExiste)
            return BadRequest(new ErrorDto { Error = $"Préstamo {input.PrestamoId} no existe" });

        var pago = new Pago
        {
            PrestamoId = prestamoId,
            Valor      = input.Valor,
            FechaPago  = input.FechaPago
        };
        db.Pagos.Add(pago);
        await db.SaveChangesAsync();

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
