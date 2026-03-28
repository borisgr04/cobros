using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CobrosApi.Models;

public class Prestamo
{
    public int Id { get; set; }

    [Required]
    public int ClienteId { get; set; }

    [Required]
    public DateTime FechaPrestamo { get; set; }

    [Required]
    public DateTime FechaFinal { get; set; }

    [Required, Column(TypeName = "numeric(18,2)")]
    public decimal ValorPrestado { get; set; }

    [Required, Column(TypeName = "numeric(18,2)")]
    public decimal ValorTotal { get; set; }

    [Required, Column(TypeName = "numeric(18,2)")]
    public decimal InteresProyectado { get; set; }

    [Required, MaxLength(20)]
    public string FrecuenciaPago { get; set; } = "semanal";

    [Required]
    public int CantidadCuotas { get; set; }

    [Required, Column(TypeName = "numeric(18,2)")]
    public decimal ValorCuota { get; set; }

    [ForeignKey(nameof(ClienteId))]
    public Cliente? Cliente { get; set; }

    public ICollection<Pago> Pagos { get; set; } = [];
}
