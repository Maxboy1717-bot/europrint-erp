/**
 * @module genericNavI18n
 * @description Generic per-module sidebar i18n translator.
 *
 * [2026-05-21 i18n Phase 3.2A] Avval hrNavI18n.ts ga xos pattern endi
 * barcha 11 modul uchun umumlashtirildi. Har modul uchun:
 *   - separator section titlelari (UZ) → flat i18n key map
 *   - non-separator URL → flat i18n key map
 *   - group.title (modul nomi) → flat i18n key
 *
 * Barcha keylar 'navigation' namespace ostida.
 */
import type { MenuGroup, MenuItem } from './types';

export function translateOrFallback(
  t: (key: string) => string,
  key: string,
  fallback: string,
): string {
  const value = t(key);
  return value === key ? fallback : value;
}

/**
 * Bitta menyu modulini tarjima qilish.
 *
 * @param t — useTranslation('navigation').t (from caller)
 * @param group — original MenuGroup (constants-<module>.ts'dan)
 * @param sectionKeys — { "SEPARATOR_TITLE_UZ": "navKeySlug" }
 * @param urlKeys — { "url-or-empty": "navKeySlug" }
 * @param groupTitleKey — group.title uchun i18n key (mas. 'financeModuleTitle')
 */
export function translateNavModule(
  t: (key: string) => string,
  group: MenuGroup,
  sectionKeys: Record<string, string>,
  urlKeys: Record<string, string>,
  groupTitleKey?: string,
): MenuGroup {
  return {
    ...group,
    title: groupTitleKey
      ? translateOrFallback(t, groupTitleKey, group.title)
      : group.title,
    items: (Array.isArray(group.items) ? group.items : []).map((item) =>
      translateNavItem(t, item, sectionKeys, urlKeys),
    ),
  };
}

function translateNavItem(
  t: (key: string) => string,
  item: MenuItem,
  sectionKeys: Record<string, string>,
  urlKeys: Record<string, string>,
): MenuItem {
  if (item.separator) {
    const key = sectionKeys[item.title];
    if (!key) return item;
    return { ...item, title: translateOrFallback(t, key, item.title) };
  }
  const key = urlKeys[item.url];
  if (!key) return item;
  return { ...item, title: translateOrFallback(t, key, item.title) };
}
