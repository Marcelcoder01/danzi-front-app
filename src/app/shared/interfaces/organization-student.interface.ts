/**
 * Ficha de alumno persistida en Supabase (`public.students`).
 *
 * Es independiente del modelo legacy `Student` (localStorage), que conserva niveles,
 * pagos y matrículas de los módulos demo. Nunca deben mezclarse.
 */
export type DanceRole = 'leader' | 'follower' | 'both';
export type OrganizationStudentStatus = 'active' | 'inactive' | 'pending';

export interface OrganizationStudentRow {
  id: string;
  organization_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  dance_role: DanceRole;
  status: OrganizationStudentStatus;
  created_at: string;
  updated_at: string;
}

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

export const ORGANIZATION_STUDENT_COLUMNS =
  'id, organization_id, user_id, first_name, last_name, email, phone, dance_role, status, created_at, updated_at';

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

export function toOrganizationStudent(row: OrganizationStudentRow): OrganizationStudent {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    danceRole: row.dance_role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function organizationStudentFullName(student: OrganizationStudent): string {
  return [student.firstName, student.lastName].filter(Boolean).join(' ');
}
