import { describe, expect, it } from 'vitest';
import { Object3D } from 'three';
import { Editor } from '../src/editor/Editor';
import { CreateEntityCommand } from '../src/editor/commands/CreateEntityCommand';
import { DeleteEntityCommand } from '../src/editor/commands/DeleteEntityCommand';
import { ImportSceneCommand } from '../src/editor/commands/ImportSceneCommand';
import { SetAnimationPropertyCommand } from '../src/editor/commands/SetAnimationPropertyCommand';
import { SetColliderCommand } from '../src/editor/commands/SetColliderCommand';
import { SetMaterialCommand } from '../src/editor/commands/SetMaterialCommand';
import { SetPhysicsCommand } from '../src/editor/commands/SetPhysicsCommand';
import { SetShaderCommand } from '../src/editor/commands/SetShaderCommand';
import { createCubeEntity } from '../src/editor/factories/entityFactories';
import { GLTFEntityBuilder } from '../src/editor/importer/gltf/GLTFEntityBuilder';
import { SceneSerializer } from '../src/editor/serializer/SceneSerializer';
import { RuntimeExporter } from '../src/editor/runtime/export/RuntimeExporter';
import { RuntimeClock } from '../src/editor/runtime/RuntimeClock';
import { TimerSystem } from '../src/editor/timer/TimerSystem';
import { PhysicsAdapter } from '../src/editor/physics/PhysicsAdapter';
import { PhysicsSystem } from '../src/editor/physics/PhysicsSystem';
import { ShaderManager } from '../src/editor/shader/ShaderManager';
import { createBasicColorShaderAsset } from '../src/editor/shader/ShaderTemplates';
import { PluginManager } from '../src/editor/plugin/PluginManager';
import { PluginRegistry } from '../src/editor/plugin/PluginRegistry';
import { createGridHelperPlugin } from '../src/editor/plugin/demo/GridHelperPlugin';
import { ThreeSceneAdapter } from '../src/engine/three/ThreeSceneAdapter';

function addRuntimeComponents(editor: Editor, entityId: string): void {
  const shader = new ShaderManager(editor.assets).register(createBasicColorShaderAsset());
  editor.execute(new SetShaderCommand(editor, entityId, {
    type: 'shader',
    shaderAssetId: shader.id,
    vertexShader: '',
    fragmentShader: '',
    uniforms: { uColor: { type: 'color', value: '#33aaff' } },
    defines: {},
    enabled: true
  }));
  editor.execute(new SetPhysicsCommand(editor, entityId, {
    type: 'physics',
    mass: 1,
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
    gravity: { x: 0, y: -9.8, z: 0 },
    materialId: 'default_physics_material',
    enabled: true
  }));
  editor.execute(new SetColliderCommand(editor, entityId, {
    type: 'collider',
    shape: 'box',
    size: { x: 1, y: 1, z: 1 },
    radius: 0.5,
    height: 1,
    offset: { x: 0, y: 0, z: 0 },
    isTrigger: false
  }));
}

describe('final validation delivery flow', () => {
  it('validates entity creation material shader animation timer physics plugin dispose and runtime export', () => {
    const editor = new Editor();
    const entity = createCubeEntity('Final Cube');
    editor.execute(new CreateEntityCommand(editor, entity));
    expect(editor.entities.get(entity.id)?.name).toBe('Final Cube');

    const gltfRoot = new Object3D();
    gltfRoot.name = 'ImportedRoot';
    const child = new Object3D();
    child.name = 'ImportedChild';
    gltfRoot.add(child);
    const gltfBuild = new GLTFEntityBuilder(editor).build(gltfRoot, 'model_asset_final');
    gltfBuild.commands.forEach((command) => editor.execute(command));
    expect(gltfBuild.entityIds).toHaveLength(2);

    editor.execute(new SetMaterialCommand(editor, entity.id, { color: '#123456', opacity: 0.75 }));
    expect(editor.entities.get(entity.id)?.components.material?.color).toBe('#123456');

    addRuntimeComponents(editor, entity.id);
    expect(editor.entities.get(entity.id)?.components.shader?.enabled).toBe(true);

    const animation = {
      type: 'animation' as const,
      clips: [],
      activeClipId: null,
      autoplay: false,
      playing: false,
      speed: 1,
      tweens: []
    };
    editor.entities.replaceAnimation(entity.id, animation);
    editor.execute(new SetAnimationPropertyCommand(editor, entity.id, { playing: true }));
    expect(editor.entities.get(entity.id)?.components.animation?.playing).toBe(true);

    editor.entities.replaceTimer(entity.id, {
      type: 'timer',
      delay: 10,
      repeat: false,
      repeatCount: 1,
      autoStart: true,
      paused: false,
      actions: [{ type: 'SetVisibility', entityId: entity.id, visible: false }]
    });
    const clock = new RuntimeClock();
    clock.play();
    clock.update(10);
    new TimerSystem(editor).update(clock);
    expect(editor.entities.get(entity.id)?.editor.visible).toBe(false);

    const collisions: string[] = [];
    editor.events.on('collisionEnter', (event) => collisions.push(`${event.a}:${event.b}`));
    new PhysicsSystem(editor, new PhysicsAdapter(editor)).update(0.016);
    expect(editor.entities.getTransform(entity.id)).toBeDefined();

    const registry = new PluginRegistry();
    const plugins = new PluginManager(editor, registry);
    plugins.install(createGridHelperPlugin());
    plugins.enable('grid-helper.toggle');
    expect(registry.commands).toContain('grid-helper.toggle');

    const sceneJson = new SceneSerializer().serialize(editor);
    const imported = new Editor();
    imported.execute(new ImportSceneCommand(imported, sceneJson));
    expect(imported.entities.get(entity.id)?.components.shader?.enabled).toBe(true);

    const runtimeJson = new RuntimeExporter().export(editor);
    expect(runtimeJson.entities[entity.id].components.physics.enabled).toBe(true);
    expect(JSON.stringify(runtimeJson)).not.toContain('Object3D');

    const adapter = new ThreeSceneAdapter(editor);
    adapter.sync();
    editor.execute(new DeleteEntityCommand(editor, [entity.id]));
    adapter.sync();
    expect(adapter.disposeStats.disposedGeometries).toBeGreaterThan(0);
  });

  it('keeps plugin registry stable across install enable disable and uninstall', () => {
    const editor = new Editor();
    const registry = new PluginRegistry();
    const plugins = new PluginManager(editor, registry);
    const plugin = createGridHelperPlugin();

    plugins.install(plugin);
    expect(registry.tools).toEqual(['grid-helper.toggle']);
    expect(registry.commands).toEqual(['grid-helper.toggle']);

    plugins.enable(plugin.id);
    expect(registry.tools).toEqual(['grid-helper.toggle']);
    expect(registry.commands).toEqual(['grid-helper.toggle']);

    plugins.disable(plugin.id);
    expect(registry.tools).toEqual([]);
    expect(registry.commands).toEqual([]);

    plugins.uninstall(plugin.id);
    expect(plugins.getState(plugin.id)?.state).toBe('uninstalled');
    expect(registry.tools).toEqual([]);
    expect(registry.commands).toEqual([]);
  });
});
