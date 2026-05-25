using CobrosApi.Data;
using CobrosApi.DTOs;
using CobrosApi.Models;
using CobrosApi.Services;
using Fido2NetLib;
using Fido2NetLib.Objects;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace CobrosApi.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController(
    CobrosDbContext db,
    TokenService tokenService,
    IConfiguration config,
    Fido2 fido2,
    IDistributedCache cache) : ControllerBase
{
    private const string RefreshCookieName = "cobros_refresh";

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private void SetRefreshCookie(string rawToken, DateTime expires)
    {
        Response.Cookies.Append(RefreshCookieName, rawToken, new CookieOptions
        {
            HttpOnly = true,
            Secure   = true,
            SameSite = SameSiteMode.Strict,
            Expires  = expires,
            Path     = "/api/auth"
        });
    }

    private void ClearRefreshCookie()
    {
        Response.Cookies.Delete(RefreshCookieName, new CookieOptions { Path = "/api/auth" });
    }

    private async Task<IActionResult> IssueSessionAsync(Usuario usuario)
    {
        var (accessToken, expires) = tokenService.GenerateToken(usuario);
        var (refreshEntity, rawRefresh) = await tokenService.GenerateRefreshTokenAsync(usuario.Id);
        SetRefreshCookie(rawRefresh, refreshEntity.Expires);

        return Ok(new AuthResponseDto
        {
            Token   = accessToken,
            Email   = usuario.Email,
            Nombre  = usuario.Nombre,
            FotoUrl = usuario.FotoUrl,
            Expira  = expires
        });
    }

    // ─── Dev login ────────────────────────────────────────────────────────────

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
                Email        = request.Email,
                Nombre       = request.Nombre ?? request.Email,
                CreadoEn     = DateTime.UtcNow,
                UltimoAcceso = DateTime.UtcNow,
                Autorizado   = true
            };
            db.Usuarios.Add(usuario);
        }
        else
        {
            usuario.UltimoAcceso = DateTime.UtcNow;
        }
        await db.SaveChangesAsync();

        return await IssueSessionAsync(usuario);
    }

    // ─── Google login ─────────────────────────────────────────────────────────

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
        catch (Exception ex)
        {
            return BadRequest(new ErrorDto { Error = $"Error al validar token de Google: {ex.Message}" });
        }

        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Email == payload.Email);
        if (usuario is null)
        {
            usuario = new Usuario
            {
                Email        = payload.Email,
                Nombre       = payload.Name,
                FotoUrl      = payload.Picture,
                CreadoEn     = DateTime.UtcNow,
                UltimoAcceso = DateTime.UtcNow,
                Autorizado   = false
            };
            db.Usuarios.Add(usuario);
            await db.SaveChangesAsync();
            return Unauthorized(new ErrorDto { Error = "Tu cuenta no está autorizada. Contacta al administrador." });
        }

        if (!usuario.Autorizado)
            return Unauthorized(new ErrorDto { Error = "Tu cuenta no está autorizada. Contacta al administrador." });

        usuario.UltimoAcceso = DateTime.UtcNow;
        if (!string.IsNullOrEmpty(payload.Name))    usuario.Nombre  = payload.Name;
        if (!string.IsNullOrEmpty(payload.Picture)) usuario.FotoUrl = payload.Picture;
        await db.SaveChangesAsync();

        return await IssueSessionAsync(usuario);
    }

    // ─── Refresh ──────────────────────────────────────────────────────────────

    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponseDto), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Refresh()
    {
        var rawToken = Request.Cookies[RefreshCookieName];
        if (string.IsNullOrEmpty(rawToken))
            return Unauthorized();

        var hash = TokenService.ComputeHash(rawToken);
        var stored = await db.RefreshTokens
            .Include(r => r.Usuario)
            .FirstOrDefaultAsync(r => r.TokenHash == hash);

        if (stored is null || stored.Revoked || stored.Expires <= DateTime.UtcNow || stored.Usuario is null)
        {
            ClearRefreshCookie();
            return Unauthorized();
        }

        if (!stored.Usuario.Autorizado)
        {
            ClearRefreshCookie();
            return Unauthorized();
        }

        // Rotate: revoke old, issue new
        var (newEntity, newRaw) = await tokenService.GenerateRefreshTokenAsync(stored.Usuario.Id);
        stored.Revoked             = true;
        stored.ReplacedByTokenHash = TokenService.ComputeHash(newRaw);
        await db.SaveChangesAsync();

        SetRefreshCookie(newRaw, newEntity.Expires);

        var (accessToken, expires) = tokenService.GenerateToken(stored.Usuario);
        return Ok(new AuthResponseDto
        {
            Token   = accessToken,
            Email   = stored.Usuario.Email,
            Nombre  = stored.Usuario.Nombre,
            FotoUrl = stored.Usuario.FotoUrl,
            Expira  = expires
        });
    }

    // ─── Logout ───────────────────────────────────────────────────────────────

    [HttpPost("logout")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Logout()
    {
        var rawToken = Request.Cookies[RefreshCookieName];
        if (!string.IsNullOrEmpty(rawToken))
        {
            var hash = TokenService.ComputeHash(rawToken);
            var stored = await db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == hash);
            if (stored is not null)
            {
                stored.Revoked = true;
                await db.SaveChangesAsync();
            }
        }
        ClearRefreshCookie();
        return NoContent();
    }

    // ─── WebAuthn: Register Begin ─────────────────────────────────────────────

    [HttpPost("webauthn/register/begin")]
    [Authorize]
    [ProducesResponseType(200)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    public async Task<IActionResult> WebAuthnRegisterBegin([FromBody] WebAuthnRegisterBeginRequestDto request)
    {
        var usuario = await GetCurrentUserAsync();
        if (usuario is null) return Unauthorized();

        var existingCredentials = await db.WebAuthnCredentials
            .Where(c => c.UsuarioId == usuario.Id)
            .Select(c => new PublicKeyCredentialDescriptor(c.CredentialId))
            .ToListAsync();

        var options = fido2.RequestNewCredential(
            new User
            {
                Id          = System.Text.Encoding.UTF8.GetBytes(usuario.Id.ToString()),
                Name        = usuario.Email,
                DisplayName = usuario.Nombre ?? usuario.Email
            },
            existingCredentials,
            AuthenticatorSelection.Default,
            AttestationConveyancePreference.None
        );

        var cacheKey = $"webauthn:reg:{usuario.Id}";
        await cache.SetStringAsync(cacheKey,
            options.ToJson(),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2) });

        return Ok(options);
    }

    // ─── WebAuthn: Register Complete ──────────────────────────────────────────

    [HttpPost("webauthn/register/complete")]
    [Authorize]
    [ProducesResponseType(200)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    public async Task<IActionResult> WebAuthnRegisterComplete([FromBody] WebAuthnRegisterCompleteRequestDto request)
    {
        var usuario = await GetCurrentUserAsync();
        if (usuario is null) return Unauthorized();

        var cacheKey = $"webauthn:reg:{usuario.Id}";
        var cachedJson = await cache.GetStringAsync(cacheKey);
        if (cachedJson is null)
            return BadRequest(new ErrorDto { Error = "Sesión de registro expirada. Intenta de nuevo." });

        CredentialCreateOptions? options;
        try { options = CredentialCreateOptions.FromJson(cachedJson); }
        catch { return BadRequest(new ErrorDto { Error = "Opciones de registro inválidas." }); }

        AuthenticatorAttestationRawResponse attestation;
        try
        {
            attestation = new AuthenticatorAttestationRawResponse
            {
                Id    = DecodeBase64Url(request.AttestationResponse.Id),
                RawId = DecodeBase64Url(request.AttestationResponse.RawId),
                Type  = request.AttestationResponse.Type,
                Response = new AuthenticatorAttestationRawResponse.ResponseData
                {
                    ClientDataJson    = DecodeBase64Url(request.AttestationResponse.Response.ClientDataJSON),
                    AttestationObject = DecodeBase64Url(request.AttestationResponse.Response.AttestationObject)
                }
            };
        }
        catch { return BadRequest(new ErrorDto { Error = "Respuesta del autenticador inválida." }); }

        IsCredentialIdUniqueToUserAsyncDelegate isUniqueCallback = async (args) =>
            !await db.WebAuthnCredentials.AnyAsync(c => c.CredentialId == args.CredentialId);

        try
        {
            var result = await fido2.MakeNewCredentialAsync(attestation, options, isUniqueCallback, null);

            var credential = new WebAuthnCredential
            {
                UsuarioId    = usuario.Id,
                CredentialId = result.Result!.CredentialId,
                PublicKey    = result.Result.PublicKey,
                SignCount    = 0,  // alpha SDK doesn't expose SignCount on attestation
                DeviceName   = request.DeviceName
            };
            db.WebAuthnCredentials.Add(credential);
            await db.SaveChangesAsync();
            await cache.RemoveAsync(cacheKey);

            return Ok(new { message = "Biometría registrada correctamente." });
        }
        catch (Exception ex) when (ex.GetType().Name == "Fido2VerificationException")
        {
            return BadRequest(new ErrorDto { Error = ex.Message });
        }
    }

    // ─── WebAuthn: Authenticate Begin ─────────────────────────────────────────

    [HttpPost("webauthn/authenticate/begin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    public async Task<IActionResult> WebAuthnAuthBegin([FromBody] WebAuthnAuthBeginRequestDto request)
    {
        var allowedCredentials = new List<PublicKeyCredentialDescriptor>();

        if (request.CredentialIds.Count > 0)
        {
            // Cliente envió IDs explícitos — usarlos directamente
            foreach (var idBase64 in request.CredentialIds)
            {
                try { allowedCredentials.Add(new PublicKeyCredentialDescriptor(Convert.FromBase64String(idBase64))); }
                catch { /* skip invalid */ }
            }
        }
        else if (!string.IsNullOrWhiteSpace(request.Email))
        {
            // Fallback: buscar credenciales por email
            var credIds = await db.WebAuthnCredentials
                .Include(c => c.Usuario)
                .Where(c => c.Usuario != null && c.Usuario.Email == request.Email)
                .Select(c => c.CredentialId)
                .ToListAsync();

            foreach (var credId in credIds)
                allowedCredentials.Add(new PublicKeyCredentialDescriptor(credId));
        }

        var options = fido2.GetAssertionOptions(
            allowedCredentials,
            UserVerificationRequirement.Required
        );

        // Cache options keyed by each credential ID so the complete step can retrieve them
        foreach (var cred in allowedCredentials)
        {
            var key = $"webauthn:assert:{Convert.ToBase64String(cred.Id)}";
            await cache.SetStringAsync(key,
                options.ToJson(),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2) });
        }

        return Ok(options);
    }

    // ─── WebAuthn: Authenticate Complete ──────────────────────────────────────

    [HttpPost("webauthn/authenticate/complete")]
    [ProducesResponseType(typeof(AuthResponseDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    [ProducesResponseType(typeof(ErrorDto), 401)]
    public async Task<IActionResult> WebAuthnAuthComplete([FromBody] WebAuthnAuthCompleteRequestDto request)
    {
        AuthenticatorAssertionRawResponse assertion;
        try
        {
            assertion = new AuthenticatorAssertionRawResponse
            {
                Id    = DecodeBase64Url(request.AssertionResponse.Id),
                RawId = DecodeBase64Url(request.AssertionResponse.RawId),
                Type  = request.AssertionResponse.Type,
                Response = new AuthenticatorAssertionRawResponse.AssertionResponse
                {
                    ClientDataJson    = DecodeBase64Url(request.AssertionResponse.Response.ClientDataJSON),
                    AuthenticatorData = DecodeBase64Url(request.AssertionResponse.Response.AuthenticatorData),
                    Signature         = DecodeBase64Url(request.AssertionResponse.Response.Signature),
                    UserHandle        = request.AssertionResponse.Response.UserHandle is not null
                        ? DecodeBase64Url(request.AssertionResponse.Response.UserHandle)
                        : null
                }
            };
        }
        catch { return BadRequest(new ErrorDto { Error = "Respuesta del autenticador inválida." }); }

        var storedCred = await db.WebAuthnCredentials
            .Include(c => c.Usuario)
            .FirstOrDefaultAsync(c => c.CredentialId == assertion.Id);

        if (storedCred is null || storedCred.Usuario is null)
            return Unauthorized(new ErrorDto { Error = "Credencial no encontrada." });

        if (!storedCred.Usuario.Autorizado)
            return Unauthorized(new ErrorDto { Error = "Tu cuenta no está autorizada. Contacta al administrador." });

        var assertionCacheKey = $"webauthn:assert:{Convert.ToBase64String(storedCred.CredentialId)}";
        var cachedJson = await cache.GetStringAsync(assertionCacheKey);
        if (cachedJson is null)
            return BadRequest(new ErrorDto { Error = "Sesión de autenticación expirada. Intenta de nuevo." });

        AssertionOptions? options;
        try { options = AssertionOptions.FromJson(cachedJson); }
        catch { return BadRequest(new ErrorDto { Error = "Opciones de autenticación inválidas." }); }

        IsUserHandleOwnerOfCredentialIdAsync ownerCallback = (args) =>
            Task.FromResult(storedCred.CredentialId.SequenceEqual(args.CredentialId));

        try
        {
            var result = await fido2.MakeAssertionAsync(
                assertion,
                options,
                storedCred.PublicKey,
                storedCred.SignCount,
                ownerCallback,
                null);

            storedCred.SignCount                = result.Counter;
            storedCred.LastUsedAt               = DateTime.UtcNow;
            storedCred.Usuario.UltimoAcceso     = DateTime.UtcNow;
            await db.SaveChangesAsync();
            await cache.RemoveAsync(assertionCacheKey);

            return await IssueSessionAsync(storedCred.Usuario);
        }
        catch (Exception ex) when (ex.GetType().Name == "Fido2VerificationException")
        {
            return Unauthorized(new ErrorDto { Error = ex.Message });
        }
    }

    // ─── WebAuthn: List credentials ───────────────────────────────────────────

    [HttpGet("webauthn/credentials")]
    [Authorize]
    [ProducesResponseType(typeof(List<WebAuthnCredentialDto>), 200)]
    public async Task<IActionResult> ListCredentials()
    {
        var usuario = await GetCurrentUserAsync();
        if (usuario is null) return Unauthorized();

        var creds = await db.WebAuthnCredentials
            .Where(c => c.UsuarioId == usuario.Id)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new WebAuthnCredentialDto
            {
                Id         = c.Id.ToString(),
                DeviceName = c.DeviceName,
                CreatedAt  = c.CreatedAt,
                LastUsedAt = c.LastUsedAt
            })
            .ToListAsync();

        return Ok(creds);
    }

    // ─── WebAuthn: Delete credential ──────────────────────────────────────────

    [HttpDelete("webauthn/credentials/{id:guid}")]
    [Authorize]
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    public async Task<IActionResult> DeleteCredential(Guid id)
    {
        var usuario = await GetCurrentUserAsync();
        if (usuario is null) return Unauthorized();

        var cred = await db.WebAuthnCredentials
            .FirstOrDefaultAsync(c => c.Id == id && c.UsuarioId == usuario.Id);

        if (cred is null)
            return NotFound(new ErrorDto { Error = "Credencial no encontrada." });

        db.WebAuthnCredentials.Remove(cred);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private static byte[] DecodeBase64Url(string base64Url)
    {
        string padded = base64Url.Replace('-', '+').Replace('_', '/');
        int mod = padded.Length % 4;
        if (mod != 0) padded += new string('=', 4 - mod);
        return Convert.FromBase64String(padded);
    }

    private async Task<Usuario?> GetCurrentUserAsync()
    {
        var sub = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
               ?? User.FindFirst("sub")?.Value;
        if (int.TryParse(sub, out var userId))
            return await db.Usuarios.FirstOrDefaultAsync(u => u.Id == userId);

        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                 ?? User.FindFirst("email")?.Value;
        if (!string.IsNullOrEmpty(email))
            return await db.Usuarios.FirstOrDefaultAsync(u => u.Email == email);

        return null;
    }
}
