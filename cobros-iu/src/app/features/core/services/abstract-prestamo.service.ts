import { Observable } from 'rxjs';
import type { IPrestamo } from '../models';
import type { INovedadPrestamo, IProntoPagoResumen, IProntoPagoResultado, IAmpliacionPlazoResumen, IAmpliacionPlazoInput, IAmpliacionPlazoResultado, IRecogerPrestamoInput, IRecogerPrestamoResultado } from '../models';

export abstract class AbstractPrestamoService {
  abstract getAll(): Observable<IPrestamo[]>;
  abstract getById(id: string): Observable<IPrestamo>;
  abstract create(prestamo: IPrestamo): Observable<IPrestamo>;
  abstract update(id: string, prestamo: IPrestamo): Observable<IPrestamo>;
  abstract delete(id: string): Observable<void>;
  abstract getByCliente(clienteId: string): Observable<IPrestamo[]>;
  abstract getActivos(): Observable<IPrestamo[]>;
  abstract calcularCuotas(id: string): Observable<any[]>;
  abstract getResumenProntoPago(id: string): Observable<IProntoPagoResumen>;
  abstract ejecutarProntoPago(id: string, input: { valorNegociado: number; notas?: string }): Observable<IProntoPagoResultado>;
  abstract getNovedades(id: string): Observable<INovedadPrestamo[]>;
  abstract getResumenAmpliacion(id: string): Observable<IAmpliacionPlazoResumen>;
  abstract ejecutarAmpliacion(id: string, input: IAmpliacionPlazoInput): Observable<IAmpliacionPlazoResultado>;
  abstract recogerPrestamo(id: string, input: IRecogerPrestamoInput): Observable<IRecogerPrestamoResultado>;
}
