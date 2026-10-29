export type AcademyActivityType = 'student' | 'enrollment' | 'payment' | 'class';

export interface AcademyActivity {
  id: string;
  type: AcademyActivityType;
  description: string;
  occurredAt: string;
  studentId?: string;
}
