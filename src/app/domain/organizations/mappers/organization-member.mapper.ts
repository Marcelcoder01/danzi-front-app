import { Tables } from '@core/supabase/database.types';
import { toUnion } from '@core/supabase/supabase-mapping';
import { ORGANIZATION_ROLES, OrganizationMember } from '../models/organization.model';

export type OrganizationMemberDto = Tables<'organization_members'>;

export const ORGANIZATION_MEMBER_COLUMNS =
  'id, organization_id, user_id, role, is_active, created_at, updated_at';

export const OrganizationMemberMapper = {
  /** Un rol desconocido se degrada a `teacher` (el de menos permisos) por seguridad de navegación. */
  toModel: (dto: OrganizationMemberDto): OrganizationMember => ({
    id: dto.id,
    organizationId: dto.organization_id,
    userId: dto.user_id,
    role: toUnion(dto.role, ORGANIZATION_ROLES, 'teacher'),
    isActive: dto.is_active,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }),
};
