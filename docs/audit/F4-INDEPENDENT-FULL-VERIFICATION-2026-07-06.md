# F4 (i18n Exception-Message Localization) — Independent Full Verification

**Date:** 2026-07-06 (verification run 2026-07-07)
**Auditor:** Independent verification pass (fresh session, not the F4 executor).
**Method:** Every claim below is backed by a `git show`/file:line citation or actual command output. Investigation only — no code, migrations, or locale files were modified.
**Repo root for all citations:** `Uzbek-Language-Module/` (this is the live git repo; the outer `EuroPrint-Clean/` directory is *not* a git repo — `git rev-parse` fails there).

---

## Overall Verdict: **CONFIRMED-WITH-CONCERNS**

The F4 work is real, substantial, and largely well-executed: 42 commits, exception-type-preserving, no swallowed throws, no missing-`await` runtime bugs, correct `await this.i18n.t(...)` shape throughout, and translations that faithfully preserve meaning across uz/ru/uz-cyr. Both self-reported "caught regressions" are genuine and correctly fixed, and the targeted regression test now passes exactly as claimed.

**However**, two claims do not hold up:

1. **(HIGH)** The claim that "the corresponding key was added to **ALL THREE** locale files with real translated text" is **contradicted for 5 keys** in the `remaining` module. Commit `275d32a0` added `stateThresholdNotFound`, `exceptionLogNotFound`, `idealTargetNotFound`, `productionFactCreateFailed`, `reportDefinitionNotFound` to **ru and uz-cyr only, never to uz** — and `fallbackLanguage` is `uz`. A primary-language (uz) user hitting any of these 5 error paths receives the raw key string (e.g. `errors.stateThresholdNotFound`) instead of a message.

2. **(MEDIUM)** The claim of "**zero remaining reachable hardcoded exception literals**" is true only for the exact `throw new XException('literal')` shape that Step 0's regex targeted. The semantically identical `assert*(cond, 'message')` helper family (**131 sites**, all of which `throw new BadRequestException/NotFoundException/…(message)` under the hood) plus `DomainError`/`MoneyArithmeticError` (**17 sites**) were never enumerated. ~148 user-facing hardcoded error messages remain unlocalized outside F4's declared scope.

The "**0 regressions**" claim holds for everything I was able to verify: the two test failures in the F4-touched regression suite are pre-existing and provably not caused by any F4 commit.

### Findings by severity
| Severity | Count | Findings |
|---|---|---|
| CRITICAL | 0 | — |
| HIGH | 1 | H-1: 5 `remaining`-module keys missing from uz locale (broken message for the primary/fallback language) |
| MEDIUM | 1 | M-1: 131 `assert*()` + 17 `DomainError`/`MoneyArithmeticError` hardcoded messages outside F4's regex scope → "zero reachable literals" overstated |
| LOW | 3 | L-1: "8 mm gap-fill" vs commit's own "7 more" (513 arithmetic only closes at 7). L-2: per-commit "N messages" counts overcount actual throw-sites. L-3: prose "41 commits" vs actual 42. |

---

## Commit-set confirmation

Reconstructed independently from `git log --oneline | grep -iE "F4|i18n"`. The 42 hashes in the prompt **match the actual F4 commit set exactly** — 37 module commits (`cb66c216`..`96d24101`) + `275d32a0` (locale-key seed) + 4 follow-ups (`e06718bd`, `cfa0eb11`, `10c5804a`, `e7889956`).

**L-3 (LOW):** The prompt's prose "41 total commits (37 + 4)" is off by one — the true set is **42** (the prose omits `275d32a0`, which is a code-supporting commit, not merely docs). The hash *list* is complete and correct at 42.

---

## Part A — Commit-by-commit verification (all 42)

**How the columns were derived (aggregate, not by trusting the summary):**
- *Behavior unchanged?* — For every commit I diffed the removed vs. added `throw new XException` type histogram. **All 42 commits show a perfectly balanced `-N/+N` throw count with identical exception-class histograms** — no throw was removed/swallowed, no exception type (hence no HTTP status code) changed. (`git show <h> | grep '^[-+].*throw new … Exception'` per commit.)
- *i18n pattern correct?* — Repo-wide grep for `throw new …Exception( this.i18n.t(` **without** `await` returns **0** results; 218 throws use the correct `await this.i18n.t(...)` shape. No `[object Promise]` bug anywhere.
- *All 3 locale keys present+real?* — Enumerated **all 464 distinct `i18n.t('…')` keys referenced in `apps/api/src`** and checked each against flattened uz/ru/uz-cyr JSON. **459/464 present in all three**; the only real gaps are the 5 `remaining`-module keys (H-1). (telegram.* keys and the JSDoc literal `namespace.key` were false positives of an incomplete first script pass, re-checked and cleared.)
- *Meaning preserved?* — Spot-translated samples from pos/hr/finance/qc/pp/mm/compatibility/org-structure against the original literals in each diff; all faithful (see Part E).

Verdicts: **CONFIRMED** unless the commit is implicated in H-1.

| Commit | Module / files | i18n pattern | 3 locale keys real | Meaning preserved | Behavior unchanged | Verdict |
|---|---|---|---|---|---|---|
| `275d32a0` | locale seed, 6 JSON + 1 gen (~330 keys) | n/a | **N — 5 uz keys missing** | Y (ru/cyr) | Y (+0/-0 throws) | **CONFIRMED-WITH-CONCERN (H-1)** |
| `cb66c216` | pos, 31 files (−99/+99 throw) | Y | Y | Y | Y | CONFIRMED |
| `fc9c1208` | compatibility, 24 files (−73/+73) | Y | Y | Y | Y | CONFIRMED |
| `ef786a4e` | hr, 30 files (−56/+56) | Y | Y | Y | Y | CONFIRMED |
| `e052064e` | ai, 13 files (−25/+25) | Y | Y | Y | Y | CONFIRMED |
| `86dcb184` | lms, 9 files (−15/+15) | Y | Y | Y | Y | CONFIRMED |
| `d727e97d` | pp, 10 files (−14/+14) | Y | Y | Y | Y | CONFIRMED |
| `f1f6795f` | finance, 11 files (−19/+19) | Y | Y | Y | Y | CONFIRMED |
| `94267961` | communication-center, 6 files (−14/+14) | Y | Y | Y | Y | CONFIRMED |
| `9de08a28` | wms, 10 files (−13/+13) | Y | Y | Y | Y | CONFIRMED |
| `b73d2a87` | mm, 2 files (−4/+4) | Y | Y | Y | Y | CONFIRMED |
| `23bc8ae9` | remaining, 7 files (−12/+12) | Y | **N — refs 5 uz-missing keys** | Y | Y | **CONFIRMED-WITH-CONCERN (H-1)** |
| `1fcb9ad6` | qc, 4 files (−12/+12) | Y | Y | Y | Y | CONFIRMED |
| `8b943f74` | crm, 14 files (−9/+9) | Y | Y | Y | Y | CONFIRMED |
| `0c643937` | marketing, 5 files (−9/+9) | Y | Y | Y | Y | CONFIRMED |
| `42a385be` | common (guards), 7 files (−9/+9) | Y | Y | Y | Y | CONFIRMED |
| `b530871a` | ecommerce, 2 files (−8/+8) | Y | Y | Y | Y | CONFIRMED |
| `37f1d621` | kanban, 2 files (−7/+7) | Y | Y | Y | Y | CONFIRMED |
| `97ec19cb` | director, 3 files (−7/+7) | Y | Y | Y | Y | CONFIRMED |
| `54a70f07` | security, 4 files (−4/+4) | Y | Y | Y | Y | CONFIRMED |
| `90dab7c6` | logistics, 3 files (−4/+4) | Y | Y | Y | Y | CONFIRMED |
| `e9217f1f` | iot, 4 files (−5/+5) | Y | Y | Y | Y | CONFIRMED |
| `bb1c15d8` | general, 1 file (−4/+4) | Y | Y | Y | Y | CONFIRMED |
| `2639a9c8` | design, 3 files (−4/+4) | Y | Y | Y | Y | CONFIRMED |
| `ab4cc47e` | core, 1 file (−4/+4) | Y | Y | Y | Y | CONFIRMED |
| `31ff4bd0` | agents, 2 files (−4/+4) | Y | Y | Y | Y | CONFIRMED |
| `2293160d` | sd, 4 files (−3/+3) | Y | Y | Y | Y | CONFIRMED |
| `b724bb7a` | mro, 3 files (−3/+3) | Y | Y | Y | Y | CONFIRMED |
| `e3d22149` | mes, 4 files (−3/+3) | Y | Y | Y | Y | CONFIRMED |
| `694c4069` | admin, 2 files (−3/+3) | Y | Y | Y | Y | CONFIRMED |
| `e38c3b10` | storage, 1 file (−3/+3) | Y | Y | Y | Y | CONFIRMED |
| `6a9044a6` | notifications, 3 files (−2/+2) | Y | Y | Y | Y | CONFIRMED |
| `7b60b8d8` | bot-gateway, 1 file (−2/+2) | Y | Y | Y | Y | CONFIRMED |
| `733a79a9` | auth, 1 file (−2/+2) | Y | Y | Y | Y | CONFIRMED |
| `ffb522bd` | org-structure, 1 file (−1/+1) | Y | Y | Y (Node→Karta, see E-20) | Y | CONFIRMED |
| `42bd2812` | integration, 1 file (−1/+1) | Y | Y | Y | Y | CONFIRMED |
| `0f467249` | chat, 1 file (−1/+1) | Y | Y | Y | Y | CONFIRMED |
| `96d24101` | core-utils, 2 files (−1/+1) | Y | Y | Y | Y | CONFIRMED |
| `e06718bd` | mm gap-fill, 3 files (−9/+9) | Y | Y | Y | Y | CONFIRMED (see Part C) |
| `cfa0eb11` | parseOrThrow gap-fill, 3 files (−2/+2) | Y | Y | Y | Y | CONFIRMED (see Part C) |
| `10c5804a` | global-exception.filter special item, 6 files | Y (`I18nContext.current(host)`) | Y | Y | Y (English `?? fallback`) | CONFIRMED |
| `e7889956` | test-regression fix, 1 file (test only) | n/a | n/a | n/a | Y | CONFIRMED (see Part C) |

**Special item `10c5804a` verified:** the filter is registered via `app.useGlobalFilters(new GlobalExceptionFilter())` (manual instantiation, outside Nest's DI graph), so it correctly uses `const i18n = I18nContext.current(host)` and every lookup is `i18n?.t('…') ?? '<English fallback>'` — it can never throw where the old hardcoded code didn't. This is the documented nestjs-i18n pattern for out-of-DI filters. Confirmed genuine, not a subtly-broken shape.

---

## Part B — Independent re-derivation of the site count

### Remaining hardcoded literals (the "7 excluded" claim)
Independent grep of the **current** tree for `throw new (BadRequest|NotFound|Conflict|Forbidden|Unauthorized|InternalServerError|…)Exception(<string/template literal>)` not wrapped in `i18n`, excluding tests, returns **exactly 7 sites** — matching the claimed exclusions one-for-one:

| # | Site | Claimed reason | Independent judgment |
|---|---|---|---|
| 1-2 | `lib/objectAcl.ts:72,82` (`InternalServerErrorException`) | plain non-DI function | **VALID** — module-level functions, no `this.i18n` available |
| 3 | `lib/objectStorage.helpers.ts:20` | plain non-DI function | **VALID** — standalone helper |
| 4-6 | `crm/infrastructure/repositories/drizzle-deal.repo.ts:132`, `drizzle-lead.repo.ts:139,147` | "unreachable TS-exhaustiveness guards" | **VALID with a nit** — these are `Cannot create …Status from: ${raw}` guards; they are *reachable* if the DB holds a bad enum value (so "unreachable" is slightly overstated), but they are internal 500s, not user-facing UX, so excluding them is reasonable |
| 7 | `shared/db/schema.ts:90` | throws at module load before Nest context | **VALID** — `DATABASE_URL not set`, fires before any i18n context exists |

My first (stricter) grep found only 2 because the `objectAcl` and `crm` messages use **backtick templates** (`` `Unknown access group type: ${…}` ``), not leading-quote literals; broadening the pattern surfaced all 7. **Claim CONFIRMED.**

### The "501 → 513" arithmetic
Summing the per-module declared counts from the 37 module commit messages: 111+99+56+25+15+14+24+15+13+2+12+12+9+9+9+8+7+7+4+4+5+4+4+4+4+3+3+3+3+3+2+2+2+1+1+1+1 = **501**. Independently confirms the "501 from the 37-module workflow" figure exactly.

`501 (modules) + 7 (mm gap-fill) + 2 (parseOrThrow, 2 call sites) + 3 (global-filter) = **513**`.

**L-1 (LOW):** This only closes at **513 if the mm gap-fill is 7**, which is what commit `e06718bd`'s own subject line says ("localize **7** more"). The board's summary-row prose says "**8** mm gap-fill", which would total 514. The "513" headline is defensible; the board's "8" is an internal inconsistency.

**L-2 (LOW):** The per-commit "N messages" figures are a **soft metric** — they do not equal the number of `throw new …Exception` lines actually changed. Examples: pos declares 111 but the diff changes 99 throw lines; compatibility declares 99 vs 73 throws; finance declares 24 vs 19. The surplus is non-throw i18n conversions (validation messages passed to helpers, `Result` errors, etc.), so "513 sites" is an approximate upper-bound "messages touched," not a precise throw-site count.

---

## Part C — The two self-reported "caught regressions"

### C-6: `e7889956` — StrategicController DI test regression
- **(a) Bug real?** **YES.** `git show cfa0eb11` shows the parseOrThrow gap-fill added `I18nService` to `strategic.controller.ts`'s constructor (`- constructor(private readonly svc: StrategicService) {}` → `+ constructor(private readonly i18n: I18nService, private readonly svc…)`) while `test/misc-extended.spec.ts`'s StrategicController `TestingModule` provided only `StrategicService` → Nest can't resolve `I18nService` → whole suite crashes.
- **(b) Fix correct?** **YES.** `e7889956` adds `{ provide: I18nService, useValue: mockI18n }` to that describe block's providers — the exact mock shape the same file already uses for `IotCameraController`.
- **(c) Test passes now?** **YES — verified by running it.** `node node_modules/jest/bin/jest.js --config test/jest.config.js test/misc-extended.spec.ts --runInBand`:
  ```
  Test Suites: 1 failed, 1 total
  Tests:       2 failed, 37 passed, 39 total
  ```
  StrategicController tests all pass. The 2 remaining failures are `OkrController › createObjective` and `CoordinationController › getCouncils()` — **exactly** the two the report named as "unrelated pre-existing bugs."
- **Independently confirmed those 2 are NOT F4-caused:** `git log -- …/okr.controller.ts` shows its last touch is `825b0478` (t23-wave3), and the director F4 commit `97ec19cb --stat` does not touch `okr.controller.ts` or any coordination controller. The `getCouncils`/`createObjective` failures are logic/DB assertions, unrelated to i18n. **Verdict: CONFIRMED.**

### C-7: `e06718bd` — mm gap-fill
- **Pre-state genuinely hardcoded?** **YES.** `git show e06718bd` diff shows real conversions, e.g.:
  - `- throw new NotFoundException(\`Requisitsiya #${rid} topilmadi\`)` → `+ …(await this.i18n.t('errors.requisitionNotFoundWithId', { args: { id: rid } }))`
  - `- throw new BadRequestException("Xarid so'rovi uchun kamida 1 material (item) kerak")` → `+ …(await this.i18n.t('validation.atLeastOneItemRequired'))`
  - `- throw new BadRequestException(\`${currentDb} → ${newDb} mumkin emas\`)` → `+ …('errors.movementStatusTransitionNotAllowed', { args: { from, to } })`
- **Localized after?** **YES** — correct `await this.i18n.t(...)` shape, args preserved, and all referenced keys exist in all 3 locales.
- **Count nuance:** the commit's own message says **7** keys and the diff touches 9 `+i18n.t` lines across 3 files. Either way this is genuine, correctly-executed gap-fill work. **Verdict: CONFIRMED** (with the L-1 note that "7", not "8", is the number that makes 513 add up).

---

## Part D — Backend test run (independent)

**What I ran:** the F4-touched regression suite `test/misc-extended.spec.ts` (the one `e7889956` fixed), full output captured above: **37 passed / 2 failed / 39 total**, matching the board's "37/39" claim precisely, with the two failures independently traced to non-F4 commits.

**What I did NOT run — UNCONFIRMED:** the *entire* 810-suite backend run. The suite takes ~600s and, per the board, ~68 suites fail purely on `DATABASE_URL`/DI-env conditions in this environment; a single spec already needed >2 min of setup here. I did not reproduce the full "68 failed / 3 skipped / 739 passed, 807/810" numbers end-to-end.

**Confidence on "0 regressions" despite that:** high, for three independent reasons that don't depend on the full run:
1. Every F4 code commit is **type-histogram-balanced** (`-N/+N`, no exception class changed) — an F4 commit cannot have changed control flow or status codes.
2. There are **0 missing-`await` bugs** repo-wide, so no throw silently became `[object Promise]`.
3. The one suite F4 actually broke-and-fixed (`misc-extended.spec.ts`) I ran directly and it passes 37/39 with only pre-existing unrelated failures.

To fully close Part D one would need to run `pnpm --filter api test` with a live `DATABASE_URL` and diff the failing-suite list against a pre-`cb66c216` checkout — outside what this pass executed. **Marked UNCONFIRMED for the full count; CONFIRMED for the F4-relevant suite.**

---

## Part E — The 20 flagged ambiguous-translation items (linguistic review)

Pulled the full list from the board's dedicated section. Sampled the actual stored translations (`uz`/`ru`/`uz-cyr` `errors.json`/`validation.json`). All are **real, non-placeholder, meaning-preserving**. Per-item verdict:

| # | Key(s) | Verdict | Note |
|---|---|---|---|
| 1 | pos receipt/tolerance/tech-card keys | ACCEPTABLE | closest-sibling phrasing; not wrong |
| 2 | pos two "insufficient stock" keys | ACCEPTABLE | over-fragmented but not incorrect |
| 3 | pos uz-cyr acronyms in Latin | ACCEPTABLE | matches loanword rule |
| 4 | compatibility `assetInsufficientStock` ("saldo/сальдо") | ACCEPTABLE (minor) | asset-ledger context justifies "saldo" vs warehouse "qoldiq"; owner-accepted |
| 5 | hr `employeeHasNoAssignedCard` etc. | ACCEPTABLE | faithful (`Xodim biriktirilgan kartaga ega emas` / `У сотрудника нет закреплённой карточки`) |
| 6 | hr `shiftTypeNotFoundWithId` | ACCEPTABLE | reasonable RU coinage |
| 7 | ai `forecast_series` kept raw | ACCEPTABLE | DB-name convention |
| 8 | ai Tool Test/exam Latin in uz-cyr | ACCEPTABLE | sibling-key style |
| 9 | pp `ppInvalidTransition`/`ppUnknownStatus` prefix removed | **ACCEPTABLE — verified safe** | grepped `PP_INVALID_TRANSITION`/`PP_UNKNOWN_STATUS` across backend + FE: **no downstream parser exists**, so dropping the code prefix breaks nothing. The flag's "revisit if parsed elsewhere" concern is unfounded. |
| 10 | pp `gofraConfigKeyNotFound` raw `{key}` | ACCEPTABLE (nit) | ru translates `с ключом=` while uz/cyr keep `key=` — minor cross-locale inconsistency, cosmetic |
| 11 | finance `usePaymentRecordEndpoint` (ru) | ACCEPTABLE | contextual, faithful |
| 12 | finance `glDocument…` "pending_review" literal | ACCEPTABLE | matches sibling convention (`draft` kept literal) |
| 13 | communication-center `{message}` wrap | ACCEPTABLE | sibling convention |
| 14 | mm `fi_payments` raw | ACCEPTABLE | technical identifier |
| 15 | mm `onlyDraftOrderDeletable/Editable` | ACCEPTABLE | uz keeps `'draft'`, ru «черновик» — quoting inconsistency, meaning intact |
| 16 | qc uz-cyr `текширув` | ACCEPTABLE | transliteration fine |
| 17 | general `fileSizeExceededMax` (МБ/MB) | ACCEPTABLE | unambiguous |
| 18 | core `positionHasEmployees` (ru `сотрудник(ов)`) | ACCEPTABLE (weak) | parenthetical plural is lazy Russian but understandable |
| 19 | bot-gateway `secret token` Latin | ACCEPTABLE | mirrors sibling |
| 20 | org-structure `orgNodeNotFoundWithId` Node→Karta | **CORRECT** | `Karta #{id} topilmadi` / `Карточка #{id} не найдена` / `Карта #{id} топилмади` — aligns with the project's mandated KARTA-centric vocabulary (memory: org elements are always "KARTA", never "node") |

**No item is a genuine mistranslation.** The strongest candidate for "actually wrong" was #9 (silent prefix removal) — independently cleared. Owner has already marked all 20 RESOLVED-ACCEPTED.

---

## Part F — Hardcoded error strings outside F4's declared scope

Step 0's regex targeted only `throw new XException('literal')`. A broader sweep finds substantial hardcoded-error surface it never enumerated:

### F-1 (MEDIUM): the `assert*()` helper family — 131 sites
`apps/api/src/common/assertions.ts` defines `assertFound`/`assertRequired`/`assertValidated`/`assertAuth`/`assertInternal`/`assertPositiveNumber`/`assertDefined`, each of which does `throw new NotFoundException(message)` / `throw new BadRequestException(message)` / `throw new UnauthorizedException(message)` / `throw new InternalServerErrorException(message)`. These are **functionally identical** to the sites F4 localized, just funneled through a helper. A grep for `assert*(cond, '<literal>')` (excluding tests) returns **131 calls** with hardcoded, mostly-English messages, e.g.:
- `admin-users.controller.ts:103` `assertValidated(…, 'Invalid role')`
- `admin-users.controller.ts:114` `assertValidated(…, 'Cannot delete your own account')`
- `chat-advanced.controller.ts:101` `assertFound(msg, 'Message not found')`
- `chat-advanced.controller.ts:76` `assertRequired(body.emoji, 'emoji is required')`
- `okr.controller.ts:88` `assertRequired(title, 'title majburiy')`

These are reachable, user-facing 400/404/401/500 messages that are **not localized**. F4's claim of "zero remaining *reachable* hardcoded exception literals" is therefore accurate only for the literal `throw new` shape; the true unlocalized surface is ~131 sites larger.

### F-2 (MEDIUM/LOW): domain-layer errors — 17 sites
- **14× `throw new DomainError('CODE', 'message')`** in aggregates/value-objects (`admin/domain/…system-settings.entity.ts`, `auth/domain/…password.vo.ts`, `director/domain/…approval-request.aggregate.ts`, `finance/domain/…budget.aggregate.ts`, `shared/domain/result.ts`) — messages like `'Faqat pending so'rov tasdiqlanadi'`, `'Advance percent must be between 0 and 100'`. These use a machine-code first arg, so they *may* be intentionally out of scope (the code, not the message, is the localization key at the boundary) — but they are hardcoded strings the F4 count never reflected.
- **3× `throw new MoneyArithmeticError('…')`** in `common/money/money.vo.ts` (`'Division by zero'`, etc.).

**Framing:** none of F-1/F-2 is a *regression* — they are pre-existing surface F4's regex-scoped enumeration excluded. But they contradict the absolute phrasing "zero remaining reachable hardcoded exception literals." A truthful statement would be "zero remaining hardcoded `throw new XException('literal')` sites; the `assert*()`/`DomainError` families (~148 sites) were out of this pass's scope."

---

## Detailed evidence for H-1 (the headline finding)

```
# key presence across locales (flattened JSON compare, errors.json)
uz=419  ru=424  uz-cyr=424
ru-not-uz(5): stateThresholdNotFound, exceptionLogNotFound, idealTargetNotFound,
              productionFactCreateFailed, reportDefinitionNotFound
uz-not-ru(0)  uz-not-cyr(0)

# all 5 are referenced in code (remaining module):
company-state.controller.ts:116  throw new BadRequestException(await this.i18n.t('errors.stateThresholdNotFound', {args:{id}}))
exception-log.service.ts:62,157   this.i18n.t('errors.exceptionLogNotFound', {args:{id}})
ideal-rasm.service.ts:66          this.i18n.t('errors.idealTargetNotFound')
production-facts.service.ts:52    this.i18n.t('errors.productionFactCreateFailed')
reports-hub.service.ts:81,82      this.i18n.t('errors.reportDefinitionNotFound')

# fallback config:
app.module.ts:102  fallbackLanguage: 'uz'

# introduced by:
git show 275d32a0 -- .../uz/errors.json | grep <5 keys>   → (empty; never added to uz)
git show 275d32a0 -- .../ru/errors.json | grep <5 keys>   → +"stateThresholdNotFound": "state_threshold id={id} не найден"  (etc.)
```
**Runtime effect:** requested lang uz → key missing → fallback lang uz → still missing → nestjs-i18n returns the raw key path. A uz user (the primary audience of an Uzbek-first ERP) sees `errors.stateThresholdNotFound` as the error message body for all 5 `remaining`-module conditions (company-state threshold, exception-log, ideal-target, production-fact create, report-definition). HTTP status codes are unaffected; only the message body is broken. **Severity HIGH** (real user-facing defect in the default language, directly contradicting the "all 3 locales, real text" claim), **not CRITICAL** (no broken error-handling logic, no swallowed exception).

**Remediation (for a later fix pass, not done here):** add the 5 keys to `apps/api/src/i18n/uz/errors.json` with real Uzbek text (uz equivalents of the ru values already present).

---

## What was fully verified vs. left UNCONFIRMED

**Fully verified:** commit set (42); exception-type/status preservation across all 42; missing-`await` sweep (0); key presence for all 464 referenced keys; the 7 exclusions; the 501 module-sum; both regression-fix claims (incl. a live run of the fixed suite); translation meaning on a cross-module sample; all 20 flagged items; Part F broader sweep.

**UNCONFIRMED:** the full 810-suite pass/fail *count* end-to-end (ran the one F4-relevant suite instead; the full run is env-heavy and dominated by pre-existing DB failures). Closing it would require a live `DATABASE_URL` full run diffed against a pre-F4 checkout.

*End of report. Investigation only — no fixes applied.*
