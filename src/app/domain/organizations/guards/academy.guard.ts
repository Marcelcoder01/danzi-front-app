import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OrganizationContextService } from '../services/organization-context.service';
import { APP_ROUTES } from '@core/routing/app-routes';
import { ToastService } from '@shared/services/toast.service';

/**
 * Acceso al panel Academy: requiere una relación activa con al menos una organización
 * y una academia seleccionada. Es solo una capa de navegación; RLS aplica la autorización.
 */
export const academyGuard: CanActivateFn = async () => {
  const context = inject(OrganizationContextService);
  const router = inject(Router);
  const toast = inject(ToastService);

  try {
    const memberships = await context.ensureLoaded();
    if (!memberships.length) return router.parseUrl(APP_ROUTES.studentSpace);
    if (!context.activeOrganizationId()) return router.parseUrl(APP_ROUTES.selectAcademy);
    return true;
  } catch {
    toast.error('No se han podido cargar tus academias. Inténtalo de nuevo.');
    return router.parseUrl(APP_ROUTES.studentSpace);
  }
};
