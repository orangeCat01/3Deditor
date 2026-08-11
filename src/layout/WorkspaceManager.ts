import { DockLayoutManager } from './DockLayoutManager';
import type { WorkspaceId } from './types';

const workspacePanels: Record<WorkspaceId, string[]> = {
  Modeling: ['SceneGraph', 'Assets', 'Inspector', 'Timeline'],
  Animation: ['SceneGraph', 'Inspector', 'Timeline', 'Animation'],
  Material: ['SceneGraph', 'Assets', 'Inspector', 'Shader', 'PostFX'],
  Runtime: ['SceneGraph', 'Inspector', 'Timeline', 'Performance', 'Console']
};

export class WorkspaceManager {
  readonly workspaces = Object.keys(workspacePanels) as WorkspaceId[];

  constructor(private readonly layout: DockLayoutManager) {}

  get current(): WorkspaceId {
    return this.layout.workspace;
  }

  activate(workspace: WorkspaceId): void {
    this.layout.setWorkspace(workspace);
    this.layout.setOnlyVisible(workspacePanels[workspace]);
  }

  panelsFor(workspace: WorkspaceId): string[] {
    return [...workspacePanels[workspace]];
  }
}
