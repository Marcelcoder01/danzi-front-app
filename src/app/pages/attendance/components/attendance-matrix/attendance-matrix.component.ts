import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faCircle,
  faCircleInfo,
  faExclamation,
  faRotate,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { StudentsService } from '../../../students/services/students.service';
import {
  AttendanceSession,
  AttendanceStatus,
  AttendanceStudent,
  ATTENDANCE_LABELS,
  localDateKey,
  parseLocalDate,
} from '../../interfaces/attendance.interface';
import { AttendanceService } from '../../services/attendance.service';

@Component({
  selector: 'app-attendance-matrix',
  standalone: true,
  imports: [FaIconComponent],
  templateUrl: './attendance-matrix.component.html',
  styleUrl: './attendance-matrix.component.css',
})
export class AttendanceMatrixComponent {
  @Input({ required: true }) monthlyStudents!: AttendanceStudent[];
  @Input({ required: true }) month!: string;
  @Input() selectedStudentId = '';
  @Output() selectStudent = new EventEmitter<AttendanceStudent>();
  @Output() edit = new EventEmitter<{ student: AttendanceStudent; session: AttendanceSession }>();
  readonly attendance = inject(AttendanceService);
  private readonly studentsService = inject(StudentsService);
  readonly statusLabels = ATTENDANCE_LABELS;
  readonly weekdayLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  readonly icons = {
    present: faCheck,
    recovered: faRotate,
    justified: faExclamation,
    absent: faXmark,
    pending: faCircle,
    info: faCircleInfo,
  };
  fullName(student: AttendanceStudent): string {
    return `${student.firstName} ${student.lastName}`;
  }
  initials(student: AttendanceStudent): string {
    return `${student.firstName[0]}${student.lastName?.[0] ?? ''}`;
  }
  levelLabel(student: AttendanceStudent): string {
    return `${this.studentsService.getLevelGroup(student.level)} · ${student.level}`;
  }
  enrolledClass(student: AttendanceStudent) {
    return this.attendance.classes.find((activity) => activity.id === student.classId)!;
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
        return {
          day: index + 1,
          date: localDateKey(date),
          weekday: date.getDay(),
          weekend: [0, 6].includes(date.getDay()),
        };
      },
    );
  }
  get weeks() {
    const weeks: { label: string; start: number; end: number; span: number }[] = [];
    for (const day of this.days) {
      if (!weeks.length || day.weekday === 1)
        weeks.push({ label: `Semana ${weeks.length + 1}`, start: day.day, end: day.day, span: 1 });
      else {
        const last = weeks[weeks.length - 1];
        last.end = day.day;
        last.span++;
      }
    }
    return weeks;
  }
  daySession(student: AttendanceStudent, date: string) {
    return this.attendance.session(student.classId, date);
  }
  dayStatus(student: AttendanceStudent, date: string): AttendanceStatus {
    const session = this.daySession(student, date);
    return session ? this.attendance.record(student.id, session.id).status : 'pending';
  }
  openStudent(student: AttendanceStudent): void {
    this.selectStudent.emit(student);
  }
  openEditor(student: AttendanceStudent, session: AttendanceSession): void {
    this.edit.emit({ student, session });
  }
}
