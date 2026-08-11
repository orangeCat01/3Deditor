import type { Editor } from '../Editor';
import type { EditorEntity } from '../types';
import { cloneEntity } from '../entity/EntityManager';
import type { Command } from './Command';

export class AddEntityCommand implements Command {
  readonly name = 'Add Entity';
  private readonly entity: EditorEntity;

  constructor(private readonly editor: Editor, entity: EditorEntity) {
    this.entity = cloneEntity(entity);
  }

  execute(): void {
    this.editor.addEntityInternal(this.entity);
  }

  undo(): void {
    this.editor.removeEntityInternal(this.entity.id);
  }

  redo(): void {
    this.execute();
  }
}
