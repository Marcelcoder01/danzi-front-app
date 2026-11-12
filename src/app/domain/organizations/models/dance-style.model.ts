/** Estilo del catálogo público `public.dance_styles`. */
export interface DanceStyle {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

/**
 * Relación `public.organization_dance_styles` (organization_id, dance_style_id).
 *
 * Pendiente de backend: todavía no existe un contrato de lectura/escritura para gestionar
 * estas asociaciones desde el frontend, por lo que no se lee ni se escribe en esta tabla.
 */
export interface OrganizationDanceStyle {
  organizationId: string;
  danceStyleId: string;
}
