using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using CobrosApi.Data;
using CobrosApi.Models;
using Microsoft.IdentityModel.Tokens;

namespace CobrosApi.Services;

public class TokenService(IConfiguration config, CobrosDbContext db)
{
    public (string token, DateTime expires) GenerateToken(Usuario usuario)
    {
        var secret   = config["Jwt:Secret"]          ?? throw new InvalidOperationException("JWT Secret no configurado");
        var issuer   = config["Jwt:Issuer"]           ?? "CobrosApi";
        var audience = config["Jwt:Audience"]         ?? "CobrosApp";
        var minutes  = int.Parse(config["Jwt:ExpiresInMinutes"] ?? "30");

        var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(minutes);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
            new Claim(JwtRegisteredClaimNames.Name,  usuario.Nombre ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer:             issuer,
            audience:           audience,
            claims:             claims,
            expires:            expires,
            signingCredentials: creds
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }

    /// <summary>
    /// Genera un refresh token opaco, lo persiste en BD y retorna (entidad, tokenEnClaro).
    /// El token en claro solo se envía al cliente en cookie; en BD se guarda el hash SHA-256.
    /// </summary>
    public async Task<(RefreshToken entity, string rawToken)> GenerateRefreshTokenAsync(int usuarioId)
    {
        var days = int.Parse(config["Jwt:RefreshTokenExpiryDays"] ?? "7");

        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var hash     = ComputeHash(rawToken);

        var refreshToken = new RefreshToken
        {
            UsuarioId = usuarioId,
            TokenHash = hash,
            Expires   = DateTime.UtcNow.AddDays(days)
        };

        db.RefreshTokens.Add(refreshToken);
        await db.SaveChangesAsync();

        return (refreshToken, rawToken);
    }

    public static string ComputeHash(string rawToken)
        => Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));
}
