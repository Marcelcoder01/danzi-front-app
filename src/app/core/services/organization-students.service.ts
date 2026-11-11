import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  CreateOrganizationStudentInput,
  ORGANIZATION_STUDENT_COLUMNS,
  OrganizationStudent,
  OrganizationStudentRow,
  toOrganizationStudent,
} from '../../shared/interfaces/organization-student.interface';
import { toDanziRequestError } from '../../shared/utils/supabase-error.util';

/**
 * Fichas de alumno persistidas en Supabase (`public.students`).
 *
 * Edición y borrado no están disponibles: el backend actual no expone RPCs ni políticas
 * de escritura para esas operaciones.
 */
@Injectable({ providedIn: 'root' })
export class OrganizationStudentsService {
  private readonly supabase = inject(SupabaseService);

  async listByOrganization(organizationId: string): Promise<OrganizationStudent[]> {
    const { data, error } = await this.supabase.client
      .from('students')
      .select(ORGANIZATION_STUDENT_COLUMNS)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    if (error) throw toDanziRequestError(error, 'read');
    return (data as OrganizationStudentRow[]).map(toOrganizationStudent);
  }

  /** Fichas vinculadas a la cuenta del usuario (una por academia). */
  async listLinkedToUser(userId: string): Promise<OrganizationStudent[]> {
    const { data, error } = await this.supabase.client
      .from('students')
      .select(ORGANIZATION_STUDENT_COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw toDanziRequestError(error, 'read');
    return (data as OrganizationStudentRow[]).map(toOrganizationStudent);
  }

  /** Crea una ficha manual (`user_id = null`) mediante la RPC `create_student`. */
  async create(input: CreateOrganizationStudentInput): Promise<string> {
    const { data, error } = await this.supabase.client.rpc('create_student', {
      p_organization_id: input.organizationId,
      p_first_name: input.firstName,
      p_last_name: input.lastName,
      p_email: input.email,
      p_phone: input.phone,
      p_dance_role: input.danceRole,
    });
    if (error) throw toDanziRequestError(error, 'createStudent');
    return data as string;
  }
}
