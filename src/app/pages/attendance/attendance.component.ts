import { AttendanceEditorComponent } from './components/attendance-editor/attendance-editor.component';
import { AttendanceRosterComponent } from './components/attendance-roster/attendance-roster.component';
import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faCalendarDays,
  faChartSimple,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCircle,
  faCircleInfo,
  faClock,
  faEllipsis,
  faExclamation,
  faFilter,
  faFloppyDisk,
  faRotate,
  faSearch,
  faUsers,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { StudentsService } from '../students/services/students.service';
import {
  AttendanceRecord,
  AttendanceSession,
  AttendanceStatus,
  AttendanceEnrollmentRow,
  ATTENDANCE_LABELS,
  ATTENDANCE_STATUSES,
  localDateKey,
  parseLocalDate,
} from './interfaces/attendance.interface';
import { AttendanceService } from './services/attendance.service';
import { AttendanceStudentComponent } from './components/attendance-student/attendance-student.component';
import { AttendanceMatrixComponent } from './components/attendance-matrix/attendance-matrix.component';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-attendance',
  standalone: true,
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css',
  imports: [
    CommonModule,
    FormsModule,
    FaIconComponent,
    AttendanceStudentComponent,
    AttendanceMatrixComponent,
    AttendanceRosterComponent,
    AttendanceEditorComponent,
  ],
})
export class AttendanceComponent {
  readonly attendance = inject(AttendanceService);
  private readonly toastService = inject(ToastService);
  private readonly studentsService = inject(StudentsService);
  readonly icons = {
    present: faCheck,
    recovered: faRotate,
    justified: faExclamation,
    absent: faXmark,
    pending: faCircle,
    back: faArrowLeft,
    calendar: faCalendarDays,
    chart: faChartSimple,
    left: faChevronLeft,
    right: faChevronRight,
    info: faCircleInfo,
    clock: faClock,
    more: faEllipsis,
    filter: faFilter,
    save: faFloppyDisk,
    search: faSearch,
    users: faUsers,
  };
  readonly statusLabels = ATTENDANCE_LABELS;
  readonly statuses = ATTENDANCE_STATUSES;
  readonly quickStatuses: AttendanceStatus[] = ['present', 'recovered', 'absent'];
  readonly weekdayLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  readonly quickFilters = [
    { id: '', label: 'Todos' },
    { id: 'attended', label: 'Asistieron' },
    { id: 'missed', label: 'Faltas' },
    { id: 'pending', label: 'Pendientes' },
  ];
  readonly month = signal(this.attendance.today.slice(0, 7));
  readonly sessionClassId = signal(this.attendance.classes[0].id);
  readonly selectedDate = signal(this.defaultSessionDate(this.month(), this.sessionClassId()));
  readonly viewMode = signal<'auto' | 'session' | 'month'>('auto');
  readonly viewportIsDesktop = signal(window.innerWidth >= 1024);
  readonly effectiveView = computed(() =>
    this.viewMode() === 'auto' ? (this.viewportIsDesktop() ? 'month' : 'session') : this.viewMode(),
  );
  @HostListener('window:resize')
  updateViewport(): void {
    this.viewportIsDesktop.set(window.innerWidth >= 1024);
  }
  readonly classFilter = signal('');
  readonly levelFilter = signal('');
  readonly searchTerm = signal('');
  readonly statusFilter = signal('');
  readonly filtersOpen = signal(false);
  readonly selectedStudent = signal(this.attendance.students[0]);
  @ViewChild('studentDialog') studentDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('editor') editor!: AttendanceEditorComponent;

  readonly sessionClass = computed(() =>
    this.attendance.classes.find((activity) => activity.id === this.sessionClassId())!,
  );

  readonly selectedSession = computed(() =>
    this.attendance.session(this.sessionClassId(), this.selectedDate()),
  );

  readonly draftCount = computed(() => Object.keys(this.attendance.drafts()).length);

  readonly sessionStudents = computed(() =>
    this.attendance.students.filter((student) => student.classId === this.sessionClassId()),
  );

  readonly rosterStatuses = computed<Record<string, AttendanceStatus>>(() => {
    return Object.fromEntries(
      this.sessionStudents().map((student) => [student.id, this.sessionStatus(student)]),
    );
  });

  readonly roster = computed(() =>
    this.sessionStudents().filter(
      (student) =>
        this.matchesSearch(student) &&
        this.matchesStatus(this.sessionStatus(student), this.statusFilter()),
    ),
  );

  readonly monthlyStudents = computed(() =>
    this.attendance.students.filter(
      (student) =>
        this.matchesSearch(student) &&
        (!this.classFilter() || student.classId === this.classFilter()) &&
        (!this.levelFilter() || student.level.startsWith(this.levelFilter())),
    ),
  );

  readonly days = computed(() => {
    const start = parseLocalDate(`${this.month()}-01`);
    const length = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    return Array.from({ length }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), index + 1, 12);
      return {
        day: index + 1,
        date: localDateKey(date),
        weekday: date.getDay(),
        weekend: [0, 6].includes(date.getDay()),
      };
    });
  });

  readonly weeks = computed(() => {
    const weeks: { label: string; start: number; end: number; span: number }[] = [];
    for (const day of this.days()) {
      if (!weeks.length || day.weekday === 1) {
        weeks.push({ label: `Semana ${weeks.length + 1}`, start: day.day, end: day.day, span: 1 });
      } else {
        const last = weeks[weeks.length - 1];
        last.end = day.day;
        last.span++;
      }
    }
    return weeks;
  });

  readonly calendarPadding = computed(() => Array((this.days()[0].weekday + 6) % 7).fill(0));

  readonly monthCounts = computed(() => {
    const records = this.monthlyStudents()
      .flatMap((student) => this.history(student))
      .filter((row) => row.session.date <= this.attendance.today)
      .map((row) => row.record);
    return this.counts(records);
  });

  readonly attendanceRate = computed(() => {
    const counts = this.monthCounts();
    const marked = counts.present + counts.recovered + counts.justified + counts.absent;
    return marked ? Math.round(((counts.present + counts.recovered) / marked) * 100) : 0;
  });
  readonly pendingVisibleCount = computed(
    () => this.roster().filter((student) => this.sessionStatus(student) === 'pending').length,
  );

  saveAttendance(): void {
    if (this.attendance.save()) {
      this.toastService.success('Asistencia guardada en este dispositivo.');
    } else {
      this.toastService.error('No se pudo guardar. Conservamos tus cambios para que lo intentes de nuevo.');
    }
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
      .join(
        ' y ',
      )} · ${this.enrolledClass(student).schedule.startTime} – ${this.enrolledClass(student).schedule.endTime}`;
  }
  formatDate(date: string, long = false): string {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: long ? 'long' : 'short',
      day: 'numeric',
      month: long ? 'long' : 'short',
    }).format(parseLocalDate(date));
  }
  readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
      parseLocalDate(`${this.month()}-01`),
    ),
  );

  sessionStatus(student: AttendanceEnrollmentRow): AttendanceStatus {
    return this.selectedSession()
      ? this.attendance.record(student.id, this.selectedSession()!.id).status
      : 'pending';
  }
  daySession(student: AttendanceEnrollmentRow, date: string) {
    return this.attendance.session(student.classId, date);
  }
  dayStatus(student: AttendanceEnrollmentRow, date: string): AttendanceStatus {
    const session = this.daySession(student, date);
    return session ? this.attendance.record(student.id, session.id).status : 'pending';
  }
  filterCount(filter: string): number {
    return this.sessionStudents().filter((student) =>
      this.matchesStatus(this.sessionStatus(student), filter),
    ).length;
  }

  chooseClass(classId = this.sessionClassId()): void {
    this.sessionClassId.set(classId);
    this.selectedDate.set(this.defaultSessionDate(this.month(), classId));
    this.statusFilter.set('');
  }
  changeDate(date: string): void {
    this.selectedDate.set(date);
    if (date) this.month.set(date.slice(0, 7));
  }
  changeMonth(month: string): void {
    if (/^\d{4}-\d{2}$/.test(month)) {
      this.month.set(month);
      this.selectedDate.set(this.defaultSessionDate(month, this.sessionClassId()));
    }
  }
  shiftMonth(amount: number): void {
    const date = parseLocalDate(`${this.month()}-01`);
    const month = localDateKey(new Date(date.getFullYear(), date.getMonth() + amount, 1, 12)).slice(
      0,
      7,
    );
    this.changeMonth(month);
  }
  shiftSession(amount: number): void {
    const sessions = this.attendance
      .sessions(this.month())
      .filter((session) => session.classId === this.sessionClassId());
    const index = sessions.findIndex((session) => session.date === this.selectedDate());
    const next = sessions[index + amount];
    if (next) this.changeDate(next.date);
  }
  canShiftSession(amount: number): boolean {
    const sessions = this.attendance
      .sessions(this.month())
      .filter((session) => session.classId === this.sessionClassId());
    const index = sessions.findIndex((session) => session.date === this.selectedDate());
    return index >= 0 && !!sessions[index + amount];
  }

  quickMark(student: AttendanceEnrollmentRow, status: AttendanceStatus): void {
    const session = this.selectedSession();
    if (!session) return;
    if (status === 'recovered') {
      this.openEditor(student, session, status);
      return;
    }
    const next = this.sessionStatus(student) === status ? 'pending' : status;
    this.attendance.stage(student, session, next);
  }
  markPending(): void {
    const session = this.selectedSession();
    if (!session) return;
    for (const student of this.roster()) {
      if (this.sessionStatus(student) === 'pending')
        this.attendance.stage(student, session, 'present');
    }
  }
  openStudent(student: AttendanceEnrollmentRow): void {
    this.selectedStudent.set(student);
    if (this.viewMode() === 'session' || window.matchMedia('(max-width: 1279px)').matches)
      this.studentDialog.nativeElement.showModal();
  }
  goToStudentClass(): void {
    this.chooseClass(this.selectedStudent().classId);
    this.viewMode.set('session');
    this.studentDialog.nativeElement.close();
  }
  openEditor(
    student: AttendanceEnrollmentRow,
    session: AttendanceSession,
    status?: AttendanceStatus,
  ): void {
    this.editor.open(student, session, status);
  }
  history(student: AttendanceEnrollmentRow) {
    return this.attendance
      .sessions(this.month())
      .filter((session) => session.classId === student.classId)
      .map((session) => ({ session, record: this.attendance.record(student.id, session.id) }));
  }
  clearFilters(): void {
    this.classFilter.set('');
    this.levelFilter.set('');
    this.searchTerm.set('');
    this.statusFilter.set('');
  }

  @HostListener('window:beforeunload', ['$event'])
  warnUnsaved(event: BeforeUnloadEvent): void {
    if (this.draftCount()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  private defaultSessionDate(month: string, classId: string): string {
    const sessions = this.attendance
      .sessions(month)
      .filter((session) => session.classId === classId);
    return (
      sessions.filter((session) => session.date <= this.attendance.today).at(-1)?.date ??
      sessions[0]?.date ??
      this.attendance.today
    );
  }
  private matchesSearch(student: AttendanceEnrollmentRow): boolean {
    const normalize = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    return normalize(this.fullName(student)).includes(normalize(this.searchTerm().trim()));
  }
  private matchesStatus(status: AttendanceStatus, filter: string): boolean {
    return (
      !filter ||
      (filter === 'attended' && ['present', 'recovered'].includes(status)) ||
      (filter === 'missed' && ['absent', 'justified'].includes(status)) ||
      (filter === 'pending' && status === 'pending')
    );
  }
  private counts(records: AttendanceRecord[]): Record<AttendanceStatus, number> {
    const counts = { present: 0, recovered: 0, justified: 0, absent: 0, pending: 0 };
    records.forEach((record) => counts[record.status]++);
    return counts;
  }
}
