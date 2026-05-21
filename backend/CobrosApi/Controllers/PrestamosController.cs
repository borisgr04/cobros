using CobrosApi.Data;
using CobrosApi.DTOs;
using CobrosApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CobrosApi.Controllers;

[ApiController]
[Route("api/prestamos")]
[Authorize]
[Produces("application/json")]
public class PrestamosController(CobrosDbContext db) : ControllerBase
{
    private static PrestamoDto ToDto(Prestamo p) => new()
    {
        Id                = p.Id.ToString(),
        ClienteId         = p.ClienteId.ToString(),
        FechaPrestamo     = p.FechaPrestamo,
        FechaFinal        = p.FechaFinal,
        ValorPrestado     = p.ValorPrestado,
        ValorTotal        = p.ValorTotal,
        InteresProyectado = p.InteresProyectado,
        FrecuenciaPago    = p.FrecuenciaPago,
        CantidadCuotas    = p.CantidadCuotas,
        ValorCuota        = p.ValorCuota
    };

    // GET /api/prestamos
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PrestamoDto>), 200)]
    public async Task<IActionResult> GetAll()
    {
        var prestamos = await db.Prestamos.AsNoTracking().ToListAsync();
        return Ok(prestamos.Select(ToDto));
    }

    // GET /api/prestamos/activos
    [HttpGet("activos")]
    [ProducesResponseType(typeof(IEnumerable<PrestamoDto>), 200)]
    public async Task<IActionResult> GetActivos()
    {
        // Activo = suma de pagos < valorTotal
        var prestamos = await db.Prestamos
            .AsNoTracking()
            .Include(p => p.Pagos)
            .ToListAsync();

        var activos = prestamos.Where(p => p.Pagos.Sum(pg => pg.Valor) < p.ValorTotal);
        return Ok(activos.Select(ToDto));
    }

    // GET /api/prestamos/cliente/{clienteId}
    [HttpGet("cliente/{clienteId:int}")]
    [ProducesResponseType(typeof(IEnumerable<PrestamoDto>), 200)]
    public async Task<IActionResult> GetByCliente(int clienteId)
    {
        var prestamos = await db.Prestamos
            .AsNoTracking()
            .Where(p => p.ClienteId == clienteId)
            .ToListAsync();
        return Ok(prestamos.Select(ToDto));
    }

    // GET /api/prestamos/{id}
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(PrestamoDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    public async Task<IActionResult> GetById(int id)
    {
        var prestamo = await db.Prestamos.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        if (prestamo is null)
            return NotFound(new ErrorDto { Error = $"Préstamo {id} no encontrado" });
        return Ok(ToDto(prestamo));
    }

    // GET /api/prestamos/{id}/cuotas
    [HttpGet("{id:int}/cuotas")]
    [ProducesResponseType(typeof(IEnumerable<CuotaDetalleDto>), 200)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    public async Task<IActionResult> GetCuotas(int id)
    {
        var existeP = await db.Prestamos.AnyAsync(p => p.Id == id);
        if (!existeP)
            return NotFound(new ErrorDto { Error = $"Préstamo {id} no encontrado" });

        // Leer de tabla Cuota si existen registros (prestamos nuevos)
        var cuotasDb = await db.Cuotas
            .AsNoTracking()
            .Where(c => c.PrestamoId == id)
            .OrderBy(c => c.NumeroCuota)
            .ToListAsync();

        if (cuotasDb.Count > 0)
            return Ok(cuotasDb.Select(ToCuotaDetalleDto));

        // Fallback: proyección calculada para préstamos anteriores al cambio
        var prestamo = await db.Prestamos
            .AsNoTracking()
            .Include(p => p.Pagos)
            .FirstOrDefaultAsync(p => p.Id == id);

        return Ok(CalcularCuotasFallback(prestamo!).Select(c => new CuotaDetalleDto
        {
            Id            = 0,
            NumeroCuota   = c.NumeroCuota,
            FechaEsperada = c.FechaEsperada,
            ValorCuota    = c.ValorCuota,
            SaldoPagado   = c.Estado == "pagada" ? c.ValorCuota : 0,
            Estado        = c.Estado
        }));
    }

    // POST /api/prestamos
    [HttpPost]
    [ProducesResponseType(typeof(PrestamoDto), 201)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    public async Task<IActionResult> Create([FromBody] PrestamoInputDto input)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorDto { Error = "Datos inválidos" });

        if (!int.TryParse(input.ClienteId, out int clienteId))
            return BadRequest(new ErrorDto { Error = "ClienteId inválido" });

        var clienteExiste = await db.Clientes.AnyAsync(c => c.Id == clienteId);
        if (!clienteExiste)
            return BadRequest(new ErrorDto { Error = $"Cliente {input.ClienteId} no existe" });

        var prestamo = new Prestamo
        {
            ClienteId         = clienteId,
            FechaPrestamo     = input.FechaPrestamo,
            FechaFinal        = input.FechaFinal,
            ValorPrestado     = input.ValorPrestado,
            ValorTotal        = input.ValorTotal,
            InteresProyectado = input.InteresProyectado,
            FrecuenciaPago    = input.FrecuenciaPago,
            CantidadCuotas    = input.CantidadCuotas,
            ValorCuota        = input.ValorCuota
        };
        db.Prestamos.Add(prestamo);
        await db.SaveChangesAsync();

        // Generar registros Cuota para el préstamo recién creado
        var cuotas = Enumerable.Range(1, prestamo.CantidadCuotas).Select(i => new Cuota
        {
            PrestamoId    = prestamo.Id,
            NumeroCuota   = i,
            FechaEsperada = CalcularFechaCuota(prestamo.FechaPrestamo, prestamo.FrecuenciaPago, i),
            ValorCuota    = prestamo.ValorCuota,
            SaldoPagado   = 0
        });
        db.Cuotas.AddRange(cuotas);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = prestamo.Id }, ToDto(prestamo));
    }

    // PUT /api/prestamos/{id}
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(PrestamoDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    [ProducesResponseType(typeof(ErrorDto), 409)]
    public async Task<IActionResult> Update(int id, [FromBody] PrestamoInputDto input)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorDto { Error = "Datos inválidos" });

        var prestamo = await db.Prestamos
            .Include(p => p.Pagos)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (prestamo is null)
            return NotFound(new ErrorDto { Error = $"Préstamo {id} no encontrado" });

        if (prestamo.Pagos.Count != 0)
            return Conflict(new ErrorDto { Error = "No se puede editar un préstamo que ya tiene pagos registrados" });

        if (!int.TryParse(input.ClienteId, out int clienteId))
            return BadRequest(new ErrorDto { Error = "ClienteId inválido" });

        prestamo.ClienteId         = clienteId;
        prestamo.FechaPrestamo     = input.FechaPrestamo;
        prestamo.FechaFinal        = input.FechaFinal;
        prestamo.ValorPrestado     = input.ValorPrestado;
        prestamo.ValorTotal        = input.ValorTotal;
        prestamo.InteresProyectado = input.InteresProyectado;
        prestamo.FrecuenciaPago    = input.FrecuenciaPago;
        prestamo.CantidadCuotas    = input.CantidadCuotas;
        prestamo.ValorCuota        = input.ValorCuota;

        await db.SaveChangesAsync();
        return Ok(ToDto(prestamo));
    }

    // DELETE /api/prestamos/{id}
    [HttpDelete("{id:int}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    [ProducesResponseType(typeof(ErrorDto), 409)]
    public async Task<IActionResult> Delete(int id)
    {
        var prestamo = await db.Prestamos
            .Include(p => p.Pagos)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (prestamo is null)
            return NotFound(new ErrorDto { Error = $"Préstamo {id} no encontrado" });

        if (prestamo.Pagos.Count != 0)
            return Conflict(new ErrorDto { Error = "No se puede eliminar un préstamo que tiene pagos registrados" });

        db.Prestamos.Remove(prestamo);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static CuotaDetalleDto ToCuotaDetalleDto(Cuota c) => new()
    {
        Id            = c.Id,
        NumeroCuota   = c.NumeroCuota,
        FechaEsperada = c.FechaEsperada,
        ValorCuota    = c.ValorCuota,
        SaldoPagado   = c.SaldoPagado,
        Estado        = c.SaldoPagado >= c.ValorCuota ? "pagada"
                      : c.SaldoPagado > 0             ? "parcial"
                      :                                 "pendiente"
    };

    // Fallback para préstamos anteriores al cambio (sin registros en tabla Cuota)
    private static List<CuotaDto> CalcularCuotasFallback(Prestamo prestamo)
    {
        var cuotas = new List<CuotaDto>();
        var totalPagado = prestamo.Pagos.Sum(p => p.Valor);
        var acumulado = 0m;

        for (int i = 1; i <= prestamo.CantidadCuotas; i++)
        {
            var fechaEsperada = CalcularFechaCuota(prestamo.FechaPrestamo, prestamo.FrecuenciaPago, i);
            acumulado += prestamo.ValorCuota;

            cuotas.Add(new CuotaDto
            {
                NumeroCuota   = i,
                FechaEsperada = fechaEsperada,
                ValorCuota    = prestamo.ValorCuota,
                Estado        = acumulado <= totalPagado ? "pagada" : "pendiente"
            });
        }
        return cuotas;
    }

    private static DateTime CalcularFechaCuota(DateTime fechaInicio, string frecuencia, int numeroCuota) =>
        frecuencia switch
        {
            "diario"    => fechaInicio.AddDays(numeroCuota),
            "semanal"   => fechaInicio.AddDays(numeroCuota * 7),
            "quincenal" => fechaInicio.AddDays(numeroCuota * 15),
            "mensual"   => fechaInicio.AddMonths(numeroCuota),
            _           => fechaInicio.AddDays(numeroCuota * 7)
        };
}
