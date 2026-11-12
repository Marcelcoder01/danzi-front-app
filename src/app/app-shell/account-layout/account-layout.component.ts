import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBuilding, faHouse, faRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons';
import { OrganizationContextService } from '../../features/organizations/services/organization-context.service';
import { SessionService } from '../services/session.service';
import { UserProfileService } from '../../features/profile/services/user-profile.service';
import { APP_ROUTES } from '../../core/routing/app-routes';
import { initialsOf } from '../../shared/utils/text.util';

/** Layout de la experiencia personal (Danzi Students, perfil, onboarding y selector). */
@Component({
  selector: 'app-account-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FaIconComponent],
  templateUrl: './account-layout.component.html',
})
export class AccountLayoutComponent implements OnInit {
  private readonly session = inject(SessionService);
  readonly profile = inject(UserProfileService);
  readonly context = inject(OrganizationContextService);

  readonly routes = APP_ROUTES;
  readonly initialsOf = initialsOf;
  readonly faHouse = faHouse;
  readonly faUser = faUser;
  readonly faBuilding = faBuilding;
  readonly faRightFromBracket = faRightFromBracket;

  ngOnInit(): void {
    this.profile.load().catch(() => undefined);
    this.context.ensureLoaded().catch(() => undefined);
  }

  logout(): Promise<void> {
    return this.session.signOut();
  }
}
