import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarNavigationComponent } from './shared/components/sidebar-navigation/sidebar-navigation.component';
import { BottomNavigationComponent } from './shared/components/bottom-navigation/bottom-navigation.component';
import { SidebarService } from './features/core/services/sidebar.service';

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
  
  title = 'cobros-app';
  
  // Estado del sidebar
  sidebarState = this.sidebarService.getState();
}
