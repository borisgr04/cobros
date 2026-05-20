using System.Net;
using System.Net.Http.Json;
using CobrosApi.Tests.Helpers;
using Xunit;

namespace CobrosApi.Tests.Controllers;

/// <summary>
/// Pruebas de valores límite y lógica de negocio de cálculos.
/// Usa su propia factory para tener DB aislada sin interferencia del seed.
/// </summary>
public class CalculosPrestamosTests(CobrosWebAppFactory factory)
    : IClassFixture<CobrosWebAppFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private async Task<string> CrearZona()
    {
        var r = await _client.PostAsJsonAsync("/api/zonas", new { nombre = "Zona Calc" });
        var z = await r.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        return z!["id"].ToString()!;
    }

    private async Task<string> CrearCliente(string zonaId)
    {
        var r = await _client.PostAsJsonAsync("/api/clientes", new
        {
            nombre = "Cliente Calc", identificacion = "CALC0001", zonaId, estado = "activo"
        });
        var c = await r.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        return c!["id"].ToString()!;
    }

    private async Task<string> CrearPrestamo(string clienteId, decimal valorPrestado, decimal valorTotal,
        int cuotas, decimal valorCuota, string frecuencia = "mensual",
        string? fechaInicio = null)
    {
        var r = await _client.PostAsJsonAsync("/api/prestamos", new
        {
            clienteId,
            fechaPrestamo     = fechaInicio ?? "2026-01-01",
            fechaFinal        = "2026-12-31",
            valorPrestado,
            valorTotal,
            interesProyectado = valorTotal - valorPrestado,
            frecuenciaPago    = frecuencia,
            cantidadCuotas    = cuotas,
            valorCuota
        });
        var p = await r.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        return p!["id"].ToString()!;
    }

    private async Task RegistrarPago(string prestamoId, decimal valor, string fecha = "2026-02-01")
    {
        await _client.PostAsJsonAsync("/api/pagos", new { prestamoId, valor, fechaPago = fecha });
    }

    // ─── Estados de cuotas: límite pagada / pendiente ─────────────────────────

    [Fact]
    public async Task Cuotas_PagoExactoAcumulado_UltimaCuotaEsPagada()
    {
        // 3 cuotas de 100. Pago exacto = 300 → las 3 deben ser "pagada"
        _client.SetBearerToken();
        var zona     = await CrearZona();
        var cliente  = await CrearCliente(zona);
        var prestamo = await CrearPrestamo(cliente, 300, 300, 3, 100);

        await RegistrarPago(prestamo, 300, "2026-02-01"); // pago único exacto al total

        var cuotas = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>($"/api/prestamos/{prestamo}/cuotas");

        Assert.NotNull(cuotas);
        Assert.Equal(3, cuotas.Count);
        // Con acumulado 100, 200, 300 y totalPagado=300: las 3 deben ser pagada
        Assert.All(cuotas, c => Assert.Equal("pagada", c["estado"].ToString()));
    }

    [Fact]
    public async Task Cuotas_PagoUno_SoloLaPrimeraCuotaPagada()
    {
        // 3 cuotas de 100. Pago = 100 → solo la primera es pagada
        _client.SetBearerToken();
        var zona     = await CrearZona();
        var cliente  = await CrearCliente(zona);
        var prestamo = await CrearPrestamo(cliente, 300, 300, 3, 100);

        await RegistrarPago(prestamo, 100);

        var cuotas = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>($"/api/prestamos/{prestamo}/cuotas");

        Assert.Equal("pagada",    cuotas![0]["estado"].ToString());
        Assert.Equal("pendiente", cuotas[1]["estado"].ToString());
        Assert.Equal("pendiente", cuotas[2]["estado"].ToString());
    }

    [Fact]
    public async Task Cuotas_SinPagos_TodasPendientes()
    {
        _client.SetBearerToken();
        var zona     = await CrearZona();
        var cliente  = await CrearCliente(zona);
        var prestamo = await CrearPrestamo(cliente, 500, 600, 6, 100);

        var cuotas = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>($"/api/prestamos/{prestamo}/cuotas");

        Assert.NotNull(cuotas);
        Assert.Equal(6, cuotas.Count);
        Assert.All(cuotas, c => Assert.Equal("pendiente", c["estado"].ToString()));
    }

    [Fact]
    public async Task Cuotas_PagoExcedente_TodasPagadas()
    {
        // Pago mayor al valorTotal → todas las cuotas deben ser "pagada"
        _client.SetBearerToken();
        var zona     = await CrearZona();
        var cliente  = await CrearCliente(zona);
        var prestamo = await CrearPrestamo(cliente, 300, 300, 3, 100);

        await RegistrarPago(prestamo, 9999);

        var cuotas = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>($"/api/prestamos/{prestamo}/cuotas");

        Assert.NotNull(cuotas);
        Assert.All(cuotas, c => Assert.Equal("pagada", c["estado"].ToString()));
    }

    [Fact]
    public async Task Cuotas_PagoUnCentavoMenos_UltimaCuotaPendiente()
    {
        // 2 cuotas de 100. Pago = 199.99 → acumulado 100 <= 199.99 (pagada), 200 > 199.99 (pendiente)
        _client.SetBearerToken();
        var zona     = await CrearZona();
        var cliente  = await CrearCliente(zona);
        var prestamo = await CrearPrestamo(cliente, 200, 200, 2, 100);

        await RegistrarPago(prestamo, 199.99m);

        var cuotas = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>($"/api/prestamos/{prestamo}/cuotas");

        Assert.Equal("pagada",    cuotas![0]["estado"].ToString());
        Assert.Equal("pendiente", cuotas[1]["estado"].ToString());
    }

    // ─── Fechas de cuotas por frecuencia ─────────────────────────────────────

    [Theory]
    [InlineData("diario",    1, "2026-01-02")]
    [InlineData("diario",    7, "2026-01-08")]
    [InlineData("semanal",   1, "2026-01-08")]
    [InlineData("semanal",   4, "2026-01-29")]
    [InlineData("quincenal", 1, "2026-01-16")]
    [InlineData("quincenal", 2, "2026-01-31")]
    [InlineData("mensual",   1, "2026-02-01")]
    [InlineData("mensual",   3, "2026-04-01")]
    public async Task Cuotas_FechaCalculada_EsCorrecta(string frecuencia, int numeroCuota, string fechaEsperada)
    {
        _client.SetBearerToken();
        var zona     = await CrearZona();
        var cliente  = await CrearCliente(zona);
        // Crear suficientes cuotas para llegar al número pedido
        var prestamo = await CrearPrestamo(cliente, 1000, 1200, numeroCuota + 1, 100,
            frecuencia, "2026-01-01");

        var cuotas = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>($"/api/prestamos/{prestamo}/cuotas");

        Assert.NotNull(cuotas);
        var cuota = cuotas[numeroCuota - 1]; // 0-indexed
        var fecha = DateTime.Parse(cuota["fechaEsperada"].ToString()!).ToString("yyyy-MM-dd");
        Assert.Equal(fechaEsperada, fecha);
    }

    // ─── Préstamos activos: límite completamente pagado ──────────────────────

    [Fact]
    public async Task Activos_PrestamoTotalmentePagado_NoAparece()
    {
        _client.SetBearerToken();
        var zona     = await CrearZona();
        var cliente  = await CrearCliente(zona);
        var prestamo = await CrearPrestamo(cliente, 100, 100, 1, 100);

        // Pagarlo completamente
        await RegistrarPago(prestamo, 100);

        var activos = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>("/api/prestamos/activos");

        Assert.NotNull(activos);
        Assert.DoesNotContain(activos, p => p["id"].ToString() == prestamo);
    }

    [Fact]
    public async Task Activos_PrestamoParcialmentePagado_SiAparece()
    {
        _client.SetBearerToken();
        var zona     = await CrearZona();
        var cliente  = await CrearCliente(zona);
        var prestamo = await CrearPrestamo(cliente, 200, 200, 2, 100);

        // Pagar solo la mitad
        await RegistrarPago(prestamo, 100);

        var activos = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>("/api/prestamos/activos");

        Assert.NotNull(activos);
        Assert.Contains(activos, p => p["id"].ToString() == prestamo);
    }

    [Fact]
    public async Task Activos_PrestamoPagoJustoMenosQueTotal_SiAparece()
    {
        // valorTotal = 100, pago = 99.99 → sigue activo
        _client.SetBearerToken();
        var zona     = await CrearZona();
        var cliente  = await CrearCliente(zona);
        var prestamo = await CrearPrestamo(cliente, 100, 100, 1, 100);

        await RegistrarPago(prestamo, 99.99m);

        var activos = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>("/api/prestamos/activos");

        Assert.NotNull(activos);
        Assert.Contains(activos, p => p["id"].ToString() == prestamo);
    }

    // ─── Total pagado: acumulación de múltiples pagos ────────────────────────

    [Fact]
    public async Task Total_MultiplesPagos_SumaCorrectamente()
    {
        _client.SetBearerToken();
        var zona     = await CrearZona();
        var cliente  = await CrearCliente(zona);
        var prestamo = await CrearPrestamo(cliente, 1000, 1200, 12, 100);

        await RegistrarPago(prestamo, 100, "2026-02-01");
        await RegistrarPago(prestamo, 150, "2026-03-01");
        await RegistrarPago(prestamo, 200, "2026-04-01");

        var result = await _client.GetFromJsonAsync<Dictionary<string, object>>($"/api/pagos/prestamo/{prestamo}/total");

        Assert.NotNull(result);
        Assert.Equal("450", result["totalPagado"].ToString());
    }

    [Fact]
    public async Task Total_PrestamoInexistente_Retorna0NoError()
    {
        // El endpoint suma 0 filas para un prestamoId que no tiene pagos → debe retornar 0, no 404
        _client.SetBearerToken();
        var response = await _client.GetAsync("/api/pagos/prestamo/99999/total");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.Equal("0", result!["totalPagado"].ToString());
    }

    // ─── Cantidad de cuotas: valor exacto ────────────────────────────────────

    [Fact]
    public async Task Cuotas_UnaSolaCuota_GeneraUnElemento()
    {
        _client.SetBearerToken();
        var zona     = await CrearZona();
        var cliente  = await CrearCliente(zona);
        var prestamo = await CrearPrestamo(cliente, 1000, 1000, 1, 1000);

        var cuotas = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>($"/api/prestamos/{prestamo}/cuotas");

        Assert.NotNull(cuotas);
        Assert.Single(cuotas);
        Assert.Equal("1", cuotas[0]["numeroCuota"].ToString());
    }

    [Fact]
    public async Task Cuotas_NumeroCuotaEsSecuencialDesde1()
    {
        _client.SetBearerToken();
        var zona     = await CrearZona();
        var cliente  = await CrearCliente(zona);
        var prestamo = await CrearPrestamo(cliente, 500, 500, 5, 100);

        var cuotas = await _client.GetFromJsonAsync<List<Dictionary<string, object>>>($"/api/prestamos/{prestamo}/cuotas");

        Assert.NotNull(cuotas);
        for (int i = 0; i < cuotas.Count; i++)
            Assert.Equal((i + 1).ToString(), cuotas[i]["numeroCuota"].ToString());
    }
}
