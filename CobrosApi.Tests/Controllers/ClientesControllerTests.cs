using System.Net;
using System.Net.Http.Json;
using CobrosApi.Tests.Helpers;
using Xunit;

namespace CobrosApi.Tests.Controllers;

public class ClientesControllerTests(CobrosWebAppFactory factory)
    : IClassFixture<CobrosWebAppFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    // ── Sin autenticación devuelve 401 ───────────────────────────────────

    [Fact]
    public async Task GetAll_SinToken_Retorna401()
    {
        var response = await _client.GetAsync("/api/clientes");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Seed: 6 clientes ─────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_ConToken_RetornaLos6ClientesSeed()
    {
        _client.SetBearerToken();
        var clientes = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>("/api/clientes");

        Assert.NotNull(clientes);
        Assert.Equal(6, clientes.Count);
    }

    [Fact]
    public async Task GetById_ClienteExistente_RetornaCliente()
    {
        _client.SetBearerToken();
        var response = await _client.GetAsync("/api/clientes/1");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var cliente = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(cliente);
        Assert.Contains("Juan", cliente["nombre"].ToString());
    }

    [Fact]
    public async Task GetById_ClienteInexistente_Retorna404()
    {
        _client.SetBearerToken();
        var response = await _client.GetAsync("/api/clientes/9999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── Filtrar por zona ─────────────────────────────────────────────────

    [Fact]
    public async Task GetByZona_Zona1_Retorna3Clientes()
    {
        // Seed: clientes 1, 4, 6 pertenecen a zona 1
        _client.SetBearerToken();
        var clientes = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>("/api/clientes/zona/1");

        Assert.NotNull(clientes);
        Assert.Equal(3, clientes.Count);
    }

    [Fact]
    public async Task GetByZona_Zona2_Retorna2Clientes()
    {
        // Seed: clientes 2, 5 pertenecen a zona 2
        _client.SetBearerToken();
        var clientes = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>("/api/clientes/zona/2");

        Assert.NotNull(clientes);
        Assert.Equal(2, clientes.Count);
    }

    // ── Crear cliente ─────────────────────────────────────────────────────

    [Fact]
    public async Task Create_DatosValidos_RetornaClienteCreado()
    {
        _client.SetBearerToken();
        var input = new
        {
            nombre         = "Nuevo Cliente Test",
            identificacion = "00001111",
            zonaId         = "1",
            estado         = "activo"
        };
        var response = await _client.PostAsJsonAsync("/api/clientes", input);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var cliente = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(cliente);
        Assert.Equal("Nuevo Cliente Test", cliente["nombre"].ToString());
    }

    [Fact]
    public async Task Create_ZonaInexistente_Retorna400()
    {
        _client.SetBearerToken();
        var input = new
        {
            nombre         = "Cliente Zona Mala",
            identificacion = "99999999",
            zonaId         = "9999",
            estado         = "activo"
        };
        var response = await _client.PostAsJsonAsync("/api/clientes", input);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── Eliminar cliente ──────────────────────────────────────────────────

    [Fact]
    public async Task Delete_ClienteConPrestamos_Retorna409()
    {
        // Cliente 1 tiene préstamos en el seed
        _client.SetBearerToken();
        var response = await _client.DeleteAsync("/api/clientes/1");
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ClienteSinPrestamos_Retorna204()
    {
        _client.SetBearerToken();
        // Crear cliente nuevo sin préstamos
        var crear = await _client.PostAsJsonAsync("/api/clientes", new
        {
            nombre         = "Cliente Para Borrar",
            identificacion = "11110000",
            zonaId         = "1",
            estado         = "activo"
        });
        var cliente = await crear.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var id = cliente!["id"].ToString();

        var response = await _client.DeleteAsync($"/api/clientes/{id}");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }
}
