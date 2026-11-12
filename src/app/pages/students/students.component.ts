import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faPlus,
  faSearch,
  faFilter,
  faEdit,
  faTrash,
  faEye,
  faXmark,
  faChevronDown,
  faChevronUp,
  faMusic,
  faClock,
  faLocationDot,
} from '@fortawesome/free-solid-svg-icons';
import { ClassActivity } from '../../shared/interfaces/class-activity.interface';
import { Student } from '../../shared/interfaces/student.interface';
import { AcademyDataService } from '../../shared/services/academy-data.service';
import { ToastService } from '../../shared/services/toast.service';
import { StudentsService } from './services/students.service';
import { StudentDialogComponent } from './student-dialog/student-dialog.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { LegacyNoticeComponent } from '../../shared/components/legacy-notice/legacy-notice.component';
import { OrganizationContextService } from '../../features/organizations/services/organization-context.service';

/** Alumnos demo (localStorage) usados por clases, matrículas, asistencia y pagos legacy. */
@Component({
  selector: 'app-students',
  standalone: true,
  templateUrl: './students.component.html',
  styleUrl: './students.component.css',
  imports: [
    FormsModule,
    RouterLink,
    FaIconComponent,
    StudentDialogComponent,
    ConfirmationDialogComponent,
    LegacyNoticeComponent,
  ],
})
export class StudentsComponent {
  @ViewChild(StudentDialogComponent) private studentDialog?: StudentDialogComponent;
  @ViewChild(ConfirmationDialogComponent) private confirmationDialog?: ConfirmationDialogComponent;
  private pendingDeleteStudent: Student | null = null;

  faPlus = faPlus;
  faSearch = faSearch;
  faFilter = faFilter;
  faEdit = faEdit;
  faTrash = faTrash;
  faEye = faEye;
  faXmark = faXmark;
  faChevronDown = faChevronDown;
  faChevronUp = faChevronUp;
  faMusic = faMusic;
  faClock = faClock;
  faLocationDot = faLocationDot;
  studentsService = inject(StudentsService);
  private readonly academyData = inject(AcademyDataService);
  private readonly toastService = inject(ToastService);
  readonly context = inject(OrganizationContextService);
  isFiltersVisible = false;

  filterStatus = '';
  filterLevel = '';
  filterPayment = '';
  filterRole = '';
  searchTerm = '';
  expandedStudentId: string | null = null;

  constructor() {}

  get students(): Student[] {
    this.academyData.studentsVersion();
    return this.academyData.students.filter((student) => {
      // Search term filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const fullName = `${student.firstName} ${student.lastName} ${student.alias}`.toLowerCase();
        if (
          !fullName.includes(searchLower) &&
          !student.email?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Status filter
      if (this.filterStatus && student.status !== this.filterStatus) {
        return false;
      }

      // Level filter
      if (this.filterLevel) {
        const levelGroup = this.studentsService.getLevelGroup(student.level);
        if (levelGroup !== this.filterLevel) {
          return false;
        }
      }

      // Payment filter
      if (this.filterPayment === 'paid' && !student.hasPaid) {
        return false;
      }
      if (this.filterPayment === 'pending' && student.hasPaid) {
        return false;
      }

      // Role filter
      if (this.filterRole && student.role !== this.filterRole) {
        return false;
      }

      return true;
    });
  }

  toggleEnrollments(studentId: string): void {
    this.expandedStudentId = this.expandedStudentId === studentId ? null : studentId;
  }

  studentClasses(studentId: string): ClassActivity[] {
    this.academyData.enrollmentsVersion();
    this.academyData.classesVersion();
    return this.academyData.classesForStudent(studentId);
  }

  classSchedule(activity: ClassActivity): string {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    if (activity.type === 'event') {
      return `${activity.schedule.date} · ${activity.schedule.startTime}–${activity.schedule.endTime}`;
    }
    const weekdays = activity.schedule.weekdays.map((day) => days[day]).join(', ');
    return `${weekdays} · ${activity.schedule.startTime}–${activity.schedule.endTime}`;
  }

  toggleFilters() {
    this.isFiltersVisible = !this.isFiltersVisible;
  }

  clearFilters() {
    this.filterStatus = '';
    this.filterLevel = '';
    this.filterPayment = '';
    this.filterRole = '';
    this.searchTerm = '';
  }

  openStudentDialog(): void {
    this.studentDialog?.openForCreate();
  }

  editStudent(student: Student): void {
    this.studentDialog?.openForEdit(student);
  }

  createStudent(student: Omit<Student, 'id'>): void {
    try {
      this.academyData.addStudent({
        ...student,
        id: `student-${globalThis.crypto.randomUUID()}`,
      });
      this.clearFilters();
      this.toastService.success(`Alumno ${student.firstName} creado correctamente.`);
    } catch {
      this.toastService.error('No se pudo crear el alumno. Inténtalo de nuevo.');
    }
  }

  updateStudent(student: Student): void {
    if (!this.academyData.updateStudent(student)) {
      this.toastService.error('No se pudo actualizar el alumno. Inténtalo de nuevo.');
      return;
    }

    this.clearFilters();
    this.toastService.success(`Alumno ${student.firstName} actualizado correctamente.`);
  }

  deleteStudent(student: Student): void {
    this.pendingDeleteStudent = student;
    this.confirmationDialog?.open({
      title: '¿Eliminar este alumno?',
      message:
        '¿Estás seguro de querer borrar al alumno de la academia? Se borrará todo el historial y la matrícula de todas las clases. No hay vuelta atrás.',
      confirmLabel: 'Sí, borrar alumno',
    });
  }

  confirmDeleteStudent(): void {
    const student = this.pendingDeleteStudent;
    this.pendingDeleteStudent = null;
    if (!student) return;

    if (!this.academyData.removeStudent(student.id)) {
      this.toastService.error('No se pudo borrar el alumno. Inténtalo de nuevo.');
      return;
    }

    if (this.expandedStudentId === student.id) this.expandedStudentId = null;
    this.toastService.success(`Alumno ${student.firstName} eliminado correctamente.`);
  }
}
