import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Servicio base genérico que proporciona operaciones CRUD estándar para cualquier entidad.
 * Otros servicios pueden extender de esta clase para heredar funcionalidad común.
 * 
 * @template T - Tipo de la entidad que maneja el servicio
 */
export abstract class BaseService<T> {
  /**
   * @param http - Cliente HTTP de Angular para realizar peticiones REST
   * @param baseUrl - URL base del endpoint REST para la entidad (ej: '/api/clientes')
   */
  constructor(
    protected http: HttpClient,
    protected baseUrl: string
  ) {}

  /**
   * Obtiene todas las entidades desde el backend.
   * @returns Observable con array de entidades
   */
  getAll(): Observable<T[]> {
    return this.http.get<T[]>(this.baseUrl);
  }

  /**
   * Obtiene una entidad específica por su identificador.
   * @param id - Identificador único de la entidad
   * @returns Observable con la entidad solicitada
   */
  getById(id: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crea una nueva entidad en el backend.
   * @param entity - Objeto con los datos de la entidad a crear
   * @returns Observable con la entidad creada (normalmente incluye el ID generado)
   */
  create(entity: T): Observable<T> {
    return this.http.post<T>(this.baseUrl, entity);
  }

  /**
   * Actualiza una entidad existente en el backend.
   * @param id - Identificador de la entidad a actualizar
   * @param entity - Objeto con los datos actualizados de la entidad
   * @returns Observable con la entidad actualizada
   */
  update(id: string, entity: T): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${id}`, entity);
  }

  /**
   * Elimina una entidad del backend.
   * @param id - Identificador de la entidad a eliminar
   * @returns Observable con la respuesta del servidor (puede ser void o confirmación)
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
