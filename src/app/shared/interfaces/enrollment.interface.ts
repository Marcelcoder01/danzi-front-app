export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  enrolledAt: string;
  withdrawnAt?: string;
}
