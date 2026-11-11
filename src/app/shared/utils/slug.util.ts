import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 60;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Convierte un texto libre en un identificador URL-safe: "Academia Ñandú" → "academia-nandu". */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, '');
}

export function slugValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = (control.value ?? '').trim();
    if (!value) return null;
    if (value.length < SLUG_MIN_LENGTH || value.length > SLUG_MAX_LENGTH) {
      return { slugLength: { min: SLUG_MIN_LENGTH, max: SLUG_MAX_LENGTH } };
    }
    return SLUG_PATTERN.test(value) ? null : { slugFormat: true };
  };
}
