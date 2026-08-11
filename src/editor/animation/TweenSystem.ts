import type { Editor } from '../Editor';
import type { RuntimeClock } from '../runtime/RuntimeClock';
import type { TweenManager } from './TweenManager';

export class TweenSystem {
  constructor(private readonly editor: Editor, private readonly tweens: TweenManager) {}

  update(clock: RuntimeClock): void {
    if (clock.paused) return;
    this.tweens.getActiveTweens().forEach(({ entityId, tween }) => {
      const value = this.tweens.interpolate(tween, clock.elapsedTime);
      this.apply(entityId, tween.target, value);
    });
  }

  private apply(entityId: string, target: string, value: number | string): void {
    const transform = this.editor.entities.getTransform(entityId);
    if (transform && typeof value === 'number') {
      if (target === 'transform.position.x') transform.position.x = value;
      if (target === 'transform.position.y') transform.position.y = value;
      if (target === 'transform.position.z') transform.position.z = value;
      if (target === 'transform.scale.x') transform.scale.x = value;
      if (target === 'transform.scale.y') transform.scale.y = value;
      if (target === 'transform.scale.z') transform.scale.z = value;
      this.editor.entities.replaceTransform(entityId, transform);
      return;
    }
    const material = this.editor.entities.get(entityId)?.components.material;
    if (!material) return;
    if (target === 'material.opacity' && typeof value === 'number') this.editor.entities.replaceMaterial(entityId, { ...material, opacity: value });
    if (target === 'material.color' && typeof value === 'string') this.editor.entities.replaceMaterial(entityId, { ...material, color: value });
  }
}
