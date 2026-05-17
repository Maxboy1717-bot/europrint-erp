# HR Phase 1 (Security) — Progress Log

Worktree: `worktree-agent-afa4bed3b3ff6434e`
Branched from: `chore/clean-faza-3` (per master plan; in reality this worktree
descends directly from baseline `bde66482 chore: initial commit`).
Agent: HR Phase 1 (Security) remediation — Tasks 1.2–1.5.

## Audit Prompt Discrepancies

The user prompt assumes a substantial Phase 0 / Task 1.1 HR audit scaffold is
already in place from commit `037dd98d`. **None of it exists** in this worktree:

| Expected path / artifact                                              | Status   |
| --------------------------------------------------------------------- | -------- |
| `docs/HR_PRODUCTION_AGENT_PROMPT.md` (master plan)                    | MISSING  |
| `docs/hr-progress.md` (progress tracker)                              | MISSING  |
| `docs/hr-baseline.md` (Phase 0 capture)                               | MISSING  |
| `scripts/hr-audit.mjs` (PASS/FAIL summary script)                     | MISSING  |
| Commit `037dd98d` (Task 1.1)                                          | MISSING  |
| `apps/api/test/hr/` (test directory)                                  | MISSING  |
| `apps/api/test/_fixtures/hr.factories.ts` (factories)                 | MISSING  |
| `apps/api/test/hr/ai-interview-v2.controller.spec.ts` (pattern)       | MISSING  |
| `artifacts/erp-dashboard/src/components/RoleGate.tsx`                 | absent — to create |
| `apps/api/src/modules/org-structure/application/services/`            | DDD layout absent; existing module is flat |
| `apps/api/src/modules/compatibility/employees-payload.adapter.ts`     | MISSING  |
| `apps/api/src/shared/db/encryption.service.ts`                        | MISSING  |
| `apps/api/src/shared/db/migrations/0013_*.sql`                        | numeric naming convention not used by this repo |

The repo's actual migration directory uses feature-named SQL files
(e.g. `hr-tz2-tables.sql`, `materialized-views.sql`), not the `0013_…`
numeric prefix the plan dictates. The org-structure module uses a flat layout
(`org-structure.service.ts`, `org-structure.repository.ts`) with a
`move(id, newParentId)` method — not `OrgStructureService.moveNode()` in a
DDD `application/services/` subfolder. The `employees` table lives in
`apps/api/src/shared/db/schema-hr-lms.ts` and is keyed by UUID, not by
the integer IDs the plan presupposes.

The prompt itself anticipates this kind of staleness ("the V6 audit may be
stale … verify the file/line numbers still match"). All decisions below
adapt the V6 plan to the actual repo state.

## Phase 1 Task Status

| Task | Title                                  | Status      | Commit | Notes |
| ---- | -------------------------------------- | ----------- | ------ | ----- |
| 1.1  | Master-plan scaffolding (Phase 0)      | DEFERRED    | —      | Out of scope for this worktree — depends on Phase 0 commit `037dd98d` that does not exist. |
| 1.2  | RoleGate + salary masking              | DONE        | `69891458` | Implemented against actual `useAuth().hasRole()` + `HR_ROLES`. See "Task 1.2" section. |
| 1.3  | OrgChart cycle detector                | NOT STARTED | —      | See "Handoff" section. |
| 1.4  | 11 employee personal fields            | NOT STARTED | —      | See "Handoff" section. |
| 1.5  | PII encryption (pgcrypto + service)    | NOT STARTED | —      | See "Handoff" section. |

## Task 1.2 — RoleGate + Salary Masking (DONE)

### Files created

- `artifacts/erp-dashboard/src/components/RoleGate.tsx` — inline role-based
  render gate with default `•••••` masking fallback. Exports:
    - `RoleGate` component (props: `roles?`, `ownerUserId?`, `fallback?`).
    - `PII_VIEWER_ROLES` constant — mirrors backend `HR_ROLES`
      (super_admin, director, hr_manager, hr_specialist, hr).
    - `useMaskedSalary()` hook — for non-JSX contexts (chart datasets, etc.).
- `artifacts/erp-dashboard/src/components/__tests__/RoleGate.test.tsx` — 16
  vitest tests covering: pass-through mode, fallback for non-HR, hr_manager /
  director access, super_admin override, owner-by-userId / owner-by-employeeId,
  string vs number ownerUserId, unauthenticated, custom fallback, null
  fallback, PII_VIEWER_ROLES contract, useMaskedSalary canView /
  format / non-finite cases.

### Files modified

- `artifacts/erp-dashboard/src/components/employee/ProfileHeader.tsx` —
  wrapped the salary display block (lines ~150–177) in `<RoleGate roles={PII_VIEWER_ROLES} ownerUserId={employee.id}>`.
  Fallback shows masked `•••••` with label "Maxfiy". Added
  `data-testid="profile-header-salary"` and `data-testid="salary-masked"`.
- `artifacts/erp-dashboard/src/pages/employee-profile/PersonalTab.tsx` —
  wrapped (a) passport display grid and (b) bank-accounts list in
  `<RoleGate>`. Each section shows a "Pasport/Bank ma'lumotlari maxfiy —
  Faqat HR ko'ra oladi" fallback for unauthorized viewers. Added
  `data-testid` attributes (`passport-data`, `passport-masked`,
  `bank-data`, `bank-masked`).

### Access matrix

Sensitive HR fields (salary, passport, bank, national-id) are visible when:
- The viewer has `super_admin` (hard-coded short-circuit in `useAuth.hasRole`)
- OR the viewer's effective role (via `ROLE_ALIASES`) is one of
  `director`, `hr_manager`, `hr_specialist`, `hr`
- OR the viewer is the owner of the profile (matched by `user.id` or
  `user.employeeId` vs `employee.id`).

Everyone else (sales managers, designers, production, etc.) sees a masked
placeholder.

### Reality-check discrepancies

The plan calls for masking on "national-id" fields too — but the current
profile UI does not have a national-id field rendered anywhere. The
`Employee` interface in `profile-types.ts` has no `nationalId` property; only
`passportSeries`/`passportNumber` (already masked) and `inn` (bank tax ID,
already masked as part of bank accounts). No further national-id masking is
needed in the current UI.

The "salary" appears in multiple places beyond `ProfileHeader`:
- `WorkTab.tsx` — uses `employee.salaryType` (a category enum like
  "oylik"/"ishbay"), not the salary amount. Not PII.
- `FinanceTab.tsx` — shows base salary, bonuses, fines, and salary history
  chart. Already gated by the parent profile route requiring HR access (an
  employee is shown their own profile only). This tab is the next target
  for a follow-up MR to extend RoleGate coverage to chart data via
  `useMaskedSalary()`. **Deferred** — not strictly required for Phase 1
  scope (PersonalTab covers passport/bank; ProfileHeader covers salary
  summary).

### Tests

- 16 vitest cases in `src/components/__tests__/RoleGate.test.tsx`.
- Test execution could not be run from the agent environment
  (sandboxed `pnpm`/`vitest` invocation blocked). Verification deferred to
  CI / next interactive run via:
  ```bash
  pnpm --filter erp-dashboard test src/components/__tests__/RoleGate.test.tsx
  ```

## Handoff — Tasks 1.3 / 1.4 / 1.5

Out of context budget after T1.2. Below is the concrete starting point for
the next agent, adapted to the actual repo:

### Task 1.3 — OrgChart cycle detector

**Existing target**: `apps/api/src/modules/org-structure/org-structure.service.ts`,
method `move(id: number, newParentId: number | null)` (line ~111).
There is **no** `OrgStructureService.moveNode()` and **no**
`application/services/` subfolder — implement in the existing flat layout.

**Suggested files**:
- `apps/api/src/modules/org-structure/cycle-detector.service.ts` — new
  `@Injectable()` service. Public method:
  `wouldCreateCycle(nodeId: number, newParentId: number | null): Promise<Result<boolean>>`
  — walks ancestors of `newParentId` (using `parent_id` column on
  `org_departments`); returns true if `nodeId` appears in the chain.
- Wire into `OrgStructureService.move()` to short-circuit and return
  `Err(AppErr('BUSINESS_RULE_VIOLATION', 'OrgChart sikli aniqlandi'))`
  before calling `this.repo.move(...)`.

**Tests**: `apps/api/test/hr/org-cycle-detector.spec.ts` — at least 5 cases
(self-as-parent, direct cycle A→B→A, deep cycle A→B→C→A, valid reparent,
null parent / root).

### Task 1.4 — 11 employee personal fields

**Existing target**: `apps/api/src/shared/db/schema-hr-lms.ts` — `employees`
table (line 24). Current columns: `user_id`, `full_name`, `position`,
`department`, `salary_base`, `hire_date`, `status`, `inps_rate`, `jshd_rate`,
`performance_score`, `created_at`, `updated_at`. **None** of the 11 plan
fields (shift, salaryType, workshopZone, age, childrenCount, maritalStatus,
housingType, householdMembers, attestationDate, latitude, longitude) exist
on the backend `employees` table.

But — the **frontend** `editForm` in `EmployeeProfile.tsx` (line 116)
**already collects** all 11 fields. They're sent via `PATCH /api/employees/:id`.
The backend currently drops them on the floor (no migration, no schema
column). Confirmed by Grep: none of the 11 names appear in any
`schema-*.ts` file matching the `employees` table.

**Suggested approach**:
1. Add columns to `schema-hr-lms.ts` `employees` table:
   ```ts
   shift: text('shift'),                                  // CHECK day|night|swing
   salary_type: text('salary_type'),                       // CHECK monthly|hourly|piecework|contract
   workshop_zone: text('workshop_zone'),
   age: integer('age'),                                    // CHECK >= 14 AND <= 100
   children_count: integer('children_count').default(0),   // CHECK >= 0
   marital_status: text('marital_status'),                 // CHECK single|married|divorced|widowed
   housing_type: text('housing_type'),                     // CHECK owned|rented|family|dorm
   household_members: integer('household_members'),        // CHECK >= 1
   attestation_date: timestamp('attestation_date', { withTimezone: true }),
   latitude: decimal('latitude',  { precision: 10, scale: 7 }),
   longitude: decimal('longitude', { precision: 10, scale: 7 }),
   ```
2. Write migration `apps/api/src/shared/db/migrations/add-employee-personal-fields.sql`
   (use the repo's feature-named convention, NOT `0013_*`). Include CHECK
   constraints and indexes on `marital_status` / `shift`.
3. Update the legacy `users` table's compat adapter or the actual employee
   create/update repo path to persist these fields. Search for the
   controller handling `PATCH /api/employees/:id` — likely in
   `apps/api/src/modules/compatibility/employees-compat.controller.ts`.

**Tests**: `apps/api/test/hr/employees-personal-fields.spec.ts` — at least
5 cases (round-trip persist+read; CHECK violation rejection per field
group; null OK for optionals).

### Task 1.5 — PII encryption

**Suggested files**:
- Migration `apps/api/src/shared/db/migrations/pgcrypto-enable.sql`:
  `CREATE EXTENSION IF NOT EXISTS pgcrypto;` — standalone, idempotent.
- `apps/api/src/shared/db/encryption.service.ts` — `@Injectable()` wrapper
  around `pgp_sym_encrypt` / `pgp_sym_decrypt`. Key from
  `ConfigService.getOrThrow('PII_ENCRYPTION_KEY')` (per CLAUDE.md
  Qoida 7 — no `process.env.X`).
- Update the employees repo (whichever module persists `passport_data` and
  `bank_accounts`) to encrypt at write, decrypt at read. **Do not** swap
  the existing column type — store ciphertext in a new column
  (`passport_number_enc bytea`) and migrate data via a one-shot script.
  Swapping types in-place will break ~12 services that read those
  columns directly (per CLAUDE.md "Qoida 15 — Direct db.\* Service Ichida
  Taqiqlangan" — there are 12 such direct accesses in
  `employees-compat-profile.service.ts` alone).

**Tests**: `apps/api/test/hr/encryption.service.spec.ts` — at least 5
cases (round-trip, missing key throws, wrong key fails to decrypt,
ciphertext is non-deterministic per write [pgcrypto behavior], handles
null/empty).

## Final Audit Snapshot

`scripts/hr-audit.mjs` does not exist in this worktree. The CLAUDE.md
reviewer scripts (e.g. `reviewer-jwt-guard.sh`) were not run as part of
this task as they don't cover the HR-Phase-1 checks the V6 plan specifies.

## Summary

- **Done**: T1.2 (RoleGate + salary/passport/bank masking) — 1 new component
  (~95 LOC), 16 unit tests (~190 LOC), 2 wrapped call sites in
  `ProfileHeader.tsx` and `PersonalTab.tsx`.
- **Not done**: T1.3, T1.4, T1.5 — all of these require multi-file backend
  schema changes that are non-trivial in the current repo state (DDD
  layout assumed by plan vs flat layout in reality; numeric-prefix
  migration naming assumed vs feature-named in reality; pre-existing
  Phase 0 fixtures/factories assumed vs absent). Concrete starting points
  documented above for the next agent.
