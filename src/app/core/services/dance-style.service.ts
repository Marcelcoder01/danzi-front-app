import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  DANCE_STYLE_COLUMNS,
  DanceStyle,
  DanceStyleRow,
  toDanceStyle,
} from '../../shared/interfaces/dance-style.interface';
import { toDanziRequestError } from '../../shared/utils/supabase-error.util';

/**
 * Lectura del catálogo público `dance_styles`.
 * La gestión de `organization_dance_styles` queda pendiente de un contrato backend.
 */
@Injectable({ providedIn: 'root' })
export class DanceStyleService {
  private readonly supabase = inject(SupabaseService);
  private catalog: Promise<DanceStyle[]> | null = null;

  getCatalog(): Promise<DanceStyle[]> {
    this.catalog ??= this.fetchCatalog().catch((error) => {
      this.catalog = null;
      throw error;
    });
    return this.catalog;
  }

  private async fetchCatalog(): Promise<DanceStyle[]> {
    const { data, error } = await this.supabase.client
      .from('dance_styles')
      .select(DANCE_STYLE_COLUMNS)
      .order('name');
    if (error) throw toDanziRequestError(error, 'read');
    return (data as DanceStyleRow[]).map(toDanceStyle);
  }
}
