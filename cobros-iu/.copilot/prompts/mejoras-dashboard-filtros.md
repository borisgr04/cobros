# Prompt: Mejoras Dashboard y Filtros de Préstamos

## Fecha
18 de octubre de 2025

## Objetivo
Mejorar la navegación y experiencia de usuario en el dashboard, implementando accesos directos a módulos principales y mejorando el sistema de filtros en la vista de préstamos con persistencia de selección de zona.

---

## 📋 Cambios Requeridos

### 1. Dashboard - Actualizar Acciones Rápidas

**Ubicación:** `src/app/features/dashboard/components/dashboard.component.html`

**Estado Actual:**
```html
Acciones Rápidas:
- Nuevo Préstamo (Negro)
- Registrar Pago (Verde)
- Nuevo Cliente (Azul)
- Ver Préstamos (Blanco/Gris)
- Ver Clientes (Amarillo)
- Reportes (Blanco/Gris)
```

**Estado Deseado:**
```html
Acciones Rápidas (4 botones):
- Ver Préstamos (primario)
- Ver Clientes (primario)
- Ver Zonas (primario)
- Reportes (secundario)
```

**Especificaciones:**
- Eliminar botones de acciones transaccionales (Nuevo Préstamo, Registrar Pago, Nuevo Cliente)
- Mantener solo botones de navegación a vistas principales
- Agregar nuevo botón "Ver Zonas" que navegue a `/zonas`
- Diseño: Grid 2x2 responsive
- Colores consistentes con el resto de la aplicación

---

### 2. Dashboard - Tabla Resumen por Zona con Botón Acceso

**Ubicación:** `src/app/features/dashboard/components/dashboard.component.html`

**Estado Actual:**
```html
Tabla con columnas:
- ZONA
- CLIENTES
- PRÉSTAMOS
- CARTERA
- ESTADO
(Click en fila NO hace nada)
```

**Estado Deseado:**
```html
Tabla con columnas:
- ZONA
- CLIENTES
- PRÉSTAMOS
- CARTERA
- ESTADO
- ACCIONES (nueva columna)

Columna ACCIONES debe contener:
- Botón "Ver Préstamos" con icono bi-eye-fill
- Al hacer clic: Navega a /prestamos?zona={zonaId}
```

**Especificaciones:**
- Agregar columna "ACCIONES" al final de la tabla
- Botón pequeño, estilo consistente con otros botones de acción
- Icono: `<i class="bi bi-eye-fill"></i>`
- Texto: "Ver Préstamos"
- Evento: `(click)="verPrestamosZona(zona)"`
- Método debe navegar con query params: `{ zona: zona.id }`

---

### 3. Vista Préstamos - Aplicar Filtro de Zona desde Query Params

**Ubicación:** `src/app/features/prestamos/components/prestamos.component.ts`

**Estado Actual:**
- El componente NO lee parámetros de la URL
- Filtro de zona comienza vacío
- Usuario debe seleccionar manualmente la zona

**Estado Deseado:**
- Al cargar la vista, verificar si existe `queryParams.zona`
- Si existe, aplicar automáticamente el filtro de zona
- El select de zona debe mostrar la zona pre-seleccionada
- Los préstamos deben estar filtrados desde el inicio

**Implementación:**
```typescript
// En ngOnInit
async ngOnInit() {
  await this.cargarDatos();
  
  // Leer parámetro de zona de la URL
  this.route.queryParams.subscribe(params => {
    if (params['zona']) {
      this.filtroZona.set(params['zona']);
    }
  });
}
```

**Dependencias:**
- Inyectar `ActivatedRoute` en el constructor
- Import: `import { ActivatedRoute } from '@angular/router';`
- Signal existente: `filtroZona = signal<string>('');`

---

### 4. Vista Préstamos - Select de Zona Siempre Visible

**Ubicación:** `src/app/features/prestamos/components/prestamos.component.html`

**Estado Actual:**
- Select de zona puede estar oculto o colapsado
- Ubicación inconsistente en diferentes resoluciones

**Estado Deseado:**
- Select de zona SIEMPRE visible en la barra de filtros
- Posición fija en la sección de controles
- Responsive: visible tanto en desktop como mobile
- Label claro: "Zona" o "Filtrar por Zona"

**HTML Sugerido:**
```html
<div class="filtros-principales">
  <div class="form-group">
    <label for="filtro-zona">Zona</label>
    <select 
      id="filtro-zona"
      class="form-control"
      [value]="filtroZona()"
      (change)="filtroZona.set($any($event.target).value)">
      <option value="">Todas las zonas</option>
      @for (zona of zonasDisponibles(); track zona.id) {
        <option [value]="zona.id">{{ zona.nombre }}</option>
      }
    </select>
  </div>
  
  <div class="form-group">
    <label for="filtro-estado">Estado</label>
    <select 
      id="filtro-estado"
      class="form-control"
      [value]="filtroEstado()"
      (change)="filtroEstado.set($any($event.target).value)">
      <option value="">Todos</option>
      <option value="activo">Activo</option>
      <option value="pagado">Pagado</option>
      <option value="vencido">Vencido</option>
      <option value="cancelado">Cancelado</option>
    </select>
  </div>
</div>
```

---

### 5. Vista Préstamos - Filtro de Estado Predeterminado en "Activo"

**Ubicación:** `src/app/features/prestamos/components/prestamos.component.ts`

**Estado Actual:**
```typescript
filtroEstado = signal<string>(''); // Muestra TODOS los préstamos
```

**Estado Deseado:**
```typescript
filtroEstado = signal<string>('activo'); // Muestra SOLO activos por defecto
```

**Justificación:**
- Los préstamos activos son los más relevantes para operaciones diarias
- Reduce ruido visual de préstamos pagados/cancelados
- Usuario puede cambiar a "Todos" si necesita ver histórico

**Cambios Adicionales:**
- El select debe mostrar "Activo" como seleccionado al cargar
- La lógica de filtrado debe respetar este valor inicial
- Computed `prestamosFiltrados` ya funciona correctamente con este cambio

---

## 🎯 Resultados Esperados

### Flujo de Usuario Mejorado:

1. **Desde Dashboard → Zonas:**
   - Click en "Ver Zonas" (Acciones Rápidas)
   - Navega a `/zonas`
   - Ve todas las zonas con sus estadísticas

2. **Desde Dashboard → Préstamos por Zona:**
   - En tabla "Resumen por Zona"
   - Click en botón "Ver Préstamos" de zona "Centro"
   - Navega a `/prestamos?zona=zona-1`
   - Vista se carga automáticamente con:
     * Filtro Zona: "Centro" (pre-seleccionado)
     * Filtro Estado: "Activo" (predeterminado)
     * Lista de préstamos: Solo activos de zona Centro

3. **Desde Zonas → Préstamos:**
   - En `/zonas`, click en tarjeta de zona
   - Navega a `/prestamos?zona=zona-2`
   - Vista se carga con filtros aplicados

4. **Experiencia General:**
   - Filtros siempre visibles y accesibles
   - Menos clics para llegar a información relevante
   - Contexto preservado al navegar entre vistas

---

## 🔧 Archivos a Modificar

### 1. Dashboard Component
- `src/app/features/dashboard/components/dashboard.component.html`
  - Actualizar sección "Acciones Rápidas"
  - Agregar columna "ACCIONES" a tabla de zonas
  
- `src/app/features/dashboard/components/dashboard.component.ts`
  - Agregar método `verPrestamosZona(zona: any)`
  - Inyectar Router si no existe

- `src/app/features/dashboard/components/dashboard.component.scss`
  - Ajustar grid de acciones rápidas (2x2)
  - Estilos para botón de acciones en tabla

### 2. Prestamos Component
- `src/app/features/prestamos/components/prestamos.component.ts`
  - Cambiar valor inicial: `filtroEstado = signal<string>('activo')`
  - Inyectar `ActivatedRoute`
  - Leer `queryParams` en `ngOnInit`
  - Aplicar filtro de zona desde URL

- `src/app/features/prestamos/components/prestamos.component.html`
  - Asegurar que select de zona esté siempre visible
  - Verificar que select de estado tenga valor "activo" por defecto
  - Ajustar layout responsive de filtros

### 3. Dashboard Service (si existe)
- Verificar que `verPrestamosZona()` use el Router correctamente
- Query params: `{ zona: zonaId }`

---

## ✅ Validación

### Checklist de Pruebas:

#### Dashboard:
- [ ] Acciones Rápidas muestra 4 botones (Ver Préstamos, Ver Clientes, Ver Zonas, Reportes)
- [ ] Botón "Ver Zonas" navega correctamente a `/zonas`
- [ ] Tabla de zonas tiene columna "ACCIONES"
- [ ] Botón "Ver Préstamos" en cada fila funciona
- [ ] Navega con query param correcto: `/prestamos?zona={id}`

#### Vista Préstamos:
- [ ] Al cargar sin parámetros: muestra todos los préstamos ACTIVOS
- [ ] Al cargar con `?zona=zona-1`: aplica filtro de zona automáticamente
- [ ] Select de zona está siempre visible (desktop y mobile)
- [ ] Select de zona muestra la zona pre-seleccionada correctamente
- [ ] Select de estado muestra "Activo" por defecto
- [ ] Filtro de estado = "Activo" está aplicado desde el inicio
- [ ] Usuario puede cambiar filtros manualmente
- [ ] Al cambiar filtros, la lista se actualiza correctamente

#### Navegación Integral:
- [ ] Dashboard → Ver Zonas → Click en tarjeta → Préstamos filtrados
- [ ] Dashboard → Tabla zonas → Ver Préstamos → Préstamos filtrados
- [ ] Zonas → Click tarjeta → Préstamos filtrados por zona
- [ ] Zonas → Ver Clientes → Clientes filtrados por zona

---

## 📝 Notas de Implementación

### Prioridad de Cambios:
1. **Alta:** Filtro estado predeterminado "Activo" (cambio de 1 línea)
2. **Alta:** Aplicar filtro de zona desde query params (lógica de navegación)
3. **Media:** Select de zona siempre visible (UX)
4. **Media:** Dashboard - Acciones rápidas (cambio visual)
5. **Baja:** Dashboard - Botón en tabla de zonas (nice to have)

### Consideraciones:
- Mantener compatibilidad con navegación directa a `/prestamos`
- No romper filtros existentes
- Preservar estado de filtros al navegar hacia atrás
- Considerar agregar indicador visual cuando hay filtros aplicados
- Posible mejora futura: Breadcrumbs que muestren "Zona: Centro > Préstamos Activos"

### Posibles Conflictos:
- Si `ActivatedRoute` no está inyectado en PrestamosComponent
- Si computed `prestamosFiltrados` no maneja correctamente el filtro de zona vacío
- Si el signal `filtroZona` no es reactivo con los query params

---

## 🎨 Referencias de Diseño

### Colores Consistentes:
- Botones primarios de navegación: `var(--primary-color)` - Gris oscuro #2D2D2D
- Botones secundarios: `var(--bg-secondary)` con borde
- Botón "Reportes": Estilo secundario (menos prominente)

### Iconos Bootstrap:
- Ver Préstamos: `bi-cash-coin` o `bi-eye-fill`
- Ver Clientes: `bi-people-fill`
- Ver Zonas: `bi-geo-alt-fill`
- Reportes: `bi-file-earmark-bar-graph`

---

## 📚 Documentación Relacionada

- Prompt anterior: `gestion-zonas.md` - Implementación del módulo de zonas
- Prompt anterior: `eliminar-prestamo.md` - Modal de eliminación con validación
- README.md - Arquitectura general de la aplicación
- funcionalidades-pendientes.md - Lista de features pendientes

---

## ✨ Mejoras Futuras (Fuera de Scope)

- Agregar breadcrumbs en vista de préstamos: "Dashboard > Zona Centro > Préstamos Activos"
- Guardar preferencias de filtros en localStorage
- Agregar contador de resultados: "Mostrando 5 de 12 préstamos"
- Exportar préstamos filtrados a Excel/PDF
- Agregar filtro rápido por cliente desde la tabla
- Implementar búsqueda de texto en préstamos (por cliente, monto, ID)

---

**Autor:** Copilot  
**Revisión:** Pendiente  
**Estado:** Documentado - Listo para implementación  
**Estimación:** 2-3 horas de desarrollo + 1 hora de testing
