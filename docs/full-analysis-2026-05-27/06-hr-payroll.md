# 06 — HR: Payroll

**Date:** 2026-05-27
**Auditor:** forensic-agent (read-only)
**Scope:** `apps/api/src/modules/hr/payroll/`, `apps/api/src/modules/finance/payroll/`, `artifacts/erp-dashboard/src/pages/payroll/`

---

## 1. Module Overview

Payroll spans two backend locations:

- **`apps/api/src/modules/hr/payroll/`** — HR-domain payroll: salary history CRUD, period close workflow, per-employee payroll records. This is the primary payroll module.
- **`apps/api/src/modules/finance/payroll/`** — Finance-side payroll calculations (payroll_calculations table). Referenced from the frontend `CalculationsTab.tsx`.

The HR payroll module has:
- `PayrollService` — orchestrates period close, delegates to `PayrollClosureService` (pure domain logic) and repo
- `PayrollClosureService` — pure domain: aggregation, GL journal generation, closure eligibility checks
- `DrizzleHrPayrollRepository` — DB access: `salaryHistory`, `payrollPeriods`, `payrollRows`
- `HrPayrollClosureController` — single endpoint: `POST /hr/payroll/closure/periods/:id/close`
- `PayrollRecord` aggregate — domain entity with `completeRun()` lifecycle method

There is **no general `GET /hr/payroll` list controller file found** — the `PayrollService.findAll()` method exists but its controller is not confirmed (may be in a general HR controller not read).

---

## 2. Page/Screen Inventory

| Screen | File | Route |
|--------|------|-------|
| Payroll calculations tab | `artifacts/erp-dashboard/src/pages/payroll/CalculationsTab.tsx` | `/payroll` (tab) |
| New calculation dialog | `artifacts/erp-dashboard/src/pages/payroll/CalculatePayrollDialog.tsx` | modal |
| AI payroll dialog | `artifacts/erp-dashboard/src/pages/payroll/AIPayrollDialog.tsx` | modal |
| Contracts tab | `artifacts/erp-dashboard/src/pages/payroll/ContractsTab.tsx` | `/payroll` (tab) |
| Payroll stats cards | `artifacts/erp-dashboard/src/pages/payroll/PayrollStatsCards.tsx` | `/payroll` |
| Tax rules sidebar | `artifacts/erp-dashboard/src/pages/payroll/TaxRulesSidebar.tsx` | `/payroll` |

---

## 3. Data Flow Chains

### 3.1 Payroll Period Close

```
POST /hr/payroll/closure/periods/:id/close
  -> HrPayrollClosureController.closePeriod(id) [hr-payroll-closure.controller.ts:24]
  -> @Roles('SUPER_ADMIN','DIRECTOR','PAYROLL_OFFICER','HR_MANAGER','admin')
  -> @UseGuards(JwtAuthGuard, RolesGuard)
  -> PayrollService.closePeriod(periodId) [payroll.service.ts:34]
    -> hrPayrollRepo.findPeriodById(periodId)
       SELECT * FROM payroll_periods WHERE id=$1 LIMIT 1
       [drizzle-hr-payroll.repo.ts:34]
    -> PayrollClosureService.validatePeriodDates(period)
       [payroll-closure.service.ts:~120] -- checks periodStartDate, periodEndDate
    -> hrPayrollRepo.listRowsByPeriod(periodId)
       SELECT * FROM payroll_rows WHERE period_id=$1
       [drizzle-hr-payroll.repo.ts:43]
    -> PayrollClosureService.canClose(period, rows)
       [payroll-closure.service.ts:55]
       -- rejects if: status=='closed', status not in ['open','calculated'],
                      rows.length==0, any row.status=='draft'
    -> PayrollClosureService.buildJournal(totals, periodName)
       [payroll-closure.service.ts:83]
       -- generates GL lines: DEBIT 6710 (salary), 6720 (bonus)
                              CREDIT 6760 (net payable), 6730 (taxes)
       -- validates balanced: sumDebit == sumCredit (within 0.50 tolerance)
    -> hrPayrollRepo.markPeriodClosed(periodId, totals)
       UPDATE payroll_periods SET status='closed', closed_at=NOW() WHERE id=$1
    -> hrPayrollRepo.markRowsPosted(periodId)
       UPDATE payroll_rows SET status='posted' WHERE period_id=$1
    -> hrPayrollRepo.insertGlJournalLines(periodId, lines)
       *** STUB: only logs "GL journal: period #N -> M lines (deferred to finance)" ***
       *** NO actual INSERT to gl_documents or gl_lines ***
    -> emitPayrollRecordCompletions(periodId, rows)
       -- hydrates PayrollRecord.fromProps() for each row
       -- calls record.completeRun() -> draft/approved -> posted transition
       -- emits EventEmitter2: 'payroll.record.completed' (or similar)
    -> eventEmitter.emit('payroll.period.closed', { periodId, totals, glLines })
  <- { data: { period, totals, gl: { inserted: N } } }
```

### 3.2 Salary History (read)

```
PayrollService.findAll(query) [payroll.service.ts:22]
  -> hrPayrollRepo.findAll({ limit, offset, userId, changeType, fromDate, toDate })
     [drizzle-hr-payroll.repo.ts:17]
     SELECT * FROM salary_history WHERE [conditions]
     ORDER BY created_at DESC LIMIT $n OFFSET $m
  <- { data: SalaryHistory[], pagination: {...} }
```

### 3.3 Salary History Create

```
PayrollService.create(dto) [payroll.service.ts:29]
  -> hrPayrollRepo.create(dto)
     INSERT INTO salary_history VALUES(...)
     [drizzle-hr-payroll.repo.ts:31]
```

### 3.4 Frontend Payroll Calculations Tab

```
CalculationsTab.tsx
  -> useQuery({ queryKey: ["/api/finance-extended/payroll-calculations"] })
     GET /api/finance-extended/payroll-calculations
  -> displays table: employee name, gross pay, taxes, net pay, drift badge
  -> "Approve" button:
     -> PATCH /api/finance-extended/payroll-calculations/:id/approve
        { approvedBy: "admin" }  [CalculationsTab.tsx:22]
        *** hardcoded 'admin' approvedBy — user identity not used ***
  -> "New Calculation" button -> onNewCalculation() callback -> CalculatePayrollDialog
```

### 3.5 Domain Events

```
EventEmitter2 events emitted:
  'payroll.period.closed'   -- [payroll.service.ts:~110]
     payload: { periodId, totals, glLines, recordEventCount }
  'payroll.record.{eventName}' -- [payroll.service.ts:~145]
     payload: PayrollRecord domain event (completeRun result)
```

No listeners for these events were found in the payroll module files read.

---

## 4. DB Tables & Columns Used

### `salary_history` (schema-business-c-2-hr-payroll.ts:13, also salaryHistory camelCase via @europrint/schemas)

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| employee_id | integer | FK to employees (no FK constraint in schema) |
| salary_period_start | date | nullable |
| salary_period_end | date | nullable |
| base_salary | numeric(15,2) | nullable |
| salary_earned | numeric(15,2) | nullable |
| total_bonuses | numeric(15,2) | default '0' |
| other_bonuses | numeric(15,2) | default '0' |
| created_at | timestamp | defaultNow |
| updated_at | timestamp | defaultNow |

The camelCase version `salaryHistory` (from `@europrint/schemas`) adds columns:
- `userId` (integer) — queried in `drizzle-hr-payroll.repo.ts:22`
- `changeType` (text) — queried in `drizzle-hr-payroll.repo.ts:23`
- `effectiveDate` (date) — queried in `drizzle-hr-payroll.repo.ts:24,25`

These columns do NOT appear in `schema-business-c-2-hr-payroll.ts`'s `salary_history` definition. This is a **confirmed schema drift** between the two schema files.

### `payroll_periods` / `payroll_periods_hr` (schema-business-c-2-hr-payroll.ts:28, schema-compat-2.ts re-export)

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| period_name | text | nullable |
| period_start_date | date | |
| period_end_date | date | |
| status | text | default 'open' |
| total_payroll_amount | numeric(15,2) | |
| employee_count | integer | default 0 |
| closed_at | timestamp | set on close |
| created_at | timestamp | |
| updated_at | timestamp | |

### `payroll_rows` (schema-compat-2.ts:17)

| Column | Type | Notes |
|--------|------|-------|
| id | integer PK | |
| periodId | integer | FK to payroll_periods |
| employeeId | text | |
| baseSalary | numeric(18,2) | |
| bonus | numeric(18,2) | default '0' |
| deductions | numeric(18,2) | default '0' |
| netPay | numeric(18,2) | |
| status | text | default 'draft' |
| createdAt | timestamp | |

### `payroll_calculations` — DOES IT EXIST?

The frontend `CalculationsTab.tsx` calls `GET /api/finance-extended/payroll-calculations` and `PATCH /api/finance-extended/payroll-calculations/:id/approve`. This routes to the **finance-extended** module, not `hr/payroll`.

**Verification:** A grep for `payroll_calculations` across all `.ts` files in `apps/api/src` returned **zero matches**. There is NO Drizzle schema definition for `payroll_calculations`. The finance-extended module presumably has its own controller and table definition that was not read, but the absence of the table name in any schema file is a strong signal that either:
- The table is defined in the `@europrint/schemas` or `@workspace/db` library (not in the monorepo src), OR
- The endpoint queries a view or the `payroll_rows` table under a different alias, OR
- The endpoint is itself a stub.

---

## 5. UI Elements & Handlers

### CalculationsTab.tsx

| Element | Handler | Notes |
|---------|---------|-------|
| Table rows (employee, gross, taxes, net, drift) | display-only | drift computed client-side |
| Drift badge (green/yellow/red) | `computeDrift()` [CalculationsTab.tsx:30] | client computation |
| "Approve" button per row | `PATCH /api/finance-extended/payroll-calculations/:id/approve` | hardcoded `approvedBy: "admin"` |
| "New Calculation" button | `onNewCalculation()` -> `CalculatePayrollDialog` | |
| Loading skeleton | shown while `loading === true` | |

### CalculatePayrollDialog.tsx (not read, structure inferred)

Likely sends `POST /api/finance-extended/payroll-calculations` with period and employee parameters.

### AIPayrollDialog.tsx (not read)

Likely integrates with AI module for salary suggestions. Endpoint unknown.

### PayrollStatsCards.tsx (not read)

Likely fetches aggregate stats from `/api/hr/payroll/stats` or similar.

### TaxRulesSidebar.tsx (not read)

Likely displays static or DB-backed tax rate configuration.

---

## 6. What Is Missing or Broken

1. **GL journal insert is a stub (P1):** `DrizzleHrPayrollRepository.insertGlJournalLines()` [drizzle-hr-payroll.repo.ts:~60] only logs the lines and returns `{ inserted: N }` without inserting anything. The comment says "deferred to finance" and "Phase 8". Payroll close generates journal entries but they are never stored.

2. **`payroll_calculations` table has no Drizzle schema (P1):** The frontend calls `/api/finance-extended/payroll-calculations` but no `payroll_calculations` Drizzle schema was found in any `apps/api/src/shared/db/` file. The endpoint may be backed by `@europrint/schemas` or may itself be a stub.

3. **`salary_history` schema drift (P1):** The raw SQL schema (`schema-business-c-2-hr-payroll.ts`) has 9 columns. The ORM version imported from `@europrint/schemas` (used in the repo) appears to have additional columns (`userId`, `changeType`, `effectiveDate`). This divergence means the repo may fail on a fresh DB that only has the raw schema.

4. **Period close has no approval step (P2):** `canClose()` requires rows to be non-draft (status='approved' or 'posted') but there is no controller endpoint for approving individual payroll rows. The approval workflow is incomplete.

5. **EventEmitter2 listeners for payroll events are missing (P2):** `payroll.period.closed` and `payroll.record.*` events are emitted but no `@OnEvent()` listener was found in the payroll module. Events fire into a void unless a listener in another module (finance?) catches them — not confirmed.

6. **`approvedBy: "admin"` hardcoded in frontend (P2):** `CalculationsTab.tsx:22` sends `{ approvedBy: "admin" }` on approve mutation — the actual authenticated user's identity is not passed.

7. **No `Salary` value object (P0-claim from report spec — UNCONFIRMED):** The spec asked to verify if a `Salary` VO exists. No `Salary` value object file was found in `hr/domain/value-objects/`. `PayrollClosureService` uses raw numbers, not a typed VO. `PayrollRecord` aggregate exists but uses plain numeric fields.

8. **Leave accrual has no UI (P2):** `LeaveAccrualService` and cron job exist (`leave-accrual-job.service.ts`) but no frontend UI was found for managing or viewing leave accrual configuration.

---

## Summary

The payroll period close workflow is the most complete implementation: domain logic (`PayrollClosureService`) is well-structured and unit-testable, the `PayrollRecord` aggregate uses a proper lifecycle state machine, and domain events are emitted. However, the GL journal step — the most critical financial output — is a stub that only logs and returns a count without writing to the database. The `payroll_calculations` table used by the frontend has no Drizzle schema definition found. Schema drift in `salary_history` creates migration risk.

---

## Gaps Table

| Issue | Severity | Evidence file:line | Impact | Suggested Fix |
|-------|----------|--------------------|--------|---------------|
| GL journal insert is a stub | P1 | `drizzle-hr-payroll.repo.ts:~60` comment "deferred to finance / Phase 8" | Period close produces no accounting records | Implement INSERT to gl_documents / gl_lines in finance module and wire |
| payroll_calculations no schema | P1 | grep returns 0 matches across all schema files | Frontend approve may hit 500/404 | Locate in @europrint/schemas or create Drizzle table definition |
| salary_history schema drift | P1 | `schema-business-c-2-hr-payroll.ts:13` vs @europrint/schemas salaryHistory | Repo inserts/queries may fail on raw schema DB | Reconcile both schema definitions into one |
| No row-level approval endpoint | P2 | `payroll-closure.service.ts:55` requires non-draft; no PATCH /payroll-rows/:id/approve | Period cannot be closed — all rows stay draft | Add PATCH /hr/payroll/rows/:id/approve endpoint |
| payroll.period.closed event not consumed | P2 | `payroll.service.ts:~110`; no @OnEvent listener found | Downstream finance/notifications miss payroll close | Add listener in finance module or notifications |
| approvedBy hardcoded 'admin' | P2 | `CalculationsTab.tsx:22` | Audit trail shows wrong approver | Use `user.id` from useAuth context |
| No Salary VO | P3 | No Salary.ts found in hr/domain/value-objects/ | Salary arithmetic done with raw numbers — no unit boundary | Create Salary VO with currency/precision handling |
| Leave accrual has no UI | P2 | `leave-accrual-job.service.ts` exists; no payroll UI component for it | Cannot configure or monitor accrual rules from UI | Add accrual config page or expose via payroll settings |

---

## Open Questions / UNVERIFIED

- Does `apps/api/src/modules/finance/payroll/` contain the `payroll_calculations` table and its controller? Not read.
- Are there `@OnEvent('payroll.period.closed')` listeners in finance or notifications modules?
- What does `AIPayrollDialog.tsx` call? Could be AI salary suggestion endpoint in `ai-agents/` module.
- Does `PayrollRecord.fromProps()` and `completeRun()` have unit tests? The aggregate was referenced but not fully read.
- Is there a cron job for automatic payroll period creation?
