import { Euler, MathUtils, Quaternion, Vector3 } from 'three';
import type { TransformComponent } from '../components/TransformComponent';
import { cloneTransform } from '../components/TransformComponent';
import type { TransformRecord } from '../commands/TransformSelectionCommand';
import type { Editor } from '../Editor';
import type { EntityId, Vector3Data } from '../types';

export interface MultiTransformDelta {
  pivot: Vector3Data;
  translate?: Vector3Data;
  rotateEulerDegrees?: Vector3Data;
  scale?: Vector3Data;
  localScale?: boolean;
}

export class MultiObjectTransform {
  constructor(private readonly editor: Editor) {}

  buildTransformRecords(ids: EntityId[], delta: MultiTransformDelta): TransformRecord[] {
    const pivot = toVector3(delta.pivot);
    const translate = toVector3(delta.translate ?? { x: 0, y: 0, z: 0 });
    const scale = toVector3(delta.scale ?? { x: 1, y: 1, z: 1 });
    const rotation = delta.rotateEulerDegrees
      ? new Quaternion().setFromEuler(new Euler(
          MathUtils.degToRad(delta.rotateEulerDegrees.x),
          MathUtils.degToRad(delta.rotateEulerDegrees.y),
          MathUtils.degToRad(delta.rotateEulerDegrees.z),
          'XYZ'
        ))
      : new Quaternion();

    return ids
      .map((id) => {
        const before = this.editor.entities.getTransform(id);
        if (!before) return undefined;
        const after = this.transformOne(before, pivot, translate, rotation, scale, Boolean(delta.localScale));
        return { entityId: id, before, after };
      })
      .filter((record): record is TransformRecord => Boolean(record));
  }

  private transformOne(
    before: TransformComponent,
    pivot: Vector3,
    translate: Vector3,
    rotation: Quaternion,
    scale: Vector3,
    localScale: boolean
  ): TransformComponent {
    const relative = toVector3(before.position).sub(pivot);
    if (!localScale) relative.multiply(scale);
    relative.applyQuaternion(rotation);
    const position = pivot.clone().add(relative).add(translate);
    const quaternion = rotation.clone().multiply(new Quaternion(before.quaternion.x, before.quaternion.y, before.quaternion.z, before.quaternion.w));
    const nextScale = localScale
      ? new Vector3(before.scale.x * scale.x, before.scale.y * scale.y, before.scale.z * scale.z)
      : toVector3(before.scale).multiply(scale);

    return {
      ...cloneTransform(before),
      position: { x: position.x, y: position.y, z: position.z },
      quaternion: { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w },
      scale: { x: nextScale.x, y: nextScale.y, z: nextScale.z }
    };
  }
}

function toVector3(value: Vector3Data): Vector3 {
  return new Vector3(value.x, value.y, value.z);
}
