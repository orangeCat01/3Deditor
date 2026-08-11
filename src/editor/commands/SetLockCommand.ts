import type { Editor } from '../Editor';
import type { EntityId } from '../types';
import type { Command } from './Command';

export class SetLockCommand implements Command {
  readonly name = 'Set Lock';
  private before = false;

  constructor(private readonly editor: Editor, private readonly id: EntityId, private readonly locked: boolean) {}

  execute(): void {
    this.before = this.editor.entities.get(this.id)?.editor.locked ?? false;
    this.editor.entities.setLock(this.id, this.locked);
  }

  undo(): void {
    this.editor.entities.setLock(this.id, this.before);
  }

  redo(): void {
    this.editor.entities.setLock(this.id, this.locked);
  }
}
