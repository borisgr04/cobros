import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../features/auth/services/auth.service';

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

  user = this.auth.currentUser;
  mostrarMenuUsuario = signal<boolean>(false);

  // Items de navegación (mismos que sidebar)
  navItems: NavItem[] = [
    { path: '/', label: 'Inicio', icon: 'bi-house-fill' },
    { path: '/clientes', label: 'Clientes', icon: 'bi-people-fill' },
    { path: '/zonas', label: 'Zonas', icon: 'bi-geo-alt-fill' },
    { path: '/reportes', label: 'Reportes', icon: 'bi-file-earmark-bar-graph-fill' },
    { path: '/dashboard', label: 'Tablero', icon: 'bi-grid-1x2-fill' },
    { path: '/usuarios', label: 'Usuarios', icon: 'bi-person-gear' }
  ];

  constructor() {
    // Cerrar el panel de usuario al navegar
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.mostrarMenuUsuario.set(false));
  }

  toggleMenuUsuario(): void {
    this.mostrarMenuUsuario.set(!this.mostrarMenuUsuario());
  }

  cerrarMenuUsuario(): void {
    this.mostrarMenuUsuario.set(false);
  }

  logout(): void {
    this.auth.logout();
  }
}
