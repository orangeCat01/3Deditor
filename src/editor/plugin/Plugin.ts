import type { PluginContext } from './PluginContext';

export interface EditorPlugin {
  id: string;
  name: string;
  titleKey?: string;
  install(context: PluginContext): void;
  enable?(context: PluginContext): void;
  disable?(context: PluginContext): void;
  uninstall?(context: PluginContext): void;
}

