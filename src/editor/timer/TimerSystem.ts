import type { Editor } from '../Editor';
import type { MaterialPatch } from '../components/RenderComponents';
import type { TransformPatch } from '../components/TransformComponent';
import type { RuntimeClock } from '../runtime/RuntimeClock';
import type { TimerAction } from './TimerAction';
import type { TimerComponent } from './TimerComponent';

export class TimerSystem {
  constructor(private readonly editor: Editor) {}

  update(clock: RuntimeClock): void {
    if (clock.paused) return;
    this.editor.entities.all.forEach((entity) => {
      const timer = entity.components.timer;
      if (!timer || timer.paused) return;
      if (!timer.running && !timer.autoStart) return;
      timer.running = true;
      timer.elapsed = (timer.elapsed ?? 0) + clock.deltaTime;
      timer.firedCount = timer.firedCount ?? 0;
      while (timer.elapsed >= timer.delay && this.canFire(timer)) {
        timer.elapsed -= timer.delay;
        timer.firedCount += 1;
        timer.actions.forEach((action) => this.executeAction(action));
        if (!timer.repeat) break;
      }
    });
  }

  pause(timer: TimerComponent): void {
    timer.paused = true;
  }

  resume(timer: TimerComponent): void {
    timer.paused = false;
    timer.running = true;
  }

  reset(timer: TimerComponent): void {
    timer.elapsed = 0;
    timer.firedCount = 0;
    timer.running = timer.autoStart;
  }

  private canFire(timer: TimerComponent): boolean {
    if (timer.repeat) return timer.repeatCount <= 0 || (timer.firedCount ?? 0) < timer.repeatCount;
    return (timer.firedCount ?? 0) < 1;
  }

  private executeAction(action: TimerAction): void {
    const entity = 'entityId' in action ? this.editor.entities.get(action.entityId) : undefined;
    if (action.type === 'PlayAnimation' && entity?.components.animation) entity.components.animation.playing = true;
    if (action.type === 'PauseAnimation' && entity?.components.animation) entity.components.animation.playing = false;
    if (action.type === 'StopAnimation' && entity?.components.animation) entity.components.animation.playing = false;
    if (action.type === 'SetVisibility') this.editor.entities.setVisibility(action.entityId, action.visible);
    if (action.type === 'SetTransform') {
      const patch: TransformPatch = { position: action.position, quaternion: action.quaternion, scale: action.scale };
      this.editor.entities.setTransform(action.entityId, patch);
    }
    if (action.type === 'SetMaterialProperty') {
      const material = entity?.components.material;
      if (material) this.editor.entities.replaceMaterial(action.entityId, { ...material, [action.property]: action.value } as MaterialPatch & typeof material);
    }
    // Shader、Camera 与编辑器自定义事件在本阶段保留配置入口，后续 Runtime 服务消费。 
  }
}
