export type EntityId = string;
export type ComponentType =
  | 'transform'
  | 'mesh'
  | 'geometry'
  | 'material'
  | 'camera'
  | 'light'
  | 'animation'
  | 'timer'
  | 'physics'
  | 'collider'
  | 'customData'
  | 'shader';

export interface Vector3Data {
  x: number;
  y: number;
  z: number;
}

export interface QuaternionData {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Component {
  type: ComponentType;
}

import type { TransformComponent } from './components/TransformComponent';
import type { GeometryComponent, MaterialComponent, MeshComponent } from './components/RenderComponents';
import type { AnimationComponent } from './animation/AnimationComponent';
import type { TimerComponent } from './timer/TimerComponent';
import type { ShaderComponent } from './shader/ShaderComponent';
import type { PhysicsComponent } from './physics/PhysicsComponent';
import type { ColliderComponent } from './physics/ColliderComponent';

export interface ComponentMap {
  transform: TransformComponent;
  mesh: MeshComponent;
  geometry: GeometryComponent;
  material: MaterialComponent;
  camera: Component;
  light: Component;
  animation: AnimationComponent;
  timer: TimerComponent;
  physics: PhysicsComponent;
  collider: ColliderComponent;
  customData: Component;
  shader: ShaderComponent;
}

export interface EditorEntity {
  id: EntityId;
  name: string;
  parentId: EntityId | null;
  children: EntityId[];
  components: Partial<ComponentMap>;
  editor: {
    visible: boolean;
    locked: boolean;
  };
}

export function cloneVector3(value: Vector3Data): Vector3Data {
  return { x: value.x, y: value.y, z: value.z };
}

export function cloneQuaternion(value: QuaternionData): QuaternionData {
  return { x: value.x, y: value.y, z: value.z, w: value.w };
}




