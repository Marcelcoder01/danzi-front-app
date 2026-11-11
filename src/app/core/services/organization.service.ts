import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  CreateOrganizationInput,
  ORGANIZATION_COLUMNS,
  ORGANIZATION_MEMBER_COLUMNS,
  Organization,
  OrganizationMemberRow,
  OrganizationMembership,
  OrganizationRow,
  toOrganization,
  toOrganizationMember,
} from '../../shared/interfaces/organization.interface';
import { toDanziRequestError } from '../../shared/utils/supabase-error.util';

/** Acceso a `organizations` y `organization_members`. Las escrituras solo se hacen vía RPC. */
@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly supabase = inject(SupabaseService);

  /** Crea la organización y asigna el rol `owner` al usuario autenticado. Devuelve su ID. */
  async createOrganization(input: CreateOrganizationInput): Promise<string> {
    const { data, error } = await this.supabase.client.rpc('create_organization', {
      p_name: input.name,
      p_slug: input.slug,
      p_type: input.type,
    });
    if (error) throw toDanziRequestError(error, 'createOrganization');
    return data as string;
  }

  /** Relaciones activas del usuario con organizaciones, junto con los datos visibles por RLS. */
  async getMemberships(userId: string): Promise<OrganizationMembership[]> {
    const { data, error } = await this.supabase.client
      .from('organization_members')
      .select(ORGANIZATION_MEMBER_COLUMNS)
      .eq('user_id', userId)
      .eq('is_active', true);
    if (error) throw toDanziRequestError(error, 'read');

    const members = (data as OrganizationMemberRow[]).map(toOrganizationMember);
    const organizations = await this.getOrganizationsByIds(members.map((m) => m.organizationId));
    const byId = new Map(organizations.map((organization) => [organization.id, organization]));

    return members
      .filter((member) => byId.get(member.organizationId)?.isActive)
      .map((member) => ({ member, organization: byId.get(member.organizationId)! }))
      .sort((a, b) => a.organization.name.localeCompare(b.organization.name, 'es'));
  }

  /** Devuelve únicamente las organizaciones que RLS permite leer al usuario actual. */
  async getOrganizationsByIds(ids: string[]): Promise<Organization[]> {
    const uniqueIds = [...new Set(ids)];
    if (!uniqueIds.length) return [];
    const { data, error } = await this.supabase.client
      .from('organizations')
      .select(ORGANIZATION_COLUMNS)
      .in('id', uniqueIds);
    if (error) throw toDanziRequestError(error, 'read');
    return (data as OrganizationRow[]).map(toOrganization);
  }
}
