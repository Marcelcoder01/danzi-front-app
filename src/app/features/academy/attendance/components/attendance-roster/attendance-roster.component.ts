import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCheck, faRotate, faSearch, faXmark } from '@fortawesome/free-solid-svg-icons';
import {
  AttendanceStatus,
  AttendanceEnrollmentRow,
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
  @Input({ required: true }) roster!: AttendanceEnrollmentRow[];
  @Input({ required: true }) statusByStudent!: Record<string, AttendanceStatus>;
  @Input() pendingVisibleCount = 0;
  @Input() future = false;
  @Output() mark = new EventEmitter<{ student: AttendanceEnrollmentRow; status: AttendanceStatus }>();
  @Output() detail = new EventEmitter<AttendanceEnrollmentRow>();
  @Output() markPending = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
  readonly statusLabels = ATTENDANCE_LABELS;
  readonly quickStatuses: ('present' | 'recovered' | 'absent')[] = [
    'present',
    'recovered',
    'absent',
  ];
  readonly icons = { present: faCheck, recovered: faRotate, absent: faXmark, search: faSearch };
  fullName(student: AttendanceEnrollmentRow): string {
    return `${student.firstName} ${student.lastName}`;
  }
  initials(student: AttendanceEnrollmentRow): string {
    return `${student.firstName[0]}${student.lastName?.[0] ?? ''}`;
  }
  sessionStatus(student: AttendanceEnrollmentRow): AttendanceStatus {
    return this.statusByStudent[student.id] ?? 'pending';
  }
  quickMark(student: AttendanceEnrollmentRow, status: AttendanceStatus): void {
    this.mark.emit({ student, status });
  }
  openStudent(student: AttendanceEnrollmentRow): void {
    this.detail.emit(student);
  }
  clearFilters(): void {
    this.clear.emit();
  }
}
