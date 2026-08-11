import type { Component, Vector3Data } from '../types';

export interface PhysicsComponent extends Component {
  type: 'physics';
  mass: number;
  velocity: Vector3Data;
  angularVelocity: Vector3Data;
  gravity: Vector3Data;
  friction?: number;
  restitution?: number;
  materialId: string;
  enabled: boolean;
}

export type PhysicsComponentPatch = Partial<Omit<PhysicsComponent, 'type'>>;

export function clonePhysicsComponent(physics: PhysicsComponent): PhysicsComponent {
  return structuredClone(physics);
}
