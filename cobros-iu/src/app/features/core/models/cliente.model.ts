import type { Estado } from './types';
import type { IPrestamo } from './prestamo.model';

/**
 * Representa a un cliente dentro del dominio de gestión de préstamos.
 * Relación: cada Cliente pertenece a una "Zona" (referenciada por zonaId) y puede tener múltiples "Préstamos".
 */
export interface ICliente {
  /** Identificador único del cliente */
  id: string;
  /** Nombre completo del cliente */
  nombre: string;
  /** Alias o apodo del cliente (opcional) */
  alias?: string;
  /** Número de identificación oficial del cliente */
  identificacion: string;
  /** Dirección física del cliente (opcional) */
  direccion?: string;
  /** Identificador de la zona a la que pertenece el cliente */
  zonaId: string;
  /** Teléfono de contacto del cliente (opcional) */
  telefono?: string;
  /** Cuenta bancaria asociada al cliente (opcional) */
  cuentaBancaria?: string;
  /** Llave de seguridad o referencia externa (opcional) */
  llave?: string;
  /** Estado del cliente dentro del sistema (opcional) */
  estado?: Estado;
  /** Indica si el cliente alguna vez tuvo préstamos (usado para ocultar el botón Eliminar) */
  tienePrestamos?: boolean;
}

/**
 * Cliente con sus préstamos activos, devuelto por el endpoint combinado.
 * Activo = suma de pagos < valor total del préstamo.
 */
export interface IClienteConPrestamosActivos extends ICliente {
  prestamosActivos: IPrestamo[];
}
