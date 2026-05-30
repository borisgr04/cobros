import {
  Component, inject, signal, computed,
  Output, EventEmitter, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AbstractPrestamoService } from '../../../core/services/abstract-prestamo.service';
import type { IProntoPagoResumen, IProntoPagoResultado } from '../../../core/models';
import type { PrestamoConCliente } from '../../services/prestamo.service';

type Paso = 'resumen' | 'confirmacion' | 'resultado';

/**
 * Modal de Pronto Pago en dos pasos:
 * 1. Resumen: muestra saldo pendiente, intereses futuros y permite ingresar valor negociado
 * 2. Confirmación: revisar y confirmar antes de ejecutar
 * 3. Resultado: muestra el resultado de la operación
 */
@Component({
  selector: 'app-pronto-pago-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pronto-pago-modal.component.html',
  styleUrl: './pronto-pago-modal.component.scss',
})
export class ProntoPagoModalComponent {
  private prestamoService = inject(AbstractPrestamoService);

  @Output() prontoPagoRealizado = new EventEmitter<IProntoPagoResultado>();
  @Output() modalCerrado = new EventEmitter<void>();

  // ─── Señales de estado ────────────────────────────────────────────────────
  visible      = signal(false);
  paso         = signal<Paso>('resumen');
  procesando   = signal(false);
  error        = signal('');
  confirmado   = signal(false);

  prestamo     = signal<PrestamoConCliente | null>(null);
  resumen      = signal<IProntoPagoResumen | null>(null);
  resultado    = signal<IProntoPagoResultado | null>(null);

  valorNegociado  = signal(0);
  notas           = signal('');

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

  // ─── API pública ──────────────────────────────────────────────────────────

  abrir(prestamo: PrestamoConCliente): void {
    this.prestamo.set(prestamo);
    this.visible.set(true);
    this.paso.set('resumen');
    this.error.set('');
    this.confirmado.set(false);
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

  avanzarAConfirmacion(): void {
    if (!this.esValorValido()) return;
    this.paso.set('confirmacion');
    this.confirmado.set(false);
  }

  volverAResumen(): void {
    this.paso.set('resumen');
    this.error.set('');
  }

  async confirmarProntoPago(): Promise<void> {
    if (!this.confirmado() || !this.esValorValido()) return;

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
