using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CobrosApi.Models;

public class NovedadPrestamo
{
    public int Id { get; set; }

    [Required]
    public int PrestamoId { get; set; }

    /// <summary>"pronto_pago" — extensible a futuras novedades.</summary>
    [Required, MaxLength(50)]
    public string Tipo { get; set; } = string.Empty;

    [Required]
    public DateTime FechaNovedad { get; set; }

    /// <summary>Usuario que autorizó / registró la novedad.</summary>
    [Required]
    public int UsuarioId { get; set; }

    [Required, Column(TypeName = "numeric(18,2)")]
    public decimal SaldoPendienteOriginal { get; set; }

    [Required, Column(TypeName = "numeric(18,2)")]
    public decimal InteresesFuturosEstimados { get; set; }

    [Required, Column(TypeName = "numeric(18,2)")]
    public decimal ValorNegociado { get; set; }

    [Required, Column(TypeName = "numeric(18,2)")]
    public decimal DescuentoAplicado { get; set; }

    /// <summary>Pago generado por esta novedad.</summary>
    public int? PagoId { get; set; }

    [MaxLength(1000)]
    public string? Notas { get; set; }

    [ForeignKey(nameof(PrestamoId))]
    public Prestamo? Prestamo { get; set; }

    [ForeignKey(nameof(UsuarioId))]
    public Usuario? Usuario { get; set; }

    [ForeignKey(nameof(PagoId))]
    public Pago? Pago { get; set; }
}
