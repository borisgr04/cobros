namespace CobrosApi.Features.Reportes;

public static class ReporteRangoFechaHelper
{
    private static readonly TimeZoneInfo ZonaNegocio = ResolveBusinessTimeZone();

    public static (DateTime inicioUtc, DateTime finUtc, DateOnly inicioLocal, DateOnly finLocal)
        FromDateTimeRange(DateTime fechaInicio, DateTime fechaFin)
    {
        var inicioLocal = ToLocalDate(fechaInicio);
        var finLocal = ToLocalDate(fechaFin);

        var inicioUtc = LocalDateToUtcStart(inicioLocal);
        var finUtc = LocalDateToUtcStart(finLocal.AddDays(1));

        return (inicioUtc, finUtc, inicioLocal, finLocal);
    }

    public static (DateTime inicioUtc, DateTime finUtc) FromLocalDate(DateOnly fecha)
    {
        var inicioUtc = LocalDateToUtcStart(fecha);
        var finUtc = LocalDateToUtcStart(fecha.AddDays(1));
        return (inicioUtc, finUtc);
    }

    private static DateOnly ToLocalDate(DateTime fecha)
    {
        // El frontend envía ISO en UTC (toISOString). Si llega sin Kind, se trata como UTC
        // para evitar depender del timezone del servidor.
        var fechaUtc = fecha.Kind switch
        {
            DateTimeKind.Utc => fecha,
            DateTimeKind.Unspecified => DateTime.SpecifyKind(fecha, DateTimeKind.Utc),
            _ => fecha.ToUniversalTime(),
        };

        var fechaLocal = TimeZoneInfo.ConvertTimeFromUtc(fechaUtc, ZonaNegocio);
        return DateOnly.FromDateTime(fechaLocal);
    }

    private static DateTime LocalDateToUtcStart(DateOnly fechaLocal)
    {
        var localStart = fechaLocal.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(localStart, ZonaNegocio);
    }

    private static TimeZoneInfo ResolveBusinessTimeZone()
    {
        try
        {
            // Linux / containers
            return TimeZoneInfo.FindSystemTimeZoneById("America/Bogota");
        }
        catch (TimeZoneNotFoundException)
        {
            // Windows
            return TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time");
        }
    }
}
