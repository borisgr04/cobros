using System.ComponentModel.DataAnnotations;

namespace CobrosApi.Models;

public class Zona : IAuditable
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Estado { get; set; } = "activo";

    // ── Auditoría ─────────────────────────────────────────────────────────
    public DateTime CreadoEn { get; set; }
    public int? CreadoPorId { get; set; }
    public DateTime ModificadoEn { get; set; }
    public int? ModificadoPorId { get; set; }

    public ICollection<Cliente> Clientes { get; set; } = [];
}
