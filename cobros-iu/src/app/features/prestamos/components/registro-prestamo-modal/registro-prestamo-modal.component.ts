import { Component, inject, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AbstractPrestamoService } from '../../../core/services/abstract-prestamo.service';
import { AbstractClienteService } from '../../../core/services/abstract-cliente.service';
import type { IPrestamo, ICliente, FrecuenciaPago } from '../../../core/models';

/**
 * Componente modal para registrar nuevos préstamos.
 * Permite capturar todos los datos necesarios con validaciones y cálculos automáticos.
 */
@Component({
  selector: 'app-registro-prestamo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-prestamo-modal.component.html',
  styleUrl: './registro-prestamo-modal.component.scss',
})
export class RegistroPrestamoModalComponent {
  private prestamoService = inject(AbstractPrestamoService);
  private clienteService = inject(AbstractClienteService);

  // Outputs
  @Output() prestamoRegistrado = new EventEmitter<IPrestamo>();
  @Output() modalCerrado = new EventEmitter<void>();

  // Signals - Datos del formulario
  clienteId = signal<string>('');
  fechaPrestamo = signal<Date>(new Date());
  fechaFinal = signal<Date | null>(null);
  valorPrestado = signal<number>(0);
  valorTotal = signal<number>(0);
  frecuenciaPago = signal<FrecuenciaPago>('diario');

  // Signals - Datos auxiliares
  clientes = signal<ICliente[]>([]);
  cargandoClientes = signal<boolean>(false);

  // Signals - Estado del modal
  visible = signal<boolean>(false);
  procesando = signal<boolean>(false);
  error = signal<string>('');
  exito = signal<boolean>(false);

  // Computed: Interés proyectado
  interesProyectado = computed(() => {
    return this.valorTotal() - this.valorPrestado();
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

  // Computed: Validación de cliente
  errorCliente = computed(() => {
    return this.clienteId().length === 0 ? 'Debe seleccionar un cliente' : '';
  });

  // Computed: Validación de fecha final
  errorFechaFinal = computed(() => {
    const inicio = this.fechaPrestamo();
    const fin = this.fechaFinal();

    if (!fin) return 'La fecha final es obligatoria';
    if (fin <= inicio) return 'La fecha final debe ser posterior a la fecha de préstamo';

    return '';
  });

  // Computed: Validación de valores
  errorValores = computed(() => {
    const prestado = this.valorPrestado();
    const total = this.valorTotal();

    if (prestado <= 0) return 'El valor prestado debe ser mayor a $0';
    if (total <= 0) return 'El valor total debe ser mayor a $0';
    if (total < prestado) return 'El valor total no puede ser menor al valor prestado';

    return '';
  });

  // Computed: Validación de cuotas
  errorCuotas = computed(() => {
    const cuotas = this.cantidadCuotas();
    return cuotas <= 0 ? 'Configure las fechas y frecuencia correctamente' : '';
  });

  // Computed: Validación completa del formulario
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

  // Fecha máxima para el date picker (hoy)
  fechaMaxima = new Date().toISOString().split('T')[0];

  // Opciones de frecuencia de pago
  frecuencias: Array<{ value: FrecuenciaPago; label: string; icon: string }> = [
    { value: 'diario', label: 'Diario', icon: 'bi-calendar-day' },
    { value: 'semanal', label: 'Semanal', icon: 'bi-calendar-week' },
    { value: 'quincenal', label: 'Quincenal', icon: 'bi-calendar2-range' },
    { value: 'mensual', label: 'Mensual', icon: 'bi-calendar-month' }
  ];

  /**
   * Abre el modal y carga la lista de clientes
   */
  /**
   * Abre el modal para registrar un nuevo préstamo
   * @param clienteIdPreseleccionado - ID del cliente para preseleccionar (opcional)
   */
  abrir(clienteIdPreseleccionado?: string): void {
    this.visible.set(true);
    this.cargarClientes();
    this.resetearFormulario();
    
    // Preseleccionar cliente si se proporciona
    if (clienteIdPreseleccionado) {
      this.clienteId.set(clienteIdPreseleccionado);
    }
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

    if (diasTotales <= 0) return 0;

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

    this.prestamoService.create(nuevoPrestamo as IPrestamo).subscribe({
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
    this.frecuenciaPago.set('diario');
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
}
