import type { Component, Vector3Data } from '../types';
import type { CollisionShape } from './CollisionShape';

export interface ColliderComponent extends Component {
  type: 'collider';
  shape: CollisionShape;
  size: Vector3Data;
  radius: number;
  height: number;
  offset: Vector3Data;
  isTrigger: boolean;
}

export type ColliderComponentPatch = Partial<Omit<ColliderComponent, 'type'>>;

export function cloneColliderComponent(collider: ColliderComponent): ColliderComponent {
  return structuredClone(collider);
}
