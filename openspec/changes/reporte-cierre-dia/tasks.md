# Tasks: reporte-cierre-dia

## 1. Backend: DTOs

- [x] 1.1 Agregar `CobrosZonaDto`, `CobrosDiaDto`, `FrecuenciaCountDto`, `PrestamosDiaDto`, `GananciaDiaDto`, `CierreDiaDto` en `backend/CobrosApi/DTOs/Dtos.cs`

## 2. Backend: Query handler

- [x] 2.1 Crear `backend/CobrosApi/Features/Reportes/GetCierreDiaQuery.cs`

## 3. Backend: Endpoint

- [x] 3.1 Agregar action `GET cierre-dia` en `backend/CobrosApi/Controllers/ReportesController.cs`

## 4. Frontend: Modelos TypeScript

- [x] 4.1 Crear o actualizar `cobros-iu/src/app/features/reportes/models/reporte.models.ts` con interfaces `GananciaDia`, `FrecuenciaCount`, `PrestamosDia`, `CobrosZona`, `CobrosDia`, `CierreDia`

## 5. Frontend: ReporteService

- [x] 5.1 Agregar método `getCierreDia(fecha: string): Observable<CierreDia>` en el servicio existente `cobros-iu/src/app/features/reportes/services/reporte.service.ts`

## 6. Frontend: Ruta

- [x] 6.1 Agregar ruta lazy `reportes/cierre-dia` → `CierreDiaComponent` con `authGuard` en `cobros-iu/src/app/app.routes.ts`

## 7. Frontend: CierreDiaComponent

- [x] 7.1 Crear `cierre-dia.component.ts`: standalone, signal `fecha` (hoy por defecto), `effect` que llama al servicio, signals para loading/error/datos
- [x] 7.2 Crear `cierre-dia.component.html`: selector de fecha, skeleton animado mientras carga, mensaje de error con botón reintentar, 3 bloques (Ganancia / Préstamos del día / Cobros del día) con valores en formato `$NNNk`
- [x] 7.3 Crear `cierre-dia.component.scss`: estilos mobile-first con variables SCSS del proyecto para colores, skeletons, bloques de resumen
- [x] 7.4 Verificar si `AbreviarMonedaPipe` existe en el proyecto; si no, crearlo en `cobros-iu/src/app/shared/pipes/` e importarlo en el componente

## 8. Frontend: Bottom navigation — panel de reportes

- [x] 8.1 Modificar `bottom-navigation.component.ts`: agregar `mostrarMenuReportes = signal<boolean>(false)`, métodos `toggleMenuReportes()` y `cerrarMenuReportes()`, suscribirse a `NavigationEnd` para cerrar el panel, quitar la entrada de Reportes de `navItems[]`
- [x] 8.2 Modificar `bottom-navigation.component.html`: agregar botón "Reportes" que llama `toggleMenuReportes()`, overlay y panel con opciones "Reportes" (→ `/reportes`) y "Cierre del Día" (→ `/reportes/cierre-dia`), estado activo cuando ruta empieza con `/reportes`

## 9. Verificación

- [x] 9.1 Ejecutar `ng build` en `cobros-iu/` y confirmar sin errores de compilación
- [x] 9.2 Ejecutar `dotnet test` en `backend/CobrosApi.Tests/` y confirmar tests existentes pasan
