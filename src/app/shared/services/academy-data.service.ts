import { Injectable, inject } from '@angular/core';
import { ClassActivity, RegularClassActivity } from '../interfaces/class-activity.interface';
import { Enrollment } from '../interfaces/enrollment.interface';
import { Student } from '../interfaces/student.interface';
import { ClassesDataService } from './classes-data.service';
import { EnrollmentsDataService } from './enrollments-data.service';
import { StudentsDataService } from './students-data.service';

/** Coordinates relationships between the domain stores used by current screens. */
@Injectable({ providedIn: 'root' })
export class AcademyDataService {
  private readonly studentStore = inject(StudentsDataService);
  private readonly classStore = inject(ClassesDataService);
  private readonly enrollmentStore = inject(EnrollmentsDataService);
  get students(): Student[] { return this.studentStore.items; }
  get studentsVersion() { return this.studentStore.version; }
  get classes(): ClassActivity[] { return this.classStore.items; }
  get classesVersion() { return this.classStore.version; }
  get enrollments(): Enrollment[] { return this.enrollmentStore.items; }
  get enrollmentsVersion() { return this.enrollmentStore.version; }

  addStudent(student: Student): void { this.studentStore.add(student); }
  updateStudent(student: Student): boolean { return this.studentStore.update(student); }
  addClass(activity: RegularClassActivity): void { this.classStore.add(activity); }
  updateClass(activity: RegularClassActivity): boolean { return this.classStore.update(activity); }
  removeClass(id: string): boolean {
    if (!this.classStore.remove(id)) return false;
    this.enrollmentStore.removeForClass(id);
    return true;
  }

  studentsForClass(classId: string, date = this.today()): Student[] {
    const ids = new Set(this.enrollments.filter((e) => e.classId === classId && e.enrolledAt <= date && (!e.withdrawnAt || e.withdrawnAt > date)).map((e) => e.studentId));
    return this.students.filter((student) => ids.has(student.id));
  }
  classesForStudent(studentId: string): ClassActivity[] {
    const ids = new Set(this.enrollments.filter((e) => e.studentId === studentId && !e.withdrawnAt).map((e) => e.classId));
    return this.classes.filter((activity) => ids.has(activity.id));
  }
  enrollmentCount(classId: string): number {
    const today = this.today();
    return this.enrollments.filter((e) => e.classId === classId && e.enrolledAt <= today && (!e.withdrawnAt || e.withdrawnAt > today)).length;
  }
  isEnrolled(studentId: string, classId: string, date: string): boolean {
    return this.enrollments.some((e) => e.studentId === studentId && e.classId === classId && e.enrolledAt <= date && (!e.withdrawnAt || e.withdrawnAt > date));
  }
  enrollStudent(studentId: string, classId: string): boolean {
    const today = this.today();
    if (!this.students.some((s) => s.id === studentId) || !this.classes.some((c) => c.id === classId && c.type === 'class') || this.isEnrolled(studentId, classId, today)) return false;
    this.enrollmentStore.add({ id: `enrollment-${globalThis.crypto.randomUUID()}`, studentId, classId, enrolledAt: today });
    return true;
  }
  withdrawStudent(studentId: string, classId: string): boolean {
    const today = this.today();
    const enrollment = this.enrollments.find((e) => e.studentId === studentId && e.classId === classId && e.enrolledAt <= today && (!e.withdrawnAt || e.withdrawnAt > today));
    if (!enrollment) return false;
    enrollment.withdrawnAt = today;
    // Persist withdrawal through the store's public mutation boundary.
    this.enrollmentStore.persistChanges();
    return true;
  }
  private today(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}
