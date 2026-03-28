using System.Net;
using System.Net.Http.Json;
using CobrosApi.Tests.Helpers;
using Xunit;

namespace CobrosApi.Tests.Controllers;

public class ZonasControllerTests(CobrosWebAppFactory factory)
    : IClassFixture<CobrosWebAppFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    // ── Sin autenticación devuelve 401 ───────────────────────────────────

    [Fact]
    public async Task GetAll_SinToken_Retorna401()
    {
        var response = await _client.GetAsync("/api/zonas");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Seed: 3 zonas ────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_ConToken_RetornaLas3ZonasSeed()
    {
        _client.SetBearerToken();
        var zonas = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>("/api/zonas");

        Assert.NotNull(zonas);
        Assert.Equal(3, zonas.Count);
    }

    [Fact]
    public async Task GetById_ZonaExistente_RetornaZona()
    {
        _client.SetBearerToken();
        // Usa zona 2 ("Norte") — no modificada por el test Update que toca zona 1
        var response = await _client.GetAsync("/api/zonas/2");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var zona = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(zona);
        Assert.Equal("2", zona["id"].ToString());
        Assert.Equal("Norte", zona["nombre"].ToString());
    }

    [Fact]
    public async Task GetById_ZonaInexistente_Retorna404()
    {
        _client.SetBearerToken();
        var response = await _client.GetAsync("/api/zonas/9999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── Crear zona ───────────────────────────────────────────────────────

    [Fact]
    public async Task Create_DatosValidos_RetornaZonaCreada()
    {
        _client.SetBearerToken();
        var input = new { nombre = "Zona Test" };
        var response = await _client.PostAsJsonAsync("/api/zonas", input);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var zona = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(zona);
        Assert.Equal("Zona Test", zona["nombre"].ToString());
        Assert.NotNull(zona["id"].ToString());
    }

    [Fact]
    public async Task Create_NombreVacio_Retorna400()
    {
        _client.SetBearerToken();
        var input = new { nombre = "" };
        var response = await _client.PostAsJsonAsync("/api/zonas", input);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── Actualizar zona ──────────────────────────────────────────────────

    [Fact]
    public async Task Update_ZonaExistente_RetornaZonaActualizada()
    {
        _client.SetBearerToken();
        var input = new { nombre = "Centro Actualizado", estado = "activo" };
        var response = await _client.PutAsJsonAsync("/api/zonas/1", input);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var zona = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.Equal("Centro Actualizado", zona!["nombre"].ToString());
    }

    [Fact]
    public async Task Update_ZonaInexistente_Retorna404()
    {
        _client.SetBearerToken();
        var input = new { nombre = "X", estado = "activo" };
        var response = await _client.PutAsJsonAsync("/api/zonas/9999", input);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── Eliminar zona ────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_ZonaConClientes_Retorna409()
    {
        // Zona 1 tiene clientes en el seed
        _client.SetBearerToken();
        var response = await _client.DeleteAsync("/api/zonas/1");
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ZonaSinClientes_Retorna204()
    {
        _client.SetBearerToken();
        // Crear zona nueva sin clientes
        var crear = await _client.PostAsJsonAsync("/api/zonas", new { nombre = "Zona Para Borrar" });
        var zona  = await crear.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var id    = zona!["id"].ToString();

        var response = await _client.DeleteAsync($"/api/zonas/{id}");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Verificar que ya no existe
        var get = await _client.GetAsync($"/api/zonas/{id}");
        Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
    }
}
