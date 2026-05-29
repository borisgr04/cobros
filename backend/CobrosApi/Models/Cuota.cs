using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CobrosApi.Models;

public class Cuota
{
    public int Id { get; set; }

    [Required]
    public int PrestamoId { get; set; }

    [Required]
    public int NumeroCuota { get; set; }

    [Required]
    public DateTime FechaEsperada { get; set; }

    [Required, Column(TypeName = "numeric(18,2)")]
    public decimal ValorCuota { get; set; }

    [Required, Column(TypeName = "numeric(18,2)")]
    public decimal SaldoPagado { get; set; } = 0;

    /// <summary>"pendiente" | "parcial" | "pagada" | "cerrada_pronto_pago"</summary>
    [Required, MaxLength(30)]
    public string Estado { get; set; } = "pendiente";

    [ForeignKey(nameof(PrestamoId))]
    public Prestamo? Prestamo { get; set; }

    public ICollection<AplicacionCuota> Aplicaciones { get; set; } = [];
}
