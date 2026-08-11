import { Camera, Vector3 } from 'three';

export type RectangleSelectionMode = 'contain' | 'intersect';

export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RectangleCandidate {
  entityId: string;
  center: Vector3;
  radius: number;
}

export class RectangleSelection {
  constructor(private readonly camera: Camera, private readonly viewport: { width: number; height: number }) {}

  select(candidates: RectangleCandidate[], rect: ScreenRect, mode: RectangleSelectionMode): string[] {
    const normalized = normalizeRect(rect);
    return candidates
      .filter((candidate) => {
        const center = this.project(candidate.center);
        const edge = this.project(candidate.center.clone().add(new Vector3(candidate.radius, 0, 0)));
        const radiusPx = Math.abs(edge.x - center.x);
        if (mode === 'contain') {
          return center.x - radiusPx >= normalized.x
            && center.x + radiusPx <= normalized.x + normalized.width
            && center.y - radiusPx >= normalized.y
            && center.y + radiusPx <= normalized.y + normalized.height;
        }
        return center.x + radiusPx >= normalized.x
          && center.x - radiusPx <= normalized.x + normalized.width
          && center.y + radiusPx >= normalized.y
          && center.y - radiusPx <= normalized.y + normalized.height;
      })
      .map((candidate) => candidate.entityId);
  }

  private project(point: Vector3): { x: number; y: number } {
    const projected = point.clone().project(this.camera);
    return {
      x: (projected.x * 0.5 + 0.5) * this.viewport.width,
      y: (-projected.y * 0.5 + 0.5) * this.viewport.height
    };
  }
}

function normalizeRect(rect: ScreenRect): ScreenRect {
  const x = rect.width >= 0 ? rect.x : rect.x + rect.width;
  const y = rect.height >= 0 ? rect.y : rect.y + rect.height;
  return { x, y, width: Math.abs(rect.width), height: Math.abs(rect.height) };
}
