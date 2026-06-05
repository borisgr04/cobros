using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace CobrosApi.Data;

/// <summary>
/// Permite que `dotnet ef migrations` use Npgsql directamente,
/// independiente del valor de UseInMemoryDb en appsettings.
/// Lee la cadena de conexión desde (en orden de prioridad):
/// 1. Variable de entorno ConnectionStrings__DefaultConnection
/// 2. User secrets del proyecto
/// 3. appsettings.Development.json / appsettings.json
/// </summary>
public class CobrosDesignTimeDbContextFactory : IDesignTimeDbContextFactory<CobrosDbContext>
{
    public CobrosDbContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddUserSecrets<CobrosDesignTimeDbContextFactory>(optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connStr = config.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "No se encontró ConnectionStrings:DefaultConnection. " +
                "Defínelo en user secrets, appsettings.Development.json o como variable de entorno.");

        var options = new DbContextOptionsBuilder<CobrosDbContext>()
            .UseNpgsql(connStr)
            .Options;

        return new CobrosDbContext(options);
    }
}
