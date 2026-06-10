import { Injectable, signal } from '@angular/core';
import { SwUpdate, VersionEvent, VersionReadyEvent } from '@angular/service-worker';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  readonly appName = environment.appName ?? 'CobrApp';
  readonly currentVersion = environment.appVersion ?? '0.0.0';

  readonly isUpdateSupported = signal(false);
  readonly isChecking = signal(false);
  readonly updateAvailable = signal(false);
  readonly statusMessage = signal('No se ha verificado la actualización.');

  private initialized = false;
  private checkTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private swUpdate: SwUpdate) {
    this.isUpdateSupported.set(this.swUpdate.isEnabled);
  }

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    if (!this.swUpdate.isEnabled) {
      this.statusMessage.set('Actualizaciones automáticas no disponibles en este entorno.');
      return;
    }

    this.swUpdate.versionUpdates.subscribe((event: VersionEvent) => {
      if (event.type === 'VERSION_DETECTED') {
        this.statusMessage.set('Descargando una nueva versión...');
      }

      if (event.type === 'VERSION_READY') {
        const readyEvent = event as VersionReadyEvent;
        this.updateAvailable.set(true);
        this.statusMessage.set(
          `Nueva versión disponible (${this.versionLabel(readyEvent.latestVersion.hash)}).`
        );
      }

      if (event.type === 'VERSION_INSTALLATION_FAILED') {
        this.statusMessage.set('Sin conexión o no se pudo verificar actualizaciones.');
      }
    });

    void this.checkForUpdates();
    this.checkTimer = setInterval(() => {
      void this.checkForUpdates();
    }, 15 * 60 * 1000);
  }

  async checkForUpdates(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      this.statusMessage.set('Actualizaciones automáticas no disponibles en este entorno.');
      return;
    }

    this.isChecking.set(true);
    try {
      const found = await this.swUpdate.checkForUpdate();
      if (found) {
        this.updateAvailable.set(true);
        this.statusMessage.set('Nueva versión disponible.');
      } else if (!this.updateAvailable()) {
        this.statusMessage.set('App actualizada.');
      }
    } catch {
      this.statusMessage.set('Sin conexión o no se pudo verificar actualizaciones.');
    } finally {
      this.isChecking.set(false);
    }
  }

  async applyUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      this.statusMessage.set('Actualizaciones automáticas no disponibles en este entorno.');
      return;
    }

    this.isChecking.set(true);
    try {
      await this.swUpdate.activateUpdate();
      this.statusMessage.set('Aplicando actualización...');
      document.location.reload();
    } catch {
      this.statusMessage.set('Sin conexión o no se pudo actualizar.');
      this.isChecking.set(false);
    }
  }

  private versionLabel(hash: string): string {
    return hash.slice(0, 8);
  }
}
