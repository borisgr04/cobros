import {
  Component, inject, signal, computed,
  Output, EventEmitter, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AbstractPrestamoService } from '../../../core/services/abstract-prestamo.service';
import type { IAmpliacionPlazoResumen, IAmpliacionPlazoResultado } from '../../../core/models';
import type { PrestamoConCliente } from '../../services/prestamo.service';

type Paso = 'formulario' | 'confirmacion' | 'resultado';

/**
 * Modal de Ampliación de Plazo en tres pasos:
 * 1. Formulario: muestra saldo/fecha actuales y permite ingresar los parámetros de la ampliación
 * 2. Confirmación: revisar resumen calculado antes de ejecutar
 * 3. Resultado: muestra el resultado exitoso de la operación
 */
@Component({
  selector: 'app-ampliar-plazo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ampliar-plazo-modal.component.html',
  styleUrl: './ampliar-plazo-modal.component.scss',
})
export class AmpliacionPlazoModalComponent {
  private prestamoService = inject(AbstractPrestamoService);

  @Output() ampliacionRealizada = new EventEmitter<IAmpliacionPlazoResultado>();
  @Output() modalCerrado = new EventEmitter<void>();

  // ─── Señales de estado ────────────────────────────────────────────────────
  visible    = signal(false);
  paso       = signal<Paso>('formulario');
  procesando = signal(false);
  error      = signal('');
  confirmado = signal(false);

  prestamo   = signal<PrestamoConCliente | null>(null);
  resumen    = signal<IAmpliacionPlazoResumen | null>(null);
  resultado  = signal<IAmpliacionPlazoResultado | null>(null);

  // Campos del formulario
  interesAdicional     = signal(0);
  cantidadCuotasNuevas = signal(1);
  frecuenciaNueva      = signal('semanal');
  fechaInicio          = signal('');
  observacion          = signal('');

  // ─── Computados ───────────────────────────────────────────────────────────
  nuevoSaldo = computed(() => {
    const r = this.resumen();
    if (!r) return 0;
    return r.saldoPendiente + this.interesAdicional();
  });

  valorCuotaEstimado = computed(() => {
    const n = this.cantidadCuotasNuevas();
    if (n <= 0) return 0;
    return Math.round(this.nuevoSaldo() / n);
  });

  nuevaFechaFinalEstimada = computed<Date | null>(() => {
    const fecha = this.fechaInicio();
    const n = this.cantidadCuotasNuevas();
    const freq = this.frecuenciaNueva();
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
    const r = this.resumen();
    if (!r) return false;
    if (this.interesAdicional() < 0) return false;
    if (this.cantidadCuotasNuevas() < 1) return false;
    if (!this.fechaInicio()) return false;
    const d = new Date(this.fechaInicio());
    if (isNaN(d.getTime())) return false;
    return true;
  });

  // ─── API pública ──────────────────────────────────────────────────────────

  abrir(prestamo: PrestamoConCliente): void {
    this.prestamo.set(prestamo);
    this.visible.set(true);
    this.paso.set('formulario');
    this.error.set('');
    this.confirmado.set(false);
    this.resultado.set(null);
    this.resumen.set(null);
    this.interesAdicional.set(0);
    this.cantidadCuotasNuevas.set(10);
    this.frecuenciaNueva.set('semanal');
    this.observacion.set('');
    // Fecha inicio default: mañana
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    this.fechaInicio.set(manana.toISOString().split('T')[0]);
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
    if (!this.formularioValido()) return;
    this.error.set('');
    this.paso.set('confirmacion');
    this.confirmado.set(false);
  }

  volverAFormulario(): void {
    this.paso.set('formulario');
    this.error.set('');
  }

  async confirmarAmpliacion(): Promise<void> {
    if (!this.confirmado() || !this.formularioValido()) return;

    const p = this.prestamo();
    if (!p) return;

    this.procesando.set(true);
    this.error.set('');

    this.prestamoService.ejecutarAmpliacion(p.id, {
      interesAdicional:     this.interesAdicional(),
      cantidadCuotasNuevas: this.cantidadCuotasNuevas(),
      frecuenciaNueva:      this.frecuenciaNueva(),
      fechaInicio:          this.fechaInicio(),
      observacion:          this.observacion() || undefined,
    }).subscribe({
      next: (res) => {
        this.procesando.set(false);
        this.resultado.set(res);
        this.paso.set('resultado');
        this.ampliacionRealizada.emit(res);
      },
      error: (err) => {
        this.procesando.set(false);
        const msg = err?.error?.error ?? 'Error al procesar la ampliación de plazo. Intente nuevamente.';
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

  // ─── Privado ──────────────────────────────────────────────────────────────

  private cargarResumen(id: string): void {
    this.procesando.set(true);
    this.prestamoService.getResumenAmpliacion(id).subscribe({
      next: (r) => {
        this.resumen.set(r);
        this.frecuenciaNueva.set(r.frecuenciaPago);
        this.procesando.set(false);
      },
      error: (err) => {
        const msg = err?.error?.error ?? 'No se pudo cargar la información del préstamo.';
        this.error.set(msg);
        this.procesando.set(false);
      }
    });
  }
}
