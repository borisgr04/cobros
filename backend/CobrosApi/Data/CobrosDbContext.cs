using CobrosApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CobrosApi.Data;

public class CobrosDbContext(DbContextOptions<CobrosDbContext> options) : DbContext(options)
{
    public DbSet<Zona> Zonas => Set<Zona>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Prestamo> Prestamos => Set<Prestamo>();
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<Cuota> Cuotas => Set<Cuota>();
    public DbSet<AplicacionCuota> AplicacionesCuota => Set<AplicacionCuota>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<WebAuthnCredential> WebAuthnCredentials => Set<WebAuthnCredential>();

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

        // Índice en UsuarioId y TokenHash de RefreshToken
        modelBuilder.Entity<RefreshToken>()
            .HasIndex(r => r.UsuarioId);
        modelBuilder.Entity<RefreshToken>()
            .HasIndex(r => r.TokenHash)
            .IsUnique();

        // Índice en UsuarioId de WebAuthnCredential
        modelBuilder.Entity<WebAuthnCredential>()
            .HasIndex(w => w.UsuarioId);

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
