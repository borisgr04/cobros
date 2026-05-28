import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait until the APP_INITIALIZER silent-refresh has finished so we don't
  // redirect to /login while the session is still being restored.
  if (auth.isInitializing()) {
    await firstValueFrom(
      toObservable(auth.isInitializing).pipe(filter(v => !v))
    );
  }

  const hadSession = auth.isAuthenticated() || auth.currentUser() !== null;

  if (await auth.ensureValidSession()) {
    return true;
  }

  return router.createUrlTree(
    ['/login'],
    hadSession ? { queryParams: { reason: 'session-expired' } } : undefined
  );
};
