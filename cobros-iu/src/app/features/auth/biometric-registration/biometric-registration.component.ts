import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BiometricAuthService, WebAuthnCredentialInfo } from '../services/biometric-auth.service';

@Component({
  selector: 'app-biometric-registration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './biometric-registration.component.html'
})
export class BiometricRegistrationComponent implements OnInit {
  private biometric = inject(BiometricAuthService);

  readonly isSupported      = signal(false);
  readonly credentials      = this.biometric.credentials;
  readonly localCredIds     = signal<string[]>([]);
  readonly isDesync         = signal(false);
  loading    = signal(false);
  error      = signal<string | null>(null);
  success    = signal<string | null>(null);
  deviceName = '';

  constructor() {}

  async ngOnInit(): Promise<void> {
    const available = await this.biometric.isPlatformAuthenticatorAvailable();
    this.isSupported.set(available);
    if (available) {
      await this.biometric.loadCredentials();
      this.checkLocalSync();
    }
  }

  private checkLocalSync(): void {
    const localIds = this.biometric.getStoredCredentialIds();
    this.localCredIds.set(localIds);
    const dbIds = this.credentials().map(c => c.credentialIdBase64);
    const hasDesync = localIds.some(id => !dbIds.includes(id));
    this.isDesync.set(hasDesync);
  }

  isThisDevice(cred: WebAuthnCredentialInfo): boolean {
    return this.localCredIds().includes(cred.credentialIdBase64);
  }

  clearLocalCredentials(): void {
    this.biometric.clearLocalCredentials();
    this.localCredIds.set([]);
    this.isDesync.set(false);
    this.success.set('Datos locales limpiados. Puedes registrar este dispositivo nuevamente.');
  }

  async register(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);
    try {
      const options = await this.biometric.registerBegin();
      const credential = await navigator.credentials.create({ publicKey: options }) as PublicKeyCredential;
      if (!credential) throw new Error('No se obtuvo credencial del autenticador.');
      await this.biometric.registerComplete(credential, this.deviceName || 'Mi dispositivo');
      this.biometric.markAsRegistered();
      this.success.set('Biometría registrada correctamente.');
      this.deviceName = '';
      await this.biometric.loadCredentials();
      this.checkLocalSync();
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        this.error.set('Permiso denegado o tiempo de espera agotado.');
      } else {
        this.error.set(err?.message ?? 'Error al registrar biometría.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  async deleteCredential(cred: WebAuthnCredentialInfo): Promise<void> {
    if (!confirm('¿Eliminar esta credencial biométrica?')) return;
    try {
      await this.biometric.deleteCredential(cred.id);
      this.checkLocalSync();
    } catch {
      this.error.set('No se pudo eliminar la credencial.');
    }
  }
}
