# Prompt: Rediseño de Vistas de Préstamos - Lista Simplificada y Detalle Completo

## Contexto del Proyecto
Sistema de gestión de cobros y préstamos desarrollado en **Angular 19.2.17** con arquitectura standalone, signals, y diseño elegante basado en tonos negros/grises con acentos de color vibrantes.

---

## Objetivo
Reorganizar las vistas del módulo de préstamos en dos componentes distintos:

1. **Vista de Lista (Simplificada)**: Tarjetas compactas con información esencial
2. **Vista de Detalle (Completa)**: Diseño actual extendido con toda la información del préstamo

---

## 1. VISTA DE LISTA - DISEÑO SIMPLIFICADO

### 1.1 Información a Mostrar por Tarjeta

**Header de la Tarjeta:**
- Avatar circular con inicial del cliente
- Nombre completo del cliente
- ID del préstamo (ej: PRE-001)
- Fecha del préstamo

**Información Financiera Resumida:**
- **Valor Total**: Monto total a pagar (valorPrestado + interés)
- **Frecuencia**: Badge con color distintivo (Diario/Semanal/Quincenal/Mensual)
- **Cuotas**: Progreso actual (ej: 8/26 cuotas)

**Indicador Visual de Progreso:**
- Barra de progreso horizontal con porcentaje de pago
- Color dinámico según progreso:
  - 0-25%: Rojo (#FF5252)
  - 26-50%: Naranja (#FFC107)
  - 51-99%: Azul (#3D5AFE)
  - 100%: Verde (#00E676)

**Badge de Estado:**
- Activo (verde)
- Completado (gris)
- Vencido (rojo)
- En Mora (amarillo)

**Acciones:**
- Botón "Ver Detalles" (icono ojo)
- Botón "Registrar Pago" (icono cash) - solo si no está completado

### 1.2 Estructura HTML de Tarjeta Simplificada

```html
<div class="prestamo-card-simple">
  <!-- Header -->
  <div class="card-header">
    <div class="avatar">{{ cliente.inicial }}</div>
    <div class="info-principal">
      <h3 class="cliente-nombre">{{ cliente.nombre }}</h3>
      <span class="prestamo-id">{{ prestamo.id }}</span>
      <span class="fecha">{{ prestamo.fechaPrestamo | date }}</span>
    </div>
    <div class="badge-estado" [ngClass]="estado">{{ estadoTexto }}</div>
  </div>

  <!-- Información Resumida -->
  <div class="info-resumida">
    <div class="info-item">
      <i class="bi bi-currency-dollar"></i>
      <div>
        <span class="label">Total</span>
        <strong class="valor">{{ prestamo.valorTotal | currency }}</strong>
      </div>
    </div>

    <div class="info-item">
      <i class="bi bi-arrow-repeat"></i>
      <div>
        <span class="label">Frecuencia</span>
        <span class="badge-frecuencia" [ngClass]="frecuencia">
          {{ frecuenciaTexto }}
        </span>
      </div>
    </div>

    <div class="info-item">
      <i class="bi bi-list-ol"></i>
      <div>
        <span class="label">Cuotas</span>
        <strong>{{ cuotasPagadas }}/{{ totalCuotas }}</strong>
      </div>
    </div>
  </div>

  <!-- Barra de Progreso -->
  <div class="progreso-container">
    <div class="progreso-header">
      <span class="label">Progreso de pago</span>
      <span class="porcentaje">{{ porcentajePagado }}%</span>
    </div>
    <div class="barra-progreso">
      <div class="fill" 
           [style.width.%]="porcentajePagado"
           [ngClass]="getProgressClass(porcentajePagado)">
      </div>
    </div>
    <div class="progreso-footer">
      <span class="pagado">Pagado: {{ totalPagado | currency }}</span>
      <span class="pendiente">Pendiente: {{ saldoPendiente | currency }}</span>
    </div>
  </div>

  <!-- Acciones -->
  <div class="acciones">
    <button class="btn-detalle" (click)="verDetalle(prestamo.id)">
      <i class="bi bi-eye"></i> Ver Detalles
    </button>
    @if (estadisticas?.estado !== 'completado') {
      <button class="btn-pago" (click)="registrarPago(prestamo.id)">
        <i class="bi bi-cash-stack"></i> Pagar
      </button>
    }
  </div>
</div>
```

### 1.3 Estilos SCSS - Tarjeta Simplificada

```scss
.prestamo-card-simple {
  background: var(--color-dark-secondary);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(13, 13, 13, 0.2);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(13, 13, 13, 0.3);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2D2D2D, #4A4A4A);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 700;
      color: white;
    }

    .info-principal {
      flex: 1;

      .cliente-nombre {
        font-size: 18px;
        font-weight: 600;
        color: white;
        margin: 0 0 4px 0;
      }

      .prestamo-id,
      .fecha {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        margin-right: 12px;
      }
    }

    .badge-estado {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;

      &.activo { background: #00E676; color: #0D0D0D; }
      &.completado { background: #E0E0E0; color: #0D0D0D; }
      &.vencido { background: #FF5252; color: white; }
      &.mora { background: #FFC107; color: #0D0D0D; }
    }
  }

  .info-resumida {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 20px;

    .info-item {
      display: flex;
      align-items: center;
      gap: 10px;

      i {
        font-size: 20px;
        color: var(--color-success);
      }

      .label {
        display: block;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        margin-bottom: 2px;
      }

      .valor,
      strong {
        font-size: 16px;
        font-weight: 600;
        color: white;
      }

      .badge-frecuencia {
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;

        &.diario { background: #3D5AFE; color: white; }
        &.semanal { background: #00E676; color: #0D0D0D; }
        &.quincenal { background: #FFC107; color: #0D0D0D; }
        &.mensual { background: #9C27B0; color: white; }
      }
    }
  }

  .progreso-container {
    margin-bottom: 16px;

    .progreso-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
      }

      .porcentaje {
        font-size: 14px;
        font-weight: 700;
        color: white;
      }
    }

    .barra-progreso {
      height: 10px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 8px;

      .fill {
        height: 100%;
        border-radius: 10px;
        transition: width 0.5s ease, background 0.3s ease;

        &.low { background: linear-gradient(90deg, #FF5252, #FF8A80); }
        &.medium { background: linear-gradient(90deg, #FFC107, #FFD54F); }
        &.high { background: linear-gradient(90deg, #3D5AFE, #5C6BC0); }
        &.complete { background: linear-gradient(90deg, #00E676, #69F0AE); }
      }
    }

    .progreso-footer {
      display: flex;
      justify-content: space-between;
      font-size: 11px;

      .pagado {
        color: var(--color-success);
        font-weight: 600;
      }

      .pendiente {
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }

  .acciones {
    display: flex;
    gap: 10px;

    button {
      flex: 1;
      padding: 10px;
      border-radius: 8px;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;

      i {
        font-size: 14px;
      }
    }

    .btn-detalle {
      background: rgba(255, 255, 255, 0.05);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.1);

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
      }
    }

    .btn-pago {
      background: var(--color-success);
      color: #0D0D0D;

      &:hover {
        background: #00C853;
        transform: translateY(-2px);
      }
    }
  }
}

// Grid responsivo
.prestamos-grid-simple {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  padding: 20px 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}
```

---

## 2. VISTA DE DETALLE - DISEÑO COMPLETO (BASADO EN IMAGEN)

### 2.1 Información Completa a Mostrar

La vista de detalle mantendrá el diseño actual de las tarjetas pero en una vista individual con las siguientes secciones:

**Sección 1: Información del Cliente y Préstamo**
- Avatar grande del cliente
- Nombre completo y zona
- ID del préstamo
- Fecha del préstamo
- Badge de estado del préstamo

**Sección 2: Información Financiera Detallada**
- Prestado (monto original)
- Total (prestado + interés)
- Interés proyectado
- Valor por cuota
- Cantidad de cuotas
- Frecuencia de pago

**Sección 3: Progreso y Pagos**
- Barra de progreso con porcentaje
- Total pagado con monto
- Saldo pendiente
- Cuotas pagadas vs totales
- Próxima fecha de cuota
- Días restantes para próxima cuota

**Sección 4: Historial de Pagos (Nueva)**
- Tabla con todos los pagos realizados
- Columnas: Fecha, Monto, Método, Comprobante
- Filtros y búsqueda

**Sección 5: Proyección de Cuotas (Nueva)**
- Calendario/lista de cuotas proyectadas
- Estado de cada cuota: Pagada / Pendiente / Vencida
- Monto de cada cuota
- Fecha programada vs fecha real de pago

**Sección 6: Acciones**
- Registrar nuevo pago
- Editar préstamo (solo si no tiene pagos)
- Eliminar préstamo (solo si no tiene pagos)
- Imprimir comprobante
- Exportar historial

### 2.2 Estructura de Componente de Detalle

```typescript
// prestamo-detalle.component.ts
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import type { PrestamoConCliente } from '../services';
import { PrestamoService } from '../services';
import type { IPago } from '../../core/models';
import type { CuotaProyectada } from '../utils/prestamo-calculations';

@Component({
  selector: 'app-prestamo-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prestamo-detalle.component.html',
  styleUrl: './prestamo-detalle.component.scss'
})
export class PrestamoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private prestamoService = inject(PrestamoService);

  // Signals
  prestamo = signal<PrestamoConCliente | null>(null);
  pagos = signal<IPago[]>([]);
  proyeccionCuotas = signal<CuotaProyectada[]>([]);
  cargando = signal<boolean>(false);
  tabActiva = signal<'info' | 'pagos' | 'proyeccion'>('info');

  // Computed
  puedeEditar = computed(() => {
    const pagosRealizados = this.pagos().length;
    return pagosRealizados === 0;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDetalle(id);
    }
  }

  cargarDetalle(id: string): void {
    this.cargando.set(true);
    
    this.prestamoService.getPrestamoConDatos(id).subscribe({
      next: (prestamo) => {
        this.prestamo.set(prestamo);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error al cargar préstamo:', error);
        this.cargando.set(false);
        this.router.navigate(['/prestamos']);
      }
    });

    this.prestamoService.getPagosByPrestamo(id).subscribe({
      next: (pagos) => this.pagos.set(pagos),
      error: (error) => console.error('Error al cargar pagos:', error)
    });

    // Cargar proyección si el servicio existe
    const prestamo = this.prestamo();
    if (prestamo) {
      const proyeccion = this.prestamoService.generarProyeccion(prestamo, this.pagos());
      this.proyeccionCuotas.set(proyeccion);
    }
  }

  cambiarTab(tab: 'info' | 'pagos' | 'proyeccion'): void {
    this.tabActiva.set(tab);
  }

  volver(): void {
    this.router.navigate(['/prestamos']);
  }

  registrarPago(): void {
    // Abrir modal de registro de pago
  }

  editarPrestamo(): void {
    if (!this.puedeEditar()) {
      alert('No se puede editar un préstamo con pagos registrados');
      return;
    }
    // Abrir modal de edición
  }

  eliminarPrestamo(): void {
    if (!this.puedeEditar()) {
      alert('No se puede eliminar un préstamo con pagos registrados');
      return;
    }
    // Confirmar y eliminar
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CO').format(new Date(date));
  }
}
```

### 2.3 Template de Vista de Detalle

```html
<!-- prestamo-detalle.component.html -->
<div class="detalle-container">
  @if (cargando()) {
    <div class="loading">
      <div class="spinner"></div>
      <p>Cargando detalles...</p>
    </div>
  } @else if (prestamo(); as p) {
    <!-- Header con navegación -->
    <div class="detalle-header">
      <button class="btn-volver" (click)="volver()">
        <i class="bi bi-arrow-left"></i> Volver a préstamos
      </button>
      <h1>Detalle del Préstamo {{ p.id }}</h1>
    </div>

    <!-- Tabs de navegación -->
    <div class="tabs">
      <button 
        class="tab" 
        [class.active]="tabActiva() === 'info'"
        (click)="cambiarTab('info')">
        <i class="bi bi-info-circle"></i> Información
      </button>
      <button 
        class="tab" 
        [class.active]="tabActiva() === 'pagos'"
        (click)="cambiarTab('pagos')">
        <i class="bi bi-cash-stack"></i> Pagos ({{ pagos().length }})
      </button>
      <button 
        class="tab" 
        [class.active]="tabActiva() === 'proyeccion'"
        (click)="cambiarTab('proyeccion')">
        <i class="bi bi-calendar-week"></i> Proyección
      </button>
    </div>

    <!-- Contenido por tab -->
    <div class="tab-content">
      <!-- TAB: Información -->
      @if (tabActiva() === 'info') {
        <div class="info-completa">
          <!-- Usar el diseño actual de la tarjeta extendida -->
          <div class="prestamo-card-detalle">
            <!-- Todo el contenido actual de la tarjeta -->
            <!-- Header, info financiera, progreso, cuotas, estado, etc. -->
          </div>

          <!-- Acciones principales -->
          <div class="acciones-principales">
            <button class="btn-accion btn-pago" (click)="registrarPago()">
              <i class="bi bi-cash-stack"></i>
              Registrar Pago
            </button>
            @if (puedeEditar()) {
              <button class="btn-accion btn-editar" (click)="editarPrestamo()">
                <i class="bi bi-pencil"></i>
                Editar Préstamo
              </button>
              <button class="btn-accion btn-eliminar" (click)="eliminarPrestamo()">
                <i class="bi bi-trash"></i>
                Eliminar
              </button>
            }
            <button class="btn-accion btn-imprimir">
              <i class="bi bi-printer"></i>
              Imprimir
            </button>
          </div>
        </div>
      }

      <!-- TAB: Pagos -->
      @if (tabActiva() === 'pagos') {
        <div class="historial-pagos">
          <h2>Historial de Pagos</h2>
          @if (pagos().length === 0) {
            <div class="empty-state">
              <i class="bi bi-inbox"></i>
              <p>No hay pagos registrados aún</p>
            </div>
          } @else {
            <table class="tabla-pagos">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Cuota #</th>
                </tr>
              </thead>
              <tbody>
                @for (pago of pagos(); track pago.id) {
                  <tr>
                    <td>{{ pago.id }}</td>
                    <td>{{ formatDate(pago.fechaPago) }}</td>
                    <td class="monto">{{ formatCurrency(pago.valor) }}</td>
                    <td>Cuota #{{ $index + 1 }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }

      <!-- TAB: Proyección -->
      @if (tabActiva() === 'proyeccion') {
        <div class="proyeccion-cuotas">
          <h2>Proyección de Cuotas</h2>
          <div class="cuotas-timeline">
            @for (cuota of proyeccionCuotas(); track cuota.numeroCuota) {
              <div class="cuota-item" [class.pagada]="cuota.pagada">
                <div class="cuota-numero">{{ cuota.numeroCuota }}</div>
                <div class="cuota-info">
                  <span class="fecha">{{ formatDate(cuota.fechaProgramada) }}</span>
                  <span class="monto">{{ formatCurrency(cuota.montoCuota) }}</span>
                </div>
                <div class="cuota-estado">
                  @if (cuota.pagada) {
                    <i class="bi bi-check-circle-fill"></i> Pagada
                  } @else {
                    <i class="bi bi-clock"></i> Pendiente
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  }
</div>
```

---

## 3. RUTAS Y NAVEGACIÓN

### 3.1 Configuración de Rutas

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/clientes',
    pathMatch: 'full'
  },
  {
    path: 'clientes',
    loadComponent: () => 
      import('./features/clientes/components/clientes.component').then(m => m.ClientesComponent)
  },
  {
    path: 'prestamos',
    children: [
      {
        path: '',
        loadComponent: () => 
          import('./features/prestamos/components/prestamos.component').then(m => m.PrestamosComponent)
      },
      {
        path: ':id',
        loadComponent: () => 
          import('./features/prestamos/components/prestamo-detalle.component').then(m => m.PrestamoDetalleComponent)
      }
    ]
  }
];
```

### 3.2 Navegación desde Lista

```typescript
// prestamos.component.ts
verDetalle(prestamoId: string): void {
  this.router.navigate(['/prestamos', prestamoId]);
}
```

---

## 4. PALETA DE COLORES (Diseño Elegante Negro)

```scss
:root {
  // Colores base
  --color-dark-primary: #0D0D0D;
  --color-dark-secondary: #1A1A1A;
  --color-dark-tertiary: #2D2D2D;
  --color-dark-quaternary: #4A4A4A;

  // Colores de acento
  --color-success: #00E676;  // Verde neón
  --color-danger: #FF5252;   // Rojo vibrante
  --color-warning: #FFC107;  // Amarillo dorado
  --color-info: #3D5AFE;     // Azul eléctrico

  // Colores de frecuencia
  --frecuencia-diario: #3D5AFE;
  --frecuencia-semanal: #00E676;
  --frecuencia-quincenal: #FFC107;
  --frecuencia-mensual: #9C27B0;

  // Sombras
  --shadow-sm: 0 2px 8px rgba(13, 13, 13, 0.15);
  --shadow-md: 0 4px 12px rgba(13, 13, 13, 0.2);
  --shadow-lg: 0 8px 24px rgba(13, 13, 13, 0.3);
  --shadow-xl: 0 12px 40px rgba(13, 13, 13, 0.4);
}
```

---

## 5. COMPONENTES A CREAR/MODIFICAR

### Archivos Nuevos:
1. `prestamo-detalle.component.ts` - Vista de detalle completa
2. `prestamo-detalle.component.html` - Template de detalle
3. `prestamo-detalle.component.scss` - Estilos de detalle

### Archivos a Modificar:
1. `prestamos.component.html` - Simplificar tarjetas de lista
2. `prestamos.component.scss` - Estilos simplificados
3. `prestamos.component.ts` - Añadir método `verDetalle()`
4. `app.routes.ts` - Añadir ruta de detalle

---

## 6. CRITERIOS DE ACEPTACIÓN

### Vista de Lista Simplificada:
- ✅ Tarjetas compactas (max 250px de alto)
- ✅ Grid responsivo (1-3 columnas)
- ✅ Solo información esencial visible
- ✅ Barra de progreso clara y visual
- ✅ Acciones mínimas: Ver Detalle y Registrar Pago
- ✅ Hover effect con elevación suave
- ✅ Carga rápida (< 500ms)

### Vista de Detalle Completa:
- ✅ Toda la información financiera del préstamo
- ✅ Tabs para organizar: Info / Pagos / Proyección
- ✅ Historial completo de pagos en tabla
- ✅ Proyección de cuotas con timeline visual
- ✅ Acciones contextuales según estado
- ✅ Navegación clara con botón "Volver"
- ✅ Diseño consistente con paleta negra/gris

### Funcionalidad General:
- ✅ Navegación fluida entre lista y detalle
- ✅ Animaciones suaves en transiciones
- ✅ Responsive en móvil, tablet y desktop
- ✅ Validaciones antes de editar/eliminar
- ✅ Manejo de estados de carga
- ✅ Manejo de errores con mensajes claros

---

## 7. NOTAS TÉCNICAS

### Signals y Computed:
- Usar signals para estado reactivo
- Computed para cálculos derivados
- Evitar subscripciones manuales innecesarias

### Performance:
- Lazy loading de componentes
- TrackBy en loops (@for)
- OnPush change detection strategy
- Debounce en búsquedas/filtros

### Accesibilidad:
- Etiquetas ARIA apropiadas
- Navegación por teclado
- Contraste suficiente (mínimo 4.5:1)
- Focus visible en elementos interactivos

---

## 8. EJEMPLO VISUAL DE TRANSFORMACIÓN

**ANTES (Actual - Lista Detallada):**
```
┌─────────────────────────────────────────────────┐
│ ● Juan Pérez (Centro)        PRE-001  14/11/24 │
│                                                 │
│ Prestado: $1.000.000  Total: $1.200.000       │
│ Interés: $200.000                              │
│ ━━━━━━━━━━━━━━━ 31% ━━━━━━━━━━━━━━            │
│ Pagado: $369.232  Pendiente: $830.768         │
│                                                 │
│ Frecuencia: Semanal  Cuota: $46.154           │
│ Cuotas: 8/26  Próxima: 16/01/2025             │
│ Días restantes: 0                              │
│                                                 │
│ ● Vencido                                      │
│ [Ver Detalles] [Registrar Pago] [...]         │
└─────────────────────────────────────────────────┘
```

**DESPUÉS (Lista Simplificada):**
```
┌────────────────────────────────────┐
│ ● Juan Pérez     PRE-001  Vencido  │
│                                    │
│ $ Total      Semanal      8/26    │
│ 1.200.000                         │
│                                    │
│ ━━━━━━━━ 31% ━━━━━━━━            │
│ Pagado: $369K  Pend: $831K       │
│                                    │
│ [Ver Detalles] [Pagar]            │
└────────────────────────────────────┘
```

---

## 9. PRIORIZACIÓN DE IMPLEMENTACIÓN

**Fase 1 (Esencial):**
1. Crear componente de detalle básico
2. Simplificar tarjetas de lista
3. Configurar rutas de navegación
4. Tab de información en detalle

**Fase 2 (Importante):**
5. Tab de historial de pagos
6. Tab de proyección de cuotas
7. Acciones en vista de detalle
8. Responsive design

**Fase 3 (Mejoras):**
9. Animaciones y transiciones
10. Exportar/imprimir
11. Gráficos de progreso
12. Filtros avanzados en historial

---

## 10. VALIDACIONES Y REGLAS DE NEGOCIO

1. **No se puede editar** un préstamo que tenga pagos registrados
2. **No se puede eliminar** un préstamo con pagos
3. **No se puede registrar pago** en préstamos completados
4. El **porcentaje de progreso** se calcula: (totalPagado / valorTotal) * 100
5. El **estado** se determina automáticamente según:
   - Completado: saldoPendiente === 0
   - Vencido: fechaActual > fechaFinal && saldoPendiente > 0
   - Mora: proximaCuota < fechaActual && saldoPendiente > 0
   - Activo: otros casos

---

**¿Proceder con la implementación de este diseño?**
