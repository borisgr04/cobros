import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, combineLatest } from 'rxjs';
import { 
  ResumenCobros, 
  PeriodoReporte, 
  FiltrosReporte,
  CobrosPorZona,
  CobrosPorEstado,
  ClienteMoroso,
  ClienteCumplidor,
  ReporteCompleto
} from '../models/reporte.models';
import { AbstractPrestamoService } from '../../core/services/abstract-prestamo.service';
import { AbstractPagoService } from '../../core/services/abstract-pago.service';
import { AbstractZonaService } from '../../core/services/abstract-zona.service';
import { AbstractClienteService } from '../../core/services/abstract-cliente.service';
import type { IPrestamo, IPago, ICliente, IZona } from '../../core/models';

/**
 * Servicio para generar reportes de cobros
 */
@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private http = inject(HttpClient);
  private prestamoDataService = inject(AbstractPrestamoService);
  private pagoService = inject(AbstractPagoService);
  private zonaService = inject(AbstractZonaService);
  private clienteService = inject(AbstractClienteService);

  private readonly apiUrl = '/api/reportes';

  /**
   * Obtiene el reporte completo desde el backend para un rango de fechas.
   * Incluye préstamos nuevos, finalizados y recaudo por zona con detalle por cliente.
   */
  getReporteCompleto(fechaInicio: Date, fechaFin: Date, zonaId?: string): Observable<ReporteCompleto> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio.toISOString())
      .set('fechaFin', fechaFin.toISOString());

    if (zonaId) {
      params = params.set('zonaId', zonaId);
    }

    return this.http.get<ReporteCompleto>(this.apiUrl, { params });
  }

  /**
   * Obtiene el resumen de cobros para un período específico
   */
  getResumenCobros(filtros: FiltrosReporte): Observable<ResumenCobros> {
    const { fechaInicio, fechaFin } = this.calcularFechasPeriodo(
      filtros.periodo, 
      filtros.fechaInicio, 
      filtros.fechaFin
    );

    return combineLatest([
      this.prestamoDataService.getAll(),
      this.pagoService.getAll(),
      this.zonaService.getAll(),
      this.clienteService.getAll()
    ]).pipe(
      map(([prestamos, pagos, zonas, clientes]) => {
        // Filtrar por zona si se especifica
        if (filtros.zonaId) {
          const clientesZona = clientes.filter(c => c.zonaId === filtros.zonaId);
          const clientesIds = new Set(clientesZona.map(c => c.id));
          prestamos = prestamos.filter(p => clientesIds.has(p.clienteId));
        }

        // Filtrar por estado de préstamo si se especifica
        if (filtros.estadoPrestamo && filtros.estadoPrestamo !== 'todos') {
          prestamos = prestamos.filter(prestamo => {
            const estadoPrestamo = this.determinarEstadoPrestamo(prestamo, pagos, fechaFin);
            return estadoPrestamo === filtros.estadoPrestamo;
          });
        }

        // Obtener todos los pagos del período
        const pagosDelPeriodo = this.obtenerPagosDelPeriodo(pagos, fechaInicio, fechaFin);
        
        // Calcular métricas principales
        const montoCobrado = pagosDelPeriodo.reduce((sum, pago) => sum + pago.valor, 0);
        const montoEsperado = this.calcularMontoEsperado(prestamos, fechaInicio, fechaFin);
        const porcentajeCumplimiento = montoEsperado > 0 ? (montoCobrado / montoEsperado) * 100 : 0;

        // Calcular estadísticas por zona
        const cobrosPorZona = this.calcularCobrosPorZona(prestamos, pagosDelPeriodo, pagos, zonas, clientes, fechaInicio, fechaFin);

        // Calcular estadísticas por estado
        const cobrosPorEstado = this.calcularCobrosPorEstado(prestamos, pagos, fechaFin);

        // Calcular top clientes
        const topClientesMorosos = this.calcularClientesMorosos(prestamos, pagos, clientes, zonas, fechaFin);
        const topClientesCumplidores = this.calcularClientesCumplidores(prestamos, pagos, clientes, zonas, fechaInicio, fechaFin);

        return {
          periodo: filtros.periodo,
          fechaInicio,
          fechaFin,
          totalCobros: pagosDelPeriodo.length,
          montoCobrado,
          montoEsperado,
          porcentajeCumplimiento,
          pagosRealizados: pagosDelPeriodo.length,
          pagosPendientes: this.contarPagosPendientes(prestamos, pagos),
          pagosVencidos: this.contarPagosVencidos(prestamos, pagos, fechaFin),
          cobrosPorZona,
          cobrosPorEstado,
          topClientesMorosos: topClientesMorosos.slice(0, 5),
          topClientesCumplidores: topClientesCumplidores.slice(0, 5)
        };
      })
    );
  }

  /**
   * Calcula las fechas de inicio y fin según el período
   */
  private calcularFechasPeriodo(
    periodo: PeriodoReporte, 
    fechaInicioCustom?: Date,
    fechaFinCustom?: Date
  ): { fechaInicio: Date; fechaFin: Date } {
    // Si es personalizado y se proporcionan fechas, usarlas
    if (periodo === 'personalizado' && fechaInicioCustom && fechaFinCustom) {
      const fechaInicio = new Date(fechaInicioCustom);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fechaFinCustom);
      fechaFin.setHours(23, 59, 59, 999);
      return { fechaInicio, fechaFin };
    }

    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    const fechaFin = new Date(hoy);
    
    // Inicializar fechaInicio con valor por defecto
    let fechaInicio = new Date(hoy);
    fechaInicio.setDate(hoy.getDate() - 6);
    fechaInicio.setHours(0, 0, 0, 0);

    switch (periodo) {
      case 'dia':
        fechaInicio = new Date(hoy);
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      case 'semana':
        fechaInicio = new Date(hoy);
        fechaInicio.setDate(hoy.getDate() - 6);
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      case 'mes':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      case 'personalizado':
        // Si no hay fechas personalizadas, usar la semana actual por defecto
        // (ya está inicializado arriba)
        break;
    }

    return { fechaInicio, fechaFin };
  }

  /**
   * Obtiene los pagos realizados en un período
   */
  private obtenerPagosDelPeriodo(pagos: IPago[], fechaInicio: Date, fechaFin: Date): IPago[] {
    return pagos.filter(pago => {
      const fechaPago = new Date(pago.fechaPago);
      return fechaPago >= fechaInicio && fechaPago <= fechaFin;
    });
  }

  /**
   * Calcula el monto esperado de cobros para un período
   */
  private calcularMontoEsperado(prestamos: IPrestamo[], fechaInicio: Date, fechaFin: Date): number {
    let montoEsperado = 0;

    prestamos.forEach(prestamo => {
      // Solo contar préstamos activos (que no hayan vencido)
      if (new Date(prestamo.fechaFinal) >= fechaInicio) {
        // Contar cuántas cuotas debían pagarse en el período
        const cuotasEsperadas = this.contarCuotasEnPeriodo(prestamo, fechaInicio, fechaFin);
        montoEsperado += cuotasEsperadas * prestamo.valorCuota;
      }
    });

    return montoEsperado;
  }

  /**
   * Cuenta cuántas cuotas debían pagarse en un período
   */
  private contarCuotasEnPeriodo(prestamo: IPrestamo, fechaInicio: Date, fechaFin: Date): number {
    let contador = 0;
    const fechaPrestamo = new Date(prestamo.fechaPrestamo);
    
    // Calcular días según frecuencia
    const diasEntreCuotas = this.obtenerDiasEntreCuotas(prestamo.frecuenciaPago);

    // Iterar por cada cuota esperada
    for (let i = 1; i <= prestamo.cantidadCuotas; i++) {
      const fechaCuota = new Date(fechaPrestamo);
      fechaCuota.setDate(fechaCuota.getDate() + (i * diasEntreCuotas));

      if (fechaCuota >= fechaInicio && fechaCuota <= fechaFin) {
        contador++;
      }
    }

    return contador;
  }

  /**
   * Calcula cobros agrupados por zona
   */
  private calcularCobrosPorZona(
    prestamos: IPrestamo[],
    pagosDelPeriodo: IPago[],
    todosPagos: IPago[],
    zonas: IZona[],
    clientes: ICliente[],
    fechaInicio: Date,
    fechaFin: Date
  ): CobrosPorZona[] {
    const cobrosPorZona = new Map<string, CobrosPorZona>();

    zonas.forEach(zona => {
      cobrosPorZona.set(zona.id, {
        zonaId: zona.id,
        zonaNombre: zona.nombre,
        totalCobros: 0,
        montoCobrado: 0,
        montoEsperado: 0,
        porcentajeCumplimiento: 0,
        pagosRealizados: 0,
        pagosPendientes: 0
      });
    });

    // Procesar préstamos por zona
    prestamos.forEach(prestamo => {
      const cliente = clientes.find(c => c.id === prestamo.clienteId);
      if (!cliente) return;

      const zonaData = cobrosPorZona.get(cliente.zonaId);
      if (!zonaData) return;

      // Sumar pagos realizados en el período
      const pagosPrestamo = pagosDelPeriodo.filter(pago => pago.prestamoId === prestamo.id);
      zonaData.montoCobrado += pagosPrestamo.reduce((sum, pago) => sum + pago.valor, 0);
      zonaData.pagosRealizados += pagosPrestamo.length;

      // Calcular monto esperado
      if (new Date(prestamo.fechaFinal) >= fechaInicio) {
        const cuotasEsperadas = this.contarCuotasEnPeriodo(prestamo, fechaInicio, fechaFin);
        zonaData.montoEsperado += cuotasEsperadas * prestamo.valorCuota;
      }
    });

    // Calcular porcentajes
    cobrosPorZona.forEach(zona => {
      zona.totalCobros = zona.pagosRealizados;
      zona.porcentajeCumplimiento = zona.montoEsperado > 0 
        ? (zona.montoCobrado / zona.montoEsperado) * 100 
        : 0;
    });

    return Array.from(cobrosPorZona.values())
      .filter(z => z.montoEsperado > 0 || z.montoCobrado > 0)
      .sort((a, b) => b.montoCobrado - a.montoCobrado);
  }

  /**
   * Determina el estado de un préstamo (al_dia, proximo_vencer, vencido)
   */
  private determinarEstadoPrestamo(
    prestamo: IPrestamo, 
    pagos: IPago[], 
    fechaActual: Date
  ): 'al_dia' | 'proximo_vencer' | 'vencido' {
    const fechaFinalPrestamo = new Date(prestamo.fechaFinal);
    if (fechaFinalPrestamo < fechaActual) {
      return 'vencido'; // Préstamo ya finalizado se considera vencido
    }

    const pagosPrestamo = pagos.filter(p => p.prestamoId === prestamo.id);
    const diasEntreCuotas = this.obtenerDiasEntreCuotas(prestamo.frecuenciaPago);
    const fechaUltimoPago = pagosPrestamo.length > 0
      ? new Date(Math.max(...pagosPrestamo.map(p => new Date(p.fechaPago).getTime())))
      : new Date(prestamo.fechaPrestamo);
    
    const proximoPagoFecha = new Date(fechaUltimoPago);
    proximoPagoFecha.setDate(proximoPagoFecha.getDate() + diasEntreCuotas);

    const diasHastaProximoPago = Math.floor(
      (proximoPagoFecha.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diasHastaProximoPago < 0) {
      return 'vencido';
    } else if (diasHastaProximoPago <= 3) {
      return 'proximo_vencer';
    } else {
      return 'al_dia';
    }
  }

  /**
   * Calcula cobros agrupados por estado
   */
  private calcularCobrosPorEstado(prestamos: IPrestamo[], pagos: IPago[], fechaFin: Date): CobrosPorEstado[] {
    const estados = {
      al_dia: { cantidad: 0, monto: 0 },
      proximo_vencer: { cantidad: 0, monto: 0 },
      vencido: { cantidad: 0, monto: 0 }
    };

    prestamos.forEach(prestamo => {
      // Considerar solo préstamos activos (no completamente pagados)
      const pagosPrestamo = pagos.filter(p => p.prestamoId === prestamo.id);
      const pagosRealizados = pagosPrestamo.length;
      
      // Si el préstamo ya está completamente pagado, no incluirlo
      if (pagosRealizados >= prestamo.cantidadCuotas) return;

      const pagosPendientes = prestamo.cantidadCuotas - pagosRealizados;
      const montoPendiente = pagosPendientes * prestamo.valorCuota;

      // Determinar estado basado en próximo pago
      const diasEntreCuotas = this.obtenerDiasEntreCuotas(prestamo.frecuenciaPago);
      const fechaUltimoPago = pagosPrestamo.length > 0
        ? new Date(Math.max(...pagosPrestamo.map(p => new Date(p.fechaPago).getTime())))
        : new Date(prestamo.fechaPrestamo);
      
      const proximoPagoFecha = new Date(fechaUltimoPago);
      proximoPagoFecha.setDate(proximoPagoFecha.getDate() + diasEntreCuotas);

      const diasHastaProximoPago = Math.floor((proximoPagoFecha.getTime() - fechaFin.getTime()) / (1000 * 60 * 60 * 24));

      if (diasHastaProximoPago < 0) {
        estados.vencido.cantidad++;
        estados.vencido.monto += montoPendiente;
      } else if (diasHastaProximoPago <= 3) {
        estados.proximo_vencer.cantidad++;
        estados.proximo_vencer.monto += montoPendiente;
      } else {
        estados.al_dia.cantidad++;
        estados.al_dia.monto += montoPendiente;
      }
    });

    const total = estados.al_dia.cantidad + estados.proximo_vencer.cantidad + estados.vencido.cantidad;

    return [
      {
        estado: 'al_dia',
        estadoNombre: 'Al día',
        cantidad: estados.al_dia.cantidad,
        monto: estados.al_dia.monto,
        porcentaje: total > 0 ? (estados.al_dia.cantidad / total) * 100 : 0,
        color: '#00E676'
      },
      {
        estado: 'proximo_vencer',
        estadoNombre: 'Próximo a vencer',
        cantidad: estados.proximo_vencer.cantidad,
        monto: estados.proximo_vencer.monto,
        porcentaje: total > 0 ? (estados.proximo_vencer.cantidad / total) * 100 : 0,
        color: '#FFD600'
      },
      {
        estado: 'vencido',
        estadoNombre: 'Vencido',
        cantidad: estados.vencido.cantidad,
        monto: estados.vencido.monto,
        porcentaje: total > 0 ? (estados.vencido.cantidad / total) * 100 : 0,
        color: '#FF1744'
      }
    ];
  }

  /**
   * Calcula los clientes más morosos
   */
  private calcularClientesMorosos(
    prestamos: IPrestamo[], 
    pagos: IPago[], 
    clientes: ICliente[], 
    zonas: IZona[], 
    fechaActual: Date
  ): ClienteMoroso[] {
    const clientesMorosos = new Map<string, ClienteMoroso>();

    prestamos.forEach(prestamo => {
      const fechaFinalPrestamo = new Date(prestamo.fechaFinal);
      if (fechaFinalPrestamo < fechaActual) return; // Préstamo ya finalizado

      const cliente = clientes.find(c => c.id === prestamo.clienteId);
      if (!cliente) return;

      const zona = zonas.find(z => z.id === cliente.zonaId);
      
      const pagosPrestamo = pagos.filter(p => p.prestamoId === prestamo.id);
      const pagosRealizados = pagosPrestamo.length;
      const diasEntreCuotas = this.obtenerDiasEntreCuotas(prestamo.frecuenciaPago);
      const fechaUltimoPago = pagosPrestamo.length > 0
        ? new Date(Math.max(...pagosPrestamo.map(p => new Date(p.fechaPago).getTime())))
        : new Date(prestamo.fechaPrestamo);
      
      const proximoPagoFecha = new Date(fechaUltimoPago);
      proximoPagoFecha.setDate(proximoPagoFecha.getDate() + diasEntreCuotas);

      const diasVencido = Math.floor((fechaActual.getTime() - proximoPagoFecha.getTime()) / (1000 * 60 * 60 * 24));

      if (diasVencido > 0) {
        if (!clientesMorosos.has(cliente.id)) {
          clientesMorosos.set(cliente.id, {
            clienteId: cliente.id,
            clienteNombre: cliente.nombre,
            zonaId: cliente.zonaId,
            zonaNombre: zona?.nombre || 'Sin zona',
            prestamosActivos: 0,
            montoVencido: 0,
            diasVencido: 0
          });
        }

        const clienteData = clientesMorosos.get(cliente.id)!;
        clienteData.prestamosActivos++;
        clienteData.montoVencido += (prestamo.cantidadCuotas - pagosRealizados) * prestamo.valorCuota;
        clienteData.diasVencido = Math.max(clienteData.diasVencido, diasVencido);
      }
    });

    return Array.from(clientesMorosos.values())
      .sort((a, b) => b.montoVencido - a.montoVencido);
  }

  /**
   * Calcula los clientes con mejor cumplimiento
   */
  private calcularClientesCumplidores(
    prestamos: IPrestamo[],
    pagos: IPago[],
    clientes: ICliente[],
    zonas: IZona[],
    fechaInicio: Date,
    fechaFin: Date
  ): ClienteCumplidor[] {
    const clientesCumplidores = new Map<string, ClienteCumplidor>();

    prestamos.forEach(prestamo => {
      const cliente = clientes.find(c => c.id === prestamo.clienteId);
      if (!cliente) return;

      const zona = zonas.find(z => z.id === cliente.zonaId);
      
      const pagosPrestamo = pagos.filter(p => p.prestamoId === prestamo.id);
      const pagosDelPeriodo = pagosPrestamo.filter(pago => {
        const fechaPago = new Date(pago.fechaPago);
        return fechaPago >= fechaInicio && fechaPago <= fechaFin;
      });

      if (pagosDelPeriodo.length > 0) {
        if (!clientesCumplidores.has(cliente.id)) {
          clientesCumplidores.set(cliente.id, {
            clienteId: cliente.id,
            clienteNombre: cliente.nombre,
            zonaId: cliente.zonaId,
            zonaNombre: zona?.nombre || 'Sin zona',
            prestamosActivos: 0,
            montoPagado: 0,
            porcentajeCumplimiento: 0
          });
        }

        const clienteData = clientesCumplidores.get(cliente.id)!;
        clienteData.prestamosActivos++;
        clienteData.montoPagado += pagosDelPeriodo.reduce((sum, pago) => sum + pago.valor, 0);

        // Calcular cumplimiento
        const cuotasEsperadas = this.contarCuotasEnPeriodo(prestamo, fechaInicio, fechaFin);
        const cuotasPagadas = pagosDelPeriodo.length;
        const cumplimiento = cuotasEsperadas > 0 ? (cuotasPagadas / cuotasEsperadas) * 100 : 0;
        
        // Promedio de cumplimiento
        clienteData.porcentajeCumplimiento = 
          (clienteData.porcentajeCumplimiento * (clienteData.prestamosActivos - 1) + cumplimiento) / 
          clienteData.prestamosActivos;
      }
    });

    return Array.from(clientesCumplidores.values())
      .filter(c => c.porcentajeCumplimiento >= 80)
      .sort((a, b) => b.montoPagado - a.montoPagado);
  }

  /**
   * Cuenta pagos pendientes
   */
  private contarPagosPendientes(prestamos: IPrestamo[], pagos: IPago[]): number {
    let contador = 0;
    prestamos.forEach(prestamo => {
      const pagosPrestamo = pagos.filter(p => p.prestamoId === prestamo.id);
      const pagosRealizados = pagosPrestamo.length;
      contador += (prestamo.cantidadCuotas - pagosRealizados);
    });
    return Math.max(0, contador);
  }

  /**
   * Cuenta pagos vencidos
   */
  private contarPagosVencidos(prestamos: IPrestamo[], pagos: IPago[], fechaFin: Date): number {
    let contador = 0;
    prestamos.forEach(prestamo => {
      const pagosPrestamo = pagos.filter(p => p.prestamoId === prestamo.id);
      const pagosRealizados = pagosPrestamo.length;
      const diasEntreCuotas = this.obtenerDiasEntreCuotas(prestamo.frecuenciaPago);
      const fechaUltimoPago = pagosPrestamo.length > 0
        ? new Date(Math.max(...pagosPrestamo.map(p => new Date(p.fechaPago).getTime())))
        : new Date(prestamo.fechaPrestamo);
      
      const proximoPagoFecha = new Date(fechaUltimoPago);
      proximoPagoFecha.setDate(proximoPagoFecha.getDate() + diasEntreCuotas);

      if (proximoPagoFecha < fechaFin && pagosRealizados < prestamo.cantidadCuotas) {
        contador++;
      }
    });
    return contador;
  }

  /**
   * Obtiene días entre cuotas según frecuencia
   */
  private obtenerDiasEntreCuotas(frecuencia: string): number {
    switch (frecuencia) {
      case 'diario': return 1;
      case 'semanal': return 7;
      case 'quincenal': return 15;
      case 'mensual': return 30;
      default: return 7;
    }
  }
}
