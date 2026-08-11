import type { Vector3Data } from '../types';

export type AngleSnapStep = 1 | 5 | 15 | 30 | 45 | 90;

export interface SnapSettings {
  gridEnabled: boolean;
  gridSize: number;
  vertexEnabled: boolean;
  angleEnabled: boolean;
  angleStep: AngleSnapStep;
}

export class SnapManager {
  private settings: SnapSettings = {
    gridEnabled: false,
    gridSize: 1,
    vertexEnabled: false,
    angleEnabled: false,
    angleStep: 15
  };

  get current(): SnapSettings {
    return { ...this.settings };
  }

  updateSettings(settings: Partial<SnapSettings>): void {
    // Snap 设置属于编辑器偏好，不进入 Command 历史。
    this.settings = { ...this.settings, ...settings };
  }

  snapPosition(position: Vector3Data): Vector3Data {
    if (!this.settings.gridEnabled) return { ...position };
    const size = this.settings.gridSize || 1;
    return {
      x: Math.round(position.x / size) * size,
      y: Math.round(position.y / size) * size,
      z: Math.round(position.z / size) * size
    };
  }

  snapAngle(angle: number): number {
    if (!this.settings.angleEnabled) return angle;
    return Math.round(angle / this.settings.angleStep) * this.settings.angleStep;
  }
}
