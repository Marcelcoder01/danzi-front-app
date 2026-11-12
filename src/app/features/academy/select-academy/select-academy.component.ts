import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBuilding, faCheck, faChevronRight, faPlus } from '@fortawesome/free-solid-svg-icons';
import { OrganizationContextService } from '@domain/organizations/services/organization-context.service';
import { APP_ROUTES } from '@core/routing/app-routes';
import {
  ORGANIZATION_ROLE_LABELS,
  ORGANIZATION_TYPE_LABELS,
} from '@domain/organizations/models/organization.model';
import { StateMessageComponent } from '@shared/components/state-message/state-message.component';
import { errorMessage } from '@core/supabase/supabase-error';

/** Selector de academia para usuarios con relación en varias organizaciones. */
@Component({
  selector: 'app-select-academy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FaIconComponent, StateMessageComponent],
  templateUrl: './select-academy.component.html',
})
export class SelectAcademyComponent implements OnInit {
  readonly context = inject(OrganizationContextService);
  private readonly router = inject(Router);

  readonly routes = APP_ROUTES;
  readonly roleLabels = ORGANIZATION_ROLE_LABELS;
  readonly typeLabels = ORGANIZATION_TYPE_LABELS;
  readonly faBuilding = faBuilding;
  readonly faCheck = faCheck;
  readonly faChevronRight = faChevronRight;
  readonly faPlus = faPlus;

  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.reload();
  }

  async reload(): Promise<void> {
    this.error.set(null);
    try {
      await this.context.ensureLoaded(true);
    } catch (error) {
      this.error.set(errorMessage(error, 'No se han podido cargar tus academias.'));
    }
  }

  async choose(organizationId: string): Promise<void> {
    if (this.context.select(organizationId)) {
      await this.router.navigateByUrl(APP_ROUTES.academy);
    }
  }
}
