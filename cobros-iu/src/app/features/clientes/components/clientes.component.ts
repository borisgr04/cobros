import { Component, OnInit, signal, computed, viewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import type { ICliente, IZona } from '../../core/models';
import { AbstractClienteService } from '../../core/services/abstract-cliente.service';
import { AbstractZonaService } from '../../core/services/abstract-zona.service';
import { RegistroPrestamoModalComponent } from '../../prestamos/components/registro-prestamo-modal/registro-prestamo-modal.component';
import { RegistroPagoModalComponent } from '../../prestamos/components/registro-pago-modal/registro-pago-modal.component';
import { PrestamoService, type PrestamoConCliente } from '../../prestamos/services/prestamo.service';
import type { FrecuenciaPago } from '../../core/models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

/**
 * Componente principal para la gestión de clientes.
 * Proporciona interfaz CRUD completa con tabla de listado y formulario.
 */
@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RegistroPrestamoModalComponent, RegistroPagoModalComponent, PageHeaderComponent],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent implements OnInit {
  modalPrestamo = viewChild(RegistroPrestamoModalComponent);
  modalPago = viewChild(RegistroPagoModalComponent);
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

  /** IDs de clientes cuya sección de cerrados está visible */
  cerradosVisiblesIds = signal<Set<string>>(new Set());

  /** Cliente recién creado para mostrar CTA de nuevo préstamo */
  clienteRecienCreado = signal<ICliente | null>(null);

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
   * Error de validación en tiempo real para el campo identificación
   */
  errorIdentificacion = signal<string>('');

  /**
   * Cache de préstamos por cliente (cargados bajo demanda)
   */
  prestamosCache = signal<Record<string, PrestamoConCliente[]>>({});

  /**
   * IDs de clientes cuyos préstamos están siendo cargados
   */
  cargandoPrestamosIds = signal<string[]>([]);

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
    private prestamoService: PrestamoService,
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
   * Carga todos los clientes junto con sus préstamos y pagos en una única llamada consolidada.
   * Pre-pobla la caché de préstamos y expande todos los clientes por defecto.
   */
  cargarClientes(): void {
    this.cargando.set(true);
    this.clienteService.getAllConPrestamos().subscribe({
      next: (data) => {
        this.clientes.set(data.map(c => ({ ...c } as ICliente)));
        this.prestamosCache.set(this.prestamoService.buildCacheDesdeClientesConsolidados(data));
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
    this.formulario.zonaId = this.zonaFiltroId() || this.zonas()[0]?.id || '';
    this.modoEdicion.set(false);
    this.mostrarFormulario.set(true);
    this.clienteSeleccionado.set(null);
    this.errorIdentificacion.set('');
  }

  /**
   * Abre el formulario para editar un cliente existente
   */
  editarCliente(cliente: ICliente): void {
    this.formulario = { ...cliente };
    this.modoEdicion.set(true);
    this.mostrarFormulario.set(true);
    this.clienteSeleccionado.set(cliente);
    this.errorIdentificacion.set('');
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
   * Abre el modal de registro de préstamo con el cliente dado
   */
  nuevoPrestamo(cliente: ICliente): void {
    this.modalPrestamo()?.abrir(cliente);
  }

  /**
   * Carga los préstamos de un cliente desde el servidor y los guarda en caché.
   */
  cargarPrestamosCliente(clienteId: string): void {
    this.cargandoPrestamosIds.set([...this.cargandoPrestamosIds(), clienteId]);
    this.prestamoService.getPrestamosConDatosByCliente(clienteId).subscribe({
      next: (prestamos) => {
        this.prestamosCache.set({ ...this.prestamosCache(), [clienteId]: prestamos });
        this.cargandoPrestamosIds.set(this.cargandoPrestamosIds().filter(id => id !== clienteId));
      },
      error: (err) => {
        console.error('Error al cargar préstamos del cliente:', err);
        this.cargandoPrestamosIds.set(this.cargandoPrestamosIds().filter(id => id !== clienteId));
      }
    });
  }

  /** Retorna true si los préstamos del cliente están siendo cargados. */
  estaCargandoPrestamos(clienteId: string): boolean {
    return this.cargandoPrestamosIds().includes(clienteId);
  }

  /** Retorna los préstamos activos cacheados del cliente. */
  getPrestamosActivos(clienteId: string): PrestamoConCliente[] {
    const estados = ['activo', 'mora', 'vencido'];
    return (this.prestamosCache()[clienteId] || []).filter(
      p => estados.includes(p.estadisticas?.estado ?? '')
    );
  }

  /** Retorna los préstamos cerrados (completado, refinanciado, cerrado_pronto_pago) del cliente, ordenados por fecha descendente. */
  getPrestamosCerrados(clienteId: string): PrestamoConCliente[] {
    const estados = ['completado', 'refinanciado', 'cerrado_pronto_pago'];
    return (this.prestamosCache()[clienteId] || [])
      .filter(p => estados.includes(p.estadisticas?.estado ?? ''))
      .sort((a, b) => {
        const fa = new Date(a.fechaPrestamo ?? 0).getTime();
        const fb = new Date(b.fechaPrestamo ?? 0).getTime();
        return fb - fa;
      });
  }

  /** Alterna la visibilidad de préstamos cerrados para un cliente. */
  toggleCerrados(clienteId: string): void {
    const ids = new Set(this.cerradosVisiblesIds());
    if (ids.has(clienteId)) ids.delete(clienteId); else ids.add(clienteId);
    this.cerradosVisiblesIds.set(ids);
  }

  /** Retorna true si los cerrados del cliente están visibles. */
  cerradosVisibles(clienteId: string): boolean {
    return this.cerradosVisiblesIds().has(clienteId);
  }

  /** Retorna los préstamos cacheados del cliente. */
  getPrestamosCliente(clienteId: string): PrestamoConCliente[] {
    return this.prestamosCache()[clienteId] || [];
  }

  /**
   * Navega a la vista de detalle del préstamo.
   */
  verDetallePrestamo(prestamoId: string): void {
    this.router.navigate(['/prestamos', prestamoId]);
  }

  /**
   * Abre el modal de pago para un préstamo.
   */
  abrirPago(prestamo: PrestamoConCliente): void {
    this.modalPago()?.abrir(prestamo);
  }

  /**
   * Navega a la vista de detalle del cliente.
   */
  verDetalleCliente(clienteId: string): void {
    this.router.navigate(['/clientes', clienteId]);
  }

  /**
   * Texto amigable para la frecuencia de pago.
   */
  getTextoFrecuencia(frecuencia: FrecuenciaPago): string {
    const textos: Record<FrecuenciaPago, string> = {
      diario: 'Diario',
      semanal: 'Semanal',
      quincenal: 'Quincenal',
      mensual: 'Mensual',
    };
    return textos[frecuencia] ?? frecuencia;
  }

  /**
   * Clase CSS para la barra de progreso según porcentaje.
   */
  getProgressBarClass(porcentaje: number): string {
    if (porcentaje >= 100) return 'complete';
    if (porcentaje >= 50) return 'high';
    if (porcentaje >= 25) return 'medium';
    return 'low';
  }

  /**
   * Formatea un número como moneda compacta.
   */
  formatCurrency(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  }

  /**
   * Recarga los préstamos de un cliente en caché (tras registrar nuevo préstamo o pago).
   */
  recargarPrestamosCliente(clienteId: string): void {
    this.cargarPrestamosCliente(clienteId);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.mostrarFormulario()) this.cancelarFormulario();
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
        next: (clienteCreado) => {
          this.mostrarMensaje('success', 'Cliente creado correctamente');
          this.cargarClientes();
          this.cancelarFormulario();
          this.clienteRecienCreado.set(clienteCreado);
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
    this.errorIdentificacion.set('');
  }

  /**
   * Valida la identificación en tiempo real mientras el usuario escribe.
   * Actualiza el signal errorIdentificacion con el mensaje de error o lo vacía si es válido.
   */
  validarIdentificacionEnVivo(valor: string): void {
    if (!valor?.trim()) {
      this.errorIdentificacion.set('La identificación es obligatoria');
      return;
    }
    if (!/^[a-zA-Z0-9\-]+$/.test(valor.trim())) {
      this.errorIdentificacion.set('Solo se permiten letras, números y guiones');
      return;
    }
    const identificacion = valor.trim();
    const duplicado = this.clientes().some(c =>
      c.identificacion?.trim() === identificacion &&
      c.id !== this.formulario.id
    );
    if (duplicado) {
      this.errorIdentificacion.set('Ya existe un cliente con esta identificación');
      return;
    }
    this.errorIdentificacion.set('');
  }

  /**
   * Comparte la información del cliente por WhatsApp
   */
  compartirWhatsApp(cliente: ICliente): void {
    const zona = this.getNombreZona(cliente.zonaId);
    const prestamos = this.getPrestamosCliente(cliente.id);
    const prestamosActivos = prestamos.filter(p => p.estadisticas?.estado !== 'completado');
    const saldoTotal = prestamosActivos.reduce((sum, p) => sum + (p.estadisticas?.totalPorCobrar || 0), 0);

    let texto = `👤 *Cliente: ${cliente.nombre}*\n`;
    if (cliente.alias) texto += `  Alias: "${cliente.alias}"\n`;
    texto += `  Cédula: ${cliente.identificacion}\n`;
    if (cliente.telefono) texto += `  📞 Tel: ${cliente.telefono}\n`;
    texto += `  📍 Zona: ${zona}\n`;
    if (cliente.direccion) texto += `  🏠 Dir: ${cliente.direccion}\n`;
    if (prestamosActivos.length > 0) {
      texto += `\n💰 *Préstamos activos: ${prestamosActivos.length}*\n`;
      texto += `  Saldo total: ${this.formatCurrency(saldoTotal)}\n`;
    }

    const clave = (cliente as any).llave || cliente.id;
    if (clave) {
      texto += `\n🔗 Consultá tu saldo:\n${window.location.origin}/consulta/${clave}`;
    }

    const telefonoLimpio = cliente.telefono?.replace(/\D/g, '') ?? '';
    const telefonoConPrefijo = telefonoLimpio ? `57${telefonoLimpio}` : '';
    const url = telefonoConPrefijo
      ? `https://wa.me/${telefonoConPrefijo}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  }

  /**
   * Valida los campos del formulario
   */
  private validarFormulario(): boolean {
    if (!this.formulario.nombre?.trim()) {
      this.mostrarMensaje('error', 'El nombre es obligatorio');
      return false;
    }
    // Reutiliza la validación en vivo de identificación
    this.validarIdentificacionEnVivo(this.formulario.identificacion || '');
    if (this.errorIdentificacion()) {
      this.mostrarMensaje('error', this.errorIdentificacion());
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
      zonaId: '',
      estado: 'activo'
    };
  }
}
