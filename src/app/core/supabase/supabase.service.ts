import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Database } from './database.types';

export type DanziSupabaseClient = SupabaseClient<Database>;

/**
 * Proveedor del cliente Supabase tipado con el esquema generado (`npm run gen:types`).
 * Regla: solo los servicios de feature lo inyectan; los componentes nunca lo usan directamente.
 */
@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly supabase: DanziSupabaseClient;

  constructor() {
    this.supabase = createClient<Database>(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  get client(): DanziSupabaseClient {
    return this.supabase;
  }
}
