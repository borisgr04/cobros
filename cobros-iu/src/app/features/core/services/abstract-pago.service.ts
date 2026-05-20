import { Observable } from 'rxjs';
import type { IPago } from '../models';

export abstract class AbstractPagoService {
  abstract getAll(): Observable<IPago[]>;
  abstract getById(id: string): Observable<IPago>;
  abstract create(pago: IPago): Observable<IPago>;
  abstract update(id: string, pago: IPago): Observable<IPago>;
  abstract delete(id: string): Observable<void>;
  abstract getByPrestamo(prestamoId: string): Observable<IPago[]>;
  abstract getTotalByPrestamo(prestamoId: string): Observable<number>;
}
