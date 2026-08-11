import type { Editor } from '../Editor';
import type { EntityId } from '../types';

export interface OverlapSelectionCandidate {
  entityId: EntityId;
  name: string;
  type: 'Mesh' | 'Group' | 'Entity';
  path: string;
}

export class OverlapSelection {
  constructor(private readonly editor: Editor) {}

  buildCandidates(entityIds: EntityId[]): OverlapSelectionCandidate[] {
    return [...new Set(entityIds)].map((entityId) => {
      const entity = this.editor.entities.get(entityId);
      return {
        entityId,
        name: entity?.name ?? entityId,
        type: entity?.components.mesh ? 'Mesh' : entity?.children.length ? 'Group' : 'Entity',
        path: this.pathFor(entityId)
      };
    });
  }

  setActive(entityId: EntityId): void {
    this.editor.setSelection([entityId], entityId);
  }

  private pathFor(entityId: EntityId): string {
    const names: string[] = [];
    let current = this.editor.entities.get(entityId);
    while (current) {
      names.unshift(current.name);
      current = current.parentId ? this.editor.entities.get(current.parentId) : undefined;
    }
    return names.join(' / ');
  }
}
