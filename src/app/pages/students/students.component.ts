import { Component } from '@angular/core';
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
import { Student } from './interfaces/student.interface';
import { StudentLevel } from './interfaces/student-level.enum';

@Component({
  selector: 'app-students',
  standalone: true,
  templateUrl: './students.component.html',
  styleUrl: './students.component.css',
  imports: [FormsModule, FaIconComponent]
})
export class StudentsComponent {
  faPlus = faPlus;
  faSearch = faSearch;
  faFilter = faFilter;
  faEdit = faEdit;
  faTrash = faTrash;
  faEye = faEye;
  faXmark = faXmark;

  isFiltersVisible = false;

  filterStatus = '';
  filterLevel = '';
  filterPayment = '';
  searchTerm = '';

  allStudents: Student[] = [
    {
      id: '1',
      firstName: 'Laura',
      lastName: 'García',
      alias: 'Laura G',
      email: 'laura.garcia@email.com',
      phone: '+34 612 345 678',
      level: StudentLevel.C3,
      status: 'active',
      hasPaid: true,
      startDate: '2024-01-15'
    },
    {
      id: '2',
      firstName: 'Carlos',
      lastName: 'Ruiz',
      alias: 'Carlos R',
      email: 'carlos.ruiz@email.com',
      phone: '+34 623 456 789',
      level: StudentLevel.B2,
      status: 'active',
      hasPaid: true,
      startDate: '2024-02-20'
    },
    {
      id: '3',
      firstName: 'María',
      lastName: 'López',
      alias: 'María L',
      email: 'maria.lopez@email.com',
      phone: '+34 634 567 890',
      level: StudentLevel.A1,
      status: 'active',
      hasPaid: true,
      startDate: '2024-03-10'
    },
    {
      id: '4',
      firstName: 'Pedro',
      lastName: 'Martínez',
      alias: 'Pedro M',
      email: 'pedro.martinez@email.com',
      phone: '+34 645 678 901',
      level: StudentLevel.B1,
      status: 'inactive',
      hasPaid: false,
      startDate: '2023-11-05'
    },
    {
      id: '5',
      firstName: 'Ana',
      lastName: 'Sánchez',
      alias: 'Ana S',
      email: 'ana.sanchez@email.com',
      phone: '+34 656 789 012',
      level: StudentLevel.C2,
      status: 'active',
      hasPaid: true,
      startDate: '2023-09-12'
    },
    {
      id: '6',
      firstName: 'David',
      lastName: 'Fernández',
      alias: 'David F',
      email: 'david.fernandez@email.com',
      phone: '+34 667 890 123',
      level: StudentLevel.A2,
      status: 'paused',
      hasPaid: false,
      startDate: '2024-04-01'
    },
    {
      id: '7',
      firstName: 'Elena',
      lastName: 'Rodríguez',
      alias: 'Elena R',
      email: 'elena.rodriguez@email.com',
      phone: '+34 678 901 234',
      level: StudentLevel.B3,
      status: 'active',
      hasPaid: true,
      startDate: '2024-01-28'
    },
    {
      id: '8',
      firstName: 'Miguel',
      lastName: 'González',
      alias: 'Miguel G',
      email: 'miguel.gonzalez@email.com',
      phone: '+34 689 012 345',
      level: StudentLevel.C1,
      status: 'active',
      hasPaid: true,
      startDate: '2023-12-15'
    }
  ];

  get students(): Student[] {
    return this.allStudents.filter(student => {
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
        const levelGroup = this.getLevelGroup(student.level);
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
    this.searchTerm = '';
  }

  getLevelLabel(level: StudentLevel): string {
    const levelMap: Record<StudentLevel, string> = {
      [StudentLevel.A1]: 'Principiante A1',
      [StudentLevel.A2]: 'Principiante A2',
      [StudentLevel.A3]: 'Principiante A3',
      [StudentLevel.B1]: 'Intermedio B1',
      [StudentLevel.B2]: 'Intermedio B2',
      [StudentLevel.B3]: 'Intermedio B3',
      [StudentLevel.C1]: 'Avanzado C1',
      [StudentLevel.C2]: 'Avanzado C2',
      [StudentLevel.C3]: 'Avanzado C3'
    };
    return levelMap[level] || level;
  }

  getLevelGroup(level: StudentLevel): 'Principiante' | 'Intermedio' | 'Avanzado' {
    if (level.startsWith('A')) return 'Principiante';
    if (level.startsWith('B')) return 'Intermedio';
    return 'Avanzado';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'inactive':
        return 'badge-warning';
      case 'paused':
        return 'badge-info';
      default:
        return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'inactive':
        return 'Inactivo';
      case 'paused':
        return 'Pausado';
      default:
        return status;
    }
  }

  getInitials(student: Student): string {
    if (student.firstName && student.lastName) {
      return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`;
    }
    return student.firstName?.charAt(0) || '?';
  }

  getDisplayName(student: Student): string {
    if (student.alias) return student.alias;
    if (student.lastName) return `${student.firstName} ${student.lastName}`;
    return student.firstName;
  }
}
