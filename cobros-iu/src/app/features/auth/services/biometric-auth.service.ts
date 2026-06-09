import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface WebAuthnCredentialInfo {
  id: string;
  deviceName: string;
  createdAt: string;
  lastUsedAt: string | null;
}

/** Helpers to convert between base64url and Uint8Array */
function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
  return buffer.buffer;
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

@Injectable({ providedIn: 'root' })
export class BiometricAuthService {
  readonly isSupported = signal(
    typeof window !== 'undefined' &&
    !!window.PublicKeyCredential &&
    !!navigator.credentials
  );

  readonly credentials = signal<WebAuthnCredentialInfo[]>([]);

  constructor(private http: HttpClient) {}

  /** Check if platform authenticator (Face ID / fingerprint) is available */
  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }

  // ─── Registration ──────────────────────────────────────────────────────────

  async registerBegin(): Promise<PublicKeyCredentialCreationOptions> {
    const response = await firstValueFrom(
      this.http.post<any>('/api/auth/webauthn/register/begin', {}, { withCredentials: true })
    );
    // Decode base64url fields expected by the browser API
    return {
      ...response,
      challenge: base64urlToBuffer(response.challenge),
      user: {
        ...response.user,
        id: base64urlToBuffer(response.user.id)
      },
      excludeCredentials: (response.excludeCredentials ?? []).map((c: any) => ({
        ...c,
        id: base64urlToBuffer(c.id)
      }))
    };
  }

  async registerComplete(credential: PublicKeyCredential, deviceName: string): Promise<void> {
    const attestation = credential.response as AuthenticatorAttestationResponse;
    const body = {
      deviceName,
      attestationResponse: {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON:    bufferToBase64url(attestation.clientDataJSON),
          attestationObject: bufferToBase64url(attestation.attestationObject)
        }
      }
    };
    await firstValueFrom(
      this.http.post('/api/auth/webauthn/register/complete', body, { withCredentials: true })
    );
    // Persist the credentialId locally so authenticate can use it without email lookup
    this.addCredentialId(credential.id);
  }

  // ─── Authentication ────────────────────────────────────────────────────────

  async authenticateBegin(email: string): Promise<PublicKeyCredentialRequestOptions> {
    const localIds = this.getStoredCredentialIds();
    const body = localIds.length > 0
      ? { credentialIds: localIds }
      : { email, credentialIds: [] };

    const response = await firstValueFrom(
      this.http.post<any>('/api/auth/webauthn/authenticate/begin', body)
    );
    return {
      ...response,
      challenge: base64urlToBuffer(response.challenge),
      allowCredentials: (response.allowCredentials ?? []).map((c: any) => ({
        ...c,
        id: base64urlToBuffer(c.id)
      }))
    };
  }

  async authenticateComplete(assertion: PublicKeyCredential): Promise<any> {
    const assResponse = assertion.response as AuthenticatorAssertionResponse;
    const body = {
      assertionResponse: {
        id: assertion.id,
        rawId: bufferToBase64url(assertion.rawId),
        type: assertion.type,
        response: {
          clientDataJSON:    bufferToBase64url(assResponse.clientDataJSON),
          authenticatorData: bufferToBase64url(assResponse.authenticatorData),
          signature:         bufferToBase64url(assResponse.signature),
          userHandle: assResponse.userHandle
            ? bufferToBase64url(assResponse.userHandle)
            : null
        }
      }
    };
    return firstValueFrom(
      this.http.post<any>('/api/auth/webauthn/authenticate/complete', body, { withCredentials: true })
    );
  }

  // ─── Local credential ID storage ──────────────────────────────────────────

  private static readonly CREDENTIAL_IDS_KEY = 'biometric_credential_ids';

  /** Returns stored credentialIds for this device */
  getStoredCredentialIds(): string[] {
    try {
      const raw = localStorage.getItem(BiometricAuthService.CREDENTIAL_IDS_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  /** Adds a credentialId to localStorage (no duplicates) */
  addCredentialId(id: string): void {
    const ids = this.getStoredCredentialIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(BiometricAuthService.CREDENTIAL_IDS_KEY, JSON.stringify(ids));
    }
  }

  /** Removes a credentialId from localStorage; cleans up key if empty */
  removeCredentialId(id: string): void {
    const ids = this.getStoredCredentialIds().filter(x => x !== id);
    if (ids.length === 0) {
      localStorage.removeItem(BiometricAuthService.CREDENTIAL_IDS_KEY);
    } else {
      localStorage.setItem(BiometricAuthService.CREDENTIAL_IDS_KEY, JSON.stringify(ids));
    }
  }

  /** Clears all local biometric state for this device (use when desync with DB) */
  clearLocalCredentials(): void {
    localStorage.removeItem(BiometricAuthService.CREDENTIAL_IDS_KEY);
    localStorage.removeItem('biometric_registered');
  }

  // ─── Local registration flag ───────────────────────────────────────────────

  /** Returns true if this device has ever successfully registered a biometric credential */
  hasRegisteredLocally(): boolean {
    return localStorage.getItem('biometric_registered') === 'true';
  }

  /** Marks this device as having a registered biometric credential */
  markAsRegistered(): void {
    localStorage.setItem('biometric_registered', 'true');
  }

  // ─── Credential management ─────────────────────────────────────────────────

  async loadCredentials(): Promise<void> {
    const list = await firstValueFrom(
      this.http.get<WebAuthnCredentialInfo[]>('/api/auth/webauthn/credentials')
    );
    this.credentials.set(list);
  }

  async deleteCredential(id: string): Promise<void> {
    await firstValueFrom(this.http.delete('/api/auth/webauthn/credentials/' + id));
    this.credentials.update(list => list.filter(c => c.id !== id));
    this.removeCredentialId(id);
  }
}
