/**
 * Registra un pago asociado a un préstamo.
 * Relación: referencia a "Préstamo" mediante prestamoId.
 */
export interface IPago {
  /** Identificador único del pago */
  id: string;
  /** Identificador del préstamo al que corresponde el pago */
  prestamoId: string;
  /** Monto del pago realizado */
  valor: number;
  /** Fecha en la que se registra/realiza el pago */
  fechaPago: Date;
}
