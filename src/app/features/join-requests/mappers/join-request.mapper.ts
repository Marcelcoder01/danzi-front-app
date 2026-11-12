import { Tables } from '../../../core/supabase/database.types';
import { toUnion } from '../../../core/supabase/supabase-mapping';
import { JOIN_REQUEST_STATUSES, JoinRequest } from '../models/join-request.model';

export type JoinRequestDto = Tables<'join_requests'>;

export const JOIN_REQUEST_COLUMNS =
  'id, organization_id, user_id, status, message, reviewed_by, reviewed_at, created_at, updated_at';

export const JoinRequestMapper = {
  toModel: (dto: JoinRequestDto): JoinRequest => ({
    id: dto.id,
    organizationId: dto.organization_id,
    userId: dto.user_id,
    status: toUnion(dto.status, JOIN_REQUEST_STATUSES, 'pending'),
    message: dto.message,
    reviewedBy: dto.reviewed_by,
    reviewedAt: dto.reviewed_at,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }),
};
