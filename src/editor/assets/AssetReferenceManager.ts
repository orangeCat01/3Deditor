import type { AssetManager } from './AssetManager';

export class AssetReferenceManager {
  constructor(private readonly assets: AssetManager) {}

  linkEntityToAsset(assetId: string, entityId: string): void {
    this.assets.addReference(assetId, entityId);
  }

  unlinkEntityFromAsset(assetId: string, entityId: string): void {
    this.assets.removeReference(assetId, entityId);
  }

  getReferences(assetId: string): string[] {
    return this.assets.getReferences(assetId);
  }

  canDelete(assetId: string): boolean {
    return this.assets.canDelete(assetId);
  }

  assertCanDelete(assetId: string): void {
    const references = this.getReferences(assetId);
    if (references.length > 0) {
      throw new Error(`资源仍被 ${references.length} 个 Entity 引用，不能删除。`);
    }
  }
}
