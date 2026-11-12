import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBuilding, faCheck, faUser, faXmark } from '@fortawesome/free-solid-svg-icons';
import {
  JOIN_REQUEST_STATUS_CLASSES,
  JOIN_REQUEST_STATUS_LABELS,
  JoinRequest,
} from '@domain/join-requests/models/join-request.model';
import { DateLabelPipe } from '@shared/pipes/date-label.pipe';

export type JoinRequestListMode = 'student' | 'academy';

/**
 * Lista presentacional de solicitudes.
 * - `student`: muestra la academia destino (si RLS permite leer su nombre).
 * - `academy`: muestra el solicitante y las acciones de revisión para las pendientes.
 */
@Component({
  selector: 'app-join-request-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FaIconComponent, DateLabelPipe],
  templateUrl: './join-request-list.component.html',
})
export class JoinRequestListComponent {
  readonly requests = input.required<JoinRequest[]>();
  readonly mode = input<JoinRequestListMode>('student');
  readonly organizationNames = input<Record<string, string>>({});
  readonly processingId = input<string | null>(null);
  readonly canReview = input(false);

  readonly approve = output<JoinRequest>();
  readonly reject = output<JoinRequest>();

  readonly statusLabels = JOIN_REQUEST_STATUS_LABELS;
  readonly statusClasses = JOIN_REQUEST_STATUS_CLASSES;
  readonly faBuilding = faBuilding;
  readonly faUser = faUser;
  readonly faCheck = faCheck;
  readonly faXmark = faXmark;

  organizationLabel(request: JoinRequest): string {
    return this.organizationNames()[request.organizationId] ?? 'Academia';
  }

  /** RLS no permite leer `public.users` del solicitante: solo mostramos una referencia. */
  requesterLabel(request: JoinRequest): string {
    return `Usuario Danzi · ${request.userId.slice(0, 8)}`;
  }
}
