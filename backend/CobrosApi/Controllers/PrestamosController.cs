using CobrosApi.Data;
using CobrosApi.DTOs;
using CobrosApi.Features.Liquidacion;
using CobrosApi.Features.Prestamos;
using CobrosApi.Features.Shared;
using CobrosApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CobrosApi.Controllers;

[ApiController]
[Route("api/prestamos")]
[Authorize]
[Produces("application/json")]
public class PrestamosController(
    CobrosDbContext         db,
    EjecutarProntoPago      _ejProntoPago,
    EjecutarAmpliacionPlazo _ejAmpliacion) : ControllerBase
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
        ValorCuota        = p.ValorCuota,
        Estado            = p.Estado,
        FechaCierre       = p.FechaCierre,
        PrestamoOrigenId  = p.PrestamoOrigenId
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
        // Activo = préstamo con estado activo cuyo saldo (desde cuotas) es menor al valor total
        var prestamos = await db.Prestamos
            .AsNoTracking()
            .GetActivosConSaldo()
            .ToListAsync();

        return Ok(prestamos.Select(ToDto));
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

    // GET /api/prestamos/{id}/estadisticas — stats calculadas desde Cuotas (fuente de verdad)
    [HttpGet("{id:int}/estadisticas")]
    [ProducesResponseType(typeof(PrestamoConPagosDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    public async Task<IActionResult> GetEstadisticas(int id)
    {
        var prestamo = await db.Prestamos
            .AsNoTracking()
            .Include(p => p.Cuotas)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (prestamo is null)
            return NotFound(new ErrorDto { Error = $"Préstamo {id} no encontrado" });

        var totalPagado      = prestamo.Cuotas.Sum(c => c.SaldoPagado);
        var cuotasPagadas    = prestamo.Cuotas.Count(c => c.Estado == PrestamoEstados.Cuota.Pagada || c.Estado == PrestamoEstados.Cuota.CerradaProntoPago);
        var cuotasPendientes = prestamo.CantidadCuotas - cuotasPagadas;

        return Ok(new PrestamoConPagosDto
        {
            Id                = prestamo.Id.ToString(),
            ClienteId         = prestamo.ClienteId.ToString(),
            FechaPrestamo     = prestamo.FechaPrestamo,
            FechaFinal        = prestamo.FechaFinal,
            ValorPrestado     = prestamo.ValorPrestado,
            ValorTotal        = prestamo.ValorTotal,
            InteresProyectado = prestamo.InteresProyectado,
            FrecuenciaPago    = prestamo.FrecuenciaPago,
            CantidadCuotas    = prestamo.CantidadCuotas,
            ValorCuota        = prestamo.ValorCuota,
            Estado            = prestamo.Estado,
            FechaCierre       = prestamo.FechaCierre,
            PrestamoOrigenId  = prestamo.PrestamoOrigenId,
            TotalPagado       = totalPagado,
            SaldoPendiente    = Math.Max(0, prestamo.ValorTotal - totalPagado),
            CuotasPagadas     = cuotasPagadas,
            CuotasPendientes  = cuotasPendientes
        });
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
            SaldoPagado   = c.Estado == PrestamoEstados.Cuota.Pagada ? c.ValorCuota : 0,
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
        var cuotas = CuotasService.GenerarCuotas(
            prestamoId:     prestamo.Id,
            cantidadCuotas: prestamo.CantidadCuotas,
            valorTotal:     prestamo.ValorTotal,
            valorCuota:     prestamo.ValorCuota,
            fechaInicio:    prestamo.FechaPrestamo,
            frecuencia:     prestamo.FrecuenciaPago);
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

    // GET /api/prestamos/{id}/resumen-pronto-pago
    [HttpGet("{id:int}/resumen-pronto-pago")]
    [ProducesResponseType(typeof(ProntoPagoResumenDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    public async Task<IActionResult> GetResumenProntoPago(int id)
    {
        var prestamo = await db.Prestamos
            .AsNoTracking()
            .Include(p => p.Cuotas)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (prestamo is null)
            return NotFound(new ErrorDto { Error = $"Préstamo {id} no encontrado" });

        if (prestamo.Estado == PrestamoEstados.Prestamo.CerradoProntoPago)
            return BadRequest(new ErrorDto { Error = "El préstamo ya fue cerrado por pronto pago" });

        var totalPagado    = prestamo.Cuotas.Sum(c => c.SaldoPagado);
        var saldoPendiente = prestamo.ValorTotal - totalPagado;

        if (saldoPendiente <= 0)
            return BadRequest(new ErrorDto { Error = "El préstamo no tiene saldo pendiente" });

        var cuotasPendientes = prestamo.Cuotas
            .Count(c => c.Estado != PrestamoEstados.Cuota.Pagada && c.Estado != PrestamoEstados.Cuota.CerradaProntoPago && c.SaldoPagado < c.ValorCuota);

        var interesesFuturos = prestamo.CantidadCuotas > 0
            ? Math.Round(prestamo.InteresProyectado / prestamo.CantidadCuotas * cuotasPendientes, 2)
            : 0;

        return Ok(new ProntoPagoResumenDto
        {
            SaldoPendiente           = saldoPendiente,
            CuotasPendientes         = cuotasPendientes,
            InteresesFuturosEstimados = interesesFuturos,
            ValorSugerido            = saldoPendiente
        });
    }

    // POST /api/prestamos/{id}/pronto-pago
    [HttpPost("{id:int}/pronto-pago")]
    [ProducesResponseType(typeof(ProntoPagoResultadoDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    public async Task<IActionResult> EjecutarProntoPago(int id, [FromBody] ProntoPagoInputDto input)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorDto { Error = "Datos inválidos" });

        // Identificar usuario autenticado
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                 ?? User.FindFirst("email")?.Value;
        var usuario = email is not null
            ? await db.Usuarios.FirstOrDefaultAsync(u => u.Email == email)
            : null;
        if (usuario is null)
            return BadRequest(new ErrorDto { Error = "Usuario autenticado no encontrado en el sistema" });

        var result = await _ejProntoPago.ExecuteAsync(
            new Features.Liquidacion.EjecutarProntoPagoDto(id, input.ValorNegociado, input.Notas, usuario.Id));

        return result.StatusCode switch
        {
            200 => Ok(result.Value),
            404 => NotFound(new ErrorDto  { Error = result.Error! }),
            _   => BadRequest(new ErrorDto { Error = result.Error! })
        };
    }

    // GET /api/prestamos/{id}/novedades
    [HttpGet("{id:int}/novedades")]
    [ProducesResponseType(typeof(IEnumerable<NovedadPrestamoDto>), 200)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    public async Task<IActionResult> GetNovedades(int id)
    {
        var existeP = await db.Prestamos.AnyAsync(p => p.Id == id);
        if (!existeP)
            return NotFound(new ErrorDto { Error = $"Préstamo {id} no encontrado" });

        var novedades = await db.NovedadesPrestamo
            .AsNoTracking()
            .Include(n => n.Usuario)
            .Where(n => n.PrestamoId == id)
            .OrderByDescending(n => n.FechaNovedad)
            .ToListAsync();

        return Ok(novedades.Select(n => new NovedadPrestamoDto
        {
            Id                        = n.Id,
            PrestamoId                = n.PrestamoId,
            Tipo                      = n.Tipo,
            FechaNovedad              = n.FechaNovedad,
            UsuarioId                 = n.UsuarioId,
            UsuarioNombre             = n.Usuario?.Nombre,
            UsuarioEmail              = n.Usuario?.Email,
            SaldoPendienteOriginal    = n.SaldoPendienteOriginal,
            InteresesFuturosEstimados = n.InteresesFuturosEstimados,
            ValorNegociado            = n.ValorNegociado,
            DescuentoAplicado         = n.DescuentoAplicado,
            PagoId                    = n.PagoId,
            Notas                     = n.Notas,
            InteresAdicional          = n.InteresAdicional,
            NuevoSaldo                = n.NuevoSaldo,
            FechaFinalAnterior        = n.FechaFinalAnterior,
            NuevaFechaFinal           = n.NuevaFechaFinal,
            CantidadCuotasNuevas      = n.CantidadCuotasNuevas,
            PrestamoDestinoId         = n.PrestamoDestinoId,
            SaldoTrasladado           = n.SaldoTrasladado,
            DineroAdicional           = n.DineroAdicional
        }));
    }

    // GET /api/prestamos/{id}/resumen-ampliacion
    [HttpGet("{id:int}/resumen-ampliacion")]
    [ProducesResponseType(typeof(AmpliacionPlazoResumenDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    public async Task<IActionResult> GetResumenAmpliacion(int id)
    {
        var prestamo = await db.Prestamos
            .AsNoTracking()
            .Include(p => p.Cuotas)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (prestamo is null)
            return NotFound(new ErrorDto { Error = $"Préstamo {id} no encontrado" });

        if (prestamo.Estado == PrestamoEstados.Prestamo.CerradoProntoPago || prestamo.Estado == PrestamoEstados.Prestamo.Completado)
            return BadRequest(new ErrorDto { Error = "El préstamo ya se encuentra cerrado" });

        var totalPagado    = prestamo.Cuotas.Sum(c => c.SaldoPagado);
        var saldoPendiente = prestamo.ValorTotal - totalPagado;

        if (saldoPendiente <= 0)
            return BadRequest(new ErrorDto { Error = "El préstamo no tiene saldo pendiente" });

        var cuotasPendientes = prestamo.Cuotas.Count(c =>
            c.Estado != PrestamoEstados.Cuota.Pagada &&
            c.Estado != PrestamoEstados.Cuota.CerradaProntoPago &&
            c.Estado != PrestamoEstados.Cuota.ReemplazadaAmpliacion &&
            c.SaldoPagado < c.ValorCuota);

        if (cuotasPendientes == 0)
            return BadRequest(new ErrorDto { Error = "No hay cuotas pendientes para ampliar el plazo" });

        return Ok(new AmpliacionPlazoResumenDto
        {
            SaldoPendiente   = saldoPendiente,
            CuotasPendientes = cuotasPendientes,
            FechaFinalActual = prestamo.FechaFinal,
            FrecuenciaPago   = prestamo.FrecuenciaPago
        });
    }

    // POST /api/prestamos/{id}/ampliar-plazo
    [HttpPost("{id:int}/ampliar-plazo")]
    [ProducesResponseType(typeof(AmpliacionPlazoResultadoDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    public async Task<IActionResult> EjecutarAmpliacionPlazo(int id, [FromBody] AmpliacionPlazoInputDto input)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorDto { Error = "Datos inválidos" });

        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                 ?? User.FindFirst("email")?.Value;
        var usuario = email is not null
            ? await db.Usuarios.FirstOrDefaultAsync(u => u.Email == email)
            : null;
        if (usuario is null)
            return BadRequest(new ErrorDto { Error = "Usuario autenticado no encontrado en el sistema" });

        var result = await _ejAmpliacion.ExecuteAsync(
            new Features.Liquidacion.EjecutarAmpliacionPlazoDto(
                id,
                input.InteresAdicional,
                input.CantidadCuotasNuevas,
                input.FechaInicio,
                input.FrecuenciaNueva,
                input.Observacion,
                usuario.Id));

        return result.StatusCode switch
        {
            200 => Ok(result.Value),
            404 => NotFound(new ErrorDto  { Error = result.Error! }),
            _   => BadRequest(new ErrorDto { Error = result.Error! })
        };
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static CuotaDetalleDto ToCuotaDetalleDto(Cuota c) => new()
    {
        Id            = c.Id,
        NumeroCuota   = c.NumeroCuota,
        FechaEsperada = c.FechaEsperada,
        ValorCuota    = c.ValorCuota,
        SaldoPagado   = c.SaldoPagado,
        // Prefer explicit Estado if it was set; fall back to computed value for legacy rows
        Estado        = c.Estado == PrestamoEstados.Cuota.CerradaProntoPago        ? PrestamoEstados.Cuota.CerradaProntoPago
                      : c.Estado == PrestamoEstados.Cuota.ReemplazadaAmpliacion    ? PrestamoEstados.Cuota.ReemplazadaAmpliacion
                      : c.SaldoPagado >= c.ValorCuota                              ? PrestamoEstados.Cuota.Pagada
                      : c.SaldoPagado > 0                                          ? PrestamoEstados.Cuota.Parcial
                      :                                                              PrestamoEstados.Cuota.Pendiente
    };

    // Fallback para préstamos anteriores al cambio (sin registros en tabla Cuota)
    private static List<CuotaDto> CalcularCuotasFallback(Prestamo prestamo)
    {
        var cuotas = new List<CuotaDto>();
        var totalPagado = prestamo.Pagos.Sum(p => p.Valor);
        var acumulado = 0m;

        for (int i = 1; i <= prestamo.CantidadCuotas; i++)
        {
            var fechaEsperada = CuotasService.CalcularFechaCuota(prestamo.FechaPrestamo, prestamo.FrecuenciaPago, i);
            acumulado += prestamo.ValorCuota;

            cuotas.Add(new CuotaDto
            {
                NumeroCuota   = i,
                FechaEsperada = fechaEsperada,
                ValorCuota    = prestamo.ValorCuota,
                Estado        = acumulado <= totalPagado ? PrestamoEstados.Cuota.Pagada : PrestamoEstados.Cuota.Pendiente
            });
        }
        return cuotas;
    }

    // POST /api/prestamos/{id}/recoger
    [HttpPost("{id:int}/recoger")]
    [ProducesResponseType(typeof(RecogerPrestamoResultadoDto), 200)]
    [ProducesResponseType(typeof(ErrorDto), 400)]
    [ProducesResponseType(typeof(ErrorDto), 404)]
    public async Task<IActionResult> RecogerPrestamo(int id, [FromBody] RecogerPrestamoInputDto input)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorDto { Error = "Datos inválidos" });

        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                 ?? User.FindFirst("email")?.Value;
        var usuario = email is not null
            ? await db.Usuarios.FirstOrDefaultAsync(u => u.Email == email)
            : null;
        if (usuario is null)
            return BadRequest(new ErrorDto { Error = "Usuario autenticado no encontrado en el sistema" });

        var prestamoOrigen = await db.Prestamos
            .Include(p => p.Pagos)
            .Include(p => p.Cuotas)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (prestamoOrigen is null)
            return NotFound(new ErrorDto { Error = $"Préstamo {id} no encontrado" });

        if (prestamoOrigen.Estado != PrestamoEstados.Prestamo.Activo)
            return BadRequest(new ErrorDto { Error = "Solo se puede recoger un préstamo activo" });

        var totalPagado    = prestamoOrigen.Pagos.Where(p => !p.Anulado).Sum(p => p.Valor);
        var saldoPendiente = prestamoOrigen.ValorTotal - totalPagado;

        if (saldoPendiente <= 0)
            return BadRequest(new ErrorDto { Error = "El préstamo no tiene saldo pendiente" });

        var capitalNuevo  = saldoPendiente + input.DineroAdicional;
        var totalACobrar  = capitalNuevo + input.Intereses;
        var valorCuota    = Math.Round(totalACobrar / input.CantidadCuotas, 2);
        var fechaInicio   = input.FechaInicio.Kind == DateTimeKind.Utc
                                ? input.FechaInicio
                                : DateTime.SpecifyKind(input.FechaInicio, DateTimeKind.Utc);
        var nuevaFechaFinal = CuotasService.CalcularFechaCuota(fechaInicio, input.FrecuenciaPago, input.CantidadCuotas);
        var ahora           = DateTime.UtcNow;

        using var tx = db.Database.IsInMemory()
            ? null
            : await db.Database.BeginTransactionAsync();

        // 1. Marcar préstamo origen como "refinanciado" y cerrarlo
        prestamoOrigen.Estado = PrestamoEstados.Prestamo.Refinanciado;
        prestamoOrigen.FechaCierre = ahora;

        // Marcar cuotas pendientes del origen como reemplazadas
        var cuotasPendientes = prestamoOrigen.Cuotas
            .Where(c => c.Estado != PrestamoEstados.Cuota.Pagada &&
                        c.Estado != PrestamoEstados.Cuota.CerradaProntoPago &&
                        c.Estado != PrestamoEstados.Cuota.ReemplazadaAmpliacion &&
                        c.SaldoPagado < c.ValorCuota)
            .ToList();
        foreach (var cuota in cuotasPendientes)
            cuota.Estado = PrestamoEstados.Cuota.ReemplazadaAmpliacion;

        // 2. Crear el préstamo destino
        var prestamoDestino = new Prestamo
        {
            ClienteId          = prestamoOrigen.ClienteId,
            FechaPrestamo      = fechaInicio,
            FechaFinal         = nuevaFechaFinal,
            ValorPrestado      = capitalNuevo,
            ValorTotal         = totalACobrar,
            InteresProyectado  = input.Intereses,
            FrecuenciaPago     = input.FrecuenciaPago,
            CantidadCuotas     = input.CantidadCuotas,
            ValorCuota         = valorCuota,
            Estado             = PrestamoEstados.Prestamo.Activo,
            PrestamoOrigenId   = prestamoOrigen.Id,
        };
        db.Prestamos.Add(prestamoDestino);
        await db.SaveChangesAsync(); // necesario para obtener prestamoDestino.Id

        // 3. Crear cuotas del préstamo destino
        var nuevasCuotas = Enumerable.Range(1, input.CantidadCuotas).Select(i => new Cuota
        {
            PrestamoId    = prestamoDestino.Id,
            NumeroCuota   = i,
            FechaEsperada = CuotasService.CalcularFechaCuota(fechaInicio, input.FrecuenciaPago, i),
            ValorCuota    = (i == input.CantidadCuotas)
                                ? totalACobrar - (input.CantidadCuotas - 1) * valorCuota
                                : valorCuota,
            SaldoPagado   = 0
        });
        db.Cuotas.AddRange(nuevasCuotas);

        // 4. Registrar novedad en el préstamo origen
        var novedad = new NovedadPrestamo
        {
            PrestamoId                = prestamoOrigen.Id,
            Tipo                      = "recoger_prestamo",
            FechaNovedad              = ahora,
            UsuarioId                 = usuario.Id,
            SaldoPendienteOriginal    = saldoPendiente,
            InteresesFuturosEstimados = input.Intereses,
            ValorNegociado            = totalACobrar,
            DescuentoAplicado         = 0,
            Notas                     = input.Observacion,
            PrestamoDestinoId         = prestamoDestino.Id,
            SaldoTrasladado           = saldoPendiente,
            DineroAdicional           = input.DineroAdicional,
        };
        db.NovedadesPrestamo.Add(novedad);

        await db.SaveChangesAsync();
        if (tx is not null) await tx.CommitAsync();

        return Ok(new RecogerPrestamoResultadoDto
        {
            PrestamoOrigenId  = prestamoOrigen.Id,
            PrestamoDestinoId = prestamoDestino.Id,
            NovedadId         = novedad.Id,
            SaldoTrasladado   = saldoPendiente,
            DineroAdicional   = input.DineroAdicional,
            CapitalNuevo      = capitalNuevo,
            TotalACobrar      = totalACobrar,
        });
    }
}
