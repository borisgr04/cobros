namespace CobrosApi.Features.Shared;

public static class PrestamoEstados
{
    public static class Prestamo
    {
        public const string Activo            = "activo";
        public const string Completado        = "completado";
        public const string CerradoProntoPago = "cerrado_pronto_pago";
        public const string Refinanciado      = "refinanciado";
    }

    public static class Cuota
    {
        public const string Pendiente             = "pendiente";
        public const string Parcial               = "parcial";
        public const string Pagada                = "pagada";
        public const string CerradaProntoPago     = "cerrada_pronto_pago";
        public const string ReemplazadaAmpliacion = "reemplazada_por_ampliacion";
    }
}
