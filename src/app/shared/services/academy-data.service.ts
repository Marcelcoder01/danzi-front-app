import { Injectable, signal } from '@angular/core';
import { DEMO_CLASSES, DEMO_ENROLLMENTS, DEMO_STUDENTS } from '../data/demo-school.data';
import { ClassActivity, RegularClassActivity } from '../interfaces/class-activity.interface';
import { Enrollment } from '../interfaces/enrollment.interface';
import { Student } from '../interfaces/student.interface';

@Injectable({ providedIn: 'root' })
export class AcademyDataService {
  readonly students: Student[] = DEMO_STUDENTS;
  readonly studentsVersion = signal(0);
  readonly classes: ClassActivity[] = DEMO_CLASSES;
  readonly classesVersion = signal(0);
  readonly enrollments: Enrollment[] = DEMO_ENROLLMENTS;
  readonly enrollmentsVersion = signal(0);

  addStudent(student: Student): void {
    this.students.push(student);
    this.studentsVersion.update((version) => version + 1);
  }

  updateStudent(updatedStudent: Student): boolean {
    const currentStudent = this.students.find((student) => student.id === updatedStudent.id);
    if (!currentStudent) return false;

    Object.assign(currentStudent, updatedStudent);
    this.studentsVersion.update((version) => version + 1);
    return true;
  }

  addClass(activity: RegularClassActivity): void {
    this.classes.push(activity);
    this.classesVersion.update((version) => version + 1);
  }

  updateClass(updatedClass: RegularClassActivity): boolean {
    const currentClass = this.classes.find(
      (activity) => activity.id === updatedClass.id && activity.type === 'class',
    );
    if (!currentClass) return false;

    Object.assign(currentClass, updatedClass);
    this.classesVersion.update((version) => version + 1);
    return true;
  }

  removeClass(classId: string): boolean {
    const classIndex = this.classes.findIndex(
      (activity) => activity.id === classId && activity.type === 'class',
    );
    if (classIndex < 0) return false;

    this.classes.splice(classIndex, 1);
    const remainingEnrollments = this.enrollments.filter(
      (enrollment) => enrollment.classId !== classId,
    );
    this.enrollments.splice(0, this.enrollments.length, ...remainingEnrollments);
    this.classesVersion.update((version) => version + 1);
    this.enrollmentsVersion.update((version) => version + 1);
    return true;
  }

  studentsForClass(classId: string, date?: string): Student[] {
    const asOfDate = date ?? this.today();
    const enrollmentStudentIds = new Set(
      this.enrollments
        .filter(
          (enrollment) =>
            enrollment.classId === classId &&
            enrollment.enrolledAt <= asOfDate &&
            (!enrollment.withdrawnAt || enrollment.withdrawnAt > asOfDate),
        )
        .map((enrollment) => enrollment.studentId),
    );
    return this.students.filter((student) => enrollmentStudentIds.has(student.id));
  }

  classesForStudent(studentId: string): ClassActivity[] {
    const classIds = new Set(
      this.enrollments
        .filter((enrollment) => enrollment.studentId === studentId && !enrollment.withdrawnAt)
        .map((enrollment) => enrollment.classId),
    );
    return this.classes.filter((activity) => classIds.has(activity.id));
  }

  enrollmentCount(classId: string): number {
    const today = this.today();
    return this.enrollments.filter(
      (enrollment) =>
        enrollment.classId === classId &&
        enrollment.enrolledAt <= today &&
        (!enrollment.withdrawnAt || enrollment.withdrawnAt > today),
    ).length;
  }

  isEnrolled(studentId: string, classId: string, date: string): boolean {
    return this.enrollments.some(
      (enrollment) =>
        enrollment.studentId === studentId &&
        enrollment.classId === classId &&
        enrollment.enrolledAt <= date &&
        (!enrollment.withdrawnAt || enrollment.withdrawnAt > date),
    );
  }

  enrollStudent(studentId: string, classId: string): boolean {
    const today = this.today();
    if (!this.students.some((student) => student.id === studentId)) return false;
    if (!this.classes.some((activity) => activity.id === classId && activity.type === 'class')) {
      return false;
    }
    if (this.isEnrolled(studentId, classId, today)) return false;

    this.enrollments.push({
      id: `enrollment-${globalThis.crypto.randomUUID()}`,
      studentId,
      classId,
      enrolledAt: today,
    });
    this.enrollmentsVersion.update((version) => version + 1);
    return true;
  }

  withdrawStudent(studentId: string, classId: string): boolean {
    const today = this.today();
    const enrollment = this.enrollments.find(
      (item) =>
        item.studentId === studentId &&
        item.classId === classId &&
        item.enrolledAt <= today &&
        (!item.withdrawnAt || item.withdrawnAt > today),
    );
    if (!enrollment) return false;

    enrollment.withdrawnAt = today;
    this.enrollmentsVersion.update((version) => version + 1);
    return true;
  }

  private today(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}
