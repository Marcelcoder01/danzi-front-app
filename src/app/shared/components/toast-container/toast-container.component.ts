import { Component, inject } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ToastType } from '../../interfaces/toast.interface';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [FaIconComponent],
  template: `
    <div class="toast toast-top toast-end z-[100]" data-theme="light" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          role="alert"
          class="alert"
          [class.alert-success]="toast.type === 'success'"
          [class.alert-error]="toast.type === 'error'"
          [class.alert-warning]="toast.type === 'warning'"
          [class.alert-info]="toast.type === 'info'"
        >
          <fa-icon [icon]="icons[toast.type]" aria-hidden="true"></fa-icon>
          <span>{{ toast.message }}</span>
          <button
            type="button"
            class="btn btn-ghost btn-xs"
            [attr.aria-label]="'Cerrar aviso: ' + toast.message"
            (click)="toastService.dismiss(toast.id)"
          >
            Cerrar
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
  readonly icons: Record<ToastType, IconDefinition> = {
    success: faCircleCheck,
    warning: faTriangleExclamation,
    error: faCircleExclamation,
    info: faCircleInfo,
  };
}
