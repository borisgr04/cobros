import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  // Token en memoria (sesión activa)
  if (auth.isAuthenticated()) return true;
  // Usuario en localStorage: hay sesión previa, el silent refresh puede estar en curso
  if (auth.currentUser()) return true;
  return inject(Router).createUrlTree(['/login']);
};
