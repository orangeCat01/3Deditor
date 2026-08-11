import type { Editor } from '../Editor';
import { cloneAnimationComponent } from '../animation/AnimationComponent';
import type { EntityId } from '../types';
import type { Command } from './Command';

export class DeleteAnimationClipCommand implements Command {
  readonly name = 'Delete Animation Clip';
  private before?: ReturnType<typeof cloneAnimationComponent>;
  private after?: ReturnType<typeof cloneAnimationComponent>;

  constructor(private readonly editor: Editor, private readonly entityId: EntityId, private readonly clipId: string) {}

  execute(): void {
    const animation = this.editor.entities.get(this.entityId)?.components.animation;
    if (!animation) return;
    this.before = cloneAnimationComponent(animation);
    const clips = this.before.clips.filter((clip) => clip.id !== this.clipId);
    this.after = {
      ...this.before,
      clips,
      activeClipId: this.before.activeClipId === this.clipId ? clips[0]?.id ?? null : this.before.activeClipId
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
