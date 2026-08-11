import type { Editor } from '../Editor';
import type { EntityId, Vector3Data } from '../types';
import type { CollisionBounds } from './CollisionShape';

export interface PhysicsRuntimeBody {
  entityId: EntityId;
  position: Vector3Data;
  velocity: Vector3Data;
  bounds: CollisionBounds;
}

export class PhysicsAdapter {
  private readonly bodies = new Map<EntityId, PhysicsRuntimeBody>();

  constructor(private readonly editor: Editor) {}

  sync(): void {
    const seen = new Set<EntityId>();
    this.editor.entities.all.forEach((entity) => {
      const physics = entity.components.physics;
      const collider = entity.components.collider;
      const transform = this.editor.entities.getTransform(entity.id);
      if (!physics?.enabled || !collider || !transform) return;
      seen.add(entity.id);
      this.bodies.set(entity.id, {
        entityId: entity.id,
        position: structuredClone(transform.position),
        velocity: structuredClone(physics.velocity),
        bounds: boundsFrom(transform.position, collider.size, collider.offset)
      });
    });
    [...this.bodies.keys()].forEach((id) => {
      if (!seen.has(id)) this.bodies.delete(id);
    });
  }

  getRuntimeBody(entityId: EntityId): PhysicsRuntimeBody | undefined {
    return this.bodies.get(entityId);
  }
}

function boundsFrom(position: Vector3Data, size: Vector3Data, offset: Vector3Data): CollisionBounds {
  const center = { x: position.x + offset.x, y: position.y + offset.y, z: position.z + offset.z };
  return {
    min: { x: center.x - size.x / 2, y: center.y - size.y / 2, z: center.z - size.z / 2 },
    max: { x: center.x + size.x / 2, y: center.y + size.y / 2, z: center.z + size.z / 2 }
  };
}
