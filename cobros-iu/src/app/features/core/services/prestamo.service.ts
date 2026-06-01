import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { IPrestamo } from '../models';
import type { INovedadPrestamo, IProntoPagoResumen, IProntoPagoResultado, IAmpliacionPlazoResumen, IAmpliacionPlazoInput, IAmpliacionPlazoResultado } from '../models';
import { BaseService } from './base.service';
import { AbstractPrestamoService } from './abstract-prestamo.service';

/**
 * Servicio para gestionar operaciones CRUD de préstamos.
 * Proporciona métodos para interactuar con el endpoint REST de préstamos.
 * 
 * Endpoint base: /api/prestamos
 */
@Injectable({
  providedIn: 'root'
})
export class PrestamoService extends BaseService<IPrestamo> implements AbstractPrestamoService {
  /**
   * URL base del endpoint REST para préstamos
   */
  private readonly apiUrl = '/api/prestamos';

  constructor(http: HttpClient) {
    super(http, '/api/prestamos');
  }

  /**
   * Obtiene todos los préstamos registrados en el sistema.
   * @returns Observable con array de préstamos
   */
  override getAll(): Observable<IPrestamo[]> {
    return super.getAll();
  }

  /**
   * Obtiene un préstamo específico por su ID.
   * @param id - Identificador único del préstamo
   * @returns Observable con el préstamo solicitado
   */
  override getById(id: string): Observable<IPrestamo> {
    return super.getById(id);
  }

  /**
   * Crea un nuevo préstamo en el sistema.
   * @param prestamo - Datos del préstamo a crear
   * @returns Observable con el préstamo creado (incluye ID generado)
   */
  override create(prestamo: IPrestamo): Observable<IPrestamo> {
    return super.create(prestamo);
  }

  /**
   * Actualiza los datos de un préstamo existente.
   * @param id - Identificador del préstamo a actualizar
   * @param prestamo - Datos actualizados del préstamo
   * @returns Observable con el préstamo actualizado
   */
  override update(id: string, prestamo: IPrestamo): Observable<IPrestamo> {
    return super.update(id, prestamo);
  }

  /**
   * Elimina un préstamo del sistema.
   * @param id - Identificador del préstamo a eliminar
   * @returns Observable que completa cuando la operación finaliza
   */
  override delete(id: string): Observable<void> {
    return super.delete(id);
  }

  /**
   * Obtiene todos los préstamos asociados a un cliente específico.
   * @param clienteId - Identificador del cliente
   * @returns Observable con array de préstamos del cliente
   */
  getByCliente(clienteId: string): Observable<IPrestamo[]> {
    return this.http.get<IPrestamo[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  /**
   * Obtiene todos los préstamos activos (no completamente pagados).
   * @returns Observable con array de préstamos activos
   */
  getActivos(): Observable<IPrestamo[]> {
    return this.http.get<IPrestamo[]>(`${this.apiUrl}/activos`);
  }

  /**
   * Calcula la proyección de cuotas para un préstamo.
   * @param id - Identificador del préstamo
   * @returns Observable con array de cuotas proyectadas
   */
  calcularCuotas(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/cuotas`);
  }

  /**
   * Obtiene el resumen de pronto pago para un préstamo (sin ejecutarlo).
   * @param id - Identificador del préstamo
   * @returns Observable con saldo pendiente, intereses futuros y valor sugerido
   */
  getResumenProntoPago(id: string): Observable<IProntoPagoResumen> {
    return this.http.get<IProntoPagoResumen>(`${this.apiUrl}/${id}/resumen-pronto-pago`);
  }

  /**
   * Ejecuta el pronto pago de un préstamo con el valor negociado.
   * @param id - Identificador del préstamo
   * @param input - Valor negociado y notas opcionales
   * @returns Observable con el resultado de la operación
   */
  ejecutarProntoPago(id: string, input: { valorNegociado: number; notas?: string }): Observable<IProntoPagoResultado> {
    return this.http.post<IProntoPagoResultado>(`${this.apiUrl}/${id}/pronto-pago`, input);
  }

  /**
   * Obtiene el historial de novedades de un préstamo.
   * @param id - Identificador del préstamo
   * @returns Observable con array de novedades del préstamo
   */
  getNovedades(id: string): Observable<INovedadPrestamo[]> {
    return this.http.get<INovedadPrestamo[]>(`${this.apiUrl}/${id}/novedades`);
  }

  /**
   * Obtiene el resumen actual del préstamo para una ampliación de plazo.
   * @param id - Identificador del préstamo
   * @returns Observable con saldo pendiente, cuotas pendientes y fecha final actual
   */
  getResumenAmpliacion(id: string): Observable<IAmpliacionPlazoResumen> {
    return this.http.get<IAmpliacionPlazoResumen>(`${this.apiUrl}/${id}/resumen-ampliacion`);
  }

  /**
   * Ejecuta la ampliación de plazo de un préstamo.
   * @param id - Identificador del préstamo
   * @param input - Datos de la ampliación (interés adicional, cuotas, frecuencia, fecha inicio, observación)
   * @returns Observable con el resultado de la operación
   */
  ejecutarAmpliacion(id: string, input: IAmpliacionPlazoInput): Observable<IAmpliacionPlazoResultado> {
    return this.http.post<IAmpliacionPlazoResultado>(`${this.apiUrl}/${id}/ampliar-plazo`, input);
  }
}
