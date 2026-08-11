import type { Editor } from '../Editor';
import type { EditorEntity, EntityId } from '../types';
import type { Command } from './Command';

export class DeleteEntityCommand implements Command {
  readonly name = 'Delete Entity';
  private deleted: EditorEntity[] = [];

  constructor(private readonly editor: Editor, private readonly ids: EntityId[]) {}

  execute(): void {
    this.deleted = this.editor.deleteEntitiesInternal(this.ids);
  }

  undo(): void {
    this.editor.restoreEntitiesInternal(this.deleted);
  }

  redo(): void {
    this.execute();
  }
}
