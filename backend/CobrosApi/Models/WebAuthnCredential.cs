using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CobrosApi.Models;

public class WebAuthnCredential
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public int UsuarioId { get; set; }

    [ForeignKey(nameof(UsuarioId))]
    public Usuario? Usuario { get; set; }

    [Required]
    public byte[] CredentialId { get; set; } = [];

    [Required]
    public byte[] PublicKey { get; set; } = [];

    public uint SignCount { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastUsedAt { get; set; }

    [MaxLength(200)]
    public string? DeviceName { get; set; }
}
