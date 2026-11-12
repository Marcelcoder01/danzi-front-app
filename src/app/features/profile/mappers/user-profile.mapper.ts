import { Tables, TablesUpdate } from '../../../core/supabase/database.types';
import { UserProfile, UserProfileUpdate } from '../models/user-profile.model';

export type UserProfileDto = Tables<'users'>;
export type UserProfileUpdateDto = TablesUpdate<'users'>;

export const USER_PROFILE_COLUMNS =
  'id, display_name, first_name, last_name, avatar_url, phone, date_of_birth, created_at, updated_at';

export const UserProfileMapper = {
  toModel: (dto: UserProfileDto): UserProfile => ({
    id: dto.id,
    displayName: dto.display_name,
    firstName: dto.first_name,
    lastName: dto.last_name,
    avatarUrl: dto.avatar_url,
    phone: dto.phone,
    dateOfBirth: dto.date_of_birth,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }),

  toDto: (model: UserProfileUpdate): UserProfileUpdateDto => ({
    display_name: model.displayName,
    first_name: model.firstName,
    last_name: model.lastName,
    phone: model.phone,
    date_of_birth: model.dateOfBirth,
  }),
};
