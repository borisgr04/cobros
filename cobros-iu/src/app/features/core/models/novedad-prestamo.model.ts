/**
 * Registra una novedad (pronto pago u otra) aplicada a un préstamo.
 * Tabla de auditoría inmutable de operaciones especiales sobre préstamos.
 */
export interface INovedadPrestamo {
  /** Identificador único de la novedad */
  id: number;
  /** Identificador del préstamo afectado */
  prestamoId: number;
  /** Tipo de novedad: "pronto_pago" | "ampliacion_plazo" */
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

  // Campos adicionales para "ampliacion_plazo"
  /** Interés adicional negociado en la ampliación de plazo */
  interesAdicional?: number;
  /** Nuevo saldo calculado: saldoPendienteOriginal + interesAdicional */
  nuevoSaldo?: number;
  /** Fecha final del préstamo antes de la ampliación */
  fechaFinalAnterior?: Date;
  /** Nueva fecha final del préstamo después de la ampliación */
  nuevaFechaFinal?: Date;
  /** Cantidad de nuevas cuotas generadas en la ampliación */
  cantidadCuotasNuevas?: number;
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

/**
 * Resumen actual del préstamo para mostrar antes de realizar una ampliación de plazo.
 */
export interface IAmpliacionPlazoResumen {
  saldoPendiente: number;
  cuotasPendientes: number;
  fechaFinalActual: Date;
  frecuenciaPago: string;
}

/**
 * Datos de entrada para ejecutar una ampliación de plazo.
 */
export interface IAmpliacionPlazoInput {
  interesAdicional: number;
  cantidadCuotasNuevas: number;
  frecuenciaNueva: string;
  fechaInicio: string;
  observacion?: string;
}

/**
 * Resultado de ejecutar una ampliación de plazo exitosamente.
 */
export interface IAmpliacionPlazoResultado {
  novedadId: number;
  saldoPendienteAnterior: number;
  interesAdicional: number;
  nuevoSaldo: number;
  valorCuota: number;
  fechaFinalAnterior: Date;
  nuevaFechaFinal: Date;
  cantidadCuotasNuevas: number;
}
