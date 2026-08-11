import { PanelRegistry } from './PanelRegistry';
import type { DockPosition, LayoutSnapshot, PanelDescriptor, WorkspaceId } from './types';

const defaultSizes: Record<DockPosition, number> = { left: 280, right: 320, bottom: 240, center: 0 };

export class DockLayoutManager {
  private panels = new Map<string, PanelDescriptor>();
  private sizes = { ...defaultSizes };
  workspace: WorkspaceId = 'Modeling';

  constructor(registry = PanelRegistry.createDefault()) {
    registry.all.forEach((panel) => this.panels.set(panel.id, { ...panel }));
  }

  visiblePanels(position: DockPosition): PanelDescriptor[] {
    return [...this.panels.values()].filter((panel) => panel.position === position && panel.visible).map((panel) => ({ ...panel }));
  }

  allPanels(): PanelDescriptor[] {
    return [...this.panels.values()].map((panel) => ({ ...panel }));
  }

  isVisible(id: string): boolean {
    return this.panels.get(id)?.visible ?? false;
  }

  setPanelVisible(id: string, visible: boolean): void {
    const panel = this.panels.get(id);
    if (panel) this.panels.set(id, { ...panel, visible });
  }

  setOnlyVisible(ids: string[]): void {
    const visibleIds = new Set(ids);
    this.panels.forEach((panel) => {
      this.panels.set(panel.id, { ...panel, visible: visibleIds.has(panel.id) });
    });
  }

  resizePanel(position: DockPosition, size: number): void {
    const minimum = position === 'bottom' ? 140 : 220;
    const maximum = position === 'bottom' ? 420 : 520;
    this.sizes[position] = Math.min(Math.max(size, minimum), maximum);
  }

  sizeOf(position: DockPosition): number {
    return this.sizes[position];
  }

  setWorkspace(workspace: WorkspaceId): void {
    this.workspace = workspace;
  }

  snapshot(): LayoutSnapshot {
    return { workspace: this.workspace, panels: this.allPanels(), sizes: { ...this.sizes } };
  }

  restore(snapshot: LayoutSnapshot): void {
    this.workspace = snapshot.workspace;
    this.sizes = { ...defaultSizes, ...snapshot.sizes };
    snapshot.panels.forEach((panel) => {
      if (this.panels.has(panel.id)) this.panels.set(panel.id, { ...panel });
    });
  }
}
