import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
  // Items de navegación (mismos que sidebar)
  navItems: NavItem[] = [
    { path: '/', label: 'Inicio', icon: 'bi-house-fill' },
    { path: '/prestamos', label: 'Préstamos', icon: 'bi-cash-coin' },
    { path: '/clientes', label: 'Clientes', icon: 'bi-people-fill' },
    { path: '/zonas', label: 'Zonas', icon: 'bi-geo-alt-fill' },
    { path: '/reportes', label: 'Reportes', icon: 'bi-file-earmark-bar-graph-fill' },
    { path: '/dashboard', label: 'Tablero', icon: 'bi-grid-1x2-fill' }
  ];
}
