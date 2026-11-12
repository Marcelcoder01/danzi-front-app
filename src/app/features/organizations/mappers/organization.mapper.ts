import { Database, Tables } from '../../../core/supabase/database.types';
import { toUnion } from '../../../core/supabase/supabase-mapping';
import {
  CreateOrganizationInput,
  ORGANIZATION_TYPES,
  Organization,
} from '../models/organization.model';

export type OrganizationDto = Tables<'organizations'>;
export type CreateOrganizationDto = Database['public']['Functions']['create_organization']['Args'];

export const ORGANIZATION_COLUMNS =
  'id, name, slug, type, description, logo_url, email, phone, address, city, country_code, timezone, is_active, created_at, updated_at';

export const OrganizationMapper = {
  toModel: (dto: OrganizationDto): Organization => ({
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    type: toUnion(dto.type, ORGANIZATION_TYPES, 'academy'),
    description: dto.description,
    logoUrl: dto.logo_url,
    email: dto.email,
    phone: dto.phone,
    address: dto.address,
    city: dto.city,
    countryCode: dto.country_code,
    timezone: dto.timezone,
    isActive: dto.is_active,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }),

  toDto: (model: CreateOrganizationInput): CreateOrganizationDto => ({
    p_name: model.name,
    p_slug: model.slug,
    p_type: model.type,
  }),
};
