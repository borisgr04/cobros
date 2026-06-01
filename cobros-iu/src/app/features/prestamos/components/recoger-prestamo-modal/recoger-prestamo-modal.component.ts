import {
  Component, inject, signal, computed,
  Output, EventEmitter, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MonedaInputDirective } from '../../../../shared/directives';
import { AbstractPrestamoService } from '../../../core/services/abstract-prestamo.service';
import type { IRecogerPrestamoInput, IRecogerPrestamoResultado } from '../../../core/models';
import type { PrestamoConCliente } from '../../services/prestamo.service';

type Paso = 'formulario' | 'confirmacion' | 'resultado';

/**
 * Modal de "Recoger Préstamo" en tres pasos:
 * 1. Formulario: muestra saldo pendiente y permite ingresar el dinero adicional, intereses y nuevo plan.
 * 2. Confirmación: revisar resumen calculado antes de ejecutar.
 * 3. Resultado: muestra el resultado exitoso con enlace al nuevo préstamo.
 */
@Component({
  selector: 'app-recoger-prestamo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MonedaInputDirective],
  templateUrl: './recoger-prestamo-modal.component.html',
  styleUrl: './recoger-prestamo-modal.component.scss',
})
export class RecogerPrestamoModalComponent {
  private prestamoService = inject(AbstractPrestamoService);
  private router = inject(Router);

  @Output() prestamoRecogido = new EventEmitter<IRecogerPrestamoResultado>();
  @Output() modalCerrado = new EventEmitter<void>();

  // ─── Señales de estado ────────────────────────────────────────────────────
  visible    = signal(false);
  paso       = signal<Paso>('formulario');
  procesando = signal(false);
  error      = signal('');
  confirmado = signal(false);

  prestamo   = signal<PrestamoConCliente | null>(null);
  saldoPendiente = signal(0);
  resultado  = signal<IRecogerPrestamoResultado | null>(null);

  // Campos del formulario
  dineroAdicional  = signal(0);
  intereses        = signal(0);
  cantidadCuotas   = signal(10);
  frecuenciaPago   = signal('semanal');
  fechaInicio      = signal('');
  observacion      = signal('');

  // ─── Computados ───────────────────────────────────────────────────────────
  capitalNuevo = computed(() => this.saldoPendiente() + this.dineroAdicional());

  totalACobrar = computed(() => this.capitalNuevo() + this.intereses());

  valorCuotaEstimado = computed(() => {
    const n = this.cantidadCuotas();
    if (n <= 0) return 0;
    return Math.round(this.totalACobrar() / n);
  });

  nuevaFechaFinalEstimada = computed<Date | null>(() => {
    const fecha = this.fechaInicio();
    const n = this.cantidadCuotas();
    const freq = this.frecuenciaPago();
    if (!fecha || n <= 0) return null;
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return null;
      switch (freq) {
        case 'diario':    d.setDate(d.getDate() + n);       break;
        case 'semanal':   d.setDate(d.getDate() + n * 7);   break;
        case 'quincenal': d.setDate(d.getDate() + n * 15);  break;
        case 'mensual':   d.setMonth(d.getMonth() + n);     break;
        default:          d.setDate(d.getDate() + n * 7);
      }
      return d;
    } catch {
      return null;
    }
  });

  formularioValido = computed(() => {
    if (this.dineroAdicional() <= 0) return false;
    if (this.intereses() < 0) return false;
    if (this.cantidadCuotas() < 1) return false;
    if (!this.fechaInicio()) return false;
    const d = new Date(this.fechaInicio());
    if (isNaN(d.getTime())) return false;
    return true;
  });

  // ─── API pública ──────────────────────────────────────────────────────────

  abrir(prestamo: PrestamoConCliente, saldoPendiente: number): void {
    this.prestamo.set(prestamo);
    this.saldoPendiente.set(saldoPendiente);
    this.visible.set(true);
    this.paso.set('formulario');
    this.error.set('');
    this.confirmado.set(false);
    this.resultado.set(null);
    this.dineroAdicional.set(0);
    this.intereses.set(0);
    this.cantidadCuotas.set(10);
    this.frecuenciaPago.set('semanal');
    this.observacion.set('');
    // Fecha inicio default: mañana
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    this.fechaInicio.set(manana.toISOString().split('T')[0]);
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
    if (!this.formularioValido()) return;
    this.error.set('');
    this.paso.set('confirmacion');
    this.confirmado.set(false);
  }

  volverAFormulario(): void {
    this.paso.set('formulario');
    this.error.set('');
  }

  confirmarRecoger(): void {
    if (!this.confirmado() || !this.formularioValido()) return;

    const p = this.prestamo();
    if (!p) return;

    this.procesando.set(true);
    this.error.set('');

    const input: IRecogerPrestamoInput = {
      dineroAdicional: this.dineroAdicional(),
      intereses:       this.intereses(),
      cantidadCuotas:  this.cantidadCuotas(),
      frecuenciaPago:  this.frecuenciaPago(),
      fechaInicio:     this.fechaInicio(),
      observacion:     this.observacion() || undefined,
    };

    this.prestamoService.recogerPrestamo(p.id, input).subscribe({
      next: (res) => {
        this.procesando.set(false);
        this.resultado.set(res);
        this.paso.set('resultado');
        this.prestamoRecogido.emit(res);
      },
      error: (err) => {
        this.procesando.set(false);
        const msg = err?.error?.error ?? 'Error al procesar la operación. Intente nuevamente.';
        this.error.set(msg);
      }
    });
  }

  irAlNuevoPrestamo(): void {
    const res = this.resultado();
    if (!res) return;
    this.cerrar();
    this.router.navigate(['/prestamos', res.prestamoDestinoId]);
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

  formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(new Date(date));
  }

  getTextoFrecuencia(frecuencia: string): string {
    const textos: Record<string, string> = {
      diario: 'Diario',
      semanal: 'Semanal',
      quincenal: 'Quincenal',
      mensual: 'Mensual',
    };
    return textos[frecuencia] || frecuencia;
  }
}
