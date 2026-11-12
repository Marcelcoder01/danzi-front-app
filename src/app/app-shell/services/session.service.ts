import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrganizationContextService } from '../../features/organizations/services/organization-context.service';
import { UserProfileService } from '../../features/profile/services/user-profile.service';
import { ToastService } from '../../shared/services/toast.service';

/** Cierre de sesión coordinado: Supabase Auth + limpieza del contexto de Danzi. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly auth = inject(AuthService);
  private readonly context = inject(OrganizationContextService);
  private readonly profile = inject(UserProfileService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  async signOut(): Promise<void> {
    try {
      const { error } = await this.auth.signOut();
      if (error) throw error;
      this.context.clear();
      this.profile.clear();
      this.toast.info('Has cerrado sesión correctamente.');
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      this.toast.error('No se ha podido cerrar la sesión.');
    }
  }
}
