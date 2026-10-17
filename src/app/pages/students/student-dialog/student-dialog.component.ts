import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark, faUserPlus, faUser, faEnvelope, faPhone, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Student } from '../../../shared/interfaces/student.interface';
import { StudentLevel } from '../../../shared/interfaces/student-level.enum';
import type { StudentRole, StudentStatus } from '../../../shared/interfaces/student-status.type';

@Component({
  selector: 'app-student-dialog',
  standalone: true,
  templateUrl: './student-dialog.component.html',
  styleUrl: './student-dialog.component.css',
  imports: [FormsModule, FaIconComponent]
})
export class StudentDialogComponent {
  @Output() createStudent = new EventEmitter<Omit<Student, 'id'>>();
  @Output() updateStudent = new EventEmitter<Student>();

  faXmark = faXmark;
  faUserPlus = faUserPlus;
  faUser = faUser;
  faEnvelope = faEnvelope;
  faPhone = faPhone;
  faArrowRight = faArrowRight;

  newStudent: Omit<Student, 'id'> = this.createEmptyStudent();
  isEdit = false;
  private editingStudentId: string | null = null;

  private createEmptyStudent(): Omit<Student, 'id'> {
    return {
    firstName: '',
    lastName: '',
    alias: '',
    email: '',
    phone: '',
    instagram: '',
    photoUrl: '',
    birthDate: '',
    startDate: '',
    level: StudentLevel.A1,
    status: 'active',
    role: 'follower',
    hasPaid: false
    };
  }
  
  paymentPeriod: '1' | '2' | 'custom' = '1';   // por defecto 1 mes
  paymentFrom: string | null = null;
  paymentTo: string | null = null;

  studentLevels = Object.values(StudentLevel);
  studentLevelsLabels: { [key: string]: string } = {
    [StudentLevel.A1]: 'Principiante 1',
    [StudentLevel.A2]: 'Principiante 2',
    [StudentLevel.A3]: 'Principiante 3',
    [StudentLevel.B1]: 'Intermedio 1',
    [StudentLevel.B2]: 'Intermedio 2',
    [StudentLevel.B3]: 'Intermedio 3',
    [StudentLevel.C1]: 'Avanzado 1',
    [StudentLevel.C2]: 'Avanzado 2',
    [StudentLevel.C3]: 'Avanzado 3'
  };

  studentStatuses: StudentStatus[] = ['active', 'inactive', 'paused'];
  studentStatusesLabels: { [key: string]: string } = {
    active: 'Activo',
    inactive: 'Inactivo',
    paused: 'Pausado'
  };

  studentRoles: StudentRole[] = ['leader', 'follower', 'mixed'];
  studentRolesLabels: { [key: string]: string } = {
    leader: 'Líder',
    follower: 'Follower',
    mixed: 'Ambos'
  };

  onSubmit(): void {
    if (this.isEdit && this.editingStudentId) {
      this.updateStudent.emit({ ...this.newStudent, id: this.editingStudentId });
    } else {
      this.createStudent.emit({ ...this.newStudent });
    }
    this.closeDialog();
    this.newStudent = this.createEmptyStudent();
    this.isEdit = false;
    this.editingStudentId = null;
  }

  openForCreate(): void {
    this.newStudent = this.createEmptyStudent();
    this.isEdit = false;
    this.editingStudentId = null;
    this.showDialog();
  }

  openForEdit(student: Student): void {
    const { id, ...studentDetails } = student;
    this.newStudent = { ...this.createEmptyStudent(), ...studentDetails };
    this.isEdit = true;
    this.editingStudentId = id;
    this.showDialog();
  }

  private showDialog(): void {
    const dialog = document.getElementById('student_dialog') as HTMLDialogElement | null;
    dialog?.showModal();
  }

  closeDialog(): void {
    const dialog = document.getElementById('student_dialog') as HTMLDialogElement;
    if (dialog) {
      dialog.close();
    }
  }
}
