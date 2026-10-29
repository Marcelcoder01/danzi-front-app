import { Component, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ConfirmationDialogComponent } from '../../../../components/confirmation-dialog/confirmation-dialog.component';
import { faChevronRight, faChevronLeft, faRotate } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [FontAwesomeModule, ConfirmationDialogComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class TopbarComponent {
  @ViewChild(ConfirmationDialogComponent) private confirmationDialog?: ConfirmationDialogComponent;

  @Output() toggleCollapse = new EventEmitter<void>();
  @Input() isCollapsed = false;

  faChevronRight = faChevronRight;
  faChevronLeft = faChevronLeft;
  faRotate = faRotate;

  clearData(): void {
    this.confirmationDialog?.open({
      title: 'Empezar de cero',
      message: 'Se borrarán los alumnos, las clases, las matrículas y la actividad guardados.',
      confirmLabel: 'Sí, limpiar datos',
      cancelLabel: 'Cancelar',
    });
  }

  confirmClearData(): void {
    const storage = globalThis.localStorage;
    storage.setItem('danzi.students.v1', '[]');
    storage.setItem('danzi.classes.v1', '[]');
    storage.setItem('danzi.enrollments.v1', '[]');
    storage.setItem('danzi.activity.v1', '[]');
    globalThis.location.reload();
  }
}
