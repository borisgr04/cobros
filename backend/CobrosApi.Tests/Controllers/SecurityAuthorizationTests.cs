using System.Net;
using CobrosApi.Tests.Helpers;
using Xunit;

namespace CobrosApi.Tests.Controllers;

/// <summary>
/// Verifica que los endpoints operativos requieran autenticación
/// y que ConsultaPublica permanezca accesible sin token.
/// </summary>
public class SecurityAuthorizationTests(CobrosWebAppFactory factory)
    : IClassFixture<CobrosWebAppFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    // ── Endpoints operativos deben retornar 401 sin token ─────────────────

    [Theory]
    [InlineData("GET",    "/api/clientes")]
    [InlineData("GET",    "/api/prestamos")]
    [InlineData("GET",    "/api/pagos")]
    [InlineData("GET",    "/api/reportes/recaudo-por-zona")]
    [InlineData("GET",    "/api/zonas")]
    [InlineData("GET",    "/api/usuarios")]
    public async Task EndpointOperativo_SinToken_Retorna401(string method, string url)
    {
        var request = new HttpRequestMessage(new HttpMethod(method), url);
        var response = await _client.SendAsync(request);

        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized,
            $"{method} {url} debe retornar 401 sin token, obtuvo {(int)response.StatusCode}");
    }

    // ── ConsultaPublica debe ser accesible sin token ───────────────────────

    [Fact]
    public async Task ConsultaPublica_SinToken_NoRetorna401()
    {
        // Usamos una llave inexistente — esperamos 404, no 401
        var response = await _client.GetAsync("/api/consulta/llave-no-existe");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
        // El endpoint debe ser público: 404 es el resultado esperado para llave no encontrada
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── Auth endpoints públicos (login, refresh) ──────────────────────────

    [Theory]
    [InlineData("POST", "/api/auth/google")]
    [InlineData("POST", "/api/auth/refresh")]
    public async Task AuthEndpointPublico_SinToken_NoRetorna401(string method, string url)
    {
        // Enviamos cuerpo vacío — esperamos 400/422 pero NO 401
        var request = new HttpRequestMessage(new HttpMethod(method), url)
        {
            Content = new StringContent("{}", System.Text.Encoding.UTF8, "application/json")
        };
        var response = await _client.SendAsync(request);

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
