/**
 * @module tLabel
 * @description Static-context translation helper for module-level constants.
 *
 * Components have `useTranslation('ns')`, but module-level `const` data
 * (status maps, enum labels, sidebar configs) can't call React hooks.
 * `tLabel(key, fallback)` uses the global `i18next` instance — which is
 * initialised at app boot — to translate at access time.
 *
 * Behaviour:
 *   - If the key exists in the current locale, the translation is returned.
 *   - If the key is missing, the original `fallback` (typically the Uzbek
 *     source text) is returned, so legacy callers do not crash.
 *
 * IMPORTANT — locale-switch behaviour:
 *   This helper is evaluated when the consuming module is FIRST LOADED.
 *   If a user toggles locale mid-session, the const value DOES NOT update
 *   automatically (consts are not reactive). For dynamic-locale support,
 *   migrate consumers to a `use<X>Config()` hook that re-evaluates on
 *   every render. The const path solves the most common case — startup
 *   in the user's saved locale.
 */
import i18n from 'i18next';

export function tLabel(key: string, fallback: string): string {
  try {
    if (i18n.exists(key)) {
      return i18n.t(key) as string;
    }
  } catch {
    /* i18next not yet initialised — fall through */
  }
  return fallback;
}
