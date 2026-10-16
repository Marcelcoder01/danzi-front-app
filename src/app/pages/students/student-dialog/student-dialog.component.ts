import { Component, inject } from '@angular/core';
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
  faXmark = faXmark;
  faUserPlus = faUserPlus;
  faUser = faUser;
  faEnvelope = faEnvelope;
  faPhone = faPhone;
  faArrowRight = faArrowRight;

  newStudent: Partial<Student> = {
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
    console.log('Nuevo estudiante:', this.newStudent);
  }

  closeDialog(): void {
    const dialog = document.getElementById('student_dialog') as HTMLDialogElement;
    if (dialog) {
      dialog.close();
    }
  }
}
