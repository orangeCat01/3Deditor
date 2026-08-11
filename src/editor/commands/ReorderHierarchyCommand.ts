import type { Editor } from '../Editor';
import type { EntityId } from '../types';
import type { Command } from './Command';

export class ReorderHierarchyCommand implements Command {
  readonly name = 'Reorder Hierarchy';
  private before: EntityId[] = [];

  constructor(private readonly editor: Editor, private readonly parentId: EntityId | null, private readonly after: EntityId[]) {}

  execute(): void {
    this.before = this.parentId ? this.editor.sceneGraph.getChildren(this.parentId) : this.editor.sceneGraph.rootIds;
    this.editor.sceneGraph.setChildOrder(this.parentId, this.after, this.editor.entities);
  }

  undo(): void {
    this.editor.sceneGraph.setChildOrder(this.parentId, this.before, this.editor.entities);
  }

  redo(): void {
    this.editor.sceneGraph.setChildOrder(this.parentId, this.after, this.editor.entities);
  }
}
