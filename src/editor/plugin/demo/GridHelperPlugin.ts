import type { EditorPlugin } from '../Plugin';

export function createGridHelperPlugin(): EditorPlugin {
  const register = (context: Parameters<NonNullable<EditorPlugin['install']>>[0]): void => {
    context.register.add('tools', 'grid-helper.toggle');
    context.register.add('commands', 'grid-helper.toggle');
  };

  return {
    id: 'grid-helper.toggle',
    name: 'Grid Helper Plugin',
    titleKey: 'plugin.gridHelper',
    install: register,
    enable: register,
    disable() {},
    uninstall() {}
  };
}

