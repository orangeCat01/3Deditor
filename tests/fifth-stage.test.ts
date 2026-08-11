import { describe, expect, it } from 'vitest';
import { Editor } from '../src/editor/Editor';
import { CreateEntityCommand } from '../src/editor/commands/CreateEntityCommand';
import { ImportSceneCommand } from '../src/editor/commands/ImportSceneCommand';
import { SetAnimationCommand } from '../src/editor/commands/SetAnimationCommand';
import { SetMaterialCommand } from '../src/editor/commands/SetMaterialCommand';
import { SetTransformCommand } from '../src/editor/commands/SetTransformCommand';
import { createCubeEntity } from '../src/editor/factories/entityFactories';
import { SceneSerializer } from '../src/editor/serializer/SceneSerializer';
import { SceneDeserializer } from '../src/editor/serializer/SceneDeserializer';
import { CURRENT_SCENE_VERSION } from '../src/editor/serializer/SceneVersion';
import { MigrationManager } from '../src/editor/serializer/MigrationManager';
import { RuntimeClock } from '../src/editor/runtime/RuntimeClock';
import { RuntimeLoop } from '../src/editor/runtime/RuntimeLoop';
import { RuntimeModeManager } from '../src/editor/runtime/RuntimeModeManager';
import { TweenManager } from '../src/editor/animation/TweenManager';
import { TweenSystem } from '../src/editor/animation/TweenSystem';
import type { TweenComponent } from '../src/editor/animation/TweenComponent';

function createTweenComponent(): TweenComponent {
  return {
    type: 'animation',
    tweens: [
      {
        id: 'move-x',
        target: 'transform.position.x',
        from: 0,
        to: 10,
        duration: 1000,
        delay: 0,
        loop: false,
        easing: 'linear',
        autoStart: true
      }
    ]
  } as TweenComponent;
}

describe('fifth stage scene serialization and animation runtime', () => {
  it('exports custom scene JSON from Entity Component and Asset data only', () => {
    const editor = new Editor();
    const entity = createCubeEntity('Serializable Cube');
    editor.execute(new CreateEntityCommand(editor, entity));
    editor.execute(new SetTransformCommand(editor, entity.id, { position: { x: 3, y: 4, z: 5 }, rotationEulerDegrees: { x: 0, y: 90, z: 0 } }));
    editor.execute(new SetMaterialCommand(editor, entity.id, { color: '#112233', textureAssetId: 'asset_texture_1' }));
    const texture = editor.assets.restore({ id: 'asset_texture_1', type: 'Texture', name: 'albedo.png', url: 'assets/albedo.png', metadata: { width: 64 }, references: [entity.id] });
    editor.assets.addReference(texture.id, entity.id);
    editor.select(entity.id);
    editor.setHover(entity.id);

    const scene = new SceneSerializer().serialize(editor);

    expect(scene.version).toBe(CURRENT_SCENE_VERSION);
    expect(scene.scene.rootEntities).toEqual([entity.id]);
    expect(scene.entities[entity.id].components.transform.quaternion.w).not.toBeUndefined();
    expect(scene.entities[entity.id].components.transform.rotationEulerDegrees).toBeUndefined();
    expect(scene.assets[texture.id].url).toBe('assets/albedo.png');
    expect(JSON.stringify(scene)).not.toContain('Object3D');
    expect(JSON.stringify(scene)).not.toContain('hoverId');
    expect(JSON.stringify(scene)).not.toContain('selectedIds');
    expect(JSON.stringify(scene)).not.toContain('undoStack');
  });

  it('imports custom scene JSON, restores hierarchy, transform and material, and reports missing assets', () => {
    const source = new Editor();
    const parent = createCubeEntity('Parent');
    const child = createCubeEntity('Child');
    source.execute(new CreateEntityCommand(source, parent));
    source.execute(new CreateEntityCommand(source, child));
    source.sceneGraph.attachEntity(child.id, parent.id, source.entities);
    source.execute(new SetTransformCommand(source, child.id, { position: { x: 1, y: 2, z: 3 } }));
    source.execute(new SetMaterialCommand(source, child.id, { color: '#abcdef', textureAssetId: 'missing_texture' }));
    const json = new SceneSerializer().serialize(source);

    const target = new Editor();
    target.execute(new ImportSceneCommand(target, json));

    expect(target.sceneGraph.rootIds).toEqual([parent.id]);
    expect(target.sceneGraph.getChildren(parent.id)).toEqual([child.id]);
    expect(target.entities.getTransform(child.id)?.position).toEqual({ x: 1, y: 2, z: 3 });
    expect(target.entities.get(child.id)?.components.material?.color).toBe('#abcdef');
    expect(new SceneDeserializer().deserialize(json).warnings).toContain('Missing asset referenced by material: missing_texture');
    target.undo();
    expect(target.entities.all).toHaveLength(0);
    target.redo();
    expect(target.entities.get(child.id)?.name).toBe('Child');
  });

  it('runs scene version migration before deserialization', () => {
    const migration = new MigrationManager();
    const migrated = migration.migrate({ version: '0.9', scene: { rootEntities: [] }, entities: {}, assets: {}, settings: {} });

    expect(migrated.version).toBe(CURRENT_SCENE_VERSION);
    expect(migrated.settings.migratedFrom).toBe('0.9');
  });

  it('updates tween targets from the shared runtime clock and supports pause', () => {
    const editor = new Editor();
    const entity = createCubeEntity('Tweened');
    entity.components.animation = createTweenComponent();
    editor.execute(new CreateEntityCommand(editor, entity));
    const clock = new RuntimeClock();
    const tweens = new TweenManager(editor);
    const system = new TweenSystem(editor, tweens);

    clock.play();
    clock.update(500);
    system.update(clock);
    expect(editor.entities.getTransform(entity.id)?.position.x).toBeCloseTo(5);

    clock.pause();
    clock.update(500);
    system.update(clock);
    expect(editor.entities.getTransform(entity.id)?.position.x).toBeCloseTo(5);
  });

  it('updates animation tween inspector fields through command history', () => {
    const editor = new Editor();
    const entity = createCubeEntity('Animated Inspector');
    entity.components.animation = createTweenComponent();
    editor.execute(new CreateEntityCommand(editor, entity));

    editor.execute(new SetAnimationCommand(editor, entity.id, { duration: 2500, loop: true }));
    expect(editor.entities.get(entity.id)?.components.animation?.tweens[0]?.duration).toBe(2500);
    expect(editor.entities.get(entity.id)?.components.animation?.tweens[0]?.loop).toBe(true);

    editor.undo();
    expect(editor.entities.get(entity.id)?.components.animation?.tweens[0]?.duration).toBe(1000);
    expect(editor.entities.get(entity.id)?.components.animation?.tweens[0]?.loop).toBe(false);
  });

  it('runtime loop executes in deterministic order and stop restores edit snapshot', () => {
    const editor = new Editor();
    const entity = createCubeEntity('Runtime Cube');
    entity.components.animation = createTweenComponent();
    editor.execute(new CreateEntityCommand(editor, entity));
    const mode = new RuntimeModeManager(editor);
    const clock = new RuntimeClock();
    const loop = new RuntimeLoop(editor, clock, mode);

    mode.play();
    clock.play();
    clock.update(1000);
    loop.tick();
    expect(editor.entities.getTransform(entity.id)?.position.x).toBeCloseTo(10);

    mode.stop();
    expect(editor.entities.getTransform(entity.id)?.position.x).toBe(0);
    expect(loop.lastExecutionOrder).toEqual(['Clock Update', 'Timer Update', 'Animation Update', 'Tween Update', 'Physics Update', 'Shader Uniform Update', 'Post Processing Update', 'Render']);
  });
});




