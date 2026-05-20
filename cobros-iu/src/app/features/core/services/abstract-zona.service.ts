import { Observable } from 'rxjs';
import type { IZona } from '../models';

export abstract class AbstractZonaService {
  abstract getAll(): Observable<IZona[]>;
  abstract getById(id: string): Observable<IZona>;
  abstract create(zona: IZona): Observable<IZona>;
  abstract update(id: string, zona: IZona): Observable<IZona>;
  abstract delete(id: string): Observable<void>;
  abstract getActivas(): Observable<IZona[]>;
}
