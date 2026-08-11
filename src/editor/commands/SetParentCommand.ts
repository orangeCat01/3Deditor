import type { Editor } from '../Editor';
import type { EntityId } from '../types';
import type { Command } from './Command';

interface ParentSnapshot {
  parentId: EntityId | null;
  oldParentChildren: EntityId[];
  newParentChildren: EntityId[];
  roots: EntityId[];
}

export class SetParentCommand implements Command {
  readonly name = 'Set Parent';
  private before?: ParentSnapshot;

  constructor(
    private readonly editor: Editor,
    private readonly id: EntityId,
    private readonly parentId: EntityId | null,
    private readonly index?: number
  ) {}

  execute(): void {
    const entity = this.editor.entities.get(this.id);
    if (!entity) return;
    this.before = {
      parentId: entity.parentId,
      oldParentChildren: entity.parentId ? this.editor.sceneGraph.getChildren(entity.parentId) : [],
      newParentChildren: this.parentId ? this.editor.sceneGraph.getChildren(this.parentId) : [],
      roots: this.editor.sceneGraph.rootIds
    };
    this.editor.sceneGraph.attachEntity(this.id, this.parentId, this.editor.entities, this.index);
  }

  undo(): void {
    if (!this.before) return;
    this.editor.sceneGraph.attachEntity(this.id, this.before.parentId, this.editor.entities);
    this.editor.sceneGraph.setRootOrder(this.before.roots);
    if (this.before.parentId) this.editor.entities.setChildren(this.before.parentId, this.before.oldParentChildren);
    if (this.parentId) this.editor.entities.setChildren(this.parentId, this.before.newParentChildren);
  }

  redo(): void {
    this.editor.sceneGraph.attachEntity(this.id, this.parentId, this.editor.entities, this.index);
  }
}
