/**
 * Ficha de alumno persistida en Supabase (`public.students`).
 *
 * Es independiente del modelo legacy `Student` (localStorage), que conserva niveles,
 * pagos y matrículas de los módulos demo. Nunca deben mezclarse.
 */
export type DanceRole = 'leader' | 'follower' | 'both';
export type OrganizationStudentStatus = 'active' | 'inactive' | 'pending';

export interface OrganizationStudent {
  id: string;
  organizationId: string;
  userId: string | null;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  danceRole: DanceRole;
  status: OrganizationStudentStatus;
  createdAt: string;
  updatedAt: string;
}

/** Datos aceptados por la RPC `create_student`. No incluye `user_id`. */
export interface CreateOrganizationStudentInput {
  organizationId: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  danceRole: DanceRole;
}

export const DANCE_ROLES: readonly DanceRole[] = ['leader', 'follower', 'both'];
export const ORGANIZATION_STUDENT_STATUSES: readonly OrganizationStudentStatus[] = [
  'active',
  'inactive',
  'pending',
];

export const DANCE_ROLE_LABELS: Record<DanceRole, string> = {
  leader: 'Líder',
  follower: 'Follower',
  both: 'Ambos',
};

export const ORGANIZATION_STUDENT_STATUS_LABELS: Record<OrganizationStudentStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  pending: 'Pendiente',
};

export function organizationStudentFullName(student: OrganizationStudent): string {
  return [student.firstName, student.lastName].filter(Boolean).join(' ');
}
