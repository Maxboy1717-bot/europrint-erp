# HR Phase 7 — Sub-Module Completion Progress

Branch: `worktree-agent-a0071419d353845ec` (off `chore/clean-faza-3`)

## Done

| Sub-task | Title                                 | SHA        | Score change | Tests        |
| -------- | ------------------------------------- | ---------- | ------------ | ------------ |
| T7.1     | Offboarding workflow + checklist + interview + cancel | `b91aeb5c` | 30 → 80      | 25 specs     |
| T7.2     | PIP creation / progress / cancel / extend             | `aac2382a` | 35 → 80      | 25 specs     |
| T7.3     | Onboarding buddy assignment + dashboard stats         | `484199d4` | 45 → 80      | 18 specs     |
| T7.4     | Payroll closure workflow + GL journal posting         | `39e887f6` |  – → 80      | 20 specs     |
| T7.5     | Leave-balance monthly accrual + pro-ration            | `570de1e7` |  – → 80      | 20 specs     |

Total: 108+ new specs across 5 spec files in `apps/api/test/hr-*.spec.ts`.

### What landed in each sub-task

**T7.1 Offboarding** — `apps/api/src/modules/hr/offboarding/`
- `OffboardingWorkflowService` (new): state machine
  (`active → exit_interviewed → completed | cancelled`), 8-item standard
  checklist, progress %, finalize gate (all required + interview).
- Repository: `createCase`, `insertChecklistItems`, `listChecklistItems`,
  `updateStatus`, `listCases`, `stats`; `updateChecklistItem` now
  recomputes and persists `completed_items` on the case row.
- Service: `createCase` seeds standard checklist + emits
  `OFFBOARDING_STARTED`. `recordExitInterview` enforces transition +
  serializes JSON interview. `finalizeCase` runs through workflow gate +
  emits `OFFBOARDING_COMPLETED`. New `cancelCase`.
- Controller: `GET /cases`, `GET /cases/:id` (with checklist +
  `progress_percent`), `POST /cases`, `POST /cases/:id/cancel`,
  `GET /stats`.

**T7.2 PIP** — `apps/api/src/modules/hr/pip/`
- `PipWorkflowService` (new): `buildPlan` (default 30-day duration,
  7..180 bound), progress-status enum, transition rules, outcome
  derivation, `isOverdue`, `computeElapsedPercent`.
- Repository: `cancel`, `updateEndDate`.
- Service: `createPip` delegates to `workflow.buildPlan`;
  `addProgressUpdate` enforces active-only + routes outcome to mark
  completed/failed and emit corresponding events. New `cancelPip`,
  `extendPip`.
- Controller: `POST /:id/cancel`, `POST /:id/extend`.

**T7.3 Onboarding** — `apps/api/src/modules/hr/onboarding/`
- `OnboardingProgressService` (new): `computeOverallProgress`
  (weighted across weekly entries, clamps 0..100), `isAtRisk` (≥2
  weeks + checkpoint pass rate < 60%), `isOverdue`,
  `validateBuddyAssignment` (positive int, no self-buddy),
  `computeDashboardStats` aggregator.
- Repository: `assignBuddy` (writes `mentorId`), `listAllOnboardings`.
- Service: `assignBuddy` with self-buddy guard + buddy-exists check;
  `getDashboardStats` hydrates `weeklyProgress` JSON and aggregates.
- Controller: `PATCH /:id/buddy`, `GET /dashboard/stats`.

**T7.4 Payroll closure** — `apps/api/src/modules/hr/payroll/`
- `PayrollClosureService` (new): `aggregate` (tolerant of Drizzle
  decimal strings), `canClose` (open|calculated only, blocks draft rows
  + no-lines), `buildJournal` against EuroPrint COA accounts (6710
  salary expense, 6720 bonus expense, 6730 tax liability, 6760 net
  payable) with 0.5-unit balance tolerance, `validatePeriodDates`.
- Repository interface gains `findPeriodById`, `listRowsByPeriod`,
  `markPeriodClosed`, `markRowsPosted`, `insertGlJournalLines`.
- Service: `closePeriod` orchestrates find → dates → list rows →
  canClose → buildJournal → mark closed → mark posted → insert GL,
  emits `payroll.period.closed`.
- Controller: `POST /hr/payroll/closure/periods/:id/close`.

**T7.5 Leave accrual** — `apps/api/src/modules/hr/leave/`
- `LeaveAccrualService` (new): monthly accrual (annual 28/12, sick 7/12,
  personal 3/12), mid-month hire pro-ration, year-of-hire scaling of
  `yearTotal`. `applyAccrual` caps at `yearTotal` and enforces
  remaining ≥ 0.
- `LeaveAccrualJobService` (new): cron `0 2 1 * *` (1st of month, 02:00)
  + `runForMonth(year, month)` manual replay. Per-employee errors are
  non-fatal — returns `{ processed, updated, skipped, errors }`.
- Repository: `listActiveEmployeesWithHireDate`, `findBalance`,
  `upsertBalance` (writes against `hr_leave_balances`).
- Controller: `POST /hr/leave/accrual/run` (HR admin trigger).

## Deferred (10 remaining sub-tasks)

These were out of scope for this session. Listed with one-line status
for the next agent.

| ID    | Title                              | Status / notes |
| ----- | ---------------------------------- | -------------- |
| T7.6  | Performance review cycles          | Schema partially present; needs cycle + review form + 360 link |
| T7.7  | Career path automation             | `career_paths` table exists; needs milestone scheduler + alerts |
| T7.8  | Recruitment funnel KPI dashboard   | Funnel repo exists; needs aggregated KPI endpoint + caching |
| T7.9  | Skills-matrix gap-analysis automation | `skills_matrix` schema exists; needs gap-detection cron + notif |
| T7.10 | Training assignment workflow       | LMS schema exists; needs assignment endpoint + due-date alerts |
| T7.11 | Discipline auto-escalation         | `discipline_actions` exists; needs N-strike auto-block rule |
| T7.12 | Telegram bot commands for HR self-service | Bot module exists; needs `/leave_balance`, `/payslip` commands |
| T7.13 | Attendance correction workflow     | Records exist; needs correction request endpoint + approval |
| T7.14 | Document expiration alerts         | `employee_files` has expires_at; needs cron + Telegram notif |
| T7.15 | HR analytics export (CSV/Excel)    | Endpoints exist; needs export endpoints for headcount, attrition, payroll |

## Scope reductions / rationale

- Did 5/15. The scope guide said "one agent cannot do all 15"; I picked
  the highest-leverage workflow gaps where the existing files were
  thin stubs (offboarding, PIP) or completely missing closure/accrual
  workflows (T7.4, T7.5). T7.3 was already at 45 → small additive work
  yielded buddy + dashboard with high coverage.
- All 5 ship a pure-domain service + repo extension + service wiring +
  controller endpoint + unit tests. Tests use `jest.mock` to stub the
  `@shared/db` module since the worktree has no installed node_modules;
  domain services therefore run without a real Postgres.
- Cross-phase notes: Phase 4 broken APIs not touched. Phase 1 PII
  encryption not blocking — none of my new code reads passport/bank
  fields directly. Phase 2 multi-tenancy: my new tables continue to
  use the existing schema (no `tenant_id` was already added) — when
  Phase 2 lands, the repos can be retrofitted via `WHERE tenant_id`
  filters in a single follow-up commit.

## Files added / modified

**New files (15):**
- `apps/api/src/modules/hr/offboarding/offboarding-workflow.service.ts`
- `apps/api/src/modules/hr/pip/pip-workflow.service.ts`
- `apps/api/src/modules/hr/onboarding/onboarding-progress.service.ts`
- `apps/api/src/modules/hr/payroll/payroll-closure.service.ts`
- `apps/api/src/modules/hr/payroll/hr-payroll-closure.controller.ts`
- `apps/api/src/modules/hr/leave/leave-accrual.service.ts`
- `apps/api/src/modules/hr/leave/leave-accrual-job.service.ts`
- `apps/api/src/modules/hr/leave/hr-leave-accrual.controller.ts`
- `apps/api/test/hr-offboarding.spec.ts`
- `apps/api/test/hr-pip.spec.ts`
- `apps/api/test/hr-onboarding.spec.ts`
- `apps/api/test/hr-payroll-closure.spec.ts`
- `apps/api/test/hr-leave-accrual.spec.ts`
- `docs/hr-progress.md` (this file)

**Modified files:**
- `apps/api/src/modules/hr/hr.module.ts` (wired 5 new services + 2 new controllers)
- Repositories, services, controllers, DTOs under each sub-module dir
  listed above (see commit diffs for the per-file changes).
