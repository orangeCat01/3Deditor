import { Mesh, Object3D, Texture } from 'three';

export class ResourceDisposeManager {
  disposedGeometries = 0;
  disposedMaterials = 0;
  disposedTextures = 0;
  private readonly disposedTextureSet = new WeakSet<Texture>();

  disposeObject(object: Object3D): void {
    object.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      child.geometry.dispose();
      this.disposedGeometries += 1;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        Object.values(material).forEach((value) => {
          if (value instanceof Texture && !this.disposedTextureSet.has(value)) {
            value.dispose();
            this.disposedTextureSet.add(value);
            this.disposedTextures += 1;
          }
        });
        material.dispose();
        this.disposedMaterials += 1;
      });
    });
  }
}
