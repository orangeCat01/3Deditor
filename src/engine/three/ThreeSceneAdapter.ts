import {
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  Color,
  DoubleSide,
  FrontSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  MultiplyBlending,
  NormalBlending,
  Object3D,
  Quaternion,
  ShaderMaterial,
  Vector3
} from 'three';
import type { Editor } from '../../editor/Editor';
import type { GeometryComponent, MaterialComponent, MeshComponent } from '../../editor/components/RenderComponents';
import type { TransformComponent } from '../../editor/components/TransformComponent';
import { ShaderCompiler } from '../../editor/shader/ShaderCompiler';
import type { ShaderComponent, ShaderUniformValue } from '../../editor/shader/ShaderComponent';
import { ShaderManager } from '../../editor/shader/ShaderManager';
import type { EditorEntity, EntityId } from '../../editor/types';
import { ResourceDisposeManager } from './ResourceDisposeManager';

export class ThreeSceneAdapter {
  readonly root = new Group();
  private readonly objectsByEntity = new Map<EntityId, Object3D>();
  private readonly materialSignatures = new Map<EntityId, string>();
  private readonly disposer = new ResourceDisposeManager();

  constructor(private readonly editor: Editor) {}

  get disposeStats(): ResourceDisposeManager {
    return this.disposer;
  }

  getObject(entityId: EntityId): Object3D | undefined {
    return this.objectsByEntity.get(entityId);
  }

  getShaderMaterial(entityId: EntityId): ShaderMaterial | undefined {
    const object = this.objectsByEntity.get(entityId);
    return object instanceof Mesh && object.material instanceof ShaderMaterial ? object.material : undefined;
  }

  getEntityIdFromObject(object: Object3D | null): EntityId | null {
    let current: Object3D | null = object;
    while (current) {
      if (typeof current.userData.entityId === 'string') return current.userData.entityId;
      current = current.parent;
    }
    return null;
  }

  sync(): void {
    const seen = new Set<EntityId>();
    for (const entity of this.editor.entities.all) {
      seen.add(entity.id);
      const object = this.objectsByEntity.get(entity.id) ?? this.createObject(entity);
      this.syncObject(object, entity);
      this.syncMeshMaterial(object, entity);
    }

    // Object3D 层级只反映 Entity/SceneGraph，不作为业务状态来源。
    for (const entity of this.editor.entities.all) {
      const object = this.objectsByEntity.get(entity.id);
      if (!object) continue;
      const parent = entity.parentId ? this.objectsByEntity.get(entity.parentId) : this.root;
      if (parent && object.parent !== parent) parent.add(object);
    }

    for (const [entityId, object] of this.objectsByEntity) {
      if (seen.has(entityId)) continue;
      object.removeFromParent();
      this.disposer.disposeObject(object);
      this.objectsByEntity.delete(entityId);
      this.materialSignatures.delete(entityId);
    }
  }

  private createObject(entity: EditorEntity): Object3D {
    const mesh = entity.components.mesh as MeshComponent | undefined;
    const geometry = entity.components.geometry as GeometryComponent | undefined;
    const material = entity.components.material as MaterialComponent | undefined;

    const object = mesh
      ? new Mesh(this.createGeometry(geometry), this.createMaterial(material, entity.components.shader))
      : new Object3D();

    object.userData.entityId = entity.id;
    this.objectsByEntity.set(entity.id, object);
    return object;
  }

  private createGeometry(geometry?: GeometryComponent): BoxGeometry {
    if (geometry?.runtimeGeometryId) {
      const runtimeGeometry = this.editor.assets.getRuntimeResource(geometry.runtimeGeometryId)?.geometry;
      if (runtimeGeometry) return runtimeGeometry.clone() as BoxGeometry;
    }
    if (geometry?.kind === 'box') {
      return new BoxGeometry(
        Number(geometry.parameters.width ?? 1),
        Number(geometry.parameters.height ?? 1),
        Number(geometry.parameters.depth ?? 1)
      );
    }
    return new BoxGeometry(1, 1, 1);
  }

  private createMaterial(material?: MaterialComponent, shader?: ShaderComponent): MeshStandardMaterial | ShaderMaterial {
    const shaderMaterial = this.createShaderMaterial(shader);
    if (shaderMaterial) return shaderMaterial;
    if (material?.runtimeMaterialId) {
      const runtimeMaterial = this.editor.assets.getRuntimeResource(material.runtimeMaterialId)?.material;
      if (runtimeMaterial instanceof MeshStandardMaterial) return runtimeMaterial.clone();
      if (Array.isArray(runtimeMaterial) && runtimeMaterial[0] instanceof MeshStandardMaterial) return runtimeMaterial[0].clone();
    }
    return this.createStandardMaterial(material);
  }

  private createShaderMaterial(shader?: ShaderComponent): ShaderMaterial | null {
    if (!shader?.enabled) return null;
    const shaderAsset = shader.shaderAssetId ? new ShaderManager(this.editor.assets).find(shader.shaderAssetId) : undefined;
    const vertexShader = shader.vertexShader || shaderAsset?.vertexSource || '';
    const fragmentShader = shader.fragmentShader || shaderAsset?.fragmentSource || '';
    const status = new ShaderCompiler().compile(vertexShader, fragmentShader);
    this.editor.entities.replaceShader(this.findEntityByShader(shader), { ...shader, compileStatus: status });
    if (!status.success) return null;
    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: toThreeUniforms(shader.uniforms),
      defines: shader.defines
    });
  }

  private findEntityByShader(shader: ShaderComponent): EntityId {
    return this.editor.entities.all.find((entity) => entity.components.shader === shader)?.id ?? '';
  }

  private createStandardMaterial(material?: MaterialComponent): MeshStandardMaterial {
    const standard = new MeshStandardMaterial({
      color: new Color(material?.color ?? '#d98b48'),
      emissive: new Color(material?.emissive ?? '#000000'),
      roughness: material?.roughness ?? 0.65,
      metalness: material?.metalness ?? 0.05,
      opacity: material?.opacity ?? 1,
      transparent: material?.transparent ?? false,
      alphaTest: material?.alphaTest ?? 0,
      depthTest: material?.depthTest ?? true,
      depthWrite: material?.depthWrite ?? true,
      side: material?.side === 'double' ? DoubleSide : material?.side === 'back' ? BackSide : FrontSide,
      blending: material?.blendMode === 'additive' ? AdditiveBlending : material?.blendMode === 'multiply' ? MultiplyBlending : NormalBlending
    });
    const texture = material?.textureAssetId ? this.editor.assets.getRuntimeResource(material.textureAssetId)?.texture : undefined;
    const normalMap = material?.normalMapAssetId ? this.editor.assets.getRuntimeResource(material.normalMapAssetId)?.texture : undefined;
    const aoMap = material?.aoMapAssetId ? this.editor.assets.getRuntimeResource(material.aoMapAssetId)?.texture : undefined;
    if (texture) standard.map = texture;
    if (normalMap) standard.normalMap = normalMap;
    if (aoMap) standard.aoMap = aoMap;
    return standard;
  }

  private syncObject(object: Object3D, entity: EditorEntity): void {
    object.name = entity.name;
    object.visible = entity.editor.visible;
    const transform = entity.components.transform as TransformComponent | undefined;
    if (!transform) return;

    object.position.copy(new Vector3(transform.position.x, transform.position.y, transform.position.z));
    object.quaternion.copy(
      new Quaternion(
        transform.quaternion.x,
        transform.quaternion.y,
        transform.quaternion.z,
        transform.quaternion.w
      )
    );
    object.scale.copy(new Vector3(transform.scale.x, transform.scale.y, transform.scale.z));
  }

  private syncMeshMaterial(object: Object3D, entity: EditorEntity): void {
    if (!(object instanceof Mesh) || !entity.components.material) return;
    const nextSignature = JSON.stringify({ material: entity.components.material, shader: entity.components.shader ? { ...entity.components.shader, compileStatus: undefined } : undefined });
    if (this.materialSignatures.get(entity.id) === nextSignature) return;
    const previous = object.material;
    const next = this.createMaterial(entity.components.material as MaterialComponent, entity.components.shader);
    if (entity.components.shader?.enabled && !(next instanceof ShaderMaterial) && previous instanceof ShaderMaterial) return;
    object.material = next;
    this.materialSignatures.set(entity.id, nextSignature);
  }
}

function toThreeUniforms(uniforms: Record<string, ShaderUniformValue>): ShaderMaterial['uniforms'] {
  const result: ShaderMaterial['uniforms'] = {};
  Object.entries(uniforms).forEach(([key, uniform]) => {
    result[key] = { value: normalizeUniformValue(uniform) };
  });
  result.uTime = result.uTime ?? { value: 0 };
  result.uDeltaTime = result.uDeltaTime ?? { value: 0 };
  result.uResolution = result.uResolution ?? { value: { x: 1, y: 1 } };
  return result;
}

function normalizeUniformValue(uniform: ShaderUniformValue): unknown {
  if (uniform.type === 'color' && typeof uniform.value === 'string') return new Color(uniform.value);
  return uniform.value;
}

