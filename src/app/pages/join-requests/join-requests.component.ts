import { Component, ViewChild, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleInfo, faInbox, faRotate } from '@fortawesome/free-solid-svg-icons';
import { JoinRequestService } from '../../core/services/join-request.service';
import { OrganizationContextService } from '../../core/services/organization-context.service';
import { ToastService } from '../../shared/services/toast.service';
import {
  JoinRequest,
  JoinRequestDecision,
  JoinRequestStatus,
} from '../../shared/interfaces/join-request.interface';
import { JoinRequestListComponent } from '../../shared/components/join-request-list/join-request-list.component';
import { StateMessageComponent } from '../../shared/components/state-message/state-message.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { errorMessage } from '../../shared/utils/supabase-error.util';

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

  readonly requests = signal<JoinRequest[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly processingId = signal<string | null>(null);
  readonly statusFilter = signal<StatusFilter>('pending');
  private pendingReject: JoinRequest | null = null;
  private loadToken = 0;

  readonly filteredRequests = computed(() => {
    const filter = this.statusFilter();
    return filter === 'all'
      ? this.requests()
      : this.requests().filter((request) => request.status === filter);
  });
  readonly pendingCount = computed(
    () => this.requests().filter((request) => request.status === 'pending').length,
  );

  constructor() {
    effect(() => {
      const organizationId = this.context.activeOrganizationId();
      untracked(() => this.load(organizationId));
    });
  }

  async load(organizationId = this.context.activeOrganizationId()): Promise<void> {
    const token = ++this.loadToken;
    this.requests.set([]);
    this.error.set(null);
    if (!organizationId) return;
    this.loading.set(true);
    try {
      const requests = await this.joinRequests.listByOrganization(organizationId);
      if (token === this.loadToken) this.requests.set(requests);
    } catch (error) {
      if (token === this.loadToken) {
        this.error.set(errorMessage(error, 'No se han podido cargar las solicitudes.'));
      }
    } finally {
      if (token === this.loadToken) this.loading.set(false);
    }
  }

  approve(request: JoinRequest): Promise<void> {
    return this.review(request, 'approved');
  }

  askReject(request: JoinRequest): void {
    this.pendingReject = request;
    this.confirmationDialog?.open({
      title: '¿Rechazar esta solicitud?',
      message: 'La persona no se incorporará a la academia. Podrá volver a solicitarlo más adelante.',
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
      await this.load();
    }
  }
}
