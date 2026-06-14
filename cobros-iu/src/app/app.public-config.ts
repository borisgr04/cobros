import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ConsultaPublicaComponent } from './features/consulta-publica/consulta-publica.component';

export const publicConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter([
      { path: ':id', component: ConsultaPublicaComponent },
      { path: '**', component: ConsultaPublicaComponent },
    ]),
    provideHttpClient(),
  ]
};
