using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CobrosApi.Models;

public class Cliente
{
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Alias { get; set; }

    [Required, MaxLength(50)]
    public string Identificacion { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Direccion { get; set; }

    [Required]
    public int ZonaId { get; set; }

    [MaxLength(20)]
    public string? Telefono { get; set; }

    [MaxLength(50)]
    public string? CuentaBancaria { get; set; }

    [MaxLength(100)]
    public string? Llave { get; set; }

    [MaxLength(20)]
    public string Estado { get; set; } = "activo";

    [ForeignKey(nameof(ZonaId))]
    public Zona? Zona { get; set; }

    public ICollection<Prestamo> Prestamos { get; set; } = [];
}
