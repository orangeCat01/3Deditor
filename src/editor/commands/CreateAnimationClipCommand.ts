import type { Editor } from '../Editor';
import { cloneAnimationComponent, createDefaultAnimationComponent } from '../animation/AnimationComponent';
import type { AnimationClip } from '../animation/AnimationClip';
import type { EntityId } from '../types';
import type { Command } from './Command';

export class CreateAnimationClipCommand implements Command {
  readonly name = 'Create Animation Clip';
  private before = createDefaultAnimationComponent();
  private after = createDefaultAnimationComponent();

  constructor(private readonly editor: Editor, private readonly entityId: EntityId, private readonly clip: AnimationClip) {}

  execute(): void {
    const entity = this.editor.entities.get(this.entityId);
    if (!entity) return;
    this.before = entity.components.animation ? cloneAnimationComponent(entity.components.animation) : createDefaultAnimationComponent();
    this.after = {
      ...this.before,
      clips: [...this.before.clips.filter((clip) => clip.id !== this.clip.id), structuredClone(this.clip)],
      activeClipId: this.before.activeClipId ?? this.clip.id
    };
    this.editor.entities.replaceAnimation(this.entityId, this.after);
  }

  undo(): void {
    this.editor.entities.replaceAnimation(this.entityId, this.before);
  }

  redo(): void {
    this.editor.entities.replaceAnimation(this.entityId, this.after);
  }
}
