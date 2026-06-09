import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../features/auth/services/auth.service';
import { BiometricAuthService } from '../../../features/auth/services/biometric-auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-bottom-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './bottom-navigation.component.html',
  styleUrl: './bottom-navigation.component.scss'
})
export class BottomNavigationComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  readonly biometric = inject(BiometricAuthService);

  user = this.auth.currentUser;
  mostrarMenuUsuario = signal<boolean>(false);
  mostrarMenuReportes = signal<boolean>(false);
  biometricAvailable = signal(false);

  // Items de navegación directa (panel triggers se agregan en template)
  navItems: NavItem[] = [
    { path: '/', label: 'Inicio', icon: 'bi-house-fill' },
    { path: '/clientes', label: 'Clientes', icon: 'bi-people-fill' },
    { path: '/zonas', label: 'Zonas', icon: 'bi-geo-alt-fill' },
  ];

  constructor() {
    // Cerrar ambos paneles al navegar
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.mostrarMenuUsuario.set(false);
        this.mostrarMenuReportes.set(false);
      });

    this.biometric.isPlatformAuthenticatorAvailable().then(ok => this.biometricAvailable.set(ok));
  }

  toggleMenuUsuario(): void {
    this.mostrarMenuUsuario.set(!this.mostrarMenuUsuario());
    if (this.mostrarMenuUsuario()) this.mostrarMenuReportes.set(false);
  }

  cerrarMenuUsuario(): void {
    this.mostrarMenuUsuario.set(false);
  }

  toggleMenuReportes(): void {
    this.mostrarMenuReportes.set(!this.mostrarMenuReportes());
    if (this.mostrarMenuReportes()) this.mostrarMenuUsuario.set(false);
  }

  cerrarMenuReportes(): void {
    this.mostrarMenuReportes.set(false);
  }

  irAReportes(): void {
    this.cerrarMenuReportes();
    this.router.navigate(['/reportes']);
  }

  irACierreDia(): void {
    this.cerrarMenuReportes();
    this.router.navigate(['/reportes/cierre-dia']);
  }

  irAPerfil(): void {
    this.cerrarMenuUsuario();
    this.router.navigate(['/perfil']);
  }

  logout(): void {
    this.auth.logout();
  }

  get rutaEsReportes(): boolean {
    return this.router.url.startsWith('/reportes');
  }
}
