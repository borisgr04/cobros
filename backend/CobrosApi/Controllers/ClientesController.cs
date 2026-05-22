using CobrosApi.Data;
using CobrosApi.DTOs;
using CobrosApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CobrosApi.Controllers;

[ApiController]
[Route("api/clientes")]
[Authorize]
[Produces("application/json")]
public class ClientesController(CobrosDbContext db) : ControllerBase
{
    private static ClienteDto ToDto(Cliente c) => new()
    {
        Id            = c.Id.ToString(),
        Nombre        = c.Nombre,
        Alias         = c.Alias,
        Identificacion = c.Identificacion,
        Direccion     = c.Direccion,
        ZonaId        = c.ZonaId.ToString(),
        Telefono      = c.Telefono,
        CuentaBancaria = c.CuentaBancaria,
        Llave         = c.Llave,
        Estado        = c.Estado
    };

    // GET /api/clientes
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ClienteDto>), 200)]
    public async Task<IActionResult> GetAll()
    {
        var clientes = await db.Clientes.AsNoTracking().ToListAsync();
        return Ok(clientes.Select(ToDto));
    }

    // GET /api/clientes/zona/{zonaId}
    [HttpGet("zona/{zonaId:int}")]
    [ProducesResponseType(typeof(IEnumerable<ClienteDto>), 200)]
    public async Task<IActionResult> GetByZona(int zonaId)
    {
        var clientes = await db.Clientes
            .AsNoTracking()
            .Where(c => c.ZonaId == zonaId)
            .ToListAsync();
        return Ok(clientes.Select(ToDto));
    }

    // GET /api/clientes/{id}
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ClienteDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    public async Task<IActionResult> GetById(int id)
    {
        var cliente = await db.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
        if (cliente is null)
            return NotFound(new ErrorDto { Error = $"Cliente {id} no encontrado" });
        return Ok(ToDto(cliente));
    }

    // POST /api/clientes
    [HttpPost]
    [ProducesResponseType(typeof(ClienteDto), 201)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    public async Task<IActionResult> Create([FromBody] ClienteInputDto input)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorDto { Error = "Datos inválidos" });

        if (!int.TryParse(input.ZonaId, out int zonaId))
            return BadRequest(new ErrorDto { Error = "ZonaId inválido" });

        var zonaExiste = await db.Zonas.AnyAsync(z => z.Id == zonaId);
        if (!zonaExiste)
            return BadRequest(new ErrorDto { Error = $"Zona {input.ZonaId} no existe" });

        var identificacionExiste = await db.Clientes.AnyAsync(c => c.Identificacion == input.Identificacion);
        if (identificacionExiste)
            return BadRequest(new ErrorDto { Error = "Ya existe un cliente con esta identificación" });

        var cliente = new Cliente
        {
            Nombre         = input.Nombre,
            Alias          = input.Alias,
            Identificacion = input.Identificacion,
            Direccion      = input.Direccion,
            ZonaId         = zonaId,
            Telefono       = input.Telefono,
            CuentaBancaria = input.CuentaBancaria,
            Llave          = input.Llave,
            Estado         = input.Estado ?? "activo"
        };
        db.Clientes.Add(cliente);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = cliente.Id }, ToDto(cliente));
    }

    // PUT /api/clientes/{id}
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ClienteDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    public async Task<IActionResult> Update(int id, [FromBody] ClienteInputDto input)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorDto { Error = "Datos inválidos" });

        var cliente = await db.Clientes.FindAsync(id);
        if (cliente is null)
            return NotFound(new ErrorDto { Error = $"Cliente {id} no encontrado" });

        if (!int.TryParse(input.ZonaId, out int zonaId))
            return BadRequest(new ErrorDto { Error = "ZonaId inválido" });

        var zonaExiste = await db.Zonas.AnyAsync(z => z.Id == zonaId);
        if (!zonaExiste)
            return BadRequest(new ErrorDto { Error = $"Zona {input.ZonaId} no existe" });

        var identificacionExiste = await db.Clientes.AnyAsync(c => c.Identificacion == input.Identificacion && c.Id != id);
        if (identificacionExiste)
            return BadRequest(new ErrorDto { Error = "Ya existe un cliente con esta identificación" });

        cliente.Nombre         = input.Nombre;
        cliente.Alias          = input.Alias;
        cliente.Identificacion = input.Identificacion;
        cliente.Direccion      = input.Direccion;
        cliente.ZonaId         = zonaId;
        cliente.Telefono       = input.Telefono;
        cliente.CuentaBancaria = input.CuentaBancaria;
        cliente.Llave          = input.Llave;
        if (input.Estado is not null)
            cliente.Estado = input.Estado;

        await db.SaveChangesAsync();
        return Ok(ToDto(cliente));
    }

    // DELETE /api/clientes/{id}
    [HttpDelete("{id:int}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    [ProducesResponseType(typeof(ErrorDto), 409)]
    public async Task<IActionResult> Delete(int id)
    {
        var cliente = await db.Clientes
            .Include(c => c.Prestamos)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (cliente is null)
            return NotFound(new ErrorDto { Error = $"Cliente {id} no encontrado" });

        if (cliente.Prestamos.Count != 0)
            return Conflict(new ErrorDto { Error = "No se puede eliminar un cliente que tiene préstamos registrados" });

        db.Clientes.Remove(cliente);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
