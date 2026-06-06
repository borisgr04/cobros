## Why

El usuario necesita un resumen ejecutivo del día al finalizar su jornada: cuánto cobró, cuántos préstamos entregó, cuánto ganó y cuántos clientes pagaron. Hoy no existe ningún reporte consolidado de ese tipo — los datos están dispersos en tres tabs separados que requieren filtros manuales. Se agrega "Cierre del Día" como una nueva opción de reporte accesible desde la navegación móvil con un solo toque.

## What Changes

- **Nueva pantalla** `CierreDiaComponent` (standalone Angular) accesible en `/reportes/cierre-dia`.
- **Nuevo endpoint** `GET /api/reportes/cierre-dia?fecha=YYYY-MM-DD` que devuelve `CierreDiaDto`.
- **Nueva query** `GetCierreDiaQuery` en el backend con toda la lógica de agregación.
- **Modificación** del ítem "Reportes" en la bottom navigation móvil: al tocarlo ya no navega directamente, sino que abre un panel de opciones igual al del menú de usuario, mostrando "Reportes" y "Cierre del Día".

## Capabilities

### New Capabilities

- `reporte-cierre-dia`: Pantalla y endpoint de cierre diario con 3 bloques: Ganancia, Préstamos del día y Cobros del día.

### Modified Capabilities

- `bottom-navigation`: El ítem "Reportes" cambia de enlace directo a trigger de panel de opciones (comportamiento análogo al menú de usuario).

## Impact

- **Backend**: Nuevo query handler `GetCierreDiaQuery`, nuevo DTO `CierreDiaDto`, nuevo action en `ReportesController`.
- **Frontend**: Nuevo componente `CierreDiaComponent` y su ruta; `BottomNavigationComponent` modificado para mostrar panel de reportes; `ReporteService` con nuevo método `getCierreDia(fecha)`.
- **Rutas**: `app.routes.ts` agrega `/reportes/cierre-dia` con lazy load.
- **No hay migraciones de BD** — todo se calcula desde tablas existentes.
