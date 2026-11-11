import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import {
  USER_PROFILE_COLUMNS,
  UserProfile,
  UserProfileRow,
  UserProfileUpdate,
  profileDisplayName,
  toUserProfile,
  toUserProfileUpdateRow,
} from '../../shared/interfaces/user.interface';
import { DanziRequestError, toDanziRequestError } from '../../shared/utils/supabase-error.util';

/**
 * Perfil de dominio del usuario autenticado (`public.users`).
 * El perfil lo crea un trigger de Supabase al registrarse: aquí solo se consulta y actualiza.
 */
@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  readonly profile = signal<UserProfile | null>(null);
  readonly isLoading = signal(false);

  /** Nombre visible con compatibilidad para cuentas que solo tienen `display_name` o metadata. */
  readonly displayName = computed(() => {
    const user = this.auth.currentUser();
    const metadataName = user?.user_metadata?.['full_name'];
    const fallback = (typeof metadataName === 'string' && metadataName) || user?.email || '';
    return profileDisplayName(this.profile(), fallback);
  });

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      const profile = this.profile();
      if (!this.auth.isLoading() && profile && profile.id !== user?.id) this.profile.set(null);
    });
  }

  async load(force = false): Promise<UserProfile | null> {
    const userId = await this.auth.getCurrentUserId();
    if (!userId) {
      this.profile.set(null);
      return null;
    }
    const cached = this.profile();
    if (!force && cached?.id === userId) return cached;

    this.isLoading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('users')
        .select(USER_PROFILE_COLUMNS)
        .eq('id', userId)
        .maybeSingle();
      if (error) throw toDanziRequestError(error, 'read');
      const profile = data ? toUserProfile(data as UserProfileRow) : null;
      this.profile.set(profile);
      return profile;
    } finally {
      this.isLoading.set(false);
    }
  }

  async update(changes: UserProfileUpdate): Promise<UserProfile> {
    const userId = await this.auth.getCurrentUserId();
    if (!userId) {
      throw new DanziRequestError('Tu sesión ha caducado. Vuelve a iniciar sesión.', 'unauthenticated', null);
    }
    const { data, error } = await this.supabase.client
      .from('users')
      .update(toUserProfileUpdateRow(changes))
      .eq('id', userId)
      .select(USER_PROFILE_COLUMNS)
      .single();
    if (error) throw toDanziRequestError(error, 'updateProfile');
    const profile = toUserProfile(data as UserProfileRow);
    this.profile.set(profile);
    return profile;
  }

  clear(): void {
    this.profile.set(null);
  }
}
