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
import uzCoordination  from '../../locales/uz/coordination.json';
import uzPrint         from '../../locales/uz/print.json';

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
import ruCoordination  from '../../locales/ru/coordination.json';
import ruPrint         from '../../locales/ru/print.json';

// ─── To'liq tarjima ob'ekti ───────────────────────────────────────────────────
export const ALL_TRANSLATIONS: AllTranslations = {
  uz: {
    common:        uzCommon        as TranslationModule,
    auth:          uzAuth          as TranslationModule,
    dashboard:     uzDashboard     as TranslationModule,
    hr:            uzHR            as TranslationModule,
    finance:       uzFinance       as TranslationModule,
    production:    uzProduction    as TranslationModule,
    warehouse:     uzWarehouse     as TranslationModule,
    wms:           uzWms           as TranslationModule,
    crm:           uzCRM           as TranslationModule,
    lms:           uzLMS           as TranslationModule,
    settings:      uzSettings      as TranslationModule,
    errors:        uzErrors        as TranslationModule,
    validation:    uzValidation    as TranslationModule,
    marketing:     uzMarketing     as TranslationModule,
    navigation:    uzNavigation    as TranslationModule,
    public:        uzPublic        as TranslationModule,
    sd:            uzSd            as TranslationModule,
    mes:           uzMes           as TranslationModule,
    kanban:        uzKanban        as TranslationModule,
    director:      uzDirector      as TranslationModule,
    security:      uzSecurity      as TranslationModule,
    notifications: uzNotifications as TranslationModule,
    iot:           uzIot           as TranslationModule,
    admin:         uzAdmin         as TranslationModule,
    mro:           uzMro           as TranslationModule,
    design:        uzDesign        as TranslationModule,
    logistics:     uzLogistics     as TranslationModule,
    pos:           uzPos           as TranslationModule,
    ai:            uzAi            as TranslationModule,
    coordination:  uzCoordination  as TranslationModule,
    print:         uzPrint         as TranslationModule,
  },
  ru: {
    common:        ruCommon        as TranslationModule,
    auth:          ruAuth          as TranslationModule,
    dashboard:     ruDashboard     as TranslationModule,
    hr:            ruHR            as TranslationModule,
    finance:       ruFinance       as TranslationModule,
    production:    ruProduction    as TranslationModule,
    warehouse:     ruWarehouse     as TranslationModule,
    wms:           ruWms           as TranslationModule,
    crm:           ruCRM           as TranslationModule,
    lms:           ruLMS           as TranslationModule,
    settings:      ruSettings      as TranslationModule,
    errors:        ruErrors        as TranslationModule,
    validation:    ruValidation    as TranslationModule,
    marketing:     ruMarketing     as TranslationModule,
    navigation:    ruNavigation    as TranslationModule,
    public:        ruPublic        as TranslationModule,
    sd:            ruSd            as TranslationModule,
    mes:           ruMes           as TranslationModule,
    kanban:        ruKanban        as TranslationModule,
    director:      ruDirector      as TranslationModule,
    security:      ruSecurity      as TranslationModule,
    notifications: ruNotifications as TranslationModule,
    iot:           ruIot           as TranslationModule,
    admin:         ruAdmin         as TranslationModule,
    mro:           ruMro           as TranslationModule,
    design:        ruDesign        as TranslationModule,
    logistics:     ruLogistics     as TranslationModule,
    pos:           ruPos           as TranslationModule,
    ai:            ruAi            as TranslationModule,
    coordination:  ruCoordination  as TranslationModule,
    print:         ruPrint         as TranslationModule,
  },
};

// ─── In-memory cache ─────────────────────────────────────────────────────────
type Cache = Partial<Record<Language, Partial<Record<TranslationModuleName, TranslationModule>>>>;
const _cache: Cache = {};

function getCachedModule(lang: Language, module: TranslationModuleName): TranslationModule {
  if (!_cache[lang]) _cache[lang] = {};
  if (!_cache[lang]![module]) {
    _cache[lang]![module] = ALL_TRANSLATIONS[lang]?.[module] ?? {};
  }
  return _cache[lang]![module]!;
}

/**
 * Kalit bo'yicha tarjimani qaytaradi.
 * Yetishmasa: development da console.warn, production da raw key.
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
  if (!import.meta.env.DEV) return;

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
