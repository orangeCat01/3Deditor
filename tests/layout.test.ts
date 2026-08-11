import { describe, expect, it, beforeEach, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import zhCN from '../src/locales/zh-CN';
import enUS from '../src/locales/en-US';
import { DockLayoutManager } from '../src/layout/DockLayoutManager';
import { PanelRegistry } from '../src/layout/PanelRegistry';
import { WorkspaceManager } from '../src/layout/WorkspaceManager';
import { LayoutStore } from '../src/layout/LayoutStore';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear()
  });
});

describe('Editor UI layout shell', () => {
  it('registers the default professional editor panels', () => {
    const registry = PanelRegistry.createDefault();

    expect(registry.get('SceneGraph')?.titleKey).toBe('panel.sceneGraph');
    expect(registry.get('Assets')?.position).toBe('left');
    expect(registry.get('Inspector')?.position).toBe('right');
    expect(registry.get('Timeline')?.position).toBe('bottom');
    expect(registry.all.map((panel) => panel.id)).toEqual([
      'SceneGraph',
      'Assets',
      'Inspector',
      'Properties',
      'Timeline',
      'Animation',
      'Shader',
      'PostFX',
      'Physics',
      'Performance',
      'Console'
    ]);
  });

  it('switches workspace panel visibility without touching scene data', () => {
    const registry = PanelRegistry.createDefault();
    const layout = new DockLayoutManager(registry);
    const workspace = new WorkspaceManager(layout);

    workspace.activate('Animation');

    expect(workspace.current).toBe('Animation');
    expect(layout.isVisible('Timeline')).toBe(true);
    expect(layout.isVisible('Animation')).toBe(true);
    expect(layout.isVisible('Assets')).toBe(false);
    expect(layout.visiblePanels('bottom').map((panel) => panel.id)).toEqual(['Timeline', 'Animation']);
  });

  it('persists and restores layout UI state outside scene serializer', () => {
    const registry = PanelRegistry.createDefault();
    const layout = new DockLayoutManager(registry);
    const store = new LayoutStore('test.layout');

    layout.setPanelVisible('Console', true);
    layout.resizePanel('left', 312);
    layout.setWorkspace('Runtime');
    store.save(layout.snapshot());

    const restored = new DockLayoutManager(registry);
    restored.restore(store.load()!);

    expect(restored.workspace).toBe('Runtime');
    expect(restored.sizeOf('left')).toBe(312);
    expect(restored.isVisible('Console')).toBe(true);
  });

  it('has matching i18n keys for layout menus and panels', () => {
    const i18n = createI18n({ legacy: false, locale: 'zh-CN', fallbackLocale: 'en-US', messages: { 'zh-CN': zhCN, 'en-US': enUS } });

    expect(i18n.global.t('menu.file')).toBe('文件');
    expect(i18n.global.t('panel.sceneGraph')).toBe('场景');
    i18n.global.locale.value = 'en-US';
    expect(i18n.global.t('workspace.material')).toBe('Material');
    expect(i18n.global.t('panel.postFX')).toBe('Post FX');
  });
});
