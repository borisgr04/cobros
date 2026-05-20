import { Component, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IZona, Estado } from '../../../core/models';

/**
 * Modal para crear o editar una zona
 */
@Component({
  selector: 'app-zona-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './zona-modal.component.html',
  styleUrl: './zona-modal.component.scss'
})
export class ZonaModalComponent {
  // Control de visibilidad
  modalAbierto = signal(false);
  
  // Modo: 'crear' o 'editar'
  modo = signal<'crear' | 'editar'>('crear');
  
  // Datos del formulario
  zonaId = signal<string>('');
  nombre = signal<string>('');
  estado = signal<Estado>('activo');
  
  // Estado del formulario
  procesando = signal(false);
  error = signal<string>('');
  
  // Outputs
  guardado = output<Partial<IZona>>();
  cancelado = output<void>();
  
  // Computed
  tituloModal = computed(() => 
    this.modo() === 'crear' ? 'Nueva Zona' : 'Editar Zona'
  );
  
  formularioValido = computed(() => {
    return this.nombre().trim().length >= 2;
  });
  
  /**
   * Abre el modal en modo crear
   */
  abrirCrear(): void {
    this.modo.set('crear');
    this.zonaId.set('');
    this.nombre.set('');
    this.estado.set('activo');
    this.error.set('');
    this.procesando.set(false);
    this.modalAbierto.set(true);
  }
  
  /**
   * Abre el modal en modo editar
   */
  abrirEditar(zona: IZona): void {
    this.modo.set('editar');
    this.zonaId.set(zona.id);
    this.nombre.set(zona.nombre);
    this.estado.set(zona.estado);
    this.error.set('');
    this.procesando.set(false);
    this.modalAbierto.set(true);
  }
  
  /**
   * Cierra el modal
   */
  cerrar(): void {
    // Permitir cerrar pero resetear el estado
    this.modalAbierto.set(false);
    this.procesando.set(false);
    this.error.set('');
    
    // Limpiar formulario
    this.nombre.set('');
    this.estado.set('activo');
    this.zonaId.set('');
    
    this.cancelado.emit();
  }
  
  /**
   * Guarda la zona
   */
  guardar(): void {
    if (!this.formularioValido() || this.procesando()) {
      console.warn('⚠️ No se puede guardar: formulario inválido o procesando');
      return;
    }
    
    console.log('📝 Preparando datos para guardar...');
    console.log('  - Modo:', this.modo());
    console.log('  - Nombre:', this.nombre());
    console.log('  - Estado:', this.estado());
    console.log('  - ID:', this.zonaId());
    
    const zona: Partial<IZona> = {
      nombre: this.nombre().trim(),
      estado: this.estado()
    };
    
    if (this.modo() === 'editar') {
      zona.id = this.zonaId();
    }
    
    console.log('📤 Emitiendo evento guardado con:', zona);
    this.procesando.set(true);
    this.guardado.emit(zona);
  }
}
