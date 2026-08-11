import { describe, expect, it } from 'vitest';
import { MeshStandardMaterial, Texture } from 'three';
import { Editor } from '../src/editor/Editor';
import { CreateEntityCommand } from '../src/editor/commands/CreateEntityCommand';
import { DeleteEntityCommand } from '../src/editor/commands/DeleteEntityCommand';
import { SetColliderCommand } from '../src/editor/commands/SetColliderCommand';
import { SetPhysicsCommand } from '../src/editor/commands/SetPhysicsCommand';
import { createCubeEntity } from '../src/editor/factories/entityFactories';
import type { ColliderComponent } from '../src/editor/physics/ColliderComponent';
import type { PhysicsComponent } from '../src/editor/physics/PhysicsComponent';
import { PhysicsAdapter } from '../src/editor/physics/PhysicsAdapter';
import { PhysicsSystem } from '../src/editor/physics/PhysicsSystem';
import { createDefaultPhysicsMaterial } from '../src/editor/physics/PhysicsMaterial';
import { RuntimeClock } from '../src/editor/runtime/RuntimeClock';
import { RuntimeLoop } from '../src/editor/runtime/RuntimeLoop';
import { RuntimeModeManager } from '../src/editor/runtime/RuntimeModeManager';
import { PluginManager } from '../src/editor/plugin/PluginManager';
import { PluginRegistry } from '../src/editor/plugin/PluginRegistry';
import { createGridHelperPlugin } from '../src/editor/plugin/demo/GridHelperPlugin';
import { ResourceLifecycleManager } from '../src/editor/resources/ResourceLifecycleManager';
import { LODManager } from '../src/editor/performance/LODManager';
import { InstanceManager } from '../src/editor/performance/InstanceManager';
import { PerformanceMonitor } from '../src/editor/performance/PerformanceMonitor';
import { ThreeSceneAdapter } from '../src/engine/three/ThreeSceneAdapter';

function physics(): PhysicsComponent {
  return {
    type: 'physics',
    mass: 1,
    velocity: { x: 0, y: 1, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
    gravity: { x: 0, y: -9.8, z: 0 },
    materialId: 'default_physics_material',
    enabled: true
  };
}

function boxCollider(isTrigger = false): ColliderComponent {
  return {
    type: 'collider',
    shape: 'box',
    size: { x: 1, y: 1, z: 1 },
    radius: 0.5,
    height: 1,
    offset: { x: 0, y: 0, z: 0 },
    isTrigger
  };
}

describe('eighth stage physics plugin performance finalization', () => {
  it('creates physics and collider components through commands and undo redo', () => {
    const editor = new Editor();
    const entity = createCubeEntity('Physics Cube');
    editor.execute(new CreateEntityCommand(editor, entity));

    editor.execute(new SetPhysicsCommand(editor, entity.id, physics()));
    editor.execute(new SetColliderCommand(editor, entity.id, boxCollider()));
    expect(editor.entities.get(entity.id)?.components.physics?.mass).toBe(1);
    expect(editor.entities.get(entity.id)?.components.collider?.shape).toBe('box');

    editor.undo();
    expect(editor.entities.get(entity.id)?.components.collider).toBeUndefined();
    editor.redo();
    expect(editor.entities.get(entity.id)?.components.collider?.shape).toBe('box');
  });

  it('updates physics runtime through adapter without storing engine runtime objects on entities', () => {
    const editor = new Editor();
    const entity = createCubeEntity('Falling Cube');
    entity.components.physics = physics();
    entity.components.collider = boxCollider();
    editor.execute(new CreateEntityCommand(editor, entity));
    const adapter = new PhysicsAdapter(editor);
    const system = new PhysicsSystem(editor, adapter);

    system.update(0.5);

    expect(editor.entities.getTransform(entity.id)?.position.y).toBeLessThan(0.5);
    expect(JSON.stringify(editor.entities.get(entity.id))).not.toContain('runtimeBody');
    expect(adapter.getRuntimeBody(entity.id)).toBeDefined();
  });

  it('emits collision and trigger events through editor event system', () => {
    const editor = new Editor();
    const a = createCubeEntity('A');
    const b = createCubeEntity('B');
    a.components.physics = physics();
    b.components.physics = { ...physics(), velocity: { x: 0, y: 0, z: 0 } };
    a.components.collider = boxCollider(false);
    b.components.collider = boxCollider(true);
    editor.execute(new CreateEntityCommand(editor, a));
    editor.execute(new CreateEntityCommand(editor, b));
    const collisions: string[] = [];
    const triggers: string[] = [];
    editor.events.on('collisionEnter', (event) => collisions.push(`${event.a}:${event.b}`));
    editor.events.on('triggerEnter', (event) => triggers.push(`${event.a}:${event.b}`));

    new PhysicsSystem(editor, new PhysicsAdapter(editor)).update(0.016);

    expect(collisions).toHaveLength(1);
    expect(triggers).toHaveLength(1);
  });

  it('runtime loop executes physics between tween and shader uniform update', () => {
    const editor = new Editor();
    const mode = new RuntimeModeManager(editor);
    const clock = new RuntimeClock();
    const loop = new RuntimeLoop(editor, clock, mode);

    mode.play();
    clock.play();
    clock.update(16);
    loop.tick();

    expect(loop.lastExecutionOrder).toEqual(['Clock Update', 'Timer Update', 'Animation Update', 'Tween Update', 'Physics Update', 'Shader Uniform Update', 'Post Processing Update', 'Render']);
  });

  it('installs enables disables and isolates plugins while registering commands', () => {
    const editor = new Editor();
    const registry = new PluginRegistry();
    const manager = new PluginManager(editor, registry);
    const plugin = createGridHelperPlugin();

    manager.install(plugin);
    manager.enable(plugin.id);
    expect(registry.tools).toContain('grid-helper.toggle');
    expect(registry.commands).toContain('grid-helper.toggle');

    manager.disable(plugin.id);
    expect(registry.tools).not.toContain('grid-helper.toggle');

    manager.install({ ...plugin, id: 'broken', install: () => { throw new Error('plugin failed'); } });
    expect(manager.getState('broken')?.lastError).toContain('plugin failed');
  });

  it('disposes GPU resources and tracks lifecycle counts after entity deletion', () => {
    const editor = new Editor();
    const entity = createCubeEntity('Disposable');
    editor.execute(new CreateEntityCommand(editor, entity));
    const adapter = new ThreeSceneAdapter(editor);
    adapter.sync();
    const material = new MeshStandardMaterial();
    material.map = new Texture();
    editor.assets.registerRuntimeResource(entity.components.material?.runtimeMaterialId ?? entity.components.material!.id, { material });
    const lifecycle = new ResourceLifecycleManager(adapter.disposeStats);

    editor.execute(new DeleteEntityCommand(editor, [entity.id]));
    adapter.sync();
    lifecycle.recordRenderTargetDispose();

    expect(adapter.disposeStats.disposedGeometries).toBeGreaterThan(0);
    expect(adapter.disposeStats.disposedMaterials).toBeGreaterThan(0);
    expect(lifecycle.snapshot().renderTargets).toBe(1);
  });

  it('reports final performance metrics and exposes LOD and instance registration interfaces', () => {
    const editor = new Editor();
    const entity = createCubeEntity('Perf');
    editor.execute(new CreateEntityCommand(editor, entity));
    const adapter = new ThreeSceneAdapter(editor);
    adapter.sync();
    const monitor = new PerformanceMonitor(editor, adapter);
    const lod = new LODManager();
    const instances = new InstanceManager();

    lod.register(entity.id, [{ distance: 10, entityId: entity.id }]);
    instances.register('box_batch', entity.components.geometry!.id, entity.components.material!.id, 20);

    const metrics = monitor.snapshot();
    expect(metrics.entityCount).toBe(1);
    expect(metrics.fps).toBeGreaterThan(0);
    expect(metrics.drawCalls).toBeGreaterThan(0);
    expect(metrics.gpuResourceCount).toBeGreaterThan(0);
    expect(lod.getLevels(entity.id)).toHaveLength(1);
    expect(instances.get('box_batch')?.count).toBe(20);
    expect(createDefaultPhysicsMaterial().friction).toBeGreaterThan(0);
  });
});

