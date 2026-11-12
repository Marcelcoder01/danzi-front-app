import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faBuilding,
  faIdCard,
  faInbox,
  faPaperPlane,
  faUserPen,
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '@core/services/auth.service';
import { JoinRequestService } from '@domain/join-requests/services/join-request.service';
import { OrganizationContextService } from '@domain/organizations/services/organization-context.service';
import { OrganizationService } from '@domain/organizations/services/organization.service';
import { OrganizationStudentsService } from '@domain/organization-students/services/organization-students.service';
import { UserProfileService } from '@domain/profile/services/user-profile.service';
import { APP_ROUTES } from '@core/routing/app-routes';
import { ToastService } from '@shared/services/toast.service';
import { JoinRequest } from '@domain/join-requests/models/join-request.model';
import {
  DANCE_ROLE_LABELS,
  ORGANIZATION_STUDENT_STATUS_LABELS,
  OrganizationStudent,
  organizationStudentFullName,
} from '@domain/organization-students/models/organization-student.model';
import { JoinRequestListComponent } from '@shared/components/join-request-list/join-request-list.component';
import { StateMessageComponent } from '@shared/components/state-message/state-message.component';
import { DateLabelPipe } from '@shared/pipes/date-label.pipe';
import { errorMessage } from '@core/supabase/supabase-error';
import { asyncResource } from '@shared/utils/async-resource';
import {
  JoinOrganizationFormComponent,
  JoinOrganizationFormValue,
} from '../join-organization-form/join-organization-form.component';

interface StudentSpaceData {
  records: OrganizationStudent[];
  requests: JoinRequest[];
  organizationNames: Record<string, string>;
}

const EMPTY_SPACE: StudentSpaceData = { records: [], requests: [], organizationNames: {} };

/** Danzi Students: fichas vinculadas, solicitudes y alta en academias. */
@Component({
  selector: 'app-student-home',
  standalone: true,
  imports: [
    RouterLink,
    FaIconComponent,
    JoinRequestListComponent,
    JoinOrganizationFormComponent,
    StateMessageComponent,
    DateLabelPipe,
  ],
  templateUrl: './student-home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentHomeComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly studentsService = inject(OrganizationStudentsService);
  private readonly joinRequests = inject(JoinRequestService);
  private readonly organizations = inject(OrganizationService);
  private readonly toast = inject(ToastService);
  readonly profile = inject(UserProfileService);
  readonly context = inject(OrganizationContextService);

  readonly routes = APP_ROUTES;
  readonly faBuilding = faBuilding;
  readonly faIdCard = faIdCard;
  readonly faInbox = faInbox;
  readonly faPaperPlane = faPaperPlane;
  readonly faUserPen = faUserPen;
  readonly danceRoleLabels = DANCE_ROLE_LABELS;
  readonly statusLabels = ORGANIZATION_STUDENT_STATUS_LABELS;
  readonly fullName = organizationStudentFullName;

  private readonly spaceResource = asyncResource({
    params: () => this.auth.currentUser()?.id,
    loader: ({ params }) => this.fetchSpace(params),
    defaultValue: EMPTY_SPACE,
  });

  readonly records = computed(() => this.spaceResource.value().records);
  readonly requests = computed(() => this.spaceResource.value().requests);
  readonly organizationNames = computed(() => this.spaceResource.value().organizationNames);
  readonly loading = this.spaceResource.isLoading;
  readonly error = computed(() =>
    this.spaceResource.hasError()
      ? errorMessage(this.spaceResource.error(), 'No se ha podido cargar tu espacio.')
      : null,
  );
  readonly sending = signal(false);
  readonly resetToken = signal(0);

  readonly isNewcomer = computed(
    () => !this.loading() && !this.records().length && !this.requests().length,
  );
  readonly profileIncomplete = computed(() => {
    const profile = this.profile.profile();
    return !!profile && (!profile.firstName || !profile.lastName);
  });

  ngOnInit(): void {
    this.profile.load().catch(() => undefined);
  }

  load(): void {
    this.spaceResource.reload();
  }

  async requestJoin(value: JoinOrganizationFormValue): Promise<void> {
    this.sending.set(true);
    try {
      await this.joinRequests.requestJoin(value.slug, value.message);
      this.toast.success('Solicitud enviada. Te avisaremos cuando la academia la revise.');
      this.resetToken.update((token) => token + 1);
      this.load();
    } catch (error) {
      this.toast.error(errorMessage(error));
    } finally {
      this.sending.set(false);
    }
  }

  organizationName(organizationId: string): string {
    return this.organizationNames()[organizationId] ?? 'Academia';
  }

  private async fetchSpace(userId: string): Promise<StudentSpaceData> {
    const [records, requests] = await Promise.all([
      this.studentsService.listLinkedToUser(userId),
      this.joinRequests.listMine(userId),
    ]);
    const organizationNames = await this.fetchOrganizationNames([
      ...records.map((record) => record.organizationId),
      ...requests.map((request) => request.organizationId),
    ]);
    return { records, requests, organizationNames };
  }

  /**
   * RLS puede no permitir a un alumno leer los datos de la academia: se muestran solo
   * los nombres que el backend devuelva, sin inventar información.
   */
  private async fetchOrganizationNames(ids: string[]): Promise<Record<string, string>> {
    try {
      const organizations = await this.organizations.getOrganizationsByIds(ids);
      return Object.fromEntries(
        organizations.map((organization) => [organization.id, organization.name]),
      );
    } catch {
      return {};
    }
  }
}
