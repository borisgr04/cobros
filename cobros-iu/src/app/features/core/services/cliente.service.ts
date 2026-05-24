import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ICliente, IClienteConPrestamosActivos } from '../models';
import { BaseService } from './base.service';
import { AbstractClienteService } from './abstract-cliente.service';

/**
 * Servicio para gestionar operaciones CRUD de clientes.
 * Proporciona métodos para interactuar con el endpoint REST de clientes.
 * 
 * Endpoint base: /api/clientes
 */
@Injectable({
  providedIn: 'root'
})
export class ClienteService extends BaseService<ICliente> implements AbstractClienteService {
  /**
   * URL base del endpoint REST para clientes
   */
  private readonly apiUrl = '/api/clientes';

  constructor(http: HttpClient) {
    super(http, '/api/clientes');
  }

  /**
   * Obtiene todos los clientes registrados en el sistema.
   * @returns Observable con array de clientes
   */
  override getAll(): Observable<ICliente[]> {
    return super.getAll();
  }

  /**
   * Obtiene un cliente específico por su ID.
   * @param id - Identificador único del cliente
   * @returns Observable con el cliente solicitado
   */
  override getById(id: string): Observable<ICliente> {
    return super.getById(id);
  }

  /**
   * Crea un nuevo cliente en el sistema.
   * @param cliente - Datos del cliente a crear
   * @returns Observable con el cliente creado (incluye ID generado)
   */
  override create(cliente: ICliente): Observable<ICliente> {
    return super.create(cliente);
  }

  /**
   * Actualiza los datos de un cliente existente.
   * @param id - Identificador del cliente a actualizar
   * @param cliente - Datos actualizados del cliente
   * @returns Observable con el cliente actualizado
   */
  override update(id: string, cliente: ICliente): Observable<ICliente> {
    return super.update(id, cliente);
  }

  /**
   * Elimina un cliente del sistema.
   * @param id - Identificador del cliente a eliminar
   * @returns Observable que completa cuando la operación finaliza
   */
  override delete(id: string): Observable<void> {
    return super.delete(id);
  }

  /**
   * Obtiene clientes por zona.
   * @param zonaId - Identificador de la zona
   * @returns Observable con array de clientes de la zona
   */
  getByZona(zonaId: string): Observable<ICliente[]> {
    return this.http.get<ICliente[]>(`${this.apiUrl}/zona/${zonaId}`);
  }

  /**
   * Obtiene un cliente con sus préstamos activos en una sola llamada.
   * @param id - Identificador del cliente
   * @returns Observable con el cliente y sus préstamos activos
   */
  getConPrestamosActivos(id: string): Observable<IClienteConPrestamosActivos> {
    return this.http.get<IClienteConPrestamosActivos>(`${this.apiUrl}/${id}/con-prestamos-activos`);
  }
}
