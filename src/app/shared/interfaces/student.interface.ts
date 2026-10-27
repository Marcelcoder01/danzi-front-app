import { StudentLevel } from './student-level.enum';
import type { StudentRole, StudentStatus } from './student-status.type';

export type StudentPaymentPeriod = '1' | '2' | 'custom';

export interface Student {
  id: string;
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
  role: StudentRole;
  hasPaid: boolean;
  monthlyFee?: number;
  paymentPeriod?: StudentPaymentPeriod;
  paymentFrom?: string | null;
  paymentTo?: string | null;
}
