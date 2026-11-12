import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faFlask } from '@fortawesome/free-solid-svg-icons';

/** Distintivo para módulos que todavía funcionan con datos demo en localStorage. */
@Component({
  selector: 'app-legacy-notice',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FaIconComponent],
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[0.7rem] font-semibold text-amber-700"
      [attr.title]="hint()"
    >
      <fa-icon [icon]="faFlask" />
      {{ label() }}
    </span>
  `,
})
export class LegacyNoticeComponent {
  readonly label = input('Demo local');
  readonly hint = input('Datos guardados solo en este navegador. Aún no se sincronizan con Danzi.');
  readonly faFlask = faFlask;
}
