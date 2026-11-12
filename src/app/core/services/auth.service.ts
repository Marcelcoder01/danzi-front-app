import { Injectable, signal } from '@angular/core';
import { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private get supabase() {
    return this.supabaseService.client;
  }

  readonly currentUser = signal<User | null>(null);
  readonly currentSession = signal<Session | null>(null);
  readonly isAuthenticated = signal(false);
  readonly isLoading = signal(true);

  constructor(private supabaseService: SupabaseService) {
    this.initializeAuth();
  }

  // Inicializar autenticación y escuchar cambios
  private async initializeAuth(): Promise<void> {
    const { data, error } = await this.supabase.auth.getSession();

    if (!error) {
      this.updateAuthState(data.session);
    }

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.updateAuthState(session);
    });

    this.isLoading.set(false);
  }

  private updateAuthState(session: Session | null): void {
    this.currentSession.set(session);
    this.currentUser.set(session?.user ?? null);
    this.isAuthenticated.set(!!session);
  }

  // Registro
  async signUp(email: string, password: string, fullName: string) {
    return await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
  }
  // Login
  async signIn(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  // Logout
  async signOut() {
    return await this.supabase.auth.signOut();
  }

  // Obtener sesión
  async getSession() {
    return await this.supabase.auth.getSession();
  }

  // Obtener usuario validado
  async getUser() {
    return await this.supabase.auth.getUser();
  }

  // ID del usuario de la sesión actual (Supabase Auth), sin petición de red
  async getCurrentUserId(): Promise<string | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.user.id ?? null;
  }

  // Recuperación de contraseña
  async resetPassword(email: string) {
    return await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  }

  // Guardar nueva contraseña
  async updatePassword(newPassword: string) {
    return await this.supabase.auth.updateUser({
      password: newPassword,
    });
  }
}
