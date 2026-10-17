import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCalendarDays,
  faClock,
  faEllipsis,
  faFilter,
  faMusic,
  faPlus,
  faSearch,
  faUsers,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { ClassActivity } from '../../shared/interfaces/class-activity.interface';
import { StudentLevel, getLevelLabel } from '../../shared/interfaces/student-level.enum';
import { AcademyDataService } from '../../shared/services/academy-data.service';
@Component({
  selector: 'app-classes',
  standalone: true,
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.css',
  imports: [CommonModule, FormsModule, FaIconComponent],
})
export class ClassesComponent {
  private readonly academyData = inject(AcademyDataService);
  faCalendarDays = faCalendarDays;
  faClock = faClock;
  faEllipsis = faEllipsis;
  faFilter = faFilter;
  faMusic = faMusic;
  faPlus = faPlus;
  faSearch = faSearch;
  faUsers = faUsers;
  faXmark = faXmark;

  readonly isFiltersVisible = signal(false);
  readonly searchTerm = signal('');
  readonly filterType = signal('');
  readonly filterLevel = signal('');
  readonly filterStatus = signal('active');

  readonly allActivities = computed(() => this.academyData.classes);
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

  toggleFilters(): void {
    this.isFiltersVisible.update((open) => !open);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.filterType.set('');
    this.filterLevel.set('');
    this.filterStatus.set('');
  }

  getOccupancy(activity: ClassActivity): number {
    return Math.round((this.getEnrollmentCount(activity) / activity.capacity) * 100);
  }

  getEnrollmentCount(activity: ClassActivity): number {
    return this.academyData.enrollmentCount(activity.id);
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
