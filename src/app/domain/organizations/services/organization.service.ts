import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core/supabase/supabase.service';
import { toDanziRequestError } from '@core/supabase/supabase-error';
import {
  CreateOrganizationInput,
  Organization,
  OrganizationMember,
  OrganizationMembership,
} from '../models/organization.model';
import { ORGANIZATION_COLUMNS, OrganizationMapper } from '../mappers/organization.mapper';
import {
  ORGANIZATION_MEMBER_COLUMNS,
  OrganizationMemberMapper,
} from '../mappers/organization-member.mapper';

/** Acceso a `organizations` y `organization_members`. Las escrituras solo se hacen vía RPC. */
@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly supabase = inject(SupabaseService);

  /** Crea la organización y asigna el rol `owner` al usuario autenticado. Devuelve su ID. */
  async createOrganization(input: CreateOrganizationInput): Promise<string> {
    const { data, error } = await this.supabase.client.rpc(
      'create_organization',
      OrganizationMapper.toDto(input),
    );
    if (error) throw toDanziRequestError(error, 'createOrganization');
    return data;
  }

  /** Relaciones activas del usuario con organizaciones, junto con los datos visibles por RLS. */
  async getMemberships(userId: string): Promise<OrganizationMembership[]> {
    const { data, error } = await this.supabase.client
      .from('organization_members')
      .select(ORGANIZATION_MEMBER_COLUMNS)
      .eq('user_id', userId)
      .eq('is_active', true);
    if (error) throw toDanziRequestError(error, 'read');

    const members = data.map(OrganizationMemberMapper.toModel);
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
    return data.map(OrganizationMapper.toModel);
  }

  /** Miembros activos de una organización visibles por RLS para el usuario actual. */
  async getMembers(organizationId: string): Promise<OrganizationMember[]> {
    const { data, error } = await this.supabase.client
      .from('organization_members')
      .select(ORGANIZATION_MEMBER_COLUMNS)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (error) throw toDanziRequestError(error, 'read');
    return data.map(OrganizationMemberMapper.toModel);
  }
}
