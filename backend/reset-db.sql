-- ============================================================
-- RESET COMPLETO DE BASE DE DATOS COBROS
-- Limpia todas las tablas y reinicia secuencias de identidad.
-- NO toca "__EFMigrationsHistory" para preservar el estado de migraciones.
-- ============================================================

TRUNCATE TABLE
    "AplicacionesCuota",
    "WebAuthnCredentials",
    "RefreshTokens",
    "NovedadesPrestamo",
    "Pagos",
    "Cuotas",
    "Prestamos",
    "Clientes",
    "Zonas"
RESTART IDENTITY CASCADE;
