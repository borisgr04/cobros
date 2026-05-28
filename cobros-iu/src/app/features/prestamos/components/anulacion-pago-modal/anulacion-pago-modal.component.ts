import { Component, signal, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { IPago } from '../../../core/models';
import { AbstractPagoService } from '../../../core/services/abstract-pago.service';

/**
 * Modal para anular un pago.
 * Solo puede anularse el pago activo más reciente de un préstamo.
 * Requiere ingresar un motivo/comentario obligatorio.
 */
@Component({
  selector: 'app-anulacion-pago-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './anulacion-pago-modal.component.html',
  styleUrl: './anulacion-pago-modal.component.scss'
})
export class AnulacionPagoModalComponent {
  private pagoService = inject(AbstractPagoService);

  /** Controla la visibilidad del modal */
  modalAbierto = signal<boolean>(false);

  /** Pago que se va a anular */
  pago = signal<IPago | null>(null);

  /** Motivo de la anulación ingresado por el usuario */
  motivo = signal<string>('');

  /** Estados del proceso */
  procesando = signal<boolean>(false);
  error = signal<string>('');

  /** Evento emitido cuando el pago se anula exitosamente */
  pagoAnulado = output<IPago>();

  /** Evento emitido cuando se cierra el modal */
  modalCerrado = output<void>();

  /**
   * Abre el modal con el pago a anular.
   * @param pago Pago candidato a anulación (debe ser el más reciente activo)
   */
  abrir(pago: IPago): void {
    this.pago.set(pago);
    this.motivo.set('');
    this.procesando.set(false);
    this.error.set('');
    this.modalAbierto.set(true);
  }

  /** Cierra el modal si no está procesando */
  cerrar(): void {
    if (this.procesando()) return;
    this.modalAbierto.set(false);
    this.modalCerrado.emit();
  }

  /** Indica si el formulario es válido (motivo no vacío) */
  get puedeAnular(): boolean {
    return this.motivo().trim().length > 0 && !this.procesando();
  }

  /** Ejecuta la anulación del pago */
  confirmarAnulacion(): void {
    const pago = this.pago();
    if (!pago || !this.puedeAnular) return;

    this.procesando.set(true);
    this.error.set('');

    this.pagoService.anular(pago.id, this.motivo().trim()).subscribe({
      next: (pagoAnulado) => {
        this.procesando.set(false);
        this.pagoAnulado.emit(pagoAnulado);
        this.modalAbierto.set(false);
      },
      error: (err) => {
        this.procesando.set(false);
        const mensaje = err?.error?.error ?? err?.message ?? 'Error al anular el pago';
        this.error.set(mensaje);
      }
    });
  }

  /** Maneja el cambio del textarea de motivo */
  onMotivoChange(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.motivo.set(textarea.value);
  }

  /** Longitud actual del motivo */
  get motivoLength(): number {
    return this.motivo().trim().length;
  }
}
