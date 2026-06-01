import { Component, OnInit, signal, computed, inject, viewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import type { FrecuenciaPago, ICliente, IZona, IPago, IPrestamo } from '../../core/models';
import { PrestamoService, type PrestamoConCliente } from '../services';
import { AbstractClienteService } from '../../core/services/abstract-cliente.service';
import { AbstractZonaService } from '../../core/services/abstract-zona.service';
import type { EstadoPrestamo } from '../utils/prestamo-calculations';
import { RegistroPagoModalComponent } from './registro-pago-modal/registro-pago-modal.component';
import { RegistroPrestamoModalComponent } from './registro-prestamo-modal/registro-prestamo-modal.component';
import { EdicionPrestamoModalComponent } from './edicion-prestamo-modal/edicion-prestamo-modal.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

/**
 * Componente principal para la gestión de préstamos.
 * Muestra lista/grid de préstamos con filtros avanzados y búsqueda.
 */
@Component({
  selector: 'app-prestamos',
  standalone: true,
  imports: [CommonModule, FormsModule, RegistroPagoModalComponent, RegistroPrestamoModalComponent, EdicionPrestamoModalComponent, PageHeaderComponent],
  templateUrl: './prestamos.component.html',
  styleUrl: './prestamos.component.scss',
})
export class PrestamosComponent implements OnInit {
  private prestamoService = inject(PrestamoService);
  private clienteService = inject(AbstractClienteService);
  private zonaService = inject(AbstractZonaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // ViewChild para acceder a los modales y elementos
  modalPago = viewChild(RegistroPagoModalComponent);
  modalPrestamo = viewChild(RegistroPrestamoModalComponent);
  modalEdicion = viewChild(EdicionPrestamoModalComponent);

  // Signals de datos
  prestamos = signal<PrestamoConCliente[]>([]);
  clientes = signal<ICliente[]>([]);
  zonas = signal<IZona[]>([]);
  cargando = signal<boolean>(false);

  // Signals de filtros
  filtroEstado = signal<EstadoPrestamo | 'todos'>('todos');
  filtroFrecuencia = signal<FrecuenciaPago | 'todas'>('todas');
  filtroClienteId = signal<string | ''>('');
  filtroZonaId = signal<string | ''>('');
  busqueda = signal<string>('');

  // Signals de UI
  mostrarAlerta = signal<boolean>(false);
  tipoAlerta = signal<'success' | 'error'>('success');
  mensajeAlerta = signal<string>('');
  mostrarFiltrosAvanzados = signal<boolean>(false);
  mostrarModalFiltros = signal<boolean>(false);

  // Computed: préstamos filtrados
  prestamosFiltrados = computed(() => {
    let resultado = this.prestamos();

    // Filtrar por búsqueda
    const search = this.busqueda().toLowerCase().trim();
    if (search) {
      resultado = resultado.filter(p => {
        const cliente = p.cliente;
        return (
          p.id.toLowerCase().includes(search) ||
          cliente?.nombre.toLowerCase().includes(search) ||
          cliente?.alias?.toLowerCase().includes(search) ||
          ''
        );
      });
    }

    // Filtrar por estado
    if (this.filtroEstado() !== 'todos') {
      resultado = resultado.filter(p => p.estadisticas?.estado === this.filtroEstado());
    }

    // Filtrar por frecuencia
    if (this.filtroFrecuencia() !== 'todas') {
      resultado = resultado.filter(p => p.frecuenciaPago === this.filtroFrecuencia());
    }

    // Filtrar por cliente
    if (this.filtroClienteId()) {
      resultado = resultado.filter(p => p.clienteId === this.filtroClienteId());
    }

    // Filtrar por zona
    if (this.filtroZonaId()) {
      const zonaIdFiltro = this.filtroZonaId();
      console.log('Filtrando por zona:', zonaIdFiltro);
      const antesDelFiltro = resultado.length;
      resultado = resultado.filter(p => {
        const zonaIdCliente = p.cliente?.zonaId;
        const coincide = zonaIdCliente === zonaIdFiltro;
        if (!coincide && antesDelFiltro < 5) {
          console.log(`Préstamo ${p.id}: cliente.zonaId="${zonaIdCliente}" vs filtro="${zonaIdFiltro}"`);
        }
        return coincide;
      });
      console.log(`Filtro zona: ${antesDelFiltro} -> ${resultado.length} préstamos`);
    }

    return resultado;
  });

  // Computed: estadísticas
  estadisticas = computed(() => {
    const prestamos = this.prestamosFiltrados();
    return {
      totalActivos: prestamos.filter(p => p.estadisticas?.estado === 'activo').length,
      totalPrestado: prestamos.reduce((sum, p) => sum + p.valorPrestado, 0),
      totalPorCobrar: prestamos.reduce((sum, p) => sum + (p.estadisticas?.totalPorCobrar || 0), 0),
      totalVencidos: prestamos.filter(p => p.estadisticas?.estado === 'vencido').length,
    };
  });

  // Computed: nombre del cliente cuyo filtro está activo
  nombreClienteFiltrado = computed(() => {
    const id = this.filtroClienteId();
    if (!id) return '';
    return this.clientes().find(c => c.id === id)?.nombre ?? 'Cliente';
  });

  ngOnInit(): void {
    // Leer parámetros de la URL y guardarlos temporalmente
    this.route.queryParams.subscribe(params => {
      if (params['zona']) {
        console.log('Zona desde URL:', params['zona']);
        // Establecer el filtro inmediatamente
        this.filtroZonaId.set(params['zona']);
      }
      if (params['cliente']) {
        console.log('Cliente desde URL:', params['cliente']);
        // Establecer el filtro de cliente
        this.filtroClienteId.set(params['cliente']);
      }
    });
    
    // Cargar los datos
    this.cargarDatos();
  }

  /**
   * Carga todos los datos necesarios
   */
  cargarDatos(): void {
    this.cargando.set(true);

    this.prestamoService.getAllPrestamosConDatos().subscribe({
      next: (prestamos) => {
        this.prestamos.set(prestamos);
        console.log('Préstamos cargados:', prestamos.length);
        console.log('Filtro zona actual:', this.filtroZonaId());
        // Debug: mostrar zonas de los primeros préstamos
        if (prestamos.length > 0) {
          console.log('Ejemplo préstamo:', {
            id: prestamos[0].id,
            clienteId: prestamos[0].clienteId,
            clienteZonaId: prestamos[0].cliente?.zonaId,
            clienteNombre: prestamos[0].cliente?.nombre
          });
        }
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error al cargar préstamos:', error);
        this.mostrarMensaje('Error al cargar los préstamos', 'error');
        this.cargando.set(false);
      }
    });

    this.clienteService.getAll().subscribe({
      next: (clientes) => this.clientes.set(clientes),
      error: (error) => console.error('Error al cargar clientes:', error)
    });

    this.zonaService.getAll().subscribe({
      next: (zonas) => this.zonas.set(zonas),
      error: (error) => console.error('Error al cargar zonas:', error)
    });
  }

  /**
   * Limpia el filtro de cliente activo
   */
  limpiarFiltroCliente(): void {
    this.filtroClienteId.set('');
  }

  /**
   * Limpia la búsqueda
   */
  limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.filtroEstado.set('todos');
    this.filtroFrecuencia.set('todas');
    this.filtroClienteId.set('');
    this.filtroZonaId.set('');
    this.busqueda.set('');
  }

  /**
   * Maneja el cambio de zona en el select
   */
  onZonaChange(zonaId: string): void {
    this.filtroZonaId.set(zonaId);
    console.log('Zona seleccionada:', zonaId);
  }

  /**
   * Obtiene el color para el indicador de días restantes
   */
  getDiasRestantesColor(dias: number): string {
    if (dias < 0) return 'var(--color-danger)';
    if (dias < 7) return 'var(--color-danger)';
    if (dias <= 30) return 'var(--color-warning)';
    return 'var(--color-success)';
  }

  /**
   * Obtiene la clase CSS para la barra de progreso
   */
  getProgressBarClass(porcentaje: number): string {
    if (porcentaje >= 100) return 'complete';
    if (porcentaje >= 50) return 'high';
    if (porcentaje >= 25) return 'medium';
    return 'low';
  }

  /**
   * Formatea un número como moneda en formato compacto (K = miles, M = millones)
   */
  formatCurrency(value: number): string {
    if (value >= 1000000) {
      // Millones
      const millions = value / 1000000;
      return `$${millions.toFixed(millions >= 10 ? 0 : 1)}M`;
    } else if (value >= 1000) {
      // Miles
      const thousands = value / 1000;
      return `$${thousands.toFixed(thousands >= 10 ? 0 : 1)}K`;
    } else {
      // Menor a mil
      return `$${value.toFixed(0)}`;
    }
  }

  /**
   * Formatea una fecha
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  }

  /**
   * Formatea la fecha del último pago o muestra mensaje apropiado
   */
  formatearFechaUltimoPago(prestamo: PrestamoConCliente): string {
    if (!prestamo.estadisticas || prestamo.estadisticas.cuotasPagadas === 0) {
      return 'Sin pagos';
    }
    
    // Si hay pagos, calculamos basándonos en la fecha de inicio y cuotas pagadas
    const fechaInicio = new Date(prestamo.fechaPrestamo);
    const cuotasPagadas = prestamo.estadisticas.cuotasPagadas;
    
    // Calcular días según frecuencia
    let diasPorCuota = 1;
    switch (prestamo.frecuenciaPago) {
      case 'diario': diasPorCuota = 1; break;
      case 'semanal': diasPorCuota = 7; break;
      case 'quincenal': diasPorCuota = 15; break;
      case 'mensual': diasPorCuota = 30; break;
    }
    
    // Calcular fecha aproximada del último pago
    const diasTranscurridos = cuotasPagadas * diasPorCuota;
    const fechaEstimada = new Date(fechaInicio);
    fechaEstimada.setDate(fechaEstimada.getDate() + diasTranscurridos);
    
    return this.formatDate(fechaEstimada);
  }

  /**
   * Muestra un mensaje de alerta
   */
  mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
    this.mensajeAlerta.set(mensaje);
    this.tipoAlerta.set(tipo);
    this.mostrarAlerta.set(true);

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      this.cerrarAlerta();
    }, 5000);
  }

  /**
   * Cierra la alerta
   */
  cerrarAlerta(): void {
    this.mostrarAlerta.set(false);
  }

  /**
   * Obtiene el nombre de la zona de un cliente
   */
  getNombreZona(zonaId: string): string {
    const zona = this.zonas().find(z => z.id === zonaId);
    return zona?.nombre || 'Sin zona';
  }

  /**
   * Obtiene el texto del filtro de estado
   */
  getTextoEstado(estado: EstadoPrestamo | 'todos'): string {
    const textos: Record<EstadoPrestamo | 'todos', string> = {
      todos: 'Todos',
      activo: 'Activos',
      completado: 'Completados',
      vencido: 'Vencidos',
      mora: 'En Mora',
      cerrado_pronto_pago: 'Pronto Pago',
      refinanciado: 'Refinanciados',
    };
    return textos[estado];
  }

  /**
   * Obtiene el texto del filtro de frecuencia
   */
  getTextoFrecuencia(frecuencia: FrecuenciaPago | 'todas'): string {
    const textos: Record<FrecuenciaPago | 'todas', string> = {
      todas: 'Todas',
      diario: 'Diario',
      semanal: 'Semanal',
      quincenal: 'Quincenal',
      mensual: 'Mensual',
    };
    return textos[frecuencia];
  }

  /**
   * Navega a la vista de detalle de un préstamo
   */
  verDetalle(prestamoId: string): void {
    this.router.navigate(['/prestamos', prestamoId]);
  }

  /**
   * Alterna la visibilidad del acordeón de filtros avanzados
   */
  toggleFiltrosAvanzados(): void {
    this.mostrarFiltrosAvanzados.set(!this.mostrarFiltrosAvanzados());
  }

  /**
   * Abre el modal de filtros
   */
  toggleModalFiltros(): void {
    this.mostrarModalFiltros.set(!this.mostrarModalFiltros());
  }

  /**
   * Cierra el modal de filtros
   */
  cerrarModalFiltros(): void {
    this.mostrarModalFiltros.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.mostrarModalFiltros()) this.cerrarModalFiltros();
  }

  /**
   * Verifica si hay filtros activos (diferentes a los valores por defecto)
   */
  tienesFiltrosActivos(): boolean {
    return (
      this.filtroEstado() !== 'todos' ||
      this.filtroFrecuencia() !== 'todas' ||
      this.filtroClienteId() !== '' ||
      this.filtroZonaId() !== ''
    );
  }

  /**
   * Cuenta el número de filtros activos
   */
  contarFiltrosActivos(): number {
    let count = 0;
    if (this.filtroEstado() !== 'todos') count++;
    if (this.filtroFrecuencia() !== 'todas') count++;
    if (this.filtroClienteId() !== '') count++;
    if (this.filtroZonaId() !== '') count++;
    return count;
  }

  /**
   * Abre el modal de pago para un préstamo
   */
  abrirModalPago(prestamo: PrestamoConCliente): void {
    const modal = this.modalPago();
    if (modal) {
      modal.abrir(prestamo);
    }
  }

  /**
   * Maneja el evento de pago registrado exitosamente
   */
  onPagoRegistrado(pago: IPago): void {
    // Recargar datos
    this.cargarDatos();

    // Mostrar notificación
    this.mostrarMensaje(
      `Pago registrado exitosamente: ${this.formatCurrency(pago.valor)}`,
      'success'
    );
  }

  /**
   * Abre el modal para registrar un nuevo préstamo para el cliente dado
   */
  abrirModalPrestamo(cliente: import('../../core/models').ICliente): void {
    this.modalPrestamo()?.abrir(cliente);
  }

  /**
   * Maneja el evento de préstamo registrado exitosamente
   */
  onPrestamoRegistrado(prestamo: IPrestamo): void {
    // Fijar el filtro al cliente del préstamo recién creado para que sea visible
    this.filtroClienteId.set(prestamo.clienteId);

    // Recargar datos
    this.cargarDatos();

    // Mostrar notificación
    this.mostrarMensaje(
      `Préstamo ${prestamo.id} creado exitosamente`,
      'success'
    );
  }

  /**
   * Abre el modal de edición para el préstamo indicado.
   * Solo disponible cuando el préstamo no tiene pagos registrados.
   */
  editarPrestamo(prestamo: PrestamoConCliente): void {
    const modal = this.modalEdicion();
    if (modal) {
      modal.abrir(prestamo);
    }
  }

  /**
   * Maneja el evento de préstamo actualizado exitosamente
   */
  onPrestamoActualizado(prestamo: IPrestamo): void {
    this.cargarDatos();
    this.mostrarMensaje(`Préstamo ${prestamo.id} actualizado exitosamente`, 'success');
  }
}
