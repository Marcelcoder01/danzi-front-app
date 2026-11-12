import { Injectable, inject, signal } from '@angular/core';
import { AcademyDataService } from '@shared/services/academy-data.service';
import { LocalStorageService } from '@shared/services/local-storage.service';
import { RegularClassActivity } from '@shared/interfaces/class-activity.interface';
import {
  AttendanceRecord,
  AttendanceSession,
  AttendanceStatus,
  AttendanceEnrollmentRow,
  ATTENDANCE_STATUSES,
  attendanceKey,
  localDateKey,
} from '../interfaces/attendance.interface';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly academyData = inject(AcademyDataService);
  private readonly storage = inject(LocalStorageService);
  readonly today = localDateKey(new Date());
  get classes(): RegularClassActivity[] {
    this.academyData.classesVersion();
    return this.academyData.classes.filter(
      (activity): activity is RegularClassActivity =>
        activity.type === 'class' && activity.status === 'active',
    );
  }
  get students(): AttendanceEnrollmentRow[] {
    this.academyData.enrollmentsVersion();
    this.academyData.studentsVersion();
    const classes = this.classes;
    return this.academyData.enrollments
      .filter(
        (enrollment) =>
          enrollment.enrolledAt <= this.today &&
          (!enrollment.withdrawnAt || enrollment.withdrawnAt > this.today),
      )
      .flatMap((enrollment, index) => {
        const student = this.academyData.students.find((item) => item.id === enrollment.studentId);
        const activity = classes.find((item) => item.id === enrollment.classId);
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
  }
  readonly records = signal<Record<string, AttendanceRecord>>({});
  readonly drafts = signal<Record<string, AttendanceRecord>>({});
  readonly feedback = signal('');
  readonly saveError = signal(false);
  private readonly storageKey = 'danzi.attendance.v3';
  private readonly sessionCache = new Map<string, AttendanceSession[]>();

  constructor() {
    const saved = this.storage.read<unknown[]>(this.storageKey, [], Array.isArray);
    const valid = saved.filter((record): record is AttendanceRecord => this.isValidRecord(record));
    this.records.set(
      Object.fromEntries(
        valid.map((record) => [attendanceKey(record.studentId, record.sessionId), record]),
      ),
    );
  }

  sessions(month: string): AttendanceSession[] {
    const cacheKey = `${month}:${this.academyData.classesVersion()}`;
    const cached = this.sessionCache.get(cacheKey);
    if (cached) return cached;
    const [year, monthNumber] = month.split('-').map(Number);
    const length = new Date(year, monthNumber, 0).getDate();
    const sessions: AttendanceSession[] = [];
    for (let day = 1; day <= length; day++) {
      const date = new Date(year, monthNumber - 1, day, 12);
      for (const activity of this.classes) {
        if (activity.schedule.weekdays.includes(date.getDay())) {
          const key = localDateKey(date);
          if (key >= activity.startDate) {
            sessions.push({ id: `${activity.id}:${key}`, classId: activity.id, date: key });
          }
        }
      }
    }
    this.sessionCache.set(cacheKey, sessions);
    return sessions;
  }

  session(classId: string, date: string): AttendanceSession | undefined {
    return this.sessions(date.slice(0, 7)).find(
      (session) => session.classId === classId && session.date === date,
    );
  }

  isStudentEnrolledForSession(studentId: string, session: AttendanceSession): boolean {
    return this.academyData.isEnrolled(studentId, session.classId, session.date);
  }

  studentsEnrolledDuring(month: string): AttendanceEnrollmentRow[] {
    this.academyData.enrollmentsVersion();
    this.academyData.studentsVersion();
    const sessions = this.sessions(month).filter((session) => this.isSessionDue(session));
    const rows: AttendanceEnrollmentRow[] = [];
    const rowKeys = new Set<string>();
    for (const [index, enrollment] of this.academyData.enrollments.entries()) {
      const student = this.academyData.students.find((item) => item.id === enrollment.studentId);
      const activity = this.classes.find((item) => item.id === enrollment.classId);
      if (!student || !activity) continue;
      const rowKey = `${student.id}|${activity.id}`;
      if (rowKeys.has(rowKey)) continue;
      if (!sessions.some((session) =>
        session.classId === enrollment.classId &&
        enrollment.enrolledAt <= session.date &&
        (!enrollment.withdrawnAt || enrollment.withdrawnAt > session.date),
      )) continue;
      rowKeys.add(rowKey);
      rows.push({
        ...student,
        classId: activity.id,
        avatarColor: ['lilac', 'peach', 'mint', 'sky'][index % 4],
      });
    }
    return rows;
  }

  monthlyStats(month: string, students = this.studentsEnrolledDuring(month)) {
    const counts: Record<AttendanceStatus, number> = {
      present: 0,
      recovered: 0,
      justified: 0,
      absent: 0,
      pending: 0,
    };
    let expected = 0;

    for (const student of students) {
      for (const session of this.sessions(month)) {
        if (
          session.classId !== student.classId ||
          !this.isSessionDue(session) ||
          !this.academyData.isEnrolled(student.id, session.classId, session.date)
        ) continue;
        expected++;
        counts[this.record(student.id, session.id).status]++;
      }
    }

    const marked = expected - counts.pending;
    const attended = counts.present + counts.recovered;
    return {
      counts,
      expected,
      marked,
      attended,
      completionRate: expected ? Math.round((marked / expected) * 100) : 0,
      attendanceRate: expected ? Math.round((attended / expected) * 100) : 0,
    };
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
      this.storage.write(this.storageKey, Object.values(effective));
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

  private sessionFromId(sessionId: string): AttendanceSession | undefined {
    const separator = sessionId.lastIndexOf(':');
    if (separator < 1) return undefined;
    const classId = sessionId.slice(0, separator);
    const date = sessionId.slice(separator + 1);
    return this.session(classId, date);
  }

  private isSessionDue(session: AttendanceSession): boolean {
    if (session.date < this.today) return true;
    if (session.date > this.today) return false;
    const activity = this.classes.find((item) => item.id === session.classId);
    if (!activity) return false;
    const [hour, minute] = activity.schedule.startTime.split(':').map(Number);
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes() >= hour * 60 + minute;
  }
}
