/**
 * Resumen de estadísticas de una zona geográfica para el dashboard.
 */
export interface ResumenZona {
  /** ID de la zona */
  zonaId: string;
  /** Nombre de la zona */
  zona: string;
  /** Cantidad de clientes en la zona */
  clientes: number;
  /** Cantidad de préstamos activos en la zona */
  prestamos: number;
  /** Valor total de la cartera en la zona */
  cartera: number;
  /** Estado general de la zona basado en métricas */
  estado: 'excelente' | 'bueno' | 'regular' | 'critico';
}
