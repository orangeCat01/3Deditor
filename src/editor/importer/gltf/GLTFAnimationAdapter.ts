import { AnimationClip as ThreeAnimationClip, Object3D, QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three';
import type { AnimationClip } from '../../animation/AnimationClip';
import type { AnimationTrack, AnimationTrackProperty } from '../../animation/AnimationTrack';

export class GLTFAnimationAdapter {
  buildClips(threeClips: ThreeAnimationClip[], rootObject: Object3D, uuidMap: Map<string, string>): AnimationClip[] {
    const objectIndex = new Map<string, string>();
    rootObject.traverse((object) => {
      const entityId = uuidMap.get(object.uuid);
      if (!entityId) return;
      objectIndex.set(object.name, entityId);
      objectIndex.set(object.uuid, entityId);
    });

    return threeClips.map((clip) => ({
      id: `gltf_clip_${clip.uuid}`,
      name: clip.name || 'GLTF Animation',
      duration: clip.duration * 1000,
      fps: 30,
      loop: true,
      playbackSpeed: 1,
      startTime: 0,
      endTime: clip.duration * 1000,
      tracks: clip.tracks
        .map((track) => this.convertTrack(track, objectIndex))
        .filter((track): track is AnimationTrack => Boolean(track))
    }));
  }

  private convertTrack(track: ThreeAnimationClip['tracks'][number], objectIndex: Map<string, string>): AnimationTrack | null {
    const binding = parseTrackBinding(track.name);
    const targetEntityId = objectIndex.get(binding.nodeName);
    if (!targetEntityId) return null;
    const property = toProperty(track, binding.propertyName);
    if (!property) return null;
    const itemSize = track.getValueSize();
    const keyframes = Array.from(track.times).map((time, frameIndex) => {
      const offset = frameIndex * itemSize;
      const values = Array.from(track.values.slice(offset, offset + itemSize));
      return {
        time: time * 1000,
        value: itemSize === 1 ? values[0] : property === 'transform.quaternion' ? { x: values[0], y: values[1], z: values[2], w: values[3] } : { x: values[0], y: values[1], z: values[2] }
      };
    });
    return { targetEntityId, property, keyframes, interpolation: 'linear' };
  }
}

function parseTrackBinding(name: string): { nodeName: string; propertyName: string } {
  const index = name.lastIndexOf('.');
  if (index < 0) return { nodeName: name, propertyName: '' };
  return { nodeName: name.slice(0, index), propertyName: name.slice(index + 1) };
}

function toProperty(track: ThreeAnimationClip['tracks'][number], propertyName: string): AnimationTrackProperty | null {
  if (track instanceof VectorKeyframeTrack && propertyName === 'position') return 'transform.position.x';
  if (track instanceof QuaternionKeyframeTrack && propertyName === 'quaternion') return 'transform.quaternion';
  if (track instanceof VectorKeyframeTrack && propertyName === 'scale') return 'transform.scale.x';
  return null;
}
