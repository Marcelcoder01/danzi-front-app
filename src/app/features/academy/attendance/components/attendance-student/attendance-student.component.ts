import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faCheck,
  faChevronRight,
  faCircle,
  faCircleInfo,
  faExclamation,
  faRotate,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { StudentsService } from '../../../students-local/services/students.service';
import {
  AttendanceRecord,
  AttendanceSession,
  AttendanceStatus,
  AttendanceEnrollmentRow,
  ATTENDANCE_LABELS,
  localDateKey,
  parseLocalDate,
} from '../../interfaces/attendance.interface';
import { AttendanceService } from '../../services/attendance.service';

@Component({
  selector: 'app-attendance-student',
  standalone: true,
  imports: [FaIconComponent],
  templateUrl: './attendance-student.component.html',
  styleUrl: './attendance-student.component.css',
})
export class AttendanceStudentComponent implements OnChanges {
  @Input({ required: true }) selectedStudent!: AttendanceEnrollmentRow;
  @Input({ required: true }) month!: string;
  @Input() dialog = false;
  @Output() close = new EventEmitter<void>();
  @Output() chooseClass = new EventEmitter<void>();
  @Output() edit = new EventEmitter<{ student: AttendanceEnrollmentRow; session: AttendanceSession }>();
  readonly attendance = inject(AttendanceService);
  private readonly studentsService = inject(StudentsService);
  readonly icons = {
    present: faCheck,
    recovered: faRotate,
    justified: faExclamation,
    absent: faXmark,
    pending: faCircle,
    back: faArrowLeft,
    info: faCircleInfo,
    right: faChevronRight,
  };
  readonly statusLabels = ATTENDANCE_LABELS;
  readonly summaryStatuses: AttendanceStatus[] = ['present', 'recovered', 'justified', 'absent'];
  detailTab: 'summary' | 'calendar' | 'history' = 'summary';
  ngOnChanges(): void {
    this.detailTab = 'summary';
  }
  fullName(student: AttendanceEnrollmentRow): string {
    return `${student.firstName} ${student.lastName}`;
  }
  initials(student: AttendanceEnrollmentRow): string {
    return `${student.firstName[0]}${student.lastName?.[0] ?? ''}`;
  }
  levelLabel(student: AttendanceEnrollmentRow): string {
    return `${this.studentsService.getLevelGroup(student.level)} · ${student.level}`;
  }
  enrolledClass(student: AttendanceEnrollmentRow) {
    return this.attendance.classes.find((activity) => activity.id === student.classId)!;
  }
  classSchedule(student: AttendanceEnrollmentRow): string {
    return `${this.enrolledClass(student)
      .schedule.weekdays.map((day) => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][day])
      .join(' y ')} · ${this.enrolledClass(student).schedule.startTime} – ${this.enrolledClass(student).schedule.endTime}`;
  }
  get monthLabel(): string {
    return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
      parseLocalDate(`${this.month}-01`),
    );
  }
  formatDate(date: string): string {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(parseLocalDate(date));
  }
  get days() {
    const start = parseLocalDate(`${this.month}-01`);
    return Array.from(
      { length: new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate() },
      (_, index) => {
        const date = new Date(start.getFullYear(), start.getMonth(), index + 1, 12);
        return { day: index + 1, date: localDateKey(date), weekday: date.getDay() };
      },
    );
  }
  get calendarPadding() {
    return Array((this.days[0].weekday + 6) % 7).fill(0);
  }
  daySession(student: AttendanceEnrollmentRow, date: string) {
    return this.attendance.session(student.classId, date);
  }
  dayStatus(student: AttendanceEnrollmentRow, date: string): AttendanceStatus {
    const session = this.daySession(student, date);
    return session ? this.attendance.record(student.id, session.id).status : 'pending';
  }
  history(student: AttendanceEnrollmentRow) {
    return this.attendance
      .sessions(this.month)
      .filter((session) => session.classId === student.classId)
      .map((session) => ({ session, record: this.attendance.record(student.id, session.id) }));
  }
  studentCounts(student: AttendanceEnrollmentRow): Record<AttendanceStatus, number> {
    const counts = { present: 0, recovered: 0, justified: 0, absent: 0, pending: 0 };
    this.history(student).forEach((row) => counts[row.record.status]++);
    return counts;
  }
  recoveryDescription(record: AttendanceRecord): string {
    if (!record.recoverySessionId) return '';
    const date = record.recoverySessionId.split(':')[1];
    const session = this.attendance
      .sessions(date.slice(0, 7))
      .find((session) => session.id === record.recoverySessionId);
    const activity = this.attendance.classes.find((activity) => activity.id === session?.classId);
    return session && activity
      ? `${activity.name} · ${this.formatDate(session.date)} · ${activity.schedule.startTime}`
      : '';
  }
  openEditor(student: AttendanceEnrollmentRow, session: AttendanceSession): void {
    this.edit.emit({ student, session });
  }
}
