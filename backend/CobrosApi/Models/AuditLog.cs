using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CobrosApi.Models;

public class AuditLog
{
    public long Id { get; set; }

    [Required, MaxLength(100)]
    public string Entidad { get; set; } = string.Empty;

    public int EntidadId { get; set; }

    /// <summary>"Created" | "Updated" | "Deleted"</summary>
    [Required, MaxLength(20)]
    public string Operacion { get; set; } = string.Empty;

    public int? UsuarioId { get; set; }

    public DateTime FechaUtc { get; set; }

    [Column(TypeName = "text")]
    public string? AnteriorJson { get; set; }

    [Column(TypeName = "text")]
    public string? NuevoJson { get; set; }
}
