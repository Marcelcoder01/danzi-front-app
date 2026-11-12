import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { toDanziRequestError } from '../../../core/supabase/supabase-error';
import { optionalArg } from '../../../core/supabase/supabase-mapping';
import { JoinRequest, JoinRequestDecision } from '../models/join-request.model';
import { JOIN_REQUEST_COLUMNS, JoinRequestMapper } from '../mappers/join-request.mapper';

/**
 * Solicitudes de incorporación (`public.join_requests`).
 * Lecturas filtradas por RLS; escrituras exclusivamente vía RPC.
 */
@Injectable({ providedIn: 'root' })
export class JoinRequestService {
  private readonly supabase = inject(SupabaseService);

  /** Solicita incorporarse a una academia por su slug. Devuelve el ID de la solicitud. */
  async requestJoin(organizationSlug: string, message: string | null): Promise<string> {
    const { data, error } = await this.supabase.client.rpc('request_join_organization', {
      p_organization_slug: organizationSlug,
      p_message: optionalArg(message),
    });
    if (error) throw toDanziRequestError(error, 'requestJoin');
    return data;
  }

  async listMine(userId: string): Promise<JoinRequest[]> {
    const { data, error } = await this.supabase.client
      .from('join_requests')
      .select(JOIN_REQUEST_COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw toDanziRequestError(error, 'read');
    return data.map(JoinRequestMapper.toModel);
  }

  async listByOrganization(organizationId: string): Promise<JoinRequest[]> {
    const { data, error } = await this.supabase.client
      .from('join_requests')
      .select(JOIN_REQUEST_COLUMNS)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    if (error) throw toDanziRequestError(error, 'read');
    return data.map(JoinRequestMapper.toModel);
  }

  async countPending(organizationId: string): Promise<number> {
    const { count, error } = await this.supabase.client
      .from('join_requests')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'pending');
    if (error) throw toDanziRequestError(error, 'read');
    return count ?? 0;
  }

  /**
   * Aprueba o rechaza una solicitud. Al aprobar, el backend crea y vincula la ficha del
   * alumno con los datos de `public.users`; no se envían nombres desde el cliente.
   */
  async review(requestId: string, decision: JoinRequestDecision): Promise<string> {
    const { data, error } = await this.supabase.client.rpc('review_join_request', {
      p_request_id: requestId,
      p_decision: decision,
    });
    if (error) throw toDanziRequestError(error, 'reviewJoinRequest');
    return data;
  }
}
