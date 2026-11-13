import { Component, Output, EventEmitter, Input, OnInit, ViewChild, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import {
  faChevronRight,
  faChevronLeft,
  faRotate,
  faChevronDown,
  faCheck,
  faPlus,
  faGraduationCap,
  faUser,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';
import { OrganizationContextService } from '@domain/organizations/services/organization-context.service';
import { UserProfileService } from '@domain/profile/services/user-profile.service';
import { APP_ROUTES } from '@core/routing/app-routes';
import { ORGANIZATION_ROLE_LABELS } from '@domain/organizations/models/organization.model';
import { OrganizationInfoDialogComponent } from '@shared/components/organization-info-dialog/organization-info-dialog.component';
import { initialsOf } from '@shared/utils/text.util';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    FontAwesomeModule,
    ConfirmationDialogComponent,
    OrganizationInfoDialogComponent,
    RouterLink,
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent implements OnInit {
  @ViewChild(ConfirmationDialogComponent) private confirmationDialog?: ConfirmationDialogComponent;

  @ViewChild(OrganizationInfoDialogComponent) private infoDialog?: OrganizationInfoDialogComponent;

  @Output() toggleCollapse = new EventEmitter<void>();
  @Input() isCollapsed = false;

  readonly context = inject(OrganizationContextService);
  readonly profile = inject(UserProfileService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly routes = APP_ROUTES;
  readonly roleLabels = ORGANIZATION_ROLE_LABELS;
  readonly initialsOf = initialsOf;

  faChevronRight = faChevronRight;
  faChevronLeft = faChevronLeft;
  faRotate = faRotate;
  faChevronDown = faChevronDown;
  faCheck = faCheck;
  faPlus = faPlus;
  faGraduationCap = faGraduationCap;
  faUser = faUser;
  faCircleInfo = faCircleInfo;

  ngOnInit(): void {
    this.profile.load().catch(() => undefined);
  }

  async switchAcademy(organizationId: string): Promise<void> {
    (document.activeElement as HTMLElement | null)?.blur();
    if (organizationId === this.context.activeOrganizationId()) return;
    if (this.context.select(organizationId)) {
      this.toast.info(`Ahora trabajas con ${this.context.activeOrganization()?.name}.`);
      await this.router.navigateByUrl(this.routes.academy);
    }
  }

  openAcademyInfo(): void {
    this.infoDialog?.open();
  }

  clearData(): void {
    this.confirmationDialog?.open({
      title: 'Empezar de cero',
      message:
        'Se borrarán los alumnos demo, las clases, las matrículas y la actividad guardados en este navegador. Los datos de Danzi (academias, fichas y solicitudes) no se modifican.',
      confirmLabel: 'Sí, limpiar datos',
      cancelLabel: 'Cancelar',
    });
  }

  confirmClearData(): void {
    const storage = globalThis.localStorage;
    storage.setItem('danzi.students.v2', '[]');
    storage.setItem('danzi.classes.v2', '[]');
    storage.setItem('danzi.enrollments.v2', '[]');
    storage.setItem('danzi.activity.v1', '[]');
    storage.setItem('danzi.attendance.v3', '[]');
    globalThis.location.reload();
  }
}
