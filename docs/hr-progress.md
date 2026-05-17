# HR Module Remediation — Progress Tracker

Reference: `docs/HR_PRODUCTION_AGENT_PROMPT.md` (V6 audit, 2026-05-17)
Branch: `chore/clean-faza-3`
Started: 2026-05-17

## Phase Status

| Phase | Status | Started | Completed | Tasks | Notes |
|------:|:------:|:--------|:----------|------:|-------|
| 0 — Setup | in_progress | 2026-05-17 | — | 1/5 | Tracking, audit script, factories, baseline |
| 1 — Security | pending | — | — | 0/5 | T1.1 scope reduced (see below) |
| 2 — Business Logic | pending | — | — | 0/5 | Multi-tenancy, transactions, missing fields |
| 3 — Sidebar Cleanup | pending | — | — | 0/3 | Duplicates + hidden pages |
| 4 — Broken APIs | pending | — | — | 0/9 | One per broken page |
| 5 — Recruiter Kanban | pending | — | — | 0/6 | dnd-kit rewrite |
| 6 — OrgChart | pending | — | — | 0/6 | Production-grade |
| 7 — Sub-modules | pending | — | — | 0/15 | Offboarding, PIP, Onboarding, etc. |
| 8 — Testing & Polish | pending | — | — | 0/10 | E2E, mutation, perf, a11y |

## Audit Prompt Discrepancies

Findings from initial code survey (recorded for transparency, not to dispute the scope):

- **Task 1.1 — "8 unprotected controllers"**: 7 of the 8 named paths are outside the HR module
  (FI, POS, WMS, Security, Marketing, Supply Chain, CRM/AI). The 1 HR-adjacent path
  (`hr-assets/assets.controller.ts`) **already has** `@UseGuards(JwtAuthGuard, RolesGuard)`
  with proper `@Roles(...)` per method using the `Role` enum from
  `apps/api/src/common/constants/roles.constants.ts`.

  Scan of `apps/api/src/modules/hr/**/*.controller.ts` (40 controllers) found exactly
  **1 unprotected** HR controller: `hr/ai-interview-v2/ai-interview-v2.controller.ts`.
  It has `@Roles(...)` at class level but no `@UseGuards`, so the `RolesGuard` is never
  invoked and the roles check is dead code.

  Under HR-only scope, Task 1.1 is therefore 1 controller fix, not 8. The remaining 7
  non-HR controllers may still be P0 security issues per `CLAUDE.md` but fall outside this
  scope.

- **PII columns**: `passport_number`, `bank_account_number`, `national_id` need to be
  verified against `lib/db/src/schema/employees.ts` and the current state of the table
  before Task 1.5 (encryption) is planned.

## Score Progress

| Date | Overall | Security | Performance | Reliability | DDD | Notes |
|------|--------:|---------:|------------:|------------:|----:|-------|
| 2026-05-17 (start) | 64 | 86 | 60 | 25 | 64 | Baseline from V6 audit doc |

## Task Log

### 2026-05-17

- **prereq commit `d657578c`** — `fix(queue): wire PpModule into QueueModule for BomExplosionService DI`
  Not part of HR Phase 0, but unblocked the build (BomExplosionService could not resolve
  `PP_REPO` at bootstrap). Committed before HR work began so progress commits stay focused.

- **Phase 0.1 done** — repo state survey; cleared stale `.git/index.lock`; confirmed
  branch `chore/clean-faza-3` with no other HR-related dirty state.
