using CobrosApi.Data;
using CobrosApi.DTOs;
using CobrosApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CobrosApi.Controllers;

[ApiController]
[Route("api/zonas")]
[Authorize]
[Produces("application/json")]
public class ZonasController(CobrosDbContext db) : ControllerBase
{
    private static ZonaDto ToDto(Zona z) => new()
    {
        Id     = z.Id.ToString(),
        Nombre = z.Nombre,
        Estado = z.Estado
    };

    // GET /api/zonas
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ZonaDto>), 200)]
    public async Task<IActionResult> GetAll()
    {
        var zonas = await db.Zonas.AsNoTracking().ToListAsync();
        return Ok(zonas.Select(ToDto));
    }

    // GET /api/zonas/activas
    [HttpGet("activas")]
    [ProducesResponseType(typeof(IEnumerable<ZonaDto>), 200)]
    public async Task<IActionResult> GetActivas()
    {
        var zonas = await db.Zonas
            .AsNoTracking()
            .Where(z => z.Estado == "activo")
            .ToListAsync();
        return Ok(zonas.Select(ToDto));
    }

    // GET /api/zonas/{id}
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ZonaDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    public async Task<IActionResult> GetById(int id)
    {
        var zona = await db.Zonas.AsNoTracking().FirstOrDefaultAsync(z => z.Id == id);
        if (zona is null)
            return NotFound(new ErrorDto { Error = $"Zona {id} no encontrada" });
        return Ok(ToDto(zona));
    }

    // POST /api/zonas
    [HttpPost]
    [ProducesResponseType(typeof(ZonaDto), 201)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    public async Task<IActionResult> Create([FromBody] ZonaInputDto input)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorDto { Error = "Datos inválidos" });

        var zona = new Zona { Nombre = input.Nombre, Estado = input.Estado };
        db.Zonas.Add(zona);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = zona.Id }, ToDto(zona));
    }

    // PUT /api/zonas/{id}
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ZonaDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    public async Task<IActionResult> Update(int id, [FromBody] ZonaInputDto input)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorDto { Error = "Datos inválidos" });

        var zona = await db.Zonas.FindAsync(id);
        if (zona is null)
            return NotFound(new ErrorDto { Error = $"Zona {id} no encontrada" });

        zona.Nombre = input.Nombre;
        zona.Estado = input.Estado;
        await db.SaveChangesAsync();

        return Ok(ToDto(zona));
    }

    // DELETE /api/zonas/{id}
    [HttpDelete("{id:int}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    [ProducesResponseType(typeof(ErrorDto), 409)]
    public async Task<IActionResult> Delete(int id)
    {
        var zona = await db.Zonas
            .Include(z => z.Clientes)
            .FirstOrDefaultAsync(z => z.Id == id);
        if (zona is null)
            return NotFound(new ErrorDto { Error = $"Zona {id} no encontrada" });

        if (zona.Clientes.Count != 0)
            return Conflict(new ErrorDto { Error = "No se puede eliminar una zona que tiene clientes asignados" });

        db.Zonas.Remove(zona);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
