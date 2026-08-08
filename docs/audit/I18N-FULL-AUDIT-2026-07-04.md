# EuroPrint ERP — Full i18n / Multi-language Audit (uz · ru · uz-Cyrl)

**Date:** 2026-07-04
**Type:** Read-only investigation (FE + backend + live DB). No code, migrations, or content changed.
**Verification:** static grep/read + file/key counts + **live native DB** (`localhost:5432`, the populated dev DB).

**One-line answer:** All three languages are *declared* and the infrastructure is real, but coverage is a three-way split — **uz-Latin ≈ full**, **ru ≈ two-thirds**, **uz-Cyrillic ≈ one-third** — and uz-Cyrillic's shortfall is mostly a **code-wiring** problem (the content largely exists), while ru's shortfall is more a **content/translation** problem on the backend and documents.

---

## Part A — i18n infrastructure

| # | Question | Status | Evidence | Notes |
|---|----------|--------|----------|-------|
| A1 | Library / framework | **PARTIAL** | FE: **no** i18next/react-intl dependency — a **custom** key-based system in `artifacts/erp-dashboard/src/lib/i18n/` (`loader.ts`, `context.tsx`, `getTranslation(lang,module,key)`), used by **1159 files**. BE: **`nestjs-i18n`** wired in `apps/api/src/app.module.ts:101-114`. | Two FE systems coexist (see A4) — the key-based one, plus an inline 2-arg helper. |
| A2 | Translation file coverage | **PARTIAL** | FE `locales/`: **uz 55 files, uz-cyr 55, ru 56** (file parity good). Rough key-lines: **uz ~16.9k, uz-cyr ~18.4k, ru ~25.2k**. `common.json` keys: uz 9783 / ru 9783 (parity) / uz-cyr 11074. | ru carries markedly more key-lines than uz — key-set is not identical across langs; uz-cyr `common` has extra keys. No language is missing whole files. |
| A3 | Language switcher | **FULL (exists) / localStorage-only** | `components/LanguageSwitcher.tsx` lists all 3 (uz, `uz-cyr` at line 20, ru). Persists via `lib/i18n/utils.ts:52` `setStoredLanguage` → **localStorage key `europrint_language`** (`constants.ts:14`). | Preference is **browser-local, NOT saved to the DB** — it cannot drive server-side localization (notifications/PDFs) and does not follow a user across devices. |
| A4 | Uzbek-Cyrillic specifically | **PARTIAL** | uz-cyr locale files hold **real hand-authored Cyrillic** (`locales/uz-cyr/common.json`: `"save":"Сақлаш"`, `"cancel":"Бекор қилиш"`, `"loading":"Юкланмоқда..."`). **No runtime Latin→Cyrillic transliteration function exists** (grep for translit/Cyrillic hits only a test file). The competing inline helper `const t = (uz, ru) => lang === "uz" ? uz : ru` (e.g. `pages/iot/IoTLoginPanel.tsx:25`) **has no uz-cyr branch → returns Russian for Cyrillic users.** | uz-cyr is static-file-based (not transliterated). It works only where the **key-based** system is used; the 2-arg helper structurally cannot emit Cyrillic. |

---

## Part B — Frontend coverage

| # | Question | Status | Evidence | Notes |
|---|----------|--------|----------|-------|
| B5 | Hardcoded strings bypassing i18n | **PARTIAL** | ~**48 unwrapped Uzbek JSX strings across 29 files**; worst: `pages/RulonCards.tsx` (5), `pos-monitor/pages/PosMaterialDetail.tsx` (5), `pages/mro/CanteenManagementPage.tsx` (3), `pages/PPEquipmentPage.tsx` (3), `pages/WarehouseMaterial360.tsx` (3), `components/sd/BasicTab.tsx` (2), `pages/qc/QualityCertificatesPage.tsx` (2), `pages/MMExtended*.tsx`, `pages/GLDocuments.tsx`, `pages/ErrorCatalogConfig.tsx` (2). Plus pervasive hardcoded `so'm`/`UZS` currency literals. | Those pages stay uz-Latin in every language. |
| B6 | Per-module: does language actually switch? | **PARTIAL** | **3-lang OK (key-based `useTranslation`):** HR `pages/Discipline.tsx:140`, QC `pages/qc/SupplierQualityPage.tsx:166`, Director `pages/DirectorDashboard.tsx`, POS `pos-monitor` via `usePosI18n.ts` (real uz-cyr JSON). **uz-cyr BROKEN (2-arg helper → Russian):** WMS `pages/WarehouseDailyView.tsx:32`, IoT `pages/iot/IoTProductionDashboard.tsx`, PP `pages/PlanningBoard.tsx` (`translations[lang]` 2-lang map). **Mixed/hardcoded uz:** Finance `pages/GLDocuments.tsx`, `PeriodClosing.tsx`. | The confirmed-buggy 2-arg helper is **~40 files**, concentrated in **IoT + WMS/planning/barcode/camera/face** (all byte-identical `lang==='uz'?uz:ru`). |
| B7 | Date / number / currency formatting | **MISSING (locale-frozen)** | Hardcoded `"uz-UZ"` regardless of UI language: `lib/format.ts:48,59,70,80,109`, `lib/sd-helpers.ts:7`, `components/director/MetricCard.tsx:57`, ~15 `pos-monitor/pages/*` (`toLocaleString("uz-UZ")`). One inconsistent `"ru-RU"` at `components/employee/EmployeeCardsSummary.tsx:49`. date-fns imports only the `uz` locale. | No per-language number/date/currency switch anywhere — ru and uz-cyr users see Uzbek formatting. |
| B8 | Cyrillic / script rendering | **FULL** | `locales/uz-cyr/` (55 JSON) + `pos-monitor/i18n/uz-cyr.json` load as valid UTF-8, correct Uzbek Cyrillic glyphs (`Телефон`, `бўлим`, `Хавфсизлик`); no `Ð`/`Ñ`/`â€` mojibake. | The `????` in some terminal output is a Windows console limitation, not file corruption. |

---

## Part C — Backend message coverage

| # | Question | Status | Evidence | Notes |
|---|----------|--------|----------|-------|
| C9 | API error / validation messages | **PARTIAL** | `nestjs-i18n` registered `app.module.ts:101-114` (`fallbackLanguage:'uz'`; resolvers `?lang` → `x-lang` → `Accept-Language`); JSON for uz/ru/uz-cyr under `apps/api/src/i18n/`. **~63 files / 170 `i18n.t()` sites** localize (e.g. `orders.service.ts:31,71`, auth/otp services). BUT **~470 hardcoded `throw new XException('...')`** literal messages remain, and **Zod validation is not localized** — `global-exception.filter.ts:46-50` hardcodes `'Validation error'` (English), no field-level i18n. | The API *can* detect language, but most rejection paths ignore it. Default fallbacks are English/Uzbek. |
| C10 | Notification content | **PARTIAL (split)** | **FULL trilingual:** recruitment bot `recruitment-bot.i18n.ts:33-79` (uz/ru/en, per-applicant `RecruitSession.lang`). **MISSING:** system/cron Telegram notifications hardcoded Uzbek — `cron/birthday.cron.ts:51,94,150` and peers (`vacancy-deadline`, `daily-report-deadline`, `manager-daily-routine`). No recipient `preferred_language` is consulted. | Only the applicant-facing recruitment flow is localized; internal notifications are Uzbek-only. |
| C11 | Generated documents / PDFs | **MISSING (fixed Uzbek)** | `cc-pdf.service.ts` reads `doc.language` (`:26,94`) but **never uses it**; all labels hardcoded Uzbek: `'Sana:'`(:128), `'Mavzu:'/'Yuboruvchi:'`(:139,142), `'IMZOLAR ZANJIRI'`(:170), status `'Tasdiqlandi/Rad etildi/Kutilmoqda'`(:175-177); dates forced `toLocaleDateString('uz-UZ')`. `transliterate()` only maps Cyrillic→Latin **glyphs for the font**, it does not translate. | Every generated PDF is Uzbek-only regardless of selected language. |

---

## Part D — Database content

| # | Question | Status | Evidence (live DB) | Notes |
|---|----------|--------|--------------------|-------|
| D12 | Multi-language content storage | **PARTIAL (bilingual only, NO Cyrillic)** | **No translations table.** Convention = base column (uz) + `_ru` sibling. Live: **264 `_ru` columns, 54 `_uz`, 42 tables with a `_uz`/`_ru` pair**. Populated: `material_cards.xom_ashyo`/`_ru` 31/31; `org_departments.name`/`name_ru` 143/145; `unit_of_measures.name`/`name_ru` 19/19; `defect_catalog.name_uz`/`name_ru` 23/23 (but `description_uz`/`corrective_action_uz` have **no `_ru`**). | **Zero `_cyrl` columns exist** — DB content can never render in Uzbek Cyrillic (only uz-Latin or ru). This is the single biggest uz-cyr gap. |
| D13 | User language preference column | **PARTIAL (present, unused-variety)** | `users` has **BOTH `language` AND `lang`** (duplicate varchar); **32/32 populated, every value `'uz'`** (0 ru, 0 cyr, 0 null). **`employees` has NO language column.** Also `system_settings.language`, `cc_notification_prefs.language`, bot/interview lang fields exist. | Preference exists but is uniformly `'uz'` and duplicated; real ru/uz-cyr usage is effectively untested in data. `notification_schedules` stores `title_uz/title_ru/body_uz/body_ru` **columns** (1 row, all filled) — bilingual, no Cyrillic. |

---

## Per-language completeness (rough %, share of the app that actually renders in that language today)

| Language | Score | Why |
|----------|------:|-----|
| **uz-Latin** | **~92%** | The base/default. Renders almost everywhere (key-based + bilingual + hardcoded all resolve to Uzbek). Only true gaps are keys where value==key placeholders. |
| **Russian (ru)** | **~65%** | FE key-based files + all `_ru` DB columns + the 2-arg files (which show ru) work. But **PDFs, system/cron notifications, ~470 backend throws, Zod errors, ~29 hardcoded-uz pages, and all number/date formatting** stay Uzbek. |
| **Uzbek-Cyrillic (uz-Cyrl)** | **~35%** | Works only in the **key-based FE chrome** (1159 files, real Cyrillic locale) + pos-monitor. **Broken/absent** in: ~40 bilingual FE files (→ Russian), **all DB content** (no `_cyrl` columns → uz-Latin/ru), all PDFs, all notifications, most backend errors, and all formatting. A Cyrillic user sees Cyrillic menus but Latin/Russian data, documents, and forms. |

---

## Top 10 highest-leverage gaps (ranked by users × screens affected)

1. **Number/date/currency locked to `"uz-UZ"`** (`lib/format.ts:48-109`) — affects **every screen** for both ru and uz-cyr users. Widest blast radius, and it's a handful of central files.
2. **DB content has no `_cyrl` columns** (only uz + `_ru`) — **every data value** (material names, departments, catalogs) is un-Cyrillicizable. The structural ceiling on uz-cyr.
3. **IoT tablet + WMS/planning ~40 files use the 2-arg helper → uz-cyr shows Russian** — hits every shop-floor worker who selects Cyrillic (the exact audience most likely to want it).
4. **All generated PDFs hardcoded Uzbek** (`cc-pdf.service.ts:123-201`) — every printed/official document for ru + uz-cyr users.
5. **System/cron Telegram notifications hardcoded Uzbek** (`cron/birthday.cron.ts:51,94,150`, peers) — every internal notification recipient.
6. **Zod validation + ~470 backend throws not localized** (`global-exception.filter.ts:46-50`) — every failed form/action for non-uz users.
7. **Language preference lives only in localStorage, not DB; `employees` has no lang column** — server-side localization (notifications/PDFs) can't know a user's language even where it's built.
8. **~29 FE pages with hardcoded Uzbek JSX** (RulonCards, PosMaterialDetail, Warehouse360…) — those pages never translate in any language.
9. **`users` has duplicate `language`+`lang`, all `'uz'`** — data-quality; also means ru/uz-cyr paths are untested against real user data.
10. **Key-set drift** (ru ~25k vs uz ~16.9k key-lines; `defect_catalog` description/corrective-action UZ-only) — specific content holes even within the "supported" bilingual set.

---

## Structural verdict — content problem vs code problem

The two deficits are **different in kind** and need different follow-up:

- **Uzbek-Cyrillic ≈ a CODE / wiring problem (content mostly exists).** The infrastructure and real Cyrillic *content* are already there (55 uz-cyr locale files with hand-authored Cyrillic, a backend `i18n/uz-cyr` dir, the switcher lists it). What's missing is **code**: (a) ~40 FE files use a 2-arg `t(uz,ru)` helper with no Cyrillic branch, (b) the DB schema has **no `_cyrl` columns**, (c) formatting/PDF/notification code never threads a language parameter. Fixing uz-cyr is mostly *rewiring* (swap the helper for the key-based `t`, add `_cyrl` columns or a translations table, thread `lang`), not writing new translations.

- **Russian ≈ more a CONTENT / translation problem on the back half.** The FE wiring for ru mostly works; the gaps are **untranslated strings**: ~470 hardcoded backend throw messages, PDF label sets, cron notification templates — these need Russian *text* authored and (a smaller amount of) plumbing to select it.

- **Shared root cause:** localization was built **FE-chrome-first**. Static UI labels are well-covered in all three languages; but **data, documents, notifications, validation, and formatting** — everything generated from the backend or the database — were largely left single-language. So the higher a string sits toward "hardcoded label," the better it's translated; the closer it sits to "real business data / official output," the more likely it's Uzbek-only.

*Investigation only — nothing translated or modified. Awaiting review.*
