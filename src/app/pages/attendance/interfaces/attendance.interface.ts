import { Student } from '../../../shared/interfaces/student.interface';

export type AttendanceStatus = 'present' | 'recovered' | 'justified' | 'absent' | 'pending';

/** A student projected through one enrollment for attendance UI rows. */
export interface AttendanceEnrollmentRow extends Student {
  classId: string;
  avatarColor: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  date: string;
}

export interface AttendanceRecord {
  // In the database, (studentId, sessionId) is the composite primary key.
  studentId: string;
  sessionId: string;
  status: AttendanceStatus;
  recoverySessionId?: string;
  note?: string;
}

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  'present',
  'recovered',
  'justified',
  'absent',
  'pending',
];

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: 'Asistió',
  recovered: 'Recuperada',
  justified: 'Justificada',
  absent: 'No asistió',
  pending: 'Pendiente',
};

/** Local calendar dates: never derive a lesson day through a UTC conversion. */
export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function attendanceKey(studentId: string, sessionId: string): string {
  return `${studentId}|${sessionId}`;
}
