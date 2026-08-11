import type { RectangleSelectionMode, ScreenRect } from './RectangleSelection';

export class SelectionBoxOverlay {
  private start: { x: number; y: number } | null = null;
  private current: { x: number; y: number } | null = null;
  private selectionMode: RectangleSelectionMode = 'contain';

  get visible(): boolean {
    return Boolean(this.start && this.current);
  }

  get mode(): RectangleSelectionMode {
    return this.selectionMode;
  }

  get rect(): ScreenRect | null {
    if (!this.start || !this.current) return null;
    const x = Math.min(this.start.x, this.current.x);
    const y = Math.min(this.start.y, this.current.y);
    return {
      x,
      y,
      width: Math.abs(this.current.x - this.start.x),
      height: Math.abs(this.current.y - this.start.y)
    };
  }

  begin(point: { x: number; y: number }, mode: RectangleSelectionMode): void {
    this.start = point;
    this.current = point;
    this.selectionMode = mode;
  }

  update(point: { x: number; y: number }): void {
    if (!this.start) return;
    this.current = point;
  }

  end(): ScreenRect | null {
    const rect = this.rect;
    this.start = null;
    this.current = null;
    return rect;
  }
}
