import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faArrowRight,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FaIconComponent, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  @ViewChild('loginVideo')
  loginVideo!: ElementRef<HTMLVideoElement>;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly faEnvelope = faEnvelope;
  readonly faLock = faLock;
  readonly faEye = faEye;
  readonly faEyeSlash = faEyeSlash;
  readonly faArrowRight = faArrowRight;
  readonly faUser = faUser;

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly isRegisterMode = signal(false);
  readonly isLoading = signal(false);

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    fullName: [''],
    confirmPassword: [''],
  });

  private videoRetry?: ReturnType<typeof setInterval>;

  async ngAfterViewInit(): Promise<void> {
    const video = this.loginVideo.nativeElement;

    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    video.playbackRate = 0.8;

    this.playVideo(video);

    video.addEventListener('canplay', () => {
      this.playVideo(video);
    });

    this.videoRetry = setInterval(() => {
      if (video.paused || video.ended) {
        this.playVideo(video);
      }
    }, 1000);
  }

  private playVideo(video: HTMLVideoElement): void {
    video.play().catch(() => {
      // El navegador puede rechazar temporalmente el autoplay.
      // Se volverá a intentar mediante el watchdog.
    });
  }

  ngOnDestroy(): void {
    if (this.videoRetry) {
      clearInterval(this.videoRetry);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      this.toastService.warning('Por favor, completa todos los campos requeridos.');
      return;
    }

    this.isLoading.set(true);

    if (this.isRegisterMode()) {
      await this.register();
    } else {
      await this.login();
    }
  }

  private async register(): Promise<void> {
    const { email, password, fullName } = this.loginForm.value;

    try {
      const { data, error } = await this.authService.signUp(
        email.trim(),
        password,
        fullName.trim(),
      );

      if (error) {
        this.toastService.error(this.getAuthError(error.message));
        return;
      }

      if (data.session) {
        this.toastService.success('¡Cuenta creada correctamente!');
        await this.router.navigateByUrl('/start');
      } else {
        this.toastService.success('¡Cuenta creada! Revisa tu correo para confirmar tu dirección.');
        this.loginForm.reset();
        this.toggleMode();
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.toastService.error('Ha ocurrido un error durante el registro.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async login(): Promise<void> {
    const { email, password } = this.loginForm.value;

    try {
      const { data, error } = await this.authService.signIn(email.trim(), password);

      if (error) {
        this.toastService.error(this.getAuthError(error.message));
        return;
      }

      if (!data.session) {
        this.toastService.error('No se ha podido iniciar la sesión.');
        return;
      }

      this.toastService.success('¡Bienvenido de nuevo!');
      await this.router.navigateByUrl('/start');
    } catch (error) {
      console.error('Login error:', error);
      this.toastService.error('Ha ocurrido un error al iniciar sesión.');
    } finally {
      this.isLoading.set(false);
    }
  }

  forgotPassword(): void {
    this.router.navigate(['/reset-password']);
  }

  private getAuthError(message: string): string {
    const normalized = message.toLowerCase();

    if (normalized.includes('invalid login credentials')) {
      return 'Email o contraseña incorrectos.';
    }

    if (normalized.includes('already registered')) {
      return 'Este email ya está registrado.';
    }

    if (normalized.includes('email not confirmed')) {
      return 'Debes confirmar tu email antes de iniciar sesión.';
    }

    if (normalized.includes('password')) {
      return 'La contraseña no cumple los requisitos de seguridad.';
    }

    return 'No se ha podido completar la operación. Inténtalo de nuevo.';
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  toggleMode(): void {
    this.isRegisterMode.update((v) => !v);
    this.showPassword.set(false);
    this.showConfirmPassword.set(false);
    this.loginForm.reset();

    // Actualizar validadores según el modo
    if (this.isRegisterMode()) {
      this.loginForm.get('fullName')?.setValidators([Validators.required]);
      this.loginForm
        .get('confirmPassword')
        ?.setValidators([Validators.required, this.passwordMatchValidator()]);
    } else {
      this.loginForm.get('fullName')?.clearValidators();
      this.loginForm.get('confirmPassword')?.clearValidators();
    }

    this.loginForm.get('fullName')?.updateValueAndValidity();
    this.loginForm.get('confirmPassword')?.updateValueAndValidity();
  }

  private passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.parent?.get('password')?.value;
      const confirmPassword = control.value;

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
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  get fullNameControl() {
    return this.loginForm.get('fullName');
  }

  get confirmPasswordControl() {
    return this.loginForm.get('confirmPassword');
  }
}
