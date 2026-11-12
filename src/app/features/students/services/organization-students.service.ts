import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { toDanziRequestError } from '../../../core/supabase/supabase-error';
import {
  CreateOrganizationStudentInput,
  OrganizationStudent,
} from '../models/organization-student.model';
import {
  ORGANIZATION_STUDENT_COLUMNS,
  OrganizationStudentMapper,
} from '../mappers/organization-student.mapper';

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
    return data.map(OrganizationStudentMapper.toModel);
  }

  /** Fichas vinculadas a la cuenta del usuario (una por academia). */
  async listLinkedToUser(userId: string): Promise<OrganizationStudent[]> {
    const { data, error } = await this.supabase.client
      .from('students')
      .select(ORGANIZATION_STUDENT_COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw toDanziRequestError(error, 'read');
    return data.map(OrganizationStudentMapper.toModel);
  }

  /** Crea una ficha manual (`user_id = null`) mediante la RPC `create_student`. */
  async create(input: CreateOrganizationStudentInput): Promise<string> {
    const { data, error } = await this.supabase.client.rpc(
      'create_student',
      OrganizationStudentMapper.toDto(input),
    );
    if (error) throw toDanziRequestError(error, 'createStudent');
    return data;
  }
}
