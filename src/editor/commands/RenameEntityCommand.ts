import type { Editor } from '../Editor';
import type { EntityId } from '../types';
import type { Command } from './Command';

export class RenameEntityCommand implements Command {
  readonly name = 'Rename Entity';
  private before = '';

  constructor(private readonly editor: Editor, private readonly id: EntityId, private readonly after: string) {}

  execute(): void {
    this.before = this.editor.entities.get(this.id)?.name ?? this.before;
    this.editor.entities.updateName(this.id, this.after);
  }

  undo(): void {
    this.editor.entities.updateName(this.id, this.before);
  }

  redo(): void {
    this.editor.entities.updateName(this.id, this.after);
  }
}
