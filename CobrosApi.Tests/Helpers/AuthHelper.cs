using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace CobrosApi.Tests.Helpers;

public static class AuthHelper
{
    /// <summary>
    /// Genera un JWT válido con el secreto de test y lo adjunta al cliente HTTP.
    /// </summary>
    public static void SetBearerToken(this HttpClient client, string email = "test@cobros.dev", string name = "Test User")
    {
        var token = GenerateToken(email, name);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    public static string GenerateToken(string email = "test@cobros.dev", string name = "Test User")
    {
        var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(CobrosWebAppFactory.TestJwtSecret));
        var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   email),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(JwtRegisteredClaimNames.Name,  name),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer:             CobrosWebAppFactory.TestJwtIssuer,
            audience:           CobrosWebAppFactory.TestJwtAudience,
            claims:             claims,
            expires:            DateTime.UtcNow.AddHours(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
