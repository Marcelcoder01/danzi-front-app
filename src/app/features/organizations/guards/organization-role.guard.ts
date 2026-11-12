import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OrganizationContextService } from '../services/organization-context.service';
import { OrganizationRole } from '../models/organization.model';

/** Restringe una ruta a determinados roles en la academia activa. Usar tras `academyGuard`. */
export const organizationRoleGuard =
  (roles: readonly OrganizationRole[]): CanActivateFn =>
  async () => {
    const context = inject(OrganizationContextService);
    const router = inject(Router);
    try {
      await context.ensureLoaded();
    } catch {
      return router.parseUrl('/unauthorized');
    }
    const role = context.activeRole();
    return role && roles.includes(role) ? true : router.parseUrl('/unauthorized');
  };
