import { Component, Input, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import {
  faGauge,
  faUsers,
  faMusic,
  faCalendar,
  faSquareCheck,
  faCreditCard,
  faShieldHalved,
  faGear,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import { ToastService } from '../../../../services/toast.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FontAwesomeModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  @Input() isCollapsed = false;

  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  faGauge = faGauge;
  faUsers = faUsers;
  faMusic = faMusic;
  faCalendar = faCalendar;
  faSquareCheck = faSquareCheck;
  faCreditCard = faCreditCard;
  faShieldHalved = faShieldHalved;
  faGear = faGear;
  faRightFromBracket = faRightFromBracket;

  async logout(): Promise<void> {
    try {
      await this.authService.signOut();
      this.toastService.info('Has cerrado sesión correctamente.');
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      this.toastService.error('No se ha podido cerrar la sesión.');
    }
  }
}
