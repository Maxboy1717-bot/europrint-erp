# HR Module Remediation — Progress Tracker

Reference: `docs/HR_PRODUCTION_AGENT_PROMPT.md` (V6 audit, 2026-05-17)
Branch: `chore/clean-faza-3`
Started: 2026-05-17

## Phase Status

| Phase | Status | Started | Completed | Tasks | Notes |
|------:|:------:|:--------|:----------|------:|-------|
| 0 — Setup | done | 2026-05-17 | 2026-05-17 | 5/5 | Tracking, audit script, factories, baseline |
| 1 — Security | in_progress | 2026-05-17 | — | 1/5 | T1.1 done (1 controller, HR scope); T1.2–1.5 pending |
| 2 — Business Logic | in_progress | 2026-05-17 | — | 4/5 | T2.1/T2.3/T2.4/T2.5 done; T2.2 (Kanban) is Phase 5 |
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

- **Phase 0 commit `a992be05`** — `chore(hr): phase 0 setup — tracker, audit script, factories, baseline`
  (840 LOC added). `scripts/hr-audit.mjs --summary` shows 3/10 passing at baseline.

- **Task 1.1 done** — `feat(hr-security): protect ai-interview-v2 with JwtAuthGuard + RolesGuard`
  - Added `@UseGuards(JwtAuthGuard, RolesGuard)` and `@ApiBearerAuth()` to
    `apps/api/src/modules/hr/ai-interview-v2/ai-interview-v2.controller.ts`.
    The existing `@Roles('admin', 'manager', 'supervisor', 'hr_manager')` line
    was previously dead code (no guard was running RolesGuard).
  - `@Public()` candidate-flow endpoints (validate / camera-rejected / submit)
    continue to work without authentication — verified by 3 dedicated tests.
  - Added `apps/api/test/hr/ai-interview-v2.controller.spec.ts` with 6 tests:
    happy path (200), JWT rejection (401), roles rejection (403), and three
    Public-bypass tests. All 6 pass.
  - Aside finding: `apps/api/test/e2e/*.e2e-spec.ts` files are orphaned —
    the jest `testRegex` requires `.spec.ts` not `-spec.ts`, so those existing
    files never run. Logged as a separate observation; not in scope to fix
    here. The new spec is placed at `test/hr/` so it is discovered.
  - `node scripts/hr-audit.mjs --summary` now reports 4/10 passing
    (`unprotected-hr-controllers` flips from FAIL to PASS).
  - **Commit hygiene note:** the controller change and spec file were
    physically swept into commits `2a69415a` (sprint 6 wave 1) and
    `72587078` (sprint 6 wave 2a) by a parallel Claude session running on
    this machine while this work was in progress. Those commits are
    primarily about ACL translators but include unrelated HR security
    work. Tasks in later phases may want to verify HEAD commit attribution
    before proceeding — the per-task commit model the prompt assumes will
    not hold if multiple agents commit on the same branch concurrently.

- **Phase 2 / Task 2.1 done** — `feat(hr-tenancy): T2.1 add tenant_id to 10 HR tables + AsyncLocalStorage context`
  Commit `5dae0750`. Migration `lib/db/drizzle/0016_add_tenant_id_to_hr_tables.sql`
  adds `tenant_id INTEGER NOT NULL DEFAULT 1` to employees, payroll_periods,
  salary_history, leave_requests, attendance, discipline_records, candidates,
  vacancies, aisha_conversations, aisha_tool_calls (with index pairs).
  Drizzle schema files updated in lockstep. New
  `apps/api/src/shared/db/tenant-context.ts` exports `tenantContext`
  (AsyncLocalStorage), `getTenantId()`, `runWithTenant()`, `DEFAULT_TENANT_ID = 1`.
  `apps/api/src/shared/db/tenant-context.interceptor.ts` reads
  `request.user.tenantId` (camelCase or snake_case JWT claim) and wraps
  `next.handle()` in the scope; registered globally in `app.module.ts`
  AFTER `AuditInterceptor` and BEFORE `ResultUnwrapInterceptor`. `JwtPayload`
  + `AuthenticatedUser` extended with optional `tenantId`; `JwtStrategy`
  surfaces the claim. 11 tests in `test/hr/tenant-context.spec.ts`.

  Audit `tenant-id-coverage` 0/10 → 7/10. The remaining 3 fails are
  `fi-payroll-calc.ts`, `fi-payroll-ext.ts`, and the barrel
  `hr-recruitment.ts` — none declare the 10 tables in scope; they are
  audit-script denominator noise and require either a script tweak or a
  follow-up to retrofit `tenant_id` to non-HR payroll calculation
  tables. **Not a real coverage gap for HR Phase 2.**

- **Phase 2 / Task 2.4 done** — `feat(hr-add-employee-tx): T2.4 wrap Add Employee in db.transaction`
  Commit `8b763a0b`. Two parallel changes:
  1. `HrBaseRepository.saveEmployee` wraps INSERT employees + inline
     INSERT audit_logs in `db.transaction`. Any failure throws inside the
     callback and rolls every prior statement back.
  2. New CQRS `CreateEmployeeHandler` (`apps/api/src/modules/hr/application/commands/create-employee.handler.ts`)
     supports the multi-table case `employee + new users + audit`.
     Registered in `hr.module.ts`. CommandBus-dispatchable.

  Test coverage: 11 tests across `test/hr/create-employee.handler.spec.ts`
  (6) and `test/hr/drizzle-hr-base-save-employee.spec.ts` (5). Mocks
  `@shared/db` so the tx callback runs against an in-memory stub and
  asserts the `insert(employees) → insert(audit)` order plus rollback on
  any failure.

- **Phase 2 / Task 2.3 done** — `feat(hr-orgchart-mobile): T2.3 switch OrgChartPage to accordion below 768px`
  Commit `a43b23e3`. `OrgChartPage.tsx` now reads `useIsMobile()` and
  renders one of two trees: the existing TreeNode (≥768px) or the new
  `MobileAccordionTree` extracted to
  `artifacts/erp-dashboard/src/components/hr/org/MobileAccordionTree.tsx`.
  Radix Accordion gives touch-sized triggers + native keyboard nav.
  7 vitest cases in `__tests__/MobileAccordionTree.test.tsx`.

- **Phase 2 / Task 2.5 done** — `feat(hr-employee-form): T2.5 add ManagerSelect + BaseSalaryInput to EmployeeDialog`
  Commit `62db6ac1`. New components:
  - `ManagerSelect.tsx` — Popover + cmdk Command combobox, sources
    `/api/employees`, filters client-side by display name, excludes
    the candidate themselves via `excludeEmployeeId`.
  - `BaseSalaryInput.tsx` — currency-formatted input (`1,500,000` while
    typing; raw digits stored), UZS suffix, Vysotskiy grade picker (A/B/C/D)
    that pre-fills to a category midpoint.
  - `ManagerSalarySection.tsx` — wraps both into a single FormField pair.

  `EmployeeDialog.tsx` renders the new section between Position and
  Contract. `types.ts` schema gains `managerId` / `baseSalary` (string
  optional). `useEmployeeMutation.ts` coerces to integer / float on submit
  and treats both as clearable on PATCH. 16 vitest cases across two
  spec files.

## Phase 2 — Remaining Scope

T2.2 (Recruiter Kanban drag-drop) is owned by Phase 5 per master plan
and the agent instructions; intentionally skipped here.

## Merge-Order Note (CRITICAL)

T2.1 commit `5dae0750` is the **foundational migration** for the HR
module's multi-tenancy story. Other Phase 4/5/6/7 worktrees touch the
same HR tables in parallel branches. This commit must land on
`chore/clean-faza-3` BEFORE those branches merge so:

1. The `tenant_id` column exists when subsequent migrations or
   column-aware queries arrive (avoids "column does not exist" failures
   in CI).
2. Parallel agents writing to HR tables in their migrations can rely on
   the column being present (or fall back cleanly via the DEFAULT 1).
3. The Drizzle `_journal.json` does NOT need adjustment here — I left
   it at idx 11 so other in-flight migrations can pick the next
   sequential number without conflict. The 0016 file name was chosen
   per the master plan; if merging requires renumbering it, the body
   is idempotent (every statement is `IF NOT EXISTS`) so renaming the
   file is safe.

The DEFAULT 1 on the `tenant_id` column is intentional and must remain
until every HR writer is updated to set tenant_id explicitly from
TenantContext. A follow-up task `T2.1-cleanup` (not in this phase)
will drop the DEFAULT after backfill verification.

## Phase 2 Audit Discrepancies

- **T2.1 tenant-id-coverage check counts 10 files** but my migration
  covers only 10 specific tables. Three of the audit's denominator
  files (`fi-payroll-calc.ts`, `fi-payroll-ext.ts`, `hr-recruitment.ts`
  barrel) declare different tables. Audit script could be tightened to
  inspect the 10 specific table declarations instead of all matching
  file names; left for a follow-up since the real coverage is 100%.

- **T2.4 prompt said `create-employee.handler.ts` existed**: it did
  not. Created from scratch as a proper CQRS handler. The repo-level
  `saveEmployee` was also wrapped in `db.transaction` so the legacy
  controller path is equally safe.
