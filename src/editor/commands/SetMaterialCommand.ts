import type { Editor } from '../Editor';
import type { MaterialComponent, MaterialPatch } from '../components/RenderComponents';
import type { EntityId } from '../types';
import type { Command } from './Command';

export class SetMaterialCommand implements Command {
  readonly name = 'Set Material';
  private before?: MaterialComponent;
  private after?: MaterialComponent;

  constructor(private readonly editor: Editor, private readonly entityId: EntityId, private readonly patch: MaterialPatch) {}

  execute(): void {
    const material = this.editor.entities.get(this.entityId)?.components.material;
    if (!material) return;
    this.before = { ...material };
    this.after = { ...material, ...this.patch };
    this.editor.entities.replaceMaterial(this.entityId, this.after);
  }

  undo(): void {
    if (this.before) this.editor.entities.replaceMaterial(this.entityId, this.before);
  }

  redo(): void {
    if (this.after) this.editor.entities.replaceMaterial(this.entityId, this.after);
  }
}
