import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBuilding, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { CreateOrganizationFormComponent } from './create-organization-form/create-organization-form.component';
import { OrganizationService } from '@domain/organizations/services/organization.service';
import { OrganizationContextService } from '@domain/organizations/services/organization-context.service';
import { DanceStyleService } from '@domain/organizations/services/dance-style.service';
import { UserProfileService } from '@domain/profile/services/user-profile.service';
import { APP_ROUTES } from '@core/routing/app-routes';
import { ToastService } from '@shared/services/toast.service';
import { CreateOrganizationInput } from '@domain/organizations/models/organization.model';
import { DanceStyle } from '@domain/organizations/models/dance-style.model';
import { errorMessage } from '@core/supabase/supabase-error';

/** Primera experiencia: registrar una academia o ir a Danzi Students. */
@Component({
  selector: 'app-onboarding',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FaIconComponent, CreateOrganizationFormComponent],
  templateUrl: './onboarding.component.html',
})
export class OnboardingComponent implements OnInit {
  private readonly organizations = inject(OrganizationService);
  private readonly context = inject(OrganizationContextService);
  private readonly danceStyleService = inject(DanceStyleService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly profile = inject(UserProfileService);

  readonly routes = APP_ROUTES;
  readonly faBuilding = faBuilding;
  readonly faGraduationCap = faGraduationCap;

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly danceStyles = signal<DanceStyle[]>([]);

  ngOnInit(): void {
    this.danceStyleService
      .getCatalog()
      .then((styles) => this.danceStyles.set(styles))
      .catch(() => this.danceStyles.set([]));
  }

  async createOrganization(input: CreateOrganizationInput): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      const organizationId = await this.organizations.createOrganization(input);
      await this.context.ensureLoaded(true);
      this.context.select(organizationId);
      this.toast.success(`¡${input.name} se ha creado! Ya eres su propietario.`);
      await this.router.navigateByUrl(APP_ROUTES.academy);
    } catch (error) {
      const message = errorMessage(error);
      this.error.set(message);
      this.toast.error(message);
    } finally {
      this.saving.set(false);
    }
  }
}
