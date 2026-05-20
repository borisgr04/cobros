/**
 * Tipos compartidos para el dominio de gestión de préstamos.
 * Estos tipos pueden ser reutilizados por múltiples modelos del sistema.
 */

/**
 * Estados posibles para entidades que requieren control de activación/desactivación.
 * Usado por: Cliente, Zona
 */
export type Estado = 'activo' | 'inactivo';

/**
 * Frecuencias de pago disponibles para préstamos.
 * Define la periodicidad con la que se esperan los pagos.
 */
export type FrecuenciaPago = 'diario' | 'semanal' | 'quincenal' | 'mensual';
