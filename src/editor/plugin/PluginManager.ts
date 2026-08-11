import type { Editor } from '../Editor';
import { createPluginContext } from './PluginContext';
import type { EditorPlugin } from './Plugin';
import type { PluginRegistry } from './PluginRegistry';
import type { PluginState } from './PluginLifecycle';

export class PluginManager {
  private readonly plugins = new Map<string, EditorPlugin>();
  private readonly states = new Map<string, PluginState>();

  constructor(private readonly editor: Editor, private readonly registry: PluginRegistry) {}

  install(plugin: EditorPlugin): void {
    try {
      plugin.install(createPluginContext(this.editor, this.registry));
      this.plugins.set(plugin.id, plugin);
      this.states.set(plugin.id, { id: plugin.id, state: 'installed' });
    } catch (error) {
      this.states.set(plugin.id, { id: plugin.id, state: 'error', lastError: error instanceof Error ? error.message : String(error) });
    }
  }

  enable(id: string): void {
    this.run(id, 'enable', 'enabled');
  }

  disable(id: string): void {
    this.run(id, 'disable', 'disabled');
    this.registry.remove(id);
  }

  uninstall(id: string): void {
    this.run(id, 'uninstall', 'uninstalled');
    this.plugins.delete(id);
    this.registry.remove(id);
  }

  getState(id: string): PluginState | undefined {
    return this.states.get(id);
  }

  private run(id: string, hook: 'enable' | 'disable' | 'uninstall', state: PluginState['state']): void {
    const plugin = this.plugins.get(id);
    if (!plugin) return;
    try {
      plugin[hook]?.(createPluginContext(this.editor, this.registry));
      this.states.set(id, { id, state });
    } catch (error) {
      this.states.set(id, { id, state: 'error', lastError: error instanceof Error ? error.message : String(error) });
    }
  }
}
