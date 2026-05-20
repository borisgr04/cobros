import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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
  expira: string;
}

const TOKEN_KEY = 'cobros_token';
const USER_KEY  = 'cobros_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly _user  = signal<AuthUser | null>(this.loadUser());

  readonly isAuthenticated = computed(() => !!this._token());
  readonly currentUser     = this._user.asReadonly();

  constructor(private http: HttpClient, private router: Router) {}

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

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._token();
  }

  private storeSession(res: AuthResponse): void {
    const user: AuthUser = {
      email:   res.email,
      nombre:  res.nombre,
      fotoUrl: res.fotoUrl ?? undefined
    };
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._token.set(res.token);
    this._user.set(user);
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) as AuthUser : null;
  }
}
