import type { Editor } from '../Editor';
import type { Command } from '../commands/Command';
import type { PluginRegistry } from './PluginRegistry';

export interface PluginContext {
  editor: Pick<Editor, 'execute' | 'events' | 'assets' | 'entities' | 'sceneGraph'>;
  register: PluginRegistry;
  execute(command: Command): void;
  on: Editor['events']['on'];
}

export function createPluginContext(editor: Editor, registry: PluginRegistry): PluginContext {
  return {
    editor,
    register: registry,
    execute: (command) => editor.execute(command),
    on: editor.events.on.bind(editor.events)
  };
}
