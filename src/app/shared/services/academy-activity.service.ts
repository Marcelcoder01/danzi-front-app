import { Injectable, inject, signal } from '@angular/core';
import { AcademyActivity } from '../interfaces/academy-activity.interface';
import { LocalStorageService } from './local-storage.service';

const KEY = 'danzi.activity.v1';
const isActivities = (value: unknown): value is AcademyActivity[] =>
  Array.isArray(value) && value.every((item) => !!item && typeof item === 'object' &&
    typeof (item as AcademyActivity).id === 'string' &&
    typeof (item as AcademyActivity).occurredAt === 'string');

@Injectable({ providedIn: 'root' })
export class AcademyActivityService {
  private readonly storage = inject(LocalStorageService);
  readonly version = signal(0);
  readonly items = this.storage.read<AcademyActivity[]>(KEY, [], isActivities);

  record(
    type: AcademyActivity['type'],
    description: string,
    studentId?: string,
    occurredAt = new Date().toISOString(),
  ): void {
    this.items.unshift({
      id: `activity-${globalThis.crypto.randomUUID()}`,
      type,
      description,
      occurredAt,
      studentId,
    });
    this.items.splice(50);
    this.storage.write(KEY, this.items);
    this.version.update((version) => version + 1);
  }

  removeForStudent(studentId: string, studentName: string): void {
    const remaining = this.items.filter(
      (item) => item.studentId !== studentId && !item.description.includes(studentName),
    );
    if (remaining.length === this.items.length) return;
    this.items.splice(0, this.items.length, ...remaining);
    this.storage.write(KEY, this.items);
    this.version.update((version) => version + 1);
  }
}
