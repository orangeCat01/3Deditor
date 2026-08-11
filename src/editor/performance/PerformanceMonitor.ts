import { BufferGeometry, Material, Mesh, ShaderMaterial, Texture } from 'three';
import type { Editor } from '../Editor';
import type { ThreeSceneAdapter } from '../../engine/three/ThreeSceneAdapter';
import type { PostProcessingManager } from '../postprocess/PostProcessingManager';

export interface PerformanceMetrics {
  entityCount: number;
  meshCount: number;
  triangleCount: number;
  textureCount: number;
  shaderCount: number;
  shaderCompileErrorCount: number;
  activePassCount: number;
  fps: number;
  drawCalls: number;
  gpuResourceCount: number;
  geometryMemory: number;
  textureMemory: number;
}

export class PerformanceMonitor {
  private lastTime = performance.now();
  private lastFps = 60;

  constructor(private readonly editor: Editor, private readonly adapter: ThreeSceneAdapter, private readonly postProcessing?: PostProcessingManager) {}

  snapshot(): PerformanceMetrics {
    let meshCount = 0;
    let triangleCount = 0;
    let shaderCount = 0;
    let shaderCompileErrorCount = 0;
    let geometryMemory = 0;
    let textureMemory = 0;
    const textures = new Set<Texture>();
    const geometries = new Set<BufferGeometry>();
    const materials = new Set<Material>();

    this.editor.entities.all.forEach((entity) => {
      if (entity.components.shader?.enabled) shaderCount += 1;
      if (entity.components.shader?.compileStatus && !entity.components.shader.compileStatus.success) shaderCompileErrorCount += 1;
      const object = this.adapter.getObject(entity.id);
      if (!(object instanceof Mesh)) return;
      meshCount += 1;
      geometries.add(object.geometry);
      geometryMemory += estimateGeometryMemory(object.geometry);
      if (object.material instanceof ShaderMaterial) shaderCount = Math.max(shaderCount, 1);
      const position = object.geometry.getAttribute('position');
      triangleCount += position ? Math.floor(position.count / 3) : 0;
      const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
      meshMaterials.forEach((material) => {
        materials.add(material);
        Object.values(material).forEach((value) => {
          if (value instanceof Texture) {
            textures.add(value);
            textureMemory += estimateTextureMemory(value);
          }
        });
      });
    });

    return {
      entityCount: this.editor.entities.all.length,
      meshCount,
      triangleCount,
      textureCount: textures.size,
      shaderCount,
      shaderCompileErrorCount,
      activePassCount: this.postProcessing?.activePassCount ?? 0,
      fps: this.computeFps(),
      drawCalls: meshCount + (this.postProcessing?.activePassCount ?? 0),
      gpuResourceCount: geometries.size + materials.size + textures.size,
      geometryMemory,
      textureMemory
    };
  }

  private computeFps(): number {
    const now = performance.now();
    const delta = Math.max(1, now - this.lastTime);
    this.lastTime = now;
    this.lastFps = Math.round(1000 / delta);
    return Math.max(1, Math.min(240, this.lastFps));
  }
}

function estimateGeometryMemory(geometry: BufferGeometry): number {
  return Object.values(geometry.attributes).reduce((sum, attribute) => sum + attribute.count * attribute.itemSize * 4, 0);
}

function estimateTextureMemory(texture: Texture): number {
  const image = texture.image as { width?: number; height?: number } | undefined;
  return (image?.width ?? 1) * (image?.height ?? 1) * 4;
}
