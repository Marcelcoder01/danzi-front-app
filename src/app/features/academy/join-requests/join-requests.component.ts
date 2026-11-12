import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleInfo, faInbox, faRotate } from '@fortawesome/free-solid-svg-icons';
import { JoinRequestService } from '@domain/join-requests/services/join-request.service';
import { OrganizationContextService } from '@domain/organizations/services/organization-context.service';
import { ToastService } from '@shared/services/toast.service';
import {
  JoinRequest,
  JoinRequestDecision,
  JoinRequestStatus,
} from '@domain/join-requests/models/join-request.model';
import { JoinRequestListComponent } from '@shared/components/join-request-list/join-request-list.component';
import { StateMessageComponent } from '@shared/components/state-message/state-message.component';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { errorMessage } from '@core/supabase/supabase-error';
import { asyncResource } from '@shared/utils/async-resource';

type StatusFilter = JoinRequestStatus | 'all';

/** Solicitudes recibidas por la academia activa (owner/admin). */
@Component({
  selector: 'app-join-requests',
  standalone: true,
  imports: [
    RouterLink,
    FaIconComponent,
    JoinRequestListComponent,
    StateMessageComponent,
    ConfirmationDialogComponent,
  ],
  templateUrl: './join-requests.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinRequestsComponent {
  @ViewChild(ConfirmationDialogComponent) private confirmationDialog?: ConfirmationDialogComponent;

  private readonly joinRequests = inject(JoinRequestService);
  private readonly toast = inject(ToastService);
  readonly context = inject(OrganizationContextService);

  readonly faInbox = faInbox;
  readonly faRotate = faRotate;
  readonly faCircleInfo = faCircleInfo;
  readonly filters: { value: StatusFilter; label: string }[] = [
    { value: 'pending', label: 'Pendientes' },
    { value: 'approved', label: 'Aprobadas' },
    { value: 'rejected', label: 'Rechazadas' },
    { value: 'all', label: 'Todas' },
  ];

  private readonly requestsResource = asyncResource({
    params: () => this.context.activeOrganizationId() ?? undefined,
    loader: ({ params }) => this.joinRequests.listByOrganization(params),
    defaultValue: [] as JoinRequest[],
  });

  readonly requests = this.requestsResource.value;
  readonly loading = this.requestsResource.isLoading;
  readonly error = computed(() =>
    this.requestsResource.hasError()
      ? errorMessage(this.requestsResource.error(), 'No se han podido cargar las solicitudes.')
      : null,
  );
  readonly processingId = signal<string | null>(null);
  readonly statusFilter = signal<StatusFilter>('pending');
  private pendingReject: JoinRequest | null = null;

  readonly filteredRequests = computed(() => {
    const filter = this.statusFilter();
    return filter === 'all'
      ? this.requests()
      : this.requests().filter((request) => request.status === filter);
  });
  readonly pendingCount = computed(
    () => this.requests().filter((request) => request.status === 'pending').length,
  );

  load(): void {
    this.requestsResource.reload();
  }

  approve(request: JoinRequest): Promise<void> {
    return this.review(request, 'approved');
  }

  askReject(request: JoinRequest): void {
    this.pendingReject = request;
    this.confirmationDialog?.open({
      title: '¿Rechazar esta solicitud?',
      message:
        'La persona no se incorporará a la academia. Podrá volver a solicitarlo más adelante.',
      confirmLabel: 'Sí, rechazar',
    });
  }

  confirmReject(): void {
    const request = this.pendingReject;
    this.pendingReject = null;
    if (request) this.review(request, 'rejected');
  }

  private async review(request: JoinRequest, decision: JoinRequestDecision): Promise<void> {
    this.processingId.set(request.id);
    try {
      await this.joinRequests.review(request.id, decision);
      this.toast.success(
        decision === 'approved'
          ? 'Solicitud aprobada. Se ha creado la ficha del alumno vinculada a su cuenta.'
          : 'Solicitud rechazada.',
      );
    } catch (error) {
      this.toast.error(errorMessage(error));
    } finally {
      this.processingId.set(null);
      this.load();
    }
  }
}
