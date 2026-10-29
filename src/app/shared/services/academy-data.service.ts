import { Injectable, inject } from '@angular/core';
import { ClassActivity, RegularClassActivity } from '../interfaces/class-activity.interface';
import { Enrollment } from '../interfaces/enrollment.interface';
import { Student } from '../interfaces/student.interface';
import { ClassesDataService } from './classes-data.service';
import { EnrollmentsDataService } from './enrollments-data.service';
import { StudentsDataService } from './students-data.service';
import { AcademyActivityService } from './academy-activity.service';
import { getPaymentPeriodMonths } from '../utils/payment-period.util';

/** Coordinates relationships between the domain stores used by current screens. */
@Injectable({ providedIn: 'root' })
export class AcademyDataService {
  private readonly studentStore = inject(StudentsDataService);
  private readonly classStore = inject(ClassesDataService);
  private readonly enrollmentStore = inject(EnrollmentsDataService);
  private readonly activityStore = inject(AcademyActivityService);

  constructor() {
    this.initializeLegacyPaymentCycles();
    this.processDuePayments();
    globalThis.setInterval(() => this.processDuePayments(), 60_000);
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
      updated.nextPaymentDate = null;
    } else if (updated.hasPaid && (!wasPaid || !updated.nextPaymentDate)) {
      this.startPaymentCycle(updated, this.today());
    } else if (!updated.hasPaid) {
      updated.nextPaymentDate = null;
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
    student.hasPaid = true;
    student.status = 'active';
    student.paymentHistory = [...(student.paymentHistory ?? []), { paidAt, amount }];
    student.nextPaymentDate = this.addMonths(paidAt, months);
    this.studentStore.update(student);
    this.recordPaymentActivity(student, paidAt, amount);
  }

  private processDuePayments(): void {
    const today = this.today();
    for (const student of [...this.students]) {
      if (student.status !== 'active' || !student.hasPaid || !student.nextPaymentDate) continue;
      if (student.nextPaymentDate > today) continue;

      const updated = { ...student, paymentHistory: [...(student.paymentHistory ?? [])] };
      let dueDate = updated.nextPaymentDate;
      let processed = 0;
      while (dueDate && dueDate <= today && processed < 240) {
        const months = this.paymentMonths(updated);
        const amount = this.monthlyFee(updated) * months;
        updated.paymentHistory.push({ paidAt: dueDate, amount });
        this.recordPaymentActivity(updated, dueDate, amount);
        dueDate = this.addMonths(dueDate, months);
        processed++;
      }
      updated.nextPaymentDate = dueDate;
      if (processed) this.studentStore.update(updated);
    }
  }

  private initializeLegacyPaymentCycles(): void {
    const today = this.today();
    for (const student of this.students) {
      if (student.status !== 'active' || !student.hasPaid || student.nextPaymentDate) continue;
      const months = this.paymentMonths(student);
      const paymentHistory = [...(student.paymentHistory ?? [])];
      if (!paymentHistory.length) {
        paymentHistory.push({ paidAt: today, amount: this.monthlyFee(student) * months });
      }
      this.studentStore.update({
        ...student,
        paymentHistory,
        nextPaymentDate: this.addMonths(today, months),
      });
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

  private monthlyFee(student: Student): number {
    return Math.max(0, Number(student.monthlyFee ?? 40) || 0);
  }

  private addMonths(date: string, months: number): string {
    const [year, month, day] = date.split('-').map(Number);
    const target = new Date(Date.UTC(year, month - 1 + months, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(day, lastDay));
    return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, '0')}-${String(target.getUTCDate()).padStart(2, '0')}`;
  }
}
