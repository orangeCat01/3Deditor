import type { Object3D } from 'three';

export class HoverHighlightManager {
  private currentObject: Object3D | null = null;
  private currentHoverId: string | null = null;

  get hoverId(): string | null {
    return this.currentHoverId;
  }

  setHover(entityId: string | null, object: Object3D | null): void {
    if (this.currentObject) this.currentObject.userData.hoverHighlighted = false;
    this.currentHoverId = entityId;
    this.currentObject = object;
    if (this.currentObject) this.currentObject.userData.hoverHighlighted = true;
  }

  clear(): void {
    this.setHover(null, null);
  }
}
