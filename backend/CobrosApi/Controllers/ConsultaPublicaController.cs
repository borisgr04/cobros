using CobrosApi.Data;
using CobrosApi.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CobrosApi.Controllers;

[ApiController]
[Route("api/consulta")]
[AllowAnonymous]
[Produces("application/json")]
public class ConsultaPublicaController(CobrosDbContext db) : ControllerBase
{
    /// <summary>Consulta pública del estado de cuenta de un cliente por su id.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ConsultaPublicaDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    public async Task<IActionResult> Get(int id)
    {
        var cliente = await db.Clientes
            .Where(c => c.Estado == "activo" && c.Id == id)
            .Include(c => c.Prestamos)
                .ThenInclude(p => p.Pagos)
            .FirstOrDefaultAsync();

        if (cliente is null)
            return NotFound(new ErrorDto { Error = "Consulta no encontrada" });

        var prestamos = cliente.Prestamos
            .OrderByDescending(p => p.FechaPrestamo)
            .Select(p =>
            {
                var totalPagado   = p.Pagos.Sum(x => x.Valor);
                var saldo         = Math.Max(0, p.ValorTotal - totalPagado);
                var cuotasPagadas = p.ValorCuota > 0
                    ? (int)Math.Floor(totalPagado / p.ValorCuota)
                    : 0;
                var ultimoPago    = p.Pagos.Any()
                    ? p.Pagos.Max(x => x.FechaPago)
                    : (DateTime?)null;

                return new PrestamoPublicoDto
                {
                    Id            = p.Id,
                    FechaPrestamo = p.FechaPrestamo,
                    FechaFinal    = p.FechaFinal,
                    ValorPrestado = p.ValorPrestado,
                    ValorTotal    = p.ValorTotal,
                    ValorCuota    = p.ValorCuota,
                    FrecuenciaPago = p.FrecuenciaPago,
                    CantidadCuotas = p.CantidadCuotas,
                    CuotasPagadas  = cuotasPagadas,
                    TotalPagado    = totalPagado,
                    SaldoPendiente = saldo,
                    UltimoPago     = ultimoPago,
                    Pagos          = p.Pagos
                        .OrderByDescending(x => x.FechaPago)
                        .Select(x => new PagoPublicoDto { FechaPago = x.FechaPago, Valor = x.Valor })
                        .ToList()
                };
            })
            .ToList();

        return Ok(new ConsultaPublicaDto
        {
            Nombre    = cliente.Nombre,
            Alias     = cliente.Alias,
            Prestamos = prestamos
        });
    }
}
