import { Component, signal, AfterViewInit, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  loading              = signal(false);
  error                = signal<string | null>(null);
  info                 = signal<string | null>(null);
  biometricAvailable   = signal(false);
  biometricRegistered  = signal(false);

  constructor(
    private auth: AuthService,
    private biometric: BiometricAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    this.info.set(
      reason === 'session-expired'
        ? 'Tu sesión expiró. Inicia sesión de nuevo para continuar.'
        : null
    );

    const available = await this.biometric.isPlatformAuthenticatorAvailable();
    this.biometricAvailable.set(available);
    this.biometricRegistered.set(
      this.biometric.hasRegisteredLocally() &&
      this.biometric.getStoredCredentialIds().length > 0
    );
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
    this.loading.set(true);
    this.error.set(null);
    try {
      const options = await this.biometric.authenticateBegin('');
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
