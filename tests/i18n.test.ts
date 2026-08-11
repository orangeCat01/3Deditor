import { describe, expect, it, beforeEach, vi } from 'vitest';
import zhCN from '../src/locales/zh-CN';
import enUS from '../src/locales/en-US';
import { i18n, setLocale, toggleLocale } from '../src/i18n';
import { LanguageManager } from '../src/editor/settings/LanguageManager';
import { InspectorSchemaRegistry } from '../src/editor/inspector/InspectorSchemaRegistry';
import { createGridHelperPlugin } from '../src/editor/plugin/demo/GridHelperPlugin';
import { SceneSerializer } from '../src/editor/serializer/SceneSerializer';
import { Editor } from '../src/editor/Editor';
import { CreateEntityCommand } from '../src/editor/commands/CreateEntityCommand';
import { createCubeEntity } from '../src/editor/factories/entityFactories';

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => flattenKeys(child, prefix ? `${prefix}.${key}` : key));
}

describe('internationalization system', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      clear: () => storage.clear(),
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key)
    });
    localStorage.clear();
    setLocale('zh-CN');
  });

  it('uses zh-CN by default and switches to en-US', () => {
    expect(i18n.global.locale.value).toBe('zh-CN');
    expect(i18n.global.t('toolbar.addCube')).toBe('添加立方体');
    toggleLocale();
    expect(i18n.global.locale.value).toBe('en-US');
    expect(i18n.global.t('toolbar.addCube')).toBe('Add Cube');
  });

  it('keeps zh-CN and en-US locale keys aligned', () => {
    expect(flattenKeys(zhCN).sort()).toEqual(flattenKeys(enUS).sort());
  });

  it('translates toolbar, inspector schema, entity type, command and plugin labels', () => {
    const schema = new InspectorSchemaRegistry().get('transform');
    expect(schema?.fields[0]?.label).toBe('transform.position');
    expect(i18n.global.t(schema!.fields[0]!.label)).toBe('位置');
    expect(i18n.global.t('entity.cube')).toBe('立方体');
    expect(i18n.global.t('command.createEntity')).toBe('创建对象');
    expect(createGridHelperPlugin().titleKey).toBe('plugin.gridHelper');
    expect(i18n.global.t(createGridHelperPlugin().titleKey!)).toBe('网格辅助插件');
  });

  it('restores language setting from localStorage', () => {
    const manager = new LanguageManager();
    manager.save('en-US');
    expect(new LanguageManager().load()).toBe('en-US');
  });

  it('does not serialize language or translated labels into scene json', () => {
    const editor = new Editor();
    const cube = createCubeEntity('cube');
    editor.execute(new CreateEntityCommand(editor, cube));
    const json = JSON.stringify(new SceneSerializer().serialize(editor));
    expect(json).not.toContain('添加立方体');
    expect(json).not.toContain('立方体');
    expect(json).not.toContain('zh-CN');
  });
});



