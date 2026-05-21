import { Component, inject, signal, computed, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AbstractPagoService } from '../../../core/services/abstract-pago.service';
import type { PrestamoConCliente } from '../../services/prestamo.service';
import type { IPago } from '../../../core/models';

/**
 * Componente modal para registrar pagos de préstamos.
 * Permite diferentes tipos de pago: cuota completa, parcial o múltiples cuotas.
 */
@Component({
  selector: 'app-registro-pago-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-pago-modal.component.html',
  styleUrl: './registro-pago-modal.component.scss',
})
export class RegistroPagoModalComponent {
  private pagoService = inject(AbstractPagoService);

  // Outputs
  @Output() pagoRegistrado = new EventEmitter<IPago>();
  @Output() modalCerrado = new EventEmitter<void>();

  // Signals de estado
  prestamo         = signal<PrestamoConCliente | null>(null);
  modoLibre        = signal<boolean>(false);
  montoPersonalizado = signal<number>(0);
  cantidadCuotas   = signal<number>(1);
  fechaPago        = signal<Date>(new Date());
  procesando       = signal<boolean>(false);
  error            = signal<string>('');
  visible          = signal<boolean>(false);
  pagoExitoso      = signal<IPago | null>(null);
  saldoPostPago    = signal<number>(0);

  // Computed: saldo pendiente
  saldoPendiente = computed(() => {
    const p = this.prestamo();
    return p?.estadisticas?.totalPorCobrar || 0;
  });

  // Computed: monto a pagar
  montoAPagar = computed(() => {
    const p = this.prestamo();
    if (!p) return 0;
    if (this.modoLibre()) {
      return Math.min(this.montoPersonalizado(), this.saldoPendiente());
    }
    return Math.min(this.cantidadCuotas() * p.valorCuota, this.saldoPendiente());
  });

  // Computed: nuevo saldo después del pago
  nuevoSaldo = computed(() => {
    return Math.max(0, this.saldoPendiente() - this.montoAPagar());
  });

  // Computed: validación del monto
  esMontoValido = computed(() => {
    const monto = this.montoAPagar();
    const saldo = this.saldoPendiente();
    return monto > 0 && monto <= saldo;
  });

  // Computed: cuotas restantes por pagar
  cuotasRestantes = computed(() => {
    const p = this.prestamo();
    if (!p) return 1;
    const pagadas = p.estadisticas?.cuotasPagadas || 0;
    return Math.max(1, p.cantidadCuotas - pagadas);
  });

  // Computed: true cuando se seleccionaron todas las cuotas restantes
  esTodas = computed(() => this.cantidadCuotas() >= this.cuotasRestantes());

  // Computed: pills de acceso rápido (solo valores menores a cuotasRestantes)
  quickPills = computed(() => {
    const max = this.cuotasRestantes();
    return [1, 2, 3, 5, 7, 10].filter(n => n < max);
  });

  // Computed: link de WhatsApp para notificar el pago
  whatsappLink = computed((): string | null => {
    const p    = this.prestamo();
    const pago = this.pagoExitoso();
    if (!p || !pago || !p.cliente?.telefono) return null;

    const telefono = p.cliente.telefono.replace(/\D/g, '');
    if (!telefono) return null;

    const nombre = p.cliente.nombre ?? 'cliente';
    const monto  = this.formatCurrency(pago.valor);
    const fecha  = this.formatDate(new Date(pago.fechaPago));
    const saldo  = this.formatCurrency(this.saldoPostPago());

    const clave = p.cliente.llave || p.cliente.id;
    const linkConsulta = clave
      ? `\n\n🔗 Consultá tu saldo:\n${window.location.origin}/consulta/${clave}`
      : '';

    const msg = `✅ Hola ${nombre}, registramos tu pago de *${monto}* del ${fecha}.\nNuevo saldo: *${saldo}*.${linkConsulta}\n\n¡Gracias por tu puntualidad! 🙌`;
    return `https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`;
  });

  // Helper para usar Math en el template
  Math = Math;

  // Fecha máxima (hoy) para el input de fecha
  fechaMaxima = new Date().toISOString().split('T')[0];

  /**
   * Abre el modal con los datos del préstamo
   */
  abrir(prestamo: PrestamoConCliente): void {
    this.prestamo.set(prestamo);
    this.visible.set(true);
    this.resetearFormulario();
  }

  /**
   * Resetea el formulario a valores por defecto
   */
  resetearFormulario(): void {
    this.modoLibre.set(false);
    this.montoPersonalizado.set(0);
    this.cantidadCuotas.set(1);
    this.fechaPago.set(new Date());
    this.error.set('');
  }

  cambiarCuotas(delta: number): void {
    const nuevo = Math.max(1, Math.min(this.cuotasRestantes(), this.cantidadCuotas() + delta));
    this.cantidadCuotas.set(nuevo);
    this.error.set('');
  }

  setCuotasDesdeTeclado(value: string): void {
    const n = parseInt(value);
    if (!isNaN(n) && n >= 1) {
      this.cantidadCuotas.set(Math.min(Math.max(1, n), this.cuotasRestantes()));
    }
    this.error.set('');
  }

  seleccionarPill(n: number): void {
    this.cantidadCuotas.set(Math.min(n, this.cuotasRestantes()));
    this.error.set('');
  }

  seleccionarTodas(): void {
    this.cantidadCuotas.set(this.cuotasRestantes());
    this.error.set('');
  }

  toggleModoLibre(): void {
    if (!this.modoLibre()) {
      const p = this.prestamo();
      const montoActual = p
        ? Math.min(this.cantidadCuotas() * p.valorCuota, this.saldoPendiente())
        : 0;
      this.montoPersonalizado.set(montoActual);
      this.modoLibre.set(true);
    } else {
      this.modoLibre.set(false);
      this.montoPersonalizado.set(0);
    }
    this.error.set('');
  }

  actualizarMontoLibre(value: string): void {
    let monto = parseFloat(value) || 0;
    const saldo = this.saldoPendiente();
    if (monto > saldo) monto = saldo;
    this.montoPersonalizado.set(monto);
    if (monto <= 0) {
      this.error.set('El monto debe ser mayor a $0');
    } else {
      this.error.set('');
    }
  }

  /**
   * Maneja el cambio de fecha
   */
  onFechaChange(value: string): void {
    this.fechaPago.set(new Date(value));
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
      this.pagoService.create(nuevoPago).subscribe({
        next: (pagoRegistrado) => {
          this.procesando.set(false);
          this.saldoPostPago.set(this.nuevoSaldo());
          this.pagoExitoso.set(pagoRegistrado);
          this.pagoRegistrado.emit(pagoRegistrado);
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
    this.visible.set(false);
    this.modalCerrado.emit();
    this.prestamo.set(null);
    this.pagoExitoso.set(null);
    this.saldoPostPago.set(0);
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
