using System.ComponentModel.DataAnnotations;

namespace CobrosApi.DTOs;

// ─── ZONA ──────────────────────────────────────────────────────────────────

public class ZonaDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
}

public class ZonaInputDto
{
    [Required, MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Estado { get; set; } = "activo";
}

// ─── CLIENTE ───────────────────────────────────────────────────────────────

public class ClienteDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Alias { get; set; }
    public string Identificacion { get; set; } = string.Empty;
    public string? Direccion { get; set; }
    public string ZonaId { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Estado { get; set; }
    public bool TienePrestamos { get; set; }
}

public class ClienteConPrestamosActivosDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Alias { get; set; }
    public string Identificacion { get; set; } = string.Empty;
    public string? Direccion { get; set; }
    public string ZonaId { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Estado { get; set; }
    public bool TienePrestamos { get; set; }
    public List<PrestamoDto> PrestamosActivos { get; set; } = [];
}

/// <summary>Préstamo con totales de pago calculados server-side desde la tabla Cuotas.</summary>
public class PrestamoConPagosDto : PrestamoDto
{
    /// <summary>Suma de Cuota.SaldoPagado (excluye anulados automáticamente).</summary>
    public decimal TotalPagado { get; set; }
    public decimal SaldoPendiente { get; set; }
    /// <summary>Cuotas con Estado "pagada" o "cerrada_pronto_pago".</summary>
    public int CuotasPagadas { get; set; }
    public int CuotasPendientes { get; set; }
}

/// <summary>Cliente con todos sus préstamos e información de pagos. Devuelto por GET /api/clientes/con-prestamos.</summary>
public class ClienteConPrestamosDto : ClienteDto
{
    public List<PrestamoConPagosDto> Prestamos { get; set; } = [];
}

public class ClienteInputDto
{
    [Required, MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Alias { get; set; }

    [Required, MaxLength(50)]
    public string Identificacion { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Direccion { get; set; }

    [Required]
    public string ZonaId { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Telefono { get; set; }

    [MaxLength(20)]
    public string? Estado { get; set; }
}

// ─── PRÉSTAMO ──────────────────────────────────────────────────────────────

public class PrestamoDto
{
    public string Id { get; set; } = string.Empty;
    public string ClienteId { get; set; } = string.Empty;
    public DateTime FechaPrestamo { get; set; }
    public DateTime FechaFinal { get; set; }
    public decimal ValorPrestado { get; set; }
    public decimal ValorTotal { get; set; }
    public decimal InteresProyectado { get; set; }
    public string FrecuenciaPago { get; set; } = string.Empty;
    public int CantidadCuotas { get; set; }
    public decimal ValorCuota { get; set; }
    /// <summary>"activo" | "completado" | "cerrado_pronto_pago" | "refinanciado"</summary>
    public string Estado { get; set; } = "activo";
    public DateTime? FechaCierre { get; set; }
    public int? PrestamoOrigenId { get; set; }
}

public class PrestamoInputDto
{
    [Required]
    public string ClienteId { get; set; } = string.Empty;

    [Required]
    public DateTime FechaPrestamo { get; set; }

    [Required]
    public DateTime FechaFinal { get; set; }

    [Required, Range(0, double.MaxValue)]
    public decimal ValorPrestado { get; set; }

    [Required, Range(0, double.MaxValue)]
    public decimal ValorTotal { get; set; }

    [Required, Range(0, double.MaxValue)]
    public decimal InteresProyectado { get; set; }

    [Required]
    public string FrecuenciaPago { get; set; } = string.Empty;

    [Required, Range(1, int.MaxValue)]
    public int CantidadCuotas { get; set; }

    [Required, Range(0, double.MaxValue)]
    public decimal ValorCuota { get; set; }
}

// ─── PAGO ──────────────────────────────────────────────────────────────────

public class PagoDto
{
    public string Id { get; set; } = string.Empty;
    public string PrestamoId { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public DateTime FechaPago { get; set; }
    public bool Anulado { get; set; }
    public DateTime? FechaAnulacion { get; set; }
    public string? MotivoAnulacion { get; set; }
    /// <summary>"regular" | "pronto_pago"</summary>
    public string TipoPago { get; set; } = "regular";
}

public class PagoInputDto
{
    [Required]
    public string PrestamoId { get; set; } = string.Empty;

    [Required, Range(0, double.MaxValue)]
    public decimal Valor { get; set; }

    [Required]
    public DateTime FechaPago { get; set; }
}

public class AnularPagoInputDto
{
    [Required, MaxLength(500)]
    public string Motivo { get; set; } = string.Empty;
}

// ─── CUOTA ─────────────────────────────────────────────────────────────────

public class CuotaDto
{
    public int NumeroCuota { get; set; }
    public DateTime FechaEsperada { get; set; }
    public decimal ValorCuota { get; set; }
    public string Estado { get; set; } = "pendiente"; // "pagada" | "pendiente"
}

// ─── CONSULTA PÚBLICA ──────────────────────────────────────────────────────

public class ConsultaPublicaDto
{
    public string Nombre { get; set; } = string.Empty;
    public string? Alias { get; set; }
    public List<PrestamoPublicoDto> Prestamos { get; set; } = [];
}

public class PagoPublicoDto
{
    public DateTime FechaPago { get; set; }
    public decimal Valor { get; set; }
}

public class PrestamoPublicoDto
{
    public int Id { get; set; }
    public DateTime FechaPrestamo { get; set; }
    public DateTime FechaFinal { get; set; }
    public decimal ValorPrestado { get; set; }
    public decimal ValorTotal { get; set; }
    public decimal ValorCuota { get; set; }
    public string FrecuenciaPago { get; set; } = string.Empty;
    public int CantidadCuotas { get; set; }
    public int CuotasPagadas { get; set; }
    public decimal TotalPagado { get; set; }
    public decimal SaldoPendiente { get; set; }
    public DateTime? UltimoPago { get; set; }
    public List<PagoPublicoDto> Pagos { get; set; } = [];
}

// ─── USUARIOS (admin) ──────────────────────────────────────────────────────

public class UsuarioDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Nombre { get; set; }
    public string? FotoUrl { get; set; }
    public bool Autorizado { get; set; }
    public DateTime CreadoEn { get; set; }
    public DateTime UltimoAcceso { get; set; }
}

public class ActualizarAutorizacionDto
{
    public bool Autorizado { get; set; }
}

// ─── AUTH ──────────────────────────────────────────────────────────────────

public class GoogleAuthRequestDto
{
    [Required]
    public string IdToken { get; set; } = string.Empty;
}

/// <summary>Solo para desarrollo (UseDevAuth: true). No disponible en producción.</summary>
public class DevLoginRequestDto
{
    [Required]
    public string Email { get; set; } = string.Empty;

    public string? Nombre { get; set; }
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Nombre { get; set; }
    public string? FotoUrl { get; set; }
    public DateTime Expira { get; set; }
}

// ─── CIERRE DEL DÍA ────────────────────────────────────────────────────────

public record CobrosZonaDto(int ZonaId, string ZonaNombre, int CobrosProgramados, int PagaronCount, decimal Total);
public record CobrosDiaDto(decimal RecaudadoTotal, int PrestamosActivosCount, List<CobrosZonaDto> PorZona);
public record FrecuenciaCountDto(string Frecuencia, int Count);
public record PrestamosDiaDto(int NuevosCount, int RenovadosCount, decimal CapitalEntregadoTotal, int ProntoPagoCount, List<FrecuenciaCountDto> NuevosPorFrecuencia);
public record GananciaDiaDto(decimal InteresesPactadosTotal, decimal DescuentosProntoPagoTotal, decimal GananciaNeta);
public record CierreDiaDto(DateOnly Fecha, GananciaDiaDto Ganancia, PrestamosDiaDto PrestamosDia, CobrosDiaDto Cobros);

// ─── ERRORS ────────────────────────────────────────────────────────────────

public class ErrorDto
{
    public string Error { get; set; } = string.Empty;
}

// ─── WEBAUTHN ──────────────────────────────────────────────────────────────

public class WebAuthnRegisterBeginRequestDto
{
    [MaxLength(200)]
    public string? DeviceName { get; set; }
}

public class WebAuthnAttestationDataDto
{
    public string ClientDataJSON { get; set; } = string.Empty;
    public string AttestationObject { get; set; } = string.Empty;
}

public class WebAuthnAttestationCredentialDto
{
    public string Id { get; set; } = string.Empty;
    public string RawId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public WebAuthnAttestationDataDto Response { get; set; } = new();
}

public class WebAuthnAssertionDataDto
{
    public string ClientDataJSON { get; set; } = string.Empty;
    public string AuthenticatorData { get; set; } = string.Empty;
    public string Signature { get; set; } = string.Empty;
    public string? UserHandle { get; set; }
}

public class WebAuthnAssertionCredentialDto
{
    public string Id { get; set; } = string.Empty;
    public string RawId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public WebAuthnAssertionDataDto Response { get; set; } = new();
}

public class WebAuthnRegisterCompleteRequestDto
{
    [Required]
    public WebAuthnAttestationCredentialDto AttestationResponse { get; set; } = new();

    [MaxLength(200)]
    public string? DeviceName { get; set; }
}

public class WebAuthnAuthBeginRequestDto
{
    public List<string> CredentialIds { get; set; } = [];

    [MaxLength(200)]
    public string? Email { get; set; }
}

public class WebAuthnAuthCompleteRequestDto
{
    [Required]
    public WebAuthnAssertionCredentialDto AssertionResponse { get; set; } = new();
}

public class WebAuthnCredentialDto
{
    public string Id { get; set; } = string.Empty;
    public string? DeviceName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
}

public class TotalPagadoDto
{
    public string PrestamoId { get; set; } = string.Empty;
    public decimal TotalPagado { get; set; }
}

// ─── PRONTO PAGO ───────────────────────────────────────────────────────────

public class ProntoPagoInputDto
{
    [Required, Range(1, double.MaxValue)]
    public decimal ValorNegociado { get; set; }

    [MaxLength(1000)]
    public string? Notas { get; set; }
}

public class ProntoPagoResumenDto
{
    public decimal SaldoPendiente { get; set; }
    public int CuotasPendientes { get; set; }
    public decimal InteresesFuturosEstimados { get; set; }
    public decimal ValorSugerido { get; set; }
}

public class ProntoPagoResultadoDto
{
    public int NovedadId { get; set; }
    public int PagoId { get; set; }
    public decimal SaldoPendienteOriginal { get; set; }
    public decimal InteresesFuturosEstimados { get; set; }
    public decimal ValorNegociado { get; set; }
    public decimal DescuentoAplicado { get; set; }
    public DateTime FechaCierre { get; set; }
}

// ─── NOVEDAD PRÉSTAMO ──────────────────────────────────────────────────────

public class NovedadPrestamoDto
{
    public int Id { get; set; }
    public int PrestamoId { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public DateTime FechaNovedad { get; set; }
    public int UsuarioId { get; set; }
    public string? UsuarioNombre { get; set; }
    public string? UsuarioEmail { get; set; }
    public decimal SaldoPendienteOriginal { get; set; }
    public decimal InteresesFuturosEstimados { get; set; }
    public decimal ValorNegociado { get; set; }
    public decimal DescuentoAplicado { get; set; }
    public int? PagoId { get; set; }
    public string? Notas { get; set; }

    // Campos adicionales para "ampliacion_plazo"
    public decimal? InteresAdicional { get; set; }
    public decimal? NuevoSaldo { get; set; }
    public DateTime? FechaFinalAnterior { get; set; }
    public DateTime? NuevaFechaFinal { get; set; }
    public int? CantidadCuotasNuevas { get; set; }

    // Campos adicionales para "recoger_prestamo"
    public int? PrestamoDestinoId { get; set; }
    public decimal? SaldoTrasladado { get; set; }
    public decimal? DineroAdicional { get; set; }
}

// ─── AMPLIACIÓN DE PLAZO ───────────────────────────────────────────────────

public class AmpliacionPlazoResumenDto
{
    public decimal SaldoPendiente { get; set; }
    public int CuotasPendientes { get; set; }
    public DateTime FechaFinalActual { get; set; }
    public string FrecuenciaPago { get; set; } = string.Empty;
}

public class AmpliacionPlazoInputDto
{
    [Required, Range(0.01, double.MaxValue)]
    public decimal InteresAdicional { get; set; }

    [Required, Range(1, int.MaxValue)]
    public int CantidadCuotasNuevas { get; set; }

    [Required]
    public string FrecuenciaNueva { get; set; } = string.Empty;

    [Required]
    public DateTime FechaInicio { get; set; }

    [MaxLength(1000)]
    public string? Observacion { get; set; }
}

public class AmpliacionPlazoResultadoDto
{
    public int NovedadId { get; set; }
    public decimal SaldoPendienteAnterior { get; set; }
    public decimal InteresAdicional { get; set; }
    public decimal NuevoSaldo { get; set; }
    public decimal ValorCuota { get; set; }
    public DateTime FechaFinalAnterior { get; set; }
    public DateTime NuevaFechaFinal { get; set; }
    public int CantidadCuotasNuevas { get; set; }
}

// ─── RECOGER PRÉSTAMO ──────────────────────────────────────────────────────

public class RecogerPrestamoInputDto
{
    [Required, Range(0.01, double.MaxValue, ErrorMessage = "El dinero adicional debe ser mayor a 0")]
    public decimal DineroAdicional { get; set; }

    [Required, Range(0, double.MaxValue, ErrorMessage = "Los intereses no pueden ser negativos")]
    public decimal Intereses { get; set; }

    [Required, Range(1, int.MaxValue, ErrorMessage = "Debe ingresar al menos 1 cuota")]
    public int CantidadCuotas { get; set; }

    [Required]
    public string FrecuenciaPago { get; set; } = string.Empty;

    [Required]
    public DateTime FechaInicio { get; set; }

    [MaxLength(1000)]
    public string? Observacion { get; set; }
}

public class RecogerPrestamoResultadoDto
{
    public int PrestamoOrigenId { get; set; }
    public int PrestamoDestinoId { get; set; }
    public int NovedadId { get; set; }
    public decimal SaldoTrasladado { get; set; }
    public decimal DineroAdicional { get; set; }
    public decimal CapitalNuevo { get; set; }
    public decimal TotalACobrar { get; set; }
}


// ─── CUOTA ─────────────────────────────────────────────────────────────────

public class CuotaDetalleDto
{
    public int Id { get; set; }
    public int NumeroCuota { get; set; }
    public DateTime FechaEsperada { get; set; }
    public decimal ValorCuota { get; set; }
    public decimal SaldoPagado { get; set; }
    public string Estado { get; set; } = string.Empty; // "pendiente" | "parcial" | "pagada" | "cerrada_pronto_pago"
}

public class AplicacionCuotaDto
{
    public int CuotaId { get; set; }
    public int NumeroCuota { get; set; }
    public decimal ValorAplicado { get; set; }
}

// ─── REPORTES ──────────────────────────────────────────────────────────────

/// <summary>Detalle de un cliente dentro del recaudo de una zona.</summary>
public class ReporteClienteRecaudoDto
{
    public string ClienteId { get; set; } = string.Empty;
    public string ClienteNombre { get; set; } = string.Empty;
    public string? ClienteAlias { get; set; }
    public decimal MontoCobrado { get; set; }
    public decimal MontoEsperado { get; set; }
    public int PagosRealizados { get; set; }
    public double PorcentajeCumplimiento { get; set; }
}

/// <summary>Recaudo de una zona con el detalle por cliente.</summary>
public class ReporteRecaudoZonaDto
{
    public string ZonaId { get; set; } = string.Empty;
    public string ZonaNombre { get; set; } = string.Empty;
    public decimal MontoCobrado { get; set; }
    public decimal MontoEsperado { get; set; }
    public int PagosRealizados { get; set; }
    public double PorcentajeCumplimiento { get; set; }
    public List<ReporteClienteRecaudoDto> Clientes { get; set; } = [];
}

/// <summary>Préstamo nuevo (creado en el rango de fechas).</summary>
public class ReportePrestamoNuevoDto
{
    public string PrestamoId { get; set; } = string.Empty;
    public string ClienteId { get; set; } = string.Empty;
    public string ClienteNombre { get; set; } = string.Empty;
    public string ZonaId { get; set; } = string.Empty;
    public string ZonaNombre { get; set; } = string.Empty;
    public DateTime FechaPrestamo { get; set; }
    public decimal ValorPrestado { get; set; }
    public decimal ValorTotal { get; set; }
    public string FrecuenciaPago { get; set; } = string.Empty;
    public int CantidadCuotas { get; set; }
    public decimal ValorCuota { get; set; }
    /// <summary>Id del préstamo origen si fue creado por recoger; null si es nuevo.</summary>
    public string? PrestamoOrigenId { get; set; }
    /// <summary>Saldo pendiente trasladado desde el préstamo origen (sólo recoger_prestamo).</summary>
    public decimal? SaldoTrasladado { get; set; }
    /// <summary>Dinero adicional entregado al cliente (sólo recoger_prestamo).</summary>
    public decimal? DineroAdicional { get; set; }
}

/// <summary>Préstamo finalizado (su FechaFinal cae en el rango de fechas).</summary>
public class ReportePrestamoFinalizadoDto
{
    public string PrestamoId { get; set; } = string.Empty;
    public string ClienteId { get; set; } = string.Empty;
    public string ClienteNombre { get; set; } = string.Empty;
    public string ZonaId { get; set; } = string.Empty;
    public string ZonaNombre { get; set; } = string.Empty;
    public DateTime FechaPrestamo { get; set; }
    public DateTime FechaFinal { get; set; }
    public decimal ValorPrestado { get; set; }
    public decimal ValorTotal { get; set; }
    public decimal TotalPagado { get; set; }
    /// <summary>"pagado_completo" | "vencido_sin_pagar" | "refinanciado" | "pronto_pago"</summary>
    public string EstadoFinalizacion { get; set; } = string.Empty;
}

/// <summary>Respuesta completa del endpoint GET /api/reportes.</summary>
public class ReporteCompletoDto
{
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public List<ReportePrestamoNuevoDto> PrestamosNuevos { get; set; } = [];
    public List<ReportePrestamoFinalizadoDto> PrestamosFinalizados { get; set; } = [];
    public List<ReporteRecaudoZonaDto> RecaudoPorZona { get; set; } = [];
}
