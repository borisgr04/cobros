using CobrosApi.Data;
using CobrosApi.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CobrosApi.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize]
[Produces("application/json")]
public class UsuariosController(CobrosDbContext db) : ControllerBase
{
    /// <summary>Lista todos los usuarios registrados con su estado de autorización.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UsuarioDto>), 200)]
    public async Task<IActionResult> GetAll()
    {
        var usuarios = await db.Usuarios
            .OrderByDescending(u => u.CreadoEn)
            .Select(u => new UsuarioDto
            {
                Id           = u.Id,
                Email        = u.Email,
                Nombre       = u.Nombre,
                FotoUrl      = u.FotoUrl,
                Autorizado   = u.Autorizado,
                CreadoEn     = u.CreadoEn,
                UltimoAcceso = u.UltimoAcceso
            })
            .ToListAsync();

        return Ok(usuarios);
    }

    /// <summary>Autoriza o deniega el acceso de un usuario.</summary>
    [HttpPatch("{id}/autorizacion")]
    [ProducesResponseType(typeof(UsuarioDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    public async Task<IActionResult> ActualizarAutorizacion(int id, [FromBody] ActualizarAutorizacionDto dto)
    {
        var usuario = await db.Usuarios.FindAsync(id);
        if (usuario is null)
            return NotFound(new ErrorDto { Error = "Usuario no encontrado" });

        usuario.Autorizado = dto.Autorizado;
        await db.SaveChangesAsync();

        return Ok(new UsuarioDto
        {
            Id           = usuario.Id,
            Email        = usuario.Email,
            Nombre       = usuario.Nombre,
            FotoUrl      = usuario.FotoUrl,
            Autorizado   = usuario.Autorizado,
            CreadoEn     = usuario.CreadoEn,
            UltimoAcceso = usuario.UltimoAcceso
        });
    }

    /// <summary>Elimina un usuario del sistema.</summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    public async Task<IActionResult> Eliminar(int id)
    {
        var usuario = await db.Usuarios.FindAsync(id);
        if (usuario is null)
            return NotFound(new ErrorDto { Error = "Usuario no encontrado" });

        db.Usuarios.Remove(usuario);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
