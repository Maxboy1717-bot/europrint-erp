/**
 * @module i18n
 * @description Frontend utility / library module.
 */

// ============================================================
// EUROPRINT Public Sayt — i18n Adapter
// ERP bilan bitta Context ishlatadi (sinxron)
// ============================================================

/**
 * Public sayt uchun adapter.
 * Avval alohida tizim edi ('europrint-lang' localStorage kaliti bilan).
 * Endi ERP bilan birlashtirildi — 'europrint_language' yagona kalit.
 *
 * O'tish: PublicLanguageProvider o'rniga LanguageProvider ishlatilsin.
 */

export {
  LanguageProvider as PublicLanguageProvider,
} from '../i18n/context';

export {
  useLanguageSetter,
  useCurrentLanguage,
} from '../i18n/hooks';

export type { Language } from '../i18n/types';

// ─── Public sayt uchun maxsus hook ───────────────────────────────────────────

import { useTranslation } from '../i18n/hooks';
import type { UseTranslationReturn } from '../i18n/types';

/**
 * Public sayt sahifalari uchun — 'public' modulidan tarjima.
 *
 * @example
 * const { t } = usePublicTranslation();
 * <h1>{t('hero.mainTitle')}</h1>
 */
export function usePublicTranslation(): UseTranslationReturn {
  return useTranslation('public');
}

/**
 * @deprecated usePublicTranslation() ishlatilsin.
 * Eski PublicLanguageProvider ichidagi useLanguage() bilan mos.
 */
export { useLanguage } from '../i18n/hooks';
