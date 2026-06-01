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

    /// <summary>"activo" | "completado" | "cerrado_pronto_pago" | "refinanciado"</summary>
    [Required, MaxLength(30)]
    public string Estado { get; set; } = "activo";

    public DateTime? FechaCierre { get; set; }

    /// <summary>
    /// FK al préstamo origen cuando este préstamo fue creado por la operación "Recoger Préstamo".
    /// Null si es un préstamo nuevo independiente.
    /// </summary>
    public int? PrestamoOrigenId { get; set; }

    [ForeignKey(nameof(ClienteId))]
    public Cliente? Cliente { get; set; }

    [ForeignKey(nameof(PrestamoOrigenId))]
    public Prestamo? PrestamoOrigen { get; set; }

    public ICollection<Pago> Pagos { get; set; } = [];
    public ICollection<Cuota> Cuotas { get; set; } = [];
    public ICollection<NovedadPrestamo> Novedades { get; set; } = [];
}
