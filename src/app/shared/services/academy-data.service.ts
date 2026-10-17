import { Injectable } from '@angular/core';
import { DEMO_CLASSES, DEMO_ENROLLMENTS, DEMO_STUDENTS } from '../data/demo-school.data';
import { ClassActivity } from '../interfaces/class-activity.interface';
import { Enrollment } from '../interfaces/enrollment.interface';
import { Student } from '../interfaces/student.interface';

@Injectable({ providedIn: 'root' })
export class AcademyDataService {
  readonly students: Student[] = DEMO_STUDENTS;
  readonly classes: ClassActivity[] = DEMO_CLASSES;
  readonly enrollments: Enrollment[] = DEMO_ENROLLMENTS;

  studentsForClass(classId: string, date?: string): Student[] {
    const enrollmentStudentIds = new Set(
      this.enrollments
        .filter(
          (enrollment) =>
            enrollment.classId === classId &&
            enrollment.enrolledAt <= (date ?? '9999-12-31') &&
            (!enrollment.withdrawnAt || enrollment.withdrawnAt > (date ?? '9999-12-31')),
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
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
}
