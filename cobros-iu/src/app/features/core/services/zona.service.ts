import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { IZona } from '../models';
import { BaseService } from './base.service';
import { AbstractZonaService } from './abstract-zona.service';

/**
 * Servicio para gestionar operaciones CRUD de zonas.
 * Proporciona métodos para interactuar con el endpoint REST de zonas geográficas/comerciales.
 * 
 * Endpoint base: /api/zonas
 */
@Injectable({
  providedIn: 'root'
})
export class ZonaService extends BaseService<IZona> implements AbstractZonaService {
  /**
   * URL base del endpoint REST para zonas
   */
  private readonly apiUrl = '/api/zonas';

  constructor(http: HttpClient) {
    super(http, '/api/zonas');
  }

  /**
   * Obtiene todas las zonas registradas en el sistema.
   * @returns Observable con array de zonas
   */
  override getAll(): Observable<IZona[]> {
    return super.getAll();
  }

  /**
   * Obtiene una zona específica por su ID.
   * @param id - Identificador único de la zona
   * @returns Observable con la zona solicitada
   */
  override getById(id: string): Observable<IZona> {
    return super.getById(id);
  }

  /**
   * Crea una nueva zona en el sistema.
   * @param zona - Datos de la zona a crear
   * @returns Observable con la zona creada (incluye ID generado)
   */
  override create(zona: IZona): Observable<IZona> {
    return super.create(zona);
  }

  /**
   * Actualiza los datos de una zona existente.
   * @param id - Identificador de la zona a actualizar
   * @param zona - Datos actualizados de la zona
   * @returns Observable con la zona actualizada
   */
  override update(id: string, zona: IZona): Observable<IZona> {
    return super.update(id, zona);
  }

  /**
   * Elimina una zona del sistema.
   * @param id - Identificador de la zona a eliminar
   * @returns Observable que completa cuando la operación finaliza
   */
  override delete(id: string): Observable<void> {
    return super.delete(id);
  }

  /**
   * Obtiene todas las zonas activas del sistema.
   * @returns Observable con array de zonas activas
   */
  getActivas(): Observable<IZona[]> {
    return this.http.get<IZona[]>(`${this.apiUrl}/activas`);
  }
}
