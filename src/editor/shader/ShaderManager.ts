import type { Asset, AssetManager } from '../assets/AssetManager';
import type { ShaderAsset, ShaderAssetInput } from './ShaderAsset';

export class ShaderManager {
  constructor(private readonly assets: AssetManager) {}

  register(input: ShaderAssetInput): ShaderAsset {
    const asset = this.assets.register({
      type: 'Shader',
      name: input.name,
      url: `shader://${input.name}`,
      metadata: {
        ...(input.metadata ?? {}),
        vertexSource: input.vertexSource,
        fragmentSource: input.fragmentSource,
        uniformSchema: input.uniformSchema
      }
    });
    return this.toShaderAsset(asset);
  }

  find(id: string): ShaderAsset | undefined {
    const asset = this.assets.get(id);
    return asset?.type === 'Shader' ? this.toShaderAsset(asset) : undefined;
  }

  delete(id: string): void {
    if (this.assets.canDelete(id)) this.assets.delete(id);
  }

  private toShaderAsset(asset: Asset): ShaderAsset {
    return {
      id: asset.id,
      type: 'Shader',
      name: asset.name,
      vertexSource: String(asset.metadata.vertexSource ?? ''),
      fragmentSource: String(asset.metadata.fragmentSource ?? ''),
      uniformSchema: (asset.metadata.uniformSchema ?? {}) as ShaderAsset['uniformSchema'],
      metadata: asset.metadata,
      references: asset.references
    };
  }
}
