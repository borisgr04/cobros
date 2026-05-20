import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../services/reporte.service';
import { AbstractZonaService } from '../../core/services/abstract-zona.service';
import type { ResumenCobros, PeriodoReporte, FiltrosReporte } from '../models/reporte.models';
import type { IZona } from '../../core/models';

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
  // Señales
  cargando = signal<boolean>(false);
  resumen = signal<ResumenCobros | null>(null);
  zonas = signal<IZona[]>([]);
  
  // Filtros
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

  // Computados
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
  }

  /**
   * Carga la lista de zonas
   */
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

  /**
   * Carga el reporte según los filtros actuales
   */
  cargarReporte(): void {
    this.cargando.set(true);
    
    const filtros: FiltrosReporte = {
      periodo: this.periodoSeleccionado(),
      zonaId: this.zonaSeleccionada() || undefined,
      estadoPrestamo: this.estadoSeleccionado() !== 'todos' 
        ? this.estadoSeleccionado() as 'al_dia' | 'proximo_vencer' | 'vencido'
        : undefined
    };

    // Si es período personalizado, agregar fechas
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

  /**
   * Cambia el período seleccionado
   */
  cambiarPeriodo(periodo: PeriodoReporte): void {
    this.periodoSeleccionado.set(periodo);
    this.cargarReporte();
  }

  /**
   * Aplica filtros del reporte
   */
  aplicarFiltros(): void {
    this.cargarReporte();
  }

  /**
   * Limpia todos los filtros
   */
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

  /**
   * Verifica si hay filtros activos
   */
  tieneFiltrosActivos(): boolean {
    return this.zonaSeleccionada() !== '' || 
           this.estadoSeleccionado() !== 'todos' ||
           this.periodoSeleccionado() === 'personalizado';
  }

  /**
   * Formatea un número como moneda
   */
  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  }

  /**
   * Formatea un porcentaje
   */
  formatearPorcentaje(valor: number): string {
    return `${valor.toFixed(1)}%`;
  }

  /**
   * Obtiene la clase CSS según el porcentaje de cumplimiento
   */
  getClaseCumplimiento(porcentaje: number): string {
    if (porcentaje >= 80) return 'cumplimiento-alto';
    if (porcentaje >= 50) return 'cumplimiento-medio';
    return 'cumplimiento-bajo';
  }

  /**
   * Formatea rango de fechas
   */
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
}
