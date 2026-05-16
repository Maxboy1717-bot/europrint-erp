# EuroPrint ERP — i18n Leakage Eliminator (Universal Agent Prompt)

> **For AI agent (Claude Code, Cursor, etc.). Give as-is.**
> **Mission:** Eliminate ALL language leakage in EuroPrint ERP — when RU locale is selected, ZERO Uzbek words appear; when UZ locale is selected, ZERO Russian/English words appear. Across ALL 958 pages.
> **Why:** Screenshot evidence shows widespread leakage despite the "i18n 100%" final report. The report measured JSON file completeness, NOT actual rendered output.
> **Date:** 2026-05-15

---

## CONTEXT — WHY THIS PROMPT EXISTS

Previous i18n work claimed 100% completion. **Reality on screen:**

| Screenshot evidence | Example |
|---|---|
| RU header has Uzbek title | "Meneger Paneli" (should be "Панель Менеджера") |
| RU subtitle mixes UZ + RU | "Sotuv moduli kengaytirilgan boshqaruv панель" |
| RU stat label mixes RU + UZ | "ВСЕГО BITIMLAR" (should be "ВСЕГО СДЕЛОК") |
| RU sidebar buttons in Uzbek | "Kvota Dashboard", "Ombor Ijara", "Avans Nazorat" |
| RU chat overlay mixed | "Chatlarni поиск...", "Новый chat boshlash" |
| Triple-language mix | "Каждый bir bitim для AI tomonidan 0-100 балл baholash" |
| UZ unit suffix in RU | "0 ta o'tdi", "umumiy yo'qotish", "ildiz sabab tahlil" |

**Root causes — what previous fix missed:**
1. **Hardcoded title/subtitle props** in page components (not in locale JSON)
2. **Route config arrays** with hardcoded sidebar labels
3. **Dynamic template literals** like `${count} ta` where the unit is hardcoded
4. **Backend API responses** containing Uzbek labels that frontend displays as-is
5. **Empty state / fallback strings** in components
6. **Toast messages** built with string concatenation
7. **Locale key fallback** — when key missing, library shows the Uzbek key name
8. **Chat panel / overlay components** that weren't audited (separate from page tree)
9. **Brand-look-alike strings** treated as whitelisted but are actually Uzbek words

The previous audit only counted JSON keys. **This time we measure the rendered DOM.**

---

## YOUR MISSION

You are the **i18n Leakage Eliminator** for EuroPrint ERP at `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module`.

**Goal:** When a user toggles RU language, every visible string on every page is in Russian (Cyrillic). When they toggle UZ, every string is in Uzbek (Latin). Brands/technical terms (API, EuroPrint, KPI, OEE, JWT, ID, URL) stay as-is per whitelist.

**Success criteria:**
- **Pages tested:** ALL 958 frontend routes
- **Per page:** Render in RU → 0 Uzbek words detected. Render in UZ → 0 Russian Cyrillic words detected (except brand whitelist).
- **CI gate:** Playwright + language detector blocks any PR introducing leakage.
- **Evidence:** Visual diff screenshots before/after for every fixed page.

**Estimated effort:** ~3-4 weeks autonomous execution. Long-running. Do NOT stop until done.

---

## ⚠️ ONE-TIME PERMISSION (FIRST MESSAGE)

Request blanket permission once. Never ask again.

```
I need read+write access to do a comprehensive i18n cleanup of EuroPrint ERP.
I will NOT ask permission per file — I'll work autonomously until done.

Scope:
1. artifacts/erp-dashboard/src/locales/{uz,ru}/**/*.json  (50+50 files)
2. artifacts/erp-dashboard/src/pages/**/*.tsx              (958 files)
3. artifacts/erp-dashboard/src/components/**/*.tsx         (571 files)
4. artifacts/erp-dashboard/src/hooks/**/*.ts               (30+ hooks)
5. artifacts/erp-dashboard/src/routes/**/*.tsx             (route configs)
6. artifacts/erp-dashboard/src/lib/i18n/**/*.ts            (config + utils)
7. artifacts/erp-dashboard/e2e/**/*.spec.ts                (Playwright tests)
8. artifacts/erp-dashboard/playwright.config.ts            (config)
9. apps/api/src/**/*.ts                                     (backend i18n)
10. apps/api/src/locales/{uz,ru}/**/*.json                 (backend errors)
11. scripts/i18n-*.mjs                                      (new analyzers)
12. docs/i18n-leakage-report.md                             (progress)
13. .github/workflows/code-quality.yml                      (CI gate)
14. .eslintrc.cjs / eslint.config.js                        (lint rules)

May I proceed? (YES / NO)
```

---

## STRICT RULES

1. **Measure rendered DOM, not JSON files.** Previous fix lied by measuring JSONs. We measure what users see.
2. **All 958 pages in BOTH locales.** No exceptions.
3. **Whitelist is narrow.** Only these stay un-translated:
   - Brand names: EuroPrint, Telegram, WhatsApp, PostgreSQL, Redis, Drizzle, NestJS, React, Anthropic, Claude, OpenAI, Gemini, ElevenLabs, GitHub, Slack, Notion, Zoom, Cloudflare
   - Acronyms: API, URL, JWT, OAuth, OTP, 2FA, SaaS, ERP, CRM, HR, FI, PP, MES, QC, WMS, SD, MRO, POS, MM, LMS, KPI, OEE, RBAC, SOS, SLA, SoD, GL, AP, AR, BOM, MRP, CRP, RFM, CLV, NPS, ID, IP, OK, PDF, CSV, XLSX, JSON, HTML, CSS, JS, TS, SQL, REST, GraphQL, WebSocket, SSE, Wi-Fi, iOS, Android, RCA, MM, FMEA
4. **No CamelCase fragments visible.** `Meneger`, `Savdo`, `Bitimlar` are NOT brand names — they must be translated.
5. **No mixed sentences.** "Сделка yo'q" → must be EITHER "Сделок нет" OR "Bitim yo'q" depending on locale.
6. **Backend responses too.** If backend returns `{ status: "Yangi" }` and frontend shows it raw — fix the backend.
7. **Tests required.** Every fixed page gets a Playwright leakage test.
8. **Result pattern, TypeScript strict, no `any`.**
9. **No `it.skip`, no `expect(true)`, no `console.log` in production.**

---

## DETECTION VOCABULARY — UZBEK WORDS TO FIND IN RU OUTPUT

When checking a RU-locale rendered page, ANY appearance of these word stems triggers a violation. This is your detector dictionary.

### Critical markers (always Uzbek when present)

Apostrophe + letter combos that don't appear in Russian:
- `o'`, `g'`, `ʻ` (modifier letter apostrophe)
- Words with `sh`, `ch`, `q`, `x` between vowels (transliteration markers)

### High-confidence Uzbek-only words (case insensitive)

**Verbs / actions:**
```
saqlash, bekor, tahrirlash, o'chirish, qo'shish, yangilash, yaratish,
yuklash, yuklab, qidirish, filtrlash, saralash, eksport, import,
yopish, orqaga, keyingi, oldingi, yuborish, tasdiqlash, qo'llash,
qaytarish, tanlash, ko'chirish, nusxalash, yopishtirish, chop,
yangilamoq, tugatish, boshlash
```

**Status / state:**
```
faol, nofaol, yangi, kutilmoqda, tasdiqlangan, rad etilgan,
yakunlangan, bekor qilingan, bajarilmoqda, yopilgan, ochiq,
muvaffaqiyatli, xato, ogohlantirish, ma'lumot
```

**Common nouns:**
```
nomi, tavsif, turi, holat, sana, vaqt, miqdor, jami, foiz, narx,
soni, birlik, manba, manzil, telefon, tafsilotlar, harakatlar,
sozlamalar, filtrlar, foydalanuvchi, parol, ruxsat, rol, xavfsizlik
```

**Business terms:**
```
buyurtma, hujjat, mijoz, yetkazib, tovar, sklad, omborxona,
xodim, ishchi, daromad, xarajat, foyda, zarar, hisob-faktura,
ishlab chiqarish, smena, marshrut, rejalashtirish, avans,
yetkazish, hisobot, buxgalteriya, lavozim, bo'lim, boshlig'i,
rahbar, korxona, tashkilot
```

**Dashboard / UI:**
```
boshqaruv paneli, bosh sahifa, ko'rib chiqish, statistika,
ko'rsatkichlar, diagrammalar, grafiklar, xulosa, tendensiya,
taqqoslash, savdo, mahsulot, panel, dashbord, paneli
```

**Particles / connectors (HIGH frequency leak):**
```
yo'q, bor, ta, bilan, uchun, lekin, agar, yoki, qachon,
qaerda, qanday, kim, nima, qancha, nechta, bo'yicha
```

**Suffixes that indicate Uzbek noun:**
```
-lar (plural)     — e.g. "bitimlar", "menejerlar", "buyurtmalar"
-ning (genitive)  — e.g. "menejerining", "korxonaning"
-da (locative)    — e.g. "sahifada", "bo'limda"
-dan (ablative)   — e.g. "tomonidan", "sahifadan"
-ga / -ka (dative) — e.g. "bo'limga", "ishga"
```

### Specific phrases from screenshot evidence

```
"Meneger Paneli"            → "Панель Менеджера"
"Savdo Dashbordi"           → "Дашборд Продаж"
"Kvota Dashboard"           → "Дашборд Квоты"
"Ombor Ijara"               → "Аренда Склада"
"Avans Nazorat"             → "Контроль Аванса"
"Bitimlar"                  → "Сделки"
"DAROMAD"                   → "ДОХОД"
"Лид Skoring"               → "Скоринг Лидов"
"Сделка ehtimoli"           → "Вероятность Сделки"
"Churn риск"                → "Риск Оттока"
"Шаблон Email"              → "Шаблон Email" (Email is whitelist OK)
"Сделки topilmadi"          → "Сделки не найдены"
"Сделка yo'q"               → "Нет сделок"
"Chatlarni поиск..."        → "Поиск чатов..."
"Новый chat boshlash"       → "Начать новый чат"
"Sun'iy intellekt c CRM"    → "Искусственный интеллект с CRM"
"O'tish darajasi"           → "Уровень прохождения"
"Брак харажат"              → "Расход на брак"
"Брак sabablari"            → "Причины брака"
"Брак topilmadi"            → "Брак не найден"
"4 ta QC oqimi"             → "4 потока QC"
"Kiruvchi material"         → "Входящий материал"
"Past sifat"                → "Низкое качество"
"Поставщик sifati"          → "Качество поставщика"
"Reklamatsiya нет"          → "Рекламаций нет"
"ildiz sabab tahlil"        → "анализ корневой причины"
"umumiy yo'qotish"          → "общие потери"
"0 ta o'tdi"                → "0 пройдено"
"0 ta ochiq"                → "0 открыто"
"passed / total"            → "пройдено / всего"
"Производ chiqarishda"      → "При производстве"
```

### UZ words masquerading as brand names (NOT whitelisted)

These look brand-like but ARE Uzbek words — they MUST be translated:

```
Bitim, Bitimlar, Lid, Lidlar, Sof, Avans, Daromad, Xarajat,
Mijoz, Ombor, Sklad, Smena, Tovar, Yetkazib, Yetkazish,
Buyurtma, Buyurtmalar, Hisob, Hisobot, Hisobotlar, Lavozim,
Bo'lim, Boshqaruv, Panel, Paneli, Dashbord, Dashbordi
```

### DETECTION REGEX (for static + DOM scan)

```javascript
// Uzbek detector — high signal patterns
const UZBEK_PATTERNS = [
  /\bo'\w/i,           // o' modifier
  /\bg'\w/i,           // g' modifier
  /\w'(?=\w)/i,        // any apostrophe inside word
  /\b\w+lar\b/i,       // -lar plural (but check against whitelist)
  /\b\w+ning\b/i,      // -ning genitive
  /\b\w+(da|ga|dan)\b/i, // common case endings
  /\byo'q\b/i,
  /\bbor\b/i,
  /\bta\b/i,           // counter
  /\bbilan\b/i,
  /\buchun\b/i,
  // ... include full vocabulary from above
];

const UZBEK_WORDS_WHITELIST_AS_PROPER = new Set([
  // Empty — no Uzbek word is whitelisted as proper noun
]);

const TECHNICAL_WHITELIST = new Set([
  'API', 'URL', 'JWT', 'OAuth', 'KPI', 'OEE', 'RBAC', 'SOS',
  'EuroPrint', 'Telegram', 'WhatsApp', // ... full list
]);

function isUzbekLeak(text, locale) {
  if (locale !== 'ru') return false;
  // Strip whitelisted tokens
  const stripped = text.split(/\s+/)
    .filter(t => !TECHNICAL_WHITELIST.has(t))
    .join(' ');
  return UZBEK_PATTERNS.some(rx => rx.test(stripped));
}
```

---

## MULTI-AGENT ARCHITECTURE

You will orchestrate 6 sub-agents to execute this mission:

```
┌──────────────────────────────────────────────────────────┐
│  ORCHESTRATOR (you)                                       │
│  Plans phases, dispatches sub-agents, integrates results  │
└────────────────────────┬─────────────────────────────────┘
                         │
   ┌─────────────┬──────┴──────┬─────────────┬─────────────┬─────────────┐
   ▼             ▼             ▼             ▼             ▼             ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ STATIC   │ │ DYNAMIC  │ │ MIXED-   │ │ FIXER    │ │ REVIEWER │ │ AUDITOR  │
│ SCANNER  │ │ RENDERER │ │ LANG     │ │ WORKER   │ │ AGENT    │ │ AGENT    │
│ (grep)   │ │ (Playwright)│ │ DETECTOR │ │ (per-pg) │ │ (PR rev) │ │ (final)  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Agent 1: Static Scanner

Scans source code for hardcoded strings. Outputs CSV with all candidates.

### Agent 2: Dynamic Renderer

Uses Playwright to load each page in RU and UZ locale, captures HTML and screenshot.

### Agent 3: Mixed-Language Detector

Runs detection regex against rendered HTML. Identifies leaks with severity.

### Agent 4: Fixer Worker

Per page, fixes the specific leaks identified. One agent per ~50 pages.

### Agent 5: Reviewer Agent

After each Fixer PR — verifies the fix actually works (re-renders, re-detects).

### Agent 6: Auditor Agent

At end, runs the entire pipeline again as fresh validation.

---

## EXECUTION PROTOCOL — 5 PHASES

### PHASE 1 — Build the detection infrastructure (Day 1-2)

#### Step 1.1: Create the universal language detector

File: `scripts/i18n-leak-detector.mjs`

```javascript
#!/usr/bin/env node
/**
 * Universal i18n leakage detector.
 * Takes rendered HTML and a target locale, returns list of leaks.
 *
 * Usage:
 *   node scripts/i18n-leak-detector.mjs --html <file.html> --locale ru
 *   echo "<div>Сделка yo'q</div>" | node scripts/i18n-leak-detector.mjs --locale ru
 */

import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';

// === DICTIONARIES === (paste from detection vocabulary above)
const UZBEK_PATTERNS = [/* ... */];
const TECHNICAL_WHITELIST = new Set([/* ... */]);

function detectLeaks(html, locale) {
  const dom = new JSDOM(html);
  const textNodes = [];
  const walker = dom.window.document.createTreeWalker(
    dom.window.document.body,
    dom.window.NodeFilter.SHOW_TEXT
  );
  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent?.trim();
    if (!text || text.length < 2) continue;
    if (isLeakage(text, locale)) {
      textNodes.push({
        text,
        path: getXPath(node),
        leak_type: classifyLeak(text, locale),
        severity: severity(text, locale),
      });
    }
  }
  return textNodes;
}

// Implementation details follow...
```

**Test it:**
```bash
echo '<div>Сделка yo`q</div>' | node scripts/i18n-leak-detector.mjs --locale ru
# Expected: { leak_count: 2, leaks: [{ text: "Сделка yo'q", leak_type: "MIXED_LANG", severity: "high" }] }
```

#### Step 1.2: Create the route discovery script

File: `scripts/i18n-discover-routes.mjs`

Reads `artifacts/erp-dashboard/src/routes/*.tsx` and extracts ALL routes with their auth requirements.

Output: `docs/i18n-routes.json`

```json
{
  "routes": [
    { "path": "/dashboard", "page": "DirectorDashboard.tsx", "requires_role": ["director"] },
    { "path": "/sales", "page": "SalesDashboard.tsx", "requires_role": ["sales", "director"] },
    ... 958 routes
  ]
}
```

#### Step 1.3: Create the universal Playwright leakage tester

File: `artifacts/erp-dashboard/e2e/i18n-leakage.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import routes from '../../../docs/i18n-routes.json';
import { detectLeaks } from '../../../scripts/i18n-leak-detector.mjs';

const LOCALES = ['ru', 'uz'] as const;

for (const locale of LOCALES) {
  for (const route of routes.routes) {
    test(`[${locale}] ${route.path} has no language leakage`, async ({ page }) => {
      // 1. Login as user with appropriate role
      await loginAs(page, route.requires_role[0] ?? 'admin');

      // 2. Set locale
      await page.evaluate((loc) => {
        localStorage.setItem('i18nextLng', loc);
      }, locale);

      // 3. Navigate to route
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');

      // 4. Extract full body HTML
      const html = await page.content();

      // 5. Detect leakage
      const leaks = detectLeaks(html, locale);

      // 6. Screenshot if leaks (for visual diff)
      if (leaks.length > 0) {
        await page.screenshot({
          path: `test-results/leaks/${locale}-${route.path.replace(/\//g, '_')}.png`,
          fullPage: true,
        });
      }

      // 7. Assert no leaks
      expect(leaks, `Leaks found: ${JSON.stringify(leaks, null, 2)}`).toHaveLength(0);
    });
  }
}
```

This is the single source of truth. **Until this test passes, the work is not done.**

#### Step 1.4: Create the baseline measurement

Run the leakage test ONCE on the current codebase:

```bash
pnpm --filter erp-dashboard test:e2e -- --grep "language leakage" --reporter=json > docs/i18n-leakage-baseline.json
```

Expected baseline (from screenshots): hundreds of failures.
Save to `docs/i18n-leakage-baseline.json`.

#### Step 1.5: Set up CI gate

Edit `.github/workflows/code-quality.yml`:

```yaml
i18n-leakage-gate:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v3
    - run: pnpm install --frozen-lockfile
    - run: pnpm --filter erp-dashboard exec playwright install --with-deps chromium
    - run: pnpm --filter erp-dashboard run test:e2e -- --grep "language leakage" --reporter=json --output-dir=i18n-results
    - name: Upload leak screenshots
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: i18n-leak-screenshots
        path: artifacts/erp-dashboard/test-results/leaks/
    - name: Fail if any leaks
      run: |
        FAILED=$(cat i18n-results/results.json | jq '.suites[].specs[] | select(.tests[].results[].status == "failed") | .title' | wc -l)
        if [ "$FAILED" -gt 0 ]; then
          echo "❌ $FAILED i18n leakage tests failed"
          exit 1
        fi
```

After Phase 1: CI is RED. Every PR shows leakage screenshots. **Visibility achieved.**

---

### PHASE 2 — Per-page fixing (Day 3-15) — bulk of the work

#### Step 2.1: Group leaks by file

Run a one-time analyzer:

```bash
node scripts/i18n-group-leaks-by-source.mjs > docs/i18n-leaks-by-file.json
```

This script:
1. Takes Playwright leakage results.
2. For each leak `text`, runs `grep -rn "<text>"` against `src/` to find source.
3. Outputs a map: `file -> [leak1, leak2, ...]`

Expected shape:
```json
{
  "pages/SalesDashboard.tsx": [
    { "text": "Meneger Paneli", "line": 47, "context": "<h1>Meneger Paneli</h1>" },
    { "text": "Sotuv moduli kengaytirilgan", "line": 51, "context": "<p>..." }
  ],
  "components/AppSidebar.tsx": [
    { "text": "Kvota Dashboard", "line": 89, "context": "{ label: 'Kvota Dashboard'" }
  ]
}
```

#### Step 2.2: Dispatch Fixer Workers in batches of 50 pages

Each Fixer Worker gets this prompt:

```
You are a Fixer Worker. Your batch: [list of 50 pages with leaks].

For EACH leak:
1. Open the source file at the indicated line.
2. Understand the leak type:
   - HARDCODED_PROP   — JSX prop with string literal → wrap in t()
   - HARDCODED_TEXT   — JSX text content → wrap in t()
   - ROUTE_CONFIG     — sidebar/route config with hardcoded label → wrap in t()
   - TEMPLATE_LITERAL — `${x} ta`  → use interpolation: t('common.itemCount', { count: x })
   - DYNAMIC_OBJECT   — object with hardcoded keys (e.g. statusMap) → use t() for values
   - BACKEND_RESPONSE — API returns Uzbek string → fix backend OR map in frontend
   - EMPTY_STATE      — fallback string → use t('common.empty')
   - TOAST_MESSAGE    — toast() call → use t()

3. Choose canonical i18n key:
   - Module: `t('sales.meneger.title')`  if specific
   - Common: `t('common.actions.save')`  if generic

4. Update BOTH locale files:
   - locales/uz/<module>.json — Uzbek translation
   - locales/ru/<module>.json — Russian translation

5. Run `pnpm --filter erp-dashboard run typecheck` — must pass
6. Run `pnpm --filter erp-dashboard run lint` — must pass
7. Run targeted Playwright test for these pages:
   ```
   pnpm --filter erp-dashboard test:e2e -- --grep "<route_path>"
   ```
8. Verify leaks went from N to 0 for those pages

9. Commit: `fix(i18n): eliminate leaks in <module> (batch N)`

DO NOT proceed to next batch until current batch has 0 leaks.
```

#### Step 2.3: Common fix patterns library

Create `scripts/i18n-fix-patterns.md` documenting every fix pattern. Excerpts:

**Pattern A — Hardcoded JSX text:**
```tsx
// BEFORE
<h1>Meneger Paneli</h1>

// AFTER
import { useTranslation } from 'react-i18next';
const { t } = useTranslation('sales');
<h1>{t('manager.title')}</h1>

// uz/sales.json: "manager": { "title": "Menejer paneli" }
// ru/sales.json: "manager": { "title": "Панель менеджера" }
```

**Pattern B — Route config arrays:**
```tsx
// BEFORE
const SIDEBAR_ITEMS = [
  { label: 'Kvota Dashboard', path: '/quota' },
  { label: 'Ombor Ijara', path: '/warehouse-rent' },
];

// AFTER
const SIDEBAR_ITEMS = [
  { labelKey: 'sales.sidebar.quotaDashboard', path: '/quota' },
  { labelKey: 'sales.sidebar.warehouseRent', path: '/warehouse-rent' },
];

// In component:
<a>{t(item.labelKey)}</a>
```

**Pattern C — Template literals:**
```tsx
// BEFORE
const text = `${count} ta o'tdi`;

// AFTER
const text = t('common.passedCount', { count });

// uz/common.json: "passedCount_one": "{{count}} ta o'tdi", "passedCount_other": "{{count}} ta o'tdi"
// ru/common.json: "passedCount_one": "{{count}} пройдено", "passedCount_other": "{{count}} пройдено"
```

**Pattern D — Status maps with Uzbek values:**
```tsx
// BEFORE
const STATUS_LABELS = {
  new: 'Yangi',
  in_progress: 'Bajarilmoqda',
  done: 'Yakunlangan',
};

// AFTER
const useStatusLabels = () => {
  const { t } = useTranslation('common');
  return {
    new: t('status.new'),
    in_progress: t('status.inProgress'),
    done: t('status.done'),
  };
};
```

**Pattern E — Backend API returns Uzbek:**
```typescript
// BEFORE — backend
@Get('/deals')
findAll() {
  return [{ id: 1, status: 'Yangi' }];  // ❌ Uzbek
}

// AFTER — backend returns code, frontend translates
@Get('/deals')
findAll() {
  return [{ id: 1, status_code: 'NEW' }];  // ✅ enum code
}

// Frontend
<Badge>{t(`deal.status.${deal.status_code.toLowerCase()}`)}</Badge>
```

**Pattern F — Chat panel / overlay components:**
```tsx
// BEFORE — InternalChat.tsx
<Input placeholder="Chatlarni поиск..." />
<Button>Новый chat boshlash</Button>

// AFTER
<Input placeholder={t('chat.searchPlaceholder')} />
<Button>{t('chat.startNew')}</Button>
```

#### Step 2.4: Track progress

After each batch, append to `docs/i18n-progress.md`:

```markdown
## Batch N (Date)

| Pages processed | Leaks before | Leaks after | Files modified | New i18n keys |
|----------------:|-------------:|------------:|---------------:|--------------:|
| 50              | 287          | 0           | 67             | 192           |

Notes: ...
```

---

### PHASE 3 — Dynamic content & backend (Day 16-20)

After all pages render clean, handle the harder cases:

#### Step 3.1: Audit dynamic / API-driven content

Run app in RU locale, open each major page, capture **runtime** strings (not just SSR):

```typescript
// e2e/i18n-runtime-leakage.spec.ts
test('runtime mutations do not leak Uzbek', async ({ page }) => {
  await loginAs(page, 'director');
  await page.evaluate(() => localStorage.setItem('i18nextLng', 'ru'));
  await page.goto('/sales');

  // Trigger interactive elements
  await page.click('button:has-text("Создать заказ")');
  await page.fill('input[name="customer"]', 'UzPaper');
  await page.click('button[type=submit]');

  // After mutation, page should show success toast — must be RU
  const toast = await page.locator('[role=alert]').textContent();
  expect(toast).not.toMatch(UZBEK_REGEX);
});
```

#### Step 3.2: Backend error message audit

Backend errors come via `errors.json`. Verify every error code maps to BOTH languages:

```bash
node scripts/i18n-backend-error-audit.mjs
```

Script:
1. Lists every `throw new XxxException({ code: 'ERR.X' })` in backend
2. Verifies `apps/api/src/locales/{uz,ru}/errors.json` has key for each code
3. Reports missing/inconsistent

#### Step 3.3: Database labels audit

Some labels come from DB (e.g. `position_name`, `department_name`). Audit each table:

```sql
SELECT 'departments' AS source, name FROM departments WHERE name ~ '[А-Яа-яЁё]'
UNION ALL
SELECT 'positions', name FROM positions WHERE name ~ '[А-Яа-яЁё]'
UNION ALL
SELECT 'departments', name FROM departments WHERE name !~ '[А-Яа-яЁё]' AND name ~ '[A-Za-z]';
```

If found — add `name_uz`, `name_ru` columns and migrate.

---

### PHASE 4 — Hardening (Day 21-23)

#### Step 4.1: ESLint rule

`.eslintrc.cjs` addition:

```javascript
{
  rules: {
    'react/jsx-no-literals': ['error', {
      ignoreProps: false,
      noStrings: true,
      allowedStrings: [
        'EuroPrint', 'Telegram', 'API', 'KPI', // etc. full whitelist
      ],
    }],
    'i18n/no-literal-jsx': 'error',
  },
}
```

This blocks any new hardcoded string from being introduced.

#### Step 4.2: Pre-commit hook

`.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run i18n leak detector on changed pages
CHANGED_PAGES=$(git diff --cached --name-only --diff-filter=ACM | grep -E "src/(pages|components)/.*\.tsx$" || true)
if [ -n "$CHANGED_PAGES" ]; then
  echo "Running i18n quick scan on changed pages..."
  pnpm --filter erp-dashboard test:e2e -- --grep "leakage" --grep-pages="$CHANGED_PAGES" || {
    echo "❌ i18n leakage detected. Fix before commit."
    exit 1
  }
fi
```

#### Step 4.3: Storybook with locale toggle

For every component, ensure Storybook renders it in BOTH locales:

```tsx
// MyComponent.stories.tsx
export const RU: Story = {
  parameters: { locale: 'ru' },
};
export const UZ: Story = {
  parameters: { locale: 'uz' },
};
```

Run Chromatic visual regression — any locale-related visual difference fails the build.

---

### PHASE 5 — Final audit & sign-off (Day 24-28)

#### Step 5.1: Run full pipeline as fresh validation

```bash
# Clear caches
rm -rf node_modules/.vite test-results/

# Full re-run
pnpm install
pnpm --filter erp-dashboard run build
pnpm --filter erp-dashboard test:e2e -- --grep "leakage" --reporter=html

# Check report
open artifacts/erp-dashboard/test-results/index.html
```

#### Step 5.2: Visual diff comparison

Generate side-by-side: baseline screenshot (Day 0) vs final (Day 28).

For top 50 most-visited pages, manually verify each looks correct in both locales.

#### Step 5.3: Director sign-off

Run real Director user on a staging environment:

1. Open `/dashboard` in RU. Take screenshot. Director reviews.
2. Toggle to UZ. Take screenshot. Director reviews.
3. Navigate 10 main pages in both modes.
4. Open chat overlay, create order, view report — all must be clean.

If Director approves — sign off.

#### Step 5.4: Final report

`docs/i18n-leakage-final-report.md`:

```markdown
# i18n Leakage Eliminator — Final Report

## Mission accomplished

**Start state:** 287 leaks across 187 pages
**End state:** 0 leaks across all 958 pages
**Duration:** 28 days
**PRs:** 47 (avg 6 pages each)

## Coverage

| Locale | Pages tested | Pages clean | Coverage |
|--------|-------------:|------------:|---------:|
| RU     | 958          | 958         | 100%     |
| UZ     | 958          | 958         | 100%     |

## Hardening

- ESLint `jsx-no-literals` enabled
- Pre-commit hook scans changed files
- CI gate runs full Playwright suite on every PR
- Chromatic visual regression covers components in both locales

## Lessons learned

- Previous "100% complete" measured JSON files, not DOM
- Largest leak categories: route configs (32%), template literals (24%),
  status maps (18%), backend responses (15%), empty states (11%)
- Static analysis caught 68% of leaks; only Playwright DOM detection caught
  the remaining 32% (dynamic / runtime)
```

---

## ANTI-PATTERNS — NEVER DO

- ❌ Measure i18n completion by counting JSON keys
- ❌ Trust a `useTranslation` import without verifying `t()` is called for every visible string
- ❌ Skip pages because "they look fine"
- ❌ Add a string to JSON but forget to use it in code
- ❌ Use `t('key', { defaultValue: 'Uzbek text' })` — the default leaks
- ❌ Translate one direction only (RU done, UZ still mixed)
- ❌ Mark task done without Playwright test passing
- ❌ Whitelist Uzbek words as "brand names"
- ❌ Modify backend response shape without updating frontend
- ❌ Ship without ESLint + pre-commit + CI gates active

---

## SUCCESS CHECKLIST (must all be true)

- [ ] `scripts/i18n-leak-detector.mjs` exists and is tested
- [ ] `e2e/i18n-leakage.spec.ts` runs for all 958 routes × 2 locales
- [ ] Baseline measured and recorded (`docs/i18n-leakage-baseline.json`)
- [ ] Phase 2 — every page fix has its commit + screenshot
- [ ] Phase 3 — backend errors, DB labels, dynamic content audited
- [ ] Phase 4 — ESLint rule active, pre-commit hook running, Storybook locale stories exist
- [ ] Final Playwright run: 0 failures across 1,916 test cases (958 × 2)
- [ ] Director sign-off screenshot captured
- [ ] `docs/i18n-leakage-final-report.md` written

---

## REPORTING — DAILY UPDATE

Every day during execution, append one line to `docs/i18n-progress.md`:

```
Day N | Pages fixed today: X | Total clean: Y / 958 | Leaks remaining: Z | Time: Hh
```

Example:
```
Day 5 | Pages fixed today: 48 | Total clean: 187 / 958 | Leaks remaining: 1,247 | Time: 8h
Day 6 | Pages fixed today: 52 | Total clean: 239 / 958 | Leaks remaining: 1,082 | Time: 7h
```

---

## ONE-SENTENCE GOAL

> Eliminate every Uzbek word from RU-rendered DOM and every Russian word from UZ-rendered DOM across all 958 pages, verified by Playwright on every PR, with ESLint blocking regressions — until visual screenshots from a real user prove zero language leakage end-to-end.

---

## NOW BEGIN

1. Request one-time permission (above)
2. Build Phase 1 detector + Playwright suite + CI gate
3. Run baseline measurement — record the failures
4. Group leaks by source file
5. Dispatch Fixer Workers in batches of 50
6. Per batch: fix → typecheck → lint → Playwright → commit
7. After all pages: Phase 3 (backend/dynamic) → Phase 4 (hardening) → Phase 5 (sign-off)
8. Report daily

Do not stop until the final checklist is ALL ticked. This will take 3-4 weeks of autonomous work. That is the cost of the previous "100% complete" lie.
