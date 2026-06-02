using CobrosApi.Features.Shared;

namespace CobrosApi.Features.Pagos;

public static class PagosRules
{
    public static bool PrestamoAceptaPagos(string estado) =>
        estado != PrestamoEstados.Prestamo.CerradoProntoPago &&
        estado != PrestamoEstados.Prestamo.Completado &&
        estado != PrestamoEstados.Prestamo.Refinanciado;

    public static bool EsUltimoPagoActivo(int pagoId, int? ultimoActivoId) =>
        ultimoActivoId == pagoId;
}
