namespace CobrosApi.Models;

public interface IAuditable
{
    DateTime CreadoEn { get; set; }
    int? CreadoPorId { get; set; }
    DateTime ModificadoEn { get; set; }
    int? ModificadoPorId { get; set; }
}
