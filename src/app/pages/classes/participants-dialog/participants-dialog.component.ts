import { Component, computed, inject, signal } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faCrown,
  faMagnifyingGlass,
  faPersonWalking,
  faPlus,
  faUserMinus,
  faUsers,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { RegularClassActivity } from '../../../shared/interfaces/class-activity.interface';
import { Student } from '../../../shared/interfaces/student.interface';
import { StudentRole } from '../../../shared/interfaces/student-status.type';
import { AcademyDataService } from '../../../shared/services/academy-data.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-participants-dialog',
  standalone: true,
  imports: [FaIconComponent],
  templateUrl: './participants-dialog.component.html',
  styleUrl: './participants-dialog.component.css',
})
export class ParticipantsDialogComponent {
  private readonly academyData = inject(AcademyDataService);
  private readonly toastService = inject(ToastService);

  readonly selectedClass = signal<RegularClassActivity | null>(null);
  readonly searchTerm = signal('');
  readonly faArrowRight = faArrowRight;
  readonly faCrown = faCrown;
  readonly faMagnifyingGlass = faMagnifyingGlass;
  readonly faPersonWalking = faPersonWalking;
  readonly faPlus = faPlus;
  readonly faUserMinus = faUserMinus;
  readonly faUsers = faUsers;
  readonly faXmark = faXmark;

  private initialEnrollments: Set<string> = new Set();

  readonly enrolledStudents = computed(() => {
    const activity = this.selectedClass();
    this.academyData.enrollmentsVersion();
    this.academyData.studentsVersion();
    return activity ? this.academyData.studentsForClass(activity.id) : [];
  });

  readonly availableStudents = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase('es');
    const enrolledIds = new Set(this.enrolledStudents().map((student) => student.id));
    this.academyData.studentsVersion();
    return this.academyData.students
      .filter((student) => !enrolledIds.has(student.id))
      .filter((student) => {
        if (!query) return true;
        return `${student.firstName} ${student.lastName ?? ''} ${student.alias ?? ''}`
          .toLocaleLowerCase('es')
          .includes(query);
      })
      .sort((a, b) => a.firstName.localeCompare(b.firstName, 'es'));
  });

  openFor(activity: RegularClassActivity): void {
    this.selectedClass.set(activity);
    this.searchTerm.set('');
    // Guardar el estado inicial de matrículas
    this.initialEnrollments = new Set(
      this.academyData.studentsForClass(activity.id).map((s) => s.id),
    );
    (document.getElementById('participants_dialog') as HTMLDialogElement | null)?.showModal();
  }

  close(): void {
    (document.getElementById('participants_dialog') as HTMLDialogElement | null)?.close();
    this.selectedClass.set(null);
  }

  cancel(): void {
    const activity = this.selectedClass();
    if (!activity) return;

    // Deshacer cambios: matricular los que estaban inicialmente y retirar los que no
    const currentEnrollments = new Set(
      this.academyData.studentsForClass(activity.id).map((s) => s.id),
    );

    // Retirar los que se añadieron durante la sesión
    for (const studentId of currentEnrollments) {
      if (!this.initialEnrollments.has(studentId)) {
        this.academyData.withdrawStudent(studentId, activity.id);
      }
    }

    // Matricular los que se eliminaron durante la sesión
    for (const studentId of this.initialEnrollments) {
      if (!currentEnrollments.has(studentId)) {
        this.academyData.enrollStudent(studentId, activity.id);
      }
    }

    this.close();
  }

  addStudent(student: Student): void {
    const activity = this.selectedClass();
    if (!activity) return;
    if (this.academyData.enrollmentCount(activity.id) >= activity.capacity) {
      this.toastService.warning('La clase ha alcanzado su capacidad máxima.');
      return;
    }
    if (!this.academyData.enrollStudent(student.id, activity.id)) {
      this.toastService.error('No se pudo matricular al alumno.');
      return;
    }
    this.toastService.success(`${this.fullName(student)} se ha añadido a ${activity.name}.`);
  }

  removeStudent(student: Student): void {
    const activity = this.selectedClass();
    if (!activity || !this.academyData.withdrawStudent(student.id, activity.id)) {
      this.toastService.error('No se pudo retirar al alumno de la clase.');
      return;
    }
    this.toastService.info(`${this.fullName(student)} ya no está matriculado en ${activity.name}.`);
  }

  fullName(student: Student): string {
    return [student.firstName, student.lastName].filter(Boolean).join(' ');
  }

  roleLabel(role: StudentRole): string {
    return { leader: 'Líder', follower: 'Follower', mixed: 'Ambos' }[role];
  }

  initials(student: Student): string {
    return [student.firstName, student.lastName]
      .filter(Boolean)
      .map((part) => part![0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
