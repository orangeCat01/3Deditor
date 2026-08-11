import type { AnimationComponent } from './AnimationComponent';

export type TweenTarget =
  | 'transform.position.x'
  | 'transform.position.y'
  | 'transform.position.z'
  | 'transform.quaternion'
  | 'transform.scale.x'
  | 'transform.scale.y'
  | 'transform.scale.z'
  | 'material.color'
  | 'material.opacity'
  | `material.${string}`
  | `shader.uniform.${string}`;

export interface TweenDefinition {
  id: string;
  target: TweenTarget;
  from: number | string;
  to: number | string;
  duration: number;
  delay: number;
  loop: boolean;
  easing: 'linear';
  autoStart: boolean;
}

export interface TweenComponent extends AnimationComponent {
  type: 'animation';
  tweens: TweenDefinition[];
}
