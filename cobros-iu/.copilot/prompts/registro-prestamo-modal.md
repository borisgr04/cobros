# 📝 Prompt: Implementar Registro de Préstamos

## 🎯 Objetivo

Crear un **componente modal** para registrar nuevos préstamos en el sistema, siguiendo el mismo patrón de diseño y arquitectura utilizado en el modal de registro de pagos (`RegistroPagoModalComponent`).

---

## 📋 Requisitos Funcionales

### 1. Campos del Formulario

Basado en el modelo `IPrestamo`, el formulario debe incluir:

#### **a) ID del Préstamo**
- **Tipo:** `string`
- **Generación:** Automática
- **Formato:** `PRE-XXX` (ej: `PRE-005`, `PRE-006`)
- **Lógica:** El servicio mock debe generar el ID incrementalmente
- **UI:** No visible para el usuario (se genera en backend/mock)

#### **b) Cliente** ⭐ REQUERIDO
- **Campo:** `clienteId: string`
- **Tipo de Input:** `<select>` / Dropdown
- **Fuente de datos:** `ClienteMockService.getAll()`
- **Opciones:** Lista de todos los clientes activos
- **Formato de opción:** `{{ cliente.nombre }} ({{ cliente.identificacion }})`
- **Validación:** Campo obligatorio
- **Placeholder:** "Seleccione un cliente..."

#### **c) Fecha de Préstamo** ⭐ REQUERIDO
- **Campo:** `fechaPrestamo: Date`
- **Tipo de Input:** `<input type="date">`
- **Valor por defecto:** Fecha actual (`new Date()`)
- **Formato:** `yyyy-MM-dd`
- **Validaciones:**
  - Campo obligatorio
  - No puede ser futura
  - Max: Hoy
- **Editable:** Sí (el usuario puede cambiarla)

#### **d) Fecha Final** ⭐ REQUERIDO
- **Campo:** `fechaFinal: Date`
- **Tipo de Input:** `<input type="date">`
- **Valor por defecto:** Ninguno (usuario debe especificar)
- **Formato:** `yyyy-MM-dd`
- **Validaciones:**
  - Campo obligatorio
  - Debe ser posterior a `fechaPrestamo`
  - Diferencia mínima: 1 día
- **Trigger:** Al cambiar, recalcular `cantidadCuotas`

#### **e) Valor Prestado** ⭐ REQUERIDO
- **Campo:** `valorPrestado: number`
- **Tipo de Input:** `<input type="number">`
- **Formato:** Moneda (prefijo `$`, separador de miles)
- **Validaciones:**
  - Campo obligatorio
  - Mínimo: $1
  - Máximo: Sin límite (o definir según negocio, ej: $100,000,000)
- **Trigger:** Al cambiar, recalcular `interesProyectado`

#### **f) Valor Total a Pagar** ⭐ REQUERIDO
- **Campo:** `valorTotal: number`
- **Tipo de Input:** `<input type="number">`
- **Formato:** Moneda (prefijo `$`, separador de miles)
- **Validaciones:**
  - Campo obligatorio
  - Mínimo: Igual a `valorPrestado` (no puede ser menor)
  - Recomendación: Mayor a `valorPrestado` (para incluir intereses)
- **Trigger:** Al cambiar, recalcular `interesProyectado` y `valorCuota`

#### **g) Interés Proyectado** 🔢 CALCULADO
- **Campo:** `interesProyectado: number`
- **Tipo:** Computed/Calculado automáticamente
- **Fórmula:** `valorTotal - valorPrestado`
- **Formato:** Moneda (prefijo `$`, separador de miles)
- **UI:** Campo de solo lectura / Badge informativo
- **Color:** Verde si > 0, Gris si = 0
- **Ejemplo:**
  ```
  Valor Prestado:      $1,000,000
  Valor Total:         $1,200,000
  ─────────────────────────────────
  Interés Proyectado:  $200,000 ✅
  ```

#### **h) Frecuencia de Pago** ⭐ REQUERIDO
- **Campo:** `frecuenciaPago: FrecuenciaPago`
- **Tipo:** `'diario' | 'semanal' | 'quincenal' | 'mensual'`
- **Tipo de Input:** Radio buttons / Selector de opciones
- **Opciones:**
  ```typescript
  [
    { value: 'diario', label: 'Diario', icon: 'bi-calendar-day' },
    { value: 'semanal', label: 'Semanal', icon: 'bi-calendar-week' },
    { value: 'quincenal', label: 'Quincenal', icon: 'bi-calendar2-range' },
    { value: 'mensual', label: 'Mensual', icon: 'bi-calendar-month' }
  ]
  ```
- **Valor por defecto:** `'semanal'`
- **Validación:** Campo obligatorio
- **Trigger:** Al cambiar, recalcular `cantidadCuotas`

#### **i) Cantidad de Cuotas** 🔢 CALCULADO
- **Campo:** `cantidadCuotas: number`
- **Tipo:** Computed/Calculado automáticamente
- **Fórmula:** Basada en `fechaPrestamo`, `fechaFinal` y `frecuenciaPago`
- **Lógica de cálculo:**
  ```typescript
  calcularCantidadCuotas(): number {
    const inicio = this.fechaPrestamo();
    const fin = this.fechaFinal();
    const frecuencia = this.frecuenciaPago();
    
    if (!inicio || !fin || !frecuencia) return 0;
    
    const diasTotales = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (frecuencia) {
      case 'diario':
        return diasTotales;
      case 'semanal':
        return Math.ceil(diasTotales / 7);
      case 'quincenal':
        return Math.ceil(diasTotales / 15);
      case 'mensual':
        return Math.ceil(diasTotales / 30);
      default:
        return 0;
    }
  }
  ```
- **UI:** Badge informativo grande
- **Ejemplo:**
  ```
  📅 26 Cuotas
  ```

#### **j) Valor de Cuota** 🔢 CALCULADO
- **Campo:** `valorCuota: number`
- **Tipo:** Computed/Calculado automáticamente
- **Fórmula:** `valorTotal / cantidadCuotas`
- **Formato:** Moneda (prefijo `$`, separador de miles)
- **UI:** Badge destacado
- **Ejemplo:**
  ```
  💰 $46,154 / cuota
  ```

---

## 🎨 Diseño UI/UX

### Estructura del Modal

```
┌─────────────────────────────────────────────────┐
│  🏦 Registrar Nuevo Préstamo              [X]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  📋 INFORMACIÓN DEL CLIENTE                     │
│  ┌───────────────────────────────────────────┐ │
│  │ Seleccione un cliente *                   │ │
│  │ [Dropdown: Juan Pérez (12345678)      ▼] │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  📅 FECHAS DEL PRÉSTAMO                         │
│  ┌─────────────────┐  ┌─────────────────┐     │
│  │ Fecha Préstamo* │  │ Fecha Final*    │     │
│  │ [2025-01-20]    │  │ [2025-07-20]    │     │
│  └─────────────────┘  └─────────────────┘     │
│                                                 │
│  💰 VALORES DEL PRÉSTAMO                        │
│  ┌─────────────────┐  ┌─────────────────┐     │
│  │ Valor Prestado* │  │ Valor Total*    │     │
│  │ $ 1,000,000     │  │ $ 1,200,000     │     │
│  └─────────────────┘  └─────────────────┘     │
│                                                 │
│  📊 INTERÉS CALCULADO                           │
│  ┌─────────────────────────────────────────┐   │
│  │  💵 Interés Proyectado: $200,000 ✅     │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  🔄 FRECUENCIA DE PAGO *                        │
│  ┌─────┐ ┌─────┐ ┌─────────┐ ┌─────────┐      │
│  │📅 D │ │📅 S │ │📅 Q ✓   │ │📅 M     │      │
│  └─────┘ └─────┘ └─────────┘ └─────────┘      │
│                                                 │
│  📈 RESUMEN DE CUOTAS                           │
│  ┌─────────────────────────────────────────┐   │
│  │  📅 26 Cuotas                           │   │
│  │  💰 $46,154 por cuota                   │   │
│  │  📆 Desde: 20/01/2025                   │   │
│  │  📆 Hasta: 20/07/2025                   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [❌ Validaciones aquí si hay errores]          │
│                                                 │
├─────────────────────────────────────────────────┤
│              [Cancelar]  [✓ Crear Préstamo]     │
└─────────────────────────────────────────────────┘
```

### Paleta de Colores (consistente con el sistema)

- **Fondo:** `#FFFFFF` (blanco)
- **Header:** Gradiente `#2D2D2D → #1A1A1A`
- **Texto Principal:** `#0D0D0D`
- **Texto Secundario:** `#666666`
- **Borde:** `#E0E0E0`
- **Acento:** `#00E676` (verde)
- **Error:** `#F44336` (rojo)
- **Info:** `#2196F3` (azul)
- **Panel Resumen:** Gradiente verde `#E8F5E9 → #F1F8F4`

---

## 🔧 Arquitectura Técnica

### 1. Componente: `RegistroPrestamoModalComponent`

**Ubicación:** `src/app/features/prestamos/components/registro-prestamo-modal/`

**Archivos:**
- `registro-prestamo-modal.component.ts`
- `registro-prestamo-modal.component.html`
- `registro-prestamo-modal.component.scss`

**Imports:**
```typescript
import { Component, inject, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrestamoMockService } from '../../services/prestamo-mock.service';
import { ClienteMockService } from '../../../clientes/services/cliente-mock.service';
import type { IPrestamo, ICliente, FrecuenciaPago } from '../../../core/models';
```

### 2. Signals del Componente

```typescript
// Datos del formulario
clienteId = signal<string>('');
fechaPrestamo = signal<Date>(new Date());
fechaFinal = signal<Date | null>(null);
valorPrestado = signal<number>(0);
valorTotal = signal<number>(0);
frecuenciaPago = signal<FrecuenciaPago>('semanal');

// Datos auxiliares
clientes = signal<ICliente[]>([]);
cargandoClientes = signal<boolean>(false);

// Estado del modal
visible = signal<boolean>(false);
procesando = signal<boolean>(false);
error = signal<string>('');
exito = signal<boolean>(false);

// Computed: Cálculos automáticos
interesProyectado = computed(() => {
  return this.valorTotal() - this.valorPrestado();
});

cantidadCuotas = computed(() => {
  return this.calcularCantidadCuotas();
});

valorCuota = computed(() => {
  const total = this.valorTotal();
  const cuotas = this.cantidadCuotas();
  return cuotas > 0 ? Math.round(total / cuotas) : 0;
});

// Computed: Validaciones
esFormularioValido = computed(() => {
  return (
    this.clienteId().length > 0 &&
    this.fechaPrestamo() !== null &&
    this.fechaFinal() !== null &&
    this.fechaFinal()! > this.fechaPrestamo() &&
    this.valorPrestado() > 0 &&
    this.valorTotal() > 0 &&
    this.valorTotal() >= this.valorPrestado() &&
    this.frecuenciaPago().length > 0 &&
    this.cantidadCuotas() > 0
  );
});
```

### 3. Métodos Principales

```typescript
/**
 * Abre el modal y carga la lista de clientes
 */
abrir(): void {
  this.visible.set(true);
  this.cargarClientes();
  this.resetearFormulario();
}

/**
 * Carga todos los clientes activos
 */
cargarClientes(): void {
  this.cargandoClientes.set(true);
  this.clienteService.getAll().subscribe({
    next: (clientes) => {
      // Filtrar solo clientes activos
      const activos = clientes.filter(c => c.estado === 'activo');
      this.clientes.set(activos);
      this.cargandoClientes.set(false);
    },
    error: (err) => {
      this.error.set('Error al cargar clientes: ' + err.message);
      this.cargandoClientes.set(false);
    }
  });
}

/**
 * Calcula la cantidad de cuotas según fechas y frecuencia
 */
calcularCantidadCuotas(): number {
  const inicio = this.fechaPrestamo();
  const fin = this.fechaFinal();
  const frecuencia = this.frecuenciaPago();
  
  if (!inicio || !fin || !frecuencia) return 0;
  
  const diasTotales = Math.ceil(
    (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  switch (frecuencia) {
    case 'diario':
      return diasTotales;
    case 'semanal':
      return Math.ceil(diasTotales / 7);
    case 'quincenal':
      return Math.ceil(diasTotales / 15);
    case 'mensual':
      return Math.ceil(diasTotales / 30);
    default:
      return 0;
  }
}

/**
 * Registra el préstamo en el sistema
 */
registrarPrestamo(): void {
  if (!this.esFormularioValido()) {
    this.error.set('Por favor complete todos los campos requeridos correctamente');
    return;
  }

  this.procesando.set(true);
  this.error.set('');

  const nuevoPrestamo: Omit<IPrestamo, 'id'> = {
    clienteId: this.clienteId(),
    fechaPrestamo: this.fechaPrestamo(),
    fechaFinal: this.fechaFinal()!,
    valorPrestado: this.valorPrestado(),
    valorTotal: this.valorTotal(),
    interesProyectado: this.interesProyectado(),
    frecuenciaPago: this.frecuenciaPago(),
    cantidadCuotas: this.cantidadCuotas(),
    valorCuota: this.valorCuota()
  };

  this.prestamoService.createPrestamo(nuevoPrestamo as IPrestamo).subscribe({
    next: (prestamo) => {
      this.exito.set(true);
      this.prestamoRegistrado.emit(prestamo);
      
      setTimeout(() => {
        this.cerrar();
      }, 1500);
    },
    error: (err) => {
      this.error.set('Error al registrar préstamo: ' + err.message);
      this.procesando.set(false);
    }
  });
}

/**
 * Cierra el modal y resetea el estado
 */
cerrar(): void {
  this.visible.set(false);
  this.modalCerrado.emit();
  
  setTimeout(() => {
    this.resetearFormulario();
    this.exito.set(false);
    this.procesando.set(false);
    this.error.set('');
  }, 300);
}

/**
 * Resetea el formulario a valores por defecto
 */
resetearFormulario(): void {
  this.clienteId.set('');
  this.fechaPrestamo.set(new Date());
  this.fechaFinal.set(null);
  this.valorPrestado.set(0);
  this.valorTotal.set(0);
  this.frecuenciaPago.set('semanal');
  this.error.set('');
}

/**
 * Formatea un número como moneda colombiana
 */
formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Formatea una fecha
 */
formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CO').format(date);
}
```

### 4. Outputs (Eventos)

```typescript
@Output() prestamoRegistrado = new EventEmitter<IPrestamo>();
@Output() modalCerrado = new EventEmitter<void>();
```

---

## 🔄 Integración con Componentes Padres

### A) PrestamosComponent (Vista de Lista)

**Botón:** "Nuevo Préstamo" en la parte superior (toolbar)

```typescript
// prestamos.component.ts

// Import
import { viewChild } from '@angular/core';
import { RegistroPrestamoModalComponent } from './registro-prestamo-modal/...';

// ViewChild
modalPrestamo = viewChild(RegistroPrestamoModalComponent);

// Método para abrir modal
abrirModalPrestamo(): void {
  const modal = this.modalPrestamo();
  if (modal) {
    modal.abrir();
  }
}

// Handler cuando se registra préstamo
onPrestamoRegistrado(prestamo: IPrestamo): void {
  this.cargarDatos(); // Recargar lista
  this.mostrarMensaje(`Préstamo ${prestamo.id} creado exitosamente`, 'success');
}
```

```html
<!-- prestamos.component.html -->

<!-- Botón en toolbar -->
<div class="toolbar">
  <button class="btn-nuevo" (click)="abrirModalPrestamo()">
    <i class="bi bi-plus-circle"></i>
    Nuevo Préstamo
  </button>
</div>

<!-- Modal component al final -->
<app-registro-prestamo-modal
  (prestamoRegistrado)="onPrestamoRegistrado($event)"
  (modalCerrado)="cargarDatos()">
</app-registro-prestamo-modal>
```

---

## 📊 Validaciones Detalladas

### Tabla de Validaciones

| Campo | Validación | Mensaje de Error |
|-------|------------|------------------|
| **clienteId** | Requerido | "Debe seleccionar un cliente" |
| **fechaPrestamo** | Requerido | "La fecha de préstamo es obligatoria" |
| **fechaPrestamo** | ≤ Hoy | "La fecha no puede ser futura" |
| **fechaFinal** | Requerido | "La fecha final es obligatoria" |
| **fechaFinal** | > fechaPrestamo | "La fecha final debe ser posterior a la fecha de préstamo" |
| **valorPrestado** | Requerido | "El valor prestado es obligatorio" |
| **valorPrestado** | > 0 | "El valor prestado debe ser mayor a $0" |
| **valorTotal** | Requerido | "El valor total es obligatorio" |
| **valorTotal** | ≥ valorPrestado | "El valor total no puede ser menor al valor prestado" |
| **frecuenciaPago** | Requerido | "Debe seleccionar una frecuencia de pago" |
| **cantidadCuotas** | > 0 | "La cantidad de cuotas debe ser mayor a 0" |

### Validación en Tiempo Real

```typescript
// Computed para mensajes de error específicos
errorCliente = computed(() => {
  return this.clienteId().length === 0 ? 'Debe seleccionar un cliente' : '';
});

errorFechaFinal = computed(() => {
  const inicio = this.fechaPrestamo();
  const fin = this.fechaFinal();
  
  if (!fin) return 'La fecha final es obligatoria';
  if (fin <= inicio) return 'La fecha final debe ser posterior a la fecha de préstamo';
  
  return '';
});

errorValores = computed(() => {
  const prestado = this.valorPrestado();
  const total = this.valorTotal();
  
  if (prestado <= 0) return 'El valor prestado debe ser mayor a $0';
  if (total <= 0) return 'El valor total debe ser mayor a $0';
  if (total < prestado) return 'El valor total no puede ser menor al valor prestado';
  
  return '';
});

errorCuotas = computed(() => {
  const cuotas = this.cantidadCuotas();
  return cuotas <= 0 ? 'Configure las fechas y frecuencia correctamente' : '';
});
```

---

## 🎨 Estilos SCSS (Extracto)

```scss
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

.modal-container {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 700px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideDown 0.3s ease;
}

.modal-header {
  background: linear-gradient(135deg, #2D2D2D 0%, #1A1A1A 100%);
  color: white;
  padding: 1.5rem 2rem;
  border-radius: 1rem 1rem 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }
}

.seccion {
  margin-bottom: 2rem;

  .seccion-titulo {
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #666;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    i {
      color: #00E676;
    }
  }
}

.campo-grupo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #0D0D0D;

    .requerido {
      color: #F44336;
      margin-left: 0.25rem;
    }
  }

  input, select {
    padding: 0.75rem 1rem;
    border: 2px solid #E0E0E0;
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: all 0.3s;

    &:focus {
      outline: none;
      border-color: #00E676;
      box-shadow: 0 0 0 3px rgba(0, 230, 118, 0.1);
    }

    &.error {
      border-color: #F44336;
    }
  }

  .mensaje-error {
    font-size: 0.75rem;
    color: #F44336;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
}

.frecuencia-opciones {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.frecuencia-card {
  padding: 1rem;
  border: 2px solid #E0E0E0;
  border-radius: 0.75rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #00E676;
    background: #F5F5F5;
  }

  &.selected {
    border-color: #00E676;
    background: #E8F5E9;
    box-shadow: 0 4px 12px rgba(0, 230, 118, 0.2);
  }

  i {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .frecuencia-label {
    font-size: 0.875rem;
    font-weight: 600;
  }
}

.resumen-panel {
  background: linear-gradient(135deg, #E8F5E9 0%, #F1F8F4 100%);
  border-left: 4px solid #00E676;
  padding: 1.5rem;
  border-radius: 0.75rem;

  .resumen-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    &:last-child {
      border-bottom: none;
    }

    .resumen-label {
      font-size: 0.875rem;
      color: #666;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .resumen-valor {
      font-size: 1rem;
      font-weight: 700;
      color: #0D0D0D;

      &.destacado {
        font-size: 1.25rem;
        color: #00E676;
      }
    }
  }
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid #E0E0E0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;

  .btn {
    padding: 0.75rem 2rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;

    &.btn-cancelar {
      background: #F5F5F5;
      color: #666;

      &:hover {
        background: #E0E0E0;
      }
    }

    &.btn-registrar {
      background: #00E676;
      color: white;

      &:hover:not(:disabled) {
        background: #00C765;
        box-shadow: 0 4px 12px rgba(0, 230, 118, 0.3);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}
```

---

## 🧪 Casos de Uso para Probar

### ✅ Caso 1: Registro Exitoso Básico
- Cliente: Juan Pérez
- Fecha Préstamo: Hoy
- Fecha Final: +6 meses
- Valor Prestado: $1,000,000
- Valor Total: $1,200,000
- Frecuencia: Semanal
- **Resultado:** 26 cuotas de $46,154

### ✅ Caso 2: Préstamo sin Intereses
- Cliente: María López
- Fecha Préstamo: Hoy
- Fecha Final: +3 meses
- Valor Prestado: $500,000
- Valor Total: $500,000
- Frecuencia: Quincenal
- **Resultado:** Interés = $0, 6 cuotas de $83,333

### ✅ Caso 3: Préstamo Diario
- Cliente: Carlos Rodríguez
- Fecha Préstamo: Hoy
- Fecha Final: +30 días
- Valor Prestado: $300,000
- Valor Total: $330,000
- Frecuencia: Diario
- **Resultado:** 30 cuotas de $11,000

### ❌ Caso 4: Validación de Fecha Final
- Fecha Préstamo: 2025-01-20
- Fecha Final: 2025-01-19 (anterior)
- **Resultado:** Error "La fecha final debe ser posterior..."

### ❌ Caso 5: Validación de Valores
- Valor Prestado: $1,000,000
- Valor Total: $800,000 (menor)
- **Resultado:** Error "El valor total no puede ser menor..."

### ❌ Caso 6: Cliente no Seleccionado
- Todos los campos correctos excepto cliente
- **Resultado:** Botón "Crear Préstamo" deshabilitado

---

## 📝 Checklist de Implementación

- [ ] Crear archivos del componente en la ruta correcta
- [ ] Implementar todos los signals requeridos
- [ ] Implementar método `calcularCantidadCuotas()`
- [ ] Implementar computed para `interesProyectado`
- [ ] Implementar computed para `valorCuota`
- [ ] Implementar computed para `esFormularioValido`
- [ ] Crear método `cargarClientes()`
- [ ] Crear método `registrarPrestamo()`
- [ ] Implementar validaciones en tiempo real
- [ ] Crear template HTML con todas las secciones
- [ ] Implementar estilos SCSS consistentes
- [ ] Agregar animaciones (fadeIn, slideDown)
- [ ] Integrar modal en `PrestamosComponent`
- [ ] Agregar botón "Nuevo Préstamo" en toolbar
- [ ] Implementar ViewChild en componente padre
- [ ] Configurar eventos `prestamoRegistrado` y `modalCerrado`
- [ ] Probar todos los casos de uso
- [ ] Verificar responsive design (móvil, tablet, desktop)
- [ ] Verificar accesibilidad (labels, aria-*)
- [ ] Compilar sin errores
- [ ] Crear documentación de implementación

---

## 🚀 Resultado Esperado

Al finalizar, el sistema debe permitir:

1. ✅ Abrir modal desde la vista de lista de préstamos
2. ✅ Seleccionar cliente desde dropdown de clientes activos
3. ✅ Ingresar fechas con date pickers
4. ✅ Ingresar valores prestado y total
5. ✅ Ver cálculo automático de interés
6. ✅ Seleccionar frecuencia de pago con opciones visuales
7. ✅ Ver cálculo automático de cantidad de cuotas
8. ✅ Ver cálculo automático de valor por cuota
9. ✅ Ver panel de resumen con todos los valores
10. ✅ Validaciones en tiempo real
11. ✅ Botón "Crear Préstamo" habilitado solo si formulario válido
12. ✅ Registro exitoso con notificación
13. ✅ Cierre automático del modal
14. ✅ Recarga de la lista de préstamos
15. ✅ Diseño responsive y accesible

---

## 📚 Referencias

- **Modelo:** `src/app/features/core/models/prestamo.model.ts`
- **Servicio:** `src/app/features/prestamos/services/prestamo-mock.service.ts`
- **Clientes:** `src/app/features/clientes/services/cliente-mock.service.ts`
- **Patrón de referencia:** `src/app/features/prestamos/components/registro-pago-modal/`
- **Tipos:** `src/app/features/core/models/types.ts` (FrecuenciaPago)

---

**Versión del prompt:** 1.0  
**Fecha:** Enero 2025  
**Autor:** GitHub Copilot  
**Estado:** Listo para implementar ✅
