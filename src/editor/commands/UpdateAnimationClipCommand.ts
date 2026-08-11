import type { Editor } from '../Editor';
import { cloneAnimationComponent } from '../animation/AnimationComponent';
import type { AnimationClipPatch } from '../animation/AnimationClip';
import type { EntityId } from '../types';
import type { Command } from './Command';

export class UpdateAnimationClipCommand implements Command {
  readonly name = 'Update Animation Clip';
  private before?: ReturnType<typeof cloneAnimationComponent>;
  private after?: ReturnType<typeof cloneAnimationComponent>;

  constructor(private readonly editor: Editor, private readonly entityId: EntityId, private readonly clipId: string, private readonly patch: AnimationClipPatch) {}

  execute(): void {
    const animation = this.editor.entities.get(this.entityId)?.components.animation;
    if (!animation) return;
    this.before = cloneAnimationComponent(animation);
    this.after = {
      ...this.before,
      clips: this.before.clips.map((clip) => (clip.id === this.clipId ? { ...clip, ...structuredClone(this.patch) } : structuredClone(clip)))
    };
    this.editor.entities.replaceAnimation(this.entityId, this.after);
  }

  undo(): void {
    if (this.before) this.editor.entities.replaceAnimation(this.entityId, this.before);
  }

  redo(): void {
    if (this.after) this.editor.entities.replaceAnimation(this.entityId, this.after);
  }
}
