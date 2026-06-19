import { bootstrapApplication } from '@angular/platform-browser';
import { ConsultaPublicaComponent } from './app/features/consulta-publica/consulta-publica.component';
import { publicConfig } from './app/public.config';

bootstrapApplication(ConsultaPublicaComponent, publicConfig)
  .catch((err) => console.error(err));
