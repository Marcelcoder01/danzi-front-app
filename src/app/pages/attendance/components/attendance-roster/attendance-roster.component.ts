import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCheck, faRotate, faSearch, faXmark } from '@fortawesome/free-solid-svg-icons';
import {
  AttendanceStatus,
  AttendanceStudent,
  ATTENDANCE_LABELS,
} from '../../interfaces/attendance.interface';

@Component({
  selector: 'app-attendance-roster',
  standalone: true,
  imports: [FaIconComponent],
  templateUrl: './attendance-roster.component.html',
  styleUrl: './attendance-roster.component.css',
})
export class AttendanceRosterComponent {
  @Input({ required: true }) roster!: AttendanceStudent[];
  @Input({ required: true }) statusByStudent!: Record<string, AttendanceStatus>;
  @Input() pendingVisibleCount = 0;
  @Input() future = false;
  @Output() mark = new EventEmitter<{ student: AttendanceStudent; status: AttendanceStatus }>();
  @Output() detail = new EventEmitter<AttendanceStudent>();
  @Output() markPending = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
  readonly statusLabels = ATTENDANCE_LABELS;
  readonly quickStatuses: ('present' | 'recovered' | 'absent')[] = [
    'present',
    'recovered',
    'absent',
  ];
  readonly icons = { present: faCheck, recovered: faRotate, absent: faXmark, search: faSearch };
  fullName(student: AttendanceStudent): string {
    return `${student.firstName} ${student.lastName}`;
  }
  initials(student: AttendanceStudent): string {
    return `${student.firstName[0]}${student.lastName?.[0] ?? ''}`;
  }
  sessionStatus(student: AttendanceStudent): AttendanceStatus {
    return this.statusByStudent[student.id] ?? 'pending';
  }
  quickMark(student: AttendanceStudent, status: AttendanceStatus): void {
    this.mark.emit({ student, status });
  }
  openStudent(student: AttendanceStudent): void {
    this.detail.emit(student);
  }
  clearFilters(): void {
    this.clear.emit();
  }
}
