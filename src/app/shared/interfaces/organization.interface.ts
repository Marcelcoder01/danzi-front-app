export type OrganizationType = 'academy' | 'independent_teacher';
export type OrganizationRole = 'owner' | 'admin' | 'teacher';

export interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  type: OrganizationType;
  description: string | null;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country_code: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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

export interface OrganizationMemberRow {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

export const ORGANIZATION_COLUMNS =
  'id, name, slug, type, description, logo_url, email, phone, address, city, country_code, timezone, is_active, created_at, updated_at';

export const ORGANIZATION_MEMBER_COLUMNS =
  'id, organization_id, user_id, role, is_active, created_at, updated_at';

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

export function toOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    type: row.type,
    description: row.description,
    logoUrl: row.logo_url,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    countryCode: row.country_code,
    timezone: row.timezone,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toOrganizationMember(row: OrganizationMemberRow): OrganizationMember {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function canManageStudents(role: OrganizationRole | null | undefined): boolean {
  return !!role && STUDENT_MANAGER_ROLES.includes(role);
}
