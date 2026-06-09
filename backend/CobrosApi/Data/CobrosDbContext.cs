using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;
using CobrosApi.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace CobrosApi.Data;

public class CobrosDbContext(
    DbContextOptions<CobrosDbContext> options,
    IHttpContextAccessor? httpContextAccessor = null) : DbContext(options)
{
    private static readonly JsonSerializerOptions _jsonOpts = new()
    {
        ReferenceHandler = ReferenceHandler.IgnoreCycles,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };
    public DbSet<Zona> Zonas => Set<Zona>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Prestamo> Prestamos => Set<Prestamo>();
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<Cuota> Cuotas => Set<Cuota>();
    public DbSet<AplicacionCuota> AplicacionesCuota => Set<AplicacionCuota>();
    public DbSet<NovedadPrestamo> NovedadesPrestamo => Set<NovedadPrestamo>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<WebAuthnCredential> WebAuthnCredentials => Set<WebAuthnCredential>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    // ── Auditoría ────────────────────────────────────────────────────────────

    private int? ObtenerUsuarioActualId()
    {
        var claim = httpContextAccessor?.HttpContext?.User
            .FindFirst(ClaimTypes.NameIdentifier)
            ?? httpContextAccessor?.HttpContext?.User.FindFirst("sub");

        return int.TryParse(claim?.Value, out var id) ? id : null;
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var ahora = DateTime.UtcNow;
        var usuarioId = ObtenerUsuarioActualId();
        var audits = new List<AuditLog>();

        foreach (var entry in ChangeTracker.Entries<IAuditable>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreadoEn      = ahora;
                entry.Entity.CreadoPorId   = usuarioId;
                entry.Entity.ModificadoEn  = ahora;
                entry.Entity.ModificadoPorId = usuarioId;
                audits.Add(BuildAuditLog(entry, "Created", usuarioId, ahora, null));
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.ModificadoEn  = ahora;
                entry.Entity.ModificadoPorId = usuarioId;

                // Preservar valores originales de creación
                entry.Property(nameof(IAuditable.CreadoEn)).IsModified = false;
                entry.Property(nameof(IAuditable.CreadoPorId)).IsModified = false;

                audits.Add(BuildAuditLog(entry, "Updated", usuarioId, ahora,
                    entry.OriginalValues.ToObject()));
            }
            else if (entry.State == EntityState.Deleted)
            {
                audits.Add(BuildAuditLog(entry, "Deleted", usuarioId, ahora,
                    entry.OriginalValues.ToObject()));
            }
        }

        var result = await base.SaveChangesAsync(cancellationToken);

        if (audits.Count > 0)
        {
            AuditLogs.AddRange(audits);
            await base.SaveChangesAsync(cancellationToken);
        }

        return result;
    }

    private static AuditLog BuildAuditLog(
        EntityEntry<IAuditable> entry,
        string operacion,
        int? usuarioId,
        DateTime fecha,
        object? anterior)
    {
        // Obtener el ID primario de la entidad
        var entidadId = entry.Metadata.FindPrimaryKey()
            ?.Properties
            .Select(p => entry.Property(p.Name).CurrentValue)
            .FirstOrDefault();

        string? anteriorJson = anterior is null
            ? null
            : JsonSerializer.Serialize(anterior, _jsonOpts);

        string? nuevoJson = operacion == "Deleted"
            ? null
            : JsonSerializer.Serialize(entry.CurrentValues.ToObject(), _jsonOpts);

        return new AuditLog
        {
            Entidad    = entry.Entity.GetType().Name,
            EntidadId  = entidadId is int id ? id : 0,
            Operacion  = operacion,
            UsuarioId  = usuarioId,
            FechaUtc   = fecha,
            AnteriorJson = anteriorJson,
            NuevoJson    = nuevoJson
        };
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Índice único para email de usuario
        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Índice en ZonaId de Cliente para búsquedas rápidas
        modelBuilder.Entity<Cliente>()
            .HasIndex(c => c.ZonaId);

        // Índice único en Identificacion de Cliente
        modelBuilder.Entity<Cliente>()
            .HasIndex(c => c.Identificacion)
            .IsUnique();

        // Índice en ClienteId de Prestamo
        modelBuilder.Entity<Prestamo>()
            .HasIndex(p => p.ClienteId);

        // FK self-referencial: préstamo destino → préstamo origen (Recoger Préstamo)
        modelBuilder.Entity<Prestamo>()
            .HasOne(p => p.PrestamoOrigen)
            .WithMany()
            .HasForeignKey(p => p.PrestamoOrigenId)
            .OnDelete(DeleteBehavior.Restrict);

        // FK NovedadPrestamo → Prestamo destino (Recoger Préstamo)
        modelBuilder.Entity<NovedadPrestamo>()
            .HasOne(n => n.PrestamoDestino)
            .WithMany()
            .HasForeignKey(n => n.PrestamoDestinoId)
            .OnDelete(DeleteBehavior.Restrict);

        // Índice en PrestamoId de Pago
        modelBuilder.Entity<Pago>()
            .HasIndex(p => p.PrestamoId);

        // Índice en PrestamoId de Cuota
        modelBuilder.Entity<Cuota>()
            .HasIndex(c => c.PrestamoId);

        // Índice en PagoId y CuotaId de AplicacionCuota
        modelBuilder.Entity<AplicacionCuota>()
            .HasIndex(a => a.PagoId);
        modelBuilder.Entity<AplicacionCuota>()
            .HasIndex(a => a.CuotaId);

        // Índices para NovedadPrestamo
        modelBuilder.Entity<NovedadPrestamo>()
            .HasIndex(n => n.PrestamoId);
        modelBuilder.Entity<NovedadPrestamo>()
            .HasIndex(n => n.UsuarioId);

        // Índice en UsuarioId y TokenHash de RefreshToken
        modelBuilder.Entity<RefreshToken>()
            .HasIndex(r => r.UsuarioId);
        modelBuilder.Entity<RefreshToken>()
            .HasIndex(r => r.TokenHash)
            .IsUnique();

        // Índice en UsuarioId de WebAuthnCredential
        modelBuilder.Entity<WebAuthnCredential>()
            .HasIndex(w => w.UsuarioId);

        // Índices de AuditLog
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => new { a.Entidad, a.EntidadId });
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => a.UsuarioId);
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => a.FechaUtc);

        // Seed: Zonas
        modelBuilder.Entity<Zona>().HasData(
            new Zona { Id = 1, Nombre = "Centro", Estado = "activo" },
            new Zona { Id = 2, Nombre = "Norte", Estado = "activo" },
            new Zona { Id = 3, Nombre = "Sur", Estado = "inactivo" }
        );

        // Seed: Clientes
        modelBuilder.Entity<Cliente>().HasData(
            new Cliente
            {
                Id = 1, Nombre = "Juan Pérez García", Alias = "Juanito",
                Identificacion = "12345678", Direccion = "Calle Principal #123, Centro",
                ZonaId = 1, Telefono = "555-0101", Estado = "activo"
            },
            new Cliente
            {
                Id = 2, Nombre = "María López Ruiz", Alias = "Mary",
                Identificacion = "87654321", Direccion = "Av. Norte #456",
                ZonaId = 2, Telefono = "555-0202", Estado = "activo"
            },
            new Cliente
            {
                Id = 3, Nombre = "Carlos Martínez", Alias = null,
                Identificacion = "11223344", Direccion = "Barrio Sur #789",
                ZonaId = 3, Telefono = "555-0303", Estado = "activo"
            },
            new Cliente
            {
                Id = 4, Nombre = "Ana González Torres",
                Identificacion = "44332211", Direccion = "Calle 5 #12",
                ZonaId = 1, Telefono = "555-0404", Estado = "activo"
            },
            new Cliente
            {
                Id = 5, Nombre = "Pedro Rodríguez", Alias = "Pedrito",
                Identificacion = "55667788", Direccion = "Av. Central #321",
                ZonaId = 2, Telefono = "555-0505", Estado = "inactivo"
            },
            new Cliente
            {
                Id = 6, Nombre = "Sofía Ramírez", Alias = null,
                Identificacion = "99887766", Direccion = "Plaza Mayor #7",
                ZonaId = 1, Telefono = "555-0606", Estado = "activo"
            }
        );

        // Seed: Préstamos
        modelBuilder.Entity<Prestamo>().HasData(
            new Prestamo
            {
                Id = 1, ClienteId = 1,
                FechaPrestamo = new DateTime(2024, 11, 15, 0, 0, 0, DateTimeKind.Utc),
                FechaFinal = new DateTime(2025, 5, 15, 0, 0, 0, DateTimeKind.Utc),
                ValorPrestado = 1000000, ValorTotal = 1200000,
                InteresProyectado = 200000, FrecuenciaPago = "semanal",
                CantidadCuotas = 26, ValorCuota = 46154
            },
            new Prestamo
            {
                Id = 2, ClienteId = 2,
                FechaPrestamo = new DateTime(2024, 10, 1, 0, 0, 0, DateTimeKind.Utc),
                FechaFinal = new DateTime(2025, 4, 1, 0, 0, 0, DateTimeKind.Utc),
                ValorPrestado = 500000, ValorTotal = 600000,
                InteresProyectado = 100000, FrecuenciaPago = "quincenal",
                CantidadCuotas = 12, ValorCuota = 50000
            },
            new Prestamo
            {
                Id = 3, ClienteId = 3,
                FechaPrestamo = new DateTime(2024, 12, 1, 0, 0, 0, DateTimeKind.Utc),
                FechaFinal = new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc),
                ValorPrestado = 750000, ValorTotal = 900000,
                InteresProyectado = 150000, FrecuenciaPago = "mensual",
                CantidadCuotas = 6, ValorCuota = 150000
            },
            new Prestamo
            {
                Id = 4, ClienteId = 4,
                FechaPrestamo = new DateTime(2025, 1, 10, 0, 0, 0, DateTimeKind.Utc),
                FechaFinal = new DateTime(2025, 7, 10, 0, 0, 0, DateTimeKind.Utc),
                ValorPrestado = 2000000, ValorTotal = 2400000,
                InteresProyectado = 400000, FrecuenciaPago = "semanal",
                CantidadCuotas = 26, ValorCuota = 92308
            },
            new Prestamo
            {
                Id = 5, ClienteId = 1,
                FechaPrestamo = new DateTime(2025, 2, 1, 0, 0, 0, DateTimeKind.Utc),
                FechaFinal = new DateTime(2025, 8, 1, 0, 0, 0, DateTimeKind.Utc),
                ValorPrestado = 300000, ValorTotal = 360000,
                InteresProyectado = 60000, FrecuenciaPago = "diario",
                CantidadCuotas = 180, ValorCuota = 2000
            },
            new Prestamo
            {
                Id = 6, ClienteId = 6,
                FechaPrestamo = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc),
                FechaFinal = new DateTime(2025, 9, 1, 0, 0, 0, DateTimeKind.Utc),
                ValorPrestado = 1500000, ValorTotal = 1800000,
                InteresProyectado = 300000, FrecuenciaPago = "quincenal",
                CantidadCuotas = 12, ValorCuota = 150000
            }
        );

        // Seed: Pagos de muestra
        modelBuilder.Entity<Pago>().HasData(
            new Pago { Id = 1, PrestamoId = 1, Valor = 46154, FechaPago = new DateTime(2024, 11, 22, 0, 0, 0, DateTimeKind.Utc) },
            new Pago { Id = 2, PrestamoId = 1, Valor = 46154, FechaPago = new DateTime(2024, 11, 29, 0, 0, 0, DateTimeKind.Utc) },
            new Pago { Id = 3, PrestamoId = 1, Valor = 46154, FechaPago = new DateTime(2024, 12, 6, 0, 0, 0, DateTimeKind.Utc) },
            new Pago { Id = 4, PrestamoId = 2, Valor = 50000, FechaPago = new DateTime(2024, 10, 15, 0, 0, 0, DateTimeKind.Utc) },
            new Pago { Id = 5, PrestamoId = 2, Valor = 50000, FechaPago = new DateTime(2024, 11, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Pago { Id = 6, PrestamoId = 3, Valor = 150000, FechaPago = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Pago { Id = 7, PrestamoId = 4, Valor = 92308, FechaPago = new DateTime(2025, 1, 17, 0, 0, 0, DateTimeKind.Utc) },
            new Pago { Id = 8, PrestamoId = 4, Valor = 92308, FechaPago = new DateTime(2025, 1, 24, 0, 0, 0, DateTimeKind.Utc) }
        );
    }
}
