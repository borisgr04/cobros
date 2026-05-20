import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import type { IZona } from '../models';
import { AbstractZonaService } from './abstract-zona.service';

/**
 * Servicio mock para simular operaciones de zonas sin backend real.
 * Implementa AbstractZonaService para ser intercambiable con ZonaService (HTTP).
 */
@Injectable({
  providedIn: 'root'
})
export class ZonaMockService implements AbstractZonaService {
  private readonly MOCK_DELAY = 300;

  private nextZonaId = 4;

  private zonas: IZona[] = [
    { id: '1', nombre: 'Centro', estado: 'activo' },
    { id: '2', nombre: 'Norte',  estado: 'activo' },
    { id: '3', nombre: 'Sur',    estado: 'activo' },
  ];

  getAll(): Observable<IZona[]> {
    return of([...this.zonas]).pipe(delay(this.MOCK_DELAY));
  }

  getById(id: string): Observable<IZona> {
    const zona = this.zonas.find(z => z.id === id);
    return of(zona!).pipe(delay(this.MOCK_DELAY));
  }

  getActivas(): Observable<IZona[]> {
    const activas = this.zonas.filter(z => z.estado === 'activo');
    return of([...activas]).pipe(delay(this.MOCK_DELAY));
  }
  
  create(zona: IZona): Observable<IZona> {
    const nuevaZona: IZona = {
      ...zona,
      id: (this.nextZonaId++).toString(),
      estado: zona.estado || 'activo'
    };
    this.zonas.push(nuevaZona);
    console.log('✅ Zona creada en mock service:', nuevaZona);
    console.log('📋 Total de zonas:', this.zonas.length);
    return of(nuevaZona).pipe(delay(this.MOCK_DELAY));
  }
  
  update(id: string, zona: IZona): Observable<IZona> {
    const index = this.zonas.findIndex(z => z.id === id);
    if (index !== -1) {
      this.zonas[index] = { ...zona, id };
      console.log('✏️ Zona actualizada en mock service:', zona);
    } else {
      console.warn('⚠️ No se encontró la zona con id:', id);
    }
    return of({ ...zona, id }).pipe(delay(this.MOCK_DELAY));
  }
  
  delete(id: string): Observable<void> {
    const zonaAEliminar = this.zonas.find(z => z.id === id);
    this.zonas = this.zonas.filter(z => z.id !== id);
    console.log('🗑️ Zona eliminada en mock service:', zonaAEliminar);
    console.log('📋 Total de zonas restantes:', this.zonas.length);
    return of(void 0).pipe(delay(this.MOCK_DELAY));
  }
}
