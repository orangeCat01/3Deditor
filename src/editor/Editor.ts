import { EventBus } from './core/EventBus';
import { EntityManager } from './entity/EntityManager';
import { SceneGraph } from './scene/SceneGraph';
import { SelectionManager } from './selection/SelectionManager';
import { CommandManager } from './commands/CommandManager';
import { SetTransformCommand } from './commands/SetTransformCommand';
import { AssetManager } from './assets/AssetManager';
import { SnapManager } from './snap/SnapManager';
import { InspectorSchemaRegistry } from './inspector/InspectorSchemaRegistry';
import type { Command } from './commands/Command';
import type { EditorEntity, EntityId } from './types';
import type { TransformPatch } from './components/TransformComponent';

interface EditorEvents {
  sceneChanged: void;
  selectionChanged: EntityId[];
  hoverChanged: EntityId | null;
  collisionEnter: { a: EntityId; b: EntityId };
  collisionExit: { a: EntityId; b: EntityId };
  triggerEnter: { a: EntityId; b: EntityId };
}

export class Editor {
  readonly entities = new EntityManager();
  readonly sceneGraph = new SceneGraph();
  readonly selection = new SelectionManager();
  readonly history = new CommandManager();
  readonly events = new EventBus<EditorEvents>();
  readonly assets = new AssetManager();
  readonly snap = new SnapManager();
  readonly inspectorSchemas = new InspectorSchemaRegistry();
  private readonly deletedSnapshots = new Map<EntityId, EditorEntity>();

  constructor() {
    this.sceneGraph.bindEntityGetter((id) => this.entities.get(id));
    this.inspectorSchemas.registerTransformSchema();
  }

  execute(command: Command): void {
    this.history.execute(command);
    this.notifySceneChanged();
  }

  undo(): void {
    this.history.undo();
    this.notifySceneChanged();
  }

  redo(): void {
    this.history.redo();
    this.notifySceneChanged();
  }

  select(id: EntityId | null, additive = false): void {
    if (id) {
      this.selection.select(id, additive);
    } else {
      this.selection.clear();
    }
    this.events.emit('selectionChanged', this.selection.selectedIds);
  }

  setSelection(ids: EntityId[], activeId?: EntityId | null): void {
    this.selection.set(ids, activeId);
    this.events.emit('selectionChanged', this.selection.selectedIds);
  }

  setHover(id: EntityId | null): void {
    this.selection.setHover(id);
    this.events.emit('hoverChanged', id);
  }

  createSetTransformCommand(id: EntityId, patch: TransformPatch): SetTransformCommand {
    return new SetTransformCommand(this, id, patch);
  }

  addEntityInternal(entity: EditorEntity): void {
    this.entities.add(entity);
    this.sceneGraph.addEntity(entity);
  }

  removeEntityInternal(id: EntityId): void {
    const entity = this.entities.get(id);
    if (entity) this.deletedSnapshots.set(id, entity);
    this.entities.remove(id);
    this.sceneGraph.removeEntity(id);
    this.selection.remove(id);
  }

  deleteEntitiesInternal(ids: EntityId[]): EditorEntity[] {
    const expanded = this.expandWithDescendants(ids);
    const snapshots = this.entities.snapshot(expanded);
    expanded.forEach((id) => this.removeEntityInternal(id));
    return snapshots;
  }

  clearSceneInternal(): EditorEntity[] {
    const snapshot = this.entities.snapshot();
    snapshot.forEach((entity) => this.removeEntityInternal(entity.id));
    this.assets.clear();
    this.selection.clear();
    return snapshot;
  }

  restoreEntitiesInternal(entities: EditorEntity[]): void {
    entities.forEach((entity) => this.entities.add(entity));
    entities.forEach((entity) => {
      if (entity.parentId) {
        this.sceneGraph.attachEntity(entity.id, entity.parentId, this.entities);
      } else {
        this.sceneGraph.addRoot(entity.id);
      }
    });
  }

  getDeletedEntitySnapshot(id: EntityId): EditorEntity | undefined {
    return this.deletedSnapshots.get(id);
  }

  notifySceneChanged(): void {
    this.events.emit('sceneChanged', undefined);
  }

  private expandWithDescendants(ids: EntityId[]): EntityId[] {
    const expanded = new Set<EntityId>();
    const visit = (id: EntityId): void => {
      if (expanded.has(id)) return;
      expanded.add(id);
      this.sceneGraph.getChildren(id).forEach(visit);
    };
    ids.forEach(visit);
    return [...expanded];
  }
}


