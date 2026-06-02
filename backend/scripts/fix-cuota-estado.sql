-- Script: fix-cuota-estado.sql
-- Propósito: Corregir registros de Cuotas existentes cuyo Estado quedó como
-- 'pendiente' aunque ya tienen SaldoPagado > 0, debido al bug en
-- PagosController donde cuota.Estado no se actualizaba al distribuir abonos.
--
-- INSTRUCCIONES DE EJECUCIÓN EN PRODUCCIÓN:
--   1. Ejecutar dentro de una transacción.
--   2. Verificar el conteo de filas afectadas con SELECT antes del COMMIT.
--   3. Usar ROLLBACK si el conteo es inesperado o el ambiente no es el correcto.
--
-- Previsualización (ejecutar primero, no hace cambios):
-- SELECT "Id", "Estado", "SaldoPagado", "ValorCuota",
--        CASE
--            WHEN "SaldoPagado" >= "ValorCuota" THEN 'pagada'
--            WHEN "SaldoPagado" > 0             THEN 'parcial'
--            ELSE 'pendiente'
--        END AS "EstadoCorregido"
-- FROM "Cuotas"
-- WHERE "Estado" = 'pendiente' AND "SaldoPagado" > 0;

BEGIN;

UPDATE "Cuotas"
SET "Estado" = CASE
    WHEN "SaldoPagado" >= "ValorCuota" THEN 'pagada'
    WHEN "SaldoPagado" > 0             THEN 'parcial'
    ELSE 'pendiente'
END
WHERE "Estado" = 'pendiente' AND "SaldoPagado" > 0;

-- Revisar cuántas filas fueron afectadas antes de confirmar:
-- Si el número es inesperadamente alto, ejecutar ROLLBACK en lugar de COMMIT.
COMMIT;
