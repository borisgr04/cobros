import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import type { IPago } from '../models';
import { AbstractPagoService } from './abstract-pago.service';

/**
 * Servicio mock para simular operaciones CRUD de pagos sin backend real.
 * Implementa AbstractPagoService para ser intercambiable con PagoService (HTTP).
 */
@Injectable({
  providedIn: 'root'
})
export class PagoMockService implements AbstractPagoService {
  private readonly MOCK_DELAY = 500;
  private nextPagoId = 86;

  private pagos: IPago[] = [
    // Pagos para préstamo id='1' (8 de 26 cuotas)
    { id: '1',  prestamoId: '1', valor: 46154, fechaPago: new Date('2024-11-22') },
    { id: '2',  prestamoId: '1', valor: 46154, fechaPago: new Date('2024-11-29') },
    { id: '3',  prestamoId: '1', valor: 46154, fechaPago: new Date('2024-12-06') },
    { id: '4',  prestamoId: '1', valor: 46154, fechaPago: new Date('2024-12-13') },
    { id: '5',  prestamoId: '1', valor: 46154, fechaPago: new Date('2024-12-20') },
    { id: '6',  prestamoId: '1', valor: 46154, fechaPago: new Date('2024-12-27') },
    { id: '7',  prestamoId: '1', valor: 46154, fechaPago: new Date('2025-01-03') },
    { id: '8',  prestamoId: '1', valor: 46154, fechaPago: new Date('2025-01-10') },

    // Pago para préstamo id='2' (1 de 12 cuotas)
    { id: '9',  prestamoId: '2', valor: 200000, fechaPago: new Date('2025-01-15') },

    // Pagos para préstamo id='4' (completado — 60 cuotas diarias)
    ...Array.from({ length: 60 }, (_, i) => ({
      id: `${10 + i}`,
      prestamoId: '4',
      valor: 5500,
      fechaPago: new Date(new Date('2024-09-02').getTime() + i * 24 * 60 * 60 * 1000),
    })),

    // Pagos para préstamo id='5' (5 de 31 cuotas)
    { id: '70', prestamoId: '5', valor: 5323, fechaPago: new Date('2025-08-16') },
    { id: '71', prestamoId: '5', valor: 5323, fechaPago: new Date('2025-08-17') },
    { id: '72', prestamoId: '5', valor: 5323, fechaPago: new Date('2025-08-18') },
    { id: '73', prestamoId: '5', valor: 5323, fechaPago: new Date('2025-08-19') },
    { id: '74', prestamoId: '5', valor: 5323, fechaPago: new Date('2025-08-20') },

    // Pagos para préstamo id='6' (10 de 45 cuotas)
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `${75 + i}`,
      prestamoId: '6',
      valor: 4889,
      fechaPago: new Date(new Date('2025-09-02').getTime() + i * 24 * 60 * 60 * 1000),
    })),

    // préstamo id='3' sin pagos
  ];

  getAll(): Observable<IPago[]> {
    return of([...this.pagos]).pipe(delay(this.MOCK_DELAY));
  }

  getById(id: string): Observable<IPago> {
    const pago = this.pagos.find(p => p.id === id);
    if (pago) {
      return of({ ...pago }).pipe(delay(this.MOCK_DELAY));
    }
    return throwError(() => new Error('Pago no encontrado')).pipe(delay(this.MOCK_DELAY));
  }

  create(pago: IPago): Observable<IPago> {
    const nuevoPago: IPago = {
      ...pago,
      id: (this.nextPagoId++).toString(),
    };
    this.pagos.push(nuevoPago);
    return of({ ...nuevoPago }).pipe(delay(this.MOCK_DELAY));
  }

  update(id: string, pago: IPago): Observable<IPago> {
    const index = this.pagos.findIndex(p => p.id === id);
    if (index !== -1) {
      this.pagos[index] = { ...pago, id };
      return of({ ...this.pagos[index] }).pipe(delay(this.MOCK_DELAY));
    }
    return throwError(() => new Error('Pago no encontrado')).pipe(delay(this.MOCK_DELAY));
  }

  delete(id: string): Observable<void> {
    const index = this.pagos.findIndex(p => p.id === id);
    if (index !== -1) {
      this.pagos.splice(index, 1);
      return of(void 0).pipe(delay(this.MOCK_DELAY));
    }
    return throwError(() => new Error('Pago no encontrado')).pipe(delay(this.MOCK_DELAY));
  }

  getByPrestamo(prestamoId: string): Observable<IPago[]> {
    const pagosPrestamo = this.pagos.filter(p => p.prestamoId === prestamoId);
    return of([...pagosPrestamo]).pipe(delay(this.MOCK_DELAY));
  }

  getTotalByPrestamo(prestamoId: string): Observable<number> {
    const total = this.pagos
      .filter(p => p.prestamoId === prestamoId)
      .reduce((sum, p) => sum + p.valor, 0);
    return of(total).pipe(delay(this.MOCK_DELAY));
  }
}
