import {
  Component, inject, signal, computed,
  Output, EventEmitter, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MonedaInputDirective } from '../../../../shared/directives';
import { AbstractPrestamoService } from '../../../core/services/abstract-prestamo.service';
import type { IRecogerPrestamoInput, IRecogerPrestamoResultado } from '../../../core/models';
import type { PrestamoConCliente } from '../../services/prestamo.service';

type FrecuenciaPago = 'diario' | 'semanal' | 'quincenal' | 'mensual';
type Paso = 'formulario' | 'resultado';

/**
 * Modal de "Recoger Préstamo" en tres pasos:
 * 1. Formulario: muestra saldo pendiente y permite ingresar el dinero adicional, intereses y nuevo plan.
 * 2. Resultado: muestra el resultado exitoso con enlace al nuevo préstamo.
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
  private sanitizer = inject(DomSanitizer);

  @Output() prestamoRecogido = new EventEmitter<IRecogerPrestamoResultado>();
  @Output() modalCerrado = new EventEmitter<void>();

  // ─── Señales de estado ────────────────────────────────────────────────────
  visible    = signal(false);
  paso       = signal<Paso>('formulario');
  procesando = signal(false);
  error      = signal('');

  prestamo   = signal<PrestamoConCliente | null>(null);
  saldoPendiente = signal(0);
  resultado  = signal<IRecogerPrestamoResultado | null>(null);

  // Campos del formulario
  dineroAdicional  = signal(0);
  intereses        = signal(0);
  valorCuota       = signal(0);
  frecuenciaPago   = signal('semanal');
  fechaInicio      = signal('');
  observacion      = signal('');

  // ─── Computados ───────────────────────────────────────────────────────────
  capitalNuevo = computed(() => this.saldoPendiente() + this.dineroAdicional());

  totalACobrar = computed(() => this.capitalNuevo() + this.intereses());

  cantidadCuotas = computed(() =>
    this.valorCuota() > 0 && this.totalACobrar() > 0
      ? Math.ceil(this.totalACobrar() / this.valorCuota())
      : 0
  );

  valorUltimaCuota = computed(() =>
    this.totalACobrar() - (this.cantidadCuotas() - 1) * this.valorCuota()
  );

  descuadreExacto = computed(() =>
    this.cantidadCuotas() > 0 && this.valorUltimaCuota() !== this.valorCuota()
  );

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
    if (this.valorCuota() <= 0) return false;
    if (!this.fechaInicio()) return false;
    const d = new Date(this.fechaInicio());
    if (isNaN(d.getTime())) return false;
    return true;
  });

  // Opciones de frecuencia
  frecuencias: Array<{ value: FrecuenciaPago; label: string }> = [
    { value: 'diario',    label: 'Diario'    },
    { value: 'semanal',   label: 'Semanal'   },
    { value: 'quincenal', label: 'Quincenal' },
    { value: 'mensual',   label: 'Mensual'   },
  ];

  whatsappLink = computed((): SafeUrl | null => {
    const p   = this.prestamo();
    const res = this.resultado();
    if (!p || !res || !p.cliente?.telefono) return null;

    const telefonoLimpio = p.cliente.telefono.replace(/\D/g, '');
    if (!telefonoLimpio) return null;
    const telefono = `57${telefonoLimpio}`;

    const nombre      = p.cliente.nombre ?? 'cliente';
    const total       = this.formatCurrency(res.totalACobrar);
    const cuotas      = this.cantidadCuotas();
    const valorCuota  = cuotas > 0 ? this.formatCurrency(this.valorCuota()) : '';
    const clave = p.cliente.id;
    const linkConsulta = clave
      ? `\n\n🔗 Consultá tu saldo:\n${window.location.origin}/consulta/${clave}`
      : '';

    const msg = `🔄 Hola ${nombre}, tu préstamo fue recogido. El nuevo total a cobrar es *${total}* en ${cuotas} cuotas de *${valorCuota}*.${linkConsulta}\n\n📞 \u00a1Gracias por confiar en nosotros!`;
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`;
    return this.sanitizer.bypassSecurityTrustUrl(url);
  });

  // ─── API pública ──────────────────────────────────────────────────────────

  abrir(prestamo: PrestamoConCliente, saldoPendiente: number): void {
    this.prestamo.set(prestamo);
    this.saldoPendiente.set(saldoPendiente);
    this.visible.set(true);
    this.paso.set('formulario');
    this.error.set('');
    this.resultado.set(null);
    this.dineroAdicional.set(0);
    this.intereses.set(0);
    this.valorCuota.set(0);
    this.frecuenciaPago.set((prestamo.frecuenciaPago as FrecuenciaPago) ?? 'diario');
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

  confirmarRecoger(): void {
    if (!this.formularioValido()) return;

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

  seleccionarFrecuencia(value: FrecuenciaPago): void {
    this.frecuenciaPago.set(value);
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
