import type { TransformComponent, TransformPatch } from '../components/TransformComponent';
import type { Editor } from '../Editor';
import type { EntityId } from '../types';
import type { Command } from './Command';

export class SetTransformCommand implements Command {
  readonly name = 'Set Transform';
  private before: TransformComponent | undefined;
  private after: TransformComponent | undefined;

  constructor(
    private readonly editor: Editor,
    private readonly entityId: EntityId,
    private readonly patch: TransformPatch
  ) {}

  execute(): void {
    this.before = this.editor.entities.getTransform(this.entityId);
    this.editor.entities.setTransform(this.entityId, this.patch);
    this.after = this.editor.entities.getTransform(this.entityId);
    this.editor.notifySceneChanged();
  }

  undo(): void {
    if (!this.before) return;
    this.editor.entities.replaceTransform(this.entityId, this.before);
    this.editor.notifySceneChanged();
  }

  redo(): void {
    if (!this.after) return;
    this.editor.entities.replaceTransform(this.entityId, this.after);
    this.editor.notifySceneChanged();
  }
}
