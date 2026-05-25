import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, forkJoin, map, of, switchMap } from 'rxjs';
import type { IPrestamo, IPago, ICliente, IClienteConPrestamos } from '../../core/models';
import { AbstractPrestamoService } from '../../core/services/abstract-prestamo.service';
import { AbstractPagoService } from '../../core/services/abstract-pago.service';
import { AbstractClienteService } from '../../core/services/abstract-cliente.service';
import {
  calcularEstadisticasPrestamo,
  calcularPorcentajePagado,
  calcularProximaCuotaFecha,
  calcularProximaCuotaValor,
  calcularDiasTranscurridos,
  calcularDiasRestantes,
  determinarEstadoPrestamo,
  generarProyeccionCuotas,
  mapCuotasDesdeBackend,
  type EstadisticasPrestamo,
  type CuotaProyectada,
  type CuotaDetalleDto,
  type EstadoPrestamo,
} from '../utils/prestamo-calculations';

/**
 * Interface para datos completos de un préstamo con información del cliente
 */
export interface PrestamoConCliente extends IPrestamo {
  cliente?: ICliente;
  estadisticas?: EstadisticasPrestamo;
}

/**
 * Servicio orquestador para la gestión de préstamos.
 * Combina datos de préstamos, pagos y clientes con lógica de negocio.
 */
@Injectable({
  providedIn: 'root'
})
export class PrestamoService {
  private prestamoDataService = inject(AbstractPrestamoService);
  private pagoService = inject(AbstractPagoService);
  private clienteService = inject(AbstractClienteService);

  private parsePrestamo(p: IPrestamo): IPrestamo {
    return {
      ...p,
      fechaPrestamo: new Date(p.fechaPrestamo),
      fechaFinal: new Date(p.fechaFinal),
    };
  }

  getAllPrestamosConDatos(): Observable<PrestamoConCliente[]> {
    return combineLatest([
      this.prestamoDataService.getAll(),
      this.pagoService.getAll(),
      this.clienteService.getAll(),
    ]).pipe(
      map(([prestamos, pagos, clientes]) => {
        return prestamos.map(raw => {
          const prestamo = this.parsePrestamo(raw);
          const cliente = clientes.find(c => c.id === prestamo.clienteId);
          const pagosPrestamo = pagos.filter(p => p.prestamoId === prestamo.id);
          const estadisticas = calcularEstadisticasPrestamo(prestamo, pagosPrestamo);
          return { ...prestamo, cliente, estadisticas };
        });
      })
    );
  }

  getPrestamoConDatos(id: string): Observable<PrestamoConCliente> {
    return combineLatest([
      this.prestamoDataService.getById(id),
      this.pagoService.getByPrestamo(id),
      this.clienteService.getAll(),
    ]).pipe(
      map(([raw, pagos, clientes]) => {
        const prestamo = this.parsePrestamo(raw);
        const cliente = clientes.find(c => c.id === prestamo.clienteId);
        const estadisticas = calcularEstadisticasPrestamo(prestamo, pagos);
        return { ...prestamo, cliente, estadisticas };
      })
    );
  }

  getAllPrestamos(): Observable<IPrestamo[]> {
    return this.prestamoDataService.getAll();
  }

  getPrestamoById(id: string): Observable<IPrestamo> {
    return this.prestamoDataService.getById(id);
  }

  createPrestamo(prestamo: IPrestamo): Observable<IPrestamo> {
    return this.prestamoDataService.create(prestamo);
  }

  updatePrestamo(id: string, prestamo: IPrestamo): Observable<IPrestamo> {
    return this.prestamoDataService.update(id, prestamo);
  }

  deletePrestamo(id: string): Observable<void> {
    return this.prestamoDataService.delete(id);
  }

  getPrestamosByCliente(clienteId: string): Observable<IPrestamo[]> {
    return this.prestamoDataService.getByCliente(clienteId);
  }

  /**
   * Obtiene los préstamos de un cliente con estadísticas calculadas.
   * Carga solo los datos del cliente indicado (lazy / bajo demanda).
   */
  getPrestamosConDatosByCliente(clienteId: string): Observable<PrestamoConCliente[]> {
    return this.prestamoDataService.getByCliente(clienteId).pipe(
      switchMap(rawPrestamos => {
        if (rawPrestamos.length === 0) return of([]);
        return forkJoin(
          rawPrestamos.map(raw =>
            this.pagoService.getByPrestamo(raw.id).pipe(
              map(pagos => {
                const prestamo = this.parsePrestamo(raw);
                const estadisticas = calcularEstadisticasPrestamo(prestamo, pagos);
                return { ...prestamo, estadisticas } as PrestamoConCliente;
              })
            )
          )
        );
      })
    );
  }

  /**
   * Calcula estadísticas de una lista de préstamos ya obtenidos del backend.
   * Útil cuando los préstamos ya llegan en un DTO combinado (evita una llamada extra).
   * @param cliente Cliente al que pertenecen los préstamos; si se provee, se incluye en cada PrestamoConCliente.
   */
  getPrestamosConDatosDesde(prestamos: IPrestamo[], cliente?: ICliente): Observable<PrestamoConCliente[]> {
    if (prestamos.length === 0) return of([]);
    return forkJoin(
      prestamos.map(raw =>
        this.pagoService.getByPrestamo(raw.id).pipe(
          map(pagos => {
            const prestamo = this.parsePrestamo(raw);
            const estadisticas = calcularEstadisticasPrestamo(prestamo, pagos);
            return { ...prestamo, cliente, estadisticas } as PrestamoConCliente;
          })
        )
      )
    );
  }

  getAllPagos(): Observable<IPago[]> {
    return this.pagoService.getAll();
  }

  getPagosByPrestamo(prestamoId: string): Observable<IPago[]> {
    return this.pagoService.getByPrestamo(prestamoId);
  }

  createPago(pago: IPago): Observable<IPago> {
    return this.pagoService.create(pago);
  }

  deletePago(id: string): Observable<void> {
    return this.pagoService.delete(id);
  }

  calcularEstadisticas(prestamo: IPrestamo, pagos: IPago[]): EstadisticasPrestamo {
    return calcularEstadisticasPrestamo(prestamo, pagos);
  }

  generarProyeccion(prestamo: IPrestamo, pagos: IPago[]): CuotaProyectada[] {
    return generarProyeccionCuotas(prestamo, pagos);
  }

  /** Obtiene las cuotas con saldo del backend y las mapea a CuotaProyectada[] */
  getCuotasDetalle(id: string): Observable<CuotaProyectada[]> {
    return this.prestamoDataService.calcularCuotas(id).pipe(
      map((cuotas: CuotaDetalleDto[]) => mapCuotasDesdeBackend(cuotas))
    );
  }

  /**
   * Construye la caché de préstamos por clienteId a partir de la respuesta consolidada
   * del endpoint GET /api/clientes/con-prestamos. No realiza ninguna llamada HTTP adicional.
   */
  buildCacheDesdeClientesConsolidados(clientes: IClienteConPrestamos[]): Record<string, PrestamoConCliente[]> {
    const cache: Record<string, PrestamoConCliente[]> = {};
    for (const cliente of clientes) {
      cache[cliente.id] = cliente.prestamos.map(raw => {
        const prestamo = this.parsePrestamo(raw);
        const cuotasPagadas = prestamo.valorCuota > 0
          ? Math.round(raw.totalPagado / prestamo.valorCuota)
          : 0;
        const cuotasPendientes = Math.max(0, prestamo.cantidadCuotas - cuotasPagadas);
        const proximaCuotaFecha = calcularProximaCuotaFecha(prestamo.fechaPrestamo, prestamo.frecuenciaPago, cuotasPagadas);
        const estadisticas: EstadisticasPrestamo = {
          totalPrestado: prestamo.valorPrestado,
          totalPorCobrar: raw.saldoPendiente,
          totalPagado: raw.totalPagado,
          porcentajePagado: calcularPorcentajePagado(prestamo.valorTotal, raw.totalPagado),
          cuotasPagadas,
          cuotasPendientes,
          diasTranscurridos: calcularDiasTranscurridos(prestamo.fechaPrestamo),
          diasRestantes: calcularDiasRestantes(prestamo.fechaFinal),
          proximaCuotaFecha,
          proximaCuotaValor: calcularProximaCuotaValor(prestamo.valorCuota, raw.saldoPendiente),
          estado: determinarEstadoPrestamo(prestamo.fechaFinal, raw.saldoPendiente, proximaCuotaFecha),
        };
        const { prestamos: _prestamos, ...clienteData } = cliente;
        return { ...prestamo, cliente: clienteData as ICliente, estadisticas } as PrestamoConCliente;
      });
    }
    return cache;
  }

  getEstadisticasGlobales(): Observable<{
    totalActivos: number;
    totalPrestado: number;
    totalPorCobrar: number;
    totalVencidos: number;
  }> {
    return this.getAllPrestamosConDatos().pipe(
      map(prestamos => ({
        totalActivos: prestamos.filter(p => p.estadisticas?.estado === 'activo').length,
        totalPrestado: prestamos.reduce((sum, p) => sum + p.valorPrestado, 0),
        totalPorCobrar: prestamos.reduce((sum, p) => sum + (p.estadisticas?.totalPorCobrar || 0), 0),
        totalVencidos: prestamos.filter(p => p.estadisticas?.estado === 'vencido').length,
      }))
    );
  }
}
