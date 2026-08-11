export const CURRENT_SCENE_VERSION = '1.0';

export interface SerializedSceneDocument {
  version: string;
  scene: { rootEntities: string[] };
  entities: Record<string, any>;
  assets: Record<string, any>;
  settings: Record<string, any>;
}
