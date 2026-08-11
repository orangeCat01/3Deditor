import type { Editor } from '../Editor';
import { cloneShaderComponent } from '../shader/ShaderComponent';
import type { ShaderComponent } from '../shader/ShaderComponent';
import type { EntityId } from '../types';
import type { Command } from './Command';

export class SetShaderCommand implements Command {
  readonly name = 'Set Shader';
  private before?: ShaderComponent;
  private after?: ShaderComponent;

  constructor(private readonly editor: Editor, private readonly entityId: EntityId, shader: ShaderComponent) {
    this.after = cloneShaderComponent(shader);
  }

  execute(): void {
    const current = this.editor.entities.get(this.entityId)?.components.shader;
    this.before = current ? cloneShaderComponent(current) : undefined;
    this.editor.entities.replaceShader(this.entityId, this.after);
    this.updateReferences(this.before?.shaderAssetId, this.after?.shaderAssetId);
  }

  undo(): void {
    this.editor.entities.replaceShader(this.entityId, this.before);
    this.updateReferences(this.after?.shaderAssetId, this.before?.shaderAssetId);
  }

  redo(): void {
    this.editor.entities.replaceShader(this.entityId, this.after);
    this.updateReferences(this.before?.shaderAssetId, this.after?.shaderAssetId);
  }

  private updateReferences(previous?: string | null, next?: string | null): void {
    if (previous && previous !== next) this.editor.assets.removeReference(previous, this.entityId);
    if (next) this.editor.assets.addReference(next, this.entityId);
  }
}
