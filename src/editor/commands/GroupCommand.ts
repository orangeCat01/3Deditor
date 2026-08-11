import type { Editor } from '../Editor';
import { createGroupEntity } from '../factories/entityFactories';
import type { EditorEntity, EntityId } from '../types';
import type { Command } from './Command';

export class GroupCommand implements Command {
  readonly name = 'Group';
  private group?: EditorEntity;
  private previousParents = new Map<EntityId, EntityId | null>();

  constructor(private readonly editor: Editor, private readonly ids: EntityId[], private readonly groupName = 'Group') {}

  execute(): void {
    if (!this.group) this.group = createGroupEntity(this.groupName);
    this.editor.addEntityInternal(this.group);
    this.ids.forEach((id, index) => {
      this.previousParents.set(id, this.editor.entities.get(id)?.parentId ?? null);
      this.editor.sceneGraph.attachEntity(id, this.group!.id, this.editor.entities, index);
    });
  }

  undo(): void {
    this.ids.forEach((id) => this.editor.sceneGraph.attachEntity(id, this.previousParents.get(id) ?? null, this.editor.entities));
    if (this.group) this.editor.removeEntityInternal(this.group.id);
  }

  redo(): void {
    this.execute();
  }
}
