import { Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faLink, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { slugValidator, slugify } from '../../../shared/utils/slug.util';

export interface JoinOrganizationFormValue {
  slug: string;
  message: string | null;
}

/** Formulario presentacional para solicitar unirse a una academia por su slug. */
@Component({
  selector: 'app-join-organization-form',
  standalone: true,
  imports: [ReactiveFormsModule, FaIconComponent],
  templateUrl: './join-organization-form.component.html',
})
export class JoinOrganizationFormComponent {
  readonly sending = input(false);
  /** Incrementar desde el contenedor para limpiar el formulario tras un envío correcto. */
  readonly resetToken = input(0);
  readonly submitted = output<JoinOrganizationFormValue>();

  readonly faLink = faLink;
  readonly faPaperPlane = faPaperPlane;
  readonly messageMaxLength = 500;

  readonly form = new FormGroup({
    slug: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, slugValidator()],
    }),
    message: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(this.messageMaxLength)],
    }),
  });

  constructor() {
    effect(() => {
      if (this.sending()) this.form.disable({ emitEvent: false });
      else this.form.enable({ emitEvent: false });
    });
    effect(() => {
      if (this.resetToken()) this.form.reset();
    });
  }

  normalizeSlug(): void {
    const control = this.form.controls.slug;
    control.setValue(slugify(control.value));
  }

  onSubmit(): void {
    this.normalizeSlug();
    if (this.form.invalid || this.sending()) {
      this.form.markAllAsTouched();
      return;
    }
    const { slug, message } = this.form.getRawValue();
    this.submitted.emit({ slug, message: message.trim() || null });
  }

  hasError(error: string): boolean {
    const field = this.form.controls.slug;
    return field.touched && field.hasError(error);
  }
}
