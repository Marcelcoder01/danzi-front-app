import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCalendar, faEnvelope, faPhone, faUser } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '@core/services/auth.service';
import { UserProfileService } from '@domain/profile/services/user-profile.service';
import { ToastService } from '@shared/services/toast.service';
import { UserProfile } from '@domain/profile/models/user-profile.model';
import { StateMessageComponent } from '@shared/components/state-message/state-message.component';
import { errorMessage } from '@core/supabase/supabase-error';

/** Perfil global del usuario (`public.users`). El email se gestiona en Supabase Auth. */
@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FaIconComponent, StateMessageComponent],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  private readonly profileService = inject(UserProfileService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly faUser = faUser;
  readonly faPhone = faPhone;
  readonly faCalendar = faCalendar;
  readonly faEnvelope = faEnvelope;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly notFound = signal(false);

  readonly form = new FormGroup({
    displayName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(120)],
    }),
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(/^[+\d][\d\s().-]{5,19}$/)],
    }),
    dateOfBirth: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const profile = await this.profileService.load(true);
      this.notFound.set(!profile);
      if (profile) this.fillForm(profile);
    } catch (error) {
      this.error.set(errorMessage(error, 'No se ha podido cargar tu perfil.'));
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const optional = (text: string) => text.trim() || null;
    const firstName = value.firstName.trim();
    const lastName = value.lastName.trim();

    this.saving.set(true);
    this.form.disable();
    try {
      const profile = await this.profileService.update({
        displayName: optional(value.displayName) ?? `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        phone: optional(value.phone),
        dateOfBirth: optional(value.dateOfBirth),
      });
      this.fillForm(profile);
      this.toast.success('Perfil actualizado correctamente.');
    } catch (error) {
      this.toast.error(errorMessage(error));
    } finally {
      this.form.enable();
      this.saving.set(false);
    }
  }

  hasError(control: 'firstName' | 'lastName' | 'phone' | 'displayName', error: string): boolean {
    const field = this.form.controls[control];
    return field.touched && field.hasError(error);
  }

  private fillForm(profile: UserProfile): void {
    this.form.reset({
      displayName: profile.displayName ?? '',
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      phone: profile.phone ?? '',
      dateOfBirth: profile.dateOfBirth ?? '',
    });
  }
}
