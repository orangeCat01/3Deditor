import { Easing } from '@tweenjs/tween.js';
import type { Editor } from '../Editor';
import type { TweenDefinition } from './TweenComponent';

export class TweenManager {
  constructor(private readonly editor: Editor) {}

  getActiveTweens(): Array<{ entityId: string; tween: TweenDefinition }> {
    return this.editor.entities.all.flatMap((entity) => {
      const animation = entity.components.animation as { tweens?: TweenDefinition[] } | undefined;
      return (animation?.tweens ?? [])
        .filter((tween) => tween.autoStart)
        .map((tween) => ({ entityId: entity.id, tween }));
    });
  }

  interpolate(tween: TweenDefinition, elapsedMs: number): number | string {
    const localTime = Math.max(0, elapsedMs - tween.delay);
    const duration = Math.max(1, tween.duration);
    const progress = tween.loop ? (localTime % duration) / duration : Math.min(localTime / duration, 1);
    const eased = Easing.Linear.None(progress);
    if (typeof tween.from === 'number' && typeof tween.to === 'number') {
      return tween.from + (tween.to - tween.from) * eased;
    }
    return progress >= 1 ? tween.to : tween.from;
  }
}
