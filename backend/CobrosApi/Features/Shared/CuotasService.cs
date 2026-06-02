using CobrosApi.Models;

namespace CobrosApi.Features.Shared;

public static class CuotasService
{
    /// <summary>
    /// Calcula la fecha esperada de una cuota según la frecuencia de pago.
    /// El DateTime retornado siempre tiene Kind = Utc.
    /// </summary>
    public static DateTime CalcularFechaCuota(DateTime fechaInicio, string frecuencia, int numeroCuota)
    {
        // PostgreSQL timestamp with time zone requiere Kind=Utc
        var base_ = fechaInicio.Kind == DateTimeKind.Utc
            ? fechaInicio
            : DateTime.SpecifyKind(fechaInicio, DateTimeKind.Utc);

        return frecuencia switch
        {
            "diario"    => base_.AddDays(numeroCuota),
            "semanal"   => base_.AddDays(numeroCuota * 7),
            "quincenal" => base_.AddDays(numeroCuota * 15),
            "mensual"   => base_.AddMonths(numeroCuota),
            _           => base_.AddDays(numeroCuota * 7)
        };
    }

    /// <summary>
    /// Genera N cuotas para un préstamo. La última cuota absorbe el redondeo
    /// (valorTotal - (N-1) * valorCuota) para evitar diferencias de centavos.
    /// </summary>
    public static IEnumerable<Cuota> GenerarCuotas(
        int      prestamoId,
        int      cantidadCuotas,
        decimal  valorTotal,
        decimal  valorCuota,
        DateTime fechaInicio,
        string   frecuencia)
    {
        return Enumerable.Range(1, cantidadCuotas).Select(i => new Cuota
        {
            PrestamoId    = prestamoId,
            NumeroCuota   = i,
            FechaEsperada = CalcularFechaCuota(fechaInicio, frecuencia, i),
            ValorCuota    = (i == cantidadCuotas)
                                ? valorTotal - (cantidadCuotas - 1) * valorCuota
                                : valorCuota,
            SaldoPagado   = 0
        });
    }
}
