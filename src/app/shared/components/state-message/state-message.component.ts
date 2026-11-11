import { Component, computed, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  IconDefinition,
  faCircleExclamation,
  faInbox,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';

export type StateMessageKind = 'loading' | 'error' | 'empty';

/** Mensaje reutilizable para estados de carga, error y vacío. Las acciones se proyectan. */
@Component({
  selector: 'app-state-message',
  standalone: true,
  imports: [FaIconComponent],
  template: `
    <div
      class="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center"
      [attr.role]="kind() === 'error' ? 'alert' : 'status'"
    >
      <span
        class="grid h-12 w-12 place-items-center rounded-2xl"
        [class]="iconClass()"
      >
        <fa-icon [icon]="resolvedIcon()" [animation]="kind() === 'loading' ? 'spin' : undefined" />
      </span>
      <div>
        <p class="text-sm font-semibold text-[var(--color-text)]">{{ title() }}</p>
        @if (message()) {
          <p class="mt-1 max-w-md text-sm text-[var(--color-text-muted)]">{{ message() }}</p>
        }
      </div>
      <ng-content />
    </div>
  `,
})
export class StateMessageComponent {
  readonly kind = input<StateMessageKind>('empty');
  readonly title = input.required<string>();
  readonly message = input<string | null>(null);
  readonly icon = input<IconDefinition | null>(null);

  readonly resolvedIcon = computed(() => {
    const kind = this.kind();
    if (kind === 'loading') return faSpinner;
    if (kind === 'error') return faCircleExclamation;
    return this.icon() ?? faInbox;
  });

  readonly iconClass = computed(() =>
    this.kind() === 'error'
      ? 'bg-red-50 text-[var(--color-error-dark)]'
      : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
  );
}
