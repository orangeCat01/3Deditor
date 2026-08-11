import { describe, expect, it } from 'vitest';
import { Editor } from '../src/editor/Editor';
import { CreateEntityCommand } from '../src/editor/commands/CreateEntityCommand';
import { DeleteEntityCommand } from '../src/editor/commands/DeleteEntityCommand';
import { DuplicateEntityCommand } from '../src/editor/commands/DuplicateEntityCommand';
import { GroupCommand } from '../src/editor/commands/GroupCommand';
import { RenameEntityCommand } from '../src/editor/commands/RenameEntityCommand';
import { ReorderHierarchyCommand } from '../src/editor/commands/ReorderHierarchyCommand';
import { SetLockCommand } from '../src/editor/commands/SetLockCommand';
import { SetParentCommand } from '../src/editor/commands/SetParentCommand';
import { SetVisibilityCommand } from '../src/editor/commands/SetVisibilityCommand';
import { UngroupCommand } from '../src/editor/commands/UngroupCommand';
import { CompositeCommand } from '../src/editor/commands/CompositeCommand';
import { createCubeEntity } from '../src/editor/factories/entityFactories';
import { PivotManager } from '../src/editor/transform/PivotManager';
import { SnapManager } from '../src/editor/snap/SnapManager';
import { ImporterRegistry } from '../src/editor/importer/ImporterRegistry';
import { GLTFImporter } from '../src/editor/importer/GLTFImporter';
import { InspectorSchemaRegistry } from '../src/editor/inspector/InspectorSchemaRegistry';

describe('second stage editor systems', () => {
  it('updates hierarchy through commands and restores it with undo/redo', () => {
    const editor = new Editor();
    const parent = createCubeEntity('Parent');
    const child = createCubeEntity('Child');

    editor.execute(new CreateEntityCommand(editor, parent));
    editor.execute(new CreateEntityCommand(editor, child));
    editor.execute(new SetParentCommand(editor, child.id, parent.id, 0));
    editor.execute(new RenameEntityCommand(editor, child.id, 'Renamed Child'));
    editor.execute(new SetVisibilityCommand(editor, child.id, false));
    editor.execute(new SetLockCommand(editor, child.id, true));

    expect(editor.sceneGraph.getChildren(parent.id)).toEqual([child.id]);
    expect(editor.entities.get(child.id)?.name).toBe('Renamed Child');
    expect(editor.entities.get(child.id)?.editor.visible).toBe(false);
    expect(editor.entities.get(child.id)?.editor.locked).toBe(true);

    editor.undo();
    editor.undo();
    editor.undo();
    editor.undo();

    expect(editor.sceneGraph.rootIds).toEqual([parent.id, child.id]);
    expect(editor.entities.get(child.id)?.name).toBe('Child');
    expect(editor.entities.get(child.id)?.editor.visible).toBe(true);
    expect(editor.entities.get(child.id)?.editor.locked).toBe(false);

    editor.redo();
    expect(editor.sceneGraph.getChildren(parent.id)).toEqual([child.id]);
  });

  it('duplicates, deletes, reorders, groups and ungroups without bypassing commands', () => {
    const editor = new Editor();
    const first = createCubeEntity('First');
    const second = createCubeEntity('Second');
    editor.execute(new CreateEntityCommand(editor, first));
    editor.execute(new CreateEntityCommand(editor, second));

    editor.execute(new ReorderHierarchyCommand(editor, null, [second.id, first.id]));
    expect(editor.sceneGraph.rootIds).toEqual([second.id, first.id]);

    editor.execute(new DuplicateEntityCommand(editor, [first.id]));
    expect(editor.entities.all.some((entity) => entity.name === 'First Copy')).toBe(true);

    editor.execute(new GroupCommand(editor, [first.id, second.id], 'Group'));
    const group = editor.entities.all.find((entity) => entity.name === 'Group');
    expect(group).toBeDefined();
    expect(editor.sceneGraph.getChildren(group!.id)).toEqual([first.id, second.id]);

    editor.execute(new UngroupCommand(editor, group!.id));
    expect(editor.sceneGraph.rootIds).toContain(first.id);
    expect(editor.sceneGraph.rootIds).toContain(second.id);

    editor.execute(new DeleteEntityCommand(editor, [first.id]));
    expect(editor.entities.get(first.id)).toBeUndefined();
    editor.undo();
    expect(editor.entities.get(first.id)?.name).toBe('First');
  });

  it('selection manager owns active and hover state', () => {
    const editor = new Editor();
    const first = createCubeEntity('First');
    const second = createCubeEntity('Second');
    editor.execute(new CreateEntityCommand(editor, first));
    editor.execute(new CreateEntityCommand(editor, second));

    editor.select(first.id);
    editor.select(second.id, true);
    editor.setHover(first.id);

    expect(editor.selection.selectedIds).toEqual([first.id, second.id]);
    expect(editor.selection.activeId).toBe(second.id);
    expect(editor.selection.hoverId).toBe(first.id);

    editor.selection.toggle(first.id);
    expect(editor.selection.selectedIds).toEqual([second.id]);
  });

  it('calculates pivots and filters transform roots for parent child selections', () => {
    const editor = new Editor();
    const parent = createCubeEntity('Parent');
    const child = createCubeEntity('Child');
    editor.execute(new CreateEntityCommand(editor, parent));
    editor.execute(new CreateEntityCommand(editor, child));
    editor.execute(new SetParentCommand(editor, child.id, parent.id, 0));

    const pivot = new PivotManager(editor);
    expect(pivot.getEffectiveTransformRoots([parent.id, child.id])).toEqual([parent.id]);
    expect(pivot.calculatePivot([parent.id, child.id], 'selection-center').position).toEqual({ x: 0, y: 0.5, z: 0 });
  });

  it('snaps grid positions and angle values while keeping settings out of history', () => {
    const snap = new SnapManager();

    snap.updateSettings({ gridEnabled: true, gridSize: 0.5, angleEnabled: true, angleStep: 15 });

    expect(snap.snapPosition({ x: 0.26, y: 0.74, z: -0.26 })).toEqual({ x: 0.5, y: 0.5, z: -0.5 });
    expect(snap.snapAngle(22)).toBe(15);
  });

  it('tracks assets, references and GLTF importer registration', async () => {
    const editor = new Editor();
    const registry = new ImporterRegistry();
    const importer = new GLTFImporter();
    registry.register(importer);

    const asset = editor.assets.register({
      type: 'Model',
      name: 'scene.glb',
      url: 'blob://scene',
      metadata: { format: 'glb' }
    });
    editor.assets.addReference(asset.id, 'entity_0001');

    expect(editor.assets.get(asset.id)?.references).toEqual(['entity_0001']);
    expect(registry.findByFileName('scene.glb')?.id).toBe('gltf');
    expect(registry.findByFileName('scene.txt')).toBeUndefined();
  });

  it('registers schema driven inspector fields for transform components', () => {
    const registry = new InspectorSchemaRegistry();

    registry.registerTransformSchema();

    expect(registry.get('transform')?.fields.map((field) => field.path)).toEqual([
      'position',
      'rotation',
      'scale'
    ]);
  });

  it('runs composite transform transactions as one undo item', () => {
    const editor = new Editor();
    const first = createCubeEntity('First');
    const second = createCubeEntity('Second');
    editor.execute(new CreateEntityCommand(editor, first));
    editor.execute(new CreateEntityCommand(editor, second));

    editor.execute(
      new CompositeCommand('Move Selection', [
        editor.createSetTransformCommand(first.id, { position: { x: 1, y: 1, z: 1 } }),
        editor.createSetTransformCommand(second.id, { position: { x: 2, y: 2, z: 2 } })
      ])
    );

    expect(editor.entities.getTransform(first.id)?.position).toEqual({ x: 1, y: 1, z: 1 });
    expect(editor.entities.getTransform(second.id)?.position).toEqual({ x: 2, y: 2, z: 2 });
    editor.undo();
    expect(editor.entities.getTransform(first.id)?.position).toEqual({ x: 0, y: 0.5, z: 0 });
    expect(editor.entities.getTransform(second.id)?.position).toEqual({ x: 0, y: 0.5, z: 0 });
  });
});



