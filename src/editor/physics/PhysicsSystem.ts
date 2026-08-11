import type { Editor } from '../Editor';
import type { Vector3Data } from '../types';
import type { CollisionBounds } from './CollisionShape';
import type { PhysicsAdapter } from './PhysicsAdapter';

export class PhysicsSystem {
  private readonly activePairs = new Set<string>();

  constructor(private readonly editor: Editor, private readonly adapter: PhysicsAdapter) {}

  update(deltaTime: number): void {
    this.editor.entities.all.forEach((entity) => {
      const physics = entity.components.physics;
      const transform = this.editor.entities.getTransform(entity.id);
      if (!physics?.enabled || !transform) return;
      const nextVelocity = add(physics.velocity, scale(physics.gravity, deltaTime));
      const nextPosition = add(transform.position, scale(nextVelocity, deltaTime));
      this.editor.entities.replacePhysics(entity.id, { ...physics, velocity: nextVelocity });
      this.editor.entities.setTransform(entity.id, { position: nextPosition });
    });

    this.adapter.sync();
    this.detectCollisions();
  }

  private detectCollisions(): void {
    const bodies = this.editor.entities.all.filter((entity) => entity.components.collider && this.adapter.getRuntimeBody(entity.id));
    const nextPairs = new Set<string>();
    for (let i = 0; i < bodies.length; i += 1) {
      for (let j = i + 1; j < bodies.length; j += 1) {
        const a = bodies[i];
        const b = bodies[j];
        const bodyA = this.adapter.getRuntimeBody(a.id);
        const bodyB = this.adapter.getRuntimeBody(b.id);
        if (!bodyA || !bodyB || !overlaps(bodyA.bounds, bodyB.bounds)) continue;
        const pair = [a.id, b.id].sort().join(':');
        nextPairs.add(pair);
        if (!this.activePairs.has(pair)) {
          this.editor.events.emit('collisionEnter', { a: a.id, b: b.id });
          if (a.components.collider?.isTrigger || b.components.collider?.isTrigger) this.editor.events.emit('triggerEnter', { a: a.id, b: b.id });
        }
      }
    }
    this.activePairs.forEach((pair) => {
      if (nextPairs.has(pair)) return;
      const [a, b] = pair.split(':');
      this.editor.events.emit('collisionExit', { a, b });
    });
    this.activePairs.clear();
    nextPairs.forEach((pair) => this.activePairs.add(pair));
  }
}

function add(a: Vector3Data, b: Vector3Data): Vector3Data {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scale(value: Vector3Data, amount: number): Vector3Data {
  return { x: value.x * amount, y: value.y * amount, z: value.z * amount };
}

function overlaps(a: CollisionBounds, b: CollisionBounds): boolean {
  return a.min.x <= b.max.x && a.max.x >= b.min.x && a.min.y <= b.max.y && a.max.y >= b.min.y && a.min.z <= b.max.z && a.max.z >= b.min.z;
}
