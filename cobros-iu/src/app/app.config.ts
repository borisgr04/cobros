import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { authInterceptor } from './features/auth/interceptors/auth.interceptor';
import { apiUrlInterceptor } from './features/auth/interceptors/api-url.interceptor';

// Abstracciones
import { AbstractClienteService } from './features/core/services/abstract-cliente.service';
import { AbstractZonaService } from './features/core/services/abstract-zona.service';
import { AbstractPrestamoService } from './features/core/services/abstract-prestamo.service';
import { AbstractPagoService } from './features/core/services/abstract-pago.service';

// Implementaciones mock (desarrollo con useMocks: true)
import { ClienteMockService } from './features/clientes/services/cliente-mock.service';
import { ZonaMockService } from './features/core/services/zona-mock.service';
import { PrestamoMockService } from './features/prestamos/services/prestamo-mock.service';
import { PagoMockService } from './features/core/services/pago-mock.service';

// Implementaciones reales HTTP
import { ClienteService } from './features/core/services/cliente.service';
import { ZonaService } from './features/core/services/zona.service';
import { PrestamoService as CorePrestamoService } from './features/core/services/prestamo.service';
import { PagoService } from './features/core/services/pago.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiUrlInterceptor, authInterceptor])),
    {
      provide: AbstractClienteService,
      useClass: environment.useMocks ? ClienteMockService : ClienteService
    },
    {
      provide: AbstractZonaService,
      useClass: environment.useMocks ? ZonaMockService : ZonaService
    },
    {
      provide: AbstractPrestamoService,
      useClass: environment.useMocks ? PrestamoMockService : CorePrestamoService
    },
    {
      provide: AbstractPagoService,
      useClass: environment.useMocks ? PagoMockService : PagoService
    },
  ]
};
