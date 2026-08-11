import type { Component } from '../types';
import type { TimerAction } from './TimerAction';

export interface TimerComponent extends Component {
  type: 'timer';
  delay: number;
  repeat: boolean;
  repeatCount: number;
  autoStart: boolean;
  paused: boolean;
  actions: TimerAction[];
  elapsed?: number;
  firedCount?: number;
  running?: boolean;
}

export type TimerComponentPatch = Partial<Omit<TimerComponent, 'type'>>;

export function cloneTimerComponent(timer: TimerComponent): TimerComponent {
  return structuredClone(timer);
}
