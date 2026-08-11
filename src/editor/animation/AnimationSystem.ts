import type { Editor } from '../Editor';
import type { MaterialPatch } from '../components/RenderComponents';
import type { TransformPatch } from '../components/TransformComponent';
import type { RuntimeClock } from '../runtime/RuntimeClock';
import type { QuaternionData, Vector3Data } from '../types';
import type { AnimationClip } from './AnimationClip';
import type { AnimationKeyframe, AnimationKeyframeValue, AnimationTrack } from './AnimationTrack';

export class AnimationSystem {
  constructor(private readonly editor: Editor) {}

  update(clock: RuntimeClock): void {
    if (clock.paused) return;
    this.editor.entities.all.forEach((entity) => {
      const animation = entity.components.animation;
      if (!animation?.playing) return;
      const clip = animation.clips.find((clip) => clip.id === animation.activeClipId) ?? animation.clips[0];
      if (!clip) return;
      const clipTime = this.getClipTime(clip, clock.elapsedTime * animation.speed * clip.playbackSpeed);
      clip.tracks.forEach((track) => this.applyTrack(track, clipTime));
    });
  }

  private getClipTime(clip: AnimationClip, elapsed: number): number {
    const start = clip.startTime;
    const end = clip.endTime || clip.duration;
    const duration = Math.max(1, end - start);
    if (clip.loop) return start + (elapsed % duration);
    return Math.min(end, start + elapsed);
  }

  private applyTrack(track: AnimationTrack, time: number): void {
    const value = this.sample(track, time);
    const transform = this.editor.entities.getTransform(track.targetEntityId);
    if (track.property.startsWith('transform.') && transform) {
      const patch: TransformPatch = {};
      if (track.property === 'transform.quaternion' && isQuaternion(value)) patch.quaternion = value;
      if (track.property.startsWith('transform.position.') && typeof value === 'number') {
        const axis = track.property.slice('transform.position.'.length) as keyof Vector3Data;
        patch.position = { ...transform.position, [axis]: value };
      }
      if (track.property.startsWith('transform.scale.') && typeof value === 'number') {
        const axis = track.property.slice('transform.scale.'.length) as keyof Vector3Data;
        patch.scale = { ...transform.scale, [axis]: value };
      }
      this.editor.entities.setTransform(track.targetEntityId, patch);
      return;
    }
    if (track.property.startsWith('material.')) {
      const material = this.editor.entities.get(track.targetEntityId)?.components.material;
      if (!material) return;
      const key = track.property.slice('material.'.length);
      this.editor.entities.replaceMaterial(track.targetEntityId, { ...material, [key]: value } as MaterialPatch & typeof material);
    }
  }

  private sample(track: AnimationTrack, time: number): AnimationKeyframeValue {
    const frames = [...track.keyframes].sort((a, b) => a.time - b.time);
    if (frames.length === 0) return 0;
    if (time <= frames[0].time) return frames[0].value;
    const last = frames[frames.length - 1];
    if (time >= last.time) return last.value;
    const nextIndex = frames.findIndex((frame) => frame.time >= time);
    const before = frames[nextIndex - 1];
    const after = frames[nextIndex];
    if (!before || !after || track.interpolation === 'step') return before?.value ?? after.value;
    return interpolateValue(before, after, time);
  }
}

function interpolateValue(before: AnimationKeyframe, after: AnimationKeyframe, time: number): AnimationKeyframeValue {
  const ratio = (time - before.time) / Math.max(1, after.time - before.time);
  if (typeof before.value === 'number' && typeof after.value === 'number') {
    return before.value + (after.value - before.value) * ratio;
  }
  return ratio < 1 ? before.value : after.value;
}

function isQuaternion(value: AnimationKeyframeValue): value is QuaternionData {
  return typeof value === 'object' && value !== null && 'x' in value && 'y' in value && 'z' in value && 'w' in value;
}
