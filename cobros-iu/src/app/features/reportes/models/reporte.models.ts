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
