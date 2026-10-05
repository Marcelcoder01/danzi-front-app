import { Injectable } from '@angular/core';
// import { createClient, SupabaseClient } from '@supabase/supabase-js';
// import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseClientService {
  // private supabase: SupabaseClient | null = null;
  readonly isConfigured = false;

  constructor() {
    // Conexión con Supabase comentada temporalmente
    // const supabaseUrl = environment.supabase?.url;
    // const supabaseAnonKey = environment.supabase?.anonKey;

    // this.isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

    // if (this.isConfigured) {
    //   this.supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    // }
  }

  // getClient(): SupabaseClient {
  //   if (!this.supabase) {
  //     throw new Error('Supabase no está configurado. Faltan SUPABASE_URL o SUPABASE_ANON_KEY en el entorno.');
  //   }
  //   return this.supabase;
  // }
}
