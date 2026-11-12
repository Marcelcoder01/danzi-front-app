import { Tables } from '@core/supabase/database.types';
import { DanceStyle } from '../models/dance-style.model';

export type DanceStyleDto = Tables<'dance_styles'>;

export const DANCE_STYLE_COLUMNS = 'id, name, slug, created_at';

export const DanceStyleMapper = {
  toModel: (dto: DanceStyleDto): DanceStyle => ({
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    createdAt: dto.created_at,
  }),
};
