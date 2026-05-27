# Report 19 — i18n Coverage

**Date:** 2026-05-27  
**Analyst:** Forensic audit (read-only)  
**Scope:** Frontend `artifacts/erp-dashboard/src/locales/` · Backend `apps/api/src/i18n/`

---

## 1. Module Overview

### 1.1 Frontend i18n

- **Library:** Custom `LanguageProvider` + `useTranslation` hook at `artifacts/erp-dashboard/src/lib/i18n/`
- **Format:** Flat JSON (single-level key-value, with some nested objects in `common.json` — the large 8-9k key file)
- **Loader:** `loader.ts` exports `ALL_TRANSLATIONS`, `getTranslation(key, module, lang)`
- **Supported languages:** `uz` (UZ-Latin), `uz-cyr` (UZ-Cyrillic), `ru` (Russian)
- **Locale directory:** `artifacts/erp-dashboard/src/locales/{uz,uz-cyr,ru}/`
- **Namespace count:** 55 namespace files per language (57 physical files including `.bak.t2c` backups)

### 1.2 Backend i18n

- **Library:** `nestjs-i18n`
- **Languages:** `uz`, `uz-cyr`, `ru`
- **Namespaces:** `auth`, `common`, `errors`, `messages`, `telegram`, `validation` (6 files per language)
- **Directory:** `apps/api/src/i18n/{uz,uz-cyr,ru}/`

---

## 2. Inventory / Coverage

### 2.1 Frontend Namespace Key Counts

| Namespace | uz keys | uz-cyr keys | ru keys | Status |
|---|---|---|---|---|
| `common.json` | 8,495 | 9,329 | 8,495 | **MISMATCH: uz-cyr has 834 extra keys** |
| `navigation.json` | 199 | **685** | 199 | **CRITICAL: uz-cyr has 486 extra keys** |
| `hr.json` | 598 | **612** | 598 | uz-cyr has 14 extra |
| `crm.json` | 468 | **473** | 468 | uz-cyr has 5 extra |
| `production.json` | 468 | **473** | 468 | uz-cyr has 5 extra |
| `warehouse.json` | 448 | **466** | 448 | uz-cyr has 18 extra |
| `kanban.json` | 104 | **116** | 104 | uz-cyr has 12 extra |
| `finance.json` | 570 | 570 | 570 | Parity |
| `mro.json` | 410 | 410 | 410 | Parity |
| `lms.json` | 156 | 156 | 156 | Parity |
| `ai.json` | 225 | 225 | 225 | Parity |
| `admin.json` | 92 | 92 | 92 | Parity |
| `auth.json` | 84 | 84 | 84 | Parity |
| `settings.json` | 75 | 75 | 75 | Parity |
| **adaptation.json** | **0** | **0** | **0** | **EMPTY — all 3 langs** |
| **analytics.json** | **0** | **0** | **0** | **EMPTY — all 3 langs** |
| **employee-profile.json** | **0** | **0** | **0** | **EMPTY — all 3 langs** |
| **erp.json** | **0** | **0** | **0** | **EMPTY — all 3 langs** |
| **planning.json** | **0** | **0** | **0** | **EMPTY — all 3 langs** |
| `coordination.json` | 60 | 60 | 60 | Parity |
| `mes.json` | 83 | 83 | 83 | Parity |
| `iot.json` | 159 | 159 | 159 | Parity |
| `marketing.json` | 100 | 100 | 100 | Parity |
| `logistics.json` | 69 | 69 | 69 | Parity |
| `pos.json` | 71 | 71 | 71 | Parity |
| `qc.json` | 104 | 104 | 104 | Parity |
| `director.json` | 122 | 122 | 122 | Parity |
| `wms.json` | 99 | 99 | 99 | Parity |
| `sd.json` | 101 | 101 | 101 | Parity |

### 2.2 Navigation Key Delta

`uz-cyr/navigation.json` has **486 keys** not present in `uz/navigation.json`. Sample of keys only in uz-cyr:

```
finSectionCashAdvance, topAiModule, topHrHrXarita, navFinGlChartOfAccounts,
navCrm3dMockup, navCoordSifatAgent, navPrintMashinaHolati, navIotBinoInventari,
navSalesModule, navSecXavfliMaterial, ...
```

This means **485 navigation entries are only translated in Cyrillic — the Latin UZ interface is missing almost 70% of its navigation keys**.

### 2.3 Empty Namespace Files

5 namespaces are completely empty `{}` in all three languages:

| File | Intended Purpose | Status |
|---|---|---|
| `adaptation.json` | HR onboarding/adaptation workflow | Created, never populated |
| `analytics.json` | Analytics/reports UI | Created, never populated |
| `employee-profile.json` | Employee profile page | Created, never populated |
| `erp.json` | General ERP terms | Created, never populated |
| `planning.json` | Production planning | Created, never populated |

### 2.4 Cyrillic Characters in UZ-Latin Files

Python analysis of `locales/uz/*.json`:

| File | Cyrillic chars | Severity |
|---|---|---|
| `common.json` | 312 | HIGH |
| `warehouse.json` | 1,440 | HIGH |
| `coordination.json` | 170 | HIGH |
| `lms.json` | 82 | MEDIUM |
| `finance.json` | 94 | MEDIUM |
| `hr.json` | 49 | MEDIUM |
| `kanban.json` | 35 | MEDIUM |
| `settings.json` | 25 | LOW |
| `director.json` | 17 | LOW |
| `production.json` | 17 | LOW |
| **Total** | **2,241** | |

This means the UZ-Latin locale file (`uz/`) contains 2,241 Cyrillic characters — these are Russian/Cyrillic strings that were placed into the wrong locale file. Users selecting "UZ Latin" will see Cyrillic text in these sections, particularly in `warehouse.json` (1,440 chars — the worst offender).

### 2.5 Hardcoded Cyrillic in TSX Files

Python analysis across all `*.tsx` source files (excluding `locales/`):

- **109 TSX files** contain Cyrillic characters
- **13,215 total Cyrillic characters** hardcoded in TSX

These represent strings that bypass the i18n system entirely. Examples seen in grep output:
- `CameraAICameraPanel.tsx:46` — `placeholder="Поиск…"` (hardcoded Russian placeholder)
- `CameraAIModernHub.tsx:295` — same pattern

This is particularly problematic because these strings cannot be translated by changing the language setting.

### 2.6 Backup Files

Two backup files exist in the locale directories:
- `locales/uz/common.json.bak.t2c`
- `locales/ru/common.json.bak.t2c`

These are leftover from a transliteration tool (`t2c` = transliterate-to-cyrillic). They should not be committed to version control.

---

## 3. i18n Loader Architecture

Source: `artifacts/erp-dashboard/src/lib/i18n/loader.ts`

**Format:** The loader imports JSON files statically at build time and merges them into `ALL_TRANSLATIONS`. This is a **flat-key format at the top level** — `t('someKey')` returns the value directly.

However, `common.json` has nested objects (evidenced by the Python count returning 8,495 keys for what appears to be a deeply nested file). The `getTranslation()` function likely handles dot-notation paths. This dual flat/nested format creates inconsistency.

**Language switching:** Via `localStorage` key `LANGUAGE_STORAGE_KEY` (constant). No SSR considerations visible.

**Validation:** `validateTranslationCompleteness()` is exported — suggests completeness checking is possible but not confirmed to run in CI.

### 3.1 Backend i18n

Source: `apps/api/src/i18n/{uz,uz-cyr,ru}/{namespace}.json`

6 namespaces: `auth`, `common`, `errors`, `messages`, `telegram`, `validation`

Backend uses `nestjs-i18n` with `I18nService.t('namespace.key', { args: {...} })`. The `telegram.service.ts` uses it for director daily report formatting. No key-count analysis was performed for backend files; structure mirrors frontend pattern.

---

## 4. Missing Keys Analysis

**Navigation (most severe):**
- Keys in `uz-cyr/navigation.json` but absent from `uz/navigation.json`: **486 keys** (70% of uz-cyr navigation missing from uz-latin)
- Keys in `uz/navigation.json` absent from `uz-cyr/navigation.json`: **0 keys**

This asymmetry suggests that `uz-cyr/navigation.json` was updated with new menu items but `uz/navigation.json` was not kept in sync.

**Common namespace:**
- `uz-cyr/common.json` has 834 more keys than `uz/common.json` — same directional drift.
- `ru/common.json` matches `uz/common.json` (8,495 keys each).

**Pattern:** `uz-cyr` appears to be the primary translation target being developed most actively, while `uz` (Latin) and `ru` trail behind.

---

## Summary

Three critical i18n gaps exist:

1. **`uz/navigation.json` is missing 486 keys** that exist in `uz-cyr/navigation.json` — users on UZ-Latin see raw key strings (or fallback) for most navigation items added in recent development.
2. **2,241 Cyrillic characters in `uz/*.json` locale files** — UZ-Latin users are shown Russian/Cyrillic text, particularly in the Warehouse module (1,440 chars).
3. **5 namespaces are completely empty** across all three languages — any component importing these namespaces gets nothing.
4. **109 TSX files contain 13,215 hardcoded Cyrillic characters** — these cannot be localized without code changes.

---

## Gaps Table

| Issue | Severity | Evidence | Impact | Suggested Fix |
|---|---|---|---|---|
| `uz/navigation.json` missing 486 keys vs uz-cyr | P0 | Python analysis of locales/uz vs uz-cyr | UZ-Latin interface shows raw key names for most navigation | Copy+transliterate missing keys from uz-cyr |
| 2,241 Cyrillic chars in `uz/*.json` | P0 | Python scan `locales/uz/` | UZ-Latin users see Russian text in Warehouse/Coordination | Transliterate Cyrillic values to Latin |
| `adaptation.json` empty in all langs | P1 | Python: 0 keys | Adaptation module has no translations | Populate with strings from adaptation components |
| `analytics.json` empty in all langs | P1 | Python: 0 keys | Analytics UI untranslated | Populate from analytics component strings |
| `employee-profile.json` empty in all langs | P1 | Python: 0 keys | Employee profile untranslated | Populate from profile component strings |
| `planning.json` empty in all langs | P1 | Python: 0 keys | Planning module untranslated | Populate from planning component strings |
| 109 TSX files with 13,215 hardcoded Cyrillic | P1 | Python scan `.tsx` files | Hardcoded strings ignore language setting | Extract to locale files and use `t()` |
| `uz-cyr/common.json` has 834 extra keys vs uz | P2 | Python: 9,329 vs 8,495 | Latin uz missing ~10% of common strings | Sync common.json across langs |
| `.bak.t2c` files committed | P3 | `locales/uz/common.json.bak.t2c` | Bloat, potential confusion | Add to `.gitignore`, delete from repo |
| `validateTranslationCompleteness()` not in CI | P2 | `lib/i18n/loader.ts` | Missing keys go undetected until runtime | Run validation in CI pipeline |

---

## Open Questions / UNVERIFIED

- Does `validateTranslationCompleteness()` in `loader.ts` actually run anywhere (build time, CI, or not at all)?
- Are the 486 navigation keys missing from `uz` causing visible fallback strings (key names shown) or are they silently empty in the UI?
- How does the backend `nestjs-i18n` determine the request language — from Accept-Language header, JWT claim, or user profile?
- Is `uz-cyr` the de-facto primary language for this deployment (Kokand, Uzbekistan, where Cyrillic is common), and are `uz-latin` and `ru` secondary?
- Were the `.bak.t2c` files produced by an automated transliteration script, and does that script still run?
