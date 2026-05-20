using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CobrosApi.Models;
using Microsoft.IdentityModel.Tokens;

namespace CobrosApi.Services;

public class TokenService(IConfiguration config)
{
    public (string token, DateTime expires) GenerateToken(Usuario usuario)
    {
        var secret  = config["Jwt:Secret"]   ?? throw new InvalidOperationException("JWT Secret no configurado");
        var issuer  = config["Jwt:Issuer"]   ?? "CobrosApi";
        var audience = config["Jwt:Audience"] ?? "CobrosApp";
        var minutes = int.Parse(config["Jwt:ExpiresInMinutes"] ?? "30");

        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(minutes);

        var claims = new[] 
        {
            new Claim(JwtRegisteredClaimNames.Sub,   usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
            new Claim(JwtRegisteredClaimNames.Name,  usuario.Nombre ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer:   issuer,
            audience: audience,
            claims:   claims,
            expires:  expires,
            signingCredentials: creds
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}
