using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CobrosApi.Models;

public class RefreshToken
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public int UsuarioId { get; set; }

    [ForeignKey(nameof(UsuarioId))]
    public Usuario? Usuario { get; set; }

    [Required, MaxLength(128)]
    public string TokenHash { get; set; } = string.Empty;

    public DateTime Expires { get; set; }

    public bool Revoked { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(128)]
    public string? ReplacedByTokenHash { get; set; }
}
