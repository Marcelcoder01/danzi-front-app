import { Injectable, inject, signal } from '@angular/core';
import { Enrollment } from '../interfaces/enrollment.interface';
import { DEMO_ENROLLMENTS } from '../data/demo-school.data';
import { LocalStorageService } from './local-storage.service';

const KEY = 'danzi.enrollments.v1';
const isEnrollments = (value: unknown): value is Enrollment[] =>
  Array.isArray(value) && value.every((item) => !!item && typeof item === 'object' && typeof (item as Enrollment).id === 'string');

@Injectable({ providedIn: 'root' })
export class EnrollmentsDataService {
  private readonly storage = inject(LocalStorageService);
  readonly items = this.storage.read(KEY, DEMO_ENROLLMENTS.map((item) => ({ ...item })), isEnrollments);
  readonly version = signal(0);
  add(enrollment: Enrollment): void { this.items.push(enrollment); this.persist(); }
  removeForClass(id: string): void {
    const remaining = this.items.filter((item) => item.classId !== id);
    this.items.splice(0, this.items.length, ...remaining); this.persist();
  }
  persistChanges(): void { this.persist(); }
  private persist(): void { this.storage.write(KEY, this.items); this.version.update((v) => v + 1); }
}
