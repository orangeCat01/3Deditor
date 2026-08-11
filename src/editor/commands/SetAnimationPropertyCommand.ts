import type { Editor } from '../Editor';
import { cloneAnimationComponent } from '../animation/AnimationComponent';
import type { AnimationComponentPatch } from '../animation/AnimationComponent';
import type { EntityId } from '../types';
import type { Command } from './Command';

export class SetAnimationPropertyCommand implements Command {
  readonly name = 'Set Animation Property';
  private before?: ReturnType<typeof cloneAnimationComponent>;
  private after?: ReturnType<typeof cloneAnimationComponent>;

  constructor(private readonly editor: Editor, private readonly entityId: EntityId, private readonly patch: AnimationComponentPatch) {}

  execute(): void {
    const animation = this.editor.entities.get(this.entityId)?.components.animation;
    if (!animation) return;
    this.before = cloneAnimationComponent(animation);
    this.after = { ...this.before, ...structuredClone(this.patch) };
    this.editor.entities.replaceAnimation(this.entityId, this.after);
  }

  undo(): void {
    if (this.before) this.editor.entities.replaceAnimation(this.entityId, this.before);
  }

  redo(): void {
    if (this.after) this.editor.entities.replaceAnimation(this.entityId, this.after);
  }
}
