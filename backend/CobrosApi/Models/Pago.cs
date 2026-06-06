using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CobrosApi.Models;

public class Pago : IAuditable
{
    public int Id { get; set; }

    [Required]
    public int PrestamoId { get; set; }

    [Required, Column(TypeName = "numeric(18,2)")]
    public decimal Valor { get; set; }

    [Required]
    public DateTime FechaPago { get; set; }

    public bool Anulado { get; set; } = false;

    public DateTime? FechaAnulacion { get; set; }

    [MaxLength(500)]
    public string? MotivoAnulacion { get; set; }

    /// <summary>"regular" | "pronto_pago"</summary>
    [Required, MaxLength(20)]
    public string TipoPago { get; set; } = "regular";

    // ── Auditoría ─────────────────────────────────────────────────────────
    public DateTime CreadoEn { get; set; }
    public int? CreadoPorId { get; set; }
    public DateTime ModificadoEn { get; set; }
    public int? ModificadoPorId { get; set; }

    [ForeignKey(nameof(PrestamoId))]
    public Prestamo? Prestamo { get; set; }

    public ICollection<AplicacionCuota> Aplicaciones { get; set; } = [];
}
