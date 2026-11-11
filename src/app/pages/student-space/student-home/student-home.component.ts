import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faBuilding,
  faIdCard,
  faInbox,
  faPaperPlane,
  faUserPen,
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../../core/services/auth.service';
import { JoinRequestService } from '../../../core/services/join-request.service';
import { OrganizationContextService } from '../../../core/services/organization-context.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { OrganizationStudentsService } from '../../../core/services/organization-students.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { APP_ROUTES } from '../../../core/services/home-route.service';
import { ToastService } from '../../../shared/services/toast.service';
import { JoinRequest } from '../../../shared/interfaces/join-request.interface';
import {
  DANCE_ROLE_LABELS,
  ORGANIZATION_STUDENT_STATUS_LABELS,
  OrganizationStudent,
  organizationStudentFullName,
} from '../../../shared/interfaces/organization-student.interface';
import { JoinRequestListComponent } from '../../../shared/components/join-request-list/join-request-list.component';
import { StateMessageComponent } from '../../../shared/components/state-message/state-message.component';
import { DateLabelPipe } from '../../../shared/pipes/date-label.pipe';
import { errorMessage } from '../../../shared/utils/supabase-error.util';
import {
  JoinOrganizationFormComponent,
  JoinOrganizationFormValue,
} from '../join-organization-form/join-organization-form.component';

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

  readonly records = signal<OrganizationStudent[]>([]);
  readonly requests = signal<JoinRequest[]>([]);
  readonly organizationNames = signal<Record<string, string>>({});
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
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
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const userId = await this.auth.getCurrentUserId();
      if (!userId) return;
      const [records, requests] = await Promise.all([
        this.studentsService.listLinkedToUser(userId),
        this.joinRequests.listMine(userId),
      ]);
      this.records.set(records);
      this.requests.set(requests);
      await this.loadOrganizationNames([
        ...records.map((record) => record.organizationId),
        ...requests.map((request) => request.organizationId),
      ]);
    } catch (error) {
      this.error.set(errorMessage(error, 'No se ha podido cargar tu espacio.'));
    } finally {
      this.loading.set(false);
    }
  }

  async requestJoin(value: JoinOrganizationFormValue): Promise<void> {
    this.sending.set(true);
    try {
      await this.joinRequests.requestJoin(value.slug, value.message);
      this.toast.success('Solicitud enviada. Te avisaremos cuando la academia la revise.');
      this.resetToken.update((token) => token + 1);
      await this.load();
    } catch (error) {
      this.toast.error(errorMessage(error));
    } finally {
      this.sending.set(false);
    }
  }

  organizationName(organizationId: string): string {
    return this.organizationNames()[organizationId] ?? 'Academia';
  }

  /**
   * RLS puede no permitir a un alumno leer los datos de la academia: se muestran solo
   * los nombres que el backend devuelva, sin inventar información.
   */
  private async loadOrganizationNames(ids: string[]): Promise<void> {
    try {
      const organizations = await this.organizations.getOrganizationsByIds(ids);
      this.organizationNames.set(
        Object.fromEntries(organizations.map((organization) => [organization.id, organization.name])),
      );
    } catch {
      this.organizationNames.set({});
    }
  }
}
