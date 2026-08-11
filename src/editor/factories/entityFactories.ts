import type { EditorEntity } from '../types';
import { createDefaultTransform } from '../components/TransformComponent';

let entityCounter = 0;

function nextEntityId(): string {
  entityCounter += 1;
  return `entity_${entityCounter.toString().padStart(4, '0')}`;
}

export function createCubeEntity(name = 'Cube'): EditorEntity {
  const id = nextEntityId();
  const geometryId = `${id}_geometry`;
  const materialId = `${id}_material`;

  return {
    id,
    name,
    parentId: null,
    children: [],
    components: {
      transform: createDefaultTransform(),
      geometry: {
        type: 'geometry',
        id: geometryId,
        kind: 'box',
        parameters: { width: 1, height: 1, depth: 1 }
      },
      material: {
        type: 'material',
        id: materialId,
        name: `${name} Material`,
        color: '#d98b48',
        emissive: '#000000',
        opacity: 1,
        transparent: false,
        alphaTest: 0,
        blendMode: 'normal',
        side: 'front',
        depthTest: true,
        depthWrite: true,
        roughness: 0.65,
        metalness: 0.05
      },
      mesh: {
        type: 'mesh',
        geometryId,
        materialId
      }
    },
    editor: {
      visible: true,
      locked: false
    }
  };
}

export function createGroupEntity(name = 'Group'): EditorEntity {
  return {
    id: nextEntityId(),
    name,
    parentId: null,
    children: [],
    components: {
      transform: createDefaultTransform()
    },
    editor: {
      visible: true,
      locked: false
    }
  };
}

export function createImportedModelEntity(name: string, assetId: string): EditorEntity {
  const entity = createCubeEntity(name.replace(/\.(glb|gltf)$/i, '') || 'Imported Model');
  entity.components.customData = {
    type: 'customData',
    assetId,
    source: 'gltf-importer'
  } as never;
  return entity;
}
