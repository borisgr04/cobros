import { Component, inject, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AbstractPrestamoService } from '../../../core/services/abstract-prestamo.service';
import { AbstractClienteService } from '../../../core/services/abstract-cliente.service';
import type { IPrestamo, ICliente, FrecuenciaPago } from '../../../core/models';
import type { PrestamoConCliente } from '../../services';

/**
 * Componente modal para editar préstamos existentes.
 * Solo permite edición si el préstamo NO tiene pagos registrados.
 */
@Component({
  selector: 'app-edicion-prestamo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edicion-prestamo-modal.component.html',
  styleUrl: './edicion-prestamo-modal.component.scss',
})
export class EdicionPrestamoModalComponent {
  private prestamoService = inject(AbstractPrestamoService);
  private clienteService = inject(AbstractClienteService);

  // Outputs
  @Output() prestamoActualizado = new EventEmitter<IPrestamo>();
  @Output() modalCerrado = new EventEmitter<void>();

  // Signals - Datos del préstamo original
  prestamoOriginal = signal<PrestamoConCliente | null>(null);
  
  // Signals - Datos editables
  clienteId = signal<string>('');
  fechaPrestamo = signal<Date>(new Date());
  fechaFinal = signal<Date | null>(null);
  valorPrestado = signal<number>(0);
  valorTotal = signal<number>(0);
  frecuenciaPago = signal<FrecuenciaPago>('semanal');

  // Signals - Datos auxiliares
  clientes = signal<ICliente[]>([]);
  cargandoClientes = signal<boolean>(false);

  // Signals - Estado del modal
  visible = signal<boolean>(false);
  procesando = signal<boolean>(false);
  error = signal<string>('');
  exito = signal<boolean>(false);

  // Computed: Validación de cambios
  hayDatosModificados = computed(() => {
    const original = this.prestamoOriginal();
    if (!original) return false;

    return (
      this.clienteId() !== original.clienteId ||
      this.fechaPrestamo().getTime() !== new Date(original.fechaPrestamo).getTime() ||
      this.fechaFinal()?.getTime() !== new Date(original.fechaFinal).getTime() ||
      this.valorPrestado() !== original.valorPrestado ||
      this.valorTotal() !== original.valorTotal ||
      this.frecuenciaPago() !== original.frecuenciaPago
    );
  });

  // Computed: Interés proyectado
  interesProyectado = computed(() => {
    return this.valorTotal() - this.valorPrestado();
  });

  // Computed: Porcentaje de interés
  porcentajeInteres = computed(() => {
    const prestado = this.valorPrestado();
    const interes = this.interesProyectado();
    return prestado > 0 ? ((interes / prestado) * 100).toFixed(1) : '0.0';
  });

  // Computed: Cantidad de cuotas
  cantidadCuotas = computed(() => {
    return this.calcularCantidadCuotas();
  });

  // Computed: Valor de cada cuota
  valorCuota = computed(() => {
    const total = this.valorTotal();
    const cuotas = this.cantidadCuotas();
    return cuotas > 0 ? Math.round(total / cuotas) : 0;
  });

  // Computed: Fecha máxima para fecha de préstamo (hoy)
  fechaMaxima = computed(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Computed: Validaciones
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

    return '';
  });

  errorCuotas = computed(() => {
    const cuotas = this.cantidadCuotas();
    if (cuotas < 1) return 'Las fechas y frecuencia deben generar al menos 1 cuota';
    return '';
  });

  esFormularioValido = computed(() => {
    return (
      !this.errorCliente() &&
      !this.errorFechaFinal() &&
      !this.errorValores() &&
      !this.errorCuotas() &&
      this.cantidadCuotas() > 0
    );
  });

  // Opciones de frecuencia
  frecuencias: Array<{ value: FrecuenciaPago; label: string; icon: string }> = [
    { value: 'diario', label: 'Diario', icon: 'bi-calendar-day' },
    { value: 'semanal', label: 'Semanal', icon: 'bi-calendar-week' },
    { value: 'quincenal', label: 'Quincenal', icon: 'bi-calendar2-range' },
    { value: 'mensual', label: 'Mensual', icon: 'bi-calendar-month' }
  ];

  /**
   * Abre el modal con los datos del préstamo a editar
   */
  abrir(prestamo: PrestamoConCliente): void {
    this.prestamoOriginal.set(prestamo);
    this.cargarDatosDelPrestamo(prestamo);
    this.visible.set(true);
    this.cargarClientes();
    this.error.set('');
    this.exito.set(false);
  }

  /**
   * Carga los datos del préstamo en los signals
   */
  private cargarDatosDelPrestamo(prestamo: PrestamoConCliente): void {
    this.clienteId.set(prestamo.clienteId);
    this.fechaPrestamo.set(new Date(prestamo.fechaPrestamo));
    this.fechaFinal.set(new Date(prestamo.fechaFinal));
    this.valorPrestado.set(prestamo.valorPrestado);
    this.valorTotal.set(prestamo.valorTotal);
    this.frecuenciaPago.set(prestamo.frecuenciaPago);
  }

  /**
   * Carga todos los clientes activos
   */
  cargarClientes(): void {
    this.cargandoClientes.set(true);
    this.clienteService.getAll().subscribe({
      next: (clientes) => {
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

    if (!fin) return 0;

    const diffTime = fin.getTime() - inicio.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 0;

    switch (frecuencia) {
      case 'diario': return diffDays;
      case 'semanal': return Math.ceil(diffDays / 7);
      case 'quincenal': return Math.ceil(diffDays / 15);
      case 'mensual': return Math.ceil(diffDays / 30);
      default: return 0;
    }
  }

  /**
   * Actualiza el préstamo en el sistema
   */
  actualizarPrestamo(): void {
    if (!this.esFormularioValido()) {
      this.error.set('Por favor complete todos los campos requeridos correctamente');
      return;
    }

    if (!this.hayDatosModificados()) {
      this.error.set('No se han realizado cambios en el préstamo');
      return;
    }

    const original = this.prestamoOriginal();
    if (!original) return;

    this.procesando.set(true);
    this.error.set('');

    const prestamoActualizado: IPrestamo = {
      id: original.id,
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

    this.prestamoService.update(original.id, prestamoActualizado).subscribe({
      next: (prestamo) => {
        this.exito.set(true);
        this.prestamoActualizado.emit(prestamo);

        setTimeout(() => {
          this.cerrar();
        }, 2000);
      },
      error: (err) => {
        this.error.set('Error al actualizar préstamo: ' + err.message);
        this.procesando.set(false);
      }
    });
  }

  /**
   * Cierra el modal con confirmación si hay cambios
   */
  cerrar(): void {
    if (this.hayDatosModificados() && !this.exito() && !this.procesando()) {
      if (!confirm('¿Descartar cambios sin guardar?')) {
        return;
      }
    }

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
   * Resetea el formulario
   */
  private resetearFormulario(): void {
    this.prestamoOriginal.set(null);
    this.clienteId.set('');
    this.fechaPrestamo.set(new Date());
    this.fechaFinal.set(null);
    this.valorPrestado.set(0);
    this.valorTotal.set(0);
    this.frecuenciaPago.set('semanal');
  }

  /**
   * Selecciona una frecuencia de pago
   */
  seleccionarFrecuencia(frecuencia: FrecuenciaPago): void {
    this.frecuenciaPago.set(frecuencia);
  }

  /**
   * Handler para cambio de fecha de préstamo
   */
  onFechaPrestamoChange(value: string): void {
    if (value) {
      this.fechaPrestamo.set(new Date(value));
    }
  }

  /**
   * Handler para cambio de fecha final
   */
  onFechaFinalChange(value: string): void {
    if (value) {
      this.fechaFinal.set(new Date(value));
    }
  }

  /**
   * Formatea un valor como moneda COP
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
  formatDate(date: Date | null): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('es-CO').format(date);
  }
}
