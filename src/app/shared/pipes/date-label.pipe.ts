import { Pipe, PipeTransform } from '@angular/core';

const FORMATTER = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' });

/** Fecha legible en español a partir de un ISO string de Supabase. */
@Pipe({ name: 'dateLabel', standalone: true })
export class DateLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : FORMATTER.format(date);
  }
}
