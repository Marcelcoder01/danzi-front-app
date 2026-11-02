import { Component, Input } from '@angular/core';
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

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FontAwesomeModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  @Input() isCollapsed = false;

  faGauge = faGauge;
  faUsers = faUsers;
  faMusic = faMusic;
  faCalendar = faCalendar;
  faSquareCheck = faSquareCheck;
  faCreditCard = faCreditCard;
  faShieldHalved = faShieldHalved;
  faGear = faGear;
  faRightFromBracket = faRightFromBracket;

  constructor(
    private router: Router,
    // private authService: AuthService
  ) {}

  logout(): void {
    // this.authService.signOut().subscribe(() => {
    //   this.router.navigate(['/login']);
    // });
  }
}
