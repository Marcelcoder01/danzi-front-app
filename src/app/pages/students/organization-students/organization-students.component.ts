import { Component, ViewChild, computed, effect, inject, signal, untracked } from '@angular/core';
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
import { OrganizationContextService } from '../../../core/services/organization-context.service';
import { OrganizationStudentsService } from '../../../core/services/organization-students.service';
import { JoinRequestService } from '../../../core/services/join-request.service';
import { ToastService } from '../../../shared/services/toast.service';
import {
  DANCE_ROLES,
  DANCE_ROLE_LABELS,
  DanceRole,
  ORGANIZATION_STUDENT_STATUSES,
  ORGANIZATION_STUDENT_STATUS_LABELS,
  OrganizationStudent,
  OrganizationStudentStatus,
  organizationStudentFullName,
} from '../../../shared/interfaces/organization-student.interface';
import { initialsOf } from '../../../shared/interfaces/user.interface';
import { StateMessageComponent } from '../../../shared/components/state-message/state-message.component';
import { DateLabelPipe } from '../../../shared/pipes/date-label.pipe';
import { errorMessage } from '../../../shared/utils/supabase-error.util';
import {
  CreateStudentDialogComponent,
  CreateStudentFormValue,
} from '../create-student-dialog/create-student-dialog.component';

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
  styleUrl: '../students.component.css',
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

  readonly students = signal<OrganizationStudent[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly pendingRequests = signal(0);
  readonly isFiltersVisible = signal(false);
  readonly searchTerm = signal('');
  readonly filterStatus = signal<OrganizationStudentStatus | ''>('');
  readonly filterRole = signal<DanceRole | ''>('');
  private loadToken = 0;

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

  constructor() {
    effect(() => {
      const organizationId = this.context.activeOrganizationId();
      untracked(() => this.load(organizationId));
    });
  }

  async load(organizationId = this.context.activeOrganizationId()): Promise<void> {
    const token = ++this.loadToken;
    this.students.set([]);
    this.pendingRequests.set(0);
    this.error.set(null);
    if (!organizationId) return;

    this.loading.set(true);
    try {
      const [students, pending] = await Promise.all([
        this.studentsService.listByOrganization(organizationId),
        this.joinRequests.countPending(organizationId).catch(() => 0),
      ]);
      if (token !== this.loadToken) return;
      this.students.set(students);
      this.pendingRequests.set(pending);
    } catch (error) {
      if (token === this.loadToken) {
        this.error.set(errorMessage(error, 'No se han podido cargar los alumnos.'));
      }
    } finally {
      if (token === this.loadToken) this.loading.set(false);
    }
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
      await this.load(organizationId);
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
