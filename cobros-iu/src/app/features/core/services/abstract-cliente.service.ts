import { Observable } from 'rxjs';
import type { ICliente, IClienteConPrestamosActivos, IClienteConPrestamos } from '../models';

export abstract class AbstractClienteService {
  abstract getAll(): Observable<ICliente[]>;
  abstract getById(id: string): Observable<ICliente>;
  abstract getConPrestamosActivos(id: string): Observable<IClienteConPrestamosActivos>;
  abstract getAllConPrestamos(): Observable<IClienteConPrestamos[]>;
  abstract create(cliente: ICliente): Observable<ICliente>;
  abstract update(id: string, cliente: ICliente): Observable<ICliente>;
  abstract delete(id: string): Observable<void>;
  abstract getByZona(zonaId: string): Observable<ICliente[]>;
}
