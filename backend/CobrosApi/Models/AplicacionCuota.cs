using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CobrosApi.Models;

public class AplicacionCuota
{
    public int Id { get; set; }

    [Required]
    public int PagoId { get; set; }

    [Required]
    public int CuotaId { get; set; }

    [Required, Column(TypeName = "numeric(18,2)")]
    public decimal ValorAplicado { get; set; }

    [ForeignKey(nameof(PagoId))]
    public Pago? Pago { get; set; }

    [ForeignKey(nameof(CuotaId))]
    public Cuota? Cuota { get; set; }
}
