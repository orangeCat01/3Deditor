import { BoxGeometry, Mesh, MeshStandardMaterial, Object3D, Texture, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { Editor } from '../src/editor/Editor';
import { CreateEntityCommand } from '../src/editor/commands/CreateEntityCommand';
import { DeleteEntityCommand } from '../src/editor/commands/DeleteEntityCommand';
import { SetMaterialCommand } from '../src/editor/commands/SetMaterialCommand';
import { TransformSelectionCommand } from '../src/editor/commands/TransformSelectionCommand';
import { createCubeEntity } from '../src/editor/factories/entityFactories';
import { SelectionBoxOverlay } from '../src/editor/selection/SelectionBoxOverlay';
import { OverlapSelection } from '../src/editor/selection/OverlapSelection';
import { HoverHighlightManager } from '../src/engine/three/HoverHighlightManager';
import { VertexSnapPreview } from '../src/editor/snap/VertexSnapPreview';
import { VertexSnapper } from '../src/editor/snap/VertexSnapper';
import { MultiObjectTransform } from '../src/editor/transform/MultiObjectTransform';
import { TextureLoaderService } from '../src/editor/assets/TextureLoaderService';
import { ResourceDisposeManager } from '../src/engine/three/ResourceDisposeManager';
import { PerformanceMonitor } from '../src/editor/performance/PerformanceMonitor';
import { ThreeSceneAdapter } from '../src/engine/three/ThreeSceneAdapter';

describe('fourth stage editor interaction and material systems', () => {
  it('tracks rectangle selection overlay drag state and returns normalized rectangle', () => {
    const overlay = new SelectionBoxOverlay();

    overlay.begin({ x: 80, y: 70 }, 'intersect');
    overlay.update({ x: 30, y: 20 });

    expect(overlay.visible).toBe(true);
    expect(overlay.rect).toEqual({ x: 30, y: 20, width: 50, height: 50 });
    expect(overlay.mode).toBe('intersect');
    overlay.end();
    expect(overlay.visible).toBe(false);
  });

  it('builds overlap selection candidates with names, types and hierarchy paths', () => {
    const editor = new Editor();
    const parent = createCubeEntity('Parent');
    const child = createCubeEntity('Child');
    editor.execute(new CreateEntityCommand(editor, parent));
    editor.execute(new CreateEntityCommand(editor, child));
    editor.sceneGraph.attachEntity(child.id, parent.id, editor.entities);

    const candidates = new OverlapSelection(editor).buildCandidates([child.id, parent.id]);

    expect(candidates.map((candidate) => candidate.name)).toEqual(['Child', 'Parent']);
    expect(candidates[0].path).toBe('Parent / Child');
    expect(candidates[0].type).toBe('Mesh');
  });

  it('stores hover highlight state outside undo history', () => {
    const editor = new Editor();
    const entity = createCubeEntity('Hover');
    editor.execute(new CreateEntityCommand(editor, entity));
    const object = new Object3D();
    const highlight = new HoverHighlightManager();

    highlight.setHover(entity.id, object);
    editor.setHover(entity.id);

    expect(highlight.hoverId).toBe(entity.id);
    expect(object.userData.hoverHighlighted).toBe(true);
    expect(editor.history.canUndo).toBe(true);
    editor.undo();
    expect(editor.entities.get(entity.id)).toBeUndefined();
    expect(editor.selection.hoverId).toBeNull();
  });

  it('computes vertex snap preview point and line without creating history', () => {
    const mesh = new Mesh(new BoxGeometry(2, 2, 2), new MeshStandardMaterial());
    mesh.updateMatrixWorld(true);
    const preview = new VertexSnapPreview(new VertexSnapper());

    const result = preview.update([{ entityId: 'box', object: mesh }], new Vector3(1.1, 1.1, 1.1), 0.5);

    expect(result?.snapPoint.x).toBeCloseTo(1);
    expect(result?.lineEnd.distanceTo(result.snapPoint)).toBeLessThan(0.3);
    preview.clear();
    expect(preview.current).toBeNull();
  });

  it('runs multi-object rotate as one command with undo and redo', () => {
    const editor = new Editor();
    const a = createCubeEntity('A');
    const b = createCubeEntity('B');
    editor.execute(new CreateEntityCommand(editor, a));
    editor.execute(new CreateEntityCommand(editor, b));
    editor.execute(editor.createSetTransformCommand(a.id, { position: { x: 1, y: 0, z: 0 } }));
    editor.execute(editor.createSetTransformCommand(b.id, { position: { x: -1, y: 0, z: 0 } }));

    const records = new MultiObjectTransform(editor).buildTransformRecords([a.id, b.id], {
      pivot: { x: 0, y: 0, z: 0 },
      rotateEulerDegrees: { x: 0, y: 90, z: 0 }
    });
    editor.execute(new TransformSelectionCommand(editor, records, { mode: 'selection-center', position: { x: 0, y: 0, z: 0 } }, 'world'));

    expect(editor.entities.getTransform(a.id)?.position.z).toBeCloseTo(-1);
    editor.undo();
    expect(editor.entities.getTransform(a.id)?.position).toEqual({ x: 1, y: 0, z: 0 });
    editor.redo();
    expect(editor.entities.getTransform(b.id)?.position.z).toBeCloseTo(1);
  });

  it('updates material properties through command and maps them to runtime material', () => {
    const editor = new Editor();
    const entity = createCubeEntity('MaterialTarget');
    editor.execute(new CreateEntityCommand(editor, entity));

    editor.execute(new SetMaterialCommand(editor, entity.id, { color: '#224466', roughness: 0.2, metalness: 0.7, opacity: 0.5, transparent: true }));

    const material = editor.entities.get(entity.id)?.components.material;
    expect(material?.color).toBe('#224466');
    expect(material?.roughness).toBe(0.2);
    editor.undo();
    expect(editor.entities.get(entity.id)?.components.material?.color).toBe('#d98b48');
  });

  it('loads texture assets through TextureLoaderService and tracks references', async () => {
    const editor = new Editor();
    const service = new TextureLoaderService(editor.assets);
    const texture = new Texture();

    const asset = await service.registerLoadedTexture('albedo.png', 'memory://albedo', texture, { width: 128, height: 64 });
    editor.assets.addReference(asset.id, 'entity_texture_user');

    expect(asset.type).toBe('Texture');
    expect(editor.assets.getRuntimeResource(asset.id)?.texture).toBe(texture);
    expect(editor.assets.get(asset.id)?.references).toEqual(['entity_texture_user']);
  });

  it('disposes geometry, material and texture when mapped object is removed', () => {
    const texture = new Texture();
    const material = new MeshStandardMaterial({ map: texture });
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), material);
    const disposer = new ResourceDisposeManager();

    disposer.disposeObject(mesh);

    expect(disposer.disposedGeometries).toBe(1);
    expect(disposer.disposedMaterials).toBe(1);
    expect(disposer.disposedTextures).toBe(1);
  });

  it('records editor performance metrics without changing scene state', () => {
    const editor = new Editor();
    const a = createCubeEntity('PerfA');
    const b = createCubeEntity('PerfB');
    editor.execute(new CreateEntityCommand(editor, a));
    editor.execute(new CreateEntityCommand(editor, b));
    const adapter = new ThreeSceneAdapter(editor);
    adapter.sync();

    const metrics = new PerformanceMonitor(editor, adapter).snapshot();

    expect(metrics.entityCount).toBe(2);
    expect(metrics.meshCount).toBe(2);
    expect(metrics.triangleCount).toBeGreaterThan(0);
    expect(metrics.textureCount).toBe(0);
  });

  it('disposes adapter resources after deleting an entity', () => {
    const editor = new Editor();
    const entity = createCubeEntity('DeleteMe');
    editor.execute(new CreateEntityCommand(editor, entity));
    const adapter = new ThreeSceneAdapter(editor);
    adapter.sync();
    expect(adapter.getObject(entity.id)).toBeDefined();

    editor.execute(new DeleteEntityCommand(editor, [entity.id]));
    adapter.sync();

    expect(adapter.getObject(entity.id)).toBeUndefined();
    expect(adapter.disposeStats.disposedGeometries).toBe(1);
    expect(adapter.disposeStats.disposedMaterials).toBe(1);
  });
});


