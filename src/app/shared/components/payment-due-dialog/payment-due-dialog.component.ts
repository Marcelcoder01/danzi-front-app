import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import type { Student } from '../../interfaces/student.interface';
import { PaymentCheckboxComponent } from '../payment-checkbox/payment-checkbox.component';

@Component({
  selector: 'app-payment-due-dialog',
  standalone: true,
  imports: [FaIconComponent, PaymentCheckboxComponent],
  templateUrl: './payment-due-dialog.component.html',
})
export class PaymentDueDialogComponent {
  @Input() open = false;
  @Input() students: Student[] = [];
  @Output() closed = new EventEmitter<Student[]>();

  private readonly selectedStudents = new Map<string, Student>();

  readonly faXmark = faXmark;

  formatPaymentDate(date: string): string {
    return new Intl.DateTimeFormat('es', { dateStyle: 'long' }).format(
      new Date(`${date}T12:00:00`),
    );
  }

  isOverdue(date: string): boolean {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return date < today;
  }

  isSelected(student: Student): boolean {
    return this.selectedStudents.has(student.id);
  }

  togglePayment(student: Student, checked: boolean): void {
    if (checked) this.selectedStudents.set(student.id, student);
    else this.selectedStudents.delete(student.id);
  }

  close(): void {
    const selected = [...this.selectedStudents.values()];
    this.selectedStudents.clear();
    this.closed.emit(selected);
  }
}
