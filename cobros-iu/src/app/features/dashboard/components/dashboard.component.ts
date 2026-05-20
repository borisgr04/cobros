import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../services/dashboard.service';
import type { KPI, Alerta, ResumenZona, ActividadReciente } from '../models/dashboard.models';

/**
 * Componente principal del Dashboard
 * Muestra métricas KPI, alertas, resumen por zona y actividad reciente
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  // Signals para datos del dashboard
  kpis = signal<KPI[]>([]);
  alertas = signal<Alerta[]>([]);
  resumenZonas = signal<ResumenZona[]>([]);
  actividadReciente = signal<ActividadReciente[]>([]);
  cargando = signal<boolean>(true);
  alertasExpanded = signal<boolean>(false); // Iniciar colapsado en móvil

  // Computed: Total de alertas críticas
  alertasCriticas = computed(() => 
    this.alertas().filter(a => a.tipo === 'critico').length
  );

  // Computed: Total general de resumen de zonas
  totalesZonas = computed(() => {
    const zonas = this.resumenZonas();
    return {
      clientes: zonas.reduce((sum, z) => sum + z.clientes, 0),
      prestamos: zonas.reduce((sum, z) => sum + z.prestamos, 0),
      cartera: zonas.reduce((sum, z) => sum + z.cartera, 0)
    };
  });

  ngOnInit(): void {
    this.cargarDatosDashboard();
  }

  /**
   * Carga todos los datos del dashboard
   */
  async cargarDatosDashboard(): Promise<void> {
    this.cargando.set(true);
    
    try {
      // Cargar KPIs
      const kpis = await this.dashboardService.getKPIs();
      this.kpis.set(kpis);

      // Cargar alertas
      const alertas = await this.dashboardService.getAlertas();
      this.alertas.set(alertas);

      // Cargar resumen por zona
      const resumen = await this.dashboardService.getResumenPorZona();
      this.resumenZonas.set(resumen);

      // Cargar actividad reciente
      const actividad = await this.dashboardService.getActividadReciente();
      this.actividadReciente.set(actividad);

    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      this.cargando.set(false);
    }
  }

  /**
   * Navega a una ruta específica
   */
  navegar(ruta: string): void {
    this.router.navigate([ruta]);
  }
  
  /**
   * Navega a préstamos filtrados por zona
   */
  verPrestamosZona(zona: ResumenZona): void {
    this.router.navigate(['/prestamos'], { 
      queryParams: { zona: zona.zonaId } 
    });
  }

  /**
   * Alterna la expansión del acordeón de alertas (solo móvil)
   */
  toggleAlertas(): void {
    this.alertasExpanded.set(!this.alertasExpanded());
  }

  /**
   * Obtiene el icono según el tipo de alerta
   */
  getIconoAlerta(tipo: string): string {
    const iconos: Record<string, string> = {
      'critico': '🔴',
      'advertencia': '🟡',
      'info': '🟢'
    };
    return iconos[tipo] || '📌';
  }

  /**
   * Obtiene la clase CSS según el estado de la zona
   */
  getClaseEstadoZona(estado: string): string {
    return `estado-${estado}`;
  }

  /**
   * Formatea un valor numérico
   */
  formatearValor(valor: number, formato: 'currency' | 'number'): string {
    if (formato === 'currency') {
      return `$${valor.toLocaleString('es-CO')}`;
    }
    return valor.toLocaleString('es-CO');
  }

  /**
   * Obtiene el icono de variación
   */
  getIconoVariacion(tipo: string | undefined): string {
    if (!tipo) return '';
    return tipo === 'aumento' ? '↑' : tipo === 'disminucion' ? '↓' : '→';
  }

  /**
   * Obtiene la clase de color de variación
   */
  getClaseVariacion(tipo: string | undefined): string {
    if (!tipo) return '';
    return `variacion-${tipo}`;
  }

  /**
   * Formatea la hora de actividad
   */
  formatearHora(fecha: Date): string {
    return fecha.toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Formatea la fecha de actividad
   */
  formatearFecha(fecha: Date): string {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    const fechaActividad = new Date(fecha);
    
    // Normalizar fechas para comparación (sin hora)
    hoy.setHours(0, 0, 0, 0);
    ayer.setHours(0, 0, 0, 0);
    fechaActividad.setHours(0, 0, 0, 0);

    if (fechaActividad.getTime() === hoy.getTime()) {
      return 'Hoy';
    } else if (fechaActividad.getTime() === ayer.getTime()) {
      return 'Ayer';
    } else {
      return fecha.toLocaleDateString('es-CO', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  }
}
