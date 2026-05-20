import { Injectable, inject } from '@angular/core';
import { PrestamoService } from '../../prestamos/services';
import { AbstractClienteService } from '../../core/services/abstract-cliente.service';
import { AbstractPagoService } from '../../core/services/abstract-pago.service';
import { AbstractZonaService } from '../../core/services/abstract-zona.service';
import { firstValueFrom } from 'rxjs';
import type { KPI, Alerta, ResumenZona, ActividadReciente } from '../models/dashboard.models';

/**
 * Servicio para gestionar los datos del Dashboard
 * Calcula KPIs, alertas, resúmenes y actividad reciente
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private prestamoService = inject(PrestamoService);
  private pagoService = inject(AbstractPagoService);
  private clienteService = inject(AbstractClienteService);
  private zonaService = inject(AbstractZonaService);

  /**
   * Calcula los KPIs principales del dashboard
   */
  async getKPIs(): Promise<KPI[]> {
    const prestamos = await firstValueFrom(this.prestamoService.getAllPrestamosConDatos());
    const clientes = await firstValueFrom(this.clienteService.getAll());
    const pagosHoy = await this.getPagosDeHoy();

    // KPI 1: Cartera Activa (suma de todos los valores totales de préstamos)
    const carteraActiva = prestamos.reduce((total, p) => 
      total + p.valorTotal, 0
    );

    // KPI 2: Clientes Activos
    const clientesActivos = clientes.filter(c => c.estado === 'activo').length;

    // KPI 3: Préstamos Activos
    const prestamosActivos = prestamos.length;

    // KPI 4: Cobros del Día
    const cobrosDelDia = pagosHoy.reduce((total, p) => total + p.valor, 0);

    return [
      {
        titulo: 'Préstamos Activos',
        valor: prestamosActivos,
        formato: 'number',
        icono: 'bi bi-cash-coin',
        variacion: 5,
        variacionTipo: 'aumento',
        ruta: '/prestamos' // Navegación a gestión de préstamos
      },
      {
        titulo: 'Clientes Activos',
        valor: clientesActivos,
        formato: 'number',
        icono: 'bi bi-people-fill',
        variacion: 12,
        variacionTipo: 'aumento',
        subtitulo: `${clientesActivos} clientes`,
        ruta: '/clientes' // Navegación a gestión de clientes
      },
      {
        titulo: 'Cartera Activa',
        valor: carteraActiva,
        formato: 'currency',
        icono: 'bi bi-wallet2',
        variacion: 8.5,
        variacionTipo: 'aumento'
      },
      {
        titulo: 'Cobros del Día',
        valor: cobrosDelDia,
        formato: 'currency',
        icono: 'bi bi-currency-dollar',
        subtitulo: `${pagosHoy.length} transacciones`
      }
    ];
  }

  /**
   * Genera las alertas importantes del sistema
   */
  async getAlertas(): Promise<Alerta[]> {
    const prestamos = await firstValueFrom(this.prestamoService.getAllPrestamosConDatos());
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Calcular préstamos vencidos
    const prestamosVencidos = prestamos.filter(p => {
      const fechaFinal = new Date(p.fechaFinal);
      fechaFinal.setHours(0, 0, 0, 0);
      const totalPorCobrar = p.estadisticas?.totalPorCobrar || 0;
      return fechaFinal < hoy && totalPorCobrar > 0;
    });

    // Calcular porcentaje de cartera al día
    const prestamosAlDia = prestamos.filter(p => {
      const estadisticas = p.estadisticas;
      return estadisticas && estadisticas.porcentajePagado >= 90;
    });
    const porcentajeAlDia = prestamos.length > 0 
      ? Math.round((prestamosAlDia.length / prestamos.length) * 100)
      : 100;

    const alertas: Alerta[] = [];

    // Alerta de préstamos vencidos
    if (prestamosVencidos.length > 0) {
      alertas.push({
        tipo: 'critico',
        icono: '🔴',
        mensaje: `${prestamosVencidos.length} préstamo${prestamosVencidos.length > 1 ? 's' : ''} vencido${prestamosVencidos.length > 1 ? 's' : ''} ${prestamosVencidos.length > 1 ? 'requieren' : 'requiere'} atención`,
        link: '/prestamos'
      });
    }

    // Calcular pagos próximos a vencer (próximos 3 días)
    const tresDiasDespues = new Date(hoy);
    tresDiasDespues.setDate(tresDiasDespues.getDate() + 3);
    
    // Aproximación: contar cuotas pendientes (simplificado)
    const cuotasPendientes = prestamos.reduce((total, p) => {
      const estadisticas = p.estadisticas;
      if (estadisticas) {
        const cuotasPendientes = estadisticas.cuotasPendientes || 0;
        return total + cuotasPendientes;
      }
      return total;
    }, 0);

    if (cuotasPendientes > 0) {
      alertas.push({
        tipo: 'advertencia',
        icono: '🟡',
        mensaje: `${cuotasPendientes} cuotas proyectadas pendientes de cobro`,
        link: '/prestamos'
      });
    }

    // Alerta de cartera al día
    alertas.push({
      tipo: porcentajeAlDia >= 80 ? 'info' : 'advertencia',
      icono: porcentajeAlDia >= 80 ? '🟢' : '🟡',
      mensaje: `Cartera al día: ${porcentajeAlDia}% de préstamos sin retraso`
    });

    return alertas;
  }

  /**
   * Genera el resumen por zona geográfica
   */
  async getResumenPorZona(): Promise<ResumenZona[]> {
    const zonas = await firstValueFrom(this.zonaService.getAll());
    const clientes = await firstValueFrom(this.clienteService.getAll());
    const prestamos = await firstValueFrom(this.prestamoService.getAllPrestamosConDatos());

    return zonas.map(zona => {
      const clientesZona = clientes.filter(c => c.zonaId === zona.id && c.estado === 'activo');
      const clientesIds = clientesZona.map(c => c.id);
      const prestamosZona = prestamos.filter(p => clientesIds.includes(p.clienteId));
      const cartera = prestamosZona.reduce((total, p) => total + p.valorTotal, 0);

      // Calcular estado basado en cartera
      let estado: 'excelente' | 'bueno' | 'regular' | 'critico' = 'bueno';
      if (cartera >= 15000000) {
        estado = 'excelente';
      } else if (cartera >= 10000000) {
        estado = 'bueno';
      } else if (cartera >= 5000000) {
        estado = 'regular';
      } else {
        estado = 'critico';
      }

      return {
        zonaId: zona.id,
        zona: zona.nombre,
        clientes: clientesZona.length,
        prestamos: prestamosZona.length,
        cartera,
        estado
      };
    }).sort((a, b) => b.cartera - a.cartera); // Ordenar por cartera descendente
  }

  /**
   * Obtiene la actividad reciente del sistema
   */
  async getActividadReciente(): Promise<ActividadReciente[]> {
    const pagos = await firstValueFrom(this.pagoService.getAll());
    const prestamos = await firstValueFrom(this.prestamoService.getAllPrestamosConDatos());

    // Ordenar pagos por fecha descendente y tomar los 10 más recientes
    const pagosRecientes = [...pagos]
      .sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime())
      .slice(0, 10);

    return pagosRecientes.map(pago => {
      const prestamo = prestamos.find(p => p.id === pago.prestamoId);
      const clienteNombre = prestamo?.cliente?.nombre || 'Cliente desconocido';
      
      return {
        tipo: 'pago',
        hora: new Date(pago.fechaPago),
        icono: '💰',
        descripcion: 'Pago registrado',
        detalles: `${clienteNombre} - $${pago.valor.toLocaleString('es-CO')} - Préstamo ${pago.prestamoId.substring(0, 12)}...`
      };
    });
  }

  /**
   * Obtiene los pagos realizados hoy
   * @private
   */
  private async getPagosDeHoy() {
    const pagos = await firstValueFrom(this.pagoService.getAll());
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return pagos.filter(p => {
      const fechaPago = new Date(p.fechaPago);
      fechaPago.setHours(0, 0, 0, 0);
      return fechaPago.getTime() === hoy.getTime();
    });
  }
}
