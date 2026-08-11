import type { Editor } from '../Editor';
import { cloneTimerComponent } from '../timer/TimerComponent';
import type { TimerComponentPatch } from '../timer/TimerComponent';
import type { EntityId } from '../types';
import type { Command } from './Command';

export class SetTimerCommand implements Command {
  readonly name = 'Set Timer';
  private before?: ReturnType<typeof cloneTimerComponent>;
  private after?: ReturnType<typeof cloneTimerComponent>;

  constructor(private readonly editor: Editor, private readonly entityId: EntityId, private readonly patch: TimerComponentPatch) {}

  execute(): void {
    const timer = this.editor.entities.get(this.entityId)?.components.timer;
    if (!timer) return;
    this.before = cloneTimerComponent(timer);
    this.after = { ...this.before, ...structuredClone(this.patch) };
    this.editor.entities.replaceTimer(this.entityId, this.after);
  }

  undo(): void {
    if (this.before) this.editor.entities.replaceTimer(this.entityId, this.before);
  }

  redo(): void {
    if (this.after) this.editor.entities.replaceTimer(this.entityId, this.after);
  }
}
