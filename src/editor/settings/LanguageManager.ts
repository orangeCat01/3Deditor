export type AppLocale = 'zh-CN' | 'en-US';

const storageKey = 'web-3d-editor.language';

export class LanguageManager {
  current: AppLocale = 'zh-CN';

  load(): AppLocale {
    if (typeof localStorage === 'undefined') return this.current;
    const stored = localStorage.getItem(storageKey);
    this.current = stored === 'en-US' || stored === 'zh-CN' ? stored : 'zh-CN';
    return this.current;
  }

  save(locale: AppLocale): void {
    this.current = locale;
    if (typeof localStorage !== 'undefined') localStorage.setItem(storageKey, locale);
  }
}
