/** Catálogo público `public.dance_styles`. */
export interface DanceStyleRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface DanceStyle {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

/**
 * Relación `public.organization_dance_styles`.
 *
 * Pendiente de backend: todavía no existe un contrato de lectura/escritura para gestionar
 * estas asociaciones desde el frontend, por lo que no se lee ni se escribe en esta tabla.
 */
export interface OrganizationDanceStyleRow {
  organization_id: string;
  dance_style_id: string;
}

export const DANCE_STYLE_COLUMNS = 'id, name, slug, created_at';

export function toDanceStyle(row: DanceStyleRow): DanceStyle {
  return { id: row.id, name: row.name, slug: row.slug, createdAt: row.created_at };
}
