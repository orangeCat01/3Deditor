import type { Editor } from '../Editor';
import { cloneEntityWithNewIds } from '../entity/EntityManager';
import type { EditorEntity, EntityId } from '../types';
import type { Command } from './Command';

let duplicateCounter = 0;

export class DuplicateEntityCommand implements Command {
  readonly name = 'Duplicate Entity';
  private duplicated: EditorEntity[] = [];

  constructor(private readonly editor: Editor, private readonly ids: EntityId[]) {}

  execute(): void {
    if (this.duplicated.length === 0) {
      duplicateCounter += 1;
      this.duplicated = this.ids
        .map((id) => this.editor.entities.get(id))
        .filter((entity): entity is EditorEntity => Boolean(entity))
        .map((entity) => cloneEntityWithNewIds(entity, `copy_${duplicateCounter}`));
    }
    this.duplicated.forEach((entity) => this.editor.addEntityInternal(entity));
  }

  undo(): void {
    this.duplicated.forEach((entity) => this.editor.removeEntityInternal(entity.id));
  }

  redo(): void {
    this.execute();
  }
}
