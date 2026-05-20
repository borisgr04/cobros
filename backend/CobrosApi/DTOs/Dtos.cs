using System.ComponentModel.DataAnnotations;

namespace CobrosApi.DTOs;

// ─── ZONA ──────────────────────────────────────────────────────────────────

public class ZonaDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
}

public class ZonaInputDto
{
    [Required, MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Estado { get; set; } = "activo";
}

// ─── CLIENTE ───────────────────────────────────────────────────────────────

public class ClienteDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Alias { get; set; }
    public string Identificacion { get; set; } = string.Empty;
    public string? Direccion { get; set; }
    public string ZonaId { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? CuentaBancaria { get; set; }
    public string? Llave { get; set; }
    public string? Estado { get; set; }
}

public class ClienteInputDto
{
    [Required, MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Alias { get; set; }

    [Required, MaxLength(50)]
    public string Identificacion { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Direccion { get; set; }

    [Required]
    public string ZonaId { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Telefono { get; set; }

    [MaxLength(50)]
    public string? CuentaBancaria { get; set; }

    [MaxLength(100)]
    public string? Llave { get; set; }

    [MaxLength(20)]
    public string? Estado { get; set; }
}

// ─── PRÉSTAMO ──────────────────────────────────────────────────────────────

public class PrestamoDto
{
    public string Id { get; set; } = string.Empty;
    public string ClienteId { get; set; } = string.Empty;
    public DateTime FechaPrestamo { get; set; }
    public DateTime FechaFinal { get; set; }
    public decimal ValorPrestado { get; set; }
    public decimal ValorTotal { get; set; }
    public decimal InteresProyectado { get; set; }
    public string FrecuenciaPago { get; set; } = string.Empty;
    public int CantidadCuotas { get; set; }
    public decimal ValorCuota { get; set; }
}

public class PrestamoInputDto
{
    [Required]
    public string ClienteId { get; set; } = string.Empty;

    [Required]
    public DateTime FechaPrestamo { get; set; }

    [Required]
    public DateTime FechaFinal { get; set; }

    [Required, Range(0, double.MaxValue)]
    public decimal ValorPrestado { get; set; }

    [Required, Range(0, double.MaxValue)]
    public decimal ValorTotal { get; set; }

    [Required, Range(0, double.MaxValue)]
    public decimal InteresProyectado { get; set; }

    [Required]
    public string FrecuenciaPago { get; set; } = string.Empty;

    [Required, Range(1, int.MaxValue)]
    public int CantidadCuotas { get; set; }

    [Required, Range(0, double.MaxValue)]
    public decimal ValorCuota { get; set; }
}

// ─── PAGO ──────────────────────────────────────────────────────────────────

public class PagoDto
{
    public string Id { get; set; } = string.Empty;
    public string PrestamoId { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public DateTime FechaPago { get; set; }
}

public class PagoInputDto
{
    [Required]
    public string PrestamoId { get; set; } = string.Empty;

    [Required, Range(0, double.MaxValue)]
    public decimal Valor { get; set; }

    [Required]
    public DateTime FechaPago { get; set; }
}

// ─── CUOTA ─────────────────────────────────────────────────────────────────

public class CuotaDto
{
    public int NumeroCuota { get; set; }
    public DateTime FechaEsperada { get; set; }
    public decimal ValorCuota { get; set; }
    public string Estado { get; set; } = "pendiente"; // "pagada" | "pendiente"
}

// ─── AUTH ──────────────────────────────────────────────────────────────────

public class GoogleAuthRequestDto
{
    [Required]
    public string IdToken { get; set; } = string.Empty;
}

/// <summary>Solo para desarrollo (UseDevAuth: true). No disponible en producción.</summary>
public class DevLoginRequestDto
{
    [Required]
    public string Email { get; set; } = string.Empty;

    public string? Nombre { get; set; }
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Nombre { get; set; }
    public string? FotoUrl { get; set; }
    public DateTime Expira { get; set; }
}

// ─── ERRORS ────────────────────────────────────────────────────────────────

public class ErrorDto
{
    public string Error { get; set; } = string.Empty;
}

public class TotalPagadoDto
{
    public string PrestamoId { get; set; } = string.Empty;
    public decimal TotalPagado { get; set; }
}
