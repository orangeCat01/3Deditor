import type { LayoutSnapshot } from './types';

export class LayoutStore {
  constructor(private readonly storageKey = 'web-3d-editor.layout') {}

  save(snapshot: LayoutSnapshot): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(snapshot));
  }

  load(): LayoutSnapshot | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LayoutSnapshot;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}
