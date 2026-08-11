import type { Editor } from '../Editor';
import { AnimationSystem } from '../animation/AnimationSystem';
import { TweenManager } from '../animation/TweenManager';
import { TweenSystem } from '../animation/TweenSystem';
import { TimerSystem } from '../timer/TimerSystem';
import { PhysicsAdapter } from '../physics/PhysicsAdapter';
import { PhysicsSystem } from '../physics/PhysicsSystem';
import type { RuntimeClock } from './RuntimeClock';
import type { RuntimeModeManager } from './RuntimeModeManager';

export class RuntimeLoop {
  readonly lastExecutionOrder: string[] = [];
  private readonly timerSystem: TimerSystem;
  private readonly animationSystem: AnimationSystem;
  private readonly tweenSystem: TweenSystem;
  private readonly physicsSystem: PhysicsSystem;

  constructor(editor: Editor, private readonly clock: RuntimeClock, private readonly mode: RuntimeModeManager) {
    this.timerSystem = new TimerSystem(editor);
    this.animationSystem = new AnimationSystem(editor);
    this.tweenSystem = new TweenSystem(editor, new TweenManager(editor));
    this.physicsSystem = new PhysicsSystem(editor, new PhysicsAdapter(editor));
  }

  tick(): void {
    this.lastExecutionOrder.length = 0;
    this.mark('Clock Update');
    this.mark('Timer Update');
    if (this.canRunRuntime()) this.timerSystem.update(this.clock);
    this.mark('Animation Update');
    if (this.canRunRuntime()) this.animationSystem.update(this.clock);
    this.mark('Tween Update');
    if (this.canRunRuntime()) this.tweenSystem.update(this.clock);
    this.mark('Physics Update');
    if (this.canRunRuntime()) this.physicsSystem.update(this.clock.deltaTime / 1000);
    this.mark('Shader Uniform Update');
    this.mark('Post Processing Update');
    this.mark('Render');
  }

  private canRunRuntime(): boolean {
    return this.mode.mode === 'Play' || this.mode.mode === 'Preview';
  }

  private mark(step: string): void {
    this.lastExecutionOrder.push(step);
  }
}

