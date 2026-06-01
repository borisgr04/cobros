import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../services/reporte.service';
import { AbstractZonaService } from '../../core/services/abstract-zona.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import type {
  ReporteCompleto,
  ReportePrestamoNuevo,
  ReportePrestamoFinalizado,
  ReporteRecaudoZona
} from '../models/reporte.models';
import type { IZona } from '../../core/models';

export type TabReporte = 'nuevos' | 'finalizados' | 'recaudo';

/**
 * Componente para visualizar reportes de cobros
 */
@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent implements OnInit {
  // ── Estado general ────────────────────────────────────────────────────────
  zonas = signal<IZona[]>([]);

  // ── Tab activo ────────────────────────────────────────────────────────────
  tabActiva = signal<TabReporte>('recaudo');

  tabs: Array<{ id: TabReporte; etiqueta: string; icono: string }> = [
    { id: 'recaudo',     etiqueta: 'Recaudo por Zona',    icono: 'bi-geo-alt-fill' },
    { id: 'nuevos',      etiqueta: 'Préstamos Nuevos',    icono: 'bi-plus-circle-fill' },
    { id: 'finalizados', etiqueta: 'Préstamos Finalizados', icono: 'bi-check-circle-fill' }
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

  constructor(
    private reporteService: ReporteService,
    private zonaService: AbstractZonaService
  ) {}

  ngOnInit(): void {
    this.cargarZonas();
    this.inicializarFechasReporte();
    this.cargarReporteCompleto();
  }

  // ── Inicialización ────────────────────────────────────────────────────────

  private inicializarFechasReporte(): void {
    const now = new Date();
    const hoy = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    this.fechaInicioReporte.set(hoy);
    this.fechaFinReporte.set(hoy);
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  cambiarTab(tab: TabReporte): void {
    this.tabActiva.set(tab);
    if (this.reporteCompleto() === null && !this.cargandoReporte()) {
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

    const fechaInicio = new Date(inicio + 'T00:00:00');
    const fechaFin = new Date(fin + 'T00:00:00');
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
    const inicio = this.fechaInicioReporte();
    const fin = this.fechaFinReporte();
    if (!inicio || !fin) return '';

    const opciones: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };

    const fechaInicio = new Date(inicio).toLocaleDateString('es-CO', opciones);
    const fechaFin = new Date(fin).toLocaleDateString('es-CO', opciones);

    return `${fechaInicio} - ${fechaFin}`;
  }

  /** Calcula los intereses de un préstamo nuevo */
  calcularIntereses(p: ReportePrestamoNuevo): number {
    return p.valorTotal - p.valorPrestado;
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
