import type { Editor } from '../Editor';
import type { EntityId } from '../types';
import type { Command } from './Command';

export class UngroupCommand implements Command {
  readonly name = 'Ungroup';
  private children: EntityId[] = [];
  private groupParent: EntityId | null = null;

  constructor(private readonly editor: Editor, private readonly groupId: EntityId) {}

  execute(): void {
    const group = this.editor.entities.get(this.groupId);
    if (!group) return;
    this.children = [...group.children];
    this.groupParent = group.parentId;
    this.children.forEach((childId) => this.editor.sceneGraph.attachEntity(childId, this.groupParent, this.editor.entities));
    this.editor.removeEntityInternal(this.groupId);
  }

  undo(): void {
    const group = this.editor.getDeletedEntitySnapshot(this.groupId);
    if (!group) return;
    this.editor.addEntityInternal(group);
    this.children.forEach((childId, index) => this.editor.sceneGraph.attachEntity(childId, this.groupId, this.editor.entities, index));
  }

  redo(): void {
    this.execute();
  }
}
