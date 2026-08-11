import type { Editor } from '../Editor';
import { clonePhysicsComponent } from '../physics/PhysicsComponent';
import type { PhysicsComponent } from '../physics/PhysicsComponent';
import type { EntityId } from '../types';
import type { Command } from './Command';

export class SetPhysicsCommand implements Command {
  readonly name = 'Set Physics';
  private before?: PhysicsComponent;
  private after?: PhysicsComponent;

  constructor(private readonly editor: Editor, private readonly entityId: EntityId, physics: PhysicsComponent) {
    this.after = clonePhysicsComponent(physics);
  }

  execute(): void {
    const current = this.editor.entities.get(this.entityId)?.components.physics;
    this.before = current ? clonePhysicsComponent(current) : undefined;
    this.editor.entities.replacePhysics(this.entityId, this.after);
  }

  undo(): void {
    this.editor.entities.replacePhysics(this.entityId, this.before);
  }

  redo(): void {
    this.editor.entities.replacePhysics(this.entityId, this.after);
  }
}
