import { Component, signal, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements AfterViewInit {
  readonly isDevMode = !environment.production || (environment as any).allowDevLogin;
  loading = signal(false);
  error   = signal<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

  ngAfterViewInit(): void {
    if (!this.isDevMode) {
      const tryInit = () => {
        const fn = (window as any)['initGoogleSignIn'];
        if (fn) {
          fn(
            '852221398029-tbl50a6mdfcageqn2c3t5l1h1ttiu3o4.apps.googleusercontent.com',
            (response: any) => this.onGoogleCredential(response)
          );
        } else {
          setTimeout(tryInit, 100);
        }
      };
      tryInit();
    }
  }

  onGoogleCredential(response: any): void {
    const idToken = response.credential;
    this.loading.set(true);
    this.error.set(null);
    this.auth.googleLogin(idToken).subscribe({
      next: () => this.router.navigate(['/']),
      error: (_err: unknown) => {
        this.error.set('No se pudo autenticar con Google.');
        this.loading.set(false);
      }
    });
  }

  entrarComoDev(): void {
    this.loading.set(true);
    this.error.set(null);

    this.auth.devLogin().subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.error.set('No se pudo conectar al servidor.');
        this.loading.set(false);
      }
    });
  }
}
