using CobrosApi.Data;
using CobrosApi.DTOs;
using CobrosApi.Models;
using CobrosApi.Services;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CobrosApi.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController(CobrosDbContext db, TokenService tokenService, IConfiguration config) : ControllerBase
{
    // ─── Dev login (solo cuando UseDevAuth: true) ─────────────────────────────
    // Permite obtener un JWT válido sin Google, para probar la integración.
    // POST /api/auth/dev-login  { "email": "dev@test.com", "nombre": "Dev User" }

    [HttpPost("dev-login")]
    [ProducesResponseType(typeof(AuthResponseDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DevLogin([FromBody] DevLoginRequestDto request)
    {
        if (!config.GetValue<bool>("UseDevAuth"))
            return NotFound();

        if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new ErrorDto { Error = "Email requerido" });

        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (usuario is null)
        {
            usuario = new Usuario
            {
                Email         = request.Email,
                Nombre        = request.Nombre ?? request.Email,
                CreadoEn      = DateTime.UtcNow,
                UltimoAcceso  = DateTime.UtcNow
            };
            db.Usuarios.Add(usuario);
        }
        else
        {
            usuario.UltimoAcceso = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();

        var (token, expires) = tokenService.GenerateToken(usuario);

        return Ok(new AuthResponseDto
        {
            Token   = token,
            Email   = usuario.Email,
            Nombre  = usuario.Nombre,
            FotoUrl = usuario.FotoUrl,
            Expira  = expires
        });
    }

    // ─── Google login ─────────────────────────────────────────────────────────

    /// <summary>Autenticación con Google ID Token. Devuelve JWT propio.</summary>
    [HttpPost("google")]
    [ProducesResponseType(typeof(AuthResponseDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    [ProducesResponseType(typeof(ErrorDto), 401)]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleAuthRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorDto { Error = "IdToken requerido" });

        GoogleJsonWebSignature.Payload? payload;
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [config["Google:ClientId"]]
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings);
        }
        catch (InvalidJwtException ex)
        {
            return Unauthorized(new ErrorDto { Error = $"Token de Google inválido: {ex.Message}" });
        }

        // Buscar o crear usuario
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Email == payload.Email);
        if (usuario is null)
        {
            usuario = new Usuario
            {
                Email = payload.Email,
                Nombre = payload.Name,
                FotoUrl = payload.Picture,
                CreadoEn = DateTime.UtcNow,
                UltimoAcceso = DateTime.UtcNow
            };
            db.Usuarios.Add(usuario);
        }
        else
        {
            usuario.UltimoAcceso = DateTime.UtcNow;
            if (!string.IsNullOrEmpty(payload.Name))
                usuario.Nombre = payload.Name;
            if (!string.IsNullOrEmpty(payload.Picture))
                usuario.FotoUrl = payload.Picture;
        }

        await db.SaveChangesAsync();

        var (token, expires) = tokenService.GenerateToken(usuario);

        return Ok(new AuthResponseDto
        {
            Token   = token,
            Email   = usuario.Email,
            Nombre  = usuario.Nombre,
            FotoUrl = usuario.FotoUrl,
            Expira  = expires
        });
    }
}
