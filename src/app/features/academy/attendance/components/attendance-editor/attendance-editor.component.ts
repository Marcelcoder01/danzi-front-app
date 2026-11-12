import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faCircle,
  faExclamation,
  faRotate,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import {
  AttendanceSession,
  AttendanceStatus,
  AttendanceEnrollmentRow,
  ATTENDANCE_LABELS,
  ATTENDANCE_STATUSES,
  parseLocalDate,
} from '../../interfaces/attendance.interface';
import { AttendanceService } from '../../services/attendance.service';

@Component({
  selector: 'app-attendance-editor',
  standalone: true,
  imports: [FormsModule, FaIconComponent],
  templateUrl: './attendance-editor.component.html',
  styleUrl: './attendance-editor.component.css',
})
export class AttendanceEditorComponent {
  readonly attendance = inject(AttendanceService);
  readonly statuses = ATTENDANCE_STATUSES;
  readonly statusLabels = ATTENDANCE_LABELS;
  readonly icons = {
    present: faCheck,
    recovered: faRotate,
    justified: faExclamation,
    absent: faXmark,
    pending: faCircle,
  };
  editingStudent?: AttendanceEnrollmentRow;
  editingSession?: AttendanceSession;
  editorStatus: AttendanceStatus = 'present';
  recoverySessionId = '';
  note = '';
  editorError = '';
  @ViewChild('markDialog') markDialog!: ElementRef<HTMLDialogElement>;
  fullName(student: AttendanceEnrollmentRow): string {
    return `${student.firstName} ${student.lastName}`;
  }
  formatDate(date: string, long = false): string {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: long ? 'long' : 'short',
      day: 'numeric',
      month: long ? 'long' : 'short',
    }).format(parseLocalDate(date));
  }
  open(student: AttendanceEnrollmentRow, session: AttendanceSession, status?: AttendanceStatus): void {
    if (session.date > this.attendance.today) return;
    this.editingStudent = student;
    this.editingSession = session;
    const record = this.attendance.record(student.id, session.id);
    this.editorStatus = status ?? record.status;
    this.recoverySessionId = record.recoverySessionId ?? '';
    this.note = record.note ?? '';
    this.editorError = '';
    this.markDialog.nativeElement.showModal();
  }
  get recoveryOptions() {
    return this.editingStudent && this.editingSession
      ? this.attendance.recoveryOptions(this.editingStudent, this.editingSession)
      : [];
  }
  recoveryLabel(session: AttendanceSession): string {
    const activity = this.attendance.classes.find((item) => item.id === session.classId);
    return `${activity?.name} · ${this.formatDate(session.date)} · ${activity?.schedule.startTime}`;
  }
  applyEditor(): void {
    if (!this.editingStudent || !this.editingSession) return;
    if (this.editorStatus === 'recovered' && !this.recoverySessionId) {
      this.editorError = 'Selecciona la clase en la que recuperó la asistencia.';
      return;
    }
    if (
      this.attendance.stage(
        this.editingStudent,
        this.editingSession,
        this.editorStatus,
        this.recoverySessionId,
        this.note,
      )
    )
      this.markDialog.nativeElement.close();
    else this.editorError = 'Esta recuperación ya no está disponible. Elige otra sesión.';
  }
}
