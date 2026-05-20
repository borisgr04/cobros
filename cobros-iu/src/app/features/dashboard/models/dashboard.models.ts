/**
 * Modelos e interfaces para el Dashboard
 */

/**
 * Interfaz para métricas KPI del dashboard
 */
export interface KPI {
  /** Título del KPI */
  titulo: string;
  /** Valor numérico del KPI */
  valor: number;
  /** Formato de visualización */
  formato: 'currency' | 'number';
  /** Emoji o icono para mostrar */
  icono: string;
  /** Porcentaje de variación respecto al período anterior */
  variacion?: number;
  /** Tipo de variación para styling */
  variacionTipo?: 'aumento' | 'disminucion' | 'neutral';
  /** Texto adicional debajo del valor */
  subtitulo?: string;
  /** Ruta de navegación al hacer click en la tarjeta */
  ruta?: string;
}

/**
 * Interfaz para alertas y notificaciones
 */
export interface Alerta {
  /** Tipo de alerta que determina el color y la prioridad */
  tipo: 'critico' | 'advertencia' | 'info';
  /** Mensaje principal de la alerta */
  mensaje: string;
  /** Ruta para navegar al hacer click en "Ver detalles" */
  link?: string;
  /** Emoji o icono para la alerta */
  icono: string;
}

/**
 * Interfaz para resumen de datos por zona geográfica
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

/**
 * Interfaz para registro de actividad reciente en el sistema
 */
export interface ActividadReciente {
  /** Tipo de actividad realizada */
  tipo: 'pago' | 'prestamo-completado' | 'nuevo-prestamo' | 'nuevo-cliente' | 'edicion';
  /** Fecha y hora de la actividad */
  hora: Date;
  /** Descripción corta de la actividad */
  descripcion: string;
  /** Detalles adicionales de la actividad */
  detalles: string;
  /** Emoji o icono para la actividad */
  icono: string;
}
