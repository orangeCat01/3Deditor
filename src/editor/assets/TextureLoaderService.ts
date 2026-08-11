import { Texture, TextureLoader } from 'three';
import type { Asset, AssetManager } from './AssetManager';

export interface TextureMetadata {
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

export class TextureLoaderService {
  private readonly loader = new TextureLoader();

  constructor(private readonly assets: AssetManager) {}

  async loadFromUrl(name: string, url: string): Promise<Asset> {
    const texture = await this.loader.loadAsync(url);
    return this.registerLoadedTexture(name, url, texture, { thumbnailUrl: url });
  }

  async registerLoadedTexture(name: string, url: string, texture: Texture, metadata: TextureMetadata = {}): Promise<Asset> {
    const asset = this.assets.register({
      type: 'Texture',
      name,
      url,
      metadata: { ...metadata, kind: 'image' }
    });
    this.assets.registerRuntimeResource(asset.id, { texture });
    return asset;
  }
}
