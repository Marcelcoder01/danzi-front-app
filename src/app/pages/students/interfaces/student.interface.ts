import type { Level } from '../../../shared/interfaces/level.interface';
import type { PaymentMethod } from '../../payments/interfaces/payment-method.interface';
import { StudentLevel } from './student-level.enum';
import type { StudentStatus } from './student-status.type';

export interface Student {
  id?: string;
  firstName: string;
  lastName?: string;
  alias?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  photoUrl?: string;
  birthDate?: string;
  startDate: string;
  level: StudentLevel;
  status: StudentStatus;
  hasPaid: boolean;
}

export interface StudentWithRelations extends Student {
  currentLevel: Level | null;
  preferredPaymentMethod: PaymentMethod | null;
}


export type StudentInput = Omit<Student, 'id' | 'createdAt' | 'updatedAt'>;
export type StudentUpdateInput = Partial<StudentInput>;
