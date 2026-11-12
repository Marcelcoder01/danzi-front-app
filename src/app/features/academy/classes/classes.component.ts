import { AfterViewInit, Component, computed, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCalendarDays,
  faClock,
  faCrown,
  faEdit,
  faEllipsis,
  faFilter,
  faMusic,
  faPersonWalking,
  faPlus,
  faSearch,
  faUsers,
  faTrash,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import {
  ClassActivity,
  RegularClassActivity,
} from '@shared/interfaces/class-activity.interface';
import { StudentLevel, getLevelLabel } from '@shared/interfaces/student-level.enum';
import { AcademyDataService } from '@shared/services/academy-data.service';
import { ToastService } from '@shared/services/toast.service';
import { ClassDialogComponent } from './class-dialog/class-dialog.component';
import { ParticipantsDialogComponent } from './participants-dialog/participants-dialog.component';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';

import { LegacyNoticeComponent } from '@shared/components/legacy-notice/legacy-notice.component';

@Component({
  selector: 'app-classes',
  standalone: true,
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.css',
  imports: [
    LegacyNoticeComponent,
    CommonModule,
    FormsModule,
    FaIconComponent,
    ClassDialogComponent,
    ParticipantsDialogComponent,
    ConfirmationDialogComponent,
  ],
})
export class ClassesComponent implements AfterViewInit {
  @ViewChild(ClassDialogComponent) private classDialog?: ClassDialogComponent;
  @ViewChild(ParticipantsDialogComponent) private participantsDialog?: ParticipantsDialogComponent;
  @ViewChild(ConfirmationDialogComponent) private confirmationDialog?: ConfirmationDialogComponent;

  private readonly academyData = inject(AcademyDataService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  faCalendarDays = faCalendarDays;
  faClock = faClock;
  faCrown = faCrown;
  faEdit = faEdit;
  faEllipsis = faEllipsis;
  faFilter = faFilter;
  faMusic = faMusic;
  faPersonWalking = faPersonWalking;
  faPlus = faPlus;
  faSearch = faSearch;
  faUsers = faUsers;
  faTrash = faTrash;
  faXmark = faXmark;

  readonly isFiltersVisible = signal(false);
  readonly searchTerm = signal('');
  readonly filterType = signal('');
  readonly filterLevel = signal('');
  readonly filterStatus = signal('active');
  private pendingDelete: ClassActivity | null = null;

  readonly allActivities = computed(() => {
    this.academyData.classesVersion();
    this.academyData.enrollmentsVersion();
    return [...this.academyData.classes];
  });
  readonly regularClassCount = computed(
    () => this.allActivities().filter((activity) => activity.type === 'class').length,
  );
  readonly eventCount = computed(
    () => this.allActivities().filter((activity) => activity.type === 'event').length,
  );

  readonly activities = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();

    return this.allActivities().filter((activity) => {
      const matchesSearch =
        !search ||
        [
          activity.name,
          activity.teacher,
          activity.room,
          activity.level,
          this.scheduleLabel(activity),
        ].some((value) => value.toLowerCase().includes(search));
      const matchesType = !this.filterType() || activity.type === this.filterType();
      const matchesLevel = !this.filterLevel() || activity.level.startsWith(this.filterLevel());
      const matchesStatus = !this.filterStatus() || activity.status === this.filterStatus();

      return matchesSearch && matchesType && matchesLevel && matchesStatus;
    });
  });

  ngAfterViewInit(): void {
    if (this.route.snapshot.queryParamMap.get('createClass') !== 'true') return;
    this.openActivityDialog();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { createClass: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  toggleFilters(): void {
    this.isFiltersVisible.update((open) => !open);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.filterType.set('');
    this.filterLevel.set('');
    this.filterStatus.set('');
  }

  openActivityDialog(): void {
    this.classDialog?.openForCreate();
  }

  editClass(activity: ClassActivity): void {
    if (activity.type === 'class') this.classDialog?.openForEdit(activity);
  }

  openParticipants(activity: ClassActivity): void {
    if (activity.type === 'class') this.participantsDialog?.openFor(activity);
  }

  createClass(activity: Omit<RegularClassActivity, 'id'>): void {
    try {
      this.academyData.addClass({
        ...activity,
        id: `class-${globalThis.crypto.randomUUID()}`,
      });
      this.searchTerm.set('');
      this.filterType.set('class');
      this.filterLevel.set('');
      this.filterStatus.set(activity.status);
      this.toastService.success(`Clase «${activity.name}» creada correctamente.`);
    } catch {
      this.toastService.error('No se pudo crear la clase. Inténtalo de nuevo.');
    }
  }

  updateClass(activity: RegularClassActivity): void {
    if (!this.academyData.updateClass(activity)) {
      this.toastService.error('No se pudo actualizar la clase. Inténtalo de nuevo.');
      return;
    }

    this.searchTerm.set('');
    this.filterType.set('class');
    this.filterLevel.set('');
    this.filterStatus.set(activity.status);
    this.toastService.success(`Clase «${activity.name}» actualizada correctamente.`);
  }

  deleteClass(activity: ClassActivity): void {
    if (activity.type !== 'class') return;
    this.pendingDelete = activity;
    this.confirmationDialog?.open({
      title: '¿Eliminar esta clase?',
      message: `Vas a eliminar «${activity.name}». Esta acción no se puede deshacer.`,
      confirmLabel: 'Sí, eliminar',
    });
  }

  confirmDeleteClass(): void {
    const activity = this.pendingDelete;
    this.pendingDelete = null;
    if (!activity || activity.type !== 'class') return;

    if (!this.academyData.removeClass(activity.id)) {
      this.toastService.error('No se pudo eliminar la clase. Inténtalo de nuevo.');
      return;
    }

    this.toastService.success(`Clase «${activity.name}» eliminada correctamente.`);
  }

  getOccupancy(activity: ClassActivity): number {
    return Math.round((this.getEnrollmentCount(activity) / activity.capacity) * 100);
  }

  getEnrollmentCount(activity: ClassActivity): number {
    return this.academyData.enrollmentCount(activity.id);
  }

  getLeaderCount(activity: ClassActivity): number {
    return this.academyData.studentsForClass(activity.id).filter((s) => s.role === 'leader').length;
  }

  getFollowerCount(activity: ClassActivity): number {
    return this.academyData.studentsForClass(activity.id).filter((s) => s.role === 'follower')
      .length;
  }

  getMixedCount(activity: ClassActivity): number {
    return this.academyData.studentsForClass(activity.id).filter((s) => s.role === 'mixed').length;
  }

  getAvailabilityLabel(activity: ClassActivity): string {
    const remaining = activity.capacity - this.getEnrollmentCount(activity);
    if (activity.status === 'draft') return 'Sin publicar';
    if (remaining === 0) return 'Completa';
    if (remaining <= 3) return `${remaining} plazas`;
    return `${remaining} plazas libres`;
  }

  getAvailabilityClass(activity: ClassActivity): string {
    if (activity.status === 'draft') return 'badge-draft';
    if (this.getEnrollmentCount(activity) === activity.capacity) return 'badge-full';
    if (activity.capacity - this.getEnrollmentCount(activity) <= 3) return 'badge-limited';
    return 'badge-open';
  }

  getAvailabilityColor(activity: ClassActivity): string {
    if (activity.status === 'draft') return 'var(--color-text-muted)';
    if (this.getEnrollmentCount(activity) === activity.capacity) return 'var(--color-error-dark)';
    if (activity.capacity - this.getEnrollmentCount(activity) <= 3)
      return 'var(--color-warning-dark)';
    return 'var(--color-success-dark)';
  }

  getLevelLabel(level: StudentLevel | string): string {
    if (Object.values(StudentLevel).includes(level as StudentLevel)) {
      return getLevelLabel(level as StudentLevel);
    }
    return level;
  }

  scheduleLabel(activity: ClassActivity): string {
    if (activity.type === 'event') {
      const date = new Date(`${activity.schedule.date}T12:00:00`);
      const dateLabel = new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short',
      }).format(date);
      return `${dateLabel} · ${activity.schedule.startTime}–${activity.schedule.endTime}`;
    }
    const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const days = activity.schedule.weekdays.map((day) => weekdays[day]).join(' y ');
    return `${days} · ${activity.schedule.startTime}–${activity.schedule.endTime}`;
  }

  nextDateLabel(activity: ClassActivity): string {
    if (activity.type === 'event') {
      const date = new Date(`${activity.schedule.date}T12:00:00`);
      const label = new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short',
      }).format(date);
      return `${label}, ${activity.schedule.startTime}`;
    }

    const now = new Date();
    const [hours, minutes] = activity.schedule.startTime.split(':').map(Number);
    const todayAtClassTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
    );
    const daysAhead = Math.min(
      ...activity.schedule.weekdays.map((day) => (day - now.getDay() + 7) % 7),
    );
    const next = new Date(todayAtClassTime);
    next.setDate(next.getDate() + (daysAhead === 0 && todayAtClassTime < now ? 7 : daysAhead));
    const label = new Intl.DateTimeFormat('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(next);
    return `${label}, ${activity.schedule.startTime}`;
  }
}
