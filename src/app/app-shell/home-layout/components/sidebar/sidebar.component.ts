import { Component, Input, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
  faInbox,
} from '@fortawesome/free-solid-svg-icons';
import { SessionService } from '../../../services/session.service';
import { OrganizationContextService } from '@domain/organizations/services/organization-context.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FontAwesomeModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  @Input() isCollapsed = false;

  private readonly session = inject(SessionService);
  readonly context = inject(OrganizationContextService);

  faGauge = faGauge;
  faUsers = faUsers;
  faMusic = faMusic;
  faCalendar = faCalendar;
  faSquareCheck = faSquareCheck;
  faCreditCard = faCreditCard;
  faShieldHalved = faShieldHalved;
  faGear = faGear;
  faRightFromBracket = faRightFromBracket;
  faInbox = faInbox;

  logout(): Promise<void> {
    return this.session.signOut();
  }
}
