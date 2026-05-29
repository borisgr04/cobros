/**
 * Registra una novedad (pronto pago u otra) aplicada a un préstamo.
 * Tabla de auditoría inmutable de operaciones especiales sobre préstamos.
 */
export interface INovedadPrestamo {
  /** Identificador único de la novedad */
  id: number;
  /** Identificador del préstamo afectado */
  prestamoId: number;
  /** Tipo de novedad: "pronto_pago" (extensible) */
  tipo: string;
  /** Fecha en que se registró la novedad */
  fechaNovedad: Date;
  /** Identificador del usuario que autorizó la novedad */
  usuarioId: number;
  /** Nombre del usuario autorizador */
  usuarioNombre?: string;
  /** Email del usuario autorizador */
  usuarioEmail?: string;
  /** Saldo pendiente total antes de aplicar la novedad */
  saldoPendienteOriginal: number;
  /** Intereses futuros estimados al momento del pronto pago */
  interesesFuturosEstimados: number;
  /** Valor acordado para cerrar el préstamo */
  valorNegociado: number;
  /** Descuento aplicado: saldoPendienteOriginal - valorNegociado */
  descuentoAplicado: number;
  /** ID del pago generado por esta novedad */
  pagoId?: number;
  /** Notas libres del cobrador/administrador */
  notas?: string;
}

/**
 * Datos del resumen de Pronto Pago devuelto por el backend antes de confirmar.
 */
export interface IProntoPagoResumen {
  /** Saldo total pendiente del préstamo */
  saldoPendiente: number;
  /** Cantidad de cuotas pendientes */
  cuotasPendientes: number;
  /** Estimación de los intereses futuros en las cuotas pendientes */
  interesesFuturosEstimados: number;
  /** Valor sugerido (igual al saldo pendiente como punto de partida) */
  valorSugerido: number;
}

/**
 * Resultado de ejecutar un Pronto Pago exitosamente.
 */
export interface IProntoPagoResultado {
  novedadId: number;
  pagoId: number;
  saldoPendienteOriginal: number;
  interesesFuturosEstimados: number;
  valorNegociado: number;
  descuentoAplicado: number;
  fechaCierre: Date;
}
