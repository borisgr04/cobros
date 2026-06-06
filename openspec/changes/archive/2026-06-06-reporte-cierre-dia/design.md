## Context

El sistema ya tiene un `ReportesController` con un endpoint `GET /api/reportes` que agrega datos de préstamos y pagos. El patrón `GetCierreDiaQuery` sigue la convención de los Features existentes (e.g., `Features/Pagos/`, `Features/Liquidacion/`). El frontend tiene un `ReporteService` y el `BottomNavigationComponent` ya implementa el patrón de panel deslizante (overlay + panel) para el menú de usuario — se reutiliza ese mismo mecanismo para el menú de reportes.

## Goals / Non-Goals

**Goals:**
- Calcular los 3 bloques del cierre del día (Ganancia, Préstamos del día, Cobros del día) en una sola query eficiente.
- Exponer el resultado como un endpoint REST dedicado, separado del reporte general.
- Mostrar el cierre en una pantalla mobile-first optimizada para celular.
- Transformar el ítem "Reportes" en la bottom nav en un trigger de panel con 2 opciones.

**Non-Goals:**
- No se agrega bloque de Mora (descartado en exploración).
- No se agrega campo `MetodoPago` al modelo `Pago`.
- No se modifica el reporte general existente.
- No hay paginación ni exportación del cierre diario.

## Decisions

### 1. Lógica en un query handler dedicado, no en el controlador

**Decisión:** `GetCierreDiaQuery(DateOnly Fecha)` en `Features/Reportes/GetCierreDia.cs`, retorna `CierreDiaDto`.

**Razón:** El controlador ya está creciendo. Seguir el patrón Feature mantiene consistencia con `EjecutarProntoPago`, `EjecutarLiquidacion`, etc.

### 2. `CapitalEntregadoTotal` = dinero fresco únicamente

**Decisión:**
- Préstamos nuevos (`PrestamoOrigenId IS NULL`): `CapitalEntregadoTotal += ValorPrestado`
- Préstamos recogidos (`PrestamoOrigenId IS NOT NULL`): `CapitalEntregadoTotal += DineroAdicional` (de `NovedadesPrestamo` donde `Tipo = "recoger_prestamo"`)

**Razón:** El saldo trasladado es deuda que ya existía. El capital entregado debe reflejar solo el dinero que salió de la caja hoy.

### 3. `PagaronCount` por zona = préstamos distintos con algún pago hoy

**Decisión:** `COUNT(DISTINCT Pago.PrestamoId)` filtrado por `FechaPago = fecha AND !Anulado`, agrupado por zona.

**Razón:** El usuario quiere saber cuántos clientes pagaron, no cuántas cuotas quedaron saldadas.

### 4. `PrestamosActivosCount` = total activos en el sistema

**Decisión:** `COUNT(Prestamo) WHERE Estado = "activo"` sin filtro de fecha.

**Razón:** Refleja la cartera total vigente al cierre del día consultado.

### 5. Panel de reportes en bottom-nav reutiliza el mecanismo del menú de usuario

**Decisión:** Añadir `mostrarMenuReportes = signal<boolean>(false)` y extraer el ítem "Reportes" del array `navItems`, reemplazándolo por un botón trigger idéntico al de usuario.

**Alternativa descartada:** Hacer que `/reportes` muestre las opciones como tabs en la propia pantalla. Eso requeriría refactor del componente existente y un salto de navegación extra desde mobile.

### 6. Pipe de abreviación de moneda

**Decisión:** Reutilizar el pipe existente de moneda del proyecto si abrevia a K, o crear `AbreviarMonedaPipe` que transforma valores ≥ 1000 a `$NNNk` (sin decimales para miles enteros).

**Razón:** El espacio en mobile es limitado y los montos del negocio están en el rango de cientos de miles.

## Risks / Trade-offs

- [Risk] La query del cierre puede ser costosa si hay muchos registros — múltiples agregaciones en una sola request. → Mitigation: Todo se hace con `AsNoTracking()` y las agregaciones son simples SUM/COUNT sobre fechas indexadas.
- [Risk] `DineroAdicional` en `NovedadPrestamo` puede ser null si el préstamo recogido no tiene novedad registrada (dato inconsistente). → Mitigation: Usar `?? 0` en el cálculo; loguear si ocurre.
- [Risk] El panel de reportes en bottom-nav se cierra si el usuario navega, igual que el de usuario — ese comportamiento ya está implementado con `NavigationEnd`. → No es un riesgo real, es un feature ya resuelto.
