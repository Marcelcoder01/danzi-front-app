import { Component, computed, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faEnvelope,
  faPhone,
  faUser,
  faUserPlus,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import type { Student } from '../../../shared/interfaces/student.interface';
import { getPaymentPeriodMonths } from '../../../shared/utils/payment-period.util';
import { StudentLevel } from '../../../shared/interfaces/student-level.enum';
import type { StudentRole, StudentStatus } from '../../../shared/interfaces/student-status.type';
import { PaymentCheckboxComponent } from './payment-checkbox/payment-checkbox.component';

type StudentFormControls = {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  alias: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  instagram: FormControl<string>;
  photoUrl: FormControl<string>;
  birthDate: FormControl<string>;
  startDate: FormControl<string>;
  level: FormControl<StudentLevel>;
  status: FormControl<StudentStatus>;
  role: FormControl<StudentRole>;
  hasPaid: FormControl<boolean>;
  monthlyFee: FormControl<number>;
  paymentPeriod: FormControl<'1' | '2' | 'custom'>;
  paymentFrom: FormControl<string | null>;
  paymentTo: FormControl<string | null>;
};

type StudentFormValue = {
  [Key in keyof StudentFormControls]: StudentFormControls[Key]['value'];
};

@Component({
  selector: 'app-student-dialog',
  standalone: true,
  templateUrl: './student-dialog.component.html',
  styleUrl: './student-dialog.component.css',
  imports: [ReactiveFormsModule, FaIconComponent, PaymentCheckboxComponent],
})
export class StudentDialogComponent {
  readonly createStudent = output<Omit<Student, 'id'>>();
  readonly updateStudent = output<Student>();

  readonly faXmark = faXmark;
  readonly faUserPlus = faUserPlus;
  readonly faUser = faUser;
  readonly faEnvelope = faEnvelope;
  readonly faPhone = faPhone;
  readonly faArrowRight = faArrowRight;

  readonly isEdit = signal(false);
  private readonly editingStudentId = signal<string | null>(null);
  private readonly wasPaidWhenOpened = signal(false);
  private readonly paymentMetadata = signal<Pick<Student, 'nextPaymentDate' | 'paymentHistory'>>({
    nextPaymentDate: null,
    paymentHistory: [],
  });

  readonly form = new FormGroup<StudentFormControls>({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true }),
    alias: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    phone: new FormControl('', { nonNullable: true }),
    instagram: new FormControl('', { nonNullable: true }),
    photoUrl: new FormControl('', { nonNullable: true }),
    birthDate: new FormControl('', { nonNullable: true }),
    startDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    level: new FormControl(StudentLevel.A1, { nonNullable: true }),
    status: new FormControl<StudentStatus>('inactive', { nonNullable: true }),
    role: new FormControl<StudentRole>('follower', { nonNullable: true }),
    hasPaid: new FormControl(false, { nonNullable: true }),
    monthlyFee: new FormControl(40, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    paymentPeriod: new FormControl<'1' | '2' | 'custom'>('1', { nonNullable: true }),
    paymentFrom: new FormControl<string | null>(null),
    paymentTo: new FormControl<string | null>(null),
  });

  readonly formValue = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });
  readonly isPaid = computed(() => this.formValue().hasPaid);
  readonly paymentMonths = computed(() => {
    const value = this.formValue();
    if (
      value.hasPaid &&
      value.paymentPeriod === 'custom' &&
      (!value.paymentFrom || !value.paymentTo || value.paymentTo < value.paymentFrom)
    ) {
      return 0;
    }
    return getPaymentPeriodMonths(value.paymentPeriod, value.paymentFrom, value.paymentTo);
  });
  readonly paymentTotal = computed(
    () => Math.max(0, this.formValue().monthlyFee || 0) * this.paymentMonths(),
  );
  readonly nextPaymentLabel = computed(() => {
    if (!this.isPaid()) return '';
    const date =
      this.paymentMetadata().nextPaymentDate ?? this.addMonths(this.today(), this.paymentMonths());
    return new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(
      new Date(`${date}T12:00:00`),
    );
  });

  readonly studentLevels = Object.values(StudentLevel);
  readonly studentLevelsLabels: Record<StudentLevel, string> = {
    [StudentLevel.A1]: 'Principiante 1',
    [StudentLevel.A2]: 'Principiante 2',
    [StudentLevel.A3]: 'Principiante 3',
    [StudentLevel.B1]: 'Intermedio 1',
    [StudentLevel.B2]: 'Intermedio 2',
    [StudentLevel.B3]: 'Intermedio 3',
    [StudentLevel.C1]: 'Avanzado 1',
    [StudentLevel.C2]: 'Avanzado 2',
    [StudentLevel.C3]: 'Avanzado 3',
    [StudentLevel.ALL_LEVELS]: 'Todos los niveles',
  };

  readonly studentStatuses: StudentStatus[] = ['active', 'inactive', 'paused'];
  readonly studentStatusesLabels: Record<StudentStatus, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    paused: 'Pausado',
  };

  readonly studentRoles: StudentRole[] = ['leader', 'follower', 'mixed'];
  readonly studentRolesLabels: Record<StudentRole, string> = {
    leader: 'Líder',
    follower: 'Follower',
    mixed: 'Ambos',
  };

  onSubmit(): void {
    const value = this.form.getRawValue();
    if (this.form.invalid || !this.isPaymentPeriodValid(value)) {
      this.form.markAllAsTouched();
      return;
    }

    if (value.hasPaid && (!this.isEdit() || !this.wasPaidWhenOpened())) {
      this.form.controls.status.setValue('active');
    }

    const studentData: Omit<Student, 'id'> = {
      ...this.form.getRawValue(),
      ...this.paymentMetadata(),
    };

    const studentId = this.editingStudentId();
    if (this.isEdit() && studentId) {
      this.updateStudent.emit({ ...studentData, id: studentId });
    } else {
      this.createStudent.emit(studentData);
    }

    this.closeDialog();
    this.resetForm();
  }

  openForCreate(): void {
    this.resetForm();
    this.isEdit.set(false);
    this.editingStudentId.set(null);
    this.wasPaidWhenOpened.set(false);
    this.showDialog();
  }

  openForEdit(student: Student): void {
    this.form.reset({
      ...this.createEmptyStudent(),
      ...student,
      monthlyFee: student.monthlyFee ?? 40,
      paymentPeriod: student.paymentPeriod ?? '1',
    });
    this.paymentMetadata.set({
      nextPaymentDate: student.nextPaymentDate ?? null,
      paymentHistory: student.paymentHistory ?? [],
    });
    this.isEdit.set(true);
    this.editingStudentId.set(student.id);
    this.wasPaidWhenOpened.set(student.hasPaid);
    this.showDialog();
  }

  onPaymentChange(checked: boolean): void {
    this.form.controls.hasPaid.setValue(checked);
    if (checked) {
      this.form.controls.status.setValue('active');
    } else {
      this.paymentMetadata.update((metadata) => ({ ...metadata, nextPaymentDate: null }));
    }
  }

  closeDialog(): void {
    (document.getElementById('student_dialog') as HTMLDialogElement | null)?.close();
  }

  private createEmptyStudent(): Omit<Student, 'id'> {
    return {
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
      status: 'inactive',
      role: 'follower',
      hasPaid: false,
      monthlyFee: 40,
      paymentPeriod: '1',
      paymentFrom: null,
      paymentTo: null,
      nextPaymentDate: null,
      paymentHistory: [],
    };
  }

  private resetForm(): void {
    this.form.reset(this.createEmptyStudent());
    this.paymentMetadata.set({ nextPaymentDate: null, paymentHistory: [] });
  }

  private isPaymentPeriodValid(value: StudentFormValue): boolean {
    return !(
      value.hasPaid &&
      value.paymentPeriod === 'custom' &&
      (!value.paymentFrom || !value.paymentTo || value.paymentTo < value.paymentFrom)
    );
  }

  private today(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private addMonths(date: string, months: number): string {
    const [year, month, day] = date.split('-').map(Number);
    const target = new Date(Date.UTC(year, month - 1 + months, 1));
    const lastDay = new Date(
      Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
    ).getUTCDate();
    target.setUTCDate(Math.min(day, lastDay));
    return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, '0')}-${String(target.getUTCDate()).padStart(2, '0')}`;
  }

  private showDialog(): void {
    (document.getElementById('student_dialog') as HTMLDialogElement | null)?.showModal();
  }
}
