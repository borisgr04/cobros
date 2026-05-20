# Prompt: Implementación del Modal de Registro de Pagos

## Contexto del Proyecto

**Aplicación:** Sistema de Gestión de Cobros - Angular 19.2.17 con Standalone Components y Signals  
**Stack Técnico:** TypeScript, SCSS, RxJS, Mock Services (sin backend)  
**Paleta de Colores:** Tema elegante oscuro (#0D0D0D, #1A1A1A, #2D2D2D) con acentos vibrantes (#00E676 verde, #FF5252 rojo, #FFC107 amarillo)

---

## 📋 Objetivo

Implementar un **modal/dialog elegante y funcional** para registrar pagos de préstamos, que permita:

1. Seleccionar el monto a pagar (cuota completa, parcial o múltiples cuotas)
2. Validar que no se exceda el saldo pendiente
3. Registrar la fecha del pago
4. Actualizar automáticamente las estadísticas del préstamo
5. Proporcionar feedback visual del resultado

---

## 🎯 Requisitos Funcionales

### **RF-01: Apertura del Modal**
- El modal debe abrirse desde dos ubicaciones:
  - Botón "Pagar" en la tarjeta de préstamo (vista de lista)
  - Botón "Registrar Pago" en la vista de detalle
- Debe recibir el préstamo completo como input
- Debe bloquear la interacción con el fondo (overlay)

### **RF-02: Visualización de Información**
El modal debe mostrar:
- Nombre del cliente con avatar
- ID del préstamo (código)
- Total del préstamo (valor original)
- Saldo pendiente actual (destacado)
- Número de cuotas pagadas vs total
- Valor de cuota estándar (referencia)
- Próxima cuota esperada (fecha y número)

### **RF-03: Opciones de Pago**
Tres modos de pago con radio buttons:
1. **Pago de 1 Cuota Completa**
   - Valor: `prestamo.valorCuota`
   - Descripción: "Pagar la cuota estándar"
   
2. **Pago Parcial/Personalizado**
   - Input numérico manual
   - Placeholder: "Ingrese monto"
   - Mínimo: $1
   - Máximo: `saldo pendiente`
   
3. **Pago Múltiple (N cuotas)**
   - Selector numérico (1-10 cuotas)
   - Cálculo automático: `cantidad × valorCuota`
   - Validación: no exceder saldo pendiente

### **RF-04: Fecha de Pago**
- Input tipo date
- Valor por defecto: fecha actual
- Validaciones:
  - No puede ser anterior a `prestamo.fechaPrestamo`
  - No puede ser posterior a hoy
  - Formato: DD/MM/YYYY

### **RF-05: Validaciones en Tiempo Real**
- Mostrar monto total a pagar actualizado
- Indicar nuevo saldo después del pago
- Advertencia si el monto ingresado excede el saldo
- Deshabilitar botón "Confirmar" si hay errores
- Mensajes de validación claros y descriptivos

### **RF-06: Confirmación y Registro**
Al hacer clic en "Registrar Pago":
1. Validar todos los campos
2. Generar ID único para el pago (`PAG-XXX`)
3. Crear objeto `IPago`:
   ```typescript
   {
     id: string;
     prestamoId: string;
     valor: number;
     fechaPago: Date;
   }
   ```
4. Llamar a `PrestamoMockService.registrarPago(pago)`
5. Mostrar notificación de éxito/error
6. Actualizar estadísticas del préstamo
7. Cerrar modal automáticamente (después de 1s)
8. Emitir evento al componente padre para refrescar datos

### **RF-07: Cierre del Modal**
- Botón "Cancelar" (secundario)
- Click en overlay (fondo oscuro)
- Tecla ESC
- Confirmación si hay datos sin guardar

---

## 🎨 Especificaciones de Diseño

### **Estructura del Modal**

```
┌─────────────────────────────────────────────────┐
│  Registrar Pago                            [X]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───┐  Carlos Rodríguez                       │
│  │ C │  PRE-003                                 │
│  └───┘                                          │
│                                                 │
│  Total Préstamo:    $575,000                    │
│  Saldo Pendiente:   $575,000  ← Destacado      │
│  Cuotas Pagadas:    0 / 6                       │
│  Valor por Cuota:   $95,833                     │
│  Próxima Cuota:     Cuota #1 - 01/Dic/2024     │
│                                                 │
├─────────────────────────────────────────────────┤
│  Seleccione el tipo de pago:                   │
│                                                 │
│  ○ Pagar 1 Cuota Completa ($95,833)            │
│  ● Pago Personalizado                          │
│    ┌────────────────────────┐                  │
│    │ $  [_____________]     │                  │
│    └────────────────────────┘                  │
│  ○ Pagar Múltiples Cuotas                      │
│    Cantidad: [▼ 2 cuotas] = $191,666           │
│                                                 │
│  Fecha de Pago:                                │
│  ┌──────────────┐                              │
│  │ 📅 15/10/2025 │                             │
│  └──────────────┘                              │
│                                                 │
├─────────────────────────────────────────────────┤
│  💡 Monto a Pagar:     $100,000                │
│  💰 Nuevo Saldo:       $475,000                │
├─────────────────────────────────────────────────┤
│                 [Cancelar]  [Registrar Pago]   │
└─────────────────────────────────────────────────┘
```

### **Estilos CSS/SCSS**

**Variables:**
```scss
:host {
  --modal-overlay: rgba(13, 13, 13, 0.85);
  --modal-bg: #FFFFFF;
  --modal-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  --modal-radius: 1rem;
  --modal-header-bg: linear-gradient(135deg, #2D2D2D, #1A1A1A);
  --input-border: #E0E0E0;
  --input-focus: #2D2D2D;
}
```

**Componentes clave:**
- **Overlay**: Fondo oscuro semitransparente, backdrop-filter blur(4px)
- **Modal Container**: Ancho máximo 600px, centrado, responsive
- **Header**: Fondo degradado oscuro, color blanco, padding 1.5rem
- **Body**: Padding 2rem, fondo blanco, secciones separadas
- **Footer**: Borde superior, padding 1.5rem, botones alineados a la derecha
- **Animaciones**: 
  - Entrada: fadeIn + slideDown (0.3s)
  - Salida: fadeOut + slideUp (0.2s)

### **Estados Visuales**

**Radio Buttons:**
```scss
.radio-option {
  padding: 1rem;
  border: 2px solid #E0E0E0;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    border-color: #2D2D2D;
    background: #F5F5F5;
  }
  
  &.selected {
    border-color: #00E676;
    background: #E8F5E9;
  }
}
```

**Input de Monto:**
```scss
.input-monto {
  font-size: 1.5rem;
  font-weight: 700;
  padding: 1rem 1.5rem;
  border: 2px solid #E0E0E0;
  border-radius: 0.75rem;
  text-align: right;
  
  &:focus {
    border-color: #00E676;
    box-shadow: 0 0 0 4px rgba(0, 230, 118, 0.1);
  }
  
  &.error {
    border-color: #FF5252;
    background: #FFEBEE;
  }
}
```

**Resumen de Pago:**
```scss
.resumen-pago {
  background: linear-gradient(135deg, #E8F5E9, #F1F8F4);
  border-left: 4px solid #00E676;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  
  .monto-destacado {
    font-size: 1.75rem;
    font-weight: 700;
    color: #00E676;
  }
}
```

---

## 💻 Implementación Técnica

### **Estructura de Archivos**

```
src/app/features/prestamos/
├── components/
│   ├── prestamos.component.ts
│   ├── prestamo-detalle.component.ts
│   └── registro-pago-modal/
│       ├── registro-pago-modal.component.ts
│       ├── registro-pago-modal.component.html
│       └── registro-pago-modal.component.scss
└── services/
    ├── prestamo.service.ts
    └── prestamo-mock.service.ts
```

### **Component TypeScript**

```typescript
import { Component, inject, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrestamoMockService } from '../../services/prestamo-mock.service';
import type { PrestamoConCliente } from '../../services/prestamo.service';
import type { IPago } from '../../../core/models';

export type TipoPago = 'cuota-completa' | 'personalizado' | 'multiple';

@Component({
  selector: 'app-registro-pago-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-pago-modal.component.html',
  styleUrl: './registro-pago-modal.component.scss',
})
export class RegistroPagoModalComponent {
  private pagoService = inject(PrestamoMockService);
  
  // Outputs
  @Output() pagoRegistrado = new EventEmitter<IPago>();
  @Output() modalCerrado = new EventEmitter<void>();
  
  // Signals de estado
  prestamo = signal<PrestamoConCliente | null>(null);
  tipoPago = signal<TipoPago>('cuota-completa');
  montoPersonalizado = signal<number>(0);
  cantidadCuotas = signal<number>(1);
  fechaPago = signal<Date>(new Date());
  procesando = signal<boolean>(false);
  error = signal<string>('');
  
  // Computed
  saldoPendiente = computed(() => {
    const p = this.prestamo();
    return p?.estadisticas?.totalPorCobrar || 0;
  });
  
  montoAPagar = computed(() => {
    const tipo = this.tipoPago();
    const p = this.prestamo();
    
    if (!p) return 0;
    
    switch (tipo) {
      case 'cuota-completa':
        return Math.min(p.valorCuota, this.saldoPendiente());
      case 'personalizado':
        return this.montoPersonalizado();
      case 'multiple':
        return Math.min(
          this.cantidadCuotas() * p.valorCuota,
          this.saldoPendiente()
        );
      default:
        return 0;
    }
  });
  
  nuevoSaldo = computed(() => {
    return Math.max(0, this.saldoPendiente() - this.montoAPagar());
  });
  
  esMontoValido = computed(() => {
    const monto = this.montoAPagar();
    const saldo = this.saldoPendiente();
    return monto > 0 && monto <= saldo;
  });
  
  /**
   * Inicializa el modal con los datos del préstamo
   */
  abrir(prestamo: PrestamoConCliente): void {
    this.prestamo.set(prestamo);
    this.resetearFormulario();
  }
  
  /**
   * Resetea el formulario a valores por defecto
   */
  resetearFormulario(): void {
    this.tipoPago.set('cuota-completa');
    this.montoPersonalizado.set(0);
    this.cantidadCuotas.set(1);
    this.fechaPago.set(new Date());
    this.error.set('');
  }
  
  /**
   * Cambia el tipo de pago seleccionado
   */
  seleccionarTipoPago(tipo: TipoPago): void {
    this.tipoPago.set(tipo);
    this.error.set('');
  }
  
  /**
   * Valida el monto personalizado
   */
  validarMontoPersonalizado(): void {
    const monto = this.montoPersonalizado();
    const saldo = this.saldoPendiente();
    
    if (monto <= 0) {
      this.error.set('El monto debe ser mayor a $0');
    } else if (monto > saldo) {
      this.error.set(`El monto no puede exceder el saldo pendiente ($${this.formatCurrency(saldo)})`);
    } else {
      this.error.set('');
    }
  }
  
  /**
   * Registra el pago
   */
  async registrarPago(): Promise<void> {
    if (!this.esMontoValido()) {
      this.error.set('Verifique el monto ingresado');
      return;
    }
    
    const p = this.prestamo();
    if (!p) return;
    
    this.procesando.set(true);
    this.error.set('');
    
    try {
      const nuevoPago: IPago = {
        id: `PAG-${Date.now()}`, // Temporal, el servicio genera el ID real
        prestamoId: p.id,
        valor: this.montoAPagar(),
        fechaPago: this.fechaPago(),
      };
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Registrar pago
      this.pagoService.registrarPago(nuevoPago).subscribe({
        next: (pagoRegistrado) => {
          this.procesando.set(false);
          this.pagoRegistrado.emit(pagoRegistrado);
          
          // Cerrar modal después de 1 segundo
          setTimeout(() => {
            this.cerrar();
          }, 1000);
        },
        error: (error) => {
          console.error('Error al registrar pago:', error);
          this.error.set('Error al registrar el pago. Intente nuevamente.');
          this.procesando.set(false);
        }
      });
    } catch (error) {
      this.error.set('Error inesperado al procesar el pago');
      this.procesando.set(false);
    }
  }
  
  /**
   * Cierra el modal
   */
  cerrar(): void {
    this.modalCerrado.emit();
    this.prestamo.set(null);
    this.resetearFormulario();
  }
  
  /**
   * Maneja el click en el overlay
   */
  cerrarConOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cerrar();
    }
  }
  
  /**
   * Formatea un número como moneda
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  
  /**
   * Formatea una fecha
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  }
}
```

### **Template HTML (Estructura Completa)**

```html
@if (prestamo()) {
  <div class="modal-overlay" (click)="cerrarConOverlay($event)">
    <div class="modal-container" @fadeSlide>
      <!-- HEADER -->
      <div class="modal-header">
        <h2 class="modal-title">
          <i class="bi bi-cash-stack"></i>
          Registrar Pago
        </h2>
        <button class="btn-close" (click)="cerrar()" [disabled]="procesando()">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <!-- BODY -->
      <div class="modal-body">
        <!-- Información del Cliente -->
        <div class="cliente-info">
          <div class="avatar-modal">
            {{ (prestamo()!.cliente?.nombre || 'S')[0].toUpperCase() }}
          </div>
          <div>
            <h3 class="cliente-nombre">{{ prestamo()!.cliente?.nombre }}</h3>
            <span class="prestamo-id">{{ prestamo()!.id }}</span>
          </div>
        </div>

        <!-- Resumen del Préstamo -->
        <div class="prestamo-resumen">
          <div class="resumen-item">
            <span class="label">Total Préstamo:</span>
            <span class="value">{{ formatCurrency(prestamo()!.valorTotal) }}</span>
          </div>
          <div class="resumen-item destacado">
            <span class="label">Saldo Pendiente:</span>
            <span class="value primary">{{ formatCurrency(saldoPendiente()) }}</span>
          </div>
          <div class="resumen-item">
            <span class="label">Cuotas Pagadas:</span>
            <span class="value">{{ prestamo()!.estadisticas?.cuotasPagadas || 0 }} / {{ prestamo()!.cantidadCuotas }}</span>
          </div>
          <div class="resumen-item">
            <span class="label">Valor por Cuota:</span>
            <span class="value">{{ formatCurrency(prestamo()!.valorCuota) }}</span>
          </div>
        </div>

        <!-- Tipo de Pago -->
        <div class="seccion-pago">
          <label class="seccion-label">Seleccione el tipo de pago:</label>

          <!-- Opción 1: Cuota Completa -->
          <div 
            class="radio-option" 
            [class.selected]="tipoPago() === 'cuota-completa'"
            (click)="seleccionarTipoPago('cuota-completa')">
            <div class="radio-header">
              <input 
                type="radio" 
                name="tipoPago" 
                [checked]="tipoPago() === 'cuota-completa'"
                (change)="seleccionarTipoPago('cuota-completa')">
              <span class="radio-label">Pagar 1 Cuota Completa</span>
            </div>
            <div class="radio-detail">
              {{ formatCurrency(Math.min(prestamo()!.valorCuota, saldoPendiente())) }}
            </div>
          </div>

          <!-- Opción 2: Pago Personalizado -->
          <div 
            class="radio-option" 
            [class.selected]="tipoPago() === 'personalizado'"
            (click)="seleccionarTipoPago('personalizado')">
            <div class="radio-header">
              <input 
                type="radio" 
                name="tipoPago" 
                [checked]="tipoPago() === 'personalizado'"
                (change)="seleccionarTipoPago('personalizado')">
              <span class="radio-label">Pago Personalizado</span>
            </div>
            @if (tipoPago() === 'personalizado') {
              <div class="input-group">
                <span class="input-prefix">$</span>
                <input 
                  type="number" 
                  class="input-monto"
                  [class.error]="error()"
                  placeholder="Ingrese el monto"
                  [value]="montoPersonalizado()"
                  (input)="montoPersonalizado.set(+$any($event.target).value); validarMontoPersonalizado()"
                  min="1"
                  [max]="saldoPendiente()">
              </div>
            }
          </div>

          <!-- Opción 3: Múltiples Cuotas -->
          <div 
            class="radio-option" 
            [class.selected]="tipoPago() === 'multiple'"
            (click)="seleccionarTipoPago('multiple')">
            <div class="radio-header">
              <input 
                type="radio" 
                name="tipoPago" 
                [checked]="tipoPago() === 'multiple'"
                (change)="seleccionarTipoPago('multiple')">
              <span class="radio-label">Pagar Múltiples Cuotas</span>
            </div>
            @if (tipoPago() === 'multiple') {
              <div class="input-group">
                <label>Cantidad de cuotas:</label>
                <select 
                  class="select-cuotas"
                  [value]="cantidadCuotas()"
                  (change)="cantidadCuotas.set(+$any($event.target).value)">
                  @for (n of [1,2,3,4,5,6,7,8,9,10]; track n) {
                    <option [value]="n">{{ n }} cuota{{ n > 1 ? 's' : '' }}</option>
                  }
                </select>
                <span class="monto-calculado">
                  = {{ formatCurrency(montoAPagar()) }}
                </span>
              </div>
            }
          </div>
        </div>

        <!-- Fecha de Pago -->
        <div class="campo-fecha">
          <label class="campo-label">Fecha de Pago:</label>
          <input 
            type="date" 
            class="input-fecha"
            [value]="fechaPago() | date:'yyyy-MM-dd'"
            (change)="fechaPago.set(new Date($any($event.target).value))"
            [max]="new Date() | date:'yyyy-MM-dd'">
        </div>

        <!-- Resumen del Pago -->
        <div class="resumen-pago">
          <div class="resumen-fila">
            <span class="resumen-label">
              <i class="bi bi-cash-coin"></i> Monto a Pagar:
            </span>
            <span class="monto-destacado">{{ formatCurrency(montoAPagar()) }}</span>
          </div>
          <div class="resumen-fila">
            <span class="resumen-label">
              <i class="bi bi-wallet2"></i> Nuevo Saldo:
            </span>
            <span class="saldo-nuevo">{{ formatCurrency(nuevoSaldo()) }}</span>
          </div>
        </div>

        <!-- Mensajes de Error -->
        @if (error()) {
          <div class="alert-error">
            <i class="bi bi-exclamation-triangle-fill"></i>
            {{ error() }}
          </div>
        }

        <!-- Mensaje de Éxito (durante procesamiento) -->
        @if (procesando()) {
          <div class="alert-success">
            <div class="spinner-small"></div>
            Registrando pago...
          </div>
        }
      </div>

      <!-- FOOTER -->
      <div class="modal-footer">
        <button 
          class="btn-secondary" 
          (click)="cerrar()"
          [disabled]="procesando()">
          Cancelar
        </button>
        <button 
          class="btn-primary" 
          (click)="registrarPago()"
          [disabled]="!esMontoValido() || procesando()">
          @if (procesando()) {
            <span class="spinner-btn"></span>
          } @else {
            <i class="bi bi-check-circle"></i>
          }
          Registrar Pago
        </button>
      </div>
    </div>
  </div>
}
```

### **Servicio: Método de Registro**

Actualizar `prestamo-mock.service.ts`:

```typescript
/**
 * Registra un nuevo pago para un préstamo
 */
registrarPago(pago: Omit<IPago, 'id'>): Observable<IPago> {
  // Generar ID único
  const nuevoPago: IPago = {
    ...pago,
    id: `PAG-${String(this.nextPagoId++).padStart(3, '0')}`,
  };

  // Validar que el préstamo exista
  const prestamo = this.prestamos.find(p => p.id === pago.prestamoId);
  if (!prestamo) {
    return throwError(() => new Error('Préstamo no encontrado'));
  }

  // Validar que el monto no exceda el saldo
  const pagosDelPrestamo = this.pagos.filter(p => p.prestamoId === pago.prestamoId);
  const totalPagado = pagosDelPrestamo.reduce((sum, p) => sum + p.valor, 0);
  const saldoPendiente = prestamo.valorTotal - totalPagado;

  if (pago.valor > saldoPendiente) {
    return throwError(() => new Error('El monto excede el saldo pendiente'));
  }

  // Agregar el pago
  this.pagos.push(nuevoPago);

  // Simular delay de red
  return of(nuevoPago).pipe(delay(300));
}
```

---

## 🔄 Flujo de Integración

### **Paso 1: Crear el Componente Modal**
```bash
# Ejecutar en terminal
ng generate component features/prestamos/components/registro-pago-modal --standalone --skip-tests
```

### **Paso 2: Integrar en PrestamosComponent**

```typescript
// prestamos.component.ts
import { RegistroPagoModalComponent } from './registro-pago-modal/registro-pago-modal.component';

export class PrestamosComponent {
  mostrarModalPago = signal<boolean>(false);
  prestamoSeleccionado = signal<PrestamoConCliente | null>(null);
  
  abrirModalPago(prestamo: PrestamoConCliente): void {
    this.prestamoSeleccionado.set(prestamo);
    this.mostrarModalPago.set(true);
  }
  
  cerrarModalPago(): void {
    this.mostrarModalPago.set(false);
    this.prestamoSeleccionado.set(null);
  }
  
  onPagoRegistrado(pago: IPago): void {
    // Recargar datos
    this.cargarDatos();
    
    // Mostrar notificación
    this.mostrarMensaje('Pago registrado exitosamente', 'success');
    
    // Cerrar modal
    this.cerrarModalPago();
  }
}
```

```html
<!-- prestamos.component.html -->
<!-- Dentro de cada tarjeta, actualizar el botón "Pagar" -->
<button 
  class="btn-simple btn-pay" 
  (click)="abrirModalPago(prestamo)"
  title="Registrar pago">
  <i class="bi bi-cash-stack"></i>
  <span>Pagar</span>
</button>

<!-- Al final del template -->
@if (mostrarModalPago() && prestamoSeleccionado()) {
  <app-registro-pago-modal
    [prestamo]="prestamoSeleccionado()!"
    (pagoRegistrado)="onPagoRegistrado($event)"
    (modalCerrado)="cerrarModalPago()">
  </app-registro-pago-modal>
}
```

### **Paso 3: Integrar en PrestamoDetalleComponent**

Similar a PrestamosComponent, agregar el modal y conectar el botón "Registrar Pago" en la pestaña de Información.

---

## ✅ Validaciones y Casos de Uso

### **Validaciones de Negocio:**
1. ✅ Monto mínimo: $1
2. ✅ Monto máximo: saldo pendiente
3. ✅ Fecha mínima: fecha del préstamo
4. ✅ Fecha máxima: fecha actual
5. ✅ Préstamo debe existir
6. ✅ Préstamo no debe estar completado
7. ✅ No permitir pagos negativos
8. ✅ Redondeo correcto de decimales

### **Casos de Prueba:**

**Caso 1: Pago de Cuota Completa**
- Préstamo: PRE-003 (6 cuotas de $95,833)
- Saldo: $575,000
- Acción: Seleccionar "1 Cuota Completa"
- Resultado: Monto = $95,833, Nuevo Saldo = $479,167

**Caso 2: Pago Personalizado Válido**
- Préstamo: PRE-002 (Saldo: $2,200,000)
- Acción: Ingresar $500,000
- Resultado: Monto = $500,000, Nuevo Saldo = $1,700,000

**Caso 3: Pago Personalizado Inválido**
- Préstamo: PRE-003 (Saldo: $575,000)
- Acción: Ingresar $600,000
- Resultado: Error "El monto no puede exceder el saldo pendiente"

**Caso 4: Múltiples Cuotas**
- Préstamo: PRE-001 (Cuota: $46,154, Saldo: $830,772)
- Acción: Seleccionar 3 cuotas
- Resultado: Monto = $138,462, Nuevo Saldo = $692,310

**Caso 5: Última Cuota (Saldo < Valor Cuota)**
- Préstamo con saldo de $50,000 y cuota de $95,833
- Acción: Seleccionar "1 Cuota Completa"
- Resultado: Monto = $50,000 (ajustado), Nuevo Saldo = $0

---

## 🎨 Animaciones

```typescript
// En el componente
import { trigger, transition, style, animate } from '@angular/animations';

export const fadeSlide = trigger('fadeSlide', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-20px)' }),
    animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
  ])
]);
```

---

## 📱 Responsive Design

### **Mobile (< 640px):**
- Modal ocupa 95% del ancho
- Stack vertical para todos los elementos
- Botones ocupan ancho completo
- Font-size reducido (14px)

### **Tablet (640px - 1024px):**
- Modal 500px de ancho
- Layout optimizado
- Botones lado a lado

### **Desktop (> 1024px):**
- Modal 600px de ancho máximo
- Animaciones más suaves
- Hover effects completos

---

## 🐛 Manejo de Errores

```typescript
// Posibles errores y respuestas
const errores = {
  'PRESTAMO_NO_ENCONTRADO': 'El préstamo seleccionado no existe',
  'MONTO_INVALIDO': 'El monto ingresado no es válido',
  'MONTO_EXCEDE_SALDO': 'El monto excede el saldo pendiente',
  'FECHA_INVALIDA': 'La fecha seleccionada no es válida',
  'PRESTAMO_COMPLETADO': 'Este préstamo ya está completado',
  'ERROR_RED': 'Error de conexión. Intente nuevamente',
};
```

---

## 🚀 Mejoras Futuras (Opcionales)

1. **Método de Pago:** Agregar campo para efectivo/transferencia/cheque
2. **Comprobante:** Opción para adjuntar foto del comprobante
3. **Notas:** Campo de texto para observaciones
4. **Descuento:** Permitir aplicar descuentos por pronto pago
5. **Mora:** Calcular y mostrar interés por mora
6. **Recibo:** Generar PDF del recibo de pago
7. **WhatsApp:** Enviar confirmación por WhatsApp al cliente
8. **Historial:** Mostrar últimos 3 pagos en el modal
9. **Calculadora:** Agregar mini calculadora integrada
10. **Confirmación:** Dialog de confirmación antes de registrar

---

## 📊 Criterios de Aceptación

- [ ] El modal se abre correctamente desde lista y detalle
- [ ] Se muestran todos los datos del préstamo correctamente
- [ ] Las 3 opciones de pago funcionan correctamente
- [ ] Las validaciones impiden montos inválidos
- [ ] El cálculo del nuevo saldo es correcto
- [ ] El pago se registra en el servicio mock
- [ ] Las estadísticas se actualizan automáticamente
- [ ] El modal se cierra después de registrar
- [ ] Los mensajes de error son claros
- [ ] El diseño es responsive
- [ ] Las animaciones son suaves
- [ ] El código TypeScript no tiene errores
- [ ] Los estilos son consistentes con la aplicación
- [ ] El componente es reutilizable

---

## 🎯 Resultado Final Esperado

Un **modal elegante, funcional y user-friendly** que:
- ✅ Facilita el registro rápido de pagos
- ✅ Previene errores con validaciones inteligentes
- ✅ Proporciona feedback visual claro
- ✅ Se integra perfectamente con el diseño existente
- ✅ Es totalmente responsive
- ✅ Mejora significativamente la experiencia del usuario

---

**Fecha de Creación:** 15 de Octubre de 2025  
**Versión:** 1.0  
**Autor:** Sistema de Gestión de Cobros - Angular v19
