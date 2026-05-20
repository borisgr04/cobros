import type { Estado } from './types';

/**
 * Define una zona geográfica o comercial a la que pueden pertenecer los clientes.
 * Relación: los "Clientes" referencian a "Zona" mediante el campo zonaId.
 */
export interface IZona {
  /** Identificador único de la zona */
  id: string;
  /** Nombre de la zona */
  nombre: string;
  /** Estado de la zona */
  estado: Estado;
}
