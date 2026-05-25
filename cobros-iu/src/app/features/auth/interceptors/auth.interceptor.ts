import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, filter, from, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Let auth endpoints pass through without modification
  if (req.url.includes('/api/auth/')) {
    return next(req);
  }

  const auth = inject(AuthService);

  const attachToken = (token: string | null) => {
    const cloned = token
      ? req.clone({ setHeaders: { Authorization: 'Bearer ' + token } })
      : req;
    return next(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Server-side rejection → force logout (refresh token is also invalid)
          auth.logout();
        }
        return throwError(() => error);
      })
    );
  };

  // Proactive refresh: token missing or near expiry
  if (!auth.isTokenValid()) {
    // If already refreshing, wait for it to complete then retry
    if (auth.refreshing$.getValue()) {
      return auth.refreshing$.pipe(
        filter(refreshing => !refreshing),
        take(1),
        switchMap(() => attachToken(auth.getToken()))
      );
    }
    // Trigger silent refresh first, then send the request
    return from(auth.silentRefresh()).pipe(
      switchMap(() => attachToken(auth.getToken()))
    );
  }

  return attachToken(auth.getToken());
};
