/**
 * Perfil de dominio de Danzi (`public.users`).
 *
 * No confundir con el `User` de Supabase Auth (`@supabase/supabase-js`), que contiene
 * el email y las credenciales. Un usuario no tiene un rol global: sus roles dependen
 * de su relación con cada organización (`organization_members`) y de sus fichas de alumno.
 */
export interface UserProfile {
  id: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Campos del perfil que el propio usuario puede editar. */
export interface UserProfileUpdate {
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  dateOfBirth: string | null;
}

/**
 * Nombre visible del perfil. Compatible con cuentas antiguas que solo tienen `display_name`
 * (rellenado por el trigger a partir de `full_name` del registro).
 */
export function profileDisplayName(profile: UserProfile | null, fallback = ''): string {
  if (!profile) return fallback;
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
  return profile.displayName?.trim() || fullName || fallback;
}
