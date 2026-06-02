import { Component, OnInit, signal, computed, inject, viewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PrestamoService, type PrestamoConCliente } from '../services';
import { AbstractPrestamoService } from '../../core/services/abstract-prestamo.service';
import { AbstractPagoService } from '../../core/services/abstract-pago.service';
import type { CuotaProyectada } from '../utils/prestamo-calculations';
import { ESTADOS_TERMINALES } from '../utils/prestamo-calculations';
import type { IPago, IPrestamo, INovedadPrestamo, IProntoPagoResultado, IAmpliacionPlazoResultado, IRecogerPrestamoResultado } from '../../core/models';
import { RegistroPagoModalComponent } from './registro-pago-modal/registro-pago-modal.component';
import { EdicionPrestamoModalComponent } from './edicion-prestamo-modal/edicion-prestamo-modal.component';
import { ConfirmacionEliminarPrestamoModalComponent } from './confirmacion-eliminar-prestamo-modal/confirmacion-eliminar-prestamo-modal.component';
import { AnulacionPagoModalComponent } from './anulacion-pago-modal/anulacion-pago-modal.component';
import { ProntoPagoModalComponent } from './pronto-pago-modal/pronto-pago-modal.component';
import { AmpliacionPlazoModalComponent } from './ampliar-plazo-modal/ampliar-plazo-modal.component';
import { RecogerPrestamoModalComponent } from './recoger-prestamo-modal/recoger-prestamo-modal.component';

/**
 * Componente de detalle de un préstamo individual
 * Muestra información completa con tabs: Información, Pagos, Proyección, Novedades
 */
@Component({
  selector: 'app-prestamo-detalle',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RegistroPagoModalComponent,
    EdicionPrestamoModalComponent,
    ConfirmacionEliminarPrestamoModalComponent,
    AnulacionPagoModalComponent,
    ProntoPagoModalComponent,
    AmpliacionPlazoModalComponent,
    RecogerPrestamoModalComponent
  ],
  templateUrl: './prestamo-detalle.component.html',
  styleUrl: './prestamo-detalle.component.scss',
})
export class PrestamoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private prestamoService = inject(PrestamoService);
  private prestamoDataService = inject(AbstractPrestamoService);
  private pagoService = inject(AbstractPagoService);

  // ViewChild para acceder al modal de pago
  modalPago = viewChild(RegistroPagoModalComponent);
  
  // ViewChild para acceder al modal de edición
  modalEdicion = viewChild(EdicionPrestamoModalComponent);

  // ViewChild para acceder al modal de eliminación
  modalEliminar = viewChild(ConfirmacionEliminarPrestamoModalComponent);

  // ViewChild para acceder al modal de anulación de pago
  modalAnulacion = viewChild(AnulacionPagoModalComponent);

  // ViewChild para acceder al modal de pronto pago
  modalProntoPago = viewChild(ProntoPagoModalComponent);

  // ViewChild para acceder al modal de ampliación de plazo
  modalAmpliacion = viewChild(AmpliacionPlazoModalComponent);

  // ViewChild para acceder al modal de recoger préstamo
  modalRecoger = viewChild(RecogerPrestamoModalComponent);

  // Signals de datos
  prestamo = signal<PrestamoConCliente | null>(null);
  pagos = signal<IPago[]>([]);
  proyeccion = signal<CuotaProyectada[]>([]);
  novedades = signal<INovedadPrestamo[]>([]);
  cargando = signal<boolean>(false);
  error = signal<string>('');

  // Signals de UI
  tabActiva = signal<'info' | 'pagos' | 'proyeccion' | 'novedades'>('info');

  // Computed: Préstamo ID
  prestamoId = computed(() => {
    return this.route.snapshot.paramMap.get('id') || '';
  });

  // Computed: si el préstamo está cerrado (no se pueden registrar más pagos ni pronto pago)
  prestamoCerrado = computed(() => {
    const p = this.prestamo();
    return !!p?.estado && ESTADOS_TERMINALES.has(p.estado as any);
  });

  ngOnInit(): void {
    this.cargarPrestamo();
  }

  /**
   * Carga los datos del préstamo
   */
  cargarPrestamo(): void {
    const id = this.prestamoId();
    if (!id) {
      this.error.set('ID de préstamo no válido');
      return;
    }

    this.cargando.set(true);
    this.error.set('');

    // Cargar préstamo y pagos en paralelo
    forkJoin({
      prestamo: this.prestamoService.getPrestamoConDatos(id),
      pagos: this.pagoService.getByPrestamo(id)
    }).subscribe({
      next: ({ prestamo, pagos }) => {
        if (!prestamo) {
          this.error.set('Préstamo no encontrado');
          this.cargando.set(false);
          return;
        }
        this.prestamo.set(prestamo);
        this.pagos.set(pagos);
        this.cargarProyeccion();
        this.cargarNovedades();
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error al cargar préstamo:', error);
        this.error.set('Error al cargar el préstamo');
        this.cargando.set(false);
      }
    });
  }

  /**
   * Carga la proyección de cuotas desde el backend
   */
  cargarProyeccion(): void {
    const id = this.prestamoId();
    if (!id) return;

    this.prestamoService.getCuotasDetalle(id).subscribe({
      next: (cuotas) => this.proyeccion.set(cuotas),
      error: () => {
        // Fallback: proyección local si el backend no responde
        const prestamo = this.prestamo();
        const pagos = this.pagos();
        if (prestamo) {
          this.proyeccion.set(this.prestamoService.generarProyeccion(prestamo, pagos));
        }
      }
    });
  }

  /**
   * Carga el historial de novedades del préstamo
   */
  cargarNovedades(): void {
    const id = this.prestamoId();
    if (!id) return;

    this.prestamoDataService.getNovedades(id).subscribe({
      next: (novedades) => this.novedades.set(novedades),
      error: () => this.novedades.set([])
    });
  }

  /**
   * Cambia la pestaña activa
   */
  cambiarTab(tab: 'info' | 'pagos' | 'proyeccion' | 'novedades'): void {
    this.tabActiva.set(tab);
  }

  /**
   * Vuelve a la página anterior en el historial de navegación
   * con fallback seguro a la lista de préstamos.
   */
  volver(): void {
    const navigationId = window.history.state?.navigationId ?? 0;
    if (navigationId > 1) {
      this.location.back();
      return;
    }
    this.router.navigate(['/prestamos']);
  }

  /**
   * Formatea un número como moneda
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  /**
   * Formatea una fecha
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  }

  /**
   * Formatea una fecha completa
   */
  formatDateLong(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));
  }

  /**
   * Obtiene el texto del filtro de frecuencia
   */
  getTextoFrecuencia(frecuencia: string): string {
    const textos: Record<string, string> = {
      diario: 'Diario',
      semanal: 'Semanal',
      quincenal: 'Quincenal',
      mensual: 'Mensual',
    };
    return textos[frecuencia] || frecuencia;
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
   * Obtiene el número total de pagos registrados
   */
  getTotalPagos(): number {
    return this.pagos().length;
  }

  /** Suma los primeros N pagos para calcular el saldo acumulado pagado */
  calcularSaldoAcumulado(n: number): number {
    return this.pagos().slice(0, n).reduce((sum, p) => sum + p.valor, 0);
  }

  /**
   * Devuelve el pago activo más reciente del préstamo (candidato a anulación).
   * No aplica para préstamos cerrados.
   */
  pagoAnulable = computed<IPago | null>(() => {
    if (this.prestamoCerrado()) return null;
    const activos = this.pagos().filter(p => !p.anulado);
    if (activos.length === 0) return null;
    return activos.reduce((prev, curr) => {
      const fechaPrev = new Date(prev.fechaPago).getTime();
      const fechaCurr = new Date(curr.fechaPago).getTime();
      if (fechaCurr !== fechaPrev) return fechaCurr > fechaPrev ? curr : prev;
      return Number(curr.id) > Number(prev.id) ? curr : prev;
    });
  });

  /**
   * Abre el modal de anulación para el pago indicado.
   */
  abrirModalAnulacion(pago: IPago): void {
    const modal = this.modalAnulacion();
    if (modal) {
      modal.abrir(pago);
    }
  }

  /**
   * Maneja el evento de pago anulado exitosamente.
   */
  onPagoAnulado(_pago: IPago): void {
    this.cargarPrestamo();
  }

  /**
   * Calcula la tasa de interés como porcentaje del valor prestado
   * @param valorPrestado Valor principal del préstamo
   * @param interes Interés total proyectado
   * @returns Porcentaje de interés redondeado
   */
  calcularTasaInteres(valorPrestado: number, interes: number): number {
    if (valorPrestado === 0) return 0;
    return Math.round((interes / valorPrestado) * 100);
  }

  /**
   * Abre el modal de pago
   */
  abrirModalPago(): void {
    const modal = this.modalPago();
    const prestamo = this.prestamo();
    if (modal && prestamo) {
      modal.abrir(prestamo);
    }
  }

  /**
   * Maneja el evento de pago registrado exitosamente
   */
  onPagoRegistrado(_pago: IPago): void {
    this.cargarPrestamo();
  }

  /**
   * Abre el modal de pronto pago
   */
  abrirModalProntoPago(): void {
    const modal = this.modalProntoPago();
    const prestamo = this.prestamo();
    if (modal && prestamo) {
      modal.abrir(prestamo);
    }
  }

  /**
   * Maneja el resultado del pronto pago — recarga el préstamo y muestra novedades
   */
  onProntoPagoRealizado(_resultado: IProntoPagoResultado): void {
    this.cargarPrestamo();
    // Cambiar a la tab de novedades para ver el registro
    this.tabActiva.set('novedades');
  }

  /**
   * Abre el modal de ampliación de plazo
   */
  abrirModalAmpliacion(): void {
    const modal = this.modalAmpliacion();
    const prestamo = this.prestamo();
    if (modal && prestamo) {
      modal.abrir(prestamo);
    }
  }

  /**
   * Maneja el resultado de la ampliación de plazo — recarga el préstamo y muestra novedades
   */
  onAmpliacionRealizada(_resultado: IAmpliacionPlazoResultado): void {
    this.cargarPrestamo();
    // Cambiar a la tab de novedades para ver el registro
    this.tabActiva.set('novedades');
  }

  /**
   * Abre el modal de recoger préstamo pasando el saldo pendiente calculado
   */
  abrirModalRecoger(): void {
    const p = this.prestamo();
    const modal = this.modalRecoger();
    if (!p || !modal) return;
    const saldoPendiente = p.estadisticas?.totalPorCobrar ?? 0;
    modal.abrir(p, saldoPendiente);
  }

  /**
   * Maneja el resultado de recoger préstamo
   */
  onPrestamoRecogido(_resultado: IRecogerPrestamoResultado): void {
    this.cargarPrestamo();
    this.tabActiva.set('novedades');
  }

  /**
   * Verifica si el préstamo puede ser editado (sin pagos registrados y no cerrado)
   */
  puedeEditarPrestamo(): boolean {
    if (this.prestamoCerrado()) return false;
    const totalPagos = this.getTotalPagos();
    return totalPagos === 0;
  }

  /**
   * Abre el modal de edición del préstamo
   */
  editarPrestamo(): void {
    if (this.prestamoCerrado()) {
      alert('No se puede editar un préstamo refinanciado o cerrado');
      return;
    }
    const prestamo = this.prestamo();
    const totalPagos = this.getTotalPagos();

    // Validar que no tenga pagos
    if (totalPagos > 0) {
      alert('No se puede editar un préstamo con pagos registrados');
      return;
    }

    if (!prestamo) {
      alert('No se pudo cargar la información del préstamo');
      return;
    }

    const modal = this.modalEdicion();
    if (modal) {
      modal.abrir(prestamo);
    }
  }

  /**
   * Maneja el evento de préstamo actualizado exitosamente
   */
  onPrestamoActualizado(_prestamo: IPrestamo): void {
    this.cargarPrestamo();
  }

  /**
   * Verifica si el préstamo puede ser eliminado (sin pagos registrados y no cerrado)
   */
  puedeEliminarPrestamo(): boolean {
    if (this.prestamoCerrado()) return false;
    const totalPagos = this.getTotalPagos();
    return totalPagos === 0;
  }

  /**
   * Abre el modal de confirmación de eliminación del préstamo
   */
  eliminarPrestamo(): void {
    if (this.prestamoCerrado()) {
      alert('No se puede eliminar un préstamo refinanciado o cerrado');
      return;
    }
    const prestamo = this.prestamo();
    const totalPagos = this.getTotalPagos();

    // Validar que no tenga pagos
    if (totalPagos > 0) {
      alert('⚠️ No se puede eliminar un préstamo con pagos registrados\n\n' +
            `Este préstamo tiene ${totalPagos} pago(s) registrado(s).\n` +
            'Debes eliminar todos los pagos antes de eliminar el préstamo.');
      return;
    }

    if (!prestamo) {
      alert('No se pudo cargar la información del préstamo');
      return;
    }

    const modal = this.modalEliminar();
    if (modal) {
      modal.abrir(prestamo, totalPagos);
    }
  }

  /**
   * Maneja el evento de préstamo eliminado exitosamente
   */
  onPrestamoEliminado(_prestamoId: string): void {
    // El modal ya navega a /prestamos
  }

  /**
   * Obtiene el label del badge de estado del préstamo
   */
  getBadgeEstado(): { texto: string; clase: string } {
    const p = this.prestamo();
    const estado = p?.estadisticas?.estado ?? 'activo';
    switch (estado) {
      case 'completado':        return { texto: 'Completado',        clase: 'badge-completado' };
      case 'cerrado_pronto_pago': return { texto: 'Pronto Pago',     clase: 'badge-pronto-pago' };
      case 'refinanciado':      return { texto: 'Refinanciado',      clase: 'badge-refinanciado' };
      case 'vencido':           return { texto: 'Vencido',           clase: 'badge-vencido' };
      case 'mora':              return { texto: 'En Mora',           clase: 'badge-mora' };
      default:                  return { texto: 'Activo',            clase: 'badge-activo' };
    }
  }
}
