import type { EntityId, QuaternionData, Vector3Data } from '../types';

export type AnimationTrackProperty =
  | 'transform.position.x'
  | 'transform.position.y'
  | 'transform.position.z'
  | 'transform.quaternion'
  | 'transform.scale.x'
  | 'transform.scale.y'
  | 'transform.scale.z'
  | 'material.color'
  | 'material.opacity'
  | `material.${string}`
  | `shader.uniform.${string}`
  | `light.${string}`
  | `camera.${string}`;

export type AnimationInterpolation = 'step' | 'linear';
export type AnimationKeyframeValue = number | string | Vector3Data | QuaternionData;

export interface AnimationKeyframe {
  time: number;
  value: AnimationKeyframeValue;
}

export interface AnimationTrack {
  targetEntityId: EntityId;
  property: AnimationTrackProperty;
  keyframes: AnimationKeyframe[];
  interpolation: AnimationInterpolation;
}
