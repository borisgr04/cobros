using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CobrosApi.Models;

public class Pago
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

    [ForeignKey(nameof(PrestamoId))]
    public Prestamo? Prestamo { get; set; }

    public ICollection<AplicacionCuota> Aplicaciones { get; set; } = [];
}
