using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CobrosApi.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Tokens;

namespace CobrosApi.Tests.Helpers;

/// <summary>
/// Fábrica compartida de la aplicación para tests de integración.
/// Cada colección de tests recibe su propia base de datos InMemory aislada.
/// </summary>
public class CobrosWebAppFactory : WebApplicationFactory<Program>
{
    // Nombre único por instancia para aislar datos entre colecciones de tests
    private readonly string _dbName = $"CobrosTest_{Guid.NewGuid()}";

    public const string TestJwtSecret   = "dev_secret_key_min32chars_for_local_only!!";
    public const string TestJwtIssuer   = "CobrosApi";
    public const string TestJwtAudience = "CobrosApp";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureServices(services =>
        {
            // Reemplazar DbContext por InMemory con nombre único (aislado por colección de tests)
            services.RemoveAll<DbContextOptions<CobrosDbContext>>();
            services.AddDbContext<CobrosDbContext>(opts =>
                opts.UseInMemoryDatabase(_dbName));
        });
    }
}
