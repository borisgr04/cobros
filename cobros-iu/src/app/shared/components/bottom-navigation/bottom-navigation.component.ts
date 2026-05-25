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
  biometricAvailable = signal(false);

  // Items de navegación (mismos que sidebar)
  navItems: NavItem[] = [
    { path: '/', label: 'Inicio', icon: 'bi-house-fill' },
    { path: '/clientes', label: 'Clientes', icon: 'bi-people-fill' },
    { path: '/zonas', label: 'Zonas', icon: 'bi-geo-alt-fill' },
    { path: '/dashboard', label: 'Tablero', icon: 'bi-grid-1x2-fill' },
    { path: '/perfil', label: 'Perfil', icon: 'bi-person-circle' },
    { path: '/usuarios', label: 'Usuarios', icon: 'bi-person-gear' }
  ];

  constructor() {
    // Cerrar el panel de usuario al navegar
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.mostrarMenuUsuario.set(false));

    this.biometric.isPlatformAuthenticatorAvailable().then(ok => this.biometricAvailable.set(ok));
  }

  toggleMenuUsuario(): void {
    this.mostrarMenuUsuario.set(!this.mostrarMenuUsuario());
  }

  cerrarMenuUsuario(): void {
    this.mostrarMenuUsuario.set(false);
  }

  irAPerfil(): void {
    this.cerrarMenuUsuario();
    this.router.navigate(['/perfil']);
  }

  logout(): void {
    this.auth.logout();
  }
}
