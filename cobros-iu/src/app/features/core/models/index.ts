/**
 * Barrel file para exportar todos los modelos del dominio de gestión de préstamos.
 * Permite importar múltiples interfaces desde un solo punto de entrada.
 * 
 * Ejemplo de uso:
 * import { ICliente, IPrestamo, Estado, FrecuenciaPago } from '@app/features/core/models';
 */

// Re-exportación de interfaces de modelos
export type { ICliente, IClienteConPrestamosActivos } from './cliente.model';
export type { IZona } from './zona.model';
export type { IPrestamo } from './prestamo.model';
export type { IPago } from './pago.model';

// Re-exportación de tipos compartidos
export type { Estado, FrecuenciaPago } from './types';
