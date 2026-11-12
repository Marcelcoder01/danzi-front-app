export type OrganizationType = 'academy' | 'independent_teacher';
export type OrganizationRole = 'owner' | 'admin' | 'teacher';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: OrganizationType;
  description: string | null;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  countryCode: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Relación del usuario autenticado con una organización, junto a sus datos visibles. */
export interface OrganizationMembership {
  member: OrganizationMember;
  organization: Organization;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  type: OrganizationType;
}

export const ORGANIZATION_TYPES: readonly OrganizationType[] = ['academy', 'independent_teacher'];
export const ORGANIZATION_ROLES: readonly OrganizationRole[] = ['owner', 'admin', 'teacher'];

/** Roles con acceso a la gestión de alumnos y solicitudes según el backend actual. */
export const STUDENT_MANAGER_ROLES: readonly OrganizationRole[] = ['owner', 'admin'];

export const ORGANIZATION_ROLE_LABELS: Record<OrganizationRole, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  teacher: 'Profesor',
};

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  academy: 'Academia',
  independent_teacher: 'Profesor independiente',
};

export function canManageStudents(role: OrganizationRole | null | undefined): boolean {
  return !!role && STUDENT_MANAGER_ROLES.includes(role);
}
