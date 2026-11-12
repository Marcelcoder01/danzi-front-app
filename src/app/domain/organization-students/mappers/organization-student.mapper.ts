import { Database, Tables } from '@core/supabase/database.types';
import { optionalArg, toUnion } from '@core/supabase/supabase-mapping';
import {
  CreateOrganizationStudentInput,
  DANCE_ROLES,
  ORGANIZATION_STUDENT_STATUSES,
  OrganizationStudent,
} from '../models/organization-student.model';

export type OrganizationStudentDto = Tables<'students'>;
export type CreateOrganizationStudentDto =
  Database['public']['Functions']['create_student']['Args'];

export const ORGANIZATION_STUDENT_COLUMNS =
  'id, organization_id, user_id, first_name, last_name, email, phone, dance_role, status, created_at, updated_at';

export const OrganizationStudentMapper = {
  toModel: (dto: OrganizationStudentDto): OrganizationStudent => ({
    id: dto.id,
    organizationId: dto.organization_id,
    userId: dto.user_id,
    firstName: dto.first_name,
    lastName: dto.last_name,
    email: dto.email,
    phone: dto.phone,
    danceRole: toUnion(dto.dance_role, DANCE_ROLES, 'both'),
    status: toUnion(dto.status, ORGANIZATION_STUDENT_STATUSES, 'pending'),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }),

  toDto: (model: CreateOrganizationStudentInput): CreateOrganizationStudentDto => ({
    p_organization_id: model.organizationId,
    p_first_name: model.firstName,
    p_last_name: optionalArg(model.lastName),
    p_email: optionalArg(model.email),
    p_phone: optionalArg(model.phone),
    p_dance_role: model.danceRole,
  }),
};
