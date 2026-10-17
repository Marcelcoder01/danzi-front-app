import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faTriangleExclamation,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ToastType } from '../../interfaces/toast.interface';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, FaIconComponent],
  template: `
    <div
      class="fixed top-4 right-4 z-[2147483647] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          role="alert"
          class="pointer-events-auto flex items-center gap-3 min-w-[300px] max-w-sm p-4 rounded-xl shadow-lg animate-slide-in"
          [ngClass]="{
            'bg-[var(--color-success-light)] border border-[var(--color-success)] text-[var(--color-text-on-primary)]':
              toast.type === 'success',
            'bg-[var(--color-error-light)] border border-[var(--color-error)] text-[var(--color-text-on-primary)]':
              toast.type === 'error',
            'bg-[var(--color-warning-light)] border border-[var(--color-warning)] text-[var(--color-text-on-primary)]':
              toast.type === 'warning',
            'bg-[var(--color-info-light)] border border-[var(--color-info)] text-[var(--color-text-on-primary)]':
              toast.type === 'info',
          }"
        >
          <fa-icon [icon]="icons[toast.type]" class="text-lg" aria-hidden="true"></fa-icon>
          <span class="flex-1 text-sm font-medium">{{ toast.message }}</span>
          <button
            type="button"
            class="flex h-6 w-6 items-center justify-center rounded-lg opacity-60 hover:opacity-100 transition-opacity"
            [attr.aria-label]="'Cerrar aviso: ' + toast.message"
            (click)="toastService.dismiss(toast.id)"
          >
            <fa-icon [icon]="faXmark" class="text-sm"></fa-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .animate-slide-in {
        animation: slideIn 0.3s ease-out;
      }
    `,
  ],
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
  readonly icons: Record<ToastType, IconDefinition> = {
    success: faCircleCheck,
    warning: faTriangleExclamation,
    error: faCircleExclamation,
    info: faCircleInfo,
  };
  readonly faXmark = faXmark;
}
