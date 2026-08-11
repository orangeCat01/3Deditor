export type DockPosition = 'left' | 'right' | 'bottom' | 'center';
export type WorkspaceId = 'Modeling' | 'Animation' | 'Material' | 'Runtime';

export interface PanelDescriptor {
  id: string;
  titleKey: string;
  position: DockPosition;
  visible: boolean;
  size: number;
}

export interface LayoutSnapshot {
  workspace: WorkspaceId;
  panels: PanelDescriptor[];
  sizes: Record<DockPosition, number>;
}
