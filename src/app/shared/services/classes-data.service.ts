import { Injectable, inject, signal } from '@angular/core';
import { ClassActivity, RegularClassActivity } from '../interfaces/class-activity.interface';
import { DEMO_CLASSES } from '../data/demo-school.data';
import { LocalStorageService } from './local-storage.service';

const KEY = 'danzi.classes.v1';
const isClasses = (value: unknown): value is ClassActivity[] =>
  Array.isArray(value) && value.every((item) => !!item && typeof item === 'object' && typeof (item as ClassActivity).id === 'string');

@Injectable({ providedIn: 'root' })
export class ClassesDataService {
  private readonly storage = inject(LocalStorageService);
  readonly items = this.storage.read(KEY, DEMO_CLASSES.map((item) => ({ ...item })), isClasses);
  readonly version = signal(0);
  add(activity: RegularClassActivity): void { this.items.push(activity); this.persist(); }
  update(updated: RegularClassActivity): boolean {
    const current = this.items.find((item) => item.id === updated.id && item.type === 'class');
    if (!current) return false;
    Object.assign(current, updated); this.persist(); return true;
  }
  remove(id: string): boolean {
    const index = this.items.findIndex((item) => item.id === id && item.type === 'class');
    if (index < 0) return false;
    this.items.splice(index, 1); this.persist(); return true;
  }
  private persist(): void { this.storage.write(KEY, this.items); this.version.update((v) => v + 1); }
}
