import { Component, inject, computed } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { SidebarNavigationComponent } from './shared/components/sidebar-navigation/sidebar-navigation.component';
import { BottomNavigationComponent } from './shared/components/bottom-navigation/bottom-navigation.component';
import { SidebarService } from './features/core/services/sidebar.service';

const PUBLIC_ROUTES = ['/consulta/'];

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    SidebarNavigationComponent,
    BottomNavigationComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private sidebarService = inject(SidebarService);
  private router = inject(Router);

  title = 'cobros-app';

  sidebarState = this.sidebarService.getState();

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url)
    )
  );

  isPublicRoute = computed(() =>
    PUBLIC_ROUTES.some(p => (this.currentUrl() ?? '').startsWith(p))
  );
}
