import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { IPago } from '../models';
import { BaseService } from './base.service';
import { AbstractPagoService } from './abstract-pago.service';

/**
 * Servicio para gestionar operaciones CRUD de pagos.
 * Proporciona métodos para interactuar con el endpoint REST de pagos de préstamos.
 * 
 * Endpoint base: /api/pagos
 */
@Injectable({
  providedIn: 'root'
})
export class PagoService extends BaseService<IPago> implements AbstractPagoService {
  /**
   * URL base del endpoint REST para pagos
   */
  private readonly apiUrl = '/api/pagos';

  constructor(http: HttpClient) {
    super(http, '/api/pagos');
  }

  /**
   * Obtiene todos los pagos registrados en el sistema.
   * @returns Observable con array de pagos
   */
  override getAll(): Observable<IPago[]> {
    return super.getAll();
  }

  /**
   * Obtiene un pago específico por su ID.
   * @param id - Identificador único del pago
   * @returns Observable con el pago solicitado
   */
  override getById(id: string): Observable<IPago> {
    return super.getById(id);
  }

  /**
   * Registra un nuevo pago en el sistema.
   * @param pago - Datos del pago a registrar
   * @returns Observable con el pago registrado (incluye ID generado)
   */
  override create(pago: IPago): Observable<IPago> {
    return super.create(pago);
  }

  /**
   * Actualiza los datos de un pago existente.
   * @param id - Identificador del pago a actualizar
   * @param pago - Datos actualizados del pago
   * @returns Observable con el pago actualizado
   */
  override update(id: string, pago: IPago): Observable<IPago> {
    return super.update(id, pago);
  }

  /**
   * Elimina un pago del sistema.
   * @param id - Identificador del pago a eliminar
   * @returns Observable que completa cuando la operación finaliza
   */
  override delete(id: string): Observable<void> {
    return super.delete(id);
  }

  /**
   * Obtiene todos los pagos asociados a un préstamo específico.
   * @param prestamoId - Identificador del préstamo
   * @returns Observable con array de pagos del préstamo
   */
  getByPrestamo(prestamoId: string): Observable<IPago[]> {
    return this.http.get<IPago[]>(`${this.apiUrl}/prestamo/${prestamoId}`);
  }

  /**
   * Obtiene el total de pagos realizados para un préstamo específico.
   * @param prestamoId - Identificador del préstamo
   * @returns Observable con el monto total pagado
   */
  getTotalByPrestamo(prestamoId: string): Observable<number> {
    return this.http
      .get<{ prestamoId: string; totalPagado: number }>(`${this.apiUrl}/prestamo/${prestamoId}/total`)
      .pipe(map(r => r.totalPagado));
  }

  /**
   * Anula el pago indicado registrando el motivo de anulación.
   * Solo se puede anular el pago activo más reciente del préstamo.
   * @param id - Identificador del pago a anular
   * @param motivo - Motivo o comentario de la anulación
   * @returns Observable con el pago actualizado
   */
  anular(id: string, motivo: string): Observable<IPago> {
    return this.http.post<IPago>(`${this.apiUrl}/${id}/anular`, { motivo });
  }
}
