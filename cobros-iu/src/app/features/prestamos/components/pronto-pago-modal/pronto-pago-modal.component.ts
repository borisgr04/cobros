import {
  Component, inject, signal, computed, effect, untracked,
  Output, EventEmitter, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MonedaInputDirective } from '../../../../shared/directives/moneda-input.directive';
import { AbstractPrestamoService } from '../../../core/services/abstract-prestamo.service';
import type { IProntoPagoResumen, IProntoPagoResultado } from '../../../core/models';
import type { PrestamoConCliente } from '../../services/prestamo.service';

type Paso = 'resumen' | 'resultado';

/**
 * Modal de Pronto Pago en dos pasos:
 * 1. Resumen: muestra saldo pendiente, intereses futuros y permite ingresar valor negociado
 * 2. Resultado: muestra el resultado de la operación
 */
@Component({
  selector: 'app-pronto-pago-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MonedaInputDirective],
  templateUrl: './pronto-pago-modal.component.html',
  styleUrl: './pronto-pago-modal.component.scss',
})
export class ProntoPagoModalComponent {
  private prestamoService = inject(AbstractPrestamoService);
  private sanitizer = inject(DomSanitizer);

  @Output() prontoPagoRealizado = new EventEmitter<IProntoPagoResultado>();
  @Output() modalCerrado = new EventEmitter<void>();

  // ─── Señales de estado ────────────────────────────────────────────────────
  visible      = signal(false);
  paso         = signal<Paso>('resumen');
  procesando   = signal(false);
  error        = signal('');

  prestamo     = signal<PrestamoConCliente | null>(null);
  resumen      = signal<IProntoPagoResumen | null>(null);
  resultado    = signal<IProntoPagoResultado | null>(null);

  valorNegociado  = signal(0);
  notas           = signal('');

  constructor() {
    // Clamp valorNegociado to saldoPendiente when user types more than available
    effect(() => {
      const r = this.resumen();
      const v = this.valorNegociado();
      if (r && v > r.saldoPendiente) {
        untracked(() => this.valorNegociado.set(r.saldoPendiente));
      }
    });
  }

  // ─── Computados ───────────────────────────────────────────────────────────
  descuento = computed(() => {
    const r = this.resumen();
    if (!r) return 0;
    return Math.max(0, r.saldoPendiente - this.valorNegociado());
  });

  esValorValido = computed(() => {
    const r = this.resumen();
    const v = this.valorNegociado();
    if (!r || v <= 0) return false;
    return v <= r.saldoPendiente;
  });

  advertenciaDescuento = computed(() => {
    const r = this.resumen();
    if (!r) return false;
    return this.descuento() > r.interesesFuturosEstimados;
  });

  whatsappLink = computed((): SafeUrl | null => {
    const p    = this.prestamo();
    const res  = this.resultado();
    if (!p || !res || !p.cliente?.telefono) return null;

    const telefonoLimpio = p.cliente.telefono.replace(/\D/g, '');
    if (!telefonoLimpio) return null;
    const telefono = `57${telefonoLimpio}`;

    const nombre       = p.cliente.nombre ?? 'cliente';
    const valorPagado  = this.formatCurrency(res.valorNegociado);
    const descuento    = res.descuentoAplicado > 0
      ? `\nDescuento aplicado: *${this.formatCurrency(res.descuentoAplicado)}*`
      : '';
    const clave = p.cliente.id;
    const linkConsulta = clave
      ? `\n\n🔗 Consultá tu saldo:\n${window.location.origin}/consulta/${clave}`
      : '';

    const msg = `✅ Hola ${nombre}, tu préstamo fue cancelado por *${valorPagado}*.${descuento}${linkConsulta}\n\n🎉 ¡Gracias por saldar tu deuda con nosotros!`;
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`;
    return this.sanitizer.bypassSecurityTrustUrl(url);
  });

  // ─── API pública ──────────────────────────────────────────────────────────

  abrir(prestamo: PrestamoConCliente): void {
    this.prestamo.set(prestamo);
    this.visible.set(true);
    this.paso.set('resumen');
    this.error.set('');
    this.notas.set('');
    this.resultado.set(null);
    this.resumen.set(null);
    this.cargarResumen(prestamo.id);
  }

  cerrar(): void {
    if (this.procesando()) return;
    this.visible.set(false);
    this.modalCerrado.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible() && !this.procesando()) this.cerrar();
  }

  async confirmarProntoPago(): Promise<void> {
    if (!this.esValorValido()) return;

    const p = this.prestamo();
    if (!p) return;

    this.procesando.set(true);
    this.error.set('');

    this.prestamoService.ejecutarProntoPago(p.id, {
      valorNegociado: this.valorNegociado(),
      notas: this.notas() || undefined,
    }).subscribe({
      next: (res) => {
        this.procesando.set(false);
        this.resultado.set(res);
        this.paso.set('resultado');
        this.prontoPagoRealizado.emit(res);
      },
      error: (err) => {
        this.procesando.set(false);
        const msg = err?.error?.error ?? 'Error al procesar el pronto pago. Intente nuevamente.';
        this.error.set(msg);
      }
    });
  }

  // ─── Helpers de formato ──────────────────────────────────────────────────

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(new Date(date));
  }

  onValorNegociadoChange(value: string): void {
    const v = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
    const r = this.resumen();
    if (r && v > r.saldoPendiente) {
      this.valorNegociado.set(r.saldoPendiente);
    } else {
      this.valorNegociado.set(v);
    }
  }

  // ─── Privado ──────────────────────────────────────────────────────────────

  private cargarResumen(id: string): void {
    this.procesando.set(true);
    this.prestamoService.getResumenProntoPago(id).subscribe({
      next: (r) => {
        this.resumen.set(r);
        this.valorNegociado.set(r.saldoPendiente);
        this.procesando.set(false);
      },
      error: (err) => {
        const msg = err?.error?.error ?? 'No se pudo cargar el resumen del préstamo.';
        this.error.set(msg);
        this.procesando.set(false);
      }
    });
  }
}
