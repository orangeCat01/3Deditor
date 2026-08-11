import type { Editor } from '../Editor';
import type { TransformComponent } from '../components/TransformComponent';
import type { EntityId, Vector3Data } from '../types';
import type { PivotResult } from '../transform/PivotManager';
import type { Command } from './Command';

export interface TransformRecord {
  entityId: EntityId;
  before: TransformComponent;
  after: TransformComponent;
}

export class TransformSelectionCommand implements Command {
  readonly name = 'Transform Selection';

  constructor(
    private readonly editor: Editor,
    private readonly records: TransformRecord[],
    readonly pivot: PivotResult,
    readonly coordinateSpace: 'world' | 'local'
  ) {}

  execute(): void {
    this.apply('after');
  }

  undo(): void {
    this.apply('before');
  }

  redo(): void {
    this.execute();
  }

  private apply(side: 'before' | 'after'): void {
    this.records.forEach((record) => {
      const transform = record[side];
      this.editor.entities.replaceTransform(record.entityId, transform);
    });
  }
}

export function addVector(a: Vector3Data, b: Vector3Data): Vector3Data {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subtractVector(a: Vector3Data, b: Vector3Data): Vector3Data {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
