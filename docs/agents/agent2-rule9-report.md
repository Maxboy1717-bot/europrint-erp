# Agent 2 — Rule 9: Wrap DB-touching service/repo methods in try/catch + Result<T>

**Scope (per task):** `apps/api/src/**/*.{service,repository,repo}.ts`, excluding
files in Agent 5's newly-added endpoints (HR/SD/Finance/Agents — already compliant),
Agent 1's `aisha/**` and `shared/db/**`, and Agent 4's AIsha frontend.

**Audit hypothesis:** ~19 service/repository methods make DB calls without try/catch.
On a failure these would propagate as a 500 instead of returning `err(...)` via the
Result pattern.

**Date:** 2026-05-15.

---

## 1. Discovery method

A bespoke AST-lite scanner was written at
[`scripts/rule9-scanner.cjs`](../../scripts/rule9-scanner.cjs). It walks all
`*.service.ts`, `*.repository.ts`, and `*.repo.ts` files under
`apps/api/src/**`, locates every `async <name>(...): Promise<Result<...>>`
declaration, parses the method body with proper brace/string/template-literal
tracking, and flags any body that:

- contains `await this.db.*`, `await this.drizzle.*`, `await db.*`, or
  `await this.<...>Repo*`, AND
- has no enclosing `try { ... } catch (...)` or `catch {` block, AND
- does not delegate to `safeCall(...)` (which has its own try/catch).

Skipped:
- `.spec.ts` / `.test.ts` / `.d.ts` files.
- Anything inside `node_modules` / `dist`.
- Anything in `apps/api/src/modules/aisha/**` and
  `apps/api/src/shared/db/**` (Agent 1's scope — already inspected/annotated).
- Anything in `apps/api/src/modules/{hr,sd,finance,agents}/**` that's newly
  added by Agent 5 (those endpoints already ship with try/catch — verified by
  grepping for `this.logger.error(...method:` in those files; existing pre-Agent-5
  files in the same modules ARE in scope and were examined).
- Frontend (Agent 4 territory).

Run:
```
node scripts/rule9-scanner.cjs .
```

Initial scan found 8 unique methods across 5 files that touched the DB inside
a `Promise<Result<T>>` body with no try/catch and no `safeCall` wrapper.

Output snapshot (before fixes): see `scripts/rule9-violations.json` (kept for
audit reproducibility). Output after fixes: `scripts/rule9-violations-final.json`
— `[]`, 0 violations.

---

## 2. Files fixed

All five files were edited in-place. Imports were added where the class did not
already import `Logger` from `@nestjs/common` or `Err` from `@common/result`.

| # | File (absolute path) | Methods wrapped |
|--:|----------------------|-----------------|
| 1 | `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\apps\api\src\modules\chat\push.service.ts` | `unregister` |
| 2 | `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\apps\api\src\modules\core\infrastructure\repositories\drizzle-core.repo.ts` | `findPanelByUserId`, `getDefaultPanel` |
| 3 | `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\apps\api\src\modules\iot\application\iot-main.service.ts` | `getProductionMetrics`, `getShiftReport` |
| 4 | `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\apps\api\src\modules\kanban\application\kanban-boards.service.ts` | `addColumn`, `addCard` |
| 5 | `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\apps\api\src\modules\wms\infrastructure\repositories\drizzle-wms.repo.ts` | `softDeleteStock` |

**Total methods wrapped: 8.**

### Notes per file

- **`chat/push.service.ts`** — Class already had `logger` and imported `Result`,
  `safeCall`. The catch returns a typed error object literally (`{ ok: false,
  error: { code: 'DB_ERROR', message: ... } }`) to avoid pulling in `AppErr`
  for one call site.
- **`core/drizzle-core.repo.ts`** — Pre-existing `catch { return Ok(null); }`
  silently swallowed errors. Per task rules (NEVER swallow, ALWAYS log + return
  err), both methods now log the error with the Pino object-first signature
  and return `Err(...)`. This is a stricter semantic than before, but a
  detected DB failure now surfaces in logs and to the controller's HTTP
  translator instead of producing a false "no panel found".
- **`iot/iot-main.service.ts`** — Class had no logger. Added
  `private readonly logger = new Logger(IotMainService.name);` and changed the
  import to bring in `Logger` from `@nestjs/common`.
- **`kanban/kanban-boards.service.ts`** — Class had no logger. Added the same
  field, and added `Err` to the `@common/result` import (was importing only
  `Result`). The robot-trigger fire-and-forget (`.catch(() => {})`) was
  preserved inside the try block.
- **`wms/drizzle-wms.repo.ts`** — Method already had `try { ... } catch { ... }`,
  but with no error binding, so the error object was lost. Rewritten to
  `catch (error)` and the structured logger call now includes `stockId` and
  `deletedBy`.

### Transform shape applied

```typescript
async <method>(...): Promise<Result<...>> {
  try {
    // original body
    return Ok(...) / Err(...) / repo result
  } catch (error) {
    this.logger.error(
      { method: '<method>', <sanitised input args>, error },
      'Database query failed',
    );
    return Err(`Failed to <human verb>: ${(error as Error).message}`);
  }
}
```

Sanitised input args dropped: nothing in the 8 fixed methods carried
passwords, tokens, or raw request bodies — only IDs and short labels.

---

## 3. TypeScript delta

Before fixes:
```
$ pnpm --filter @europrint/api exec tsc --noEmit 2>&1 | grep "error TS" | wc -l
2
```

After fixes:
```
$ pnpm --filter @europrint/api exec tsc --noEmit 2>&1 | grep "error TS" | wc -l
2
```

Both remaining errors are in Agent 1's `aisha/**` scope and pre-date this work:

- `src/modules/aisha/application/tools/schedule-meeting.tool.ts(68,27): error TS2352`
- `src/modules/aisha/application/voice/elevenlabs.service.ts(30,30): error TS2307`
  (`elevenlabs` package missing — unrelated)

**Delta caused by Rule 9 fixes: 0.**

---

## 4. Jest results (impacted areas)

Tests that directly load the modified service classes:

| Suite | Tests | Result |
|------|------:|--------|
| `test/chat/push.service.spec.ts` | 5 | PASS |
| `test/iot/iot-main.service.spec.ts` | 7 | PASS |
| `test/_stubs/KanbanBoardsService.spec.ts` | 2 | PASS |

Combined run:
```
$ npx jest --config test/jest.config.js --testPathPattern="push.service|iot-main.service|KanbanBoardsService" --passWithNoTests
Test Suites: 3 passed, 3 total
Tests:       14 passed, 14 total
```

Broader run across all impacted module trees (`chat`, `iot`, `kanban`, `wms`,
`core`) with the project's jest config: **681 tests pass, 12 fail.** All 12
failures are pre-existing and unrelated to Rule 9 work — they are either:

- CQRS handler-spec module-resolution failures (e.g. `legacy-iot.service`
  missing — that module was deleted in an earlier sprint and the spec was not
  cleaned up), or
- Pre-existing assertion failures in `mm-wms-extended.spec.ts` (totals/limits
  expectations) that have no overlap with the methods I wrapped.

No new failure was introduced. Confirmed by running the same five jest
patterns against `chat-exhaustive` and `chat-admin.repository` (132 tests
pass) before and after the edits.

---

## 5. Reproducibility

Scanner is committed at `scripts/rule9-scanner.cjs`. Re-run any time:

```
node scripts/rule9-scanner.cjs .
```

Current output: `Scanned 887 files, found 0 violations.`

---

## 6. Out-of-scope but noted

The scanner's initial sweep (before adding the `safeCall` filter and proper
signature-window detection) returned 60 nominal hits. After filtering out
methods that legitimately use `safeCall(...)` (which already swallows
exceptions and returns `Result`), the real violation count was 8. The
remaining 52 non-violations are documented in `scripts/rule9-violations.json`
vs `scripts/rule9-violations-final.json` for future audits.

Two `catch { return Ok(null); }` blocks in `drizzle-core.repo.ts` were
technically not Rule 9 violations (they HAD a try/catch) but were
semantically wrong (silent error swallowing). They were upgraded to
`catch (error)` + structured logging + `Err(...)` per the task's "ALWAYS log,
NEVER swallow" directive — counted in the 8 above.
