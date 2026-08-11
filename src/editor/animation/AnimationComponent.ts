import type { Component } from '../types';
import type { AnimationClip } from './AnimationClip';
import type { TweenDefinition } from './TweenComponent';

export interface AnimationComponent extends Component {
  type: 'animation';
  clips: AnimationClip[];
  activeClipId: string | null;
  autoplay: boolean;
  playing: boolean;
  speed: number;
  tweens: TweenDefinition[];
}

export type AnimationComponentPatch = Partial<Omit<AnimationComponent, 'type' | 'clips' | 'tweens'>> & {
  clips?: AnimationClip[];
  tweens?: TweenDefinition[];
};

export function createDefaultAnimationComponent(): AnimationComponent {
  return {
    type: 'animation',
    clips: [],
    activeClipId: null,
    autoplay: false,
    playing: false,
    speed: 1,
    tweens: []
  };
}

export function cloneAnimationComponent(component: AnimationComponent): AnimationComponent {
  return structuredClone(component);
}
