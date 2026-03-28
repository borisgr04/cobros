using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CobrosApi.Data;

/// <summary>
/// Permite que `dotnet ef migrations` use Npgsql directamente,
/// independiente del valor de UseInMemoryDb en appsettings.
/// Requiere la variable de entorno ConnectionStrings__DefaultConnection.
/// </summary>
public class CobrosDesignTimeDbContextFactory : IDesignTimeDbContextFactory<CobrosDbContext>
{
    public CobrosDbContext CreateDbContext(string[] args)
    {
        var connStr = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? throw new InvalidOperationException(
                "Define la variable de entorno ConnectionStrings__DefaultConnection antes de correr dotnet ef.");

        var options = new DbContextOptionsBuilder<CobrosDbContext>()
            .UseNpgsql(connStr)
            .Options;

        return new CobrosDbContext(options);
    }
}
