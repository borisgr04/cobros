import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../features/auth/services/auth.service';

@Component({
  selector: 'app-top-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-header.component.html',
  styleUrl: './top-header.component.scss'
})
export class TopHeaderComponent {
  @Input() title: string = '';
  notificationCount = 0;

  auth = inject(AuthService);
  user = this.auth.currentUser;

  logout(): void {
    this.auth.logout();
  }
}
