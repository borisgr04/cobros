using System.Net;
using System.Net.Http.Json;
using CobrosApi.Tests.Helpers;
using Xunit;

namespace CobrosApi.Tests.Controllers;

public class PrestamosControllerTests(CobrosWebAppFactory factory)
    : IClassFixture<CobrosWebAppFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    // ── Sin autenticación devuelve 401 ────────────────────────────────────

    [Fact]
    public async Task GetAll_SinToken_Retorna401()
    {
        var response = await _client.GetAsync("/api/prestamos");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Seed: 6 préstamos ─────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_ConToken_RetornaLos6PrestamosSeed()
    {
        _client.SetBearerToken();
        var prestamos = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>("/api/prestamos");

        Assert.NotNull(prestamos);
        Assert.Equal(6, prestamos.Count);
    }

    [Fact]
    public async Task GetById_PrestamoExistente_RetornaCamposCorrectos()
    {
        _client.SetBearerToken();
        var response = await _client.GetAsync("/api/prestamos/1");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var prestamo = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(prestamo);
        Assert.Equal("1", prestamo["id"].ToString());
        Assert.Equal("1", prestamo["clienteId"].ToString());
        // Seed: valorTotal = 1200000
        Assert.Equal("1200000", prestamo["valorTotal"].ToString());
    }

    [Fact]
    public async Task GetById_PrestamoInexistente_Retorna404()
    {
        _client.SetBearerToken();
        var response = await _client.GetAsync("/api/prestamos/9999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── Activos ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetActivos_RetornaSoloPrestamosConSaldoPendiente()
    {
        _client.SetBearerToken();
        var prestamos = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>("/api/prestamos/activos");

        Assert.NotNull(prestamos);
        // En el seed ningún préstamo está 100% pagado
        Assert.True(prestamos.Count > 0);
        Assert.True(prestamos.Count <= 6);
    }

    // ── Por cliente ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetByCliente_Cliente1_Retorna2Prestamos()
    {
        // Seed: préstamos 1 y 5 son del cliente 1
        _client.SetBearerToken();
        var prestamos = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>("/api/prestamos/cliente/1");

        Assert.NotNull(prestamos);
        Assert.Equal(2, prestamos.Count);
    }

    [Fact]
    public async Task GetByCliente_ClienteSinPrestamos_RetornaListaVacia()
    {
        _client.SetBearerToken();
        // Crear cliente nuevo (sin préstamos)
        var crear = await _client.PostAsJsonAsync("/api/clientes", new
        {
            nombre         = "Sin Prestamos",
            identificacion = "00009999",
            zonaId         = "1",
            estado         = "activo"
        });
        var cliente = await crear.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var id = cliente!["id"].ToString();

        var prestamos = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>($"/api/prestamos/cliente/{id}");
        Assert.NotNull(prestamos);
        Assert.Empty(prestamos);
    }

    // ── Calcular cuotas ───────────────────────────────────────────────────

    [Fact]
    public async Task GetCuotas_Prestamo3Mensual_Retorna6Cuotas()
    {
        // Seed: préstamo 3 = 6 cuotas mensuales
        _client.SetBearerToken();
        var cuotas = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>("/api/prestamos/3/cuotas");

        Assert.NotNull(cuotas);
        Assert.Equal(6, cuotas.Count);
    }

    [Fact]
    public async Task GetCuotas_PrimeraCuotaPagada_EstadoPagada()
    {
        // Prestamo 2 tiene 2 pagos (50000 + 50000 = 100000 = 2 cuotas de 50000)
        _client.SetBearerToken();
        var cuotas = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>("/api/prestamos/2/cuotas");

        Assert.NotNull(cuotas);
        Assert.Equal("pagada",   cuotas[0]["estado"].ToString());
        Assert.Equal("pagada",   cuotas[1]["estado"].ToString());
        Assert.Equal("pendiente", cuotas[2]["estado"].ToString());
    }

    [Fact]
    public async Task GetCuotas_PrestamoInexistente_Retorna404()
    {
        _client.SetBearerToken();
        var response = await _client.GetAsync("/api/prestamos/9999/cuotas");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── Crear préstamo ────────────────────────────────────────────────────

    [Fact]
    public async Task Create_DatosValidos_RetornaPrestamoCreado()
    {
        _client.SetBearerToken();
        var input = new
        {
            clienteId         = "1",
            fechaPrestamo     = "2026-01-01",
            fechaFinal        = "2026-07-01",
            valorPrestado     = 500000,
            valorTotal        = 600000,
            interesProyectado = 100000,
            frecuenciaPago    = "mensual",
            cantidadCuotas    = 6,
            valorCuota        = 100000
        };
        var response = await _client.PostAsJsonAsync("/api/prestamos", input);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var prestamo = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(prestamo);
        Assert.Equal("500000", prestamo["valorPrestado"].ToString());
    }

    [Fact]
    public async Task Create_ClienteInexistente_Retorna400()
    {
        _client.SetBearerToken();
        var input = new
        {
            clienteId         = "9999",
            fechaPrestamo     = "2026-01-01",
            fechaFinal        = "2026-07-01",
            valorPrestado     = 500000,
            valorTotal        = 600000,
            interesProyectado = 100000,
            frecuenciaPago    = "mensual",
            cantidadCuotas    = 6,
            valorCuota        = 100000
        };
        var response = await _client.PostAsJsonAsync("/api/prestamos", input);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── Eliminar préstamo ─────────────────────────────────────────────────

    [Fact]
    public async Task Delete_PrestamoConPagos_Retorna409()
    {
        // Préstamo 1 tiene 3 pagos en el seed
        _client.SetBearerToken();
        var response = await _client.DeleteAsync("/api/prestamos/1");
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Delete_PrestamoSinPagos_Retorna204()
    {
        _client.SetBearerToken();
        // Crear préstamo nuevo
        var input = new
        {
            clienteId         = "1",
            fechaPrestamo     = "2026-03-01",
            fechaFinal        = "2026-09-01",
            valorPrestado     = 100000,
            valorTotal        = 120000,
            interesProyectado = 20000,
            frecuenciaPago    = "mensual",
            cantidadCuotas    = 6,
            valorCuota        = 20000
        };
        var crear = await _client.PostAsJsonAsync("/api/prestamos", input);
        var prestamo = await crear.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var id = prestamo!["id"].ToString();

        var response = await _client.DeleteAsync($"/api/prestamos/{id}");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }
}
