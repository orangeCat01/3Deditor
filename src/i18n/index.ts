import { createI18n } from 'vue-i18n';
import zhCN from '../locales/zh-CN';
import enUS from '../locales/en-US';
import { LanguageManager, type AppLocale } from '../editor/settings/LanguageManager';

export const languageManager = new LanguageManager();

export const i18n = createI18n({
  legacy: false,
  locale: languageManager.load(),
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
});

export function setLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale;
  languageManager.save(locale);
}

export function toggleLocale(): void {
  setLocale(i18n.global.locale.value === 'zh-CN' ? 'en-US' : 'zh-CN');
}
