import { Vector3 } from 'three';
import type { VertexSnapCandidate, VertexSnapper } from './VertexSnapper';

export interface VertexSnapPreviewState {
  entityId: string;
  snapPoint: Vector3;
  lineStart: Vector3;
  lineEnd: Vector3;
}

export class VertexSnapPreview {
  private state: VertexSnapPreviewState | null = null;

  constructor(private readonly snapper: VertexSnapper) {}

  get current(): VertexSnapPreviewState | null {
    return this.state;
  }

  update(candidates: VertexSnapCandidate[], previewPosition: Vector3, maxDistance: number): VertexSnapPreviewState | null {
    const snap = this.snapper.findNearestVertex(candidates, previewPosition, maxDistance);
    this.state = snap
      ? { entityId: snap.entityId, snapPoint: snap.worldPosition, lineStart: previewPosition.clone(), lineEnd: snap.worldPosition.clone() }
      : null;
    return this.state;
  }

  clear(): void {
    this.state = null;
  }
}
