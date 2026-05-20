import { Observable } from 'rxjs';
import type { IPrestamo } from '../models';

export abstract class AbstractPrestamoService {
  abstract getAll(): Observable<IPrestamo[]>;
  abstract getById(id: string): Observable<IPrestamo>;
  abstract create(prestamo: IPrestamo): Observable<IPrestamo>;
  abstract update(id: string, prestamo: IPrestamo): Observable<IPrestamo>;
  abstract delete(id: string): Observable<void>;
  abstract getByCliente(clienteId: string): Observable<IPrestamo[]>;
  abstract getActivos(): Observable<IPrestamo[]>;
  abstract calcularCuotas(id: string): Observable<any[]>;
}
