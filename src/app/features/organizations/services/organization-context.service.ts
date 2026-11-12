import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { OrganizationService } from './organization.service';
import { OrganizationMembership, canManageStudents } from '../models/organization.model';

const STORAGE_KEY = 'danzi.activeOrganization.v1';

interface StoredActiveOrganization {
  userId: string;
  organizationId: string;
}

type ContextStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Contexto de la academia activa. Mantiene las relaciones del usuario con organizaciones
 * y la organización seleccionada para los módulos conectados a Supabase.
 *
 * Es solo estado de navegación: la autorización real la aplican RLS y las RPC.
 */
@Injectable({ providedIn: 'root' })
export class OrganizationContextService {
  private readonly auth = inject(AuthService);
  private readonly organizations = inject(OrganizationService);

  private loadedForUserId: string | null = null;
  private pendingLoad: Promise<OrganizationMembership[]> | null = null;

  readonly memberships = signal<OrganizationMembership[]>([]);
  readonly status = signal<ContextStatus>('idle');
  readonly activeOrganizationId = signal<string | null>(null);

  readonly activeMembership = computed(
    () =>
      this.memberships().find((item) => item.organization.id === this.activeOrganizationId()) ??
      null,
  );
  readonly activeOrganization = computed(() => this.activeMembership()?.organization ?? null);
  readonly activeRole = computed(() => this.activeMembership()?.member.role ?? null);
  readonly canManageStudents = computed(() => canManageStudents(this.activeRole()));
  readonly hasMemberships = computed(() => this.memberships().length > 0);

  constructor() {
    effect(() => {
      if (this.auth.isLoading()) return;
      const userId = this.auth.currentUser()?.id ?? null;
      if (!userId) {
        this.clear();
      } else if (this.loadedForUserId && this.loadedForUserId !== userId) {
        this.reset();
      }
    });
  }

  /** Carga (una vez por usuario) las relaciones y revalida la academia activa guardada. */
  async ensureLoaded(force = false): Promise<OrganizationMembership[]> {
    const userId = await this.auth.getCurrentUserId();
    if (!userId) {
      this.clear();
      return [];
    }
    if (!force && this.loadedForUserId === userId && this.status() === 'ready') {
      return this.memberships();
    }
    if (!force && this.pendingLoad) return this.pendingLoad;

    this.pendingLoad = this.load(userId).finally(() => (this.pendingLoad = null));
    return this.pendingLoad;
  }

  /** Selecciona una academia si el usuario pertenece a ella. */
  select(organizationId: string): boolean {
    const membership = this.memberships().find((item) => item.organization.id === organizationId);
    if (!membership || !this.loadedForUserId) return false;
    this.activeOrganizationId.set(organizationId);
    this.writeStored({ userId: this.loadedForUserId, organizationId });
    return true;
  }

  /** Limpia todo el contexto, incluido el ID guardado localmente (cierre de sesión). */
  clear(): void {
    this.reset();
    this.removeStored();
  }

  private reset(): void {
    this.loadedForUserId = null;
    this.memberships.set([]);
    this.activeOrganizationId.set(null);
    this.status.set('idle');
  }

  private async load(userId: string): Promise<OrganizationMembership[]> {
    this.status.set('loading');
    try {
      const memberships = await this.organizations.getMemberships(userId);
      this.loadedForUserId = userId;
      this.memberships.set(memberships);
      this.restoreActive(userId, memberships);
      this.status.set('ready');
      return memberships;
    } catch (error) {
      this.status.set('error');
      throw error;
    }
  }

  private restoreActive(userId: string, memberships: OrganizationMembership[]): void {
    const isMember = (id: string | null | undefined) =>
      !!id && memberships.some((item) => item.organization.id === id);

    const current = this.activeOrganizationId();
    const stored = this.readStored();
    const storedId = stored?.userId === userId ? stored.organizationId : null;

    const nextId = isMember(current)
      ? current
      : isMember(storedId)
        ? storedId
        : memberships.length === 1
          ? memberships[0].organization.id
          : null;

    this.activeOrganizationId.set(nextId);
    if (nextId) {
      this.writeStored({ userId, organizationId: nextId });
    } else if (stored) {
      this.removeStored();
    }
  }

  private removeStored(): void {
    try {
      globalThis.localStorage?.removeItem(STORAGE_KEY);
    } catch {
      // El almacenamiento puede no estar disponible (modo privado).
    }
  }

  private readStored(): StoredActiveOrganization | null {
    try {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      if (!raw) return null;
      const value = JSON.parse(raw) as Partial<StoredActiveOrganization>;
      return typeof value.userId === 'string' && typeof value.organizationId === 'string'
        ? { userId: value.userId, organizationId: value.organizationId }
        : null;
    } catch {
      return null;
    }
  }

  private writeStored(value: StoredActiveOrganization): void {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // El almacenamiento puede no estar disponible (modo privado).
    }
  }
}
