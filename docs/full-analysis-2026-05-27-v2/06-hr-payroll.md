# Report 06 — HR Payroll

**Date:** 2026-05-27 (second pass)
**Auditor:** forensic-agent (read-only, verifying round-1 claims)
**Round-1 file:** `docs/full-analysis-2026-05-27/06-hr-payroll.md`
**Scope:** `apps/api/src/modules/hr/payroll/`, `apps/api/src/modules/finance/payroll/`, `apps/api/src/modules/finance/presentation/finance-extended-payroll.controller.ts`, `apps/api/src/modules/hr/presentation/hr-payroll.controller.ts`, `artifacts/erp-dashboard/src/pages/payroll/`, `lib/db/src/schema/`, `_db_tables.txt`, `_db_cols.txt`.

---

## Diff vs round 1

| Round-1 claim | Reality | Verdict |
|---|---|---|
| **P1: `insertGlJournalLines()` is a stub, "only logs `console.log` and never inserts"** | The method calls `db.insert(gl_journal_entries).values(...)` — see `drizzle-hr-payroll.repo.ts:97-109`. It does insert. There IS a different P1 bug: it sets both `debit_account` and `credit_account` to the same value per line, losing the double-entry distinction. | **REFUTED** — round 1 was reading an older version. Actual insert exists; quality issue remains (different P1). |
| **P1: `payroll_calculations` has no Drizzle schema** | The Drizzle table `payrollCalculations` is defined at `lib/db/src/schema/fi-payroll-calc.ts:100-152`. The `payroll_calculations` table exists in the live DB (`_db_tables.txt`) with all expected columns (`_db_cols.txt`). | **REFUTED** — schema exists in `lib/db`, not in `apps/api/src/shared/db`. |
| **P2: `approvedBy: "admin"` hardcoded in `CalculationsTab.tsx:22`** | Line 68: `const approvedBy = user?.id?.toString() ?? user?.username ?? user?.email ?? 'admin';` — uses authenticated user; `'admin'` is the last-resort fallback only. | **PARTIAL** — current code uses real user. The `'admin'` fallback is still present but only fires if all auth fields are nullish. P3 at most. |
| **P3: No `Salary` value object** | File exists: `apps/api/src/modules/hr/domain/value-objects/salary.vo.ts` (class `Salary` with `create(gross, inps, jshd, other, currency)`), used by `payroll-record.aggregate.ts:19`. | **REFUTED** — VO exists. |
| **P2: payroll period close has no approval step** | Confirmed — `canClose()` requires `status !== 'draft'`, but no PATCH endpoint to flip rows to `approved`. | **CONFIRMED** |
| **P2: No `@OnEvent('payroll.period.closed')` listener anywhere** | Grep across `apps/api/src` for `@OnEvent('payroll.` and `payroll.period.closed`/`payroll.record.*` returns zero listeners (only the emit sites). | **CONFIRMED** |
| **P2: Leave accrual has no UI** | Out of scope here (covered in HR leaves report); not re-verified. | DEFERRED |
| **Salary history schema drift** | There ARE two Drizzle definitions of `salary_history`: one in `apps/api/src/shared/db/schema-business-c-2-hr-payroll.ts:14` (snake_case, 9 cols) and one in `lib/db/src/schema/payroll.ts:11` (camelCase, ~30 cols + convergence cols). The repo imports from `@europrint/schemas` which the tsconfig path-maps to `apps/api/src/shared/db/europrint-compat.ts`, which re-exports `salaryHistory` from `schema-compat-5.ts:42` (only 9 cols + drift cols `userId`/`changeType`/`effectiveDate`). The repo only uses columns that exist in compat-5, so no runtime crash. There IS schema duplication, but no immediate bug. | **PARTIAL** — duplication confirmed, runtime impact overstated. |
| Round 1 lists `FinanceExtendedPayrollController` endpoints (`POST /finance-extended/payroll/calculate`, `GET /finance-extended/payroll-calculations`, etc.) as "stubs that may hit 500" | All five endpoints in that controller return `notImplemented(...)` (HTTP 501) — see `finance-extended-payroll.controller.ts:32, 41, 48, 57, 66`. They are explicit 501s, not 500s, and the comment notes Wave 12 / `#FX-1` tracking. | **CLARIFIED** — they are deliberate 501s, not crashes. |

---

## 1. Controller & route inventory

The "payroll" surface is spread across **four** controllers, not the single one round 1 implied.

### 1.1 `HrPayrollClosureController` — single-endpoint, period-close only

File: `apps/api/src/modules/hr/payroll/hr-payroll-closure.controller.ts:20-28`

```ts
@Throttle({ default: { limit: 30, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...PAYROLL_CLOSE_ROLES)            // ['SUPER_ADMIN','DIRECTOR','PAYROLL_OFFICER','HR_MANAGER','admin']
@Controller('hr/payroll/closure')
export class HrPayrollClosureController {
  @Post('periods/:id/close')
  async closePeriod(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.closePeriod(id);
    return { data: unwrapOrInternal(r) };
  }
}
```

Routes:

| Method | Path | Handler |
|---|---|---|
| POST | `/hr/payroll/closure/periods/:id/close` | `HrPayrollClosureController.closePeriod` → `PayrollService.closePeriod` |

### 1.2 `HrPayrollController` — calc + approve + post-to-gl, different module

File: `apps/api/src/modules/hr/presentation/hr-payroll.controller.ts:40-146`

| Method | Path | Handler | Roles |
|---|---|---|---|
| GET | `/hr/payroll` | `getPayrolls` | PAYROLL_OFFICER, HR_MANAGER, DIRECTOR, SUPER_ADMIN |
| GET | `/hr/payroll/summary/:period` | `getPayrollSummary` | PAYROLL_OFFICER, DIRECTOR, SUPER_ADMIN |
| POST | `/hr/payroll/calculate` | `calculatePayroll` (inline INPS/JSHD math) | PAYROLL_OFFICER, HR_MANAGER, SUPER_ADMIN |
| POST | `/hr/payroll/:payrollId/approve` | `approvePayroll` (sets `approvedBy = user.sub ?? user.id`) | DIRECTOR, SUPER_ADMIN |
| POST | `/hr/payroll/:payrollId/post-to-gl` | `postToGL` — **only updates status='paid'**, does NOT post to GL | DIRECTOR, SUPER_ADMIN |

`postToGL` (`hr-payroll.controller.ts:138-145`) is misleadingly named — no `GlPostingService` call, no journal entries created. It only flips a status column.

### 1.3 `PayrollPeriodsController` (finance side)

File: `apps/api/src/modules/finance/presentation/payroll-periods.controller.ts:24-75`

| Method | Path | Handler |
|---|---|---|
| GET | `/payroll/periods` | `getPeriods` |
| POST | `/payroll/periods` | `createPeriod` |
| POST | `/payroll/periods/:id/calculate` | `calculatePeriod` (INPS 8% + JSHD 12% — but stored only in returned obj, NOT persisted; see `finance/payroll/payroll.service.ts:61-79`) |
| POST | `/payroll/periods/:id/close` | `closePeriod` — sets status='closed' only |
| POST | `/payroll/calculate-tax` | inline tax math, returns object |

This is the controller FinanceDashboard hits (`FinanceDashboard.tsx:113-146`).

### 1.4 `FinancePayrollController` — analytics

File: `apps/api/src/modules/finance/presentation/finance-payroll.controller.ts:22-47`

| Method | Path |
|---|---|
| GET | `/payroll/by-department` |
| GET | `/payroll/by-brigade` |
| GET | `/payroll/tax-summary` |

### 1.5 `FinanceExtendedPayrollController` — all stubs

File: `apps/api/src/modules/finance/presentation/finance-extended-payroll.controller.ts:25-95`

Every endpoint returns `notImplemented(...)` (HTTP 501):

| Method | Path | Status |
|---|---|---|
| POST | `/finance-extended/payroll/calculate` | 501 |
| POST | `/finance-extended/payroll/ai-calculate` | 501 |
| GET | `/finance-extended/payroll-calculations` | 501 |
| PATCH | `/finance-extended/payroll-calculations/:id/approve` | 501 |
| POST | `/finance-extended/payroll-calculations/:id/approve` | 501 |
| GET | `/finance-extended/payroll-contracts` | 501 |
| GET | `/finance-extended/payroll-tax-rules` | 501 |
| GET | `/finance-extended/tax-calendar` | 501 |
| GET | `/finance-extended/salary-benchmark/:id` | 501 |

Frontend `PayrollAutomation.tsx` queries `["/api/finance-extended/payroll-calculations"]`, `["/api/finance-extended/payroll-contracts"]`, `["/api/finance-extended/payroll-tax-rules"]` — every single one returns 501. The whole `/payroll` page is effectively non-functional against the live API (it renders empty arrays and reports loading states fine, but data never arrives).

---

## 2. Calculation service

**There is NO `PayrollCalculationService` class anywhere.** Grep for `PayrollCalculationService|payroll-calculation\.service` returns zero results across `apps/api/src`. Round 1's question "does it actually compute?" applies to several different code paths:

### 2.1 HR closure pipeline (`PayrollClosureService`)

File: `apps/api/src/modules/hr/payroll/payroll-closure.service.ts`

Pure-domain. Methods:
- `aggregate(rows)` — sums `totalBase`, `totalBonus`, `totalDeductions`, `totalNet` from input rows (`:59-76`).
- `canClose(period, rows)` — gating logic; rejects closed/non-open periods, zero rows, any draft row (`:84-104`).
- `buildJournal(totals, periodName)` — generates GL lines (`:117-141`):
  - DEBIT 6710 (salary) = `totalBase`
  - DEBIT 6720 (bonus)  = `totalBonus`
  - CREDIT 6730 (taxes) = `totalDeductions`
  - CREDIT 6760 (net payable) = `totalNet`
  - Asserts `|sumDebit - sumCredit| <= 0.5`, else `VALIDATION` error.
- `validatePeriodDates(period)` — sanity check.

This service **does not compute per-employee gross/net**. It only sums already-computed row values from `payroll_rows`.

### 2.2 HR per-employee calc (`HrPayrollController.calculatePayroll`)

File: `hr-payroll.controller.ts:76-115`. Inline formula:

```ts
const dailyRate    = body.baseSalary / 22;
const overtimePay  = (body.overtimeHours ?? 0) * (dailyRate / 8) * overtimeRate;  // overtimeRate default 1.5
const grossSalary  = body.baseSalary + overtimePay + (body.bonus ?? 0);
const inpsEmployee = grossSalary * INPS_EMPLOYEE_RATE;   // 0.08
const jshdEmployer = grossSalary * JSHD_EMPLOYER_RATE;   // 0.12
const netSalary    = grossSalary - inpsEmployee - (body.otherDeductions ?? 0);
```

Constants hardcoded at top of file (`hr-payroll.controller.ts:32-33`). **Does NOT subtract JSHD from net** — only INPS is subtracted. The Uzbek law is the other way around (JSHD 12% is employer side, INPS 8% employee side), so the formula is structurally correct on that point. Result is persisted via `hrRepo.savePayroll(...)`.

### 2.3 HR CQRS handler (`CalculatePayrollHandler`)

File: `apps/api/src/modules/hr/application/commands/calculate-payroll.handler.ts:42-122`

Identical math to 2.2 but routed through CommandBus. Emits `hr.payroll.calculated` event. Same hardcoded rates (`:20-21`). Duplicated logic — divergence risk.

### 2.4 Finance per-period calc (`finance/payroll/payroll.service.ts`)

File: `apps/api/src/modules/finance/payroll/payroll.service.ts:53-81`

```ts
const DEFAULT_INCOME_TAX_RATE = 12;   // ← 12%
const DEFAULT_PENSION_RATE    = 8;    // ← 8%
// ...
const incomeTax = parseFloat(((gross * DEFAULT_INCOME_TAX_RATE) / 100).toFixed(2));
const pension   = parseFloat(((gross * DEFAULT_PENSION_RATE) / 100).toFixed(2));
const net       = parseFloat((gross - incomeTax - pension).toFixed(2));
return { ...row, incomeTax, pensionDeduction: pension, netSalary: net, calculated: true };
```

The calculation result is **only returned to the caller** — `calculated` rows are NOT written back to `payroll_rows`. The only DB write is `updateStatus(id, 'calculated')` (`:69`). So `calculatePeriod` does compute, but persists nothing computable; the next call returns the same uncomputed rows.

Tax rate constants differ from HR side (12% vs 8% reversed labels), suggesting the two were written by different authors with no shared constants module.

### 2.5 Finance extended (`FinanceExtendedPayrollController.calculatePayroll`)

Returns 501.

---

## 3. GL journal lines insertion (P0 verification)

**Round 1 claim:** `insertGlJournalLines()` only calls `console.log` and never inserts. **REFUTED.**

### 3.1 Actual code

File: `apps/api/src/modules/hr/payroll/drizzle-hr-payroll.repo.ts:87-115`

```ts
async insertGlJournalLines(
  periodId: number,
  lines: ReadonlyArray<{ account: string; debit: number; credit: number; memo: string }>,
): Promise<Result<{ inserted: number }>> {
  try {
    const safeLines = Array.isArray(lines) ? lines : [];
    if (safeLines.length === 0) {
      this.logger.log(`GL journal: period #${periodId} → 0 lines, skipping insert`);
      return Ok({ inserted: 0 });
    }
    await db.insert(gl_journal_entries).values(
      safeLines.map(line => ({
        document_type: 'payroll',
        document_id:   periodId,
        debit_account: line.account,
        credit_account: line.account,
        amount:        String(line.debit !== 0 ? line.debit : line.credit),
        currency:      'UZS',
        description:   line.memo ?? 'Payroll GL entry',
        posted_at:     new Date(),
        created_at:    new Date(),
      }))
    );
    this.logger.log(`GL journal: period #${periodId} → ${safeLines.length} lines inserted`);
    return Ok({ inserted: safeLines.length });
  } catch (e: unknown) {
    return Err((e as Error)?.message || `GL journal yozishda xatolik: #${periodId}`);
  }
}
```

It DOES call `db.insert(gl_journal_entries).values(...)` (line 97).

### 3.2 But there are two new P1 bugs

**Bug 1 — debit_account == credit_account on every row.** For a salary-debit line:

- Closure service produces: `{ account: '6710', debit: 1000000, credit: 0, memo: '...' }`
- Repo inserts: `{ debit_account: '6710', credit_account: '6710', amount: '1000000', ... }`

The `gl_journal_entries` row claims **both debit and credit go to account 6710**, which is nonsense for double-entry. `gl-posting.service.ts:106-107` in the canonical finance service handles this correctly by passing `'OFFSET'` as the counter-account:

```ts
debitAccountId:  line.debit  > 0 ? line.accountCode : 'OFFSET',
creditAccountId: line.credit > 0 ? line.accountCode : 'OFFSET',
```

The HR payroll repo does NOT do this. **P1**.

**Bug 2 — does not route through `GlPostingService`.** The canonical entry-creation path is `finance/domain/services/gl-posting.service.ts:postPayroll(...)` (line 72), which emits a four-line balanced journal (salary expense, employer contribution, salary payable, employee deductions) with `OFFSET` counter-accounts. The HR closure path bypasses this entirely and writes raw rows to `gl_journal_entries` with the broken account semantics above. Two parallel GL posting implementations — divergence risk + accounting incorrectness. **P1**.

### 3.3 Schema sanity

`gl_journal_entries` Drizzle table at `apps/api/src/shared/db/schema-business-b-1.ts:135-146` matches the live DB columns (per `_db_cols.txt` lines for `gl_journal_entries`). No schema-vs-DB drift for this insert.

---

## 4. payroll_calculations table status

### 4.1 Live DB — EXISTS

From `_db_tables.txt`: `payroll_calculations` is present. From `_db_cols.txt` it has 32 columns including `id, period_id, employee_id, contract_id, pay_type, work_days, work_hours, overtime_hours, production_units, base_pay, hourly_pay, piecework_pay, overtime_pay, bonuses, allowances, gross_pay, tax_inps, tax_jshd, total_taxes, other_deductions, advances, loans, total_deductions, net_pay, min_wage_top_up, status, calculated_at, approved_by, approved_at, paid_at, notes, created_at`.

### 4.2 Drizzle schema — EXISTS (in lib/db, not apps/api/src)

File: `lib/db/src/schema/fi-payroll-calc.ts:100-152`. Definition matches live DB columns. Has CHECK constraints on `pay_type ∈ {fixed,hourly,piecework}` and `status ∈ {draft,calculated,approved,paid}`, plus four indexes on `employee_id`, `period_id`, `status`, `created_at`.

### 4.3 Apps/api/src schema — ABSENT

`grep -rn "payroll_calculations\|payrollCalculations"` across `apps/api/src` returns only:
- The migration-drift idempotent `CREATE TABLE IF NOT EXISTS` at `apps/api/src/shared/db/invariants/migrations-drift.ts:3211`.

There is no Drizzle import / re-export of `payrollCalculations` in `apps/api/src/shared/db/europrint-compat.ts` or any `schema-compat-*.ts`. The HR/Finance payroll repos never reference the table.

### 4.4 Wired controllers

Only `FinanceExtendedPayrollController` lists routes that would conceptually own this table — and every one returns 501. So even though the table exists and has a Drizzle schema in `lib/db`, no backend code reads or writes it. The frontend `PayrollAutomation.tsx` and `CalculationsTab.tsx` query against an endpoint that always 501s. **P1: dead table + dead frontend integration.**

---

## 5. approvedBy & similar hardcoded fields

### 5.1 Frontend `CalculationsTab.tsx`

File: `artifacts/erp-dashboard/src/pages/payroll/CalculationsTab.tsx:66-78`

```ts
const approveMutation = useMutation({
  mutationFn: async (id: string) => {
    const approvedBy = user?.id?.toString() ?? user?.username ?? user?.email ?? 'admin';
    return apiRequest("PATCH", `/api/finance-extended/payroll-calculations/${id}/approve`, { approvedBy });
  },
  ...
});
```

`user` comes from `useAuth()` hook (`:17, 64`). The fallback chain is `id → username → email → 'admin'`. Round 1's "hardcoded 'admin'" claim is wrong — the literal is a defensive fallback only. Even then, the endpoint returns 501, so the body is never persisted. **P3** at most (cosmetic — the fallback string could be `null` or `'unknown'` for cleaner audit).

### 5.2 Backend `HrPayrollController.approvePayroll`

File: `hr-payroll.controller.ts:121-130`

```ts
async approvePayroll(@Param('payrollId') payrollId: string, @CurrentUser() user: AuthenticatedUser) {
  const result = await this.hrRepo.updatePayroll(payrollId, {
    status:     'approved',
    approvedBy: user?.sub ?? user?.id,
  } as Record<string, unknown>);
  ...
}
```

Uses `@CurrentUser()` decorator. NOT hardcoded.

### 5.3 Backend `HrPayrollController.postToGL`

File: `hr-payroll.controller.ts:138-145`

```ts
async postToGL(@Param('payrollId') payrollId: string, @CurrentUser() user: AuthenticatedUser) {
  const result = await this.hrRepo.updatePayroll(payrollId, {
    status:   'paid',
    postedBy: user?.sub ?? user?.id,
  } as Record<string, unknown>);
  ...
}
```

Uses `@CurrentUser()`. NOT hardcoded. But — endpoint is mis-named; it only updates two columns, no GL writes. **P1: misleading endpoint name.**

---

## 6. Payroll tables (periods, rows, items)

### 6.1 `payroll_periods`

**Live DB columns** (from `_db_cols.txt`): `id, period_name, start_date, end_date, status, total_amount, created_at, closed_at, period_start_date, period_end_date, calculation_date, approval_date, payment_date, total_payroll_amount, employee_count, created_by, approved_by, notes, updated_at, tenant_id` (20 columns).

**Drizzle in `lib/db/src/schema/fi-gl.ts:255-280`** — full schema with all 20 columns + CHECK on `status ∈ {open,processing,closed}`.

**Drizzle in `apps/api/src/shared/db/schema-business-c-2-hr-payroll.ts:29-40`** (alias `payroll_periods_hr`) — only 10 columns (subset), used by HR closure repo via the `schema-compat-2.ts:16` re-export `export const payrollPeriods = canonicalPayrollPeriods;`.

The HR closure repo (`drizzle-hr-payroll.repo.ts:60-72`) writes only `status` and `closed_at` — both columns exist in the local stub, so the partial schema is fine for that particular update. The `markPeriodClosed` comment confirms intent (`":62`): "payroll_periods canonical schema uses `closed_at` (timestamp) — no `approvalDate` column."

### 6.2 `payroll_rows`

**Live DB columns** (from `_db_cols.txt`): `id, period_id, employee_id, work_days, production_quantity, rate_per_unit, base_salary, bonuses, deductions, total_salary, notes, created_at, bonus, net_pay, status` (15 columns).

**Drizzle in `lib/db/src/schema/fi-gl.ts:297-314`** — superset, with FK to `payrollPeriods.id` (set null on delete) and FK to `users.id`.

**Drizzle in `apps/api/src/shared/db/schema-compat-2.ts:18-28`** — only 9 columns: `id, periodId, employeeId, baseSalary, bonus, deductions, netPay, status, createdAt`. Used by HR closure repo for list and update.

The HR closure repo `listRowsByPeriod` (`drizzle-hr-payroll.repo.ts:51-58`) `select()`s `*` — Drizzle will then map only the columns it knows about. Rows that have `work_days`, `production_quantity`, `rate_per_unit`, `total_salary`, `notes` in the DB will lose those fields when read via the compat-2 schema. **P2: silent data dropping on read.**

### 6.3 `payroll items / entries`

`payroll_entries` exists in the live DB (`_db_cols.txt`: `id, cycle_id, employee_id, base_salary, net_pay, status, created_at, updated_at`) but is referenced **nowhere** in `apps/api/src` (grep for `payrollEntries|payroll_entries` returns zero hits). Dormant table.

### 6.4 Per-employee calculation rows

`payroll_calculations` is the per-employee/per-period detailed calculation. See §4 — exists in DB and `lib/db` schema, but no backend code reads or writes it.

---

## 7. Salary bands & history

### 7.1 `salary_bands`

**Live DB:** present with `id, position_id, currency, min_salary, max_salary, mid_salary, effective_from, effective_to, is_active, created_at, org_function_id, department_id`.

**Drizzle in `lib/db/src/schema/payroll.ts:122-133`** — defined.

**Apps/api/src usage:** zero references. No service reads or writes `salary_bands`. No controller routes. No frontend integration. **Dead table + dormant code path** — `salaryBands` is exported from `lib/db` but never imported in `apps/api/src`. **P2: feature defined but not implemented.**

### 7.2 `salary_history`

**Live DB:** 31 columns, see `_db_cols.txt`.

**Drizzle (3 definitions — bad):**

1. `lib/db/src/schema/payroll.ts:11-57` — canonical, ~30 cols matching live DB closely.
2. `apps/api/src/shared/db/schema-business-c-2-hr-payroll.ts:14-25` — `salary_history` snake_case, 9 cols.
3. `apps/api/src/shared/db/schema-compat-5.ts:42-53` — `salaryHistory` camelCase, 10 cols: `id, userId, employeeId, amount, currency, effectiveDate, reason, createdBy, createdAt, changeType`.

The HR payroll repo imports from `@europrint/schemas` (`drizzle-hr-payroll.repo.ts:3`), which path-maps to `apps/api/src/shared/db/europrint-compat.ts`, which re-exports `salaryHistory` from `schema-compat-5.ts:42` (definition #3 above).

The repo queries `salaryHistory.userId`, `salaryHistory.changeType`, `salaryHistory.effectiveDate`, `salaryHistory.createdAt` — all four exist in definition #3. So the repo is internally consistent. The drift risk is: the repo inserts via `db.insert(salaryHistory).values({ ...dto })` (`:36`) — whatever the controller passes in `dto`. If the DTO has columns that exist in the live DB but not in compat-5, Drizzle's type inference for `$inferInsert` will reject them at compile time. So no runtime crash, but the repo can only insert/read 10 of the 31 columns. **P2: schema fragmentation hides 21 columns from the API.**

### 7.3 `salary_history` controllers

`PayrollService.findAll()` and `PayrollService.create()` (`apps/api/src/modules/hr/payroll/payroll.service.ts:25-49`) are wired but I did not find a controller exposing them as HTTP routes. The `HrPayrollClosureController` only has the close endpoint. So `salary_history` CRUD via `PayrollService` is **defined but unreachable** unless invoked by another module via DI. Grep for `payrollService.findAll|payrollService.create` outside the service file: not searched yet, but the closure controller is the only `@Controller` referencing this `PayrollService` (the finance one has a separate `PayrollService` class).

---

## 8. Integration with Finance GL

### 8.1 What payroll calls

**HR closure path:** writes directly to `gl_journal_entries` via Drizzle — see §3. Does NOT call `GlPostingService`.

**Finance `PayrollPeriodsController.closePeriod`:** only updates status — no GL write.

**Finance `FinancePayrollController`:** read-only analytics, no GL.

**HR `HrPayrollController.postToGL`:** updates `status='paid'` only, no GL.

### 8.2 What `GlPostingService` exposes for payroll

File: `apps/api/src/modules/finance/domain/services/gl-posting.service.ts:72-83`

```ts
async postPayroll(payrollId: number, gross: number, inps: number, jshd: number): Promise<Result<number>> {
  this.logger.debug(`Posting Payroll - ID: ${payrollId}, Gross: ${gross}, INPS: ${inps}, JSHD: ${jshd}`);
  const lines: JournalLine[] = [
    { accountCode: GL.SALARY_EXPENSE, accountName: 'Salary Expense', debit: gross, credit: 0 },
    { accountCode: GL.EMPLOYER_CONTRIBUTION, accountName: 'Employer Contribution', debit: inps, credit: 0 },
    { accountCode: GL.SALARY_PAYABLE, accountName: 'Salary Payable', debit: 0, credit: gross - inps - jshd },
    { accountCode: GL.EMPLOYEE_DEDUCTIONS, accountName: 'Employee Deductions', debit: 0, credit: inps + jshd },
  ];
  const result = await this.createJournalEntry(lines, `PR-${payrollId}`);
  ...
}
```

This is the right shape (4 lines, balanced) and uses `createJournalEntry` (`:85-120`) which correctly sets `OFFSET` counter-accounts. **No payroll code calls `postPayroll`.** Grep for `postPayroll(` returns only this definition. Orphan method. **P1: canonical GL posting method exists but is dead code.**

### 8.3 `payroll_journal_entries` table

Live DB has `payroll_journal_entries` (`_db_cols.txt`): `id, payroll_period_id, employee_id, gl_document_id, entry_type, debit_account_code, credit_account_code, amount, currency, description, posted_at, posted_by`. Dedicated per-payroll-period journal log table.

**Apps/api/src usage:** zero. Defined in `lib/db/src/schema/hr-architecture-additions.ts` and migration `0007_hr_architecture_additions.sql`. Dormant — the HR closure path uses `gl_journal_entries` instead. **P2: another dead table.**

---

## 9. Frontend integration

### 9.1 Page tree

- `artifacts/erp-dashboard/src/pages/PayrollAutomation.tsx` — main payroll page, renders 3 cards + 2 tabs (`Contracts`, `Calculations`) + `TaxRulesSidebar`.
- `artifacts/erp-dashboard/src/pages/payroll/` — child components:
  - `CalculationsTab.tsx` (`:1-161`) — table of `PayrollCalculation` rows with drift badge + approve button.
  - `ContractsTab.tsx` — read-only contracts table.
  - `CalculatePayrollDialog.tsx` (`:1-200+`) — new-calculation modal, POSTs `/api/finance-extended/payroll/calculate`.
  - `AIPayrollDialog.tsx` (`:1-200+`) — AI suggestion modal, POSTs `/api/finance-extended/payroll/ai-calculate`.
  - `PayrollStatsCards.tsx` — KPI cards: activeContracts, pendingCalcs, approvedCalcs, totalGross.
  - `TaxRulesSidebar.tsx` — reads `/api/finance-extended/payroll-tax-rules`.
  - `types.ts` — `PayrollContract`, `PayrollCalculation`, `PayrollTaxRule`, `PayrollUser`, `AIPayrollResult`, plus the zod `calculationFormSchema`.
- `artifacts/erp-dashboard/src/pages/FinanceDashboardPayrollTab.tsx` — periods + rows table inside the finance dashboard. Hits `/api/payroll/periods` (NOT `/api/finance-extended/...`).
- `artifacts/erp-dashboard/src/hooks/use-hr-payroll.ts` — hooks for `/hr/payroll/periods`. NB: routes `/api/hr/payroll/periods` are NOT defined by `HrPayrollClosureController` or `HrPayrollController` — those expose `/hr/payroll/closure/periods/:id/close` and `/hr/payroll` respectively. The hook calls a route that **doesn't exist** in the backend; tests at `use-hr-payroll.test.ts:97` mock it. **P1: frontend hook hits 404.**

### 9.2 Data queries from `PayrollAutomation.tsx`

| Frontend query key | Backend endpoint | Backend status |
|---|---|---|
| `/api/system-settings` | `/system-settings` | not audited here |
| `/api/finance-extended/payroll-contracts` | `FinanceExtendedPayrollController.getPayrollContracts` | 501 |
| `/api/finance-extended/payroll-calculations` | `FinanceExtendedPayrollController.getPayrollCalculations` | 501 |
| `/api/finance-extended/payroll-tax-rules` | `FinanceExtendedPayrollController.getPayrollTaxRules` | 501 |
| `/api/users` | users module | not audited here |

Frontend's main payroll page renders against 3 endpoints that always return 501. The page mostly works because TanStack Query falls back to empty arrays and `isError` is set; the page never displays real data. **P1.**

### 9.3 What actually works

- `FinanceDashboardPayrollTab` → `/api/payroll/periods` (GET/POST), `/api/payroll/periods/:id/calculate`, `/api/payroll/periods/:id/close` — these are wired to `PayrollPeriodsController` and DO work (though `calculatePeriod` doesn't persist its results, see §2.4).
- `HrPayrollClosureController.closePeriod` — wired, working, with the GL-insert bugs documented in §3.

### 9.4 Frontend hardcoded fallbacks observed

- `CalculationsTab.tsx:68` — `?? 'admin'` final fallback when no auth field is set (see §5.1).

---

## 10. Findings summary

### P0

None. The most severe round-1 P0 (GL stub) is REFUTED — code does insert.

### P1

| # | Issue | Evidence | Impact |
|---|---|---|---|
| 1 | `insertGlJournalLines` writes both debit and credit accounts to the same column value (`line.account`), losing double-entry semantics | `drizzle-hr-payroll.repo.ts:101-102` | GL ledger reports cannot distinguish debit from credit per line; account balances will be wrong |
| 2 | HR closure bypasses canonical `GlPostingService.postPayroll` — two parallel GL writers with different shapes | `drizzle-hr-payroll.repo.ts:97` raw insert vs `gl-posting.service.ts:72-83` | `postPayroll` is orphan code; HR pipeline produces non-standard journal rows |
| 3 | `FinanceExtendedPayrollController` — all 5 routes return 501, but frontend `PayrollAutomation.tsx` queries 3 of them as its primary data source | `finance-extended-payroll.controller.ts:32,41,48,57,66`; `PayrollAutomation.tsx:38,42,46` | Main payroll UI has no working backend; renders empty tables |
| 4 | `payroll_calculations` table + Drizzle schema exist but no backend code reads/writes them | `_db_cols.txt`; `fi-payroll-calc.ts:100`; grep returns 0 hits in `apps/api/src` | Designed feature is dead end |
| 5 | Frontend hook `use-hr-payroll.ts` calls `/api/hr/payroll/periods` — route does not exist in any controller | `use-hr-payroll.ts:11-20`; controller routes in `hr-payroll-closure.controller.ts` and `hr-payroll.controller.ts` | 404 in production |
| 6 | `HrPayrollController.postToGL` (`:138-145`) is mis-named — only updates status='paid' and `postedBy` column, no GL write | `hr-payroll.controller.ts:138-145` | Endpoint name lies about its effect; user can think they posted to GL when they haven't |

### P2

| # | Issue | Evidence | Impact |
|---|---|---|---|
| 7 | Per-period `calculatePeriod` (finance) returns calculated rows but does NOT persist them — only `updateStatus('calculated')` | `finance/payroll/payroll.service.ts:69-79` | Next call returns same uncalculated rows; user sees calculation flicker but DB stays the same |
| 8 | Duplicated calculation logic: `HrPayrollController.calculatePayroll`, `CalculatePayrollHandler.execute`, `finance/payroll.service.ts:calculatePeriod` all hardcode tax rates (8% / 12% / 0.08 / 0.12) | `hr-payroll.controller.ts:32-33`; `calculate-payroll.handler.ts:20-21`; `finance/payroll/payroll.service.ts:58-59` | Rate changes require edits in 3 places; risk of drift |
| 9 | No row-level approval endpoint — `canClose()` requires non-draft rows but nothing flips a row from draft to approved | `payroll-closure.service.ts:99-102`; no PATCH on `payroll_rows` found | Period can never be closed without manual DB update |
| 10 | No `@OnEvent('payroll.period.closed')` or `@OnEvent('payroll.record.*')` listeners anywhere in `apps/api/src` | Grep returns zero | Emitted events go to a void; downstream finance/notifications integration missing |
| 11 | `payroll_rows` read via compat-2 schema (9 cols) silently drops 6 DB columns (`work_days`, `production_quantity`, `rate_per_unit`, `total_salary`, `notes`, others) | `schema-compat-2.ts:18-28` vs `_db_cols.txt` payroll_rows.* | Hidden data not surfaced; production data unavailable to closure pipeline |
| 12 | `salary_bands` table + `lib/db` schema exist; zero `apps/api/src` usage | `lib/db/src/schema/payroll.ts:122-133`; grep returns 0 | Feature defined but not implemented; cannot enforce min/max during salary changes |
| 13 | `payroll_journal_entries` table exists in DB and `lib/db` schema, but HR closure writes to `gl_journal_entries` instead — leaving the payroll-specific journal table dormant | `_db_cols.txt`; `lib/db/src/schema/hr-architecture-additions.ts`; grep returns 0 in apps/api/src | Per-period payroll posting log not produced; auditability degraded |
| 14 | `salary_history` defined in 3 different Drizzle files with different column sets; repo uses the 10-col stub via `@europrint/schemas` path-map | `payroll.ts:11`, `schema-business-c-2-hr-payroll.ts:14`, `schema-compat-5.ts:42` | API can only insert/read 10 of 31 live-DB columns |
| 15 | `payroll_entries` table exists in DB, zero references in `apps/api/src` | `_db_cols.txt`; grep returns 0 | Dormant table |
| 16 | `PayrollService.findAll()` and `PayrollService.create()` (HR side, `salary_history`) wired in DI but no controller exposes them | `payroll.service.ts:25-49`; `hr-payroll-closure.controller.ts` only has close endpoint | Salary-history CRUD unreachable via HTTP |

### P3

| # | Issue | Evidence | Impact |
|---|---|---|---|
| 17 | `'admin'` literal as final fallback for `approvedBy` in `CalculationsTab.tsx:68` | `CalculationsTab.tsx:66-78` | Only fires if auth completely fails; cosmetic |
| 18 | `CalculatePayrollHandler` does not actually create a `PayrollRecord` aggregate even though the aggregate exists — math is open-coded in the handler | `calculate-payroll.handler.ts:71-77`; aggregate at `payroll-record.aggregate.ts` is only used by closure path | Domain modeling inconsistency; aggregate has unit tests but app code rarely uses it |
| 19 | `PayrollRecord.createFromEmployee` factory exists but is only used (if at all) by the closure path's `emitPayrollRecordCompletions` via `fromProps` — `createFromEmployee` itself has no callers | `payroll-record.aggregate.ts:64-100`; `payroll.service.ts:160-171` uses `fromProps`, not `createFromEmployee` | Dead factory method |

---

## Appendix: file inventory

**HR payroll module (`apps/api/src/modules/hr/payroll/`):**

| File | Lines | Purpose |
|---|---|---|
| `drizzle-hr-payroll.repo.ts` | 116 | DB access via Drizzle |
| `hr-payroll-closure.controller.ts` | 28 | Single POST endpoint |
| `i-hr-payroll.repo.ts` | 22 | Repo interface + DI token |
| `payroll-closure.service.ts` | 163 | Pure domain logic |
| `payroll.service.ts` | 194 | Orchestration + event emission |

**HR domain (`apps/api/src/modules/hr/domain/`):**

| File | Purpose |
|---|---|
| `aggregates/payroll-record.aggregate.ts` | PayrollRecord state machine |
| `value-objects/salary.vo.ts` | Salary VO (gross/inps/jshd/net invariant) |
| `events/salary-increased.event.ts`, `salary-decreased.event.ts`, `payroll-run-completed.event.ts` | Domain events |

**Other HR payroll touchpoints:**

| File | Purpose |
|---|---|
| `apps/api/src/modules/hr/presentation/hr-payroll.controller.ts` | Calculate/approve/post-to-gl HTTP routes |
| `apps/api/src/modules/hr/application/commands/calculate-payroll.handler.ts` | CQRS handler — duplicate math |
| `apps/api/src/modules/hr/application/queries/get-payroll.handler.ts` | (not deeply read) |

**Finance payroll (`apps/api/src/modules/finance/payroll/`):**

| File | Purpose |
|---|---|
| `drizzle-finance-payroll.repo.ts` | Drizzle repo |
| `i-finance-payroll.repo.ts` | Interface |
| `payroll.service.ts` | Periods CRUD + calculate (returns-only) |

**Finance payroll presentation (`apps/api/src/modules/finance/presentation/`):**

| File | Purpose |
|---|---|
| `payroll-periods.controller.ts` | `/payroll/periods` CRUD + `/payroll/calculate-tax` |
| `finance-payroll.controller.ts` | `/payroll/by-department`, `by-brigade`, `tax-summary` |
| `finance-extended-payroll.controller.ts` | 5 endpoints, all 501 |

**Frontend (`artifacts/erp-dashboard/src/pages/payroll/`):**

| File | Purpose |
|---|---|
| `CalculationsTab.tsx` | Calculations table |
| `ContractsTab.tsx` | Contracts table |
| `CalculatePayrollDialog.tsx` | New-calculation modal |
| `AIPayrollDialog.tsx` | AI-suggested calculation modal |
| `PayrollStatsCards.tsx` | KPI cards |
| `TaxRulesSidebar.tsx` | Tax rate sidebar |
| `types.ts` | Shared TS types + zod schema |

**Schemas (Drizzle):**

| File | Tables |
|---|---|
| `lib/db/src/schema/fi-gl.ts:255-280, 297-314` | `payroll_periods`, `payroll_rows` (canonical) |
| `lib/db/src/schema/fi-payroll-calc.ts:100-152` | `payroll_calculations` (canonical) |
| `lib/db/src/schema/payroll.ts:11-57, 122-133` | `salary_history`, `salary_bands` (canonical) |
| `apps/api/src/shared/db/schema-business-c-2-hr-payroll.ts:14-40` | `salary_history`, `payroll_periods_hr` (stubs, snake_case) |
| `apps/api/src/shared/db/schema-compat-2.ts:16-28` | `payrollPeriods` (re-export), `payrollRows` (stub) |
| `apps/api/src/shared/db/schema-compat-5.ts:42-53` | `salaryHistory` (stub, used by `@europrint/schemas`) |
| `apps/api/src/shared/db/schema-business-b-1.ts:135-146` | `gl_journal_entries` |

---

**End of Report 06 v2.**
