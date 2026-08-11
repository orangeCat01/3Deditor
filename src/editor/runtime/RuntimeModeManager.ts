import { SceneDeserializer } from '../serializer/SceneDeserializer';
import { SceneSerializer } from '../serializer/SceneSerializer';
import type { SerializedSceneDocument } from '../serializer/SceneVersion';
import type { Editor } from '../Editor';

export type RuntimeMode = 'Edit' | 'Preview' | 'Play' | 'Pause' | 'Stop';

export class RuntimeModeManager {
  mode: RuntimeMode = 'Edit';
  private editSnapshot: SerializedSceneDocument | null = null;

  constructor(private readonly editor: Editor) {}

  play(): void {
    this.editSnapshot = new SceneSerializer().serialize(this.editor);
    this.mode = 'Play';
  }

  preview(): void {
    this.mode = 'Preview';
  }

  pause(): void {
    this.mode = 'Pause';
  }

  stop(): void {
    if (this.editSnapshot) {
      const result = new SceneDeserializer().deserialize(this.editSnapshot);
      this.editor.clearSceneInternal();
      result.assets.forEach((asset) => this.editor.assets.restore(asset));
      this.editor.restoreEntitiesInternal(result.entities);
    }
    this.mode = 'Stop';
  }
}
