import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import type { IPrestamo } from '../../core/models';
import type { INovedadPrestamo, IProntoPagoResumen, IProntoPagoResultado, IAmpliacionPlazoResumen, IAmpliacionPlazoInput, IAmpliacionPlazoResultado, IRecogerPrestamoInput, IRecogerPrestamoResultado } from '../../core/models';
import { AbstractPrestamoService } from '../../core/services/abstract-prestamo.service';

/**
 * Servicio mock para simular operaciones CRUD de préstamos sin backend real.
 * Implementa AbstractPrestamoService para ser intercambiable con PrestamoService (HTTP).
 */
@Injectable({
  providedIn: 'root'
})
export class PrestamoMockService implements AbstractPrestamoService {
  /**
   * Base de datos en memoria para préstamos mock
   */
  private prestamos: IPrestamo[] = [
    {
      id: '1',
      clienteId: '1', // Juan Pérez
      fechaPrestamo: new Date('2024-11-15'),
      fechaFinal: new Date('2025-05-15'),
      valorPrestado: 1000000,
      valorTotal: 1200000,
      interesProyectado: 200000,
      frecuenciaPago: 'semanal',
      cantidadCuotas: 26,
      valorCuota: 46154,
    },
    {
      id: '2',
      clienteId: '2', // María López
      fechaPrestamo: new Date('2025-01-01'),
      fechaFinal: new Date('2025-07-01'),
      valorPrestado: 2000000,
      valorTotal: 2400000,
      interesProyectado: 400000,
      frecuenciaPago: 'quincenal',
      cantidadCuotas: 12,
      valorCuota: 200000,
    },
    {
      id: '3',
      clienteId: '3', // Carlos Rodríguez
      fechaPrestamo: new Date('2024-12-01'),
      fechaFinal: new Date('2025-06-01'),
      valorPrestado: 500000,
      valorTotal: 575000,
      interesProyectado: 75000,
      frecuenciaPago: 'mensual',
      cantidadCuotas: 6,
      valorCuota: 95833,
    },
    {
      id: '4',
      clienteId: '5', // Roberto Sánchez
      fechaPrestamo: new Date('2024-09-01'),
      fechaFinal: new Date('2024-10-31'),
      valorPrestado: 300000,
      valorTotal: 330000,
      interesProyectado: 30000,
      frecuenciaPago: 'diario',
      cantidadCuotas: 60,
      valorCuota: 5500,
    },
    {
      id: '5',
      clienteId: '4', // Ana García
      fechaPrestamo: new Date('2025-08-15'),
      fechaFinal: new Date('2025-09-15'),
      valorPrestado: 150000,
      valorTotal: 165000,
      interesProyectado: 15000,
      frecuenciaPago: 'diario',
      cantidadCuotas: 31,
      valorCuota: 5323,
    },
    {
      id: '6',
      clienteId: '6', // Laura Martínez
      fechaPrestamo: new Date('2025-09-01'),
      fechaFinal: new Date('2025-10-16'),
      valorPrestado: 200000,
      valorTotal: 220000,
      interesProyectado: 20000,
      frecuenciaPago: 'diario',
      cantidadCuotas: 45,
      valorCuota: 4889,
    },
  ];

  private nextPrestamoId = 7;
  private readonly MOCK_DELAY = 500;

  getAll(): Observable<IPrestamo[]> {
    return of([...this.prestamos]).pipe(delay(this.MOCK_DELAY));
  }

  getById(id: string): Observable<IPrestamo> {
    const prestamo = this.prestamos.find(p => p.id === id);
    if (prestamo) {
      return of({ ...prestamo }).pipe(delay(this.MOCK_DELAY));
    }
    return throwError(() => new Error('Préstamo no encontrado')).pipe(delay(this.MOCK_DELAY));
  }

  create(prestamo: IPrestamo): Observable<IPrestamo> {
    const nuevoPrestamo: IPrestamo = {
      ...prestamo,
      id: (this.nextPrestamoId++).toString(),
    };
    this.prestamos.push(nuevoPrestamo);
    return of({ ...nuevoPrestamo }).pipe(delay(this.MOCK_DELAY));
  }

  update(id: string, prestamo: IPrestamo): Observable<IPrestamo> {
    const index = this.prestamos.findIndex(p => p.id === id);
    if (index !== -1) {
      this.prestamos[index] = { ...prestamo, id };
      return of({ ...this.prestamos[index] }).pipe(delay(this.MOCK_DELAY));
    }
    return throwError(() => new Error('Préstamo no encontrado')).pipe(delay(this.MOCK_DELAY));
  }

  delete(id: string): Observable<void> {
    const index = this.prestamos.findIndex(p => p.id === id);
    if (index !== -1) {
      this.prestamos.splice(index, 1);
      return of(void 0).pipe(delay(this.MOCK_DELAY));
    }
    return throwError(() => new Error('Préstamo no encontrado')).pipe(delay(this.MOCK_DELAY));
  }

  getByCliente(clienteId: string): Observable<IPrestamo[]> {
    return of(this.prestamos.filter(p => p.clienteId === clienteId)).pipe(delay(this.MOCK_DELAY));
  }

  getActivos(): Observable<IPrestamo[]> {
    // Total pagado por préstamo (alineado con PagoMockService)
    const totalPagado: Record<string, number> = {
      '1': 46154 * 8,   // 8 cuotas de 26
      '2': 200000,       // 1 cuota de 12
      '3': 0,            // sin pagos
      '4': 5500 * 60,    // completo
      '5': 5323 * 5,     // 5 cuotas de 31
      '6': 4889 * 10,    // 10 cuotas de 45
    };
    const activos = this.prestamos.filter(p => (totalPagado[p.id] ?? 0) < p.valorTotal);
    return of([...activos]).pipe(delay(this.MOCK_DELAY));
  }

  calcularCuotas(id: string): Observable<any[]> {
    const prestamo = this.prestamos.find(p => p.id === id);
    if (!prestamo) {
      return throwError(() => new Error('Préstamo no encontrado')).pipe(delay(this.MOCK_DELAY));
    }

    const totalPagado: Record<string, number> = {
      '1': 46154 * 8,
      '2': 200000,
      '3': 0,
      '4': 5500 * 60,
      '5': 5323 * 5,
      '6': 4889 * 10,
    };
    const pagado = totalPagado[id] ?? 0;
    let acumulado = 0;

    const cuotas = Array.from({ length: prestamo.cantidadCuotas }, (_, i) => {
      const n = i + 1;
      acumulado += prestamo.valorCuota;
      return {
        numeroCuota:   n,
        fechaEsperada: this.calcularFechaCuota(prestamo.fechaPrestamo, prestamo.frecuenciaPago, n),
        valorCuota:    prestamo.valorCuota,
        estado:        acumulado <= pagado ? 'pagada' : 'pendiente',
      };
    });

    return of(cuotas).pipe(delay(this.MOCK_DELAY));
  }

  getResumenProntoPago(id: string): Observable<IProntoPagoResumen> {
    const prestamo = this.prestamos.find(p => p.id === id);
    if (!prestamo) {
      return throwError(() => new Error('Préstamo no encontrado')).pipe(delay(this.MOCK_DELAY));
    }
    const saldoPendiente = prestamo.valorTotal * 0.4;
    return of({
      saldoPendiente,
      cuotasPendientes: 5,
      interesesFuturosEstimados: Math.round(prestamo.interesProyectado / prestamo.cantidadCuotas * 5),
      valorSugerido: saldoPendiente
    }).pipe(delay(this.MOCK_DELAY));
  }

  ejecutarProntoPago(id: string, input: { valorNegociado: number; notas?: string }): Observable<IProntoPagoResultado> {
    const prestamo = this.prestamos.find(p => p.id === id);
    if (!prestamo) {
      return throwError(() => new Error('Préstamo no encontrado')).pipe(delay(this.MOCK_DELAY));
    }
    const saldoPendiente = prestamo.valorTotal * 0.4;
    return of({
      novedadId: 1,
      pagoId: 999,
      saldoPendienteOriginal: saldoPendiente,
      interesesFuturosEstimados: Math.round(prestamo.interesProyectado / prestamo.cantidadCuotas * 5),
      valorNegociado: input.valorNegociado,
      descuentoAplicado: saldoPendiente - input.valorNegociado,
      fechaCierre: new Date()
    }).pipe(delay(this.MOCK_DELAY));
  }

  getNovedades(_id: string): Observable<INovedadPrestamo[]> {
    return of([]).pipe(delay(this.MOCK_DELAY));
  }

  getResumenAmpliacion(_id: string): Observable<IAmpliacionPlazoResumen> {
    return of({
      saldoPendiente: 400000,
      cuotasPendientes: 2,
      fechaFinalActual: new Date('2026-06-15'),
      frecuenciaPago: 'semanal'
    }).pipe(delay(this.MOCK_DELAY));
  }

  ejecutarAmpliacion(_id: string, _input: IAmpliacionPlazoInput): Observable<IAmpliacionPlazoResultado> {
    return of({
      novedadId: 1,
      saldoPendienteAnterior: 400000,
      interesAdicional: 100000,
      nuevoSaldo: 500000,
      valorCuota: 50000,
      fechaFinalAnterior: new Date('2026-06-15'),
      nuevaFechaFinal: new Date('2026-09-30'),
      cantidadCuotasNuevas: 10
    }).pipe(delay(this.MOCK_DELAY));
  }

  recogerPrestamo(_id: string, _input: IRecogerPrestamoInput): Observable<IRecogerPrestamoResultado> {
    return of({
      prestamoOrigenId: 1,
      prestamoDestinoId: 99,
      novedadId: 10,
      saldoTrasladado: 400000,
      dineroAdicional: 200000,
      capitalNuevo: 600000,
      totalACobrar: 720000,
    }).pipe(delay(this.MOCK_DELAY));
  }

  private calcularFechaCuota(fechaInicio: Date, frecuencia: string, n: number): Date {
    const d = new Date(fechaInicio);
    switch (frecuencia) {
      case 'diario':    d.setDate(d.getDate() + n);       break;
      case 'semanal':   d.setDate(d.getDate() + n * 7);   break;
      case 'quincenal': d.setDate(d.getDate() + n * 15);  break;
      case 'mensual':   d.setMonth(d.getMonth() + n);     break;
      default:          d.setDate(d.getDate() + n * 7);
    }
    return d;
  }
}
