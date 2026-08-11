import type { Editor } from '../Editor';
import type { EntityId, Vector3Data } from '../types';

export type PivotMode = 'object-origin' | 'selection-center' | 'bounding-box-center' | 'active-object' | 'world-origin';

export interface PivotResult {
  mode: PivotMode;
  position: Vector3Data;
}

export class PivotManager {
  constructor(private readonly editor: Editor) {}

  getEffectiveTransformRoots(ids: EntityId[]): EntityId[] {
    return ids.filter((id) => {
      let parentId = this.editor.entities.get(id)?.parentId ?? null;
      while (parentId) {
        if (ids.includes(parentId)) return false;
        parentId = this.editor.entities.get(parentId)?.parentId ?? null;
      }
      return true;
    });
  }

  calculatePivot(ids: EntityId[], mode: PivotMode): PivotResult {
    if (mode === 'world-origin' || ids.length === 0) return { mode, position: { x: 0, y: 0, z: 0 } };

    const activeId = this.editor.selection.activeId;
    if (mode === 'active-object' && activeId) {
      return { mode, position: this.editor.entities.getTransform(activeId)?.position ?? { x: 0, y: 0, z: 0 } };
    }

    if (mode === 'object-origin' && ids[0]) {
      return { mode, position: this.editor.entities.getTransform(ids[0])?.position ?? { x: 0, y: 0, z: 0 } };
    }

    const positions = ids
      .map((id) => this.editor.entities.getTransform(id)?.position)
      .filter((position): position is Vector3Data => Boolean(position));
    const total = positions.reduce((sum, position) => ({ x: sum.x + position.x, y: sum.y + position.y, z: sum.z + position.z }), { x: 0, y: 0, z: 0 });
    const count = Math.max(positions.length, 1);
    return { mode, position: { x: total.x / count, y: total.y / count, z: total.z / count } };
  }
}
