import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AttendanceService } from './attendance.service';
import { attendanceKey, localDateKey, parseLocalDate } from '../interfaces/attendance.interface';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let saved: Map<string, string>;
  let storage: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 9, 12));
    saved = new Map();
    storage = {
      getItem: vi.fn((key: string) => saved.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => saved.set(key, value)),
    };
    vi.stubGlobal('localStorage', storage);
    service = new AttendanceService();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('keeps edits in a draft until Save and restores them after reopening', () => {
    const student = service.students[0];
    const session = service.session(student.classId, '2026-10-07')!;
    const key = attendanceKey(student.id, session.id);
    const original = service.records()[key].status;
    const next = original === 'absent' ? 'present' : 'absent';
    expect(service.stage(student, session, next)).toBe(true);
    expect(service.record(student.id, session.id).status).toBe(next);
    expect(service.records()[key].status).toBe(original);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(service.save()).toBe(true);
    expect(Object.keys(service.drafts())).toHaveLength(0);
    expect(new AttendanceService().record(student.id, session.id).status).toBe(next);
  });

  it('retains unsaved edits when the device cannot persist data', () => {
    const student = service.students[0];
    const session = service.session(student.classId, '2026-10-07')!;
    service.stage(student, session, 'absent');
    storage.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(service.save()).toBe(false);
    expect(service.saveError()).toBe(true);
    expect(Object.keys(service.drafts())).toHaveLength(1);
    expect(service.record(student.id, session.id).status).toBe('absent');
  });

  it('does not mark future sessions or sessions from a different enrollment', () => {
    const student = service.students[0];
    expect(service.stage(student, service.session(student.classId, '2026-10-12')!, 'present')).toBe(
      false,
    );
    expect(service.stage(student, service.session('bachata-b2', '2026-10-08')!, 'present')).toBe(
      false,
    );
    expect(Object.keys(service.drafts())).toHaveLength(0);
  });

  it('offers recoveries only after the missed class, in the same exact level and month', () => {
    const student = service.students[0];
    const source = service.session(student.classId, '2026-10-05')!;
    const options = service.recoveryOptions(student, source);
    expect(options.map((session) => session.date)).toEqual(['2026-10-06', '2026-10-08']);
    expect(options.every((session) => session.classId === 'bachata-b2')).toBe(true);
    expect(service.stage(student, source, 'recovered', 'bachata-a1:2026-10-08')).toBe(false);
    expect(service.stage(student, source, 'recovered', 'bachata-b2:2026-09-29')).toBe(false);
    expect(service.stage(student, source, 'recovered', 'bachata-b2:2026-10-13')).toBe(false);
  });

  it('cannot reuse a recovery session for two missed classes of the same student', () => {
    const student = service.students[0];
    const first = service.session(student.classId, '2026-10-05')!;
    const second = service.session(student.classId, '2026-10-07')!;
    const target = 'bachata-b2:2026-10-08';
    expect(service.stage(student, first, 'recovered', target)).toBe(true);
    expect(service.stage(student, second, 'recovered', target)).toBe(false);
    expect(service.recoveryOptions(student, first).some((session) => session.id === target)).toBe(
      true,
    );
    service.stage(student, first, 'absent');
    expect(service.stage(student, second, 'recovered', target)).toBe(true);
  });

  it('removes recovery metadata when changing the status and keeps justification notes', () => {
    const student = service.students[0];
    const session = service.session(student.classId, '2026-10-05')!;
    service.stage(student, session, 'recovered', 'bachata-b2:2026-10-08');
    service.stage(student, session, 'justified', undefined, '  Avisó a la escuela  ');
    expect(service.record(student.id, session.id)).toEqual({
      studentId: student.id,
      sessionId: session.id,
      status: 'justified',
      note: 'Avisó a la escuela',
    });
  });

  it('ignores corrupt stored records instead of breaking the attendance page', () => {
    saved.set(
      'danzi.attendance.demo.v1',
      JSON.stringify([
        { studentId: 'unknown', sessionId: 'x:2026-10-07', status: 'present' },
        null,
      ]),
    );
    expect(() => new AttendanceService()).not.toThrow();
    saved.set('danzi.attendance.demo.v1', '{not valid json');
    expect(new AttendanceService().feedback()).toContain('leer');
  });

  it('generates actual scheduled dates including leap days using local calendar dates', () => {
    expect(service.session('bachata-b2', '2028-02-29')?.date).toBe('2028-02-29');
    expect(service.session('salsa-b2', '2026-10-09')).toBeUndefined();
    expect(localDateKey(parseLocalDate('2026-10-01'))).toBe('2026-10-01');
  });
});
