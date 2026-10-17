import { Injectable, inject, signal } from '@angular/core';
import { AcademyDataService } from '../../../shared/services/academy-data.service';
import { RegularClassActivity } from '../../../shared/interfaces/class-activity.interface';
import {
  AttendanceRecord,
  AttendanceSession,
  AttendanceStatus,
  AttendanceEnrollmentRow,
  ATTENDANCE_STATUSES,
  attendanceKey,
  localDateKey,
  parseLocalDate,
} from '../interfaces/attendance.interface';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly academyData = inject(AcademyDataService);
  readonly today = localDateKey(new Date());
  readonly classes: RegularClassActivity[] = this.academyData.classes.filter(
    (activity): activity is RegularClassActivity =>
      activity.type === 'class' && activity.status === 'active',
  );
  readonly students: AttendanceEnrollmentRow[] = this.academyData.enrollments
    .filter(
      (enrollment) =>
        enrollment.enrolledAt <= this.today &&
        (!enrollment.withdrawnAt || enrollment.withdrawnAt > this.today),
    )
    .flatMap((enrollment, index) => {
      const student = this.academyData.students.find((item) => item.id === enrollment.studentId);
      const activity = this.classes.find((item) => item.id === enrollment.classId);
      return student && activity
        ? [
            {
              ...student,
              classId: activity.id,
              avatarColor: ['lilac', 'peach', 'mint', 'sky'][index % 4],
            },
          ]
        : [];
    });
  readonly records = signal<Record<string, AttendanceRecord>>({});
  readonly drafts = signal<Record<string, AttendanceRecord>>({});
  readonly feedback = signal('');
  readonly saveError = signal(false);
  private readonly storageKey = 'danzi.attendance.demo.v2';
  private readonly sessionCache = new Map<string, AttendanceSession[]>();

  constructor() {
    this.records.set(this.demoRecords());
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const saved: unknown = JSON.parse(raw);
        if (Array.isArray(saved)) {
          const valid = saved.filter((record): record is AttendanceRecord =>
            this.isValidRecord(record),
          );
          this.records.update((records) => ({
            ...records,
            ...Object.fromEntries(
              valid.map((record) => [attendanceKey(record.studentId, record.sessionId), record]),
            ),
          }));
        }
      }
    } catch {
      this.feedback.set('No pudimos leer el guardado local. Puedes seguir pasando lista.');
    }
  }

  sessions(month: string): AttendanceSession[] {
    const cached = this.sessionCache.get(month);
    if (cached) return cached;
    const [year, monthNumber] = month.split('-').map(Number);
    const length = new Date(year, monthNumber, 0).getDate();
    const sessions: AttendanceSession[] = [];
    for (let day = 1; day <= length; day++) {
      const date = new Date(year, monthNumber - 1, day, 12);
      for (const activity of this.classes) {
        if (activity.schedule.weekdays.includes(date.getDay())) {
          const key = localDateKey(date);
          sessions.push({ id: `${activity.id}:${key}`, classId: activity.id, date: key });
        }
      }
    }
    this.sessionCache.set(month, sessions);
    return sessions;
  }

  session(classId: string, date: string): AttendanceSession | undefined {
    return this.sessions(date.slice(0, 7)).find(
      (session) => session.classId === classId && session.date === date,
    );
  }

  record(studentId: string, sessionId: string): AttendanceRecord {
    const key = attendanceKey(studentId, sessionId);
    return this.drafts()[key] ?? this.records()[key] ?? { studentId, sessionId, status: 'pending' };
  }

  stage(
    student: AttendanceEnrollmentRow,
    session: AttendanceSession,
    status: AttendanceStatus,
    recoverySessionId?: string,
    note?: string,
  ): boolean {
    if (
      session.date > this.today ||
      session.classId !== student.classId ||
      !this.academyData.isEnrolled(student.id, session.classId, session.date)
    )
      return false;
    if (
      status === 'recovered' &&
      !this.recoveryOptions(student, session).some((option) => option.id === recoverySessionId)
    )
      return false;

    const record: AttendanceRecord = { studentId: student.id, sessionId: session.id, status };
    if (status === 'recovered') record.recoverySessionId = recoverySessionId;
    if (status === 'justified') record.note = note?.trim();
    this.drafts.update((drafts) => ({
      ...drafts,
      [attendanceKey(student.id, session.id)]: record,
    }));
    this.feedback.set('');
    this.saveError.set(false);
    return true;
  }

  recoveryOptions(
    student: AttendanceEnrollmentRow,
    source: AttendanceSession,
  ): AttendanceSession[] {
    const month = source.date.slice(0, 7);
    const sourceKey = attendanceKey(student.id, source.id);
    const effective = { ...this.records(), ...this.drafts() };
    const used = new Set(
      Object.entries(effective)
        .filter(
          ([key, record]) =>
            key !== sourceKey && record.studentId === student.id && record.status === 'recovered',
        )
        .map(([, record]) => record.recoverySessionId),
    );

    return this.sessions(month).filter((target) => {
      const activity = this.classes.find((item) => item.id === target.classId);
      return (
        target.classId !== source.classId &&
        (activity?.level === student.level || activity?.level === 'ALL_LEVELS') &&
        target.date >= source.date &&
        target.date <= this.today &&
        !used.has(target.id)
      );
    });
  }

  save(): boolean {
    if (!Object.keys(this.drafts()).length) return true;
    const effective = { ...this.records(), ...this.drafts() };
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(Object.values(effective)));
      this.records.set(effective);
      this.drafts.set({});
      this.feedback.set('Asistencia guardada en este dispositivo.');
      this.saveError.set(false);
      return true;
    } catch {
      this.feedback.set(
        'No se pudo guardar. Conservamos tus cambios para que lo intentes de nuevo.',
      );
      this.saveError.set(true);
      return false;
    }
  }

  private isValidRecord(value: unknown): value is AttendanceRecord {
    if (!value || typeof value !== 'object') return false;
    const record = value as AttendanceRecord;
    const student = this.academyData.students.find((item) => item.id === record.studentId);
    if (
      !student ||
      typeof record.sessionId !== 'string' ||
      !ATTENDANCE_STATUSES.includes(record.status)
    )
      return false;
    const date = record.sessionId.split(':')[1];
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date > this.today) return false;
    const source = this.sessionFromId(record.sessionId);
    if (
      !source ||
      source.date !== date ||
      !this.academyData.isEnrolled(student.id, source.classId, date)
    )
      return false;
    if (record.note !== undefined && typeof record.note !== 'string') return false;
    if (record.status === 'recovered') {
      const target = this.sessions(date.slice(0, 7)).find(
        (session) => session.id === record.recoverySessionId,
      );
      const activity = this.classes.find((item) => item.id === target?.classId);
      if (
        !target ||
        (activity?.level !== student.level && activity?.level !== 'ALL_LEVELS') ||
        target.classId === source.classId ||
        target.date < source.date ||
        target.date > this.today
      )
        return false;
    }
    return true;
  }

  private demoRecords(): Record<string, AttendanceRecord> {
    const records: Record<string, AttendanceRecord> = {};
    const current = parseLocalDate(this.today);
    for (let offset = -1; offset <= 0; offset++) {
      const month = localDateKey(
        new Date(current.getFullYear(), current.getMonth() + offset, 1, 12),
      ).slice(0, 7);
      for (const [studentIndex, student] of this.students.entries()) {
        const sessions = this.sessions(month).filter(
          (session) =>
            session.classId === student.classId &&
            session.date < this.today &&
            this.academyData.isEnrolled(student.id, session.classId, session.date),
        );
        sessions.forEach((session, index) => {
          const pattern = (index + studentIndex) % 8;
          const status: AttendanceStatus =
            pattern === 0 ? 'absent' : pattern === 1 ? 'justified' : 'present';
          records[attendanceKey(student.id, session.id)] = {
            studentId: student.id,
            sessionId: session.id,
            status,
            ...(status === 'justified' ? { note: 'Falta justificada por el alumno.' } : {}),
          };
        });
        const source = sessions.find((session, index) => index === 0);
        const target =
          source &&
          this.sessions(month).find(
            (target) =>
              target.classId !== source.classId &&
              (this.classes.find((activity) => activity.id === target.classId)?.level ===
                student.level ||
                this.classes.find((activity) => activity.id === target.classId)?.level ===
                  'ALL_LEVELS') &&
              target.date >= source.date &&
              target.date < this.today,
          );
        if (source && target && studentIndex % 3 === 0) {
          records[attendanceKey(student.id, source.id)] = {
            studentId: student.id,
            sessionId: source.id,
            status: 'recovered',
            recoverySessionId: target.id,
          };
        }
      }
    }
    return records;
  }

  private sessionFromId(sessionId: string): AttendanceSession | undefined {
    const separator = sessionId.lastIndexOf(':');
    if (separator < 1) return undefined;
    const classId = sessionId.slice(0, separator);
    const date = sessionId.slice(separator + 1);
    return this.session(classId, date);
  }
}
