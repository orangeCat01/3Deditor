import { describe, expect, it } from 'vitest';
import { Euler, Quaternion } from 'three';
import { Editor } from '../src/editor/Editor';
import { AddEntityCommand } from '../src/editor/commands/AddEntityCommand';
import { SetTransformCommand } from '../src/editor/commands/SetTransformCommand';
import { createCubeEntity } from '../src/editor/factories/entityFactories';
import { createDefaultTransform, eulerDegreesToQuaternion } from '../src/editor/components/TransformComponent';
import { ThreeSceneAdapter } from '../src/engine/three/ThreeSceneAdapter';

describe('editor core vertical slice', () => {
  it('creates cube entities as the business data source before rendering adapters map them', () => {
    const editor = new Editor();
    const cube = createCubeEntity('Cube');

    editor.execute(new AddEntityCommand(editor, cube));

    const stored = editor.entities.get(cube.id);
    expect(stored?.name).toBe('Cube');
    expect(stored?.components.transform?.quaternion).toEqual(createDefaultTransform().quaternion);
    expect(stored?.components.mesh?.geometryId).toBe(stored?.components.geometry?.id);
    expect(editor.sceneGraph.rootIds).toEqual([cube.id]);
  });

  it('syncs entity/component data to Three.js Object3D without using Object3D as source of truth', () => {
    const editor = new Editor();
    const cube = createCubeEntity('Cube');
    editor.execute(new AddEntityCommand(editor, cube));

    const adapter = new ThreeSceneAdapter(editor);
    adapter.sync();

    const object = adapter.getObject(cube.id);
    expect(object?.userData.entityId).toBe(cube.id);
    expect(object?.position.toArray()).toEqual([0, 0.5, 0]);
    object?.position.set(20, 20, 20);

    const transform = editor.entities.getTransform(cube.id);
    expect(transform?.position).toEqual({ x: 0, y: 0.5, z: 0 });
  });

  it('tracks selection independently from the renderer', () => {
    const editor = new Editor();
    const cube = createCubeEntity('Cube');
    editor.execute(new AddEntityCommand(editor, cube));

    editor.selection.select(cube.id);

    expect(editor.selection.activeId).toBe(cube.id);
    expect(editor.selection.selectedIds).toEqual([cube.id]);
  });

  it('applies transform changes through commands and supports undo and redo', () => {
    const editor = new Editor();
    const cube = createCubeEntity('Cube');
    editor.execute(new AddEntityCommand(editor, cube));

    editor.execute(
      new SetTransformCommand(editor, cube.id, {
        position: { x: 2, y: 3, z: 4 }
      })
    );

    expect(editor.entities.getTransform(cube.id)?.position).toEqual({ x: 2, y: 3, z: 4 });
    expect(editor.history.canUndo).toBe(true);

    editor.undo();
    expect(editor.entities.getTransform(cube.id)?.position).toEqual({ x: 0, y: 0.5, z: 0 });

    editor.redo();
    expect(editor.entities.getTransform(cube.id)?.position).toEqual({ x: 2, y: 3, z: 4 });
  });

  it('uses quaternion as authoritative rotation data while accepting Euler UI values', () => {
    const quaternion = eulerDegreesToQuaternion({ x: 0, y: 90, z: 0 });
    const expected = new Quaternion().setFromEuler(new Euler(0, Math.PI / 2, 0));

    expect(quaternion.x).toBeCloseTo(expected.x);
    expect(quaternion.y).toBeCloseTo(expected.y);
    expect(quaternion.z).toBeCloseTo(expected.z);
    expect(quaternion.w).toBeCloseTo(expected.w);
  });
});
