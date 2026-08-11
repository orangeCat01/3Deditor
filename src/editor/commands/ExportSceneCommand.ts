import type { Editor } from '../Editor';
import { SceneSerializer } from '../serializer/SceneSerializer';
import type { SerializedSceneDocument } from '../serializer/SceneVersion';
import type { Command } from './Command';

export class ExportSceneCommand implements Command {
  readonly name = 'Export Scene';
  private exported?: SerializedSceneDocument;

  constructor(private readonly editor: Editor) {}

  execute(): void {
    this.exported = new SceneSerializer().serialize(this.editor);
  }

  undo(): void {}

  redo(): void {
    this.execute();
  }

  get document(): SerializedSceneDocument | undefined {
    return this.exported;
  }
}
