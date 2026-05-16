/**
 * @module tLabel
 * @description Static-context translation helper for module-level constants.
 *
 * Components have `useTranslation('ns')`, but module-level `const` data
 * (status maps, enum labels, sidebar configs) can't call React hooks.
 * `tLabel(key, fallback)` resolves the key against the project's custom
 * i18n loader at access time so the constant reflects the locale that's
 * active when the calling module is first read by the bundler / tree.
 *
 * Behaviour:
 *   - Key format is `<namespace>.<dot.path.to.leaf>` (e.g. `crm.entities.leads`).
 *   - If the key resolves, the translation is returned.
 *   - If the key is missing for the current locale OR for the default UZ
 *     fallback, the original `fallback` (typically the Uzbek source text) is
 *     returned. Legacy callsites never see a missing-translation crash.
 *
 * IMPORTANT — locale-switch behaviour:
 *   This helper is evaluated when the consuming module is FIRST LOADED.
 *   If a user toggles locale mid-session, the const value DOES NOT update
 *   automatically (consts are not reactive). For dynamic-locale support,
 *   migrate consumers to a `use<X>Config()` hook that re-evaluates on
 *   every render. The const path solves the most common case — startup
 *   in the user's saved locale.
 */
import { getTranslation } from './loader';
import { getStoredLanguage } from './utils';
import { TRANSLATION_MODULES } from './constants';

type TranslationModuleName = (typeof TRANSLATION_MODULES)[number];
const KNOWN_MODULES = new Set<string>(TRANSLATION_MODULES);

export function tLabel(key: string, fallback: string): string {
  try {
    const firstDot = key.indexOf('.');
    if (firstDot < 1) return fallback;
    const ns = key.slice(0, firstDot);
    const rest = key.slice(firstDot + 1);
    if (!KNOWN_MODULES.has(ns)) return fallback;
    const lang = getStoredLanguage();
    const value = getTranslation(lang, ns as TranslationModuleName, rest, fallback);
    return value || fallback;
  } catch {
    return fallback;
  }
}
