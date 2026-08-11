import type { Editor } from '../Editor';
import type { SerializedSceneDocument } from './SceneVersion';
import { CURRENT_SCENE_VERSION } from './SceneVersion';

export class SceneSerializer {
  serialize(editor: Editor): SerializedSceneDocument {
    const entities = Object.fromEntries(
      editor.entities.all.map((entity) => [
        entity.id,
        {
          id: entity.id,
          name: entity.name,
          parentId: entity.parentId,
          children: [...entity.children],
          components: structuredClone(entity.components),
          editor: { ...entity.editor }
        }
      ])
    );

    const assets = Object.fromEntries(
      editor.assets.all.map((asset) => [
        asset.id,
        {
          id: asset.id,
          type: asset.type,
          name: asset.name,
          url: asset.url,
          metadata: structuredClone(asset.metadata),
          references: [...asset.references]
        }
      ])
    );

    return {
      version: CURRENT_SCENE_VERSION,
      scene: { rootEntities: editor.sceneGraph.rootIds },
      entities,
      assets,
      settings: {}
    };
  }
}
