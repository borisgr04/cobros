using System.ComponentModel.DataAnnotations;

namespace CobrosApi.Models;

public class Usuario
{
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Nombre { get; set; }

    [MaxLength(500)]
    public string? FotoUrl { get; set; }

    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    public DateTime UltimoAcceso { get; set; } = DateTime.UtcNow;
}
