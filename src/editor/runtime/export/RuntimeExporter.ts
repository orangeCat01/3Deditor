import type { Editor } from '../../Editor';
import { SceneSerializer } from '../../serializer/SceneSerializer';
import type { SerializedSceneDocument } from '../../serializer/SceneVersion';

export class RuntimeExporter {
  export(editor: Editor): SerializedSceneDocument {
    const document = new SceneSerializer().serialize(editor);
    const entities = Object.fromEntries(
      Object.entries(document.entities).map(([id, entity]) => [
        id,
        {
          ...entity,
          editor: { visible: entity.editor?.visible ?? true, locked: false }
        }
      ])
    );

    return {
      ...document,
      entities,
      settings: {
        runtime: true,
        exportedAtVersion: document.version
      }
    };
  }
}
