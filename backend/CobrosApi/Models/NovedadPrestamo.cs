using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CobrosApi.Models;

public class NovedadPrestamo : IAuditable
{
    public int Id { get; set; }

    [Required]
    public int PrestamoId { get; set; }

    /// <summary>"pronto_pago" — extensible a futuras novedades.</summary>
    [Required, MaxLength(50)]
    public string Tipo { get; set; } = string.Empty;

    [Required]
    public DateTime FechaNovedad { get; set; }

    /// <summary>Usuario que autorizó / registró la novedad (campo de negocio, distinto de CreadoPorId de auditoría).</summary>
    [Required]
    public int UsuarioId { get; set; }

    // ── Auditoría ─────────────────────────────────────────────────────────
    public DateTime CreadoEn { get; set; }
    public int? CreadoPorId { get; set; }
    public DateTime ModificadoEn { get; set; }
    public int? ModificadoPorId { get; set; }

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

    // ─── Campos adicionales para "ampliacion_plazo" ───────────────────────────

    /// <summary>Interés adicional negociado en la ampliación de plazo.</summary>
    [Column(TypeName = "numeric(18,2)")]
    public decimal? InteresAdicional { get; set; }

    /// <summary>Nuevo saldo calculado: saldoPendiente + interesAdicional.</summary>
    [Column(TypeName = "numeric(18,2)")]
    public decimal? NuevoSaldo { get; set; }

    /// <summary>Fecha final del préstamo antes de la ampliación.</summary>
    public DateTime? FechaFinalAnterior { get; set; }

    /// <summary>Nueva fecha final del préstamo después de la ampliación.</summary>
    public DateTime? NuevaFechaFinal { get; set; }

    /// <summary>Cantidad de nuevas cuotas generadas en la ampliación.</summary>
    public int? CantidadCuotasNuevas { get; set; }

    // ─── Campos adicionales para "recoger_prestamo" ───────────────────────────

    /// <summary>Préstamo destino creado por la operación "Recoger Préstamo".</summary>
    public int? PrestamoDestinoId { get; set; }

    /// <summary>Saldo pendiente trasladado del préstamo origen al nuevo.</summary>
    [Column(TypeName = "numeric(18,2)")]
    public decimal? SaldoTrasladado { get; set; }

    /// <summary>Dinero adicional entregado al cliente (único movimiento de caja).</summary>
    [Column(TypeName = "numeric(18,2)")]
    public decimal? DineroAdicional { get; set; }

    [ForeignKey(nameof(PrestamoId))]
    public Prestamo? Prestamo { get; set; }

    [ForeignKey(nameof(UsuarioId))]
    public Usuario? Usuario { get; set; }

    [ForeignKey(nameof(PagoId))]
    public Pago? Pago { get; set; }

    [ForeignKey(nameof(PrestamoDestinoId))]
    public Prestamo? PrestamoDestino { get; set; }
}
