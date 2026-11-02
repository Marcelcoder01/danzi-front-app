import { Component, inject, signal } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faArrowLeft,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FaIconComponent, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly faEnvelope = faEnvelope;
  readonly faLock = faLock;
  readonly faEye = faEye;
  readonly faEyeSlash = faEyeSlash;
  readonly faArrowLeft = faArrowLeft;
  readonly faCheck = faCheck;

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly isLoading = signal(false);
  readonly isUpdateMode = signal(false);
  readonly isEmailSent = signal(false);

  readonly emailForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly passwordForm: FormGroup = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: [''],
    },
    { validators: this.passwordMatchValidator() },
  );

  constructor() {
    // Verificar si viene de un link de reset (token en la URL)
    this.route.queryParams.subscribe((params) => {
      if (params['access_token']) {
        this.isUpdateMode.set(true);
      }
    });
  }

  async sendResetEmail(): Promise<void> {
    if (this.emailForm.invalid) {
      this.markFormGroupTouched(this.emailForm);
      this.toastService.warning('Por favor, introduce un email válido.');
      return;
    }

    this.isLoading.set(true);

    const { email } = this.emailForm.value;

    try {
      const { error } = await this.authService.resetPassword(email.trim());

      if (error) {
        this.toastService.error(this.getAuthError(error.message));
        return;
      }

      this.isEmailSent.set(true);
      this.toastService.success(
        'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.',
      );
    } catch (error) {
      console.error('Password reset error:', error);
      this.toastService.error('No se ha podido procesar la solicitud.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async updatePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      this.toastService.warning('Por favor, completa todos los campos requeridos.');
      return;
    }

    this.isLoading.set(true);

    const { password } = this.passwordForm.value;

    try {
      const { error } = await this.authService.updatePassword(password);

      if (error) {
        this.toastService.error(this.getAuthError(error.message));
        return;
      }

      this.toastService.success('¡Contraseña actualizada correctamente!');
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Password update error:', error);
      this.toastService.error('No se ha podido actualizar la contraseña.');
    } finally {
      this.isLoading.set(false);
    }
  }

  backToLogin(): void {
    this.router.navigate(['/login']);
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  private getAuthError(message: string): string {
    const normalized = message.toLowerCase();

    if (normalized.includes('email not confirmed')) {
      return 'Debes confirmar tu email antes de continuar.';
    }

    if (normalized.includes('invalid email')) {
      return 'El email no es válido.';
    }

    return 'No se ha podido completar la operación. Inténtalo de nuevo.';
  }

  private passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;

      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  get passwordIcon() {
    return this.showPassword() ? this.faEyeSlash : this.faEye;
  }

  get confirmPasswordIcon() {
    return this.showConfirmPassword() ? this.faEyeSlash : this.faEye;
  }

  get emailControl() {
    return this.emailForm.get('email')!;
  }

  get passwordControl() {
    return this.passwordForm.get('password')!;
  }

  get confirmPasswordControl() {
    return this.passwordForm.get('confirmPassword')!;
  }
}
