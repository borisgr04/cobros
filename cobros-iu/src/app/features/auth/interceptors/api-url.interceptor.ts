import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

/**
 * Antepone environment.apiUrl a todas las rutas relativas /api/...
 * Esto permite que los servicios usen rutas relativas en dev (proxy ng serve)
 * y rutas absolutas en producción (SWA → Container App).
 */
export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('/api/') && environment.apiUrl) {
    const newUrl = `${environment.apiUrl}${req.url}`;
    return next(req.clone({ url: newUrl }));
  }
  return next(req);
};
