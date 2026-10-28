import { useCallback, useMemo } from 'react';
import { useStore } from '../store/AppStore';
import type { Lang, Localized } from '../store/types';
import { de, type Dict } from './de';
import { en } from './en';

export type TKey = keyof Dict;
export type TFunction = (key: TKey, vars?: Record<string, string | number>) => string;

const DICTS: Record<Lang, Dict> = { de, en };

export function translate(lang: Lang, key: TKey, vars?: Record<string, string | number>): string {
  const template = DICTS[lang][key] ?? DICTS.de[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => (name in vars ? String(vars[name]) : `{${name}}`));
}

export function useI18n() {
  const { settings } = useStore();
  const lang = settings.language;
  const t = useCallback<TFunction>((key, vars) => translate(lang, key, vars), [lang]);
  const l = useCallback((value: Localized) => value[lang] ?? value.de, [lang]);
  const locale = lang === 'de' ? 'de-DE' : 'en-GB';
  return useMemo(() => ({ t, l, lang, locale }), [t, l, lang, locale]);
}
