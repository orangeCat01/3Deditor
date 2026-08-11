import { BufferAttribute, Mesh, Vector3 } from 'three';

export interface VertexSnapCandidate {
  entityId: string;
  object: Mesh;
}

export interface VertexSnapResult {
  entityId: string;
  worldPosition: Vector3;
  offset: Vector3;
  distance: number;
}

export class VertexSnapper {
  findNearestVertex(candidates: VertexSnapCandidate[], targetWorldPosition: Vector3, maxDistance = 0.25): VertexSnapResult | null {
    let nearest: VertexSnapResult | null = null;

    candidates.forEach((candidate) => {
      const position = candidate.object.geometry.getAttribute('position');
      if (!(position instanceof BufferAttribute)) return;
      const vertex = new Vector3();
      for (let index = 0; index < position.count; index += 1) {
        vertex.fromBufferAttribute(position, index).applyMatrix4(candidate.object.matrixWorld);
        const distance = vertex.distanceTo(targetWorldPosition);
        if (distance <= maxDistance && (!nearest || distance < nearest.distance)) {
          nearest = {
            entityId: candidate.entityId,
            worldPosition: vertex.clone(),
            offset: vertex.clone().sub(targetWorldPosition),
            distance
          };
        }
      }
    });

    return nearest;
  }
}
