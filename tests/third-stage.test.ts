import { BoxGeometry, BufferGeometry, Group, Mesh, MeshStandardMaterial, Object3D, PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { Editor } from '../src/editor/Editor';
import { CreateEntityCommand } from '../src/editor/commands/CreateEntityCommand';
import { DeleteEntityCommand } from '../src/editor/commands/DeleteEntityCommand';
import { SetParentCommand } from '../src/editor/commands/SetParentCommand';
import { TransformSelectionCommand } from '../src/editor/commands/TransformSelectionCommand';
import { SetTransformCommand } from '../src/editor/commands/SetTransformCommand';
import { createCubeEntity } from '../src/editor/factories/entityFactories';
import { GLTFEntityBuilder } from '../src/editor/importer/gltf/GLTFEntityBuilder';
import { GLTFImporter } from '../src/editor/importer/gltf/GLTFImporter';
import { ImporterRegistry } from '../src/editor/importer/ImporterRegistry';
import { AssetReferenceManager } from '../src/editor/assets/AssetReferenceManager';
import { RectangleSelection } from '../src/editor/selection/RectangleSelection';
import { VertexSnapper } from '../src/editor/snap/VertexSnapper';
import { MultiObjectTransform } from '../src/editor/transform/MultiObjectTransform';
import { ResourceDisposeManager } from '../src/engine/three/ResourceDisposeManager';
import { ThreeSceneAdapter } from '../src/engine/three/ThreeSceneAdapter';

function makeChairObjectTree(): Object3D {
  const root = new Group();
  root.name = 'ChairRoot';
  root.position.set(1, 2, 3);

  const material = new MeshStandardMaterial({ color: '#336699', roughness: 0.4, metalness: 0.1 });
  const seat = new Mesh(new BoxGeometry(2, 0.2, 2), material);
  seat.name = 'Seat';
  seat.position.set(0, 0.8, 0);

  const leg = new Mesh(new BoxGeometry(0.2, 1, 0.2), material.clone());
  leg.name = 'Leg01';
  leg.position.set(-0.8, 0, -0.8);

  root.add(seat, leg);
  return root;
}

describe('third stage resource editing systems', () => {
  it('converts a GLTF Object3D tree into editable Entity hierarchy without adding gltf.scene directly', () => {
    const editor = new Editor();
    const modelAsset = editor.assets.register({ type: 'Model', name: 'chair.glb', url: 'memory://chair.glb' });
    const builder = new GLTFEntityBuilder(editor);

    const result = builder.build(makeChairObjectTree(), modelAsset.id);
    result.commands.forEach((command) => editor.execute(command));

    const root = editor.entities.get(result.rootEntityId);
    expect(root?.name).toBe('ChairRoot');
    expect(editor.sceneGraph.getChildren(result.rootEntityId).map((id) => editor.entities.get(id)?.name)).toEqual(['Seat', 'Leg01']);
    expect(editor.entities.all.every((entity) => entity.components.transform?.type === 'transform')).toBe(true);
    expect(editor.entities.all.filter((entity) => entity.components.mesh).map((entity) => entity.name)).toEqual(['Seat', 'Leg01']);
    expect(editor.assets.get(modelAsset.id)?.references).toContain(result.rootEntityId);
  });

  it('registers GLTFImporter for real gltf/glb files and exposes model import capability', () => {
    const registry = new ImporterRegistry();
    const importer = new GLTFImporter();
    registry.register(importer);

    expect(registry.findByFileName('asset.gltf')?.id).toBe('gltf');
    expect(registry.findByFileName('asset.glb')?.id).toBe('gltf');
    expect(registry.findByFileName('asset.obj')).toBeUndefined();
  });

  it('tracks model, entity and material references before asset deletion', () => {
    const editor = new Editor();
    const modelAsset = editor.assets.register({ type: 'Model', name: 'chair.glb', url: 'memory://chair' });
    const materialAsset = editor.assets.register({ type: 'Material', name: 'wood', url: 'memory://wood' });
    const entity = createCubeEntity('Chair');
    editor.execute(new CreateEntityCommand(editor, entity));

    const refs = new AssetReferenceManager(editor.assets);
    refs.linkEntityToAsset(modelAsset.id, entity.id);
    refs.linkEntityToAsset(materialAsset.id, entity.id);

    expect(refs.getReferences(modelAsset.id)).toEqual([entity.id]);
    expect(refs.canDelete(modelAsset.id)).toBe(false);
    refs.unlinkEntityFromAsset(modelAsset.id, entity.id);
    expect(refs.canDelete(modelAsset.id)).toBe(true);
  });

  it('selects entities inside a screen rectangle in containment and intersection modes', () => {
    const camera = new PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    const selection = new RectangleSelection(camera, { width: 100, height: 100 });
    const candidates = [
      { entityId: 'a', center: new Vector3(0, 0, 0), radius: 0.2 },
      { entityId: 'b', center: new Vector3(2, -2, 0), radius: 0.2 }
    ];

    expect(selection.select(candidates, { x: 40, y: 40, width: 20, height: 20 }, 'contain')).toEqual(['a']);
    expect(selection.select(candidates, { x: 40, y: 40, width: 45, height: 45 }, 'intersect')).toContain('b');
  });

  it('finds nearest mesh vertex for vertex snapping', () => {
    const mesh = new Mesh(new BoxGeometry(2, 2, 2), new MeshStandardMaterial());
    mesh.name = 'SnapMesh';
    mesh.updateMatrixWorld(true);
    const snapper = new VertexSnapper();

    const result = snapper.findNearestVertex([{ entityId: 'box', object: mesh }], new Vector3(1.1, 1.1, 1.1), 0.5);

    expect(result?.entityId).toBe('box');
    expect(result?.worldPosition.x).toBeCloseTo(1);
    expect(result?.offset.length()).toBeLessThan(0.3);
  });

  it('applies multi-object translate, rotate and scale while preserving relative transforms', () => {
    const editor = new Editor();
    const first = createCubeEntity('First');
    const second = createCubeEntity('Second');
    editor.execute(new CreateEntityCommand(editor, first));
    editor.execute(new CreateEntityCommand(editor, second));
    editor.execute(new SetTransformCommand(editor, first.id, { position: { x: 1, y: 0, z: 0 } }));
    editor.execute(new SetTransformCommand(editor, second.id, { position: { x: -1, y: 0, z: 0 } }));

    const records = new MultiObjectTransform(editor).buildTransformRecords([first.id, second.id], {
      pivot: { x: 0, y: 0, z: 0 },
      translate: { x: 0, y: 1, z: 0 },
      rotateEulerDegrees: { x: 0, y: 90, z: 0 },
      scale: { x: 2, y: 2, z: 2 }
    });
    editor.execute(new TransformSelectionCommand(editor, records, { mode: 'selection-center', position: { x: 0, y: 0, z: 0 } }, 'world'));

    expect(editor.entities.getTransform(first.id)?.position.x).toBeCloseTo(0);
    expect(editor.entities.getTransform(first.id)?.position.z).toBeCloseTo(-2);
    expect(editor.entities.getTransform(second.id)?.position.z).toBeCloseTo(2);
    editor.undo();
    expect(editor.entities.getTransform(first.id)?.position).toEqual({ x: 1, y: 0, z: 0 });
  });

  it('restores entities, components and Object3D mappings after bulk undo redo', () => {
    const editor = new Editor();
    const adapter = new ThreeSceneAdapter(editor);
    const ids: string[] = [];

    for (let i = 0; i < 100; i += 1) {
      const entity = createCubeEntity(`Bulk_${i}`);
      ids.push(entity.id);
      editor.execute(new CreateEntityCommand(editor, entity));
      editor.execute(new SetTransformCommand(editor, entity.id, { position: { x: i % 10, y: Math.floor(i / 10), z: i % 3 } }));
      if (i > 0 && i % 5 === 0) editor.execute(new SetParentCommand(editor, entity.id, ids[i - 1]));
    }

    editor.execute(new DeleteEntityCommand(editor, ids.slice(0, 20)));
    adapter.sync();
    expect(editor.entities.get(ids[0])).toBeUndefined();

    for (let i = 0; i < 221; i += 1) editor.undo();
    adapter.sync();
    expect(editor.entities.all).toHaveLength(0);
    expect(adapter.getObject(ids[50])).toBeUndefined();

    for (let i = 0; i < 221; i += 1) editor.redo();
    adapter.sync();
    expect(editor.entities.get(ids[50])?.components.transform?.type).toBe('transform');
    expect(adapter.getObject(ids[50])?.userData.entityId).toBe(ids[50]);
  });

  it('disposes geometry and material resources exactly once', () => {
    const geometry = new BufferGeometry();
    const material = new MeshStandardMaterial();
    const mesh = new Mesh(geometry, material);
    const disposer = new ResourceDisposeManager();

    disposer.disposeObject(mesh);

    expect(disposer.disposedGeometries).toBe(1);
    expect(disposer.disposedMaterials).toBe(1);
  });
});


