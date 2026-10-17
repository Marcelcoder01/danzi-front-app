import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faPlus,
  faSearch,
  faFilter,
  faEdit,
  faTrash,
  faEye,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import { Student } from '../../shared/interfaces/student.interface';
import { AcademyDataService } from '../../shared/services/academy-data.service';
import { ToastService } from '../../shared/services/toast.service';
import { StudentsService } from './services/students.service';
import { StudentDialogComponent } from './student-dialog/student-dialog.component';

@Component({
  selector: 'app-students',
  standalone: true,
  templateUrl: './students.component.html',
  styleUrl: './students.component.css',
  imports: [FormsModule, FaIconComponent, StudentDialogComponent]
})
export class StudentsComponent {
  @ViewChild(StudentDialogComponent) private studentDialog?: StudentDialogComponent;

  faPlus = faPlus;
  faSearch = faSearch;
  faFilter = faFilter;
  faEdit = faEdit;
  faTrash = faTrash;
  faEye = faEye;
  faXmark = faXmark;
  studentsService = inject(StudentsService);
  private readonly academyData = inject(AcademyDataService);
  private readonly toastService = inject(ToastService);
  isFiltersVisible = false;

  filterStatus = '';
  filterLevel = '';
  filterPayment = '';
  filterRole = '';
  searchTerm = '';

  constructor() {}

  get students(): Student[] {
    this.academyData.studentsVersion();
    return this.academyData.students.filter(student => {
      // Search term filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const fullName = `${student.firstName} ${student.lastName} ${student.alias}`.toLowerCase();
        if (!fullName.includes(searchLower) && !student.email?.toLowerCase().includes(searchLower)) {
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

}
