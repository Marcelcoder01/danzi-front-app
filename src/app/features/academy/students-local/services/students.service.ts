import { Injectable } from '@angular/core';
import { StudentLevel } from '@shared/interfaces/student-level.enum';
import { Student } from '@shared/interfaces/student.interface';

@Injectable({
  providedIn: 'root',
})
export class StudentsService {
  getLevelGroup(level: StudentLevel): 'Principiante' | 'Intermedio' | 'Avanzado' {
    if (level.startsWith('A')) return 'Principiante';
    if (level.startsWith('B')) return 'Intermedio';
    return 'Avanzado';
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
      [StudentLevel.C3]: 'Avanzado C3',
      [StudentLevel.ALL_LEVELS]: 'Todos los niveles',
    };
    return levelMap[level] || level;
  }
  getRoleLabel(role: string): string {
    const roleMap: Record<string, string> = {
      leader: 'Líder',
      follower: 'Follower',
      mixed: 'Ambos',
    };
    return roleMap[role] || role;
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
