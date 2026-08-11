import type { EntityId, EditorEntity } from '../types';

export class SceneGraph {
  private roots: EntityId[] = [];
  private getEntity?: (id: EntityId) => EditorEntity | undefined;

  get rootIds(): EntityId[] {
    return [...this.roots];
  }

  bindEntityGetter(getEntity: (id: EntityId) => EditorEntity | undefined): void {
    this.getEntity = getEntity;
  }

  addEntity(entity: EditorEntity): void {
    if (entity.parentId === null) this.addRoot(entity.id);
  }

  addRoot(id: EntityId, index = this.roots.length): void {
    this.roots = this.roots.filter((rootId) => rootId !== id);
    this.roots.splice(clampIndex(index, this.roots.length), 0, id);
  }

  removeEntity(id: EntityId): void {
    this.roots = this.roots.filter((rootId) => rootId !== id);
  }

  setRootOrder(rootIds: EntityId[]): void {
    this.roots = [...rootIds];
  }

  getChildren(parentId: EntityId): EntityId[] {
    return this.getEntity?.(parentId)?.children ?? [];
  }

  attachEntity(
    id: EntityId,
    parentId: EntityId | null,
    entities: {
      get(id: EntityId): EditorEntity | undefined;
      setParent(id: EntityId, parentId: EntityId | null): void;
      setChildren(id: EntityId, children: EntityId[]): void;
    },
    index?: number
  ): void {
    const entity = entities.get(id);
    if (!entity) return;

    if (entity.parentId) {
      const oldParent = entities.get(entity.parentId);
      if (oldParent) entities.setChildren(oldParent.id, oldParent.children.filter((childId) => childId !== id));
    } else {
      this.removeEntity(id);
    }

    entities.setParent(id, parentId);
    if (parentId) {
      const parent = entities.get(parentId);
      if (!parent) return;
      const children = parent.children.filter((childId) => childId !== id);
      children.splice(clampIndex(index ?? children.length, children.length), 0, id);
      entities.setChildren(parentId, children);
    } else {
      this.addRoot(id, index);
    }
  }

  setChildOrder(parentId: EntityId | null, ids: EntityId[], entities?: { setChildren(id: EntityId, children: EntityId[]): void }): void {
    if (parentId === null) {
      this.setRootOrder(ids);
      return;
    }
    entities?.setChildren(parentId, ids);
  }
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(index, length));
}
