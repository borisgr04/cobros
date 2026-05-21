import type { FrecuenciaPago, IPrestamo, IPago } from '../../core/models';

/**
 * Tipo para el estado calculado de un préstamo
 */
export type EstadoPrestamo = 'activo' | 'completado' | 'vencido' | 'mora';

/**
 * Interface que espeja el CuotaDetalleDto del backend
 */
export interface CuotaDetalleDto {
  id: number;
  numeroCuota: number;
  fechaEsperada: string;
  valorCuota: number;
  saldoPagado: number;
  estado: 'pendiente' | 'parcial' | 'pagada';
}

/**
 * Interface para cuota proyectada
 */
export interface CuotaProyectada {
  numero: number;
  fechaEsperada: Date;
  valorEsperado: number;
  estado: 'pagada' | 'parcial' | 'pendiente';
  saldoPagado: number;
  fechaPago?: Date;
  valorPago?: number;
}

/**
 * Interface para estadísticas de un préstamo
 */
export interface EstadisticasPrestamo {
  totalPrestado: number;
  totalPorCobrar: number;
  totalPagado: number;
  porcentajePagado: number;
  cuotasPagadas: number;
  cuotasPendientes: number;
  diasTranscurridos: number;
  diasRestantes: number;
  proximaCuotaFecha: Date;
  proximaCuotaValor: number;
  estado: EstadoPrestamo;
}

/**
 * Calcula el interés proyectado basado en el valor prestado y el porcentaje
 */
export function calcularInteresProyectado(valorPrestado: number, porcentaje: number): number {
  return Math.round(valorPrestado * (porcentaje / 100));
}

/**
 * Calcula el valor total a pagar (prestado + interés)
 */
export function calcularValorTotal(valorPrestado: number, interesProyectado: number): number {
  return valorPrestado + interesProyectado;
}

/**
 * Calcula la cantidad de cuotas según el período y la frecuencia de pago
 */
export function calcularCantidadCuotas(
  fechaInicio: Date,
  fechaFin: Date,
  frecuencia: FrecuenciaPago
): number {
  const dias = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24));

  switch (frecuencia) {
    case 'diario':
      return dias;
    case 'semanal':
      return Math.ceil(dias / 7);
    case 'quincenal':
      return Math.ceil(dias / 15);
    case 'mensual':
      return Math.ceil(dias / 30);
    default:
      return dias;
  }
}

/**
 * Calcula el valor de cada cuota
 */
export function calcularValorCuota(valorTotal: number, cantidadCuotas: number): number {
  if (cantidadCuotas === 0) return 0;
  return Math.round(valorTotal / cantidadCuotas);
}

/**
 * Calcula el total pagado sumando todos los pagos
 */
export function calcularTotalPagado(pagos: IPago[]): number {
  return pagos.reduce((sum, pago) => sum + pago.valor, 0);
}

/**
 * Calcula el saldo pendiente
 */
export function calcularSaldoPendiente(valorTotal: number, pagos: IPago[]): number {
  const totalPagado = calcularTotalPagado(pagos);
  return Math.max(0, valorTotal - totalPagado);
}

/**
 * Calcula el porcentaje pagado
 */
export function calcularPorcentajePagado(valorTotal: number, totalPagado: number): number {
  if (valorTotal === 0) return 0;
  return Math.round((totalPagado / valorTotal) * 100);
}

/**
 * Cuenta las cuotas pagadas (número de pagos registrados)
 */
export function contarCuotasPagadas(pagos: IPago[]): number {
  return pagos.length;
}

/**
 * Calcula las cuotas pendientes
 */
export function calcularCuotasPendientes(cantidadCuotas: number, cuotasPagadas: number): number {
  return Math.max(0, cantidadCuotas - cuotasPagadas);
}

/**
 * Agrega días a una fecha
 */
function addDays(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

/**
 * Calcula la fecha de la próxima cuota esperada
 */
export function calcularProximaCuotaFecha(
  fechaPrestamo: Date,
  frecuencia: FrecuenciaPago,
  cuotasPagadas: number
): Date {
  const cuotaNumero = cuotasPagadas + 1;

  switch (frecuencia) {
    case 'diario':
      return addDays(fechaPrestamo, cuotaNumero);
    case 'semanal':
      return addDays(fechaPrestamo, cuotaNumero * 7);
    case 'quincenal':
      return addDays(fechaPrestamo, cuotaNumero * 15);
    case 'mensual':
      return addDays(fechaPrestamo, cuotaNumero * 30);
    default:
      return addDays(fechaPrestamo, cuotaNumero);
  }
}

/**
 * Calcula el valor de la próxima cuota
 */
export function calcularProximaCuotaValor(
  valorCuota: number,
  saldoPendiente: number
): number {
  return Math.min(valorCuota, saldoPendiente);
}

/**
 * Calcula los días transcurridos desde el préstamo
 */
export function calcularDiasTranscurridos(fechaPrestamo: Date): number {
  const hoy = new Date();
  return Math.floor((hoy.getTime() - new Date(fechaPrestamo).getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calcula los días restantes hasta la fecha final
 */
export function calcularDiasRestantes(fechaFinal: Date): number {
  const hoy = new Date();
  const dias = Math.ceil((new Date(fechaFinal).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, dias);
}

/**
 * Determina el estado del préstamo
 */
export function determinarEstadoPrestamo(
  fechaFinal: Date,
  saldoPendiente: number,
  proximaCuota: Date
): EstadoPrestamo {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Completado: no hay saldo pendiente
  if (saldoPendiente === 0) {
    return 'completado';
  }

  // Vencido: pasó la fecha final y aún hay saldo
  if (fechaFinal < hoy && saldoPendiente > 0) {
    return 'vencido';
  }

  // En mora: pasó la fecha de la próxima cuota
  if (proximaCuota < hoy && saldoPendiente > 0) {
    return 'mora';
  }

  // Activo: el resto de casos
  return 'activo';
}

/**
 * Mapea CuotaDetalleDto[] del backend a CuotaProyectada[]
 */
export function mapCuotasDesdeBackend(cuotas: CuotaDetalleDto[]): CuotaProyectada[] {
  return cuotas.map(c => ({
    numero: c.numeroCuota,
    fechaEsperada: new Date(c.fechaEsperada),
    valorEsperado: c.valorCuota,
    saldoPagado: c.saldoPagado,
    estado: c.estado,
  }));
}

/**
 * Genera la proyección completa de cuotas
 */
export function generarProyeccionCuotas(
  prestamo: IPrestamo,
  pagos: IPago[]
): CuotaProyectada[] {
  const cuotas: CuotaProyectada[] = [];
  const pagosOrdenados = [...pagos].sort(
    (a, b) => new Date(a.fechaPago).getTime() - new Date(b.fechaPago).getTime()
  );

  for (let i = 1; i <= prestamo.cantidadCuotas; i++) {
    const fechaEsperada = calcularFechaCuotaN(prestamo.fechaPrestamo, prestamo.frecuenciaPago, i);
    const pago = pagosOrdenados[i - 1];

    cuotas.push({
      numero: i,
      fechaEsperada,
      valorEsperado: prestamo.valorCuota,
      saldoPagado: pago ? prestamo.valorCuota : 0,
      estado: pago ? 'pagada' : 'pendiente',
      fechaPago: pago?.fechaPago,
      valorPago: pago?.valor,
    });
  }

  return cuotas;
}

/**
 * Calcula la fecha de una cuota específica
 */
function calcularFechaCuotaN(
  fechaPrestamo: Date,
  frecuencia: FrecuenciaPago,
  numeroCuota: number
): Date {
  switch (frecuencia) {
    case 'diario':
      return addDays(fechaPrestamo, numeroCuota);
    case 'semanal':
      return addDays(fechaPrestamo, numeroCuota * 7);
    case 'quincenal':
      return addDays(fechaPrestamo, numeroCuota * 15);
    case 'mensual':
      return addDays(fechaPrestamo, numeroCuota * 30);
    default:
      return addDays(fechaPrestamo, numeroCuota);
  }
}

/**
 * Calcula todas las estadísticas de un préstamo
 */
export function calcularEstadisticasPrestamo(
  prestamo: IPrestamo,
  pagos: IPago[]
): EstadisticasPrestamo {
  const totalPagado = calcularTotalPagado(pagos);
  const saldoPendiente = calcularSaldoPendiente(prestamo.valorTotal, pagos);
  const cuotasPagadas = contarCuotasPagadas(pagos);
  const cuotasPendientes = calcularCuotasPendientes(prestamo.cantidadCuotas, cuotasPagadas);
  const proximaCuotaFecha = calcularProximaCuotaFecha(
    prestamo.fechaPrestamo,
    prestamo.frecuenciaPago,
    cuotasPagadas
  );
  const proximaCuotaValor = calcularProximaCuotaValor(prestamo.valorCuota, saldoPendiente);
  const estado = determinarEstadoPrestamo(prestamo.fechaFinal, saldoPendiente, proximaCuotaFecha);

  return {
    totalPrestado: prestamo.valorPrestado,
    totalPorCobrar: saldoPendiente,
    totalPagado,
    porcentajePagado: calcularPorcentajePagado(prestamo.valorTotal, totalPagado),
    cuotasPagadas,
    cuotasPendientes,
    diasTranscurridos: calcularDiasTranscurridos(prestamo.fechaPrestamo),
    diasRestantes: calcularDiasRestantes(prestamo.fechaFinal),
    proximaCuotaFecha,
    proximaCuotaValor,
    estado,
  };
}

/**
 * Obtiene el color para los días restantes
 */
export function getDiasRestantesColor(dias: number): string {
  if (dias < 0) return 'var(--color-danger)';
  if (dias < 7) return 'var(--color-danger)';
  if (dias <= 30) return 'var(--color-warning)';
  return 'var(--color-success)';
}

/**
 * Obtiene la clase CSS para la barra de progreso según el porcentaje
 */
export function getProgressBarClass(porcentaje: number): string {
  if (porcentaje >= 100) return 'complete';
  if (porcentaje >= 50) return 'high';
  if (porcentaje >= 25) return 'medium';
  return 'low';
}
