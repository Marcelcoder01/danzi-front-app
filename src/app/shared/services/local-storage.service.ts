import { Injectable } from '@angular/core';

/** Small browser storage adapter. Keeps services usable when storage is unavailable. */
@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  read<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
    try {
      const raw = globalThis.localStorage?.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      const value: unknown = JSON.parse(raw);
      return isValid(value) ? value : fallback;
    } catch {
      return fallback;
    }
  }

  write<T>(key: string, value: T): void {
    const storage = globalThis.localStorage;
    if (!storage) throw new Error('Local storage is unavailable.');
    storage.setItem(key, JSON.stringify(value));
  }
}
