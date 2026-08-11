import type { Command } from './Command';
import type { PostProcessingManager } from '../postprocess/PostProcessingManager';
import type { PostProcessPassPatch, PostProcessPassType, PostProcessPass } from '../postprocess/PostProcessPass';

export class SetPostProcessPassCommand implements Command {
  readonly name = 'Set Post Process Pass';
  private before?: PostProcessPass;
  private after?: PostProcessPass;

  constructor(private readonly manager: PostProcessingManager, private readonly passId: PostProcessPassType, private readonly patch: PostProcessPassPatch) {}

  execute(): void {
    this.before = this.manager.getPass(this.passId);
    this.manager.updatePass(this.passId, this.patch);
    this.after = this.manager.getPass(this.passId);
  }

  undo(): void {
    if (this.before) this.manager.updatePass(this.passId, { enabled: this.before.enabled, parameters: this.before.parameters });
  }

  redo(): void {
    if (this.after) this.manager.updatePass(this.passId, { enabled: this.after.enabled, parameters: this.after.parameters });
  }
}
