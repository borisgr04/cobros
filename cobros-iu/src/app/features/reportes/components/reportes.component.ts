import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../services/reporte.service';
import { AbstractZonaService } from '../../core/services/abstract-zona.service';
import type {
  ResumenCobros,
  PeriodoReporte,
  FiltrosReporte,
  ReporteCompleto,
  ReportePrestamoNuevo,
  ReportePrestamoFinalizado,
  ReporteRecaudoZona
} from '../models/reporte.models';
import type { IZona } from '../../core/models';

export type TabReporte = 'resumen' | 'nuevos' | 'finalizados' | 'recaudo';

/**
 * Componente para visualizar reportes de cobros
 */
@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent implements OnInit {
  // ── Estado general ────────────────────────────────────────────────────────
  cargando = signal<boolean>(false);
  resumen = signal<ResumenCobros | null>(null);
  zonas = signal<IZona[]>([]);

  // ── Tab activo ────────────────────────────────────────────────────────────
  tabActiva = signal<TabReporte>('resumen');

  tabs: Array<{ id: TabReporte; etiqueta: string; icono: string }> = [
    { id: 'resumen',     etiqueta: 'Resumen',             icono: 'bi-bar-chart-fill' },
    { id: 'nuevos',      etiqueta: 'Préstamos Nuevos',    icono: 'bi-plus-circle-fill' },
    { id: 'finalizados', etiqueta: 'Préstamos Finalizados', icono: 'bi-check-circle-fill' },
    { id: 'recaudo',     etiqueta: 'Recaudo por Zona',    icono: 'bi-geo-alt-fill' }
  ];

  // ── Datos del reporte completo (backend) ──────────────────────────────────
  reporteCompleto = signal<ReporteCompleto | null>(null);
  cargandoReporte = signal<boolean>(false);
  errorReporte = signal<string | null>(null);

  prestamosNuevos = computed<ReportePrestamoNuevo[]>(() =>
    this.reporteCompleto()?.prestamosNuevos ?? []
  );
  prestamosFinalizados = computed<ReportePrestamoFinalizado[]>(() =>
    this.reporteCompleto()?.prestamosFinalizados ?? []
  );
  recaudoPorZona = computed<ReporteRecaudoZona[]>(() =>
    this.reporteCompleto()?.recaudoPorZona ?? []
  );

  // ── Filtros del reporte completo ──────────────────────────────────────────
  fechaInicioReporte = signal<string>('');
  fechaFinReporte = signal<string>('');
  zonaFiltroReporte = signal<string>('');

  // ── Filtros del resumen (pestaña existente) ───────────────────────────────
  periodoSeleccionado = signal<PeriodoReporte>('semana');
  zonaSeleccionada = signal<string>('');
  fechaInicioPersonalizada = signal<string>('');
  fechaFinPersonalizada = signal<string>('');
  estadoSeleccionado = signal<string>('todos');

  // Opciones de período
  periodos: Array<{ valor: PeriodoReporte; etiqueta: string; icono: string }> = [
    { valor: 'dia', etiqueta: 'Hoy', icono: 'bi-calendar-day' },
    { valor: 'semana', etiqueta: 'Esta semana', icono: 'bi-calendar-week' },
    { valor: 'mes', etiqueta: 'Este mes', icono: 'bi-calendar-month' },
    { valor: 'personalizado', etiqueta: 'Personalizado', icono: 'bi-calendar-range' }
  ];

  // Opciones de estado
  estadosDisponibles = [
    { valor: 'todos', etiqueta: 'Todos los estados' },
    { valor: 'al_dia', etiqueta: 'Al día' },
    { valor: 'proximo_vencer', etiqueta: 'Próximo a vencer' },
    { valor: 'vencido', etiqueta: 'Vencido' }
  ];

  // ── Computados ───────────────────────────────────────────────────────────
  tieneDatos = computed(() => this.resumen() !== null);

  porcentajeCumplimientoFormateado = computed(() => {
    const resumen = this.resumen();
    return resumen ? resumen.porcentajeCumplimiento.toFixed(1) : '0.0';
  });

  constructor(
    private reporteService: ReporteService,
    private zonaService: AbstractZonaService
  ) {}

  ngOnInit(): void {
    this.cargarZonas();
    this.cargarReporte();
    this.inicializarFechasReporte();
  }

  // ── Inicialización ────────────────────────────────────────────────────────

  private inicializarFechasReporte(): void {
    const hoy = new Date();
    const hace30 = new Date(hoy);
    hace30.setDate(hoy.getDate() - 30);
    this.fechaInicioReporte.set(hace30.toISOString().substring(0, 10));
    this.fechaFinReporte.set(hoy.toISOString().substring(0, 10));
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  cambiarTab(tab: TabReporte): void {
    this.tabActiva.set(tab);
    if (tab !== 'resumen' && this.reporteCompleto() === null && !this.cargandoReporte()) {
      this.cargarReporteCompleto();
    }
  }

  // ── Reporte completo (backend) ────────────────────────────────────────────

  cargarReporteCompleto(): void {
    const inicio = this.fechaInicioReporte();
    const fin = this.fechaFinReporte();

    if (!inicio || !fin) {
      this.errorReporte.set('Selecciona un rango de fechas para generar el reporte.');
      return;
    }

    this.cargandoReporte.set(true);
    this.errorReporte.set(null);

    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);
    const zonaId = this.zonaFiltroReporte() || undefined;

    this.reporteService.getReporteCompleto(fechaInicio, fechaFin, zonaId).subscribe({
      next: (data) => {
        this.reporteCompleto.set(data);
        this.cargandoReporte.set(false);
      },
      error: (err) => {
        console.error('Error al cargar reporte completo:', err);
        this.errorReporte.set('No se pudo cargar el reporte. Intenta nuevamente.');
        this.cargandoReporte.set(false);
      }
    });
  }

  aplicarFiltrosReporte(): void {
    this.reporteCompleto.set(null);
    this.cargarReporteCompleto();
  }

  // ── Zona expandida en recaudo ─────────────────────────────────────────────
  zonaExpandida = signal<string | null>(null);

  toggleZona(zonaId: string): void {
    this.zonaExpandida.set(this.zonaExpandida() === zonaId ? null : zonaId);
  }

  // ── Resumen (pestaña existente) ───────────────────────────────────────────

  cargarZonas(): void {
    this.zonaService.getAll().subscribe({
      next: (zonas: IZona[]) => {
        this.zonas.set(zonas);
      },
      error: (error: any) => {
        console.error('Error al cargar zonas:', error);
      }
    });
  }

  cargarReporte(): void {
    this.cargando.set(true);
    
    const filtros: FiltrosReporte = {
      periodo: this.periodoSeleccionado(),
      zonaId: this.zonaSeleccionada() || undefined,
      estadoPrestamo: this.estadoSeleccionado() !== 'todos' 
        ? this.estadoSeleccionado() as 'al_dia' | 'proximo_vencer' | 'vencido'
        : undefined
    };

    if (this.periodoSeleccionado() === 'personalizado') {
      if (this.fechaInicioPersonalizada()) {
        filtros.fechaInicio = new Date(this.fechaInicioPersonalizada());
      }
      if (this.fechaFinPersonalizada()) {
        filtros.fechaFin = new Date(this.fechaFinPersonalizada());
      }
    }

    this.reporteService.getResumenCobros(filtros).subscribe({
      next: (resumen: ResumenCobros) => {
        this.resumen.set(resumen);
        this.cargando.set(false);
      },
      error: (error: any) => {
        console.error('Error al cargar reporte:', error);
        this.cargando.set(false);
      }
    });
  }

  cambiarPeriodo(periodo: PeriodoReporte): void {
    this.periodoSeleccionado.set(periodo);
    this.cargarReporte();
  }

  aplicarFiltros(): void {
    this.cargarReporte();
  }

  limpiarFiltros(): void {
    this.zonaSeleccionada.set('');
    this.estadoSeleccionado.set('todos');
    this.fechaInicioPersonalizada.set('');
    this.fechaFinPersonalizada.set('');
    if (this.periodoSeleccionado() === 'personalizado') {
      this.periodoSeleccionado.set('semana');
    }
    this.cargarReporte();
  }

  tieneFiltrosActivos(): boolean {
    return this.zonaSeleccionada() !== '' || 
           this.estadoSeleccionado() !== 'todos' ||
           this.periodoSeleccionado() === 'personalizado';
  }

  // ── Formateo ──────────────────────────────────────────────────────────────

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  }

  formatearPorcentaje(valor: number): string {
    return `${valor.toFixed(1)}%`;
  }

  formatearFecha(fecha: Date | string): string {
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getClaseCumplimiento(porcentaje: number): string {
    if (porcentaje >= 80) return 'cumplimiento-alto';
    if (porcentaje >= 50) return 'cumplimiento-medio';
    return 'cumplimiento-bajo';
  }

  formatearRangoFechas(): string {
    const resumen = this.resumen();
    if (!resumen) return '';

    const opciones: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    };
    
    const fechaInicio = new Date(resumen.fechaInicio).toLocaleDateString('es-CO', opciones);
    const fechaFin = new Date(resumen.fechaFin).toLocaleDateString('es-CO', opciones);
    
    return `${fechaInicio} - ${fechaFin}`;
  }

  /** Suma un campo numérico de un array de objetos */
  sumarCampo<T extends Record<string, any>>(items: T[], campo: keyof T): number {
    return items.reduce((acc, item) => acc + (Number(item[campo]) || 0), 0);
  }

  /** Cuenta cuántos ítems tienen un valor dado en estadoFinalizacion */
  contarEstado(items: ReportePrestamoFinalizado[], estado: string): number {
    return items.filter(i => i.estadoFinalizacion === estado).length;
  }
}
