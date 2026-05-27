# Report 19 — i18n Coverage

**Date:** 2026-05-27 (v2 pass)
**Analyst:** Forensic re-audit (read-only)
**Scope:** Frontend `artifacts/erp-dashboard/src/locales/`, `artifacts/erp-dashboard/src/lib/i18n/`, `artifacts/erp-dashboard/src/pos-monitor/i18n/` · Backend `apps/api/src/i18n/`

---

## Diff vs round 1

Round 1's summary picture is broadly directionally correct on two points — there is severe lop-sidedness between the locale directories, and TSX files have a huge amount of hardcoded Cyrillic. But almost every specific number it published is **wrong**, and it missed the single most important finding in the module:

1. **Locale count miscount.** Round 1 wrote: "Supported languages: `uz` (UZ-Latin), `uz-cyr` (UZ-Cyrillic), `ru` (Russian)" (round 1 lines 16–17). That is true of the **directories on disk**, but the application's `SUPPORTED_LANGUAGES` constant in `artifacts/erp-dashboard/src/lib/i18n/constants.ts:6` is `['uz', 'ru']` — `uz-cyr` is **not** a supported language. The entire `locales/uz-cyr/` directory (~15,797 keys, 240,112 Cyrillic characters) is **dead code** that no codepath in the dashboard reads. The `LanguageSwitcher` only renders UZ and RU. Round 1 did not flag this.

2. **uz-cyr is never imported.** `lib/i18n/loader.ts` (lines 9–109) imports **only** `uz/*.json` and `ru/*.json`. There is no `uzCyr*` import block. `ALL_TRANSLATIONS` (lines 112–217) is keyed by `'uz'` and `'ru'` only. Round 1 missed this and instead built a per-namespace key-count table for uz-cyr as if it were a runtime locale.

3. **Round 1 navigation parity claim is inverted.** Round 1 said "`uz/navigation.json` is missing 486 keys that exist in `uz-cyr/navigation.json`" (round 1 line 75, gaps table line 185). Re-running the diff with a tolerant parser (the raw file is malformed — see point 4) shows:
   - `uz-cyr/navigation.json` (685 keys) − `uz/navigation.json` (~669 reconstructable keys) = **16 keys missing from uz**, not 486.
   - `uz-cyr/navigation.json` (685 keys) − `ru/navigation.json` (199 keys) = **486 keys missing from ru**.
   The 486-key gap is between **uz-cyr and ru**, not between uz-cyr and uz. And in any case, since uz-cyr is unreachable, neither gap surfaces at runtime — the runtime gap is `uz (669 reconstructable)` vs `ru (199)` = **470 navigation keys missing from RU**.

4. **CRITICAL — Round 1 missed that 16 of the `uz/*.json` files are corrupt (truncated).** They end mid-string, with no closing `}`. Python's strict JSON parser refuses to load them; the static-import build pipeline (Vite + TypeScript `resolveJsonModule`) will reject them too. Round 1's key-count table for `uz/` (round 1 lines 35–48) must have come from a non-strict parser or a stale snapshot; the file sizes on disk today cannot contain those counts. Detailed list in §2.

5. **Round 1's "2,241 Cyrillic chars in uz/*.json" claim is wrong.** Re-running the Cyrillic regex `[Ѐ-ӿԀ-ԯ]` over `locales/uz/*.json` gives **0 matches** in every parseable file. The 221 Cyrillic chars I do find live in `uz/common.json.bak.t2c` — a backup file, not consumed by the loader. Round 1's table (round 1 lines 92–105) attributing 1,440 Cyrillic chars to `uz/warehouse.json`, 312 to `uz/common.json`, etc. is not reproducible. Either the source files were cleaned between the two passes or the round-1 measurement was incorrect.

6. **Round 1's "5 empty namespaces" claim is half-right.** `adaptation/analytics/employee-profile/erp/planning.json` are indeed empty (`{}`) in `uz-cyr/` and `ru/`. But in `uz/` those files **contain content** (3–4 keys each) and are corrupted — see §4.

7. **109 TSX files with 13,215 hardcoded Cyrillic chars — confirmed (matches round 1).**

8. **Backend i18n** — Round 1's description is mostly right but missed that `apps/api/src/i18n/uz-cyr/` is loaded by `I18nModule` (which globs all subdirectories of `path`) yet `SUPPORTED_LANGUAGES` mismatch with frontend means the backend will honor `Accept-Language: uz-cyr` while the frontend cannot send it. See §8.

---

## 1. Supported languages & locale layout

### 1.1 Locale directories on disk

```
artifacts/erp-dashboard/src/locales/
  _RU_UNTRANSLATED_AUDIT.md
  uz/        (56 entries — 55 .json + 1 .bak.t2c)
  uz-cyr/    (55 entries — 55 .json)
  ru/        (56 entries — 55 .json + 1 .bak.t2c)

artifacts/erp-dashboard/src/pos-monitor/i18n/
  uz.json
  uz-cyr.json
  ru.json
  usePosI18n.ts

apps/api/src/i18n/
  README.md
  uz/        (6 .json — auth, common, errors, messages, telegram, validation)
  uz-cyr/    (6 .json — same set)
  ru/        (6 .json — same set)
```

### 1.2 Frontend dashboard — actually supported languages

`artifacts/erp-dashboard/src/lib/i18n/constants.ts:6`:

```ts
export const SUPPORTED_LANGUAGES = ['uz', 'ru'] as const;
```

`artifacts/erp-dashboard/src/lib/i18n/constants.ts:20-22`:

```ts
export const LANGUAGE_LABELS: Record<...> = {
  uz: { label: "O'zbekcha", shortCode: 'UZ', flag: '🇺🇿' },
  ru: { label: 'Русский',   shortCode: 'RU', flag: '🇷🇺' },
};
```

`artifacts/erp-dashboard/src/components/LanguageSwitcher.tsx:18-21`:

```ts
const languages: { code: Language; label: string; shortCode: string }[] = [
  { code: 'uz', label: tLabel('common.LanguageSwitcher.tsx.ozbekcha', "O'zbekcha"), shortCode: 'UZ' },
  { code: 'ru', label: tLabel('common.LanguageSwitcher.tsx.untitled', 'Русский'), shortCode: 'RU' },
];
```

The `Language` type narrows to `'uz' | 'ru'` (`types.ts:9`). Anything stored in `localStorage['europrint_language']` other than `'uz'` or `'ru'` falls back to `'uz'` via the `SUPPORTED_LANGUAGES.includes(stored)` guards in `utils.ts:20-32`.

**Conclusion — main dashboard: 2 languages.** The 55-file `locales/uz-cyr/` tree is orphaned.

### 1.3 POS-monitor sub-app — actually supported languages

`artifacts/erp-dashboard/src/pos-monitor/i18n/usePosI18n.ts:11`:

```ts
type Lang = "uz" | "uz-cyr" | "ru";
```

`usePosI18n.ts:14-18`:

```ts
const TRANSLATIONS: Record<Lang, DeepRecord> = {
  uz: uz as unknown as DeepRecord,
  'uz-cyr': uzCyr as unknown as DeepRecord,
  ru: ru as unknown as DeepRecord,
};
```

`usePosI18n.ts:58-60`:

```ts
const toggleLang = useCallback(() => {
  // 3-way cycle: uz → uz-cyr → ru → uz
  const next: Lang = lang === "uz" ? "uz-cyr" : lang === "uz-cyr" ? "ru" : "uz";
```

**POS monitor: 3 languages.** Its own self-contained i18n system, separate `localStorage` key (`pos_lang`), separate loader. The main dashboard's `uz-cyr/` directory is never read by the POS monitor either.

### 1.4 Backend — actually supported languages

`apps/api/src/app.module.ts:101-115`:

```ts
I18nModule.forRoot({
  fallbackLanguage: 'uz',
  loaderOptions: {
    path: path.join(__dirname, '/i18n/'),
    watch: process.env.NODE_ENV !== 'production',
  },
  resolvers: [
    { use: QueryResolver, options: ['lang'] },
    new HeaderResolver(['x-lang']),
    AcceptLanguageResolver,
  ],
  ...
```

`nestjs-i18n`'s default loader globs every immediate subdirectory of `loaderOptions.path` and treats each as a language. With `uz/`, `uz-cyr/`, and `ru/` all present, the backend **accepts all three locale codes** in incoming `Accept-Language` / `x-lang` / `?lang` requests. Cross-tier mismatch:

- Frontend dashboard sends only `Accept-Language: uz` or `Accept-Language: ru` (Language type narrowed).
- Backend would happily serve `uz-cyr` if anything asked it to.
- POS monitor stores `uz-cyr` in `localStorage.pos_lang` but I see no `fetch()` call wiring it into `Accept-Language` — see §8.

### 1.5 Summary table

| Tier              | Languages exposed in UI | Locale dirs on disk | Notes |
|-------------------|-------------------------|---------------------|-------|
| Main dashboard    | uz, ru                  | uz, uz-cyr, ru      | `uz-cyr/` is dead code (not imported in `loader.ts`) |
| POS monitor       | uz, uz-cyr, ru          | uz, uz-cyr, ru (in `pos-monitor/i18n/`) | Independent system |
| Backend API       | uz, uz-cyr, ru (any header) | uz, uz-cyr, ru | nestjs-i18n auto-loads all 3 |

---

## 2. uz-latin vs uz-cyr key parity

Round 1 claim: **"uz-latin missing 486 navigation keys present in uz-cyr"** — incorrect on two levels (count + direction).

### 2.1 Reproducing the diff

`artifacts/erp-dashboard/src/locales/uz/navigation.json` is **truncated**. Raw bytes end at:

```
$ tail -c 100 artifacts/erp-dashboard/src/locales/uz/navigation.json
",
  "topXavfsizlikKirishJurnali": "Kirish Jurnali",
  "topXavfsizli
```

No closing brace, no comma, the last key-value pair is severed mid-value. `python3 -c "json.load(...)"` raises:

```
json.decoder.JSONDecodeError: Unterminated string starting at: line 671 column 3 (char 26554)
```

Reconstructing the file by trimming after the last complete `,\n` and appending `\n}\n` yields **669 parseable keys**. The intact `uz-cyr/navigation.json` parses cleanly to **685 keys**. Diff:

| Direction                                    | Missing-key count |
|----------------------------------------------|-------------------|
| In `uz-cyr/navigation.json` not in `uz/`     | **16**            |
| In `uz/navigation.json` not in `uz-cyr/`     | 0                 |
| In `uz-cyr/navigation.json` not in `ru/`     | **486**           |
| In `ru/navigation.json` not in `uz-cyr/`     | 0                 |

The **486-key gap is between uz-cyr and ru, not between uz-cyr and uz**. The 16 keys missing from uz are:

```
HR, topDirectorAuditor, topDirectorBuxgalterKorinish, topDirectorDirektorPaneli,
topDirectorIntegratsiyalar, topDirectorMijozlarSaytiApi, topDirectorModule,
topDirectorQcModuli, topDirectorSuperAdmin, topDirectorTelegramBot,
topDirectorTizimMonitoring, topOtherArizalar, topOtherModule, topOtherSozlamalar,
topXavfsizlikKameraXavfsizlik, topXavfsizlikMroDashboard
```

These 16 keys did not "make it" into `uz/` because the file was truncated mid-stream before the last batch could be appended.

### 2.2 All-namespace key counts (frontend dashboard)

Generated by `json.load` + flatten + `len(set(...))` per namespace. Where `uz/` is corrupt, the cell shows `ERR`; the table below is exhaustive.

| Namespace               |    uz |  uz-cyr |    ru | Status |
|-------------------------|------:|--------:|------:|--------|
| adaptation.json         | ERR†  |       0 |     0 | uz corrupt, others empty |
| admin.json              |    92 |      92 |    92 | parity |
| ai.json                 |   225 |     225 |   225 | parity |
| aisha.json              |    52 |      52 |    52 | parity |
| analytics.json          | ERR†  |       0 |     0 | uz corrupt, others empty |
| auth.json               |    84 |      84 |    84 | parity |
| barcode.json            |     7 |       7 |     7 | parity |
| calc.json               |     4 |       4 |     4 | parity |
| common.json             | ERR   |    9528 |  8495 | uz corrupt; uz-cyr 1033 more than ru |
| contact.json            |     1 |       1 |     1 | parity |
| coordination.json       | ERR   |      60 |    60 | uz corrupt |
| crm.json                |   468 |     470 |   468 | uz-cyr +2 |
| dashboard.json          |    68 |      68 |    68 | parity |
| design.json             |    78 |      78 |    78 | parity |
| director.json           | ERR   |     122 |   122 | uz corrupt |
| employee-profile.json   | ERR†  |       0 |     0 | uz corrupt, others empty |
| erp.json                | ERR†  |       0 |     0 | uz corrupt, others empty |
| errors.json             |    51 |      51 |    51 | parity |
| finance.json            | ERR   |     570 |   570 | uz corrupt |
| footer.json             |     2 |       2 |     2 | parity |
| glPosting.json          |     6 |       6 |     6 | parity |
| hr.json                 | ERR   |     639 |   598 | uz corrupt; uz-cyr +41 |
| inventory.json          |    12 |      12 |    12 | parity |
| iot.json                |   159 |     159 |   159 | parity |
| kanban.json             | ERR   |     139 |   104 | uz corrupt; uz-cyr +35 |
| ledger.json             |    11 |      11 |    11 | parity |
| lms.json                | ERR   |     156 |   156 | uz corrupt |
| logistics.json          |    69 |      69 |    69 | parity |
| lowstock.json           |     1 |       1 |     1 | parity |
| marketing.json          |   100 |     100 |   100 | parity |
| mes.json                |    83 |      83 |    83 | parity |
| movements.json          |     2 |       2 |     2 | parity |
| mro.json                |   410 |     410 |   410 | parity |
| myInventory.json        |    10 |      10 |    10 | parity |
| nav.json                |     4 |       4 |     4 | parity |
| navigation.json         | ERR   |     685 |   199 | uz corrupt; ru −486 |
| notifications.json      |    78 |      78 |    78 | parity |
| offline.json            |     3 |       3 |     3 | parity |
| planning.json           | ERR†  |       0 |     0 | uz corrupt, others empty |
| pos.json                |    71 |      71 |    71 | parity |
| print.json              |    62 |      62 |    62 | parity |
| production.json         | ERR   |     485 |   468 | uz corrupt; uz-cyr +17 |
| public.json             |   150 |     150 |   150 | parity |
| qc.json                 |   104 |     104 |   104 | parity |
| qcreview.json           |     3 |       3 |     3 | parity |
| quarantine.json         |     8 |       8 |     8 | parity |
| reports.json            |     5 |       5 |     5 | parity |
| requests.json           |    15 |      15 |    15 | parity |
| sd.json                 |   101 |     101 |   101 | parity |
| security.json           |    67 |      67 |    67 | parity |
| settings.json           | ERR   |      75 |    75 | uz corrupt |
| validation.json         |    29 |      29 |    29 | parity |
| variance.json           |    22 |      22 |    22 | parity |
| warehouse.json          | ERR   |     520 |   448 | uz corrupt; uz-cyr +72 |
| wms.json                |    99 |      99 |    99 | parity |

† `uz/<name>.json` actually contains 3–4 keys (`title`, `loading`, `error`) but is truncated — see §4.

Totals across the parseable cells:

- `uz` total (only parseable files): 2,816 keys
- `uz-cyr` total: 15,797 keys
- `ru` total: 14,111 keys

The "uz total is much smaller than ru" is purely an artifact of 16 truncated uz files — not a real translation gap.

### 2.3 What it means

The runtime story (assuming the Vite build doesn't outright reject the corrupt JSON via `resolveJsonModule`):

- `uz-cyr/` is unreachable, so its higher key counts are immaterial.
- For each non-corrupt uz/ru pair, parity holds.
- For corrupt `uz/` files, the import will either fail the build (likely with `Unexpected end of JSON input`) or silently produce `undefined`, which would then short-circuit `getTranslation` to fallback values. Either way, **the runtime gap between uz and ru is gated by whether the build tolerates corrupt JSON**.

---

## 3. Cyrillic chars in Latin bundles

Round 1 claim: **2,241 Cyrillic characters in `uz/*.json`** (round 1 lines 92–107). I cannot reproduce this.

### 3.1 Regex sweep of `locales/uz/*.json`

```python
cyrillic_re = re.compile(r'[Ѐ-ӿԀ-ԯ]')  # U+0400-U+04FF + U+0500-U+052F
for fn in os.listdir('artifacts/erp-dashboard/src/locales/uz'):
    if fn.endswith('.json'):
        text = open(f'.../uz/{fn}', encoding='utf-8', errors='replace').read()
        n = len(cyrillic_re.findall(text))
        if n: print(fn, n)
```

Result: **0 matches in every `.json` file in `locales/uz/`**. Total: 0.

Confirmed independently with ripgrep:

```
$ grep -rn '[А-Яа-яЁёҚқҒғҲҳЎўӢӣ]' artifacts/erp-dashboard/src/locales/uz/*.json
(no matches)
```

The only Cyrillic in the `uz/` directory is in the `.bak.t2c` backup:

| File                                              | Cyrillic chars |
|---------------------------------------------------|---------------:|
| `artifacts/erp-dashboard/src/locales/uz/common.json.bak.t2c` | 221 |

This file is not imported by `loader.ts` (see imports list, lines 9–58 of `loader.ts`); it sits on disk only as a leftover from the `t2c` (transliterate-to-cyrillic) tool. It does not reach users.

### 3.2 For reference — Cyrillic counts in `ru/` and `uz-cyr/`

These are expected to be high; the table is for sanity-checking the methodology:

- `uz-cyr/*` total Cyrillic: **240,112** chars (expected — uz-cyr is Cyrillic).
- `ru/*` total Cyrillic: **165,800+** chars across all 55 namespace files (sample: `ru/common.json` 93,233; `ru/hr.json` 7,950; `ru/crm.json` 5,990).

So the regex works; the round-1 result for `uz/` is just not reproducible against the current tree. Either (a) the source files were cleaned up between the two passes, or (b) round 1 measured the wrong files.

### 3.3 Caveat — Romanized Cyrillic in uz/ via Unicode digits 0-9 (none found)

I also checked for stealth Cyrillic look-alikes (U+0430 `а`, U+0435 `е`, U+043E `о`, U+0440 `р`, U+0441 `с`, U+0445 `х`) embedded inside otherwise-Latin words. Still 0.

**Conclusion: Cyrillic-in-Latin claim is unsubstantiated in the current tree.** Drop this P0.

---

## 4. Empty namespaces

Round 1 claim: **5 empty namespaces** (`adaptation`, `analytics`, `employee-profile`, `erp`, `planning`) — partially correct.

### 4.1 Reproducing

| File path                                                       | Bytes | Content                              | Parses? |
|-----------------------------------------------------------------|-------|--------------------------------------|---------|
| `locales/uz/adaptation.json`                                    | 92    | 3 keys, **no closing `}`**           | NO      |
| `locales/uz/analytics.json`                                     | 87    | 3 keys, **no closing `}`**           | NO      |
| `locales/uz/employee-profile.json`                              | 94    | 3 keys, **no closing `}`**           | NO      |
| `locales/uz/erp.json`                                           | 91    | 3 keys, **no closing `}`**           | NO      |
| `locales/uz/planning.json`                                      | 95    | 3 keys, **no closing `}`**           | NO      |
| `locales/uz-cyr/adaptation.json`                                | ~3    | `{}` (literally empty)               | yes     |
| `locales/uz-cyr/analytics.json`                                 | ~3    | `{}`                                 | yes     |
| `locales/uz-cyr/employee-profile.json`                          | ~3    | `{}`                                 | yes     |
| `locales/uz-cyr/erp.json`                                       | ~3    | `{}`                                 | yes     |
| `locales/uz-cyr/planning.json`                                  | ~3    | `{}`                                 | yes     |
| `locales/ru/adaptation.json`                                    | ~3    | `{}`                                 | yes     |
| (…ru variants same as uz-cyr…)                                  |       |                                      |         |

Octal dump of `uz/adaptation.json` showing the truncation (last bytes are `e r d i "` — no `}` after):

```
0000000   {  \r  \n           "   t   i   t   l   e   "   :       "   A
0000020   d   a   p   t   a   t   s   i   y   a   "   ,  \r  \n
0000040   "   l   o   a   d   i   n   g   "   :       "   Y   u   k   l
0000060   a   n   m   o   q   d   a   .   .   .   "   ,  \r  \n
0000100   "   e   r   r   o   r   "   :       "   X   a   t   o   l   i
0000120   k       y   u   z       b   e   r   d   i   "
0000134
```

Same pattern across all 5. **The Read tool reports them as if they had a trailing `}` (because cat-n style display is forgiving), but the on-disk byte stream does not.**

### 4.2 Empty in 2 of 3 langs, corrupt in the third — net effect

- `uz-cyr/{adaptation,analytics,employee-profile,erp,planning}.json` — empty object, not consumed by the loader anyway.
- `ru/{...}.json` — empty object, **is** consumed by the loader. Module exports `{}`; `getCachedModule('ru', 'adaptation')` returns `{}`; every `t('someKey')` in the adaptation module falls through to the uz default, which is `getCachedModule('uz', 'adaptation')` — also `{}` if the build doesn't fail on the truncated uz file.
- `uz/{...}.json` — truncated. If the build accepts it (e.g. by some lenient JSON loader), users see no translations. If not, the build breaks.

Round 1's claim "5 namespaces are completely empty `{}` in all three languages" is wrong about the uz tier — those files have keys that the developer wrote but the file got chopped.

### 4.3 Other corrupt uz files (NOT in round 1)

The same truncation-without-closing-brace pattern was found in 11 more `uz/*.json` files. Complete list of corrupt JSON in `locales/uz/`:

| File                            | Parser error                                              | Truncated at                          |
|---------------------------------|-----------------------------------------------------------|---------------------------------------|
| `uz/adaptation.json`            | Expecting ',' delimiter: line 4 col 31 (char 89)          | mid-`"Xatolik yuz berdi"` no closer   |
| `uz/analytics.json`             | Expecting ',' delimiter: line 4 col 31 (char 84)          | same pattern                          |
| `uz/employee-profile.json`      | Expecting ',' delimiter: line 4 col 31 (char 91)          | same pattern                          |
| `uz/erp.json`                   | Expecting ',' delimiter: line 4 col 31 (char 88)          | same pattern                          |
| `uz/planning.json`              | Expecting ',' delimiter: line 4 col 31 (char 92)          | same pattern                          |
| `uz/common.json`                | Unterminated string: line 8348 col 3 (char 389364)        | `"yukXa` (mid-value)                  |
| `uz/coordination.json`          | Unterminated string: line 60 col 21 (char 3059)           | mid-value                             |
| `uz/director.json`              | Expecting property name: line 121 col 2 (char 4776)       | trailing comma + no key after         |
| `uz/finance.json`               | Unterminated string: line 558 col 3 (char 20532)          | mid-value                             |
| `uz/hr.json`                    | Unterminated string: line 589 col 38 (char 23048)         | mid-value                             |
| `uz/kanban.json`                | Unterminated string: line 104 col 3 (char 3301)           | mid-value                             |
| `uz/lms.json`                   | Unterminated string: line 154 col 20 (char 6190)          | mid-value                             |
| `uz/navigation.json`            | Unterminated string: line 671 col 3 (char 26554)          | `"topXavfsizli` mid-value             |
| `uz/production.json`            | Unterminated string: line 465 col 3 (char 19613)          | mid-value                             |
| `uz/settings.json`              | Unterminated string: line 75 col 3 (char 2586)            | mid-value                             |
| `uz/warehouse.json`             | Expecting ':' delimiter: line 438 col 17 (char 19047)     | mid-pair                              |

**16 of 55 `uz/*.json` files are syntactically broken JSON.** This is the dominant finding for this report — Round 1 didn't flag it. Possible cause: an automated transliteration / sync script aborted mid-write, or a `bak` swap left the originals truncated.

---

## 5. Hardcoded strings in TSX

Round 1's count of **109 TSX files with 13,215 Cyrillic chars** is reproducible.

### 5.1 Re-running the scan

```python
cyrillic_re = re.compile(r'[Ѐ-ӿԀ-ԯ]')
for path, ... os.walk('artifacts/erp-dashboard/src'):
    skip if '/locales' in path
    for *.tsx → count regex matches
```

Result: **109 files, 13,215 Cyrillic chars** — matches round 1 exactly.

### 5.2 Top 20 offenders

| File                                                                          | Cyrillic chars |
|-------------------------------------------------------------------------------|---------------:|
| `artifacts/erp-dashboard/src/pages/GLChartOfAccounts.tsx`                     | 522 |
| `artifacts/erp-dashboard/src/pages/camera-settings.tsx`                       | 505 |
| `artifacts/erp-dashboard/src/components/camera-ai/camera-ai.types.tsx`        | 481 |
| `artifacts/erp-dashboard/src/pages/iot/IoTCompletionReportSteps.tsx`          | 459 |
| `artifacts/erp-dashboard/src/pages/iot/IoTProductionDashboard.tsx`            | 432 |
| `artifacts/erp-dashboard/src/camera-ai-modern/pages/CameraAIModernHub.tsx`    | 414 |
| `artifacts/erp-dashboard/src/pages/camera-machines.tsx`                       | 345 |
| `artifacts/erp-dashboard/src/pages/camera-safety.tsx`                         | 312 |
| `artifacts/erp-dashboard/src/pages/camera-quality.tsx`                        | 299 |
| `artifacts/erp-dashboard/src/pages/camera-employees.tsx`                      | 293 |
| `artifacts/erp-dashboard/src/pages/iot/IoTProductionDashboardDialogs.tsx`     | 293 |
| `artifacts/erp-dashboard/src/pages/CoordinationPageDialogs.tsx`               | 285 |
| `artifacts/erp-dashboard/src/pages/planning/PlanningTabPanels.tsx`            | 285 |
| `artifacts/erp-dashboard/src/pages/CoordinationPage.tsx`                      | 277 |
| `artifacts/erp-dashboard/src/pages/iot/IoTChecklistModal.tsx`                 | 276 |
| `artifacts/erp-dashboard/src/pages/iot/IoTProductionDashboardSections.tsx`    | 275 |
| `artifacts/erp-dashboard/src/pages/WarehouseDailyViewDialogs.tsx`             | 255 |
| `artifacts/erp-dashboard/src/pages/WarehouseMaterialKitsDialogs.tsx`          | 240 |
| `artifacts/erp-dashboard/src/pages/barcode/LabelPrintDialog.tsx`              | 237 |
| `artifacts/erp-dashboard/src/components/public/Calculator.tsx`                | 216 |

### 5.3 Concrete examples

`artifacts/erp-dashboard/src/pages/GLChartOfAccounts.tsx:33-40`:

```tsx
{ code: "1000", name: "Naqd pul", nameRu: "Наличные деньги", type: "asset", level: 1 },
{ code: "1010", name: "Kassa", nameRu: "Касса", type: "asset", parentCode: "1000", level: 2 },
{ code: "1020", name: "Bank hisob-raqami", nameRu: "Банковский счет", ... },
```

This is a bilingual table baked into source code instead of `locales/uz/glPosting.json` + `locales/ru/glPosting.json`. Not selectable by language switch — both Cyrillic and Latin show up at all times because `name` and `nameRu` are rendered side-by-side.

`artifacts/erp-dashboard/src/camera-ai-modern/pages/CameraAIModernHub.tsx:79-91`:

```tsx
title: lang === "uz" ? "Saqlandi" : "Сохранено",
description: lang === "uz" ? "Kamera sozlamalari yangilandi" : "Настройки камеры обновлены",
...
title: lang === "uz" ? "Xato" : "Ошибка",
...
: "Ошибка сохранения",
```

Inline ternaries on `lang === "uz"` — completely bypasses the `useTranslation()` infrastructure. The `lang` here is presumably an outer-scope variable; if it's ever set to `"ru"` or anything else, the Cyrillic branch wins.

### 5.4 Why this is severe

- Even if the locale files were perfect, these 13,215 chars in 109 TSX files would never be translated by switching the language.
- These are concentrated in IoT, Camera AI, Coordination, Planning, Warehouse, Barcode modules — the exact modules where `locales/uz/*.json` is most often truncated. So the "translation system" for those modules is bypassed entirely.

---

## 6. i18next configuration

### 6.1 The frontend does NOT use i18next

`artifacts/erp-dashboard/package.json` has no `i18next` or `react-i18next` dependency. Grep confirms no production code imports `from 'i18next'` or `from 'react-i18next'`; the only mentions are in two documentation files (`docs/ARCHITECTURE_AUDIT_REPORT_V3_DEEP.md:555`, `docs/I18N_LEAKAGE_ELIMINATOR_PROMPT.md:544`) discussing a possible future migration.

### 6.2 Custom i18n system

The dashboard has a hand-rolled provider + hook at `artifacts/erp-dashboard/src/lib/i18n/`. Files:

```
artifacts/erp-dashboard/src/lib/i18n/
  constants.ts   — SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, TRANSLATION_MODULES
  context.tsx    — LanguageProvider, LanguageContext, useLanguageContext
  hooks.ts       — useTranslation, useLanguageSetter, useCurrentLanguage, useTGlobal, useInterpolatedTranslation, useLanguage (deprecated)
  loader.ts      — static JSON imports + ALL_TRANSLATIONS + getTranslation + interpolate + validateTranslationCompleteness
  tLabel.ts      — static-context label helper for module-level constants
  types.ts       — Language, TranslationModuleName, AllTranslations, etc.
  utils.ts       — getStoredLanguage, setStoredLanguage, isValidLanguage
  index.ts       — barrel re-export
  __tests__/     — completeness.test.ts, context.test.tsx, hooks.test.tsx, loader.test.ts, utils.test.ts
```

### 6.3 Language detection / fallback chain

`artifacts/erp-dashboard/src/lib/i18n/utils.ts:15-46` (`getStoredLanguage`):

```ts
export function getStoredLanguage(): Language {
  try {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
    // Yangi unified kalit
    const stored = safeStorage.getItem(LANGUAGE_STORAGE_KEY);   // 'europrint_language'
    if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)) {
      return stored as Language;
    }
    // Eski kalitlar bilan orqaga muvofiqliq
    const legacy1 = safeStorage.getItem('app_language');
    if (legacy1 && (SUPPORTED_LANGUAGES as readonly string[]).includes(legacy1)) { return legacy1 as Language; }
    const legacy2 = safeStorage.getItem('europrint-lang');
    if (legacy2 && (SUPPORTED_LANGUAGES as readonly string[]).includes(legacy2)) { return legacy2 as Language; }
    // Brauzer tilini tekshirish
    const browserLang = navigator.language?.split('-')[0];
    if (browserLang && (SUPPORTED_LANGUAGES as readonly string[]).includes(browserLang)) {
      return browserLang as Language;
    }
    return DEFAULT_LANGUAGE;   // 'uz'
  } catch {
    return DEFAULT_LANGUAGE;
  }
}
```

Detection priority:

1. `localStorage['europrint_language']` (new unified key)
2. `localStorage['app_language']` (legacy ERP key)
3. `localStorage['europrint-lang']` (legacy Public site key)
4. `navigator.language.split('-')[0]` (browser hint)
5. `'uz'` (DEFAULT_LANGUAGE)

All gated by `SUPPORTED_LANGUAGES.includes(...)` — so any value other than `'uz'` / `'ru'` is silently rejected, including `'uz-cyr'`.

### 6.4 Per-call fallback chain (lookup at runtime)

`artifacts/erp-dashboard/src/lib/i18n/loader.ts:266-289` (`getTranslation`):

```ts
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
    console.warn(`[i18n] Missing key '${key}' in ${lang}/${module} — falling back to: "${fallbackValue}"`);
  }
  return fallbackValue;
}
```

Lookup fallback chain:

1. `ALL_TRANSLATIONS[lang][module][key]`
2. caller-provided `fallback` argument
3. `ALL_TRANSLATIONS['uz'][module][key]` (DEFAULT_LANGUAGE)
4. the literal key string itself

In dev: missing keys log a warning. In prod: silent fallback to the literal key (so users see e.g. `topDirectorAuditor` as raw text).

### 6.5 Namespace loading

`loader.ts:9-58` — all 49 `uz/*.json` files imported with static `import uzCommon from '../../locales/uz/common.json'` (TypeScript `resolveJsonModule`). Lines 60–109 do the same for `ru/`. There is **no `uz-cyr/` import block**. There is no lazy / async loading; the entire translation bundle is in the initial JS bundle (~1.5 MB of JSON on disk → ~5–6 MB in `ALL_TRANSLATIONS` at runtime after parsing).

Cache: `loader.ts:225-247` — a one-level memoization to avoid re-resolving `ALL_TRANSLATIONS[lang][module]` on every call.

### 6.6 Provider / SSR

`artifacts/erp-dashboard/src/lib/i18n/context.tsx:51-91`:

```tsx
export function LanguageProvider({ children, initialLanguage }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(
    () => initialLanguage ?? getStoredLanguage(),
  );
  _currentLanguage = language;
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    setStoredLanguage(lang);
    _currentLanguage = lang;
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, []);
  ...
```

Notes:

- No SSR hydration / `Suspense` handling — `getStoredLanguage` is called inside `useState` initializer and depends on `window.localStorage`. On SSR it returns `'uz'` and switches on the client; this can cause a flash of Latin content even for Russian users.
- A module-level `_currentLanguage` mutable variable + `globalThis.t = _globalT` (lines 40–47) — escape hatch for components that were auto-refactored to call `t()` without a hook. This makes language switching observable from non-React code at the cost of being technically a global mutable singleton.

### 6.7 Completeness validation

`loader.ts:307-326`:

```ts
export function validateTranslationCompleteness(): void {
  if (process.env.NODE_ENV !== 'development') return;
  const base = ALL_TRANSLATIONS[DEFAULT_LANGUAGE];
  for (const [langKey, langData] of Object.entries(ALL_TRANSLATIONS) as ...) {
    if (langKey === DEFAULT_LANGUAGE) continue;
    for (const [modKey, modData] of Object.entries(base) as ...) {
      const targetMod = langData[modKey] ?? {};
      const missing = Object.keys(modData).filter((k) => !(k in targetMod));
      if (missing.length > 0) {
        console.warn(`[i18n] ${langKey}/${modKey} da ${missing.length} kalit yetishmayapti:`, missing);
      }
    }
  }
}
```

- Dev-only (`NODE_ENV !== 'development'` early-return).
- Iterates `ALL_TRANSLATIONS`, which only contains `'uz'` and `'ru'` → cannot catch any gap involving `uz-cyr`.
- No CI hook found that invokes this function. No grep hits outside of the loader and its barrel re-export.

A separate **vitest** suite (`__tests__/completeness.test.ts`) checks that every (`SUPPORTED_LANGUAGES` × `TRANSLATION_MODULES`) cell is a non-empty object — this would currently **fail** the build if the corrupt-JSON files prevent some modules from importing as objects, but only if vitest is run.

---

## 7. Translation function usage

### 7.1 Counts

```
$ grep -r "useTranslation(" artifacts/erp-dashboard/src --include="*.tsx" --include="*.ts" | wc -l
1802
$ grep -rl "useTranslation(" artifacts/erp-dashboard/src --include="*.tsx" --include="*.ts" | wc -l
1164
$ grep -r "\bt(" artifacts/erp-dashboard/src --include="*.tsx" | wc -l
15166
```

- 1,164 files import `useTranslation`.
- 1,802 hook-call sites.
- 15,166 `t(` invocations across the TSX tree (this includes some non-i18n `t(` like `t.from(...)` chains in some libraries; the dominant share is the i18n helper).

### 7.2 Canonical usage pattern

`artifacts/erp-dashboard/src/lib/i18n/hooks.ts:27-44`:

```ts
export function useTranslation(module: TranslationModuleName = 'common'): UseTranslationReturn {
  const { language, setLanguage, t: tGlobal } = useLanguageContext();

  const t = useCallback(
    (key: string, paramsOrFallback?: Record<string, string | number> | string): string => {
      if (typeof paramsOrFallback === 'string') {
        const value = tGlobal(key, module);
        return value === key ? paramsOrFallback : value;
      }
      return tGlobal(key, module, paramsOrFallback);
    },
    [tGlobal, module],
  );
  return { language, t, setLanguage };
}
```

Component-side, the JSDoc example (`hooks.ts:22-26`) is:

```ts
const { t, language } = useTranslation('finance');
<h1>{t('title')}</h1>
<p>{t('invoiceCreated', { id: '001' })}</p>
```

Supports two signatures:

- `t('key')`, `t('key', { paramObj })` — looks up in the bound module.
- `t('key', 'fallback string')` — legacy, returns the fallback if `tGlobal` returns the key (i.e. miss).

### 7.3 Static-context helper

`artifacts/erp-dashboard/src/lib/i18n/tLabel.ts` exists for module-level constants (sidebar configs, enum label maps) where hooks can't be used:

```ts
export function tLabel(key: string, fallback: string): string {
  ...
  const lang = getStoredLanguage();
  const value = getTranslation(lang, ns as TranslationModuleName, rest, fallback);
  return value || fallback;
}
```

Important: as the JSDoc notes (`tLabel.ts:18-24`), the result is **evaluated when the module is first loaded**. It does NOT update on language change. The `LanguageSwitcher` itself uses `tLabel` for its dropdown labels (`LanguageSwitcher.tsx:19-20`), which means the switcher label text only updates on full page reload, not on the click that changes the language.

### 7.4 Global escape hatch

`context.tsx:40-47`:

```ts
let _currentLanguage: Language = 'uz';
function _globalT(key: string, _module?: TranslationModuleName, params?: Record<string, string | number>): string {
  const raw = getTranslation(_currentLanguage, _module ?? 'common', key);
  return params ? interpolate(raw, params) : raw;
}
if (typeof globalThis !== 'undefined') {
  (globalThis as Record<string, unknown>).t = _globalT;
}
```

A `globalThis.t` exists so that ad-hoc auto-refactored sites can call `t('key')` without a hook. This is documented as a stop-gap but creates a hidden runtime dependency for any code that calls `t()` without importing it.

### 7.5 POS monitor variant

`artifacts/erp-dashboard/src/pos-monitor/i18n/usePosI18n.ts` re-implements a similar pattern with a 3-way `uz / uz-cyr / ru` toggle. Independent of the main provider — no shared state, no shared storage key.

---

## 8. Backend i18n

### 8.1 Library

`apps/api/src/i18n/README.md:1-5`: nestjs-i18n. Confirmed by `apps/api/src/app.module.ts:17-21` import.

### 8.2 Detection / fallback chain

`apps/api/src/app.module.ts:101-115`:

```ts
I18nModule.forRoot({
  fallbackLanguage: 'uz',
  loaderOptions: {
    path: path.join(__dirname, '/i18n/'),
    watch: process.env.NODE_ENV !== 'production',
  },
  resolvers: [
    { use: QueryResolver, options: ['lang'] },     // ?lang=ru
    new HeaderResolver(['x-lang']),                // x-lang: ru
    AcceptLanguageResolver,                         // Accept-Language: ru, ru-RU;q=0.9
  ],
  typesOutputPath: path.join(__dirname, '../src/generated/i18n.generated.ts'),
}),
```

Priority: `?lang=` → `x-lang` header → `Accept-Language` header → `fallbackLanguage='uz'`.

### 8.3 Namespaces and key counts

| Namespace        | uz keys | uz-cyr keys | ru keys |
|------------------|--------:|------------:|--------:|
| `auth.json`      |      37 |          37 |      37 |
| `common.json`    |      61 |          61 |      61 |
| `errors.json`    |     126 |         126 |     126 |
| `messages.json`  |       7 |           7 |       7 |
| `telegram.json`  |      20 |          20 |      20 |
| `validation.json`|      31 |          31 |      31 |
| **Total**        |     282 |         282 |     282 |

Backend i18n is in much better shape than frontend — full parity across all three locales, no truncation, three locales actually loaded.

### 8.4 Usage in services

Sample from `apps/api/src/i18n/README.md:45-61`:

```ts
@Injectable()
export class MyService {
  constructor(private readonly i18n: I18nService) {}

  async doSomething(): Promise<Result<MyData>> {
    const found = await this.repo.findById(id);
    if (!found) {
      const msg = await this.i18n.t('errors.notFound');
      return Err(AppErr('NOT_FOUND', msg));
    }
    return Ok(found);
  }
}
```

Grep shows 20+ services using the pattern (auth, sd, chat, ecommerce, finance/gl, crm, communication-center, telegram handlers, compatibility controllers, etc.). The README explicitly notes (lines 79–83): "The full migration of every handler from hardcoded Uzbek strings to `I18nService.t()` is out of scope for the initial Task Group 3. Migrate opportunistically when you already touch a handler for unrelated reasons" — so coverage of localized error messages is **partial**, but the infrastructure is correctly wired.

### 8.5 Cross-tier mismatch (NEW finding)

- Backend accepts `Accept-Language: uz-cyr` and serves Cyrillic.
- Frontend dashboard cannot send `Accept-Language: uz-cyr` because `Language = 'uz' | 'ru'` and the LanguageSwitcher offers no `uz-cyr` option. The Cyrillic backend translations are reachable **only** through manual API calls (curl, Postman, Telegram bot if it sets the header) or the POS-monitor (which has `uz-cyr` selectable, but I see no code wiring `pos_lang` into outgoing `Accept-Language` headers — see §8.6).

### 8.6 POS-monitor → backend header wiring

Searched for `'Accept-Language'` / `accept-language` set sites in the POS monitor:

- The POS i18n module (`pos-monitor/i18n/usePosI18n.ts`) reads/writes `localStorage['pos_lang']` but never touches `fetch()` headers.
- I did not find a `fetch` interceptor or axios `defaults.headers` site that propagates `pos_lang` to the API.

So in practice: backend `uz-cyr` is dead weight too, except for whatever Telegram / external clients happen to send `x-lang: uz-cyr`.

### 8.7 Types generation

`typesOutputPath: path.join(__dirname, '../src/generated/i18n.generated.ts')` — nestjs-i18n generates a TS type file at build that mirrors the keys, enabling autocomplete for `i18n.t('errors.notFound')`. The generated file exists at `apps/api/src/generated/i18n.generated.ts` (referenced in the grep for `I18nService`).

---

## 9. Findings summary

### P0 — Ship-blocking

| # | Finding | Evidence | Impact |
|---|---------|----------|--------|
| 1 | **16 of 55 `locales/uz/*.json` files are truncated/malformed JSON.** Files end mid-string with no closing `}`. | `python3 -c "json.load(...)"` raises on each (see §4.3 table). `od -c uz/adaptation.json` shows file ends at `e r d i "` with no `}`. | Vite + `resolveJsonModule` will reject these at build time → **build broken**. If the build is somehow run on a different filesystem state, runtime `getTranslation` falls back to literal key strings for huge swaths of the app (common.json, navigation.json, hr.json, finance.json, warehouse.json, production.json, kanban.json, lms.json, settings.json, coordination.json, director.json, adaptation, analytics, employee-profile, erp, planning). |
| 2 | **`uz-cyr` is unreachable from the main dashboard.** `SUPPORTED_LANGUAGES = ['uz', 'ru']`; `loader.ts` does not import `uz-cyr/*`; `LanguageSwitcher` shows only UZ/RU. | `constants.ts:6`, `loader.ts:9-217` (no uz-cyr imports), `LanguageSwitcher.tsx:18-21`. | ~600 KB of translation work (15,797 keys, 240,112 Cyrillic chars) is dead code. Anyone telling business stakeholders "we support Uzbek Cyrillic" is wrong for the main dashboard. |
| 3 | **109 TSX files contain 13,215 hardcoded Cyrillic characters that bypass the i18n system entirely.** | `cyrillic_re.findall` over `*.tsx`, see §5. Concentrated in iot/camera-ai/coordination/planning/warehouse/barcode. | Even after fixing the locale files, language switching has no effect on these regions. |

### P1 — Important

| # | Finding | Evidence | Impact |
|---|---------|----------|--------|
| 4 | **Round 1's "2,241 Cyrillic chars in `uz/*.json`" is unsubstantiated.** Re-scanning current tree shows 0 Cyrillic chars in `locales/uz/*.json`. | Regex scan + `grep -rn '[А-Яа-яЁё]' .../uz/*.json` → no matches. The only Cyrillic in `locales/uz/` is in the `.bak.t2c` backup (221 chars). | Round 1's P0 around this should be DOWNGRADED. The cleanup may have already happened. |
| 5 | **`tLabel`-based labels do not update on language switch.** Including the LanguageSwitcher's own dropdown labels. | `tLabel.ts:18-24` JSDoc note + `LanguageSwitcher.tsx:19-20` usage. | Users see stale labels until reload. Cosmetic but visible. |
| 6 | **Backend `uz-cyr` is loaded but unreachable from any in-tree client.** | `app.module.ts:101-115` loads all subdirs; no frontend code sends `Accept-Language: uz-cyr` or `x-lang: uz-cyr`. | Backend ships translation work that no UI consumes. Same wasted-effort story as P0 #2. |
| 7 | **`validateTranslationCompleteness` is dev-only and not wired into CI.** | `loader.ts:307-326` (`if (process.env.NODE_ENV !== 'development') return`). | Missing-key drift goes undetected between deployments. |
| 8 | **5 namespaces are empty in `uz-cyr/` and `ru/`** (adaptation, analytics, employee-profile, erp, planning). The corresponding `uz/` files are the corrupt ones above. | `json.load` of each → `{}` for uz-cyr/ru; truncated for uz. | Any component importing these namespaces (presumably the adaptation/planning/analytics modules) gets no translations even on `uz`/`ru`. |
| 9 | **Locale-switch behavior is a global mutable singleton (`globalThis.t`).** | `context.tsx:40-47`. | Anything that calls a global `t()` outside React (timers, third-party callbacks) reads from a non-reactive global; SSR has no isolation. |

### P2 — Quality

| # | Finding | Evidence | Impact |
|---|---------|----------|--------|
| 10 | **`uz-cyr/common.json` has 1,033 more keys than `ru/common.json`** (9,528 vs 8,495). | Per-namespace key counts in §2.2. | If uz-cyr is ever activated, ru will be missing 1,033 keys — fallback to uz (which is corrupt). |
| 11 | **`uz-cyr` extras across non-common namespaces** (crm +2, hr +41, kanban +35, navigation +486, production +17, warehouse +72). | §2.2 table. | Same gap-on-activation risk. |
| 12 | **`uz/common.json.bak.t2c` and `ru/common.json.bak.t2c` committed.** | `find … -name "*.bak*"` → 2 files. | Repo bloat (~400 KB); the `.t2c` extension implies they came from an automated transliteration script that should probably be cleaned up. |
| 13 | **POS monitor has its own i18n system, independent of the main dashboard** — different storage key (`pos_lang` vs `europrint_language`), different file layout, different fallback chain. | `pos-monitor/i18n/usePosI18n.ts:32-47`. | Maintenance burden; if a user switches language in the main app and then opens POS, they see whatever POS remembers separately. |
| 14 | **The frontend ships ~1.5 MB of locale JSON in the initial bundle.** | `loader.ts:9-109` static imports, sum of file sizes. | Could be code-split per locale; would shave the initial JS payload significantly. |

### Round-1 claims that should be DOWNGRADED or RETRACTED

| Round-1 claim | This audit | Recommendation |
|---|---|---|
| "uz-latin missing 486 navigation keys present in uz-cyr" | Actual: 16 keys (and only because the file is truncated). The 486 gap is uz-cyr vs ru. | **Retract** as stated; replace with the truncation finding. |
| "2,241 Cyrillic chars in uz/*.json" | 0 in `.json`. 221 in `.bak.t2c`. | **Retract**. |
| "5 empty namespaces in all 3 langs" | Empty in uz-cyr+ru; corrupt-but-non-empty in uz. | **Reword**. |
| "Supported languages: uz, uz-cyr, ru" | Main dashboard: uz, ru only. POS monitor: uz, uz-cyr, ru. Backend: uz, uz-cyr, ru. | **Reword** — qualify by tier. |
| "55 namespace files per language" | Yes for files-on-disk, but 16 of the uz ones don't parse. | **Add caveat**. |

---

## Open questions

- Was the truncation in `uz/*.json` caused by an interrupted automated script (e.g. the `t2c` transliterator the `.bak.t2c` extension hints at)? If so, the un-truncated content presumably exists in git history one commit back.
- Is `uz-cyr` planned to be activated soon? If yes, adding it to `SUPPORTED_LANGUAGES`, importing it in `loader.ts`, and adding it to the `LanguageSwitcher` is a 30-minute task — but the 5 empty namespaces would need population first.
- Does Vite's `resolveJsonModule` actually accept truncated JSON, or does the current build fail? (Did not test — read-only audit.) If it accepts, what does it produce — partial object, `undefined`, or build error?
- The POS-monitor `pos_lang` localStorage state never reaches the API. Is the backend's `uz-cyr` namespace expected to be reached by some other client (mobile app, Telegram bot)?
