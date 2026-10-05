import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
// import { SupabaseClient, Session, User, AuthError } from '@supabase/supabase-js';
import { SupabaseClientService } from './supabase-client.service';

// Tipos temporales para funcionamiento sin Supabase
interface User {
  id: string;
  app_metadata?: { role?: string };
  user_metadata?: { role?: string };
}

interface Session {
  user: User;
}

interface AuthError {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private session = signal<Session | null>(null);
  private loading = signal(true);
  // private supabase: SupabaseClient;

  readonly user = computed(() => this.session()?.user ?? null);
  readonly session$ = computed(() => this.session());
  readonly loading$ = computed(() => this.loading());

  constructor(private supabaseClientService: SupabaseClientService) {
    // this.supabase = this.supabaseClientService.getClient();
    this.initializeAuth();
  }

  private initializeAuth(): void {
    // Conexión con Supabase comentada temporalmente
    // if (!this.supabaseClientService.isConfigured) {
    //   this.loading.set(false);
    //   return;
    // }

    // this.supabase.auth.getSession().then(({ data, error }) => {
    //   if (error) {
    //     console.error('No se pudo leer la sesión actual:', error.message);
    //   }
    //   this.session.set(data.session ?? null);
    //   this.loading.set(false);
    // });

    // this.supabase.auth.onAuthStateChange((_event, session) => {
    //   this.session.set(session);
    //   this.loading.set(false);
    // });

    // Temporal: Sin autenticación real
    this.loading.set(false);
  }

  signIn(email: string, password: string): Observable<{ error: AuthError | null }> {
    // return from(this.supabase.auth.signInWithPassword({ email, password })).pipe(
    //   map(({ error }) => ({ error })),
    //   catchError((error) => of({ error }))
    // );

    // Temporal: Simula login exitoso para pruebas
    console.log('Login simulado:', email);
    this.session.set({
      user: {
        id: 'temp-user-id',
        app_metadata: { role: 'admin' }
      }
    });
    return of({ error: null });
  }

  signOut(): Observable<{ error: AuthError | null }> {
    // return from(this.supabase.auth.signOut()).pipe(
    //   map(({ error }) => ({ error })),
    //   catchError((error) => of({ error }))
    // );

    // Temporal: Simula logout
    this.session.set(null);
    return of({ error: null });
  }

  isAdmin(): boolean {
    const user = this.user();
    // Temporal: Retorna true para pruebas
    return true;
    // return user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin';
  }

  isConfigured(): boolean {
    return this.supabaseClientService.isConfigured;
  }
}
