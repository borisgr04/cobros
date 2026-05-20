# Prompt: Implementar Gestión de Zonas

## 🎯 Objetivo
Crear un módulo completo para gestionar zonas geográficas donde se organizan los clientes del sistema de cobros, con funcionalidad CRUD completa, diseño moderno y navegación integrada.

---

## 📋 Contexto del Sistema

### Estado Actual:
- ✅ Modelo `IZona` existe en `src/app/features/core/models/zona.model.ts`
- ✅ Servicio `ZonaService` (abstracto) existe
- ✅ Servicio `ZonaMockService` existe con datos de ejemplo
- ✅ Clientes tienen referencia a zona (`cliente.zona`)
- ❌ No existe componente de vista de zonas
- ❌ No existe formulario de creación/edición
- ❌ No hay ruta `/zonas` configurada

### Arquitectura:
- **Framework:** Angular 19.2.17 (Standalone Components)
- **Signals API:** Manejo de estado reactivo
- **Bootstrap 5.3:** Estilos y componentes UI
- **Bootstrap Icons:** Sistema de iconografía
- **Patrón:** Componentes standalone + Servicios inyectables

### Modelo de Zona:
```typescript
export interface IZona {
  id: string;           // Identificador único
  nombre: string;       // Nombre de la zona (ej: "Centro", "Norte")
  estado: EstadoZona;   // 'activa' | 'inactiva'
}

export type EstadoZona = 'activa' | 'inactiva';
```

---

## 🎨 Diseño Visual

### Paleta de Colores (consistente con Préstamos/Clientes):
```scss
--primary-color: #1a1a2e;      // Negro azulado oscuro
--primary-dark: #0f0f1e;       // Negro más oscuro
--accent-color: #16213e;        // Azul oscuro de acentos
--success-color: #28a745;       // Verde para "activa"
--muted-color: #6c757d;         // Gris para "inactiva"
--danger-color: #dc3545;        // Rojo para alertas
--border-color: #dee2e6;        // Bordes suaves
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
```

### Iconografía:
- **Zona:** `bi bi-geo-alt` (📍)
- **Nueva Zona:** `bi bi-plus-circle-fill` (➕)
- **Editar:** `bi bi-pencil-fill` (✏️)
- **Clientes:** `bi bi-people-fill` (👥)
- **Estado Activo:** Badge verde con `bi bi-check-circle-fill` (✅)
- **Estado Inactivo:** Badge gris con `bi bi-x-circle-fill` (❌)

---

## 📁 Estructura de Archivos

### Archivos a Crear:

```
src/app/features/zonas/
├── components/
│   ├── zonas.component.ts                 # Componente principal
│   ├── zonas.component.html               # Template de lista
│   ├── zonas.component.scss               # Estilos
│   └── zona-modal/
│       ├── zona-modal.component.ts        # Modal crear/editar
│       ├── zona-modal.component.html      # Template del modal
│       └── zona-modal.component.scss      # Estilos del modal
└── services/
    └── (ya existen zona.service.ts y zona-mock.service.ts)
```

### Archivos a Modificar:
- `src/app/app.routes.ts` - Agregar ruta `/zonas`
- `src/app/features/core/services/index.ts` - Verificar exportación de servicios

---

## 🔧 Implementación Detallada

### 1. Componente Principal: `zonas.component.ts`

```typescript
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ZonaService } from '../../core/services/zona.service';
import { ClienteService } from '../../core/services/cliente.service';
import { IZona } from '../../core/models';
import { ZonaModalComponent } from './zona-modal/zona-modal.component';

@Component({
  selector: 'app-zonas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ZonaModalComponent],
  templateUrl: './zonas.component.html',
  styleUrls: ['./zonas.component.scss']
})
export class ZonasComponent implements OnInit {
  // Servicios
  private zonaService = inject(ZonaService);
  private clienteService = inject(ClienteService);
  private router = inject(Router);
  
  // Estado
  zonas = signal<IZona[]>([]);
  clientes = signal<any[]>([]);
  terminoBusqueda = signal('');
  filtroEstado = signal<'todas' | 'activa' | 'inactiva'>('todas');
  
  // Modal
  mostrarModal = signal(false);
  zonaEditando = signal<IZona | null>(null);
  
  // Computed
  zonasFiltradas = computed(() => {
    const zonas = this.zonas();
    const termino = this.terminoBusqueda().toLowerCase();
    const filtro = this.filtroEstado();
    
    return zonas.filter(zona => {
      const cumpleBusqueda = zona.nombre.toLowerCase().includes(termino);
      const cumpleEstado = filtro === 'todas' || zona.estado === filtro;
      return cumpleBusqueda && cumpleEstado;
    });
  });
  
  zonasActivas = computed(() => 
    this.zonas().filter(z => z.estado === 'activa').length
  );
  
  zonasInactivas = computed(() => 
    this.zonas().filter(z => z.estado === 'inactiva').length
  );
  
  // Obtener contador de clientes por zona
  contarClientes(zonaId: string): number {
    return this.clientes().filter(c => c.zonaId === zonaId && c.estado === 'activo').length;
  }
  
  async ngOnInit() {
    await this.cargarDatos();
  }
  
  async cargarDatos() {
    const [zonas, clientes] = await Promise.all([
      this.zonaService.getZonas(),
      this.clienteService.getClientes()
    ]);
    this.zonas.set(zonas);
    this.clientes.set(clientes);
  }
  
  abrirModalNueva() {
    this.zonaEditando.set(null);
    this.mostrarModal.set(true);
  }
  
  abrirModalEditar(zona: IZona) {
    this.zonaEditando.set(zona);
    this.mostrarModal.set(true);
  }
  
  cerrarModal() {
    this.mostrarModal.set(false);
    this.zonaEditando.set(null);
  }
  
  async guardarZona(zona: Partial<IZona>) {
    try {
      const zonaEditando = this.zonaEditando();
      
      if (zonaEditando) {
        // Editar
        await this.zonaService.updateZona({ ...zonaEditando, ...zona } as IZona);
      } else {
        // Crear
        await this.zonaService.createZona(zona as Omit<IZona, 'id'>);
      }
      
      await this.cargarDatos();
      this.cerrarModal();
    } catch (error) {
      console.error('Error al guardar zona:', error);
      alert('Error al guardar la zona');
    }
  }
  
  async cambiarEstado(zona: IZona) {
    const nuevoEstado = zona.estado === 'activa' ? 'inactiva' : 'activa';
    
    try {
      await this.zonaService.updateZona({ ...zona, estado: nuevoEstado });
      await this.cargarDatos();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado');
    }
  }
  
  verClientesZona(zona: IZona) {
    this.router.navigate(['/clientes'], { queryParams: { zona: zona.id } });
  }
}
```

---

### 2. Template Principal: `zonas.component.html`

```html
<div class="zonas-container">
  <!-- HEADER -->
  <div class="zonas-header">
    <div class="header-content">
      <div class="header-title">
        <div class="icon-wrapper">
          <i class="bi bi-geo-alt"></i>
        </div>
        <div>
          <h1 class="title">Gestión de Zonas</h1>
          <p class="subtitle">Organiza tus clientes por ubicación geográfica</p>
        </div>
      </div>

      <div class="header-actions">
        <button class="btn-nueva-zona" (click)="abrirModalNueva()">
          <i class="bi bi-plus-circle-fill"></i>
          <span>Nueva Zona</span>
        </button>
        <button class="btn-dashboard" routerLink="/dashboard">
          <i class="bi bi-house-fill"></i>
          <span>Dashboard</span>
        </button>
      </div>
    </div>

    <div class="header-stats-row">
      <div class="header-stats">
        <div class="stat-card">
          <span class="stat-label">Total</span>
          <span class="stat-value">{{ zonas().length }}</span>
        </div>
        <div class="stat-card stat-success">
          <span class="stat-label">Activas</span>
          <span class="stat-value">{{ zonasActivas() }}</span>
        </div>
        <div class="stat-card stat-muted">
          <span class="stat-label">Inactivas</span>
          <span class="stat-value">{{ zonasInactivas() }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- CONTROLES DE BÚSQUEDA Y FILTROS -->
  <div class="controles-zona">
    <div class="busqueda-wrapper">
      <i class="bi bi-search"></i>
      <input
        type="text"
        class="form-control"
        placeholder="Buscar zona por nombre..."
        [(ngModel)]="terminoBusqueda">
    </div>

    <div class="filtros-estado">
      <button
        class="filtro-btn"
        [class.active]="filtroEstado() === 'todas'"
        (click)="filtroEstado.set('todas')">
        Todas
      </button>
      <button
        class="filtro-btn"
        [class.active]="filtroEstado() === 'activa'"
        (click)="filtroEstado.set('activa')">
        Activas
      </button>
      <button
        class="filtro-btn"
        [class.active]="filtroEstado() === 'inactiva'"
        (click)="filtroEstado.set('inactiva')">
        Inactivas
      </button>
    </div>
  </div>

  <!-- GRID DE ZONAS -->
  <div class="zonas-grid">
    @for (zona of zonasFiltradas(); track zona.id) {
      <div class="zona-card" [class.inactiva]="zona.estado === 'inactiva'">
        
        <!-- Header de la card -->
        <div class="zona-card-header">
          <div class="zona-icono">
            <i class="bi bi-geo-alt"></i>
          </div>
          <div class="zona-info">
            <h3 class="zona-nombre">{{ zona.nombre }}</h3>
            <span class="badge" [class.badge-success]="zona.estado === 'activa'" [class.badge-secondary]="zona.estado === 'inactiva'">
              <i class="bi" [class.bi-check-circle-fill]="zona.estado === 'activa'" [class.bi-x-circle-fill]="zona.estado === 'inactiva'"></i>
              {{ zona.estado === 'activa' ? 'Activa' : 'Inactiva' }}
            </span>
          </div>
        </div>

        <!-- Contador de clientes -->
        <div class="zona-stats">
          <div class="stat-item">
            <i class="bi bi-people-fill"></i>
            <span class="stat-numero">{{ contarClientes(zona.id) }}</span>
            <span class="stat-texto">clientes activos</span>
          </div>
        </div>

        <!-- Acciones -->
        <div class="zona-acciones">
          <button
            class="btn-accion btn-ver"
            (click)="verClientesZona(zona)"
            [disabled]="contarClientes(zona.id) === 0"
            title="Ver clientes de esta zona">
            <i class="bi bi-eye-fill"></i>
            Ver Clientes
          </button>
          <button
            class="btn-accion btn-editar"
            (click)="abrirModalEditar(zona)"
            title="Editar zona">
            <i class="bi bi-pencil-fill"></i>
          </button>
          <button
            class="btn-accion"
            [class.btn-desactivar]="zona.estado === 'activa'"
            [class.btn-activar]="zona.estado === 'inactiva'"
            (click)="cambiarEstado(zona)"
            [title]="zona.estado === 'activa' ? 'Desactivar zona' : 'Activar zona'">
            <i class="bi" [class.bi-toggle-on]="zona.estado === 'activa'" [class.bi-toggle-off]="zona.estado === 'inactiva'"></i>
          </button>
        </div>
      </div>
    }
    
    @empty {
      <div class="empty-state">
        <i class="bi bi-geo-alt"></i>
        <h3>No hay zonas disponibles</h3>
        <p>{{ terminoBusqueda() ? 'No se encontraron zonas con ese nombre' : 'Crea tu primera zona para organizar clientes' }}</p>
        @if (!terminoBusqueda()) {
          <button class="btn-nueva-zona" (click)="abrirModalNueva()">
            <i class="bi bi-plus-circle-fill"></i>
            Nueva Zona
          </button>
        }
      </div>
    }
  </div>

  <!-- MODAL -->
  @if (mostrarModal()) {
    <app-zona-modal
      [zona]="zonaEditando()"
      (guardado)="guardarZona($event)"
      (cancelado)="cerrarModal()">
    </app-zona-modal>
  }
</div>
```

---

### 3. Estilos: `zonas.component.scss`

```scss
.zonas-container {
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
}

// HEADER
.zonas-header {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-md);
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.icon-wrapper {
  width: 4rem;
  height: 4rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  i {
    font-size: 2rem;
    color: white;
  }
}

.title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.subtitle {
  margin: 0.5rem 0 0;
  opacity: 0.9;
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-nueva-zona,
.btn-dashboard {
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  font-size: 1rem;
  
  i {
    font-size: 1.25rem;
  }
}

.btn-nueva-zona {
  background: white;
  color: var(--primary-color);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
}

.btn-dashboard {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  
  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}

.header-stats-row {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.header-stats {
  display: flex;
  gap: 2rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  
  .stat-label {
    font-size: 0.875rem;
    opacity: 0.8;
  }
  
  .stat-value {
    font-size: 2rem;
    font-weight: 700;
  }
  
  &.stat-success .stat-value {
    color: #4ade80;
  }
  
  &.stat-muted .stat-value {
    color: #d1d5db;
  }
}

// CONTROLES
.controles-zona {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.busqueda-wrapper {
  flex: 1;
  min-width: 300px;
  position: relative;
  
  i {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #6c757d;
    font-size: 1.25rem;
  }
  
  input {
    padding-left: 3rem;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    height: 3rem;
    font-size: 1rem;
  }
}

.filtros-estado {
  display: flex;
  gap: 0.5rem;
}

.filtro-btn {
  padding: 0.75rem 1.25rem;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f8f9fa;
  }
  
  &.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }
}

// GRID DE ZONAS
.zonas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.zona-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 2px solid transparent;
  
  &:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-4px);
  }
  
  &.inactiva {
    opacity: 0.7;
    background: #f8f9fa;
  }
}

.zona-card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.zona-icono {
  width: 3.5rem;
  height: 3.5rem;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  i {
    font-size: 1.75rem;
    color: white;
  }
}

.zona-info {
  flex: 1;
  
  .zona-nombre {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--primary-color);
  }
  
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    margin-top: 0.5rem;
    
    &.badge-success {
      background: #d4edda;
      color: #155724;
    }
    
    &.badge-secondary {
      background: #e2e3e5;
      color: #6c757d;
    }
  }
}

.zona-stats {
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  
  i {
    font-size: 1.5rem;
    color: var(--primary-color);
  }
  
  .stat-numero {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-color);
  }
  
  .stat-texto {
    font-size: 0.875rem;
    color: #6c757d;
  }
}

.zona-acciones {
  display: flex;
  gap: 0.5rem;
}

.btn-accion {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  i {
    font-size: 1.125rem;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
}

.btn-ver {
  background: #007bff;
  color: white;
  
  &:hover:not(:disabled) {
    background: #0056b3;
  }
}

.btn-editar {
  background: #ffc107;
  color: #000;
  flex: 0 0 auto;
  
  &:hover {
    background: #e0a800;
  }
}

.btn-desactivar {
  background: #dc3545;
  color: white;
  flex: 0 0 auto;
  
  &:hover {
    background: #c82333;
  }
}

.btn-activar {
  background: #28a745;
  color: white;
  flex: 0 0 auto;
  
  &:hover {
    background: #218838;
  }
}

// EMPTY STATE
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
  
  i {
    font-size: 5rem;
    color: #dee2e6;
    margin-bottom: 1.5rem;
  }
  
  h3 {
    color: #495057;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #6c757d;
    margin-bottom: 2rem;
  }
}

// RESPONSIVE
@media (max-width: 768px) {
  .zonas-container {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
    
    button {
      flex: 1;
    }
  }
  
  .header-stats {
    justify-content: space-around;
  }
  
  .controles-zona {
    flex-direction: column;
  }
  
  .busqueda-wrapper {
    min-width: auto;
  }
  
  .zonas-grid {
    grid-template-columns: 1fr;
  }
}
```

---

**CONTINÚA EN SIGUIENTE MENSAJE...**
