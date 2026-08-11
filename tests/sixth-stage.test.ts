import { describe, expect, it } from 'vitest';
import { Editor } from '../src/editor/Editor';
import { CreateEntityCommand } from '../src/editor/commands/CreateEntityCommand';
import { CreateAnimationClipCommand } from '../src/editor/commands/CreateAnimationClipCommand';
import { UpdateAnimationClipCommand } from '../src/editor/commands/UpdateAnimationClipCommand';
import { DeleteAnimationClipCommand } from '../src/editor/commands/DeleteAnimationClipCommand';
import { SetAnimationPropertyCommand } from '../src/editor/commands/SetAnimationPropertyCommand';
import { ImportSceneCommand } from '../src/editor/commands/ImportSceneCommand';
import { createCubeEntity } from '../src/editor/factories/entityFactories';
import { AnimationSystem } from '../src/editor/animation/AnimationSystem';
import type { AnimationClip } from '../src/editor/animation/AnimationClip';
import type { AnimationComponent } from '../src/editor/animation/AnimationComponent';
import type { TweenComponent } from '../src/editor/animation/TweenComponent';
import type { TimerComponent } from '../src/editor/timer/TimerComponent';
import { TimerSystem } from '../src/editor/timer/TimerSystem';
import type { TimerAction } from '../src/editor/timer/TimerAction';
import { RuntimeClock } from '../src/editor/runtime/RuntimeClock';
import { RuntimeLoop } from '../src/editor/runtime/RuntimeLoop';
import { RuntimeModeManager } from '../src/editor/runtime/RuntimeModeManager';
import { RuntimeExporter } from '../src/editor/runtime/export/RuntimeExporter';
import { SceneSerializer } from '../src/editor/serializer/SceneSerializer';

function createAnimationComponent(clip: AnimationClip): AnimationComponent {
  return {
    type: 'animation',
    clips: [clip],
    activeClipId: clip.id,
    autoplay: true,
    playing: true,
    speed: 1,
    tweens: []
  };
}

function createMoveClip(entityId: string): AnimationClip {
  return {
    id: 'clip_move',
    name: 'Move Clip',
    duration: 1000,
    fps: 30,
    loop: false,
    playbackSpeed: 1,
    startTime: 0,
    endTime: 1000,
    tracks: [
      {
        targetEntityId: entityId,
        property: 'transform.position.x',
        interpolation: 'linear',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 10 }
        ]
      }
    ]
  };
}

function createTweenComponent(): TweenComponent {
  return {
    type: 'animation',
    clips: [],
    activeClipId: null,
    autoplay: false,
    playing: false,
    speed: 1,
    tweens: [
      {
        id: 'move-y',
        target: 'transform.position.y',
        from: 0,
        to: 6,
        duration: 600,
        delay: 0,
        loop: false,
        easing: 'linear',
        autoStart: true
      }
    ]
  };
}

describe('sixth stage animation timer runtime export', () => {
  it('creates updates deletes animation clips through command history', () => {
    const editor = new Editor();
    const entity = createCubeEntity('Animated');
    editor.execute(new CreateEntityCommand(editor, entity));
    const clip = createMoveClip(entity.id);

    editor.execute(new CreateAnimationClipCommand(editor, entity.id, clip));
    expect(editor.entities.get(entity.id)?.components.animation?.clips).toHaveLength(1);

    editor.execute(new UpdateAnimationClipCommand(editor, entity.id, clip.id, { name: 'Updated', loop: true, playbackSpeed: 2 }));
    expect(editor.entities.get(entity.id)?.components.animation?.clips[0]?.name).toBe('Updated');
    expect(editor.entities.get(entity.id)?.components.animation?.clips[0]?.loop).toBe(true);

    editor.undo();
    expect(editor.entities.get(entity.id)?.components.animation?.clips[0]?.name).toBe('Move Clip');

    editor.execute(new DeleteAnimationClipCommand(editor, entity.id, clip.id));
    expect(editor.entities.get(entity.id)?.components.animation?.clips).toHaveLength(0);

    editor.undo();
    expect(editor.entities.get(entity.id)?.components.animation?.clips[0]?.id).toBe(clip.id);
  });

  it('updates animation component playback settings through command history', () => {
    const editor = new Editor();
    const entity = createCubeEntity('Playback');
    entity.components.animation = createAnimationComponent(createMoveClip(entity.id));
    editor.execute(new CreateEntityCommand(editor, entity));

    editor.execute(new SetAnimationPropertyCommand(editor, entity.id, { autoplay: false, playing: false, speed: 1.5 }));
    expect(editor.entities.get(entity.id)?.components.animation?.autoplay).toBe(false);
    expect(editor.entities.get(entity.id)?.components.animation?.speed).toBe(1.5);

    editor.undo();
    expect(editor.entities.get(entity.id)?.components.animation?.autoplay).toBe(true);
    expect(editor.entities.get(entity.id)?.components.animation?.speed).toBe(1);
  });

  it('animation system samples position tracks from runtime clock using quaternion-safe data', () => {
    const editor = new Editor();
    const entity = createCubeEntity('Sampled');
    entity.components.animation = createAnimationComponent(createMoveClip(entity.id));
    editor.execute(new CreateEntityCommand(editor, entity));
    const clock = new RuntimeClock();
    const system = new AnimationSystem(editor);

    clock.play();
    clock.update(500);
    system.update(clock);

    expect(editor.entities.getTransform(entity.id)?.position.x).toBeCloseTo(5);
    expect(editor.entities.getTransform(entity.id)?.quaternion).toHaveProperty('w');
  });

  it('timer delays and triggers configured runtime actions', () => {
    const editor = new Editor();
    const entity = createCubeEntity('Timer Target');
    const action: TimerAction = { type: 'SetVisibility', entityId: entity.id, visible: false };
    const timer: TimerComponent = { type: 'timer', delay: 1000, repeat: false, repeatCount: 1, autoStart: true, paused: false, actions: [action] };
    entity.components.timer = timer;
    editor.execute(new CreateEntityCommand(editor, entity));
    const clock = new RuntimeClock();
    const system = new TimerSystem(editor);

    clock.play();
    clock.update(400);
    system.update(clock);
    expect(editor.entities.get(entity.id)?.editor.visible).toBe(true);

    clock.update(600);
    system.update(clock);
    expect(editor.entities.get(entity.id)?.editor.visible).toBe(false);
  });

  it('runtime loop runs animation tween timer and stop restores edit state', () => {
    const editor = new Editor();
    const entity = createCubeEntity('Runtime Full');
    entity.components.animation = createAnimationComponent(createMoveClip(entity.id));
    entity.components.animation.tweens = createTweenComponent().tweens;
    entity.components.timer = { type: 'timer', delay: 250, repeat: false, repeatCount: 1, autoStart: true, paused: false, actions: [{ type: 'SetMaterialProperty', entityId: entity.id, property: 'opacity', value: 0.25 }] };
    editor.execute(new CreateEntityCommand(editor, entity));
    const mode = new RuntimeModeManager(editor);
    const clock = new RuntimeClock();
    const loop = new RuntimeLoop(editor, clock, mode);

    mode.play();
    clock.play();
    clock.update(500);
    loop.tick();
    expect(editor.entities.getTransform(entity.id)?.position.x).toBeCloseTo(5);
    expect(editor.entities.getTransform(entity.id)?.position.y).toBeCloseTo(5);
    expect(editor.entities.get(entity.id)?.components.material?.opacity).toBe(0.25);

    mode.stop();
    expect(editor.entities.getTransform(entity.id)?.position.x).toBe(0);
    expect(editor.entities.getTransform(entity.id)?.position.y).toBe(0.5);
    expect(editor.entities.get(entity.id)?.components.material?.opacity).toBe(1);
    expect(loop.lastExecutionOrder).toEqual(['Clock Update', 'Timer Update', 'Animation Update', 'Tween Update', 'Physics Update', 'Shader Uniform Update', 'Post Processing Update', 'Render']);
  });

  it('runtime export and scene import preserve animation tween and timer data without editor state', () => {
    const editor = new Editor();
    const entity = createCubeEntity('Exported Runtime');
    entity.components.animation = createAnimationComponent(createMoveClip(entity.id));
    entity.components.animation.tweens = createTweenComponent().tweens;
    entity.components.timer = { type: 'timer', delay: 1200, repeat: true, repeatCount: 3, autoStart: false, paused: true, actions: [{ type: 'EmitEditorDefinedEvent', eventName: 'done' }] };
    editor.execute(new CreateEntityCommand(editor, entity));
    editor.select(entity.id);
    editor.setHover(entity.id);

    const runtimeJson = new RuntimeExporter().export(editor);
    expect(runtimeJson.entities[entity.id].components.animation.clips[0].tracks[0].property).toBe('transform.position.x');
    expect(runtimeJson.entities[entity.id].components.animation.tweens[0].target).toBe('transform.position.y');
    expect(runtimeJson.entities[entity.id].components.timer.delay).toBe(1200);
    expect(JSON.stringify(runtimeJson)).not.toContain('selectedIds');
    expect(JSON.stringify(runtimeJson)).not.toContain('hoverId');
    expect(JSON.stringify(runtimeJson)).not.toContain('history');

    const imported = new Editor();
    imported.execute(new ImportSceneCommand(imported, new SceneSerializer().serialize(editor)));
    expect(imported.entities.get(entity.id)?.components.animation?.clips[0]?.id).toBe('clip_move');
    expect(imported.entities.get(entity.id)?.components.animation?.tweens[0]?.id).toBe('move-y');
    expect(imported.entities.get(entity.id)?.components.timer?.repeatCount).toBe(3);
  });
});

