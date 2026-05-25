import { Routes } from '@angular/router';
import { authGuard } from './features/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/components/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/components/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'clientes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/clientes/components/clientes.component').then(m => m.ClientesComponent)
  },
  {
    path: 'clientes/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/clientes/components/cliente-detalle/cliente-detalle.component').then(m => m.ClienteDetalleComponent)
  },
  {
    path: 'prestamos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/prestamos/components/prestamos.component').then(m => m.PrestamosComponent)
  },
  {
    path: 'prestamos/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/prestamos/components/prestamo-detalle.component').then(m => m.PrestamoDetalleComponent)
  },
  {
    path: 'zonas',
    canActivate: [authGuard],
    loadComponent: () => import('./features/zonas/components/zonas.component').then(m => m.ZonasComponent)
  },
  {
    path: 'reportes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/reportes/components/reportes.component').then(m => m.ReportesComponent)
  },
  {
    path: 'usuarios',
    canActivate: [authGuard],
    loadComponent: () => import('./features/usuarios/components/usuarios.component').then(m => m.UsuariosComponent)
  },
  {
    path: 'consulta/:llave',
    loadComponent: () => import('./features/consulta-publica/consulta-publica.component').then(m => m.ConsultaPublicaComponent)
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/perfil/perfil.component').then(m => m.PerfilComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
