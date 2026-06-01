/**
 * Tipo de período para los reportes
 */
export type PeriodoReporte = 'dia' | 'semana' | 'mes' | 'personalizado';

/**
 * Resumen de cobros para un período
 */
export interface ResumenCobros {
  periodo: PeriodoReporte;
  fechaInicio: Date;
  fechaFin: Date;
  
  // Totales generales
  totalCobros: number;
  montoCobrado: number;
  montoEsperado: number;
  porcentajeCumplimiento: number;
  
  // Estadísticas de pagos
  pagosRealizados: number;
  pagosPendientes: number;
  pagosVencidos: number;
  
  // Desglose por zona
  cobrosPorZona: CobrosPorZona[];
  
  // Desglose por estado
  cobrosPorEstado: CobrosPorEstado[];
  
  // Top clientes
  topClientesMorosos: ClienteMoroso[];
  topClientesCumplidores: ClienteCumplidor[];
}

/**
 * Cobros agrupados por zona
 */
export interface CobrosPorZona {
  zonaId: string;
  zonaNombre: string;
  totalCobros: number;
  montoCobrado: number;
  montoEsperado: number;
  porcentajeCumplimiento: number;
  pagosRealizados: number;
  pagosPendientes: number;
}

/**
 * Cobros agrupados por estado
 */
export interface CobrosPorEstado {
  estado: 'al_dia' | 'proximo_vencer' | 'vencido';
  estadoNombre: string;
  cantidad: number;
  monto: number;
  porcentaje: number;
  color: string;
}

/**
 * Cliente con mayor morosidad
 */
export interface ClienteMoroso {
  clienteId: string;
  clienteNombre: string;
  zonaId: string;
  zonaNombre: string;
  prestamosActivos: number;
  montoVencido: number;
  diasVencido: number;
}

/**
 * Cliente con mejor cumplimiento
 */
export interface ClienteCumplidor {
  clienteId: string;
  clienteNombre: string;
  zonaId: string;
  zonaNombre: string;
  prestamosActivos: number;
  montoPagado: number;
  porcentajeCumplimiento: number;
}

/**
 * Filtros para el reporte
 */
export interface FiltrosReporte {
  periodo: PeriodoReporte;
  fechaInicio?: Date;
  fechaFin?: Date;
  zonaId?: string;
  clienteId?: string;
  estadoPrestamo?: 'al_dia' | 'proximo_vencer' | 'vencido' | 'todos';
}

/**
 * Detalle de un cobro individual
 */
export interface DetalleCobro {
  pagoId: string;
  prestamoId: string;
  clienteId: string;
  clienteNombre: string;
  zonaId: string;
  zonaNombre: string;
  fechaPago: Date;
  montoPago: number;
  estado: 'pagado' | 'pendiente' | 'vencido';
  diasAtraso?: number;
}

// ─── Backend report types ────────────────────────────────────────────────────

/** Préstamo nuevo creado en el rango de fechas (viene del backend) */
export interface ReportePrestamoNuevo {
  prestamoId: string;
  clienteId: string;
  clienteNombre: string;
  zonaId: string;
  zonaNombre: string;
  fechaPrestamo: Date;
  valorPrestado: number;
  valorTotal: number;
  frecuenciaPago: string;
  cantidadCuotas: number;
  valorCuota: number;
  /** Id del préstamo origen si fue creado por recoger; null si es préstamo nuevo. */
  prestamoOrigenId?: string | null;
}

/** Préstamo finalizado (su fechaFinal cae en el rango) */
export interface ReportePrestamoFinalizado {
  prestamoId: string;
  clienteId: string;
  clienteNombre: string;
  zonaId: string;
  zonaNombre: string;
  fechaPrestamo: Date;
  fechaFinal: Date;
  valorPrestado: number;
  valorTotal: number;
  totalPagado: number;
  /** 'pagado_completo' | 'vencido_sin_pagar' | 'refinanciado' | 'pronto_pago' */
  estadoFinalizacion: string;
}

/** Detalle de recaudo de un cliente dentro de una zona */
export interface ReporteClienteRecaudo {
  clienteId: string;
  clienteNombre: string;
  clienteAlias?: string;
  montoCobrado: number;
  montoEsperado: number;
  pagosRealizados: number;
  porcentajeCumplimiento: number;
}

/** Recaudo de una zona con detalle por cliente */
export interface ReporteRecaudoZona {
  zonaId: string;
  zonaNombre: string;
  montoCobrado: number;
  montoEsperado: number;
  pagosRealizados: number;
  porcentajeCumplimiento: number;
  clientes: ReporteClienteRecaudo[];
}

/** Respuesta completa del endpoint GET /api/reportes */
export interface ReporteCompleto {
  fechaInicio: Date;
  fechaFin: Date;
  prestamosNuevos: ReportePrestamoNuevo[];
  prestamosFinalizados: ReportePrestamoFinalizado[];
  recaudoPorZona: ReporteRecaudoZona[];
}

/**
 * Resumen de cobros para un período
 */
export interface ResumenCobros {
  periodo: PeriodoReporte;
  fechaInicio: Date;
  fechaFin: Date;
  
  // Totales generales
  totalCobros: number;
  montoCobrado: number;
  montoEsperado: number;
  porcentajeCumplimiento: number;
  
  // Estadísticas de pagos
  pagosRealizados: number;
  pagosPendientes: number;
  pagosVencidos: number;
  
  // Desglose por zona
  cobrosPorZona: CobrosPorZona[];
  
  // Desglose por estado
  cobrosPorEstado: CobrosPorEstado[];
  
  // Top clientes
  topClientesMorosos: ClienteMoroso[];
  topClientesCumplidores: ClienteCumplidor[];
}

/**
 * Cobros agrupados por zona
 */
export interface CobrosPorZona {
  zonaId: string;
  zonaNombre: string;
  totalCobros: number;
  montoCobrado: number;
  montoEsperado: number;
  porcentajeCumplimiento: number;
  pagosRealizados: number;
  pagosPendientes: number;
}

/**
 * Cobros agrupados por estado
 */
export interface CobrosPorEstado {
  estado: 'al_dia' | 'proximo_vencer' | 'vencido';
  estadoNombre: string;
  cantidad: number;
  monto: number;
  porcentaje: number;
  color: string;
}

/**
 * Cliente con mayor morosidad
 */
export interface ClienteMoroso {
  clienteId: string;
  clienteNombre: string;
  zonaId: string;
  zonaNombre: string;
  prestamosActivos: number;
  montoVencido: number;
  diasVencido: number;
}

/**
 * Cliente con mejor cumplimiento
 */
export interface ClienteCumplidor {
  clienteId: string;
  clienteNombre: string;
  zonaId: string;
  zonaNombre: string;
  prestamosActivos: number;
  montoPagado: number;
  porcentajeCumplimiento: number;
}

/**
 * Filtros para el reporte
 */
export interface FiltrosReporte {
  periodo: PeriodoReporte;
  fechaInicio?: Date;
  fechaFin?: Date;
  zonaId?: string;
  clienteId?: string;
  estadoPrestamo?: 'al_dia' | 'proximo_vencer' | 'vencido' | 'todos';
}

/**
 * Detalle de un cobro individual
 */
export interface DetalleCobro {
  pagoId: string;
  prestamoId: string;
  clienteId: string;
  clienteNombre: string;
  zonaId: string;
  zonaNombre: string;
  fechaPago: Date;
  montoPago: number;
  estado: 'pagado' | 'pendiente' | 'vencido';
  diasAtraso?: number;
}
