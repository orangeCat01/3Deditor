export type PluginLifecycleState = 'installed' | 'enabled' | 'disabled' | 'uninstalled' | 'error';

export interface PluginState {
  id: string;
  state: PluginLifecycleState;
  lastError?: string;
}
