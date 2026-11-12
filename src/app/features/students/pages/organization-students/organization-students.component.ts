import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faFilter,
  faInbox,
  faLink,
  faPlus,
  faSearch,
  faUserGroup,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { OrganizationContextService } from '../../../organizations/services/organization-context.service';
import { OrganizationStudentsService } from '../../services/organization-students.service';
import { JoinRequestService } from '../../../join-requests/services/join-request.service';
import { ToastService } from '../../../../shared/services/toast.service';
import {
  DANCE_ROLES,
  DANCE_ROLE_LABELS,
  DanceRole,
  ORGANIZATION_STUDENT_STATUSES,
  ORGANIZATION_STUDENT_STATUS_LABELS,
  OrganizationStudent,
  OrganizationStudentStatus,
  organizationStudentFullName,
} from '../../models/organization-student.model';
import { initialsOf } from '../../../../shared/utils/text.util';
import { StateMessageComponent } from '../../../../shared/components/state-message/state-message.component';
import { DateLabelPipe } from '../../../../shared/pipes/date-label.pipe';
import { errorMessage } from '../../../../core/supabase/supabase-error';
import { asyncResource } from '../../../../shared/utils/async-resource';
import {
  CreateStudentDialogComponent,
  CreateStudentFormValue,
} from '../../components/create-student-dialog/create-student-dialog.component';

const STATUS_CLASSES: Record<OrganizationStudentStatus, string> = {
  active: 'badge-success',
  inactive: 'badge-warning',
  pending: 'badge-info',
};

/** Alumnos de la academia activa, persistidos en Supabase. Solo lectura y alta manual. */
@Component({
  selector: 'app-organization-students',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    FaIconComponent,
    StateMessageComponent,
    DateLabelPipe,
    CreateStudentDialogComponent,
  ],
  templateUrl: './organization-students.component.html',
  styleUrl: './organization-students.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationStudentsComponent {
  @ViewChild(CreateStudentDialogComponent) private createDialog?: CreateStudentDialogComponent;

  private readonly studentsService = inject(OrganizationStudentsService);
  private readonly joinRequests = inject(JoinRequestService);
  private readonly toast = inject(ToastService);
  readonly context = inject(OrganizationContextService);

  readonly faPlus = faPlus;
  readonly faSearch = faSearch;
  readonly faFilter = faFilter;
  readonly faXmark = faXmark;
  readonly faLink = faLink;
  readonly faInbox = faInbox;
  readonly faUserGroup = faUserGroup;
  readonly danceRoles = DANCE_ROLES;
  readonly danceRoleLabels = DANCE_ROLE_LABELS;
  readonly statuses = ORGANIZATION_STUDENT_STATUSES;
  readonly statusLabels = ORGANIZATION_STUDENT_STATUS_LABELS;
  readonly statusClasses = STATUS_CLASSES;
  readonly fullName = organizationStudentFullName;

  private readonly studentsResource = asyncResource({
    params: () => this.context.activeOrganizationId() ?? undefined,
    loader: ({ params }) => this.studentsService.listByOrganization(params),
    defaultValue: [] as OrganizationStudent[],
  });
  private readonly pendingRequestsResource = asyncResource({
    params: () => this.context.activeOrganizationId() ?? undefined,
    loader: ({ params }) => this.joinRequests.countPending(params).catch(() => 0),
    defaultValue: 0,
  });

  readonly students = this.studentsResource.value;
  readonly loading = this.studentsResource.isLoading;
  readonly error = computed(() =>
    this.studentsResource.hasError()
      ? errorMessage(this.studentsResource.error(), 'No se han podido cargar los alumnos.')
      : null,
  );
  readonly pendingRequests = this.pendingRequestsResource.value;
  readonly saving = signal(false);
  readonly isFiltersVisible = signal(false);
  readonly searchTerm = signal('');
  readonly filterStatus = signal<OrganizationStudentStatus | ''>('');
  readonly filterRole = signal<DanceRole | ''>('');

  readonly filteredStudents = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const status = this.filterStatus();
    const role = this.filterRole();
    return this.students().filter(
      (student) =>
        (!search ||
          `${this.fullName(student)} ${student.email ?? ''}`.toLowerCase().includes(search)) &&
        (!status || student.status === status) &&
        (!role || student.danceRole === role),
    );
  });

  load(): void {
    this.studentsResource.reload();
    this.pendingRequestsResource.reload();
  }

  openCreateDialog(): void {
    this.createDialog?.open();
  }

  async createStudent(value: CreateStudentFormValue): Promise<void> {
    const organizationId = this.context.activeOrganizationId();
    if (!organizationId) return;
    this.saving.set(true);
    try {
      await this.studentsService.create({ organizationId, ...value });
      this.createDialog?.close();
      this.toast.success(`Alumno ${value.firstName} creado correctamente.`);
      this.clearFilters();
      this.load();
    } catch (error) {
      this.toast.error(errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  toggleFilters(): void {
    this.isFiltersVisible.update((visible) => !visible);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.filterStatus.set('');
    this.filterRole.set('');
  }

  initials(student: OrganizationStudent): string {
    return initialsOf(this.fullName(student));
  }
}
