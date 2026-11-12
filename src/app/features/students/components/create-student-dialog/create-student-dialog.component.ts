import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faEnvelope,
  faPhone,
  faUser,
  faUserPlus,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { DANCE_ROLES, DANCE_ROLE_LABELS, DanceRole } from '../../models/organization-student.model';

export interface CreateStudentFormValue {
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  danceRole: DanceRole;
}

/**
 * Diálogo presentacional para crear una ficha manual en Supabase.
 * Solo contiene los campos aceptados por la RPC `create_student`.
 */
@Component({
  selector: 'app-create-student-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FaIconComponent],
  templateUrl: './create-student-dialog.component.html',
})
export class CreateStudentDialogComponent {
  @ViewChild('dialog') private dialog?: ElementRef<HTMLDialogElement>;
  private readonly cdr = inject(ChangeDetectorRef);

  readonly saving = input(false);
  readonly organizationName = input<string | null>(null);
  readonly submitted = output<CreateStudentFormValue>();

  readonly faXmark = faXmark;
  readonly faUserPlus = faUserPlus;
  readonly faUser = faUser;
  readonly faEnvelope = faEnvelope;
  readonly faPhone = faPhone;
  readonly faArrowRight = faArrowRight;
  readonly danceRoles = DANCE_ROLES;
  readonly danceRoleLabels = DANCE_ROLE_LABELS;

  readonly form = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(/^[+\d][\d\s().-]{5,19}$/)],
    }),
    danceRole: new FormControl<DanceRole>('follower', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      if (this.saving()) this.form.disable({ emitEvent: false });
      else this.form.enable({ emitEvent: false });
    });
  }

  open(): void {
    this.form.reset();
    // Se invoca desde el padre: con OnPush hay que marcar la vista para limpiar errores previos.
    this.cdr.markForCheck();
    this.dialog?.nativeElement.showModal();
  }

  close(): void {
    this.dialog?.nativeElement.close();
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const optional = (text: string) => text.trim() || null;
    this.submitted.emit({
      firstName: value.firstName.trim(),
      lastName: optional(value.lastName),
      email: optional(value.email)?.toLowerCase() ?? null,
      phone: optional(value.phone),
      danceRole: value.danceRole,
    });
  }

  hasError(control: 'firstName' | 'email' | 'phone', error: string): boolean {
    const field = this.form.controls[control];
    return field.touched && field.hasError(error);
  }
}
