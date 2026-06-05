import { Component, inject, signal, computed, Output, EventEmitter, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MonedaInputDirective } from '../../../../shared/directives';
import { AbstractPrestamoService } from '../../../core/services/abstract-prestamo.service';
import type { IPrestamo, ICliente, FrecuenciaPago } from '../../../core/models';

/**
 * Componente modal para registrar nuevos préstamos.
 * Permite capturar todos los datos necesarios con validaciones y cálculos automáticos.
 */
@Component({
  selector: 'app-registro-prestamo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MonedaInputDirective],
  templateUrl: './registro-prestamo-modal.component.html',
  styleUrl: './registro-prestamo-modal.component.scss',
})
export class RegistroPrestamoModalComponent {
  private prestamoService = inject(AbstractPrestamoService);
  private sanitizer = inject(DomSanitizer);
  @ViewChild('postPrestamoAcciones') postPrestamoAccionesRef?: ElementRef<HTMLElement>;

  // Outputs
  @Output() prestamoRegistrado = new EventEmitter<IPrestamo>();
  @Output() modalCerrado = new EventEmitter<void>();

  // Cliente que llega siempre desde el contexto externo
  clienteActual = signal<ICliente | null>(null);

  // Signals - Datos del formulario
  fechaPrestamo = signal<Date>(new Date());
  valorPrestado = signal<number>(0);
  valorInteres = signal<number>(0);
  valorCuota = signal<number>(0);
  frecuenciaPago = signal<FrecuenciaPago>('diario');

  // Computed: Cantidad de cuotas derivada de total ÷ cuota
  cantidadCuotas = computed(() => {
    const total = this.valorTotal();
    const cuota = this.valorCuota();
    if (cuota <= 0 || total <= 0 || cuota > total) return 0;
    return Math.ceil(total / cuota);
  });

  // Computed: Valor de la última cuota (puede diferir si no divide exacto)
  valorUltimaCuota = computed(() => {
    const n = this.cantidadCuotas();
    if (n <= 0) return 0;
    return this.valorTotal() - (n - 1) * this.valorCuota();
  });

  // Signals - Estado del modal
  visible = signal<boolean>(false);
  procesando = signal<boolean>(false);
  error = signal<string>('');
  exito = signal<boolean>(false);
  prestamoCreado = signal<IPrestamo | null>(null);

  // Computed: Valor total derivado
  valorTotal = computed(() => this.valorPrestado() + this.valorInteres());

  // Computed: Fecha final derivada
  fechaFinal = computed(() => this.calcularFechaFinal(
    this.fechaPrestamo(), this.cantidadCuotas(), this.frecuenciaPago()
  ));

  // Computed: Último pago con valor diferente (no divide exacto)
  descuadreExacto = computed(() => {
    const n = this.cantidadCuotas();
    return n > 0 && this.valorUltimaCuota() !== this.valorCuota();
  });

  // Computed: Validación de cliente — siempre válido (viene garantizado)
  errorCliente = computed(() => '');

  // Computed: Validación de fecha final
  errorFechaFinal = computed(() => {
    const inicio = this.fechaPrestamo();
    const fin = this.fechaFinal();
    if (!fin) return 'No se pudo calcular la fecha final';
    if (fin <= inicio) return 'La fecha final debe ser posterior a la fecha de préstamo';
    return '';
  });

  // Computed: Validación de valores
  errorValores = computed(() => {
    const prestado = this.valorPrestado();
    const interes = this.valorInteres();
    const cuota = this.valorCuota();
    if (prestado <= 0) return 'El valor prestado debe ser mayor a $0';
    if (interes < 0) return 'El valor del interés no puede ser negativo';
    if (cuota <= 0) return 'El valor de la cuota debe ser mayor a $0';
    if (cuota > this.valorTotal()) return 'La cuota no puede ser mayor al total a pagar';
    return '';
  });

  // Computed: Validación de cuotas
  errorCuotas = computed(() => {
    return this.cantidadCuotas() <= 0 ? 'Ingrese valor prestado, interés y cuota para calcular los períodos' : '';
  });

  // Computed: Validación completa del formulario
  esFormularioValido = computed(() => {
    return (
      this.clienteActual() !== null &&
      !this.errorValores() &&
      !this.errorCuotas() &&
      !this.errorFechaFinal() &&
      this.frecuenciaPago().length > 0
    );
  });

  // Fecha máxima para el date picker (hoy)
  fechaMaxima = new Date().toISOString().split('T')[0];

  whatsappLink = computed((): SafeUrl | null => {
    const cliente = this.clienteActual();
    const prestamo = this.prestamoCreado();

    if (!cliente?.telefono || !prestamo) return null;

    const telefonoLimpio = cliente.telefono.replace(/\D/g, '');
    if (!telefonoLimpio) return null;

    const telefono = `57${telefonoLimpio}`;
    const nombre = cliente.nombre ?? 'cliente';
    const valorPrestamo = this.formatCurrency(prestamo.valorPrestado);
    const totalPagar = this.formatCurrency(prestamo.valorTotal);
    const cuota = this.formatCurrency(prestamo.valorCuota);
    const fecha = this.formatDate(new Date(prestamo.fechaPrestamo));
    const fechaFinal = this.formatDate(new Date(prestamo.fechaFinal));
    const clave = cliente.id;
    const linkConsulta = clave
      ? `\n\n🔗 Consultá tu saldo:\n${window.location.origin}/consulta/${clave}`
      : '';

    const msg = `✅ Hola ${nombre}, registramos tu préstamo de *${valorPrestamo}* (${fecha}).\nTotal a pagar: *${totalPagar}* en ${prestamo.cantidadCuotas} cuotas de ${cuota}, hasta ${fechaFinal}.${linkConsulta}\n\n¡Gracias por confiar en nosotros! 🙌`;
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`;
    return this.sanitizer.bypassSecurityTrustUrl(url);
  });

  // Opciones de frecuencia de pago
  frecuencias: Array<{ value: FrecuenciaPago; label: string; icon: string }> = [
    { value: 'diario', label: 'Diario', icon: 'bi-calendar-day' },
    { value: 'semanal', label: 'Semanal', icon: 'bi-calendar-week' },
    { value: 'quincenal', label: 'Quincenal', icon: 'bi-calendar2-range' },
    { value: 'mensual', label: 'Mensual', icon: 'bi-calendar-month' }
  ];

  /**
   * Abre el modal con un cliente ya determinado
   */
  abrir(cliente: ICliente): void {
    this.clienteActual.set(cliente);
    this.visible.set(true);
    this.resetearFormulario();
    // Asegurar que el overlay del modal sea visible independientemente del scroll actual
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }

  /**
   * Calcula la fecha final a partir de fecha inicio, cantidad de períodos y frecuencia
   */
  calcularFechaFinal(inicio: Date, cantidad: number, frecuencia: FrecuenciaPago): Date | null {
    if (!inicio || cantidad <= 0 || !frecuencia) return null;
    const ms = inicio.getTime();
    let dias: number;
    switch (frecuencia) {
      case 'diario':    dias = cantidad; break;
      case 'semanal':   dias = cantidad * 7; break;
      case 'quincenal': dias = cantidad * 15; break;
      case 'mensual':   dias = cantidad * 30; break;
      default: return null;
    }
    return new Date(ms + dias * 24 * 60 * 60 * 1000);
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
      clienteId: this.clienteActual()!.id,
      fechaPrestamo: this.fechaPrestamo(),
      fechaFinal: this.fechaFinal()!,
      valorPrestado: this.valorPrestado(),
      valorTotal: this.valorTotal(),
      interesProyectado: this.valorInteres(),
      frecuenciaPago: this.frecuenciaPago(),
      cantidadCuotas: this.cantidadCuotas(),
      valorCuota: this.valorCuota()
    };

    this.prestamoService.create(nuevoPrestamo as IPrestamo).subscribe({
      next: (prestamo) => {
        this.procesando.set(false);
        this.prestamoCreado.set(prestamo);
        this.exito.set(true);
        this.prestamoRegistrado.emit(prestamo);
        this.desplazarAHitoPostPrestamo();
      },
      error: (err) => {
        this.error.set('Error al registrar préstamo: ' + err.message);
        this.procesando.set(false);
      }
    });
  }

  /**
   * Abre el mini-formulario inline para crear un nuevo cliente.
   * Carga las zonas de forma lazy (solo cuando se necesita).
   */
  abrirFormNuevoCliente(): void {}

  /**
   * Cierra el modal y resetea el estado
   */
  cerrar(): void {
    this.visible.set(false);
    this.modalCerrado.emit();
    setTimeout(() => {
      this.clienteActual.set(null);
      this.resetearFormulario();
      this.exito.set(false);
      this.procesando.set(false);
      this.error.set('');
      this.prestamoCreado.set(null);
    }, 300);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible()) this.cerrar();
  }

  /**
   * Resetea el formulario a valores por defecto
   */
  resetearFormulario(): void {
    this.fechaPrestamo.set(new Date());
    this.valorPrestado.set(0);
    this.valorInteres.set(0);
    this.valorCuota.set(0);
    this.frecuenciaPago.set('diario');
    this.error.set('');
    this.prestamoCreado.set(null);
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

  private desplazarAHitoPostPrestamo(): void {
    if (!this.visible() || !this.exito()) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const objetivo = this.postPrestamoAccionesRef?.nativeElement;
        if (!objetivo || this.estaVisibleEnViewport(objetivo)) return;

        objetivo.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      });
    });
  }

  private estaVisibleEnViewport(elemento: HTMLElement): boolean {
    const rect = elemento.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= viewportHeight &&
      rect.right <= viewportWidth
    );
  }
}
