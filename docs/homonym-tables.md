# Homonym Tables Inventory

> Date: 2026-05-22  
> Purpose: Track tables where the **DB table name is identical** but the
> Drizzle `pgTable` definitions in different schema files describe **semantically
> different business entities** — i.e. homonyms, not duplicates.
>
> These are **NOT to be merged**. Each version represents a distinct domain concept
> that happens to share a string identifier. Long-term fix: rename one side and
> migrate the DB table.

---

## 1. `abc_analysis` (2 homonyms)

### 1.1 Attendance / Performance KPI variant — CANON (matches live DB)

- **File:** `lib/db/src/schema/attendance.ts:77`
- **Columns:** 18
- **Primary key axis:** `employeeId` (FK → `employees.id`)
- **Domain:** HR attendance + multi-factor performance scoring
  - `attendanceScore`, `qualityScore`, `taskCompletionScore`, `lmsTrainingScore`,
    `safetyComplianceScore`, `teamworkCollaborationScore`, `totalScore`
  - `category` ∈ {A, B, C} with `previousCategory` + `categoryChange` audit trail
  - `analysisPeriodStart` / `analysisPeriodEnd` (period-based, not snapshot)
  - `bonusPercentage` — drives payroll bonus per period
- **Unique index:** `uq_abc_emp_period (employee_id, analysis_period_start)`
- **DB state:** 18 columns — this is the LIVE schema (see drizzle snapshots)
- **Consumers:** None at TS source level (no `import { abcAnalysis }` from this file). All `getAbcAnalysis()` callers use raw SQL or DTOs.
- **Symbol:** `export const abcAnalysis` + `insertAbcAnalysisSchema` + `type AbcAnalysis`

### 1.2 HR Compensation Grade variant — DRIZZLE-ONLY (does NOT match live DB)

- **File:** `lib/db/src/schema/hr-compensation.ts:18`
- **Columns:** 17 (TS), but live DB has 18 from variant 1.1
- **Primary key axis:** `userId` (FK → `users.id`, unique)
- **Domain:** HR grade snapshot — current standing per user
  - `grade` ∈ {A, B, C} (with `score` 1-5)
  - Rate-based metrics: `performanceRate`, `attendanceRate`, `punctualityRate`,
    `courseCompletionRate`, `testPassRate`, `taskCompletionRate`
  - `disciplineScore` (penalties/bonuses), `initiativeCount`, `loyaltyScore`
  - `benefits` jsonb — eligibility list (loan/trip/salary_increase/bonus)
  - `lastCalculated` — single-snapshot semantic (not period-based)
- **DB state:** This shape does NOT exist in live DB. If anything writes to
  `abc_analysis` using this Drizzle definition, it will runtime-error on
  missing columns (`grade`, `score`, `benefits`, etc.).
- **Consumers:** None at TS source level.
- **Symbol:** `export const abcAnalysis` + `insertAbcAnalysisSchema` + `type AbcAnalysis`
  (collides with variant 1.1 — but no barrel re-exports both, so no TS error)

### Decision: documentation only (no rename today)

**Reasoning:**
- Both `pgTable` exports are **orphans** — no `apps/api/src` file imports the
  symbol. They're inert TypeScript.
- Renaming the var (`abcAnalysis` → `attendanceAbcAnalysis` / `compensationGradeSnapshot`)
  changes file lines but solves no live problem.
- The **real** fix is choosing which definition matches live DB and either:
  1. Deleting `hr-compensation.ts:abcAnalysis` (DB doesn't match it anyway), OR
  2. Renaming its DB table to `abc_grade_snapshots` + migration + Drizzle update.

### Future rename plan (when scheduled)

| Side | Current var | Suggested var | Suggested DB table |
|------|-------------|---------------|---------------------|
| 1.1 (attendance.ts) | `abcAnalysis` | `attendanceAbcAnalysis` | keep `abc_analysis` |
| 1.2 (hr-compensation.ts) | `abcAnalysis` | `hrGradeSnapshots` | rename to `hr_grade_snapshots` |

After rename, also update:
- `createInsertSchema`, `insert*Schema` names
- `type AbcAnalysis` aliases (each becomes `type AttendanceAbcAnalysis` / `type HrGradeSnapshot`)
- `attendance.ts` barrel hit: none (file is not in barrel today)
- `hr-personal.ts` re-exports `hr-compensation.ts` — would propagate rename

---

## 2. `financial_kpis` (2 homonyms)

### 2.1 Full canonical KPI ratios — CANON

- **File:** `lib/db/src/schema/fi-budgets.ts:213`
- **Columns:** 16 (id + kpiDate + kpiPeriod + 13 ratio metrics)
- **Domain:** Comprehensive financial ratio snapshot
  - **Liquidity:** `currentRatio`, `quickRatio`
  - **Leverage:** `debtToEquity`
  - **Profitability:** `grossProfitMargin`, `netProfitMargin`, `returnOnAssets`, `returnOnEquity`
  - **Activity:** `inventoryTurnover`, `receivablesTurnover`, `payablesTurnover`
  - **Cash Conversion:** `cashConversionCycle`, `workingCapital`
- **DB state:** matches live DB (16 columns, 2 indexes, 1 CHECK)
- **Validation:** `insertFinancialKPISchema` with `kpiDate` regex + `kpiPeriod` enum
- **Consumers (canonical via `@europrint/schemas` barrel):**
  - `apps/api/src/modules/finance/reports/drizzle-reports.repo.ts:10,92,93` —
    reads `db.select().from(financialKPIs).orderBy(desc(kpiDate)).limit(10)`
- **Re-exported by:** `fi-ap-ar.ts`, `fi-kassa.ts`, `fi-payroll-calc.ts` → `fi-schema` barrel

### 2.2 Stripped-down stub — DUPLICATE in wrong location (violates Rule 17)

- **File:** `apps/api/src/shared/db/schema-finance-extended.ts:79`
- **Columns:** 7 (id + kpiDate + kpiPeriod + only 4 ratios:
  currentRatio, quickRatio, debtToEquity, grossProfitMargin)
- **Domain:** Same conceptual entity but truncated — appears to be a legacy
  scaffold before the full ratio set was added in `lib/db`.
- **Violates Rule 17:** New `pgTable` defs MUST live only in `lib/db/src/schema/`.
  `apps/api/src/shared/db/` should only contain shims/re-exports.
- **Consumers (the stub):** None directly. Only re-exported by
  `europrint-compat.ts:72` → `schema-finance.ts` → `schema.ts` (compatibility barrel chain).
- **Risk:** If anything imports `financialKPIs` from `@shared/db/europrint-compat`
  expecting all 13 ratios, it will silently get only 4. Today this does not
  happen — the sole real consumer (`drizzle-reports.repo.ts`) imports from
  `@europrint/schemas` (canon).

### Decision: documentation only (no rename today)

**Reasoning:**
- The stub is already dead at the read path — canon is used in production.
- Replacing the stub with a shim `export { financialKPIs } from '@workspace/db/schema/fi-budgets'`
  is the proper fix. That is a **separate cleanup task** (would also remove rule-17
  violation). Out of scope for this 2-table documentation pass.

### Future fix plan

1. Replace `schema-finance-extended.ts:79-87` `financialKPIs` pgTable definition with
   a SHIM re-export from `@workspace/db/schema/fi-budgets` (similar to lines 33, 39,
   44, 50, 55 in same file).
2. Run BE tsc — verify no caller depends on the missing 9 columns (no caller does today).
3. Drop migration is unnecessary (DB already has the full 16-col table).

---

## Verification (2026-05-22)

```bash
cd Uzbek-Language-Module
pnpm --filter @europrint/api exec tsc --noEmit --incremental false 2>&1 | grep "error TS" | wc -l
# 8 (baseline — unrelated to homonyms; same before and after this doc)
```

## Why no rename today

1. **Zero current breakage** — both homonym sets compile cleanly because no
   barrel re-exports both versions of the same symbol.
2. **Rename touches barrels** — renaming `financialKPIs` in `fi-budgets.ts`
   forces updates to `fi-kassa.ts`, `fi-payroll-calc.ts`, `fi-ap-ar.ts`,
   `drizzle-reports.repo.ts`, `europrint-compat.ts`, and test mocks. Risk > value.
3. **Real fix is structural** — delete the stub variant (2.2) or merge the
   inert orphan (1.2). Both are bigger tasks deserving their own sprint.
4. **This document is the audit trail** — future contributors won't accidentally
   "fix the duplicate" by merging incompatible columns.
