import { Observable } from 'rxjs';
import type { ICliente } from '../models';

export abstract class AbstractClienteService {
  abstract getAll(): Observable<ICliente[]>;
  abstract getById(id: string): Observable<ICliente>;
  abstract create(cliente: ICliente): Observable<ICliente>;
  abstract update(id: string, cliente: ICliente): Observable<ICliente>;
  abstract delete(id: string): Observable<void>;
  abstract getByZona(zonaId: string): Observable<ICliente[]>;
}
