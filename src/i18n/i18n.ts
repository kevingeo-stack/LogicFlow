import { uiTranslations, diagramTranslations } from './translations';
import { AppLanguage, DiagramLanguage } from '../types';

/**
 * Translates a UI text key.
 * @param key The translation key (e.g., 'nav.dashboard')
 * @param lang The target AppLanguage ('en' | 'es')
 * @returns The translated string, or a fallback if not found.
 */
export function t(key: string, lang: AppLanguage | undefined | null = 'en'): string {
  const targetLang = lang === 'es' ? 'es' : 'en';
  
  // Try target language
  const translation = (uiTranslations as any)[targetLang]?.[key];
  if (translation) return translation;

  // Fallback to English
  const fallback = (uiTranslations as any)['en']?.[key];
  if (fallback) return fallback;

  // Final fallback is the key itself
  return key;
}

/**
 * Translates a semantic Diagram token.
 * @param key The diagram translation key (e.g., 'diagram.while')
 * @param lang The target DiagramLanguage ('en' | 'es')
 * @returns The translated string, or a fallback if not found.
 */
export function td(key: string, lang: DiagramLanguage | undefined | null = 'en'): string {
  const targetLang = lang === 'es' ? 'es' : 'en';
  
  // Try target language
  const translation = (diagramTranslations as any)[targetLang]?.[key];
  if (translation) return translation;

  // Fallback to English
  const fallback = (diagramTranslations as any)['en']?.[key];
  if (fallback) return fallback;

  // Final fallback is the key itself
  return key;
}
