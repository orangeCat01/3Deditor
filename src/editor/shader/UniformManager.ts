import type { Editor } from '../Editor';
import type { RuntimeClock } from '../runtime/RuntimeClock';
import type { ThreeSceneAdapter } from '../../engine/three/ThreeSceneAdapter';

export interface RuntimeResolution {
  width: number;
  height: number;
}

export class UniformManager {
  constructor(private readonly editor: Editor, private readonly adapter?: ThreeSceneAdapter) {}

  update(clock: RuntimeClock, resolution: RuntimeResolution = { width: 1, height: 1 }): void {
    this.editor.entities.all.forEach((entity) => {
      const material = this.adapter?.getShaderMaterial(entity.id);
      if (!material) return;
      material.uniforms.uTime = material.uniforms.uTime ?? { value: 0 };
      material.uniforms.uDeltaTime = material.uniforms.uDeltaTime ?? { value: 0 };
      material.uniforms.uResolution = material.uniforms.uResolution ?? { value: { x: 1, y: 1 } };
      material.uniforms.uCameraPosition = material.uniforms.uCameraPosition ?? { value: { x: 0, y: 0, z: 0 } };
      material.uniforms.uTime.value = clock.elapsedTime / 1000;
      material.uniforms.uDeltaTime.value = clock.deltaTime / 1000;
      material.uniforms.uResolution.value = { x: resolution.width, y: resolution.height };
    });
  }
}
