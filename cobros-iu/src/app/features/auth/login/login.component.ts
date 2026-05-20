import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  readonly isDevMode = !environment.production || (environment as any).allowDevLogin;
  loading = signal(false);
  error   = signal<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

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
