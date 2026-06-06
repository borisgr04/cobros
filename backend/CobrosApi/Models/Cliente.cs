using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CobrosApi.Models;

public class Cliente : IAuditable
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

    [MaxLength(20)]
    public string Estado { get; set; } = "activo";

    // ── Auditoría ─────────────────────────────────────────────────────────
    public DateTime CreadoEn { get; set; }
    public int? CreadoPorId { get; set; }
    public DateTime ModificadoEn { get; set; }
    public int? ModificadoPorId { get; set; }

    [ForeignKey(nameof(ZonaId))]
    public Zona? Zona { get; set; }

    public ICollection<Prestamo> Prestamos { get; set; } = [];
}
