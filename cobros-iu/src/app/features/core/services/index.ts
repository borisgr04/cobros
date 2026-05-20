// Re-exportación del servicio base
export { BaseService } from './base.service';

// Abstracciones (tokens de inyección de dependencias)
export { AbstractClienteService } from './abstract-cliente.service';
export { AbstractZonaService } from './abstract-zona.service';
export { AbstractPrestamoService } from './abstract-prestamo.service';
export { AbstractPagoService } from './abstract-pago.service';

// Re-exportación de servicios de entidades
export { ClienteService } from './cliente.service';
export { ZonaService } from './zona.service';
export { ZonaMockService } from './zona-mock.service';
export { PagoMockService } from './pago-mock.service';
export { PrestamoService } from './prestamo.service';
export { PagoService } from './pago.service';

// Re-exportación de servicios de UI
export { SidebarService } from './sidebar.service';
