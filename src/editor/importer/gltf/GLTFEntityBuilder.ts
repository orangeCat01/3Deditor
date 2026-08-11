import { Color, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { CreateEntityCommand } from '../../commands/CreateEntityCommand';
import { SetParentCommand } from '../../commands/SetParentCommand';
import type { Command } from '../../commands/Command';
import type { Editor } from '../../Editor';
import type { EditorEntity, QuaternionData, Vector3Data } from '../../types';
import type { GeometryComponent, MaterialComponent, MeshComponent } from '../../components/RenderComponents';

export interface GLTFBuildResult {
  rootEntityId: string;
  entityIds: string[];
  uuidMap: Map<string, string>;
  commands: Command[];
}

let gltfEntityCounter = 0;

export class GLTFEntityBuilder {
  constructor(private readonly editor: Editor) {}

  build(rootObject: Object3D, modelAssetId: string): GLTFBuildResult {
    const commands: Command[] = [];
    const entityIds: string[] = [];
    const uuidMap = new Map<string, string>();

    const visit = (object: Object3D, parentEntityId: string | null): string => {
      const entity = this.createEntityFromObject(object, modelAssetId);
      entityIds.push(entity.id);
      uuidMap.set(object.uuid, entity.id);
      commands.push(new CreateEntityCommand(this.editor, entity));
      if (parentEntityId) commands.push(new SetParentCommand(this.editor, entity.id, parentEntityId));

      // 资源引用不是场景结构修改，不进入历史；场景结构仍由 Command 负责。
      this.editor.assets.addReference(modelAssetId, entity.id);
      object.children.forEach((child) => visit(child, entity.id));
      return entity.id;
    };

    const rootEntityId = visit(rootObject, null);
    return { rootEntityId, entityIds, uuidMap, commands };
  }

  private createEntityFromObject(object: Object3D, modelAssetId: string): EditorEntity {
    gltfEntityCounter += 1;
    const id = `gltf_entity_${gltfEntityCounter.toString().padStart(4, '0')}`;
    const components: EditorEntity['components'] = {
      transform: {
        type: 'transform',
        position: vectorFromObject(object.position),
        quaternion: quaternionFromObject(object.quaternion),
        scale: vectorFromObject(object.scale)
      },
      customData: {
        type: 'customData',
        source: 'gltf',
        objectUuid: object.uuid,
        modelAssetId
      } as never
    };

    if (object instanceof Mesh) {
      const geometryAsset = this.editor.assets.register({
        type: 'Model',
        name: `${object.name || id} Geometry`,
        url: `runtime://${object.geometry.uuid}`,
        metadata: { modelAssetId, objectUuid: object.uuid, resource: 'geometry' }
      });
      this.editor.assets.registerRuntimeResource(geometryAsset.id, { geometry: object.geometry.clone() });

      const sourceMaterial = Array.isArray(object.material) ? object.material[0] : object.material;
      const material = sourceMaterial instanceof MeshStandardMaterial ? sourceMaterial : new MeshStandardMaterial();
      const materialAsset = this.editor.assets.register({
        type: 'Material',
        name: material.name || `${object.name || id} Material`,
        url: `runtime://${material.uuid}`,
        metadata: { modelAssetId, objectUuid: object.uuid, resource: 'material' }
      });
      this.editor.assets.registerRuntimeResource(materialAsset.id, { material: material.clone() });

      const geometryComponent: GeometryComponent = {
        type: 'geometry',
        id: `${id}_geometry`,
        kind: 'custom',
        parameters: { sourceUuid: object.geometry.uuid },
        runtimeGeometryId: geometryAsset.id
      };
      const materialComponent: MaterialComponent = {
        type: 'material',
        id: `${id}_material`,
        name: material.name || `${object.name || id} Material`,
        color: colorToCss(material.color ?? new Color('#d98b48')),
        emissive: colorToCss(material.emissive ?? new Color('#000000')),
        opacity: material.opacity ?? 1,
        transparent: material.transparent ?? false,
        alphaTest: material.alphaTest ?? 0,
        blendMode: 'normal',
        side: 'front',
        depthTest: material.depthTest ?? true,
        depthWrite: material.depthWrite ?? true,
        roughness: material.roughness ?? 0.65,
        metalness: material.metalness ?? 0.05,
        runtimeMaterialId: materialAsset.id
      };
      const meshComponent: MeshComponent = {
        type: 'mesh',
        geometryId: geometryComponent.id,
        materialId: materialComponent.id,
        modelAssetId,
        materialAssetId: materialAsset.id
      };
      components.geometry = geometryComponent;
      components.material = materialComponent;
      components.mesh = meshComponent;
      this.editor.assets.addReference(geometryAsset.id, id);
      this.editor.assets.addReference(materialAsset.id, id);
    }

    return {
      id,
      name: object.name || object.type || id,
      parentId: null,
      children: [],
      components,
      editor: { visible: object.visible, locked: false }
    };
  }
}

function vectorFromObject(value: { x: number; y: number; z: number }): Vector3Data {
  return { x: value.x, y: value.y, z: value.z };
}

function quaternionFromObject(value: { x: number; y: number; z: number; w: number }): QuaternionData {
  return { x: value.x, y: value.y, z: value.z, w: value.w };
}

function colorToCss(color: Color): string {
  return `#${color.getHexString()}`;
}


