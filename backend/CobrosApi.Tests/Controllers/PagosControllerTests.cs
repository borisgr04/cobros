using System.Net;
using System.Net.Http.Json;
using CobrosApi.Tests.Helpers;
using Xunit;

namespace CobrosApi.Tests.Controllers;

public class PagosControllerTests(CobrosWebAppFactory factory)
    : IClassFixture<CobrosWebAppFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    // ── Sin autenticación devuelve 401 ────────────────────────────────────

    [Fact]
    public async Task GetAll_SinToken_Retorna401()
    {
        var response = await _client.GetAsync("/api/pagos");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Seed: 8 pagos ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_ConToken_RetornaMinimoLos8PagosSeed()
    {
        _client.SetBearerToken();
        var pagos = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>("/api/pagos");

        Assert.NotNull(pagos);
        Assert.True(pagos.Count >= 8, $"Se esperaban al menos 8 pagos seed, se obtuvo {pagos.Count}");
    }

    [Fact]
    public async Task GetById_PagoExistente_RetornaPago()
    {
        _client.SetBearerToken();
        var response = await _client.GetAsync("/api/pagos/1");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var pago = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(pago);
        Assert.Equal("1", pago["id"].ToString());
        Assert.Equal("1", pago["prestamoId"].ToString());
        Assert.Equal("46154", pago["valor"].ToString());
    }

    [Fact]
    public async Task GetById_PagoInexistente_Retorna404()
    {
        _client.SetBearerToken();
        var response = await _client.GetAsync("/api/pagos/9999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── Por préstamo ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetByPrestamo_Prestamo1_MinimoDe3Pagos()
    {
        // Seed: pagos 1, 2, 3 pertenecen al préstamo 1 (puede haber más si otros tests agregaron)
        _client.SetBearerToken();
        var pagos = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>("/api/pagos/prestamo/1");

        Assert.NotNull(pagos);
        Assert.True(pagos.Count >= 3, $"Se esperaban al menos 3 pagos para prestamo 1, se obtuvo {pagos.Count}");
    }

    [Fact]
    public async Task GetByPrestamo_PrestamoSinPagos_RetornaListaVacia()
    {
        // Seed: préstamo 5 no tiene pagos
        _client.SetBearerToken();
        var pagos = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>("/api/pagos/prestamo/5");

        Assert.NotNull(pagos);
        Assert.Empty(pagos);
    }

    // ── Total pagado ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetTotal_Prestamo1_RetornaTotalCorrecto()
    {
        // Seed: 3 pagos de 46154 = 138462
        _client.SetBearerToken();
        var response = await _client.GetAsync("/api/pagos/prestamo/1/total");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(result);
        Assert.Equal("1", result["prestamoId"].ToString());
        Assert.Equal("138462", result["totalPagado"].ToString());
    }

    [Fact]
    public async Task GetTotal_PrestamoSinPagos_RetornaCero()
    {
        // Seed: préstamo 5 no tiene pagos
        _client.SetBearerToken();
        var result = await _client.GetFromJsonAsync<Dictionary<string, object>>("/api/pagos/prestamo/5/total");

        Assert.NotNull(result);
        Assert.Equal("0", result["totalPagado"].ToString());
    }

    // ── Crear pago ────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_DatosValidos_RetornaPagoCreado()
    {
        _client.SetBearerToken();
        // Usa prestamo 5 (sin pagos en seed) para no contaminar contadores de otros tests
        var input = new
        {
            prestamoId = "5",
            valor      = 2000,
            fechaPago  = "2026-01-01"
        };
        var response = await _client.PostAsJsonAsync("/api/pagos", input);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var pago = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(pago);
        Assert.Equal("2000", pago["valor"].ToString());
        Assert.Equal("5", pago["prestamoId"].ToString());
        Assert.NotNull(pago["id"].ToString());
    }

    [Fact]
    public async Task Create_PrestamoInexistente_Retorna400()
    {
        _client.SetBearerToken();
        var input = new
        {
            prestamoId = "9999",
            valor      = 50000,
            fechaPago  = "2026-01-01"
        };
        var response = await _client.PostAsJsonAsync("/api/pagos", input);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── Eliminar pago ─────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_PagoExistente_Retorna204()
    {
        _client.SetBearerToken();
        // Crear pago y luego eliminarlo
        var crear = await _client.PostAsJsonAsync("/api/pagos", new
        {
            prestamoId = "6",
            valor      = 150000,
            fechaPago  = "2026-04-01"
        });
        var pago = await crear.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var id = pago!["id"].ToString();

        var response = await _client.DeleteAsync($"/api/pagos/{id}");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Delete_PagoInexistente_Retorna404()
    {
        _client.SetBearerToken();
        var response = await _client.DeleteAsync("/api/pagos/9999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
