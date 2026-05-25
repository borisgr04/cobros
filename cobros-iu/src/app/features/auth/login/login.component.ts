import { Component, signal, AfterViewInit, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { BiometricAuthService } from '../services/biometric-auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {
  readonly isDevMode       = !environment.production || (environment as any).allowDevLogin;
  readonly showGoogleLogin = (environment as any).showGoogleLogin === true;
  loading             = signal(false);
  error               = signal<string | null>(null);
  biometricAvailable  = signal(false);
  biometricEmail      = signal('');
  showEmailInput      = signal(false);

  constructor(
    private auth: AuthService,
    private biometric: BiometricAuthService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const available = await this.biometric.isPlatformAuthenticatorAvailable();
    this.biometricAvailable.set(available);
  }

  ngAfterViewInit(): void {
    if (this.showGoogleLogin) {
      const tryInit = () => {
        const google = (window as any)['google'];
        if (google?.accounts?.id) {
          google.accounts.id.initialize({
            client_id: '852221398029-tbl50a6mdfcageqn2c3t5l1h1ttiu3o4.apps.googleusercontent.com',
            callback: (response: any) => this.onGoogleCredential(response)
          });
          google.accounts.id.renderButton(
            document.getElementById('googleBtnDiv'),
            { theme: 'outline', size: 'large', width: 360 }
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

  async loginWithBiometrics(): Promise<void> {
    if (!this.biometricEmail()) {
      this.showEmailInput.set(true);
      return;
    }
    if (!this.biometric.hasRegisteredLocally()) {
      this.error.set('Para usar biometría, primero debes activarla desde tu perfil tras iniciar sesión.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      const options = await this.biometric.authenticateBegin(this.biometricEmail());
      const assertion = await navigator.credentials.get({ publicKey: options }) as PublicKeyCredential;
      if (!assertion) throw new Error('No se obtuvo respuesta del autenticador.');
      const session = await this.biometric.authenticateComplete(assertion);
      this.auth.applySession(session);
      this.router.navigate(['/']);
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        this.error.set('Permiso denegado o tiempo de espera agotado.');
      } else {
        this.error.set(err?.message ?? 'Error al autenticar con biometría.');
      }
      this.loading.set(false);
    }
  }
}
