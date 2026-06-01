import type { FrecuenciaPago } from './types';

/**
 * Representa un préstamo otorgado a un cliente.
 * Relación: referencia a un "Cliente" mediante clienteId y puede tener múltiples "Pagos".
 */
export interface IPrestamo {
  /** Identificador único del préstamo */
  id: string;
  /** Identificador del cliente asociado al préstamo */
  clienteId: string;
  /** Fecha en que se otorga el préstamo */
  fechaPrestamo: Date;
  /** Fecha final proyectada para completar el préstamo */
  fechaFinal: Date;
  /** Valor principal prestado */
  valorPrestado: number;
  /** Valor total a pagar (incluye intereses y otros cargos) */
  valorTotal: number;
  /** Interés proyectado para el préstamo */
  interesProyectado: number;
  /** Frecuencia definida para los pagos del préstamo */
  frecuenciaPago: FrecuenciaPago;
  /** Cantidad total de cuotas proyectadas según la frecuencia y fechas */
  cantidadCuotas: number;
  /** Valor de cada cuota (valorTotal / cantidadCuotas) */
  valorCuota: number;
  /** Estado explícito del préstamo: "activo" | "completado" | "cerrado_pronto_pago" | "refinanciado" */
  estado?: 'activo' | 'completado' | 'cerrado_pronto_pago' | 'refinanciado' | string;
  /** Fecha en que fue cerrado el préstamo (aplica para pronto pago o refinanciación) */
  fechaCierre?: Date;
  /** ID del préstamo origen (cuando este fue creado por una operación de Recoger Préstamo) */
  prestamoOrigenId?: number;
}
