/**
 * Perfil de dominio de Danzi (`public.users`).
 *
 * No confundir con el `User` de Supabase Auth (`@supabase/supabase-js`), que contiene
 * el email y las credenciales. Un usuario no tiene un rol global: sus roles dependen
 * de su relación con cada organización (`organization_members`) y de sus fichas de alumno.
 */
export interface UserProfileRow {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

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

export const USER_PROFILE_COLUMNS =
  'id, display_name, first_name, last_name, avatar_url, phone, date_of_birth, created_at, updated_at';

export function toUserProfile(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    firstName: row.first_name,
    lastName: row.last_name,
    avatarUrl: row.avatar_url,
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toUserProfileUpdateRow(
  update: UserProfileUpdate,
): Pick<UserProfileRow, 'display_name' | 'first_name' | 'last_name' | 'phone' | 'date_of_birth'> {
  return {
    display_name: update.displayName,
    first_name: update.firstName,
    last_name: update.lastName,
    phone: update.phone,
    date_of_birth: update.dateOfBirth,
  };
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

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
