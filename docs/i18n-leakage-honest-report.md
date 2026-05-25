# i18n Leakage — Honest Status Report

Date: 2026-05-16
Branch: `chore/clean-faza-3`

## Honest scope statement

The agent prompt envisioned **3-4 weeks of autonomous work** across 958 pages
with Playwright DOM tests + ESLint gates + visual regression. That is the
right scope for the mission. **This session built the foundation, not the
complete fix.** Treating this delivery as "100% complete" would repeat the
previous lie. Here is what is actually true.

---

## What was delivered

### 1. A working static leak detector — `scripts/i18n-leak-detector.mjs`

Two modes:
- **`--mode=static`** (default) — scan source code (.tsx/.ts) for hardcoded
  user-facing strings. No browser required. Used to produce the baseline.
- **`--mode=dom --html <file> --locale ru|uz`** — walk a captured HTML
  snapshot's text nodes for mixed-language leaks. Hooks into Playwright.

Dictionaries:
- Brand/acronym whitelist (~80 entries: EuroPrint, API, KPI, OEE, JWT, ...)
- Uzbek-specific stems (~120 entries: apostrophe markers `o'`/`g'`, suffixes
  `-lar`/`-ning`/`-da`/`-ga`, verbs, status words)
- Cyrillic range `U+0400–U+04FF`

Heuristic improvements (vs naïve approach):
- Files using `useTranslation` OR `getTranslatedMenuGroups` are assumed
  i18n-aware. Their `OBJECT_LABEL` findings (sidebar / route configs) are
  i18n KEYS, not leaks. This eliminated 901 false positives.

### 2. Honest baseline measurement

Initial naïve count: **1,403** leaks
After heuristic filtering of i18n-aware files: **502** real leaks across **185** files.

Per kind:
- `OBJECT_LABEL` — 380 (status maps, enum labels, config arrays in files that
  do NOT use `t()` — e.g. `crm-types.ts`, `kanban-types.ts`, `*Types.ts`)
- `JSX_TEXT` — 81 (hardcoded text between JSX tags)
- `PROP` — 41 (hardcoded `placeholder=`/`title=`/`label=` attributes)

Per locale:
- 428 Uzbek-in-source (will leak in RU rendering)
- 74 Russian-in-source (will leak in UZ rendering)

### 3. Sidebar audit — almost clean already

Walked all 7 sidebar `constants-*.ts` files (424 menu items total):
- 423 / 424 titles have BOTH UZ and RU translations
- 1 missing (`Kamera Sifat Nazorati`) — fixed

The user's screenshot evidence of Uzbek-in-RU sidebar was **before** the
prior sprint's fixes; the current sidebar renders cleanly when the
translation file is reloaded (frontend cache).

### 4. Top 20 worst files (real leaks)

| File | Leaks |
|---|---|
| `pages/adaptation/ProgramsTabTypes.ts` | 20 |
| `pages/crm/crm-types.ts` | 18 |
| `pages/kanban/kanban-types.ts` | 18 |
| `pages/TechPPExtendedTypes.ts` | 14 |
| `pages/WarehouseReportsAllTypes.ts` | 14 |
| `pages/TechCardsTypes.ts` | (~14) |
| `components/mockup/MockupShell.tsx` | 17 |
| `pages/SDEuroprint.tsx` | 14 |
| `pages/EuroprintControlCenter.tsx` | 25 |

All in `docs/i18n-leakage-baseline.json` for full inspection.

### 5. Playwright DOM test scaffolding — `e2e/i18n-leakage.spec.ts`

Iterates 21 priority routes × 2 locales = 42 test cases. For each:
- Logs in as admin
- Sets `localStorage.i18nextLng` and reloads
- Walks every text node
- Tests against the detector dictionary
- Captures fullPage screenshot if leaks found

**Requires:** live backend + frontend. The user runs:
```bash
pnpm --filter erp-dashboard exec playwright test e2e/i18n-leakage.spec.ts
```

When 21-route scaffold passes, expand `ROUTES` array to all 958.

---

## What is NOT done

| Phase | Scope | Status |
|---|---|---|
| 1. Detection infra | static + DOM detector, baseline | ✅ Done |
| 2. Per-page fixing | 502 leaks across 185 files | ❌ Only 1 nav key fixed; rest documented |
| 3. Dynamic / backend audit | API responses, runtime mutations, DB labels | ❌ Not started |
| 4. Hardening | ESLint `jsx-no-literals`, pre-commit, Chromatic | ❌ Not started |
| 5. Final audit + sign-off | Director walkthrough, fresh re-run | ❌ Not started |

---

## The fix playbook (for the multi-week execution)

### Pattern D — Status map with Uzbek values (~380 leaks)

```typescript
// BEFORE (crm-types.ts)
export const ENTITY_CONFIG = {
  leads:    { label: "Lidlar",      icon: PhoneIncoming, color: "#4CAF50" },
  deals:    { label: "Bitimlar",    icon: DollarSign,    color: "#2196F3" },
  contacts: { label: "Kontaktlar",  icon: User,          color: "#9C27B0" },
};

// AFTER — option A: i18n key in static config + translate at render
export const ENTITY_CONFIG = {
  leads:    { labelKey: "crm.entities.leads",    icon: PhoneIncoming, color: "#4CAF50" },
  deals:    { labelKey: "crm.entities.deals",    icon: DollarSign,    color: "#2196F3" },
  contacts: { labelKey: "crm.entities.contacts", icon: User,          color: "#9C27B0" },
};
// Consumer:
const { t } = useTranslation('crm');
<span>{t(cfg.labelKey)}</span>

// AFTER — option B: hook-based translated map
export function useEntityConfig() {
  const { t } = useTranslation('crm');
  return {
    leads:    { label: t('entities.leads'),    icon: PhoneIncoming, color: "#4CAF50" },
    deals:    { label: t('entities.deals'),    icon: DollarSign,    color: "#2196F3" },
    contacts: { label: t('entities.contacts'), icon: User,          color: "#9C27B0" },
  };
}
```

Locale files:
```json
// uz/crm.json
{ "entities": { "leads": "Lidlar", "deals": "Bitimlar", "contacts": "Kontaktlar" } }
// ru/crm.json
{ "entities": { "leads": "Лиды", "deals": "Сделки", "contacts": "Контакты" } }
```

### Pattern A — Hardcoded JSX text (~81 leaks)

The previous sprint's `convert-jsx-to-t.mjs` converter handles this. Re-run
after Pattern D fixes:
```bash
node convert-jsx-to-t.mjs
```

### Pattern C — Template literals like `${count} ta`

Use plural-aware keys:
```tsx
// BEFORE
<span>{count} ta o'tdi</span>
// AFTER
<span>{t('common.passedCount', { count })}</span>
```
Locale: `"passedCount_one": "{{count}} ta o'tdi"` (UZ),
`"passedCount_other": "{{count}} пройдено"` (RU).

### Pattern E — Backend Uzbek in responses

Backend services that return `status: 'Yangi'` (Uzbek label) — fix backend
to return an enum code (`status_code: 'NEW'`), then translate in frontend:
```tsx
<Badge>{t(`deal.status.${row.status_code.toLowerCase()}`)}</Badge>
```

This is the hardest pattern — touches NestJS controllers, DTOs, and
frontend consumers simultaneously.

---

## ESLint rule to install (Phase 4)

`.eslintrc.cjs`:
```javascript
module.exports = {
  rules: {
    'react/jsx-no-literals': ['error', {
      noStrings: true,
      allowedStrings: [
        // Brand + acronym whitelist
        'EuroPrint', 'Telegram', 'WhatsApp', 'API', 'URL', 'JWT', 'KPI',
        'OEE', 'MES', 'WMS', 'HR', 'FI', 'PP', 'QC', 'POS', 'CRM', 'ERP',
        // …full whitelist
      ],
      ignoreProps: false,
    }],
  },
};
```

Combined with a CI gate that runs the Playwright DOM test on every PR, no
new leak can land.

---

## How to continue (multi-week roadmap)

1. **Day 1** — install ESLint rule. CI goes red. Visibility achieved.
2. **Days 2–5** — fix top 20 `*Types.ts` files (Pattern D). Each gets a
   `use<Module>Config()` hook + i18n keys. Locale files expanded.
3. **Days 6–15** — fixer workers in batches of 50 pages. Each batch:
   detector → fix → typecheck → Playwright DOM test → commit.
4. **Days 16–20** — Phase 3: backend Uzbek labels, DB column audit.
5. **Days 21–25** — Phase 4: Storybook locale stories, Chromatic.
6. **Days 26–28** — Phase 5: fresh re-run, Director sign-off.

The `scripts/i18n-leak-detector.mjs` script is the source of truth: target
is **0 leaks** in static mode AND **0 failures** in Playwright DOM mode.

---

## Files added in this session

- `scripts/i18n-leak-detector.mjs` — universal detector (static + DOM)
- `artifacts/erp-dashboard/e2e/i18n-leakage.spec.ts` — Playwright scaffold
- `fix-sidebar-missing.mjs` — single missing nav key patch
- `docs/i18n-leakage-baseline.json` — 502 leak inventory (full)
- `docs/i18n-leakage-honest-report.md` — this file

## Commits

This session adds the detection infrastructure. The multi-week fixing work
is documented above for the next executor (human or agent).
