import { Component, OnInit, signal, computed, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AbstractZonaService } from '../../core/services/abstract-zona.service';
import { AbstractClienteService } from '../../core/services/abstract-cliente.service';
import { IZona } from '../../core/models';
import { ZonaModalComponent } from './zona-modal/zona-modal.component';

@Component({
  selector: 'app-zonas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ZonaModalComponent],
  templateUrl: './zonas.component.html',
  styleUrls: ['./zonas.component.scss']
})
export class ZonasComponent implements OnInit {
  // Servicios
  private zonaService = inject(AbstractZonaService);
  private clienteService = inject(AbstractClienteService);
  private router = inject(Router);
  
  // ViewChild para el modal
  modalZona = viewChild(ZonaModalComponent);
  
  // Estado
  zonas = signal<IZona[]>([]);
  clientes = signal<any[]>([]);
  terminoBusqueda = signal('');
  filtroEstado = signal<'todas' | 'activo' | 'inactivo'>('todas');
  cargando = signal(false);
  
  // Computed
  zonasFiltradas = computed(() => {
    const zonas = this.zonas();
    const termino = this.terminoBusqueda().toLowerCase();
    const filtro = this.filtroEstado();
    
    return zonas.filter(zona => {
      const cumpleBusqueda = zona.nombre.toLowerCase().includes(termino);
      const cumpleEstado = filtro === 'todas' || zona.estado === filtro;
      return cumpleBusqueda && cumpleEstado;
    });
  });
  
  zonasActivas = computed(() => 
    this.zonas().filter(z => z.estado === 'activo').length
  );
  
  zonasInactivas = computed(() => 
    this.zonas().filter(z => z.estado === 'inactivo').length
  );
  
  // Obtener contador de clientes por zona
  contarClientes(zonaId: string): number {
    return this.clientes().filter(c => c.zonaId === zonaId && c.estado === 'activo').length;
  }
  
  async ngOnInit() {
    await this.cargarDatos();
  }
  
  async cargarDatos() {
    console.log('📥 Cargando datos de zonas y clientes...');
    this.cargando.set(true);
    try {
      const [zonas, clientes] = await Promise.all([
        firstValueFrom(this.zonaService.getAll()),
        firstValueFrom(this.clienteService.getAll())
      ]);
      console.log('✅ Datos cargados:', { zonas: zonas.length, clientes: clientes.length });
      this.zonas.set(zonas);
      this.clientes.set(clientes);
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      alert('Error al cargar las zonas');
    } finally {
      this.cargando.set(false);
    }
  }
  
  abrirModalNueva() {
    const modal = this.modalZona();
    if (modal) {
      modal.abrirCrear();
    }
  }
  
  abrirModalEditar(zona: IZona) {
    const modal = this.modalZona();
    if (modal) {
      modal.abrirEditar(zona);
    }
  }
  
  async guardarZona(zona: Partial<IZona>) {
    console.log('💾 Intentando guardar zona:', zona);
    const modal = this.modalZona();
    
    try {
      const esEdicion = !!zona.id;
      
      if (esEdicion) {
        // Editar
        console.log('✏️ Editando zona existente...');
        await firstValueFrom(this.zonaService.update(zona.id!, zona as IZona));
        console.log('✅ Zona actualizada exitosamente');
      } else {
        // Crear
        console.log('➕ Creando nueva zona...');
        const nuevaZona = await firstValueFrom(this.zonaService.create(zona as IZona));
        console.log('✅ Zona creada exitosamente:', nuevaZona);
      }
      
      console.log('🔄 Recargando datos...');
      await this.cargarDatos();
      console.log('✅ Datos recargados. Total de zonas:', this.zonas().length);
      
      // Cerrar modal ANTES de mostrar alert
      if (modal) {
        modal.procesando.set(false);
        modal.modalAbierto.set(false);
      }
      
      // Mostrar mensaje después de cerrar modal
      setTimeout(() => {
        alert(esEdicion ? 'Zona actualizada exitosamente' : 'Zona creada exitosamente');
      }, 100);
      
    } catch (error) {
      console.error('❌ Error al guardar zona:', error);
      if (modal) {
        modal.procesando.set(false);
        modal.error.set('Error al guardar la zona. Por favor, intenta de nuevo.');
      }
    }
  }
  
  async cambiarEstado(zona: IZona) {
    const nuevoEstado = zona.estado === 'activo' ? 'inactivo' : 'activo';
    const textoEstado = nuevoEstado === 'activo' ? 'activar' : 'desactivar';
    
    const confirmar = confirm(`¿Estás seguro de ${textoEstado} la zona "${zona.nombre}"?`);
    if (!confirmar) return;
    
    console.log(`🔄 Cambiando estado de zona "${zona.nombre}" a ${nuevoEstado}...`);
    
    try {
      await firstValueFrom(this.zonaService.update(zona.id, { ...zona, estado: nuevoEstado }));
      console.log('✅ Estado actualizado');
      await this.cargarDatos();
      
      // Mostrar mensaje después de actualizar
      setTimeout(() => {
        alert(`Zona ${textoEstado}da exitosamente`);
      }, 100);
    } catch (error) {
      console.error('❌ Error al cambiar estado:', error);
      alert('Error al cambiar el estado');
    }
  }
  
  verClientesZona(zona: IZona) {
    this.router.navigate(['/clientes'], { queryParams: { zona: zona.id } });
  }
  
  verPrestamosZona(zona: IZona) {
    this.router.navigate(['/prestamos'], { queryParams: { zona: zona.id } });
  }
}
