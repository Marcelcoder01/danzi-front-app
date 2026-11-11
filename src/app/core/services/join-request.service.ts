import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  JOIN_REQUEST_COLUMNS,
  JoinRequest,
  JoinRequestDecision,
  JoinRequestRow,
  toJoinRequest,
} from '../../shared/interfaces/join-request.interface';
import { toDanziRequestError } from '../../shared/utils/supabase-error.util';

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
      p_message: message,
    });
    if (error) throw toDanziRequestError(error, 'requestJoin');
    return data as string;
  }

  async listMine(userId: string): Promise<JoinRequest[]> {
    const { data, error } = await this.supabase.client
      .from('join_requests')
      .select(JOIN_REQUEST_COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw toDanziRequestError(error, 'read');
    return (data as JoinRequestRow[]).map(toJoinRequest);
  }

  async listByOrganization(organizationId: string): Promise<JoinRequest[]> {
    const { data, error } = await this.supabase.client
      .from('join_requests')
      .select(JOIN_REQUEST_COLUMNS)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    if (error) throw toDanziRequestError(error, 'read');
    return (data as JoinRequestRow[]).map(toJoinRequest);
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
  async review(requestId: string, decision: JoinRequestDecision): Promise<unknown> {
    const { data, error } = await this.supabase.client.rpc('review_join_request', {
      p_request_id: requestId,
      p_decision: decision,
    });
    if (error) throw toDanziRequestError(error, 'reviewJoinRequest');
    return data;
  }
}
