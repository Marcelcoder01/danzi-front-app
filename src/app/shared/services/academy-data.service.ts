import { Injectable, inject } from '@angular/core';
import { ClassActivity, RegularClassActivity } from '../interfaces/class-activity.interface';
import { Enrollment } from '../interfaces/enrollment.interface';
import { Student } from '../interfaces/student.interface';
import { ClassesDataService } from './classes-data.service';
import { EnrollmentsDataService } from './enrollments-data.service';
import { StudentsDataService } from './students-data.service';
import { AcademyActivityService } from './academy-activity.service';
import {
  getPaymentPeriodDays,
  getPaymentPeriodMonths,
} from '../utils/payment-period.util';

/** Coordinates relationships between the domain stores used by current screens. */
@Injectable({ providedIn: 'root' })
export class AcademyDataService {
  private readonly studentStore = inject(StudentsDataService);
  private readonly classStore = inject(ClassesDataService);
  private readonly enrollmentStore = inject(EnrollmentsDataService);
  private readonly activityStore = inject(AcademyActivityService);

  constructor() {
    this.initializeLegacyPaymentCycles();
    globalThis.setInterval(() => this.expirePaymentCycles(), 60_000);
  }
  get students(): Student[] { return this.studentStore.items; }
  get studentsVersion() { return this.studentStore.version; }
  get classes(): ClassActivity[] { return this.classStore.items; }
  get classesVersion() { return this.classStore.version; }
  get enrollments(): Enrollment[] { return this.enrollmentStore.items; }
  get enrollmentsVersion() { return this.enrollmentStore.version; }

  addStudent(student: Student): void {
    const newStudent = { ...student, paymentHistory: [...(student.paymentHistory ?? [])] };
    if (newStudent.status === 'inactive') {
      newStudent.hasPaid = false;
      newStudent.nextPaymentDate = null;
    }
    this.studentStore.add(newStudent);
    this.activityStore.record('student', `${this.fullName(newStudent)} se ha añadido a la academia.`, newStudent.id);
    if (newStudent.hasPaid) this.startPaymentCycle(newStudent, this.today());
  }
  updateStudent(student: Student): boolean {
    const previous = this.students.find((item) => item.id === student.id);
    if (!previous) return false;
    const wasPaid = previous.hasPaid;
    const updated = { ...student, paymentHistory: [...(student.paymentHistory ?? previous.paymentHistory ?? [])] };

    if (updated.status === 'inactive') {
      updated.hasPaid = false;
    } else if (updated.hasPaid && (!wasPaid || !updated.nextPaymentDate)) {
      this.startPaymentCycle(updated, this.today());
    }

    if (!this.studentStore.update(updated)) return false;
    return true;
  }
  removeStudent(id: string): boolean {
    const student = this.students.find((item) => item.id === id);
    if (!this.studentStore.remove(id)) return false;
    this.enrollmentStore.removeForStudent(id);
    if (student) this.activityStore.removeForStudent(id, this.fullName(student));
    return true;
  }
  addClass(activity: RegularClassActivity): void {
    this.classStore.add(activity);
    this.activityStore.record('class', `Se ha creado la clase ${activity.name}.`);
  }
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
    const student = this.students.find((item) => item.id === studentId)!;
    const activity = this.classes.find((item) => item.id === classId)!;
    this.activityStore.record('enrollment', `${this.fullName(student)} se ha matriculado en ${activity.name}.`, student.id);
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

  private fullName(student: Student): string {
    return [student.firstName, student.lastName].filter(Boolean).join(' ');
  }

  private startPaymentCycle(student: Student, paidAt: string): void {
    const months = this.paymentMonths(student);
    const amount = this.monthlyFee(student) * months;
    const paymentDate = student.paymentHistory?.length ? paidAt : student.startDate || paidAt;
    const nextPaymentDate = this.addDays(paymentDate, this.paymentDays(student));
    student.hasPaid = nextPaymentDate > this.today();
    student.status = student.hasPaid ? 'active' : 'inactive';
    student.paymentHistory = [...(student.paymentHistory ?? []), { paidAt: paymentDate, amount }];
    student.nextPaymentDate = nextPaymentDate;
    this.studentStore.update(student);
    this.recordPaymentActivity(student, paymentDate, amount);
  }

  private initializeLegacyPaymentCycles(): void {
    for (const student of this.students) {
      if (student.status !== 'active' || (!student.hasPaid && !student.nextPaymentDate)) continue;
      const paymentHistory = [...(student.paymentHistory ?? [])];
      if (!paymentHistory.length) {
        if (!student.hasPaid) continue;
        paymentHistory.push({
          paidAt: student.startDate || this.today(),
          amount: this.monthlyFee(student) * this.paymentMonths(student),
        });
      }
      const cycleStart = paymentHistory.length === 1
        ? student.startDate || paymentHistory[0].paidAt
        : paymentHistory[paymentHistory.length - 1].paidAt;
      const nextPaymentDate = this.addDays(cycleStart, this.paymentDays(student));
      const hasPaid = nextPaymentDate > this.today();
      const status = hasPaid ? 'active' : 'inactive';
      if (
        student.nextPaymentDate === nextPaymentDate &&
        student.paymentHistory?.length &&
        student.hasPaid === hasPaid &&
        student.status === status
      ) continue;
      this.studentStore.update({
        ...student,
        paymentHistory,
        nextPaymentDate,
        hasPaid,
        status,
      });
    }
  }

  private expirePaymentCycles(): void {
    const today = this.today();
    for (const student of this.students) {
      if (
        student.status === 'active' &&
        student.hasPaid &&
        student.nextPaymentDate &&
        student.nextPaymentDate <= today
      ) {
        this.studentStore.update({ ...student, hasPaid: false, status: 'inactive' });
      }
    }
  }

  private recordPaymentActivity(student: Student, paidAt: string, amount: number): void {
    const occurredAt = new Date(`${paidAt}T12:00:00`).toISOString();
    this.activityStore.record(
      'payment',
      `${this.fullName(student)} ha realizado un pago de ${amount.toFixed(2)} €.`,
      student.id,
      occurredAt,
    );
  }

  private paymentMonths(student: Student): number {
    return getPaymentPeriodMonths(student.paymentPeriod, student.paymentFrom, student.paymentTo);
  }

  private paymentDays(student: Student): number {
    return getPaymentPeriodDays(student.paymentPeriod, student.paymentFrom, student.paymentTo);
  }

  private monthlyFee(student: Student): number {
    return Math.max(0, Number(student.monthlyFee ?? 40) || 0);
  }

  private addDays(date: string, days: number): string {
    const result = new Date(`${date}T00:00:00Z`);
    result.setUTCDate(result.getUTCDate() + days);
    return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, '0')}-${String(result.getUTCDate()).padStart(2, '0')}`;
  }
}
