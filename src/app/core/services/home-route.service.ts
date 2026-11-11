import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { JoinRequestService } from './join-request.service';
import { OrganizationContextService } from './organization-context.service';
import { OrganizationStudentsService } from './organization-students.service';

export const APP_ROUTES = {
  login: '/login',
  academy: '/admin',
  selectAcademy: '/select-academy',
  onboarding: '/onboarding',
  studentSpace: '/me',
  profile: '/me/profile',
} as const;

/**
 * Decide la experiencia inicial según las relaciones reales del usuario:
 * - Con academia (activa o única) → panel Academy.
 * - Con varias academias y ninguna seleccionada → selector.
 * - Sin academia pero con fichas o solicitudes → Danzi Students.
 * - Cuenta nueva sin relaciones → onboarding.
 */
@Injectable({ providedIn: 'root' })
export class HomeRouteService {
  private readonly auth = inject(AuthService);
  private readonly context = inject(OrganizationContextService);
  private readonly students = inject(OrganizationStudentsService);
  private readonly joinRequests = inject(JoinRequestService);

  async resolve(): Promise<string> {
    const userId = await this.auth.getCurrentUserId();
    if (!userId) return APP_ROUTES.login;

    try {
      const memberships = await this.context.ensureLoaded();
      if (memberships.length) {
        return this.context.activeOrganizationId() ? APP_ROUTES.academy : APP_ROUTES.selectAcademy;
      }
      const [linkedStudents, requests] = await Promise.all([
        this.students.listLinkedToUser(userId),
        this.joinRequests.listMine(userId),
      ]);
      return linkedStudents.length || requests.length
        ? APP_ROUTES.studentSpace
        : APP_ROUTES.onboarding;
    } catch {
      return APP_ROUTES.studentSpace;
    }
  }
}
