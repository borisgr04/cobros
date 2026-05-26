import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const hadSession = auth.isAuthenticated() || auth.currentUser() !== null;

  if (await auth.ensureValidSession()) {
    return true;
  }

  return router.createUrlTree(
    ['/login'],
    hadSession ? { queryParams: { reason: 'session-expired' } } : undefined
  );
};
