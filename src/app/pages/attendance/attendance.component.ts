import { AttendanceEditorComponent } from './components/attendance-editor/attendance-editor.component';
import { AttendanceRosterComponent } from './components/attendance-roster/attendance-roster.component';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
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
  AttendanceStudent,
  ATTENDANCE_LABELS,
  ATTENDANCE_STATUSES,
  localDateKey,
  parseLocalDate,
} from './interfaces/attendance.interface';
import { AttendanceService } from './services/attendance.service';
import { AttendanceStudentComponent } from './components/attendance-student/attendance-student.component';
import { AttendanceMatrixComponent } from './components/attendance-matrix/attendance-matrix.component';

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
  month = this.attendance.today.slice(0, 7);
  sessionClassId = this.attendance.classes[0].id;
  selectedDate = this.defaultSessionDate();
  viewMode: 'auto' | 'session' | 'month' = 'auto';
  viewportIsDesktop = window.innerWidth >= 1024;
  get effectiveView(): 'session' | 'month' {
    return this.viewMode === 'auto'
      ? this.viewportIsDesktop
        ? 'month'
        : 'session'
      : this.viewMode;
  }
  @HostListener('window:resize')
  updateViewport(): void {
    this.viewportIsDesktop = window.innerWidth >= 1024;
  }
  classFilter = '';
  levelFilter = '';
  searchTerm = '';
  statusFilter = '';
  filtersOpen = false;
  selectedStudent = this.attendance.students[0];
  detailTab: 'summary' | 'calendar' | 'history' = 'summary';
  @ViewChild('studentDialog') studentDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('editor') editor!: AttendanceEditorComponent;

  get sessionClass() {
    return this.attendance.classes.find((activity) => activity.id === this.sessionClassId)!;
  }

  get selectedSession() {
    return this.attendance.session(this.sessionClassId, this.selectedDate);
  }

  get draftCount(): number {
    return Object.keys(this.attendance.drafts()).length;
  }

  get sessionStudents(): AttendanceStudent[] {
    return this.attendance.students.filter((student) => student.classId === this.sessionClassId);
  }

  get rosterStatuses(): Record<string, AttendanceStatus> {
    return Object.fromEntries(
      this.sessionStudents.map((student) => [student.id, this.sessionStatus(student)]),
    );
  }

  get roster(): AttendanceStudent[] {
    return this.sessionStudents.filter(
      (student) =>
        this.matchesSearch(student) &&
        this.matchesStatus(this.sessionStatus(student), this.statusFilter),
    );
  }

  get monthlyStudents(): AttendanceStudent[] {
    return this.attendance.students.filter(
      (student) =>
        this.matchesSearch(student) &&
        (!this.classFilter || student.classId === this.classFilter) &&
        (!this.levelFilter || student.level.startsWith(this.levelFilter)),
    );
  }

  get days() {
    const start = parseLocalDate(`${this.month}-01`);
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
  }

  get weeks() {
    const weeks: { label: string; start: number; end: number; span: number }[] = [];
    for (const day of this.days) {
      if (!weeks.length || day.weekday === 1) {
        weeks.push({ label: `Semana ${weeks.length + 1}`, start: day.day, end: day.day, span: 1 });
      } else {
        const last = weeks[weeks.length - 1];
        last.end = day.day;
        last.span++;
      }
    }
    return weeks;
  }

  get calendarPadding() {
    return Array((this.days[0].weekday + 6) % 7).fill(0);
  }

  get monthCounts() {
    const records = this.monthlyStudents
      .flatMap((student) => this.history(student))
      .filter((row) => row.session.date <= this.attendance.today)
      .map((row) => row.record);
    return this.counts(records);
  }

  get attendanceRate(): number {
    const counts = this.monthCounts;
    const marked = counts.present + counts.recovered + counts.justified + counts.absent;
    return marked ? Math.round(((counts.present + counts.recovered) / marked) * 100) : 0;
  }

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
  classSchedule(student: AttendanceStudent): string {
    return `${this.enrolledClass(student)
      .weekdays.map((day) => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][day])
      .join(' y ')} · ${this.enrolledClass(student).time}`;
  }
  formatDate(date: string, long = false): string {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: long ? 'long' : 'short',
      day: 'numeric',
      month: long ? 'long' : 'short',
    }).format(parseLocalDate(date));
  }
  get monthLabel(): string {
    return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
      parseLocalDate(`${this.month}-01`),
    );
  }

  sessionStatus(student: AttendanceStudent): AttendanceStatus {
    return this.selectedSession
      ? this.attendance.record(student.id, this.selectedSession.id).status
      : 'pending';
  }
  daySession(student: AttendanceStudent, date: string) {
    return this.attendance.session(student.classId, date);
  }
  dayStatus(student: AttendanceStudent, date: string): AttendanceStatus {
    const session = this.daySession(student, date);
    return session ? this.attendance.record(student.id, session.id).status : 'pending';
  }
  filterCount(filter: string): number {
    return this.sessionStudents.filter((student) =>
      this.matchesStatus(this.sessionStatus(student), filter),
    ).length;
  }
  get pendingVisibleCount(): number {
    return this.roster.filter((student) => this.sessionStatus(student) === 'pending').length;
  }

  chooseClass(): void {
    this.selectedDate = this.defaultSessionDate();
    this.statusFilter = '';
  }
  changeDate(): void {
    if (this.selectedDate) this.month = this.selectedDate.slice(0, 7);
  }
  changeMonth(month: string): void {
    if (/^\d{4}-\d{2}$/.test(month)) {
      this.month = month;
      this.selectedDate = this.defaultSessionDate();
    }
  }
  shiftMonth(amount: number): void {
    const date = parseLocalDate(`${this.month}-01`);
    this.changeMonth(
      localDateKey(new Date(date.getFullYear(), date.getMonth() + amount, 1, 12)).slice(0, 7),
    );
  }
  shiftSession(amount: number): void {
    const sessions = this.attendance
      .sessions(this.month)
      .filter((session) => session.classId === this.sessionClassId);
    const index = sessions.findIndex((session) => session.date === this.selectedDate);
    const next = sessions[index + amount];
    if (next) this.selectedDate = next.date;
  }
  canShiftSession(amount: number): boolean {
    const sessions = this.attendance
      .sessions(this.month)
      .filter((session) => session.classId === this.sessionClassId);
    const index = sessions.findIndex((session) => session.date === this.selectedDate);
    return index >= 0 && !!sessions[index + amount];
  }

  quickMark(student: AttendanceStudent, status: AttendanceStatus): void {
    const session = this.selectedSession;
    if (!session) return;
    if (status === 'recovered') {
      this.openEditor(student, session, status);
      return;
    }
    const next = this.sessionStatus(student) === status ? 'pending' : status;
    this.attendance.stage(student, session, next);
  }
  markPending(): void {
    const session = this.selectedSession;
    if (!session) return;
    for (const student of this.roster) {
      if (this.sessionStatus(student) === 'pending')
        this.attendance.stage(student, session, 'present');
    }
  }
  openStudent(student: AttendanceStudent): void {
    this.selectedStudent = student;
    this.detailTab = 'summary';
    if (this.viewMode === 'session' || window.matchMedia('(max-width: 1279px)').matches)
      this.studentDialog.nativeElement.showModal();
  }
  goToStudentClass(): void {
    this.sessionClassId = this.selectedStudent.classId;
    this.chooseClass();
    this.viewMode = 'session';
    this.studentDialog.nativeElement.close();
  }
  openEditor(
    student: AttendanceStudent,
    session: AttendanceSession,
    status?: AttendanceStatus,
  ): void {
    this.editor.open(student, session, status);
  }
  history(student: AttendanceStudent) {
    return this.attendance
      .sessions(this.month)
      .filter((session) => session.classId === student.classId)
      .map((session) => ({ session, record: this.attendance.record(student.id, session.id) }));
  }
  clearFilters(): void {
    this.classFilter = '';
    this.levelFilter = '';
    this.searchTerm = '';
    this.statusFilter = '';
  }

  @HostListener('window:beforeunload', ['$event'])
  warnUnsaved(event: BeforeUnloadEvent): void {
    if (this.draftCount) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  private defaultSessionDate(): string {
    const sessions = this.attendance
      .sessions(this.month)
      .filter((session) => session.classId === this.sessionClassId);
    return (
      sessions.filter((session) => session.date <= this.attendance.today).at(-1)?.date ??
      sessions[0]?.date ??
      this.attendance.today
    );
  }
  private matchesSearch(student: AttendanceStudent): boolean {
    const normalize = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    return normalize(this.fullName(student)).includes(normalize(this.searchTerm.trim()));
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
