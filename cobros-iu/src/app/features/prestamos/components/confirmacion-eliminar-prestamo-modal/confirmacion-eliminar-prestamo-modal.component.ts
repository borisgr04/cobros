import { Component, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AbstractPrestamoService } from '../../../core/services/abstract-prestamo.service';
import { PrestamoConCliente } from '../../services';

/**
 * Modal de confirmación para eliminar un préstamo
 * Requiere doble confirmación: validar que no tenga pagos y escribir el ID exacto
 */
@Component({
  selector: 'app-confirmacion-eliminar-prestamo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirmacion-eliminar-prestamo-modal.component.html',
  styleUrl: './confirmacion-eliminar-prestamo-modal.component.scss'
})
export class ConfirmacionEliminarPrestamoModalComponent {
  // Señal para controlar la visibilidad del modal
  modalAbierto = signal<boolean>(false);

  // Datos del préstamo a eliminar
  prestamo = signal<PrestamoConCliente | null>(null);
  
  // Total de pagos del préstamo (para validación)
  totalPagos = signal<number>(0);

  // Campo de confirmación: el usuario debe escribir el ID exacto
  confirmacionId = signal<string>('');

  // Estados del proceso de eliminación
  procesando = signal<boolean>(false);
  error = signal<string>('');
  exito = signal<boolean>(false);

  // Evento que se emite cuando se elimina exitosamente el préstamo
  prestamoEliminado = output<string>();

  // Evento que se emite cuando se cierra el modal
  modalCerrado = output<void>();

  // Computed: verifica si el ID escrito coincide con el ID del préstamo
  idCoincide = computed(() => {
    const prestamo = this.prestamo();
    const confirmacion = this.confirmacionId();
    return prestamo !== null && confirmacion === prestamo.id;
  });

  // Computed: verifica si se puede eliminar (ID coincide y no tiene pagos)
  puedeEliminar = computed(() => {
    return this.idCoincide() && this.totalPagos() === 0 && !this.procesando();
  });

  constructor(
    private prestamoService: AbstractPrestamoService,
    private router: Router
  ) {}

  /**
   * Abre el modal con los datos del préstamo a eliminar
   * @param prestamo Préstamo que se va a eliminar
   * @param totalPagos Total de pagos registrados para este préstamo
   */
  abrir(prestamo: PrestamoConCliente, totalPagos: number): void {
    // Validación crítica: no permitir eliminar préstamos con pagos
    if (totalPagos > 0) {
      console.error('No se puede eliminar un préstamo que tiene pagos registrados');
      return;
    }

    // Reiniciar estados
    this.prestamo.set(prestamo);
    this.totalPagos.set(totalPagos);
    this.confirmacionId.set('');
    this.procesando.set(false);
    this.error.set('');
    this.exito.set(false);
    this.modalAbierto.set(true);
  }

  /**
   * Cierra el modal
   */
  cerrar(): void {
    // Si está procesando, no permitir cerrar
    if (this.procesando()) {
      return;
    }

    // Si hay cambios sin guardar (escribió algo), confirmar
    if (this.confirmacionId() !== '' && !this.exito()) {
      const confirmar = confirm('¿Estás seguro de cancelar? No se eliminará el préstamo.');
      if (!confirmar) {
        return;
      }
    }

    this.modalAbierto.set(false);
    this.modalCerrado.emit();
  }

  /**
   * Ejecuta la eliminación del préstamo
   */
  async eliminarPrestamo(): Promise<void> {
    const prestamo = this.prestamo();
    
    if (!prestamo || !this.puedeEliminar()) {
      return;
    }

    // Confirmación final antes de eliminar
    const confirmacionFinal = confirm(
      `⚠️ ÚLTIMA CONFIRMACIÓN ⚠️\n\n` +
      `Estás a punto de eliminar permanentemente el préstamo:\n` +
      `ID: ${prestamo.id}\n` +
      `Cliente: ${prestamo.cliente?.nombre || 'N/A'}\n` +
      `Monto: $${prestamo.valorTotal.toLocaleString('es-CO')}\n\n` +
      `Esta acción NO SE PUEDE DESHACER.\n\n` +
      `¿Confirmas la eliminación?`
    );

    if (!confirmacionFinal) {
      return;
    }

    try {
      this.procesando.set(true);
      this.error.set('');

      // Llamar al servicio para eliminar
      await this.prestamoService.delete(prestamo.id);

      // Marcar como exitoso
      this.exito.set(true);
      this.procesando.set(false);

      // Emitir evento
      this.prestamoEliminado.emit(prestamo.id);

      // Mostrar mensaje de éxito
      alert(`✓ Préstamo eliminado exitosamente\n\nEl préstamo ${prestamo.id} ha sido eliminado del sistema.`);

      // Cerrar modal
      this.modalAbierto.set(false);

      // Navegar a la lista de préstamos
      this.router.navigate(['/prestamos']);

    } catch (err) {
      this.procesando.set(false);
      const mensajeError = err instanceof Error ? err.message : 'Error desconocido al eliminar el préstamo';
      this.error.set(mensajeError);
      console.error('Error al eliminar préstamo:', err);
    }
  }

  /**
   * Maneja el cambio en el campo de confirmación
   */
  onConfirmacionChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.confirmacionId.set(input.value);
  }

  /**
   * Obtiene el texto del botón de eliminación según el estado
   */
  getTextoBotonEliminar(): string {
    if (this.procesando()) {
      return 'Eliminando...';
    }
    if (!this.idCoincide()) {
      return 'Escribe el ID para confirmar';
    }
    return 'Eliminar Préstamo Permanentemente';
  }

  /**
   * Obtiene las clases CSS del botón de eliminación
   */
  getClasesBotonEliminar(): string {
    const clases = ['btn-eliminar'];
    
    if (this.procesando()) {
      clases.push('procesando');
    }
    
    if (!this.puedeEliminar()) {
      clases.push('deshabilitado');
    }
    
    return clases.join(' ');
  }
}
