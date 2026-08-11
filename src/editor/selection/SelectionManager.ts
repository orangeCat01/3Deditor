import type { EntityId } from '../types';

export class SelectionManager {
  private ids: EntityId[] = [];
  private hover: EntityId | null = null;

  get selectedIds(): EntityId[] {
    return [...this.ids];
  }

  get activeId(): EntityId | null {
    return this.ids.at(-1) ?? null;
  }

  get hoverId(): EntityId | null {
    return this.hover;
  }

  select(id: EntityId, additive = false): void {
    this.ids = additive ? [...new Set([...this.ids, id])] : [id];
  }

  set(ids: EntityId[], activeId?: EntityId | null): void {
    const uniqueIds = [...new Set(ids)];
    this.ids = activeId && uniqueIds.includes(activeId)
      ? [...uniqueIds.filter((id) => id !== activeId), activeId]
      : uniqueIds;
  }

  toggle(id: EntityId): void {
    this.ids = this.ids.includes(id) ? this.ids.filter((selectedId) => selectedId !== id) : [...this.ids, id];
  }

  setHover(id: EntityId | null): void {
    this.hover = id;
  }

  clear(): void {
    this.ids = [];
  }

  remove(id: EntityId): void {
    this.ids = this.ids.filter((selectedId) => selectedId !== id);
    if (this.hover === id) this.hover = null;
  }
}
