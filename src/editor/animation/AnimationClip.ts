import type { AnimationTrack } from './AnimationTrack';

export interface AnimationClip {
  id: string;
  name: string;
  duration: number;
  fps: number;
  tracks: AnimationTrack[];
  loop: boolean;
  playbackSpeed: number;
  startTime: number;
  endTime: number;
}

export type AnimationClipPatch = Partial<Omit<AnimationClip, 'id' | 'tracks'>> & { tracks?: AnimationTrack[] };
