import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faBuilding, faLink } from '@fortawesome/free-solid-svg-icons';
import {
  CreateOrganizationInput,
  ORGANIZATION_TYPE_LABELS,
  OrganizationType,
} from '../../models/organization.model';
import { DanceStyle } from '../../models/dance-style.model';
import {
  SLUG_MAX_LENGTH,
  SLUG_MIN_LENGTH,
  slugValidator,
  slugify,
} from '../../../../shared/utils/slug.util';

/** Formulario presentacional de alta de academia. La creación la realiza el contenedor. */
@Component({
  selector: 'app-create-organization-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FaIconComponent],
  templateUrl: './create-organization-form.component.html',
})
export class CreateOrganizationFormComponent {
  readonly saving = input(false);
  readonly danceStyles = input<DanceStyle[]>([]);
  readonly submitted = output<CreateOrganizationInput>();

  readonly faBuilding = faBuilding;
  readonly faLink = faLink;
  readonly faArrowRight = faArrowRight;
  readonly slugMinLength = SLUG_MIN_LENGTH;
  readonly slugMaxLength = SLUG_MAX_LENGTH;
  readonly types = Object.entries(ORGANIZATION_TYPE_LABELS) as [OrganizationType, string][];

  private slugEditedManually = false;

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(120)],
    }),
    slug: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, slugValidator()],
    }),
    type: new FormControl<OrganizationType>('academy', { nonNullable: true }),
    // Pendiente de backend: la asociación con `organization_dance_styles` aún no tiene contrato.
    danceStyleIds: new FormControl<string[]>({ value: [], disabled: true }, { nonNullable: true }),
  });

  constructor() {
    this.form.controls.name.valueChanges.pipe(takeUntilDestroyed()).subscribe((name) => {
      if (!this.slugEditedManually) {
        this.form.controls.slug.setValue(slugify(name), { emitEvent: false });
      }
    });
    effect(() => {
      if (this.saving()) this.form.disable({ emitEvent: false });
      else {
        this.form.enable({ emitEvent: false });
        this.form.controls.danceStyleIds.disable({ emitEvent: false });
      }
    });
  }

  onSlugInput(): void {
    this.slugEditedManually = true;
  }

  normalizeSlug(): void {
    const control = this.form.controls.slug;
    control.setValue(slugify(control.value));
    this.slugEditedManually = !!control.value;
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, slug, type } = this.form.getRawValue();
    this.submitted.emit({ name: name.trim(), slug: slug.trim(), type });
  }

  hasError(control: 'name' | 'slug', error: string): boolean {
    const field = this.form.controls[control];
    return field.touched && field.hasError(error);
  }
}
