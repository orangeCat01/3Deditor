import type { Editor } from '../Editor';
import type { TweenComponent, TweenDefinition } from '../animation/TweenComponent';
import type { EntityId } from '../types';
import type { Command } from './Command';

export type AnimationTweenPatch = Partial<Pick<TweenDefinition, 'duration' | 'delay' | 'loop' | 'easing' | 'autoStart'>>;

export class SetAnimationCommand implements Command {
  readonly name = 'Set Animation';
  private before?: TweenComponent;
  private after?: TweenComponent;

  constructor(private readonly editor: Editor, private readonly entityId: EntityId, private readonly patch: AnimationTweenPatch, private readonly tweenIndex = 0) {}

  execute(): void {
    const animation = this.editor.entities.get(this.entityId)?.components.animation;
    if (!animation || animation.type !== 'animation') return;
    this.before = cloneAnimation(animation);
    const tweens = animation.tweens.map((tween, index) => (index === this.tweenIndex ? { ...tween, ...this.patch } : { ...tween }));
    this.after = { ...animation, tweens };
    this.editor.entities.replaceAnimation(this.entityId, this.after);
  }

  undo(): void {
    if (this.before) this.editor.entities.replaceAnimation(this.entityId, this.before);
  }

  redo(): void {
    if (this.after) this.editor.entities.replaceAnimation(this.entityId, this.after);
  }
}

function cloneAnimation(animation: TweenComponent): TweenComponent {
  return { ...animation, tweens: animation.tweens.map((tween) => ({ ...tween })) };
}
