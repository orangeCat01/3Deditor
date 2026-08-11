import type { Editor } from '../Editor';
import type { EntityId } from '../types';
import type { Command } from './Command';

export class SetVisibilityCommand implements Command {
  readonly name = 'Set Visibility';
  private before = true;

  constructor(private readonly editor: Editor, private readonly id: EntityId, private readonly visible: boolean) {}

  execute(): void {
    this.before = this.editor.entities.get(this.id)?.editor.visible ?? true;
    this.editor.entities.setVisibility(this.id, this.visible);
  }

  undo(): void {
    this.editor.entities.setVisibility(this.id, this.before);
  }

  redo(): void {
    this.editor.entities.setVisibility(this.id, this.visible);
  }
}
