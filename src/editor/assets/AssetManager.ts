import type { BufferGeometry, Material, Texture } from 'three';

export type AssetType = 'Model' | 'Material' | 'Texture' | 'HDRI' | 'Animation' | 'Shader';

export interface AssetInput {
  type: AssetType;
  name: string;
  url: string;
  metadata?: Record<string, unknown>;
}

export interface Asset extends AssetInput {
  id: string;
  metadata: Record<string, unknown>;
  references: string[];
}

export interface RuntimeAssetResource {
  geometry?: BufferGeometry;
  material?: Material | Material[];
  texture?: Texture;
}

export class AssetManager {
  private assets = new Map<string, Asset>();
  private runtimeResources = new Map<string, RuntimeAssetResource>();
  private counter = 0;

  get all(): Asset[] {
    return [...this.assets.values()].map((asset) => ({ ...asset, references: [...asset.references] }));
  }

  register(input: AssetInput): Asset {
    this.counter += 1;
    const asset: Asset = {
      id: `asset_${this.counter.toString().padStart(4, '0')}`,
      type: input.type,
      name: input.name,
      url: input.url,
      metadata: input.metadata ?? {},
      references: []
    };
    this.assets.set(asset.id, asset);
    return { ...asset, references: [] };
  }

  restore(asset: Asset): Asset {
    const restored: Asset = { ...asset, metadata: asset.metadata ?? {}, references: [...(asset.references ?? [])] };
    this.assets.set(restored.id, restored);
    return { ...restored, references: [...restored.references] };
  }

  clear(): void {
    this.assets.clear();
    this.runtimeResources.clear();
  }

  get(id: string): Asset | undefined {
    const asset = this.assets.get(id);
    return asset ? { ...asset, references: [...asset.references] } : undefined;
  }

  findByType(type: AssetType): Asset[] {
    return this.all.filter((asset) => asset.type === type);
  }

  delete(id: string): void {
    this.assets.delete(id);
    this.runtimeResources.delete(id);
  }

  addReference(assetId: string, entityId: string): void {
    const asset = this.assets.get(assetId);
    if (asset && !asset.references.includes(entityId)) asset.references.push(entityId);
  }

  removeReference(assetId: string, entityId: string): void {
    const asset = this.assets.get(assetId);
    if (asset) asset.references = asset.references.filter((id) => id !== entityId);
  }

  getReferences(assetId: string): string[] {
    return this.assets.get(assetId)?.references.slice() ?? [];
  }

  canDelete(assetId: string): boolean {
    return this.getReferences(assetId).length === 0;
  }

  registerRuntimeResource(assetId: string, resource: RuntimeAssetResource): void {
    this.runtimeResources.set(assetId, resource);
  }

  getRuntimeResource(assetId: string): RuntimeAssetResource | undefined {
    return this.runtimeResources.get(assetId);
  }

  reload(assetId: string, input: Partial<AssetInput>, resource?: RuntimeAssetResource): Asset | undefined {
    const current = this.assets.get(assetId);
    if (!current) return undefined;
    const next: Asset = {
      ...current,
      ...input,
      metadata: { ...current.metadata, ...(input.metadata ?? {}) }
    };
    this.assets.set(assetId, next);
    if (resource) this.runtimeResources.set(assetId, resource);
    return { ...next, references: [...next.references] };
  }
}

