import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface AuthUser {
  email: string;
  nombre: string;
  fotoUrl?: string;
}

interface AuthResponse {
  token: string;
  email: string;
  nombre: string;
  fotoUrl: string | null;
  /** ISO-8601 expiry date string */
  expira: string;
}

const USER_KEY = 'cobros_user';
/** Refresh 60 seconds before expiry */
const REFRESH_AHEAD_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Access token kept only in memory (never in localStorage)
  private readonly _token   = signal<string | null>(null);
  private readonly _expira  = signal<Date | null>(null);
  private readonly _user    = signal<AuthUser | null>(this.loadUser());

  readonly isAuthenticated = computed(() => !!this._token());
  readonly currentUser     = this._user.asReadonly();

  /** Ongoing silent-refresh promise – shared across concurrent callers */
  private _refreshing: Promise<boolean> | null = null;
  private _refreshTimer: ReturnType<typeof setTimeout> | null = null;

  /** BehaviorSubject used by the interceptor to serialize refresh calls */
  readonly refreshing$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {}

  // ─── Initialisation ───────────────────────────────────────────────────────

  /**
   * Called once at app startup (APP_INITIALIZER).
   * Tries a silent refresh to restore the session from the HttpOnly cookie.
   */
  async initSession(): Promise<void> {
    await this.silentRefresh();
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  /** Login de desarrollo: llama a POST /api/auth/dev-login (solo con UseDevAuth: true) */
  devLogin(email = 'dev@test.com', nombre = 'Dev User') {
    return this.http
      .post<AuthResponse>('/api/auth/dev-login', { email, nombre })
      .pipe(tap(res => this.storeSession(res)));
  }

  /** Login con Google: llama a POST /api/auth/google */
  googleLogin(idToken: string) {
    return this.http
      .post<AuthResponse>('/api/auth/google', { idToken })
      .pipe(tap(res => this.storeSession(res)));
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  logout(): void {
    this.clearRefreshTimer();
    // Tell the server to revoke the refresh token cookie
    this.http.post('/api/auth/logout', {}, { withCredentials: true }).subscribe({
      error: () => { /* ignore network errors during logout */ }
    });
    this.clearSession();
    this.router.navigate(['/login']);
  }

  // ─── Token accessors ──────────────────────────────────────────────────────

  getToken(): string | null {
    return this._token();
  }

  /** Returns true if the access token is present and not within the refresh window */
  isTokenValid(): boolean {
    const expira = this._expira();
    if (!this._token() || !expira) return false;
    return expira.getTime() - Date.now() > REFRESH_AHEAD_MS;
  }

  /** Returns the token expiry time */
  getExpira(): Date | null {
    return this._expira();
  }

  // ─── Silent refresh ───────────────────────────────────────────────────────

  /**
   * Calls POST /api/auth/refresh with the HttpOnly cookie.
   * Returns true on success, false on failure.
   * Multiple concurrent callers share the same in-flight promise.
   */
  silentRefresh(): Promise<boolean> {
    if (this._refreshing) return this._refreshing;

    this.refreshing$.next(true);
    this._refreshing = firstValueFrom(
      this.http.post<AuthResponse>('/api/auth/refresh', {}, { withCredentials: true }) as Observable<AuthResponse>
    )
      .then(res => {
        this.storeSession(res);
        return true;
      })
      .catch(() => {
        this.clearSession();
        return false;
      })
      .finally(() => {
        this._refreshing = null;
        this.refreshing$.next(false);
      });

    return this._refreshing;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /** Called by biometric login after the server returns a session */
  applySession(res: { token: string; email: string; nombre: string; fotoUrl: string | null; expira: string }): void {
    this.storeSession(res);
  }

  private storeSession(res: AuthResponse): void {
    const user: AuthUser = {
      email:   res.email,
      nombre:  res.nombre,
      fotoUrl: res.fotoUrl ?? undefined
    };
    const expira = new Date(res.expira);

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._token.set(res.token);
    this._expira.set(expira);
    this._user.set(user);

    this.scheduleRefresh(expira);
  }

  private clearSession(): void {
    this.clearRefreshTimer();
    this._token.set(null);
    this._expira.set(null);
    this._user.set(null);
    localStorage.removeItem(USER_KEY);
  }

  private scheduleRefresh(expira: Date): void {
    this.clearRefreshTimer();
    const delay = expira.getTime() - Date.now() - REFRESH_AHEAD_MS;
    if (delay > 0) {
      this._refreshTimer = setTimeout(() => this.silentRefresh(), delay);
    }
  }

  private clearRefreshTimer(): void {
    if (this._refreshTimer !== null) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = null;
    }
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) as AuthUser : null;
  }
}
