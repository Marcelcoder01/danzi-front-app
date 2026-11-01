import { Injectable, inject, signal } from '@angular/core';
import { Student } from '../interfaces/student.interface';
import { LocalStorageService } from './local-storage.service';

const KEY = 'danzi.students.v2';
const isStudents = (value: unknown): value is Student[] =>
  Array.isArray(value) && value.every((item) => !!item && typeof item === 'object' && typeof (item as Student).id === 'string');

@Injectable({ providedIn: 'root' })
export class StudentsDataService {
  private readonly storage = inject(LocalStorageService);
  readonly items = this.storage.read(KEY, [], isStudents);
  readonly version = signal(0);

  add(student: Student): void { this.items.push(student); this.persist(); }
  update(updated: Student): boolean {
    const current = this.items.find((item) => item.id === updated.id);
    if (!current) return false;
    Object.assign(current, updated); this.persist(); return true;
  }
  remove(id: string): boolean {
    const index = this.items.findIndex((item) => item.id === id);
    if (index < 0) return false;
    this.items.splice(index, 1);
    this.persist();
    return true;
  }
  private persist(): void { this.storage.write(KEY, this.items); this.version.update((v) => v + 1); }
}
