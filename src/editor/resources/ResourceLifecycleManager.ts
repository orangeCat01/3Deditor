import type { ResourceDisposeManager } from '../../engine/three/ResourceDisposeManager';

export class ResourceLifecycleManager {
  private renderTargets = 0;
  private shaderMaterials = 0;

  constructor(private readonly disposer: ResourceDisposeManager) {}

  recordRenderTargetDispose(): void {
    this.renderTargets += 1;
  }

  recordShaderMaterialDispose(): void {
    this.shaderMaterials += 1;
  }

  snapshot(): { geometries: number; materials: number; textures: number; renderTargets: number; shaderMaterials: number } {
    return {
      geometries: this.disposer.disposedGeometries,
      materials: this.disposer.disposedMaterials,
      textures: this.disposer.disposedTextures,
      renderTargets: this.renderTargets,
      shaderMaterials: this.shaderMaterials
    };
  }
}
