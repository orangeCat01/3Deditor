import type { EditorEntity } from '../types';
import type { Asset } from '../assets/AssetManager';
import { MigrationManager } from './MigrationManager';
import type { SerializedSceneDocument } from './SceneVersion';

export interface DeserializeResult {
  document: SerializedSceneDocument;
  entities: EditorEntity[];
  assets: Asset[];
  warnings: string[];
}

export class SceneDeserializer {
  deserialize(input: SerializedSceneDocument): DeserializeResult {
    const document = new MigrationManager().migrate(input);
    const entities = Object.values(document.entities ?? {}) as EditorEntity[];
    const assets = Object.values(document.assets ?? {}) as Asset[];
    const assetIds = new Set(assets.map((asset) => asset.id));
    const warnings: string[] = [];

    entities.forEach((entity) => {
      const material = entity.components.material;
      const textureAssetId = material?.textureAssetId;
      if (textureAssetId && !assetIds.has(textureAssetId)) warnings.push(`Missing asset referenced by material: ${textureAssetId}`);
    });

    return { document, entities, assets, warnings };
  }
}
