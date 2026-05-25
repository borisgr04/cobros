import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../../dashboard/services/dashboard.service';
import { BiometricAuthService } from '../../auth/services/biometric-auth.service';
import type { ResumenZona } from '../../dashboard/models/dashboard.models';

/**
 * Componente Home - Vista principal con resumen por zonas en formato de tarjetas
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);
  private biometric = inject(BiometricAuthService);

  zonas = signal<ResumenZona[]>([]);
  cargando = signal<boolean>(false);
  showBiometricPrompt = signal(false);

  // Totales generales
  totales = signal({
    clientes: 0,
    prestamos: 0,
    cartera: 0
  });

  async ngOnInit(): Promise<void> {
    this.cargarResumenZonas();
    await this.checkBiometricPrompt();
  }

  private async checkBiometricPrompt(): Promise<void> {
    if (localStorage.getItem('biometric_prompt_dismissed')) return;
    if (this.biometric.hasRegisteredLocally()) return;
    const available = await this.biometric.isPlatformAuthenticatorAvailable();
    if (!available) return;
    try {
      await this.biometric.loadCredentials();
    } catch {
      return;
    }
    if (this.biometric.credentials().length === 0) {
      this.showBiometricPrompt.set(true);
    }
  }

  dismissBiometricPrompt(): void {
    localStorage.setItem('biometric_prompt_dismissed', 'true');
    this.showBiometricPrompt.set(false);
  }

  activateBiometrics(): void {
    this.dismissBiometricPrompt();
    this.router.navigate(['/perfil']);
  }

  /**
   * Carga el resumen por zonas desde el servicio
   */
  async cargarResumenZonas(): Promise<void> {
    this.cargando.set(true);
    try {
      const resumen = await this.dashboardService.getResumenPorZona();
      this.zonas.set(resumen);
      
      // Calcular totales
      const totales = resumen.reduce((acc, zona) => ({
        clientes: acc.clientes + zona.clientes,
        prestamos: acc.prestamos + zona.prestamos,
        cartera: acc.cartera + zona.cartera
      }), { clientes: 0, prestamos: 0, cartera: 0 });
      
      this.totales.set(totales);
    } catch (error) {
      console.error('Error al cargar resumen de zonas:', error);
    } finally {
      this.cargando.set(false);
    }
  }

  /**
   * Navega a la vista de clientes filtrados por zona
   */
  verClientesZona(zona: ResumenZona): void {
    if (zona.clientes > 0) {
      this.router.navigate(['/clientes'], { 
        queryParams: { zona: zona.zonaId } 
      });
    }
  }

  /**
   * Obtiene la clase CSS del estado
   */
  getEstadoClass(estado: string): string {
    const clases: Record<string, string> = {
      'excelente': 'estado-excelente',
      'bueno': 'estado-bueno',
      'regular': 'estado-regular',
      'critico': 'estado-critico'
    };
    return clases[estado] || '';
  }

  /**
   * Obtiene el emoji del estado
   */
  getEstadoEmoji(estado: string): string {
    const emojis: Record<string, string> = {
      'excelente': '🟢',
      'bueno': '🟡',
      'regular': '🟠',
      'critico': '🔴'
    };
    return emojis[estado] || '⚪';
  }

  /**
   * Formatea un número como moneda en formato compacto (K = miles, M = millones)
   */
  formatCurrency(value: number): string {
    if (value >= 1000000) {
      // Millones
      const millions = value / 1000000;
      return `$${millions.toFixed(millions >= 10 ? 0 : 1)}M`;
    } else if (value >= 1000) {
      // Miles
      const thousands = value / 1000;
      return `$${thousands.toFixed(thousands >= 10 ? 0 : 1)}K`;
    } else {
      // Menor a mil
      return `$${value.toFixed(0)}`;
    }
  }
}
