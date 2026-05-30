import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/services/auth.service';
import { BiometricRegistrationComponent } from '../auth/biometric-registration/biometric-registration.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, BiometricRegistrationComponent],
  templateUrl: './perfil.component.html'
})
export class PerfilComponent {
  private auth = inject(AuthService);
  readonly user = this.auth.currentUser;
}
