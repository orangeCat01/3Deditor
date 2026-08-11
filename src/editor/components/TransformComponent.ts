import { Euler, MathUtils, Quaternion } from 'three';
import type { Component, QuaternionData, Vector3Data } from '../types';
import { cloneQuaternion, cloneVector3 } from '../types';

export interface TransformComponent extends Component {
  type: 'transform';
  position: Vector3Data;
  quaternion: QuaternionData;
  scale: Vector3Data;
}

export interface TransformPatch {
  position?: Vector3Data;
  quaternion?: QuaternionData;
  rotationEulerDegrees?: Vector3Data;
  scale?: Vector3Data;
}

export function createDefaultTransform(): TransformComponent {
  return {
    type: 'transform',
    position: { x: 0, y: 0.5, z: 0 },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 }
  };
}

export function cloneTransform(transform: TransformComponent): TransformComponent {
  return {
    type: 'transform',
    position: cloneVector3(transform.position),
    quaternion: cloneQuaternion(transform.quaternion),
    scale: cloneVector3(transform.scale)
  };
}

export function eulerDegreesToQuaternion(euler: Vector3Data): QuaternionData {
  const quaternion = new Quaternion().setFromEuler(
    new Euler(
      MathUtils.degToRad(euler.x),
      MathUtils.degToRad(euler.y),
      MathUtils.degToRad(euler.z),
      'XYZ'
    )
  );
  return { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w };
}

export function quaternionToEulerDegrees(quaternion: QuaternionData): Vector3Data {
  const euler = new Euler().setFromQuaternion(
    new Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w),
    'XYZ'
  );
  return {
    x: Math.round(MathUtils.radToDeg(euler.x) * 1000) / 1000,
    y: Math.round(MathUtils.radToDeg(euler.y) * 1000) / 1000,
    z: Math.round(MathUtils.radToDeg(euler.z) * 1000) / 1000
  };
}

export function applyTransformPatch(transform: TransformComponent, patch: TransformPatch): TransformComponent {
  return {
    type: 'transform',
    position: patch.position ? cloneVector3(patch.position) : cloneVector3(transform.position),
    quaternion: patch.rotationEulerDegrees
      ? eulerDegreesToQuaternion(patch.rotationEulerDegrees)
      : patch.quaternion
        ? cloneQuaternion(patch.quaternion)
        : cloneQuaternion(transform.quaternion),
    scale: patch.scale ? cloneVector3(patch.scale) : cloneVector3(transform.scale)
  };
}
