import type { EntityId } from '../types';

export interface LODLevel {
  distance: number;
  entityId: EntityId;
}

export class LODManager {
  private readonly levels = new Map<EntityId, LODLevel[]>();

  register(entityId: EntityId, levels: LODLevel[]): void {
    this.levels.set(entityId, levels.map((level) => ({ ...level })));
  }

  getLevels(entityId: EntityId): LODLevel[] {
    return this.levels.get(entityId)?.map((level) => ({ ...level })) ?? [];
  }
}
