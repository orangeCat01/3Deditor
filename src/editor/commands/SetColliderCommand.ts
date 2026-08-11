import type { Editor } from '../Editor';
import { cloneColliderComponent } from '../physics/ColliderComponent';
import type { ColliderComponent } from '../physics/ColliderComponent';
import type { EntityId } from '../types';
import type { Command } from './Command';

export class SetColliderCommand implements Command {
  readonly name = 'Set Collider';
  private before?: ColliderComponent;
  private after?: ColliderComponent;

  constructor(private readonly editor: Editor, private readonly entityId: EntityId, collider: ColliderComponent) {
    this.after = cloneColliderComponent(collider);
  }

  execute(): void {
    const current = this.editor.entities.get(this.entityId)?.components.collider;
    this.before = current ? cloneColliderComponent(current) : undefined;
    this.editor.entities.replaceCollider(this.entityId, this.after);
  }

  undo(): void {
    this.editor.entities.replaceCollider(this.entityId, this.before);
  }

  redo(): void {
    this.editor.entities.replaceCollider(this.entityId, this.after);
  }
}
