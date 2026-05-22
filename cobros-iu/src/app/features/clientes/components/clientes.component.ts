import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import type { ICliente, IZona } from '../../core/models';
import { AbstractClienteService } from '../../core/services/abstract-cliente.service';
import { AbstractZonaService } from '../../core/services/abstract-zona.service';

/**
 * Componente principal para la gestión de clientes.
 * Proporciona interfaz CRUD completa con tabla de listado y formulario.
 */
@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent implements OnInit {
  /**
   * Lista de clientes cargados desde el servicio
   */
  clientes = signal<ICliente[]>([]);

  /**
   * Lista de zonas disponibles
   */
  zonas = signal<IZona[]>([]);

  /**
   * Zona seleccionada para filtrar clientes
   */
  zonaFiltroId = signal<string>('');

  /**
   * Cliente seleccionado para edición
   */
  clienteSeleccionado = signal<ICliente | null>(null);

  /**
   * Indica si se está mostrando el formulario
   */
  mostrarFormulario = signal<boolean>(false);

  /**
   * Indica si se está en modo edición (true) o creación (false)
   */
  modoEdicion = signal<boolean>(false);

  /**
   * Indica si hay una operación en curso
   */
  cargando = signal<boolean>(false);

  /**
   * Mensaje de éxito o error para mostrar al usuario
   */
  mensaje = signal<{ tipo: 'success' | 'error', texto: string } | null>(null);

  /**
   * Término de búsqueda para filtrar clientes
   */
  terminoBusqueda = signal<string>('');

  /**
   * Modelo del formulario para crear/editar cliente
   */
  formulario: ICliente = this.getFormularioVacio();

  /**
   * Número de clientes activos (computed signal)
   */
  clientesActivos = computed(() => 
    this.clientes().filter(c => c.estado === 'activo').length
  );

  /**
   * Lista de clientes filtrados según el término de búsqueda y zona (computed signal)
   */
  clientesFiltrados = computed(() => {
    let clientesFiltrados = this.clientes();
    
    // Filtrar por zona si está seleccionada
    const zonaId = this.zonaFiltroId();
    if (zonaId) {
      clientesFiltrados = clientesFiltrados.filter(cliente => cliente.zonaId === zonaId);
    }
    
    // Filtrar por término de búsqueda
    const termino = this.terminoBusqueda().toLowerCase();
    if (termino) {
      clientesFiltrados = clientesFiltrados.filter(cliente =>
        cliente.nombre.toLowerCase().includes(termino) ||
        cliente.identificacion.includes(termino) ||
        cliente.alias?.toLowerCase().includes(termino) ||
        cliente.telefono?.includes(termino)
      );
    }
    
    return clientesFiltrados;
  });

  constructor(
    private clienteService: AbstractClienteService,
    private zonaService: AbstractZonaService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarZonas();
    
    // Revisar si hay parámetros de zona en la URL
    this.route.queryParams.subscribe(params => {
      if (params['zona']) {
        this.zonaFiltroId.set(params['zona']);
      }
    });
  }

  /**
   * Carga todos los clientes desde el servicio
   */
  cargarClientes(): void {
    this.cargando.set(true);
    this.clienteService.getAll().subscribe({
      next: (data) => {
        this.clientes.set(data);
        this.cargando.set(false);
      },
      error: (error) => {
        this.mostrarMensaje('error', 'Error al cargar clientes: ' + error.message);
        this.cargando.set(false);
      }
    });
  }

  /**
   * Carga todas las zonas desde el servicio
   */
  cargarZonas(): void {
    this.zonaService.getActivas().subscribe({
      next: (data) => {
        this.zonas.set(data);
      },
      error: (error) => {
        console.error('Error al cargar zonas:', error);
      }
    });
  }

  /**
   * Abre el formulario para crear un nuevo cliente
   */
  nuevoCliente(): void {
    this.formulario = this.getFormularioVacio();
    this.modoEdicion.set(false);
    this.mostrarFormulario.set(true);
    this.clienteSeleccionado.set(null);
  }

  /**
   * Abre el formulario para editar un cliente existente
   */
  editarCliente(cliente: ICliente): void {
    this.formulario = { ...cliente };
    this.modoEdicion.set(true);
    this.mostrarFormulario.set(true);
    this.clienteSeleccionado.set(cliente);
  }

  /**
   * Navega a la vista de préstamos filtrados por el cliente
   */
  verPrestamosCliente(cliente: ICliente): void {
    this.router.navigate(['/prestamos'], {
      queryParams: { cliente: cliente.id }
    });
  }

  /**
   * Navega a la vista de préstamos para crear un nuevo préstamo para el cliente
   */
  nuevoPrestamoCliente(cliente: ICliente): void {
    this.router.navigate(['/prestamos'], {
      queryParams: { 
        cliente: cliente.id
      }
    });
  }

  /**
   * Navega a la vista de préstamos y abre el modal de creación con cliente preseleccionado
   */
  crearPrestamoConClientePreseleccionado(cliente: ICliente): void {
    this.router.navigate(['/prestamos'], {
      queryParams: { 
        cliente: cliente.id,
        nuevo: 'true'
      }
    });
  }

  /**
   * Guarda el cliente (crear o actualizar según el modo)
   */
  guardarCliente(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.cargando.set(true);

    if (this.modoEdicion()) {
      // Actualizar cliente existente
      this.clienteService.update(this.formulario.id, this.formulario).subscribe({
        next: () => {
          this.mostrarMensaje('success', 'Cliente actualizado correctamente');
          this.cargarClientes();
          this.cancelarFormulario();
        },
        error: (error) => {
          this.mostrarMensaje('error', 'Error al actualizar: ' + error.message);
          this.cargando.set(false);
        }
      });
    } else {
      // Crear nuevo cliente
      this.clienteService.create(this.formulario).subscribe({
        next: () => {
          this.mostrarMensaje('success', 'Cliente creado correctamente');
          this.cargarClientes();
          this.cancelarFormulario();
        },
        error: (error) => {
          this.mostrarMensaje('error', 'Error al crear: ' + error.message);
          this.cargando.set(false);
        }
      });
    }
  }

  /**
   * Elimina un cliente
   */
  eliminarCliente(cliente: ICliente): void {
    if (!confirm(`¿Está seguro de eliminar al cliente "${cliente.nombre}"?`)) {
      return;
    }

    this.cargando.set(true);
    this.clienteService.delete(cliente.id).subscribe({
      next: () => {
        this.mostrarMensaje('success', 'Cliente eliminado correctamente');
        this.cargarClientes();
      },
      error: (error) => {
        this.mostrarMensaje('error', 'Error al eliminar: ' + error.message);
        this.cargando.set(false);
      }
    });
  }

  /**
   * Cancela la edición y cierra el formulario
   */
  cancelarFormulario(): void {
    this.mostrarFormulario.set(false);
    this.formulario = this.getFormularioVacio();
    this.clienteSeleccionado.set(null);
  }

  /**
   * Valida los campos del formulario
   */
  private validarFormulario(): boolean {
    if (!this.formulario.nombre?.trim()) {
      this.mostrarMensaje('error', 'El nombre es obligatorio');
      return false;
    }
    if (!this.formulario.identificacion?.trim()) {
      this.mostrarMensaje('error', 'La identificación es obligatoria');
      return false;
    }
    // Verificar identificación duplicada contra la lista en memoria
    const identificacion = this.formulario.identificacion.trim();
    const duplicado = this.clientes().some(c =>
      c.identificacion?.trim() === identificacion &&
      c.id !== this.formulario.id
    );
    if (duplicado) {
      this.mostrarMensaje('error', 'Ya existe un cliente con esta identificación');
      return false;
    }
    if (!this.formulario.zonaId?.trim()) {
      this.mostrarMensaje('error', 'La zona es obligatoria');
      return false;
    }
    if (!this.formulario.telefono?.trim()) {
      this.mostrarMensaje('error', 'El teléfono es obligatorio');
      return false;
    }
    return true;
  }

  /**
   * Muestra un mensaje temporal al usuario
   */
  private mostrarMensaje(tipo: 'success' | 'error', texto: string): void {
    this.mensaje.set({ tipo, texto });
    setTimeout(() => this.mensaje.set(null), 4000);
  }

  /**
   * Obtiene el nombre de una zona por su ID
   */
  getNombreZona(zonaId: string): string {
    const zona = this.zonas().find(z => z.id === zonaId);
    return zona?.nombre || zonaId;
  }

  /**
   * Retorna un objeto de formulario vacío
   */
  private getFormularioVacio(): ICliente {
    return {
      id: '',
      nombre: '',
      identificacion: '',
      zonaId: 'zona-1',
      estado: 'activo'
    };
  }
}
