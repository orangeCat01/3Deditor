import type { Vector3Data } from '../types';

export type CollisionShape = 'box' | 'sphere' | 'capsule' | 'mesh';

export interface CollisionBounds {
  min: Vector3Data;
  max: Vector3Data;
}
