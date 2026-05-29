/**
 * @module loader
 * @description Frontend utility / library module.
 */

import type { Language, TranslationModule, TranslationModuleName, AllTranslations } from './types';
import { DEFAULT_LANGUAGE } from './constants';

// ─── UZ tarjimalari ───────────────────────────────────────────────────────────
import uzCommon        from '../../locales/uz/common.json';
import uzAuth          from '../../locales/uz/auth.json';
import uzDashboard     from '../../locales/uz/dashboard.json';
import uzHR            from '../../locales/uz/hr.json';
import uzFinance       from '../../locales/uz/finance.json';
import uzProduction    from '../../locales/uz/production.json';
import uzWarehouse     from '../../locales/uz/warehouse.json';
import uzWms           from '../../locales/uz/wms.json';
import uzCRM           from '../../locales/uz/crm.json';
import uzLMS           from '../../locales/uz/lms.json';
import uzSettings      from '../../locales/uz/settings.json';
import uzErrors        from '../../locales/uz/errors.json';
import uzValidation    from '../../locales/uz/validation.json';
import uzMarketing     from '../../locales/uz/marketing.json';
import uzNavigation    from '../../locales/uz/navigation.json';
import uzPublic        from '../../locales/uz/public.json';
import uzSd            from '../../locales/uz/sd.json';
import uzMes           from '../../locales/uz/mes.json';
import uzKanban        from '../../locales/uz/kanban.json';
import uzDirector      from '../../locales/uz/director.json';
import uzSecurity      from '../../locales/uz/security.json';
import uzNotifications from '../../locales/uz/notifications.json';
import uzIot           from '../../locales/uz/iot.json';
import uzAdmin         from '../../locales/uz/admin.json';
import uzMro           from '../../locales/uz/mro.json';
import uzDesign        from '../../locales/uz/design.json';
import uzLogistics     from '../../locales/uz/logistics.json';
import uzPos           from '../../locales/uz/pos.json';
import uzAi            from '../../locales/uz/ai.json';
import uzAisha         from '../../locales/uz/aisha.json';
import uzCoordination  from '../../locales/uz/coordination.json';
import uzPrint         from '../../locales/uz/print.json';
import uzBarcode       from '../../locales/uz/barcode.json';
import uzCalc          from '../../locales/uz/calc.json';
import uzContact       from '../../locales/uz/contact.json';
import uzFooter        from '../../locales/uz/footer.json';
import uzGlPosting     from '../../locales/uz/glPosting.json';
import uzInventory     from '../../locales/uz/inventory.json';
import uzLedger        from '../../locales/uz/ledger.json';
import uzLowstock      from '../../locales/uz/lowstock.json';
import uzMovements     from '../../locales/uz/movements.json';
import uzMyInventory   from '../../locales/uz/myInventory.json';
import uzNav           from '../../locales/uz/nav.json';
import uzOffline       from '../../locales/uz/offline.json';
import uzQcreview      from '../../locales/uz/qcreview.json';
import uzQuarantine    from '../../locales/uz/quarantine.json';
import uzReports       from '../../locales/uz/reports.json';
import uzRequests      from '../../locales/uz/requests.json';
import uzVariance      from '../../locales/uz/variance.json';

// ─── UZ-CYR (Kirill) tarjimalari ──────────────────────────────────────────────
import cyrCommon        from '../../locales/uz-cyr/common.json';
import cyrAuth          from '../../locales/uz-cyr/auth.json';
import cyrDashboard     from '../../locales/uz-cyr/dashboard.json';
import cyrHR            from '../../locales/uz-cyr/hr.json';
import cyrFinance       from '../../locales/uz-cyr/finance.json';
import cyrProduction    from '../../locales/uz-cyr/production.json';
import cyrWarehouse     from '../../locales/uz-cyr/warehouse.json';
import cyrWms           from '../../locales/uz-cyr/wms.json';
import cyrCRM           from '../../locales/uz-cyr/crm.json';
import cyrLMS           from '../../locales/uz-cyr/lms.json';
import cyrSettings      from '../../locales/uz-cyr/settings.json';
import cyrErrors        from '../../locales/uz-cyr/errors.json';
import cyrValidation    from '../../locales/uz-cyr/validation.json';
import cyrMarketing     from '../../locales/uz-cyr/marketing.json';
import cyrNavigation    from '../../locales/uz-cyr/navigation.json';
import cyrPublic        from '../../locales/uz-cyr/public.json';
import cyrSd            from '../../locales/uz-cyr/sd.json';
import cyrMes           from '../../locales/uz-cyr/mes.json';
import cyrKanban        from '../../locales/uz-cyr/kanban.json';
import cyrDirector      from '../../locales/uz-cyr/director.json';
import cyrSecurity      from '../../locales/uz-cyr/security.json';
import cyrNotifications from '../../locales/uz-cyr/notifications.json';
import cyrIot           from '../../locales/uz-cyr/iot.json';
import cyrAdmin         from '../../locales/uz-cyr/admin.json';
import cyrMro           from '../../locales/uz-cyr/mro.json';
import cyrDesign        from '../../locales/uz-cyr/design.json';
import cyrLogistics     from '../../locales/uz-cyr/logistics.json';
import cyrPos           from '../../locales/uz-cyr/pos.json';
import cyrAi            from '../../locales/uz-cyr/ai.json';
import cyrAisha         from '../../locales/uz-cyr/aisha.json';
import cyrCoordination  from '../../locales/uz-cyr/coordination.json';
import cyrPrint         from '../../locales/uz-cyr/print.json';
import cyrBarcode       from '../../locales/uz-cyr/barcode.json';
import cyrCalc          from '../../locales/uz-cyr/calc.json';
import cyrContact       from '../../locales/uz-cyr/contact.json';
import cyrFooter        from '../../locales/uz-cyr/footer.json';
import cyrGlPosting     from '../../locales/uz-cyr/glPosting.json';
import cyrInventory     from '../../locales/uz-cyr/inventory.json';
import cyrLedger        from '../../locales/uz-cyr/ledger.json';
import cyrLowstock      from '../../locales/uz-cyr/lowstock.json';
import cyrMovements     from '../../locales/uz-cyr/movements.json';
import cyrMyInventory   from '../../locales/uz-cyr/myInventory.json';
import cyrNav           from '../../locales/uz-cyr/nav.json';
import cyrOffline       from '../../locales/uz-cyr/offline.json';
import cyrQcreview      from '../../locales/uz-cyr/qcreview.json';
import cyrQuarantine    from '../../locales/uz-cyr/quarantine.json';
import cyrReports       from '../../locales/uz-cyr/reports.json';
import cyrRequests      from '../../locales/uz-cyr/requests.json';
import cyrVariance      from '../../locales/uz-cyr/variance.json';

// ─── RU tarjimalari ───────────────────────────────────────────────────────────
import ruCommon        from '../../locales/ru/common.json';
import ruAuth          from '../../locales/ru/auth.json';
import ruDashboard     from '../../locales/ru/dashboard.json';
import ruHR            from '../../locales/ru/hr.json';
import ruFinance       from '../../locales/ru/finance.json';
import ruProduction    from '../../locales/ru/production.json';
import ruWarehouse     from '../../locales/ru/warehouse.json';
import ruWms           from '../../locales/ru/wms.json';
import ruCRM           from '../../locales/ru/crm.json';
import ruLMS           from '../../locales/ru/lms.json';
import ruSettings      from '../../locales/ru/settings.json';
import ruErrors        from '../../locales/ru/errors.json';
import ruValidation    from '../../locales/ru/validation.json';
import ruMarketing     from '../../locales/ru/marketing.json';
import ruNavigation    from '../../locales/ru/navigation.json';
import ruPublic        from '../../locales/ru/public.json';
import ruSd            from '../../locales/ru/sd.json';
import ruMes           from '../../locales/ru/mes.json';
import ruKanban        from '../../locales/ru/kanban.json';
import ruDirector      from '../../locales/ru/director.json';
import ruSecurity      from '../../locales/ru/security.json';
import ruNotifications from '../../locales/ru/notifications.json';
import ruIot           from '../../locales/ru/iot.json';
import ruAdmin         from '../../locales/ru/admin.json';
import ruMro           from '../../locales/ru/mro.json';
import ruDesign        from '../../locales/ru/design.json';
import ruLogistics     from '../../locales/ru/logistics.json';
import ruPos           from '../../locales/ru/pos.json';
import ruAi            from '../../locales/ru/ai.json';
import ruAisha         from '../../locales/ru/aisha.json';
import ruCoordination  from '../../locales/ru/coordination.json';
import ruPrint         from '../../locales/ru/print.json';
import ruBarcode       from '../../locales/ru/barcode.json';
import ruCalc          from '../../locales/ru/calc.json';
import ruContact       from '../../locales/ru/contact.json';
import ruFooter        from '../../locales/ru/footer.json';
import ruGlPosting     from '../../locales/ru/glPosting.json';
import ruInventory     from '../../locales/ru/inventory.json';
import ruLedger        from '../../locales/ru/ledger.json';
import ruLowstock      from '../../locales/ru/lowstock.json';
import ruMovements     from '../../locales/ru/movements.json';
import ruMyInventory   from '../../locales/ru/myInventory.json';
import ruNav           from '../../locales/ru/nav.json';
import ruOffline       from '../../locales/ru/offline.json';
import ruQcreview      from '../../locales/ru/qcreview.json';
import ruQuarantine    from '../../locales/ru/quarantine.json';
import ruReports       from '../../locales/ru/reports.json';
import ruRequests      from '../../locales/ru/requests.json';
import ruVariance      from '../../locales/ru/variance.json';

// ─── To'liq tarjima ob'ekti ───────────────────────────────────────────────────
export const ALL_TRANSLATIONS: AllTranslations = {
  uz: {
    common:        uzCommon        as unknown as TranslationModule,
    auth:          uzAuth          as unknown as TranslationModule,
    dashboard:     uzDashboard     as unknown as TranslationModule,
    hr:            uzHR            as unknown as TranslationModule,
    finance:       uzFinance       as unknown as TranslationModule,
    production:    uzProduction    as unknown as TranslationModule,
    warehouse:     uzWarehouse     as unknown as TranslationModule,
    wms:           uzWms           as unknown as TranslationModule,
    crm:           uzCRM           as unknown as TranslationModule,
    lms:           uzLMS           as unknown as TranslationModule,
    settings:      uzSettings      as unknown as TranslationModule,
    errors:        uzErrors        as unknown as TranslationModule,
    validation:    uzValidation    as unknown as TranslationModule,
    marketing:     uzMarketing     as unknown as TranslationModule,
    navigation:    uzNavigation    as unknown as TranslationModule,
    public:        uzPublic        as unknown as TranslationModule,
    sd:            uzSd            as unknown as TranslationModule,
    mes:           uzMes           as unknown as TranslationModule,
    kanban:        uzKanban        as unknown as TranslationModule,
    director:      uzDirector      as unknown as TranslationModule,
    security:      uzSecurity      as unknown as TranslationModule,
    notifications: uzNotifications as unknown as TranslationModule,
    iot:           uzIot           as unknown as TranslationModule,
    admin:         uzAdmin         as unknown as TranslationModule,
    mro:           uzMro           as unknown as TranslationModule,
    design:        uzDesign        as unknown as TranslationModule,
    logistics:     uzLogistics     as unknown as TranslationModule,
    pos:           uzPos           as unknown as TranslationModule,
    ai:            uzAi            as unknown as TranslationModule,
    aisha:         uzAisha         as unknown as TranslationModule,
    coordination:  uzCoordination  as unknown as TranslationModule,
    print:         uzPrint         as unknown as TranslationModule,
    barcode:       uzBarcode       as unknown as TranslationModule,
    calc:          uzCalc          as unknown as TranslationModule,
    contact:       uzContact       as unknown as TranslationModule,
    footer:        uzFooter        as unknown as TranslationModule,
    glPosting:     uzGlPosting     as unknown as TranslationModule,
    inventory:     uzInventory     as unknown as TranslationModule,
    ledger:        uzLedger        as unknown as TranslationModule,
    lowstock:      uzLowstock      as unknown as TranslationModule,
    movements:     uzMovements     as unknown as TranslationModule,
    myInventory:   uzMyInventory   as unknown as TranslationModule,
    nav:           uzNav           as unknown as TranslationModule,
    offline:       uzOffline       as unknown as TranslationModule,
    qcreview:      uzQcreview      as unknown as TranslationModule,
    qc:            uzQcreview      as unknown as TranslationModule,
    quarantine:    uzQuarantine    as unknown as TranslationModule,
    reports:       uzReports       as unknown as TranslationModule,
    requests:      uzRequests      as unknown as TranslationModule,
    variance:      uzVariance      as unknown as TranslationModule,
  },
  'uz-cyr': {
    common:        cyrCommon        as unknown as TranslationModule,
    auth:          cyrAuth          as unknown as TranslationModule,
    dashboard:     cyrDashboard     as unknown as TranslationModule,
    hr:            cyrHR            as unknown as TranslationModule,
    finance:       cyrFinance       as unknown as TranslationModule,
    production:    cyrProduction    as unknown as TranslationModule,
    warehouse:     cyrWarehouse     as unknown as TranslationModule,
    wms:           cyrWms           as unknown as TranslationModule,
    crm:           cyrCRM           as unknown as TranslationModule,
    lms:           cyrLMS           as unknown as TranslationModule,
    settings:      cyrSettings      as unknown as TranslationModule,
    errors:        cyrErrors        as unknown as TranslationModule,
    validation:    cyrValidation    as unknown as TranslationModule,
    marketing:     cyrMarketing     as unknown as TranslationModule,
    navigation:    cyrNavigation    as unknown as TranslationModule,
    public:        cyrPublic        as unknown as TranslationModule,
    sd:            cyrSd            as unknown as TranslationModule,
    mes:           cyrMes           as unknown as TranslationModule,
    kanban:        cyrKanban        as unknown as TranslationModule,
    director:      cyrDirector      as unknown as TranslationModule,
    security:      cyrSecurity      as unknown as TranslationModule,
    notifications: cyrNotifications as unknown as TranslationModule,
    iot:           cyrIot           as unknown as TranslationModule,
    admin:         cyrAdmin         as unknown as TranslationModule,
    mro:           cyrMro           as unknown as TranslationModule,
    design:        cyrDesign        as unknown as TranslationModule,
    logistics:     cyrLogistics     as unknown as TranslationModule,
    pos:           cyrPos           as unknown as TranslationModule,
    ai:            cyrAi            as unknown as TranslationModule,
    aisha:         cyrAisha         as unknown as TranslationModule,
    coordination:  cyrCoordination  as unknown as TranslationModule,
    print:         cyrPrint         as unknown as TranslationModule,
    barcode:       cyrBarcode       as unknown as TranslationModule,
    calc:          cyrCalc          as unknown as TranslationModule,
    contact:       cyrContact       as unknown as TranslationModule,
    footer:        cyrFooter        as unknown as TranslationModule,
    glPosting:     cyrGlPosting     as unknown as TranslationModule,
    inventory:     cyrInventory     as unknown as TranslationModule,
    ledger:        cyrLedger        as unknown as TranslationModule,
    lowstock:      cyrLowstock      as unknown as TranslationModule,
    movements:     cyrMovements     as unknown as TranslationModule,
    myInventory:   cyrMyInventory   as unknown as TranslationModule,
    nav:           cyrNav           as unknown as TranslationModule,
    offline:       cyrOffline       as unknown as TranslationModule,
    qcreview:      cyrQcreview      as unknown as TranslationModule,
    qc:            cyrQcreview      as unknown as TranslationModule,
    quarantine:    cyrQuarantine    as unknown as TranslationModule,
    reports:       cyrReports       as unknown as TranslationModule,
    requests:      cyrRequests      as unknown as TranslationModule,
    variance:      cyrVariance      as unknown as TranslationModule,
  },
  ru: {
    common:        ruCommon        as unknown as TranslationModule,
    auth:          ruAuth          as unknown as TranslationModule,
    dashboard:     ruDashboard     as unknown as TranslationModule,
    hr:            ruHR            as unknown as TranslationModule,
    finance:       ruFinance       as unknown as TranslationModule,
    production:    ruProduction    as unknown as TranslationModule,
    warehouse:     ruWarehouse     as unknown as TranslationModule,
    wms:           ruWms           as unknown as TranslationModule,
    crm:           ruCRM           as unknown as TranslationModule,
    lms:           ruLMS           as unknown as TranslationModule,
    settings:      ruSettings      as unknown as TranslationModule,
    errors:        ruErrors        as unknown as TranslationModule,
    validation:    ruValidation    as unknown as TranslationModule,
    marketing:     ruMarketing     as unknown as TranslationModule,
    navigation:    ruNavigation    as unknown as TranslationModule,
    public:        ruPublic        as unknown as TranslationModule,
    sd:            ruSd            as unknown as TranslationModule,
    mes:           ruMes           as unknown as TranslationModule,
    kanban:        ruKanban        as unknown as TranslationModule,
    director:      ruDirector      as unknown as TranslationModule,
    security:      ruSecurity      as unknown as TranslationModule,
    notifications: ruNotifications as unknown as TranslationModule,
    iot:           ruIot           as unknown as TranslationModule,
    admin:         ruAdmin         as unknown as TranslationModule,
    mro:           ruMro           as unknown as TranslationModule,
    design:        ruDesign        as unknown as TranslationModule,
    logistics:     ruLogistics     as unknown as TranslationModule,
    pos:           ruPos           as unknown as TranslationModule,
    ai:            ruAi            as unknown as TranslationModule,
    aisha:         ruAisha         as unknown as TranslationModule,
    coordination:  ruCoordination  as unknown as TranslationModule,
    print:         ruPrint         as unknown as TranslationModule,
    barcode:       ruBarcode       as unknown as TranslationModule,
    calc:          ruCalc          as unknown as TranslationModule,
    contact:       ruContact       as unknown as TranslationModule,
    footer:        ruFooter        as unknown as TranslationModule,
    glPosting:     ruGlPosting     as unknown as TranslationModule,
    inventory:     ruInventory     as unknown as TranslationModule,
    ledger:        ruLedger        as unknown as TranslationModule,
    lowstock:      ruLowstock      as unknown as TranslationModule,
    movements:     ruMovements     as unknown as TranslationModule,
    myInventory:   ruMyInventory   as unknown as TranslationModule,
    nav:           ruNav           as unknown as TranslationModule,
    offline:       ruOffline       as unknown as TranslationModule,
    qcreview:      ruQcreview      as unknown as TranslationModule,
    qc:            ruQcreview      as unknown as TranslationModule,
    quarantine:    ruQuarantine    as unknown as TranslationModule,
    reports:       ruReports       as unknown as TranslationModule,
    requests:      ruRequests      as unknown as TranslationModule,
    variance:      ruVariance      as unknown as TranslationModule,
  },
};

// ─── In-memory cache ─────────────────────────────────────────────────────────
type Cache = Partial<Record<Language, Partial<Record<TranslationModuleName, TranslationModule>>>>;
// In-memory translation cache. Keyed by lang → module → flat key dictionary.
// First access for a (lang, module) pair loads from ALL_TRANSLATIONS; subsequent
// reads return the cached reference. There's no eviction — translation data is
// tiny (~5k keys total) and never changes at runtime.
const _cache: Cache = {};

/**
 * @description Lazy-load a translation module from the static bundle.
 *   Falls back to `{}` if the module name is unknown — keeps `t('key')`
 *   returning the literal key instead of crashing.
 *
 *   WHY caching despite the static bundle:
 *     ALL_TRANSLATIONS is loaded once at module init, but JS engines
 *     re-resolve object key lookups on every access. The cache locks the
 *     module reference once so hot-path translations are a single map
 *     lookup, not a chain through optional chaining.
 */
function getCachedModule(lang: Language, module: TranslationModuleName): TranslationModule {
  if (!_cache[lang]) _cache[lang] = {};
  // After the guard above, _cache[lang] is guaranteed to be defined.
  // Use a local reference to avoid non-null assertion operators.
  const langCache = _cache[lang] as Record<TranslationModuleName, TranslationModule>;
  if (!langCache[module]) {
    langCache[module] = ALL_TRANSLATIONS[lang]?.[module] ?? {};
  }
  return langCache[module];
}

/**
 * @description Resolve a key to its translated string. Three-level fallback:
 *     1. moduleData[key]           current language
 *     2. fallback parameter         caller-provided default
 *     3. defaultModule[key]         UZ (DEFAULT_LANGUAGE) version
 *     4. literal `key`              last resort — shown verbatim to the user
 *
 *   In development, missing keys emit a `[i18n] Missing key` console
 *   warning so the developer notices and adds the translation. In
 *   production we silently fall through to the literal key — better than
 *   crashing a page over a missing string.
 *
 *   The literal-key fallback is why our key naming convention matters:
 *   keys should be human-readable enough that "shown verbatim" is at
 *   least understandable (`t('common.save')` → "common.save" is OK as
 *   a degraded fallback; `t('x42')` would be cryptic).
 */
export function getTranslation(
  lang: Language,
  module: TranslationModuleName,
  key: string,
  fallback?: string,
): string {
  const moduleData = getCachedModule(lang ?? DEFAULT_LANGUAGE, module);
  const value = moduleData[key];

  if (value !== undefined) return value;

  const fallbackValue =
    fallback ??
    getCachedModule(DEFAULT_LANGUAGE, module)[key] ??
    key;

  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[i18n] Missing key '${key}' in ${lang}/${module} — falling back to: "${fallbackValue}"`,
    );
  }

  return fallbackValue;
}

/**
 * {placeholder} shablonlarini qiymatlar bilan almashtiradi.
 * Misol: interpolate("Salom, {name}!", { name: "Ali" }) → "Salom, Ali!"
 */
export function interpolate(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`,
  );
}

/**
 * Development rejimida barcha tillar uchun kalit to'liqligini tekshiradi.
 */
export function validateTranslationCompleteness(): void {
  if (process.env.NODE_ENV !== 'development') return;

  const base = ALL_TRANSLATIONS[DEFAULT_LANGUAGE];

  for (const [langKey, langData] of Object.entries(ALL_TRANSLATIONS) as [Language, typeof base][]) {
    if (langKey === DEFAULT_LANGUAGE) continue;

    for (const [modKey, modData] of Object.entries(base) as [TranslationModuleName, TranslationModule][]) {
      const targetMod = langData[modKey] ?? {};
      const missing = Object.keys(modData).filter((k) => !(k in targetMod));
      if (missing.length > 0) {
        console.warn(
          `[i18n] ${langKey}/${modKey} da ${missing.length} kalit yetishmayapti:`,
          missing,
        );
      }
    }
  }
}
