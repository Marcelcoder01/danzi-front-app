import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AttendanceComponent } from './attendance.component';

describe('AttendanceComponent', () => {
  let component: AttendanceComponent;
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 9, 12));
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() });
    await TestBed.configureTestingModule({ imports: [AttendanceComponent] }).compileComponents();
    component = TestBed.createComponent(AttendanceComponent).componentInstance;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('finds accented names without requiring the accent', () => {
    component.searchTerm = 'lucia';
    expect(component.roster.map((student) => student.firstName)).toEqual(['Lucía']);
    component.searchTerm = 'nobody';
    expect(component.roster).toHaveLength(0);
  });

  it('keeps marked drafts when switching class and counts each student only once', () => {
    const student = component.roster[0];
    component.quickMark(student, 'absent');
    const count = component.draftCount;
    component.sessionClassId = 'bachata-a1';
    component.chooseClass();
    expect(component.draftCount).toBe(count);
    expect(component.roster.every((student) => student.classId === 'bachata-a1')).toBe(true);
    expect(
      ['attended', 'missed', 'pending'].reduce(
        (sum, filter) => sum + component.filterCount(filter),
        0,
      ),
    ).toBe(component.sessionStudents.length);
  });

  it('marks only the visible pending students and never overwrites existing attendance', () => {
    component.selectedDate = '2026-10-07';
    const first = component.sessionStudents[0];
    const second = component.sessionStudents[1];
    const session = component.selectedSession!;
    component.attendance.stage(first, session, 'pending');
    component.attendance.stage(second, session, 'absent');
    component.searchTerm = 'Ana';
    component.markPending();
    expect(component.sessionStatus(first)).toBe('present');
    expect(component.sessionStatus(second)).toBe('absent');
  });
});
