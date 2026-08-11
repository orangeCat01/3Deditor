import type { SerializedSceneDocument } from './SceneVersion';
import { CURRENT_SCENE_VERSION } from './SceneVersion';

export class MigrationManager {
  migrate(document: SerializedSceneDocument): SerializedSceneDocument {
    if (document.version === CURRENT_SCENE_VERSION) return document;
    return {
      ...document,
      version: CURRENT_SCENE_VERSION,
      settings: {
        ...(document.settings ?? {}),
        migratedFrom: document.version
      }
    };
  }
}
