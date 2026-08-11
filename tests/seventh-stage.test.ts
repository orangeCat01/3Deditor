import { describe, expect, it } from 'vitest';
import { Mesh, ShaderMaterial } from 'three';
import { Editor } from '../src/editor/Editor';
import { CreateEntityCommand } from '../src/editor/commands/CreateEntityCommand';
import { SetPostProcessPassCommand } from '../src/editor/commands/SetPostProcessPassCommand';
import { SetShaderCommand } from '../src/editor/commands/SetShaderCommand';
import { createCubeEntity } from '../src/editor/factories/entityFactories';
import { RuntimeClock } from '../src/editor/runtime/RuntimeClock';
import { RuntimeLoop } from '../src/editor/runtime/RuntimeLoop';
import { RuntimeModeManager } from '../src/editor/runtime/RuntimeModeManager';
import { RuntimeExporter } from '../src/editor/runtime/export/RuntimeExporter';
import { SceneSerializer } from '../src/editor/serializer/SceneSerializer';
import { SceneDeserializer } from '../src/editor/serializer/SceneDeserializer';
import { ShaderCompiler } from '../src/editor/shader/ShaderCompiler';
import type { ShaderComponent } from '../src/editor/shader/ShaderComponent';
import { ShaderManager } from '../src/editor/shader/ShaderManager';
import { UniformManager } from '../src/editor/shader/UniformManager';
import { createBasicColorShaderAsset, createTimeWaveShaderAsset } from '../src/editor/shader/ShaderTemplates';
import { PassRegistry } from '../src/editor/postprocess/PassRegistry';
import { PostProcessingManager } from '../src/editor/postprocess/PostProcessingManager';
import { ThreeSceneAdapter } from '../src/engine/three/ThreeSceneAdapter';

function createShaderComponent(shaderAssetId: string): ShaderComponent {
  return {
    type: 'shader',
    shaderAssetId,
    vertexShader: '',
    fragmentShader: '',
    uniforms: { uColor: { type: 'color', value: '#44ccff' }, uTime: { type: 'number', value: 0 } },
    defines: { USE_COLOR: true },
    enabled: true
  };
}

describe('seventh stage shader and post processing', () => {
  it('registers shader assets and creates shader components through command history', () => {
    const editor = new Editor();
    const shader = new ShaderManager(editor.assets).register(createBasicColorShaderAsset());
    const entity = createCubeEntity('Shader Cube');
    editor.execute(new CreateEntityCommand(editor, entity));

    editor.execute(new SetShaderCommand(editor, entity.id, createShaderComponent(shader.id)));
    expect(editor.assets.get(shader.id)?.type).toBe('Shader');
    expect(editor.assets.getReferences(shader.id)).toContain(entity.id);
    expect(editor.entities.get(entity.id)?.components.shader?.shaderAssetId).toBe(shader.id);

    editor.undo();
    expect(editor.entities.get(entity.id)?.components.shader).toBeUndefined();
    expect(editor.assets.getReferences(shader.id)).not.toContain(entity.id);
  });

  it('creates and reuses ShaderMaterial from Entity ShaderComponent and ShaderAsset', () => {
    const editor = new Editor();
    const shader = new ShaderManager(editor.assets).register(createTimeWaveShaderAsset());
    const entity = createCubeEntity('Runtime Shader');
    entity.components.shader = createShaderComponent(shader.id);
    editor.execute(new CreateEntityCommand(editor, entity));
    const adapter = new ThreeSceneAdapter(editor);

    adapter.sync();
    const object = adapter.getObject(entity.id) as Mesh;
    const material = object.material;
    expect(material).toBeInstanceOf(ShaderMaterial);

    adapter.sync();
    expect(object.material).toBe(material);
  });

  it('updates runtime uniforms from clock without storing them on editor state', () => {
    const editor = new Editor();
    const shader = new ShaderManager(editor.assets).register(createTimeWaveShaderAsset());
    const entity = createCubeEntity('Uniform Shader');
    entity.components.shader = createShaderComponent(shader.id);
    editor.execute(new CreateEntityCommand(editor, entity));
    const adapter = new ThreeSceneAdapter(editor);
    const clock = new RuntimeClock();
    const uniforms = new UniformManager(editor, adapter);

    adapter.sync();
    clock.play();
    clock.update(750);
    uniforms.update(clock, { width: 1280, height: 720 });

    const material = (adapter.getObject(entity.id) as Mesh).material as ShaderMaterial;
    expect(material.uniforms.uTime.value).toBeCloseTo(0.75);
    expect(material.uniforms.uDeltaTime.value).toBeCloseTo(0.75);
    expect(material.uniforms.uResolution.value.x).toBe(1280);
    expect(editor.entities.get(entity.id)?.components.shader?.uniforms.uTime.value).toBe(0);
  });

  it('isolates shader compile errors and keeps previous material alive', () => {
    const editor = new Editor();
    const shader = new ShaderManager(editor.assets).register(createBasicColorShaderAsset());
    const entity = createCubeEntity('Broken Shader');
    entity.components.shader = createShaderComponent(shader.id);
    editor.execute(new CreateEntityCommand(editor, entity));
    const adapter = new ThreeSceneAdapter(editor);
    adapter.sync();
    const object = adapter.getObject(entity.id) as Mesh;
    const previous = object.material;

    editor.execute(new SetShaderCommand(editor, entity.id, { ...createShaderComponent(shader.id), fragmentShader: 'void main() { error_token }' }));
    adapter.sync();

    expect(new ShaderCompiler().compile('void main() {}', 'void main() { error_token }').success).toBe(false);
    expect(object.material).toBe(previous);
    expect(editor.entities.get(entity.id)?.components.shader?.compileStatus?.success).toBe(false);
  });

  it('serializes and deserializes shader component and shader asset data only', () => {
    const editor = new Editor();
    const shader = new ShaderManager(editor.assets).register(createBasicColorShaderAsset());
    const entity = createCubeEntity('Serializable Shader');
    entity.components.shader = createShaderComponent(shader.id);
    editor.execute(new CreateEntityCommand(editor, entity));

    const json = new RuntimeExporter().export(editor);
    expect(json.entities[entity.id].components.shader.shaderAssetId).toBe(shader.id);
    expect(json.assets[shader.id].metadata.vertexSource).toContain('void main');
    expect(JSON.stringify(json)).not.toContain('ShaderMaterial');

    const restored = new SceneDeserializer().deserialize(new SceneSerializer().serialize(editor));
    expect(restored.entities[0].components.shader?.uniforms.uColor.value).toBe('#44ccff');
    expect(restored.assets[0].type).toBe('Shader');
  });

  it('registers and updates post process passes through command history', () => {
    const editor = new Editor();
    const registry = new PassRegistry();
    const manager = new PostProcessingManager(registry);
    manager.addPass(registry.create('Bloom'));
    manager.addPass(registry.create('ToneMapping'));
    manager.addPass(registry.create('FXAA'));

    editor.execute(new SetPostProcessPassCommand(manager, 'Bloom', { enabled: true, parameters: { strength: 1.4, radius: 0.3 } }));
    expect(manager.activePassCount).toBe(3);
    expect(manager.getPass('Bloom')?.parameters.strength).toBe(1.4);

    editor.undo();
    expect(manager.getPass('Bloom')?.parameters.strength).toBe(0.8);
  });

  it('runtime loop updates shader uniforms before post processing and render', () => {
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
});

