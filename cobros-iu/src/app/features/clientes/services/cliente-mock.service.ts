import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import type { ICliente, IClienteConPrestamosActivos, IClienteConPrestamos } from '../../core/models';
import { AbstractClienteService } from '../../core/services/abstract-cliente.service';

/**
 * Servicio mock para simular operaciones CRUD de clientes sin backend real.
 * Útil para desarrollo y pruebas sin depender de un API REST.
 */
@Injectable({
  providedIn: 'root'
})
export class ClienteMockService implements AbstractClienteService {
  /**
   * Base de datos en memoria para clientes mock
   */
  private clientes: ICliente[] = [
    {
      id: '1',
      nombre: 'Juan Pérez García',
      alias: 'Juanito',
      identificacion: '12345678',
      direccion: 'Calle Principal #123, Centro',
      zonaId: '1',
      telefono: '555-0101',
      cuentaBancaria: '1234567890',
      estado: 'activo'
    },
    {
      id: '2',
      nombre: 'María López Hernández',
      alias: 'Mary',
      identificacion: '87654321',
      direccion: 'Avenida Libertad #456, Norte',
      zonaId: '1',
      telefono: '555-0102',
      cuentaBancaria: '0987654321',
      estado: 'activo'
    },
    {
      id: '3',
      nombre: 'Carlos Rodríguez',
      identificacion: '11223344',
      direccion: 'Barrio San José, Manzana 5',
      zonaId: '2',
      telefono: '555-0103',
      estado: 'activo'
    },
    {
      id: '4',
      nombre: 'Ana García Torres',
      alias: 'Anita',
      identificacion: '44332211',
      direccion: 'Conjunto Residencial Las Flores, Casa 12',
      zonaId: '2',
      telefono: '555-0104',
      estado: 'activo'
    },
    {
      id: '5',
      nombre: 'Roberto Sánchez',
      identificacion: '55667788',
      direccion: 'Calle 45 #12-34, Sur',
      zonaId: '1',
      telefono: '555-0105',
      cuentaBancaria: '1122334455',
      estado: 'activo'
    },
    {
      id: '6',
      nombre: 'Laura Martínez González',
      alias: 'Laurita',
      identificacion: '99887766',
      direccion: 'Urbanización Vista Hermosa, Casa 25',
      zonaId: '3',
      telefono: '555-0106',
      cuentaBancaria: '6677889900',
      estado: 'activo'
    }
  ];

  /**
   * Contador para generar IDs únicos
   */
  private nextId = 7;

  /**
   * Tiempo de delay para simular latencia de red (en ms)
   */
  private readonly MOCK_DELAY = 500;

  /**
   * Obtiene todos los clientes.
   * @returns Observable con array de clientes
   */
  getAll(): Observable<ICliente[]> {
    return of([...this.clientes]).pipe(delay(this.MOCK_DELAY));
  }

  /**
   * Obtiene un cliente por su ID.
   * @param id - Identificador del cliente
   * @returns Observable con el cliente o error si no existe
   */
  getById(id: string): Observable<ICliente> {
    const cliente = this.clientes.find(c => c.id === id);
    if (cliente) {
      return of({ ...cliente }).pipe(delay(this.MOCK_DELAY));
    }
    return throwError(() => new Error('Cliente no encontrado')).pipe(delay(this.MOCK_DELAY));
  }

  /**
   * Crea un nuevo cliente.
   * @param cliente - Datos del cliente a crear
   * @returns Observable con el cliente creado
   */
  create(cliente: ICliente): Observable<ICliente> {
    const nuevoCliente: ICliente = {
      ...cliente,
      id: (this.nextId++).toString(),
      estado: cliente.estado || 'activo'
    };
    this.clientes.push(nuevoCliente);
    return of({ ...nuevoCliente }).pipe(delay(this.MOCK_DELAY));
  }

  /**
   * Actualiza un cliente existente.
   * @param id - Identificador del cliente
   * @param cliente - Datos actualizados
   * @returns Observable con el cliente actualizado o error si no existe
   */
  update(id: string, cliente: ICliente): Observable<ICliente> {
    const index = this.clientes.findIndex(c => c.id === id);
    if (index !== -1) {
      this.clientes[index] = { ...cliente, id };
      return of({ ...this.clientes[index] }).pipe(delay(this.MOCK_DELAY));
    }
    return throwError(() => new Error('Cliente no encontrado')).pipe(delay(this.MOCK_DELAY));
  }

  /**
   * Elimina un cliente.
   * @param id - Identificador del cliente a eliminar
   * @returns Observable que completa cuando se elimina
   */
  delete(id: string): Observable<void> {
    const index = this.clientes.findIndex(c => c.id === id);
    if (index !== -1) {
      this.clientes.splice(index, 1);
      return of(void 0).pipe(delay(this.MOCK_DELAY));
    }
    return throwError(() => new Error('Cliente no encontrado')).pipe(delay(this.MOCK_DELAY));
  }

  /**
   * Obtiene clientes por zona.
   * @param zonaId - Identificador de la zona
   * @returns Observable con array de clientes de la zona
   */
  getByZona(zonaId: string): Observable<ICliente[]> {
    const clientesPorZona = this.clientes.filter(c => c.zonaId === zonaId);
    return of([...clientesPorZona]).pipe(delay(this.MOCK_DELAY));
  }

  /**
   * Obtiene un cliente con sus préstamos activos (mock: siempre retorna sin préstamos activos).
   * @param id - Identificador del cliente
   * @returns Observable con el cliente y lista vacía de préstamos activos
   */
  getConPrestamosActivos(id: string): Observable<IClienteConPrestamosActivos> {
    const cliente = this.clientes.find(c => c.id === id);
    if (cliente) {
      return of({ ...cliente, prestamosActivos: [] }).pipe(delay(this.MOCK_DELAY));
    }
    return throwError(() => new Error('Cliente no encontrado')).pipe(delay(this.MOCK_DELAY));
  }

  /**
   * Obtiene todos los clientes con sus préstamos consolidados (mock: siempre retorna sin préstamos).
   * @returns Observable con array de clientes con lista vacía de préstamos
   */
  getAllConPrestamos(): Observable<IClienteConPrestamos[]> {
    return of(this.clientes.map(c => ({ ...c, prestamos: [] }))).pipe(delay(this.MOCK_DELAY));
  }
}
