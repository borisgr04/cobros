import { Component, inject, signal, computed, Output, EventEmitter, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonedaInputDirective } from '../../../../shared/directives';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AbstractPagoService } from '../../../core/services/abstract-pago.service';
import type { PrestamoConCliente } from '../../services/prestamo.service';
import type { IPago } from '../../../core/models';

/**
 * Componente modal para registrar pagos de préstamos.
 * El valor de la cuota se predetermina como monto a pagar; el usuario puede modificarlo libremente.
 */
@Component({
  selector: 'app-registro-pago-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MonedaInputDirective],
  templateUrl: './registro-pago-modal.component.html',
  styleUrl: './registro-pago-modal.component.scss',
})
export class RegistroPagoModalComponent {
  private pagoService = inject(AbstractPagoService);
  private sanitizer = inject(DomSanitizer);
  @ViewChild('postPagoAcciones') postPagoAccionesRef?: ElementRef<HTMLElement>;

  // Outputs
  @Output() pagoRegistrado = new EventEmitter<IPago>();
  @Output() modalCerrado = new EventEmitter<void>();

  // Signals de estado
  prestamo           = signal<PrestamoConCliente | null>(null);
  montoPersonalizado = signal<number>(0);
  fechaPago          = signal<Date>(new Date());
  procesando         = signal<boolean>(false);
  error              = signal<string>('');
  visible            = signal<boolean>(false);
  pagoExitoso        = signal<IPago | null>(null);
  saldoPostPago      = signal<number>(0);
  resumenColapsado   = signal<boolean>(true);

  // Computed: saldo pendiente
  saldoPendiente = computed(() => {
    const p = this.prestamo();
    return p?.estadisticas?.totalPorCobrar || 0;
  });

  // Computed: monto a pagar (con cap al saldo pendiente)
  montoAPagar = computed(() => {
    return Math.min(this.montoPersonalizado(), this.saldoPendiente());
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

  // Computed: link de WhatsApp para notificar el pago
  whatsappLink = computed((): SafeUrl | null => {
    const p    = this.prestamo();
    const pago = this.pagoExitoso();
    if (!p || !pago || !p.cliente?.telefono) return null;

    const telefonoLimpio = p.cliente.telefono.replace(/\D/g, '');
    if (!telefonoLimpio) return null;
    const telefono = `57${telefonoLimpio}`;

    const nombre = p.cliente.nombre ?? 'cliente';
    const monto  = this.formatCurrency(pago.valor);
    const fecha  = this.formatDate(new Date(pago.fechaPago));
    const saldo  = this.formatCurrency(this.saldoPostPago());

    const clave = p.cliente.llave || p.cliente.id;
    const linkConsulta = clave
      ? `\n\n🔗 Consultá tu saldo:\n${window.location.origin}/consulta/${clave}`
      : '';

    const msg = `✅ Hola ${nombre}, registramos tu pago de *${monto}* del ${fecha}.\nNuevo saldo: *${saldo}*.${linkConsulta}\n\n¡Gracias por tu puntualidad! 🙌`;
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`;
    return this.sanitizer.bypassSecurityTrustUrl(url);
  });

  // Fecha máxima (hoy) para el input de fecha
  fechaMaxima = new Date().toISOString().split('T')[0];

  /**
   * Abre el modal con los datos del préstamo
   */
  abrir(prestamo: PrestamoConCliente): void {
    this.prestamo.set(prestamo);
    this.visible.set(true);
    this.resetearFormulario();
    this.montoPersonalizado.set(prestamo.valorCuota);
  }

  /**
   * Resetea el formulario a valores por defecto
   */
  resetearFormulario(): void {
    this.montoPersonalizado.set(0);
    this.fechaPago.set(new Date());
    this.error.set('');
    this.resumenColapsado.set(true);
  }

  /**
   * Alterna el estado colapsado/expandido del resumen del préstamo
   */
  toggleResumen(): void {
    this.resumenColapsado.set(!this.resumenColapsado());
  }

  validarMontoLibre(): void {
    let m = this.montoPersonalizado();
    const saldo = this.saldoPendiente();
    if (m > saldo) { m = saldo; this.montoPersonalizado.set(m); }
    if (m <= 0) {
      this.error.set('El monto debe ser mayor a $0');
    } else {
      this.error.set('');
    }
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
          this.desplazarAHitoPostPago();
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

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible()) this.cerrar();
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

  private desplazarAHitoPostPago(): void {
    if (!this.visible() || !this.pagoExitoso()) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const objetivo = this.postPagoAccionesRef?.nativeElement;
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
