import { Component, EventEmitter, Output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faTriangleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';

export interface ConfirmationDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  templateUrl: './confirmation-dialog.component.html',
  imports: [FaIconComponent],
})
export class ConfirmationDialogComponent {
  @Output() confirmed = new EventEmitter<void>();

  readonly faTriangleExclamation = faTriangleExclamation;
  readonly faXmark = faXmark;
  options: ConfirmationDialogOptions = { title: '', message: '' };

  open(options: ConfirmationDialogOptions): void {
    this.options = options;
    (document.getElementById('confirmation_dialog') as HTMLDialogElement | null)?.showModal();
  }

  close(): void {
    (document.getElementById('confirmation_dialog') as HTMLDialogElement | null)?.close();
  }

  confirm(): void {
    this.close();
    this.confirmed.emit();
  }
}
