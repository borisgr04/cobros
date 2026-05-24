import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService } from '../../../features/core/services/sidebar.service';
import { AuthService } from '../../../features/auth/services/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar-navigation.component.html',
  styleUrl: './sidebar-navigation.component.scss'
})
export class SidebarNavigationComponent {
  private sidebarService = inject(SidebarService);
  auth = inject(AuthService);
  user = this.auth.currentUser;

  sidebarState = this.sidebarService.getState();

  navItems: NavItem[] = [
    { path: '/', label: 'Inicio', icon: 'bi-house-fill' },
    { path: '/clientes', label: 'Clientes', icon: 'bi-people-fill' },
    { path: '/zonas', label: 'Zonas', icon: 'bi-geo-alt-fill' },
    { path: '/reportes', label: 'Reportes', icon: 'bi-file-earmark-bar-graph-fill' },
    { path: '/dashboard', label: 'Tablero', icon: 'bi-grid-1x2-fill' },
    { path: '/usuarios', label: 'Usuarios', icon: 'bi-person-gear' }
  ];

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  logout(): void {
    this.auth.logout();
  }
}
