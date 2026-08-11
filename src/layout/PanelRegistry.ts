import type { PanelDescriptor } from './types';

export class PanelRegistry {
  private readonly panels = new Map<string, PanelDescriptor>();

  static createDefault(): PanelRegistry {
    const registry = new PanelRegistry();
    [
      { id: 'SceneGraph', titleKey: 'panel.sceneGraph', position: 'left', visible: true, size: 280 },
      { id: 'Assets', titleKey: 'panel.assets', position: 'left', visible: true, size: 280 },
      { id: 'Inspector', titleKey: 'panel.inspector', position: 'right', visible: true, size: 320 },
      { id: 'Properties', titleKey: 'panel.properties', position: 'right', visible: false, size: 320 },
      { id: 'Timeline', titleKey: 'panel.timeline', position: 'bottom', visible: true, size: 240 },
      { id: 'Animation', titleKey: 'panel.animation', position: 'bottom', visible: false, size: 240 },
      { id: 'Shader', titleKey: 'panel.shader', position: 'bottom', visible: false, size: 240 },
      { id: 'PostFX', titleKey: 'panel.postFX', position: 'bottom', visible: false, size: 240 },
      { id: 'Physics', titleKey: 'panel.physics', position: 'bottom', visible: false, size: 240 },
      { id: 'Performance', titleKey: 'panel.performance', position: 'bottom', visible: false, size: 240 },
      { id: 'Console', titleKey: 'panel.console', position: 'bottom', visible: false, size: 240 }
    ].forEach((panel) => registry.register(panel as PanelDescriptor));
    return registry;
  }

  register(panel: PanelDescriptor): void {
    this.panels.set(panel.id, { ...panel });
  }

  get(id: string): PanelDescriptor | undefined {
    const panel = this.panels.get(id);
    return panel ? { ...panel } : undefined;
  }

  get all(): PanelDescriptor[] {
    return [...this.panels.values()].map((panel) => ({ ...panel }));
  }
}
