# Report 17 — Reports & Analytics

**Date:** 2026-05-27 (round 2)
**Analyst:** Forensic re-audit (read-only)
**Scope:** Round-1 P0 verification + dashboard endpoints, scheduled reports, Excel/PDF export
**Note:** Round 1 cited `apps/api/src/modules/reports/`. That directory does **not** exist. Analytics/reporting code lives under `modules/general/`, `modules/director/`, `modules/hr/`, `modules/kanban/`, `modules/pos/`, `modules/pos-v2/`, `modules/finance/`, `modules/remaining/`, `modules/export/`, `modules/org-structure/`, `modules/agents/`, `modules/iot/oee/`, `modules/wms/application/wms-catalog/`, plus `apps/api/src/cron/`. A frontend exists at `artifacts/erp-dashboard/` (Vite + React).

---

## Diff vs round 1

| Round-1 P0 claim | Round-2 reality | Status |
|---|---|---|
| `GET /abc-analysis/user` returns hardcoded `{ category: 'A', score: 85 }` | Now calls `getAbcAnalysisForUserRaw(empId)` — real SQL | **FIXED** |
| `getAbcAnalysisForUserRaw()` is dead code | Imported and called from controller at `general-legacy-b.controller.ts:24-26, 129` | **FIXED** |
| KPI cron body has `result.processed = 0` (no DB work) | Now runs 3 real `COUNT(*)` queries against `production_orders`, `attendance_logs`, `kpi_values` and sums them into `result.processed` | **PARTIAL FIX** — still no KPI snapshot persistence; just counts rows |
| `calculateOEE()` returns hardcoded `0.92 / 0.85 / 0.97` | `availability` is now real (from `downtime_events`); `performance = 0.85` and `quality = 0.97` are still hardcoded with a TODO | **PARTIAL FIX** |

New issues found that round 1 missed:
- `report-generate.cron.ts` body is empty — `processed = 3` hardcoded (no DB, no file, no email)
- `DashboardGateway.pushKpiUpdate()` / `pushAlertUpdate()` are declared but **never called anywhere** — the WebSocket KPI broadcast is dead code
- `POST /reports/profitability/export` returns a fabricated `jobId` but never enqueues anything
- `POST /reports-hub/generate/:definitionId` inserts a row with `status='completed'` immediately — no actual report generation
- `GET /production/orders/report/excel` openly returns `{ ready: false, url: null }` placeholder
- `getHrStatsExcel()` returns a CSV with UTF-8 BOM, not a real `.xlsx`
- `HrDashboardService.getAbcAnalysis()` (the round-1 unverified item) is real SQL but the "score" is derived from `CASE COALESCE(e.vysotskiy_category, 'B') WHEN 'A' THEN 90 …`, i.e. it just lookups a stored letter and assigns a fixed score per letter — not a computed KPI
- `hr-dashboard.controller.ts` still hosts ~20 raw stubs that return `{ items: [], total: 0 }` directly (not via `notImplemented`)
- `hr-dashboard-stubs.controller.ts:206` and `hr-dashboard-stubs-write.controller.ts:39` still throw 501 for `/hr/abc-analysis/:id/calculate`

---

## 1. ABC analysis endpoint

### 1.1 Round-1 claim

Round-1 quote (`docs/full-analysis-2026-05-27/17-reports-and-analytics.md:30-32`):

```typescript
@Get('abc-analysis/user')
async getAbcAnalysisUser(@Query('employee_id') _empId?: string) {
  return { category: 'A', score: 85 };
}
```

### 1.2 Round-2 verification

**File:** `apps/api/src/modules/general/controllers/general-legacy-b.controller.ts:123-134`

```typescript
@Get('abc-analysis/user')
async getAbcAnalysisUser(@Query('employee_id') empId?: string) {
  if (!empId) {
    return { grade: 'N/A', score: 0, performanceRate: 0, punctualityRate: 0, attendanceRate: 0, courseCompletionRate: 0, error: 'employee_id required' };
  }
  try {
    return await getAbcAnalysisForUserRaw(empId);
  } catch (e) {
    this.logger.error('ABC analysis error', e);
    return { grade: 'C', score: 0, performanceRate: 0, punctualityRate: 0, attendanceRate: 0, courseCompletionRate: 0, error: String(e) };
  }
}
```

Import at `apps/api/src/modules/general/controllers/general-legacy-b.controller.ts:24-26`:

```typescript
import {
  getAbcAnalysisForUserRaw,
  getCourseProgressForUserRaw,
} from '../services/legacy-kpi.helpers';
```

**VERDICT: ROUND-1 P0 RESOLVED**. The hardcoded `{ category: 'A', score: 85 }` is gone. The controller now delegates to `getAbcAnalysisForUserRaw(empId)`. Shape changed too: round 1's `{ category, score }` → round 2's `{ grade, score, performanceRate, punctualityRate, attendanceRate, courseCompletionRate }`, matching the helper.

The empty-empId fall-through still returns `{ grade: 'N/A', score: 0, … error: 'employee_id required' }` — that's a validation guard, not a stub. The catch returns `{ grade: 'C', score: 0, … error: <reason> }`, which means **runtime errors silently degrade to a "C" rating with score 0**. Better than the old hardcode, but a UI that treats a missing `error` field as success would show every failing employee as grade C. Minor (P2) finding.

---

## 2. KPI cron

### 2.1 Round-1 claim

Round-1 (`docs/full-analysis-2026-05-27/17-reports-and-analytics.md:170-180`) quoted:

```typescript
@Cron('30 23 * * *')
async run(): Promise<void> {
  // ...
  result.processed = 0 // Hisoblangan xodimlar soni
  this.logger.log(`✅ KpiCalculate: processed=${result.processed}`)
}
```

### 2.2 Round-2 verification

**File:** `apps/api/src/cron/kpi-calculate.cron.ts:1-57`

```typescript
@Injectable()
export class KpiCalculateCron {
  private readonly logger = new Logger(KpiCalculateCron.name)

  @Cron('30 23 * * *')
  async run(): Promise<void> {
    const result = { success: false, processed: 0, errors: [] as string[] }
    this.logger.log('KpiCalculate: boshlandi')
    try {
      // ── Bugungi ishlab chiqarilgan buyurtmalar soni ─────────────────────
      const prodRows = await db.execute(
        sql`SELECT COUNT(*)::int AS cnt FROM production_orders WHERE DATE(created_at) = CURRENT_DATE`
      ).catch(() => null)
      const prodCount = Number((prodRows as { rows?: { cnt?: unknown }[] } | null)?.rows?.[0]?.cnt ?? 0)
      result.processed += prodCount

      // ── Bugungi davomat yozuvlari soni ──────────────────────────────────
      const attRows = await db.execute(
        sql`SELECT COUNT(*)::int AS cnt FROM attendance_logs WHERE DATE(check_in_at) = CURRENT_DATE`
      ).catch(() => null)
      const attCount = Number((attRows as { rows?: { cnt?: unknown }[] } | null)?.rows?.[0]?.cnt ?? 0)
      result.processed += attCount

      // ── KPI yozuvlari — bugun kiritilgan ────────────────────────────────
      const kpiRows = await db.execute(
        sql`SELECT COUNT(*)::int AS cnt FROM kpi_values WHERE DATE(recorded_at) = CURRENT_DATE`
      ).catch(() => null)
      const kpiCount = Number((kpiRows as { rows?: { cnt?: unknown }[] } | null)?.rows?.[0]?.cnt ?? 0)
      result.processed += kpiCount

      result.success = true
      this.logger.log(
        `✅ KpiCalculate: processed=${result.processed} ` +
        `(prod=${prodCount}, att=${attCount}, kpi=${kpiCount})`
      )
    } catch (err) {
      result.errors.push(String(err))
      this.logger.error(`❌ KpiCalculate error: ${String(err)}`)
    }
  }
}
```

**VERDICT: ROUND-1 P0 PARTIALLY RESOLVED.**

What changed: the cron now executes three `COUNT(*)` queries against real tables (`production_orders`, `attendance_logs`, `kpi_values`) and reports the totals in its log line. It is no longer a no-op.

What did **not** change: the cron still **does not compute or write a single KPI value**. It only counts rows. Despite the name `KpiCalculate` and a 23:30 nightly schedule, no per-employee score, no department aggregate, no `INSERT INTO kpi_values` happens. The cron is more truthfully described as "KPI table size sampler". Any downstream dashboard that expects fresh KPI snapshots from this cron will still see stale data.

Severity: downgraded from P0 to **P1**. The route also runs `.catch(() => null)` per query, so an individual table failure is silently swallowed and the bad count becomes 0.

---

## 3. MES OEE endpoint

### 3.1 Round-1 claim

Round 1 said `calculateOEE()` in `modules/agents/production-agent.service.ts:34` returns hardcoded `{ availability: 0.92, performance: 0.85, quality: 0.97 }`.

### 3.2 Round-2 verification

**File:** `apps/api/src/modules/agents/production-agent.service.ts:88-122`

```typescript
async calculateOEE(
  machineId: string,
  dateISO: string,
): Promise<{ availability: number; performance: number; quality: number; oee: number }> {
  // Availability hisoblash: downtime_events jadvalidan real ma'lumot olish
  // periodStart/end: shu kun 00:00–23:59
  const periodStart = new Date(`${dateISO}T00:00:00Z`);
  const periodEnd   = new Date(`${dateISO}T23:59:59Z`);
  const PERIOD_MINUTES = 24 * 60; // 1440 daqiqa / sutka

  try {
    const rows = await db
      .select({ totalMinutes: sql<string>`COALESCE(SUM(${downtimeEvents.durationMinutes}), 0)` })
      .from(downtimeEvents)
      .where(
        and(
          gte(downtimeEvents.startedAt, periodStart),
          lte(downtimeEvents.startedAt, periodEnd),
        ),
      );
    const downtimeMinutes = Number(rows[0]?.totalMinutes ?? 0);
    const availability = PERIOD_MINUTES > 0
      ? Math.max(0, Math.min(1, (PERIOD_MINUTES - downtimeMinutes) / PERIOD_MINUTES))
      : 0.92;
    // performance + quality: MES telemetry jadvali hali to'liq tayyor emas —
    // default qiymatlar saqlanadi (TODO: mes_machine_logs tayyor bo'lganda kengaytir)
    const p = 0.85, q = 0.97;
    const a = Math.round(availability * 100) / 100;
    return { availability: a, performance: p, quality: q, oee: Math.round(a * p * q * 100) / 100 };
  } catch (e) {
    this.logger.warn(`OEE calculation failed for machine=${machineId} date=${dateISO}, using defaults: ${(e as Error).message}`);
    const a = 0.92, p = 0.85, q = 0.97;
    return { availability: a, performance: p, quality: q, oee: Math.round(a * p * q * 100) / 100 };
  }
}
```

**VERDICT: ROUND-1 P0 PARTIALLY RESOLVED.**

- `availability` is now real: `(1440 − Σ durationMinutes from downtime_events) / 1440`. Note the query **does not filter by `machineId`** — the SUM is over all downtime events for the date, then attributed to whichever machine was queried. So every machine returns the same availability for a given date.
- `performance = 0.85` and `quality = 0.97` are still hardcoded. The header comment (lines 34-42) openly documents this and points at `modules/iot/oee/oee-calculator.service.ts` as the canonical formula.
- The catch path returns the original full triple `0.92 / 0.85 / 0.97` on any error.

The endpoint is wired: `apps/api/src/modules/agents/agents.controller.ts:96`:

```typescript
@Get('production/oee')                          oee(@Query('machineId') m: string, @Query('date') d: string) { return this.production.calculateOEE(m, d); }
```

A real OEE calculator exists at `apps/api/src/modules/iot/oee/oee-calculator.service.ts:99-131` (`OeeCalculatorService.calculate`) with Nakajima formula, Zod-validated `OeeInput`, clamp to [0,1]. That service is invoked from IoT ingest code, **not** from `/agents/production/oee`. So callers of the agents endpoint still get a per-machine identical availability and fixed P/Q.

Severity: downgraded from P0 to **P1** (round 1 had it P1 already).

---

## 4. Dead-wired real implementations

Round 1 said `getAbcAnalysisForUserRaw()` (`modules/general/services/legacy-kpi.helpers.ts:59-115`) was never called. Round-2 check:

**File:** `apps/api/src/modules/general/services/legacy-kpi.helpers.ts:60-116` — function exists, body runs a real `WITH rating / att / lms SELECT` against `employee_ratings`, `attendance_logs`, `lms_exam_attempts`. Quoted in §1.2 of round-1 doc.

Callers:

```
$ grep -r "getAbcAnalysisForUserRaw" apps/api/src
apps/api/src/modules/general/controllers/general-legacy-b.controller.ts:24
apps/api/src/modules/general/controllers/general-legacy-b.controller.ts:129
apps/api/src/modules/general/services/legacy-kpi.helpers.ts:60
```

**VERDICT: Dead-wire claim is no longer true.** The helper is imported (line 24) and invoked (line 129). Same for `getCourseProgressForUserRaw` (`general-legacy-b.controller.ts:102` inside `getProgressUser`).

### 4.1 New dead-wire found: DashboardGateway

```
$ grep -r "pushKpiUpdate\|pushAlertUpdate\|DashboardGateway" apps/api/src
apps/api/src/modules/director/dashboard.gateway.ts   (only file)
```

**File:** `apps/api/src/modules/director/dashboard.gateway.ts:62-70`

```typescript
/** Broadcast KPI snapshot to all director dashboard clients. */
pushKpiUpdate(snapshot: Record<string, unknown>) {
  this.server.to('kpi:global').emit('kpi:update', snapshot);
}

/** Broadcast critical alert count change. */
pushAlertUpdate(alertCount: number, criticalCount: number) {
  this.server.to('kpi:global').emit('alerts:update', { alertCount, criticalCount });
}
```

The class itself is referenced exactly zero times by other source files (the only matches are the gateway file's own declarations). The header comment on line 8 says "Data flow: director-cron.service → emit('kpi:update') → clients" — but there is no `director-cron.service` and nothing imports `DashboardGateway`. Clients can connect, join the `kpi:global` room, and will never receive a single `kpi:update` or `alerts:update` event.

**Severity: P1** — Frontend WebSocket subscribers see permanent silence.

---

## 5. Other dashboard endpoints

### 5.1 Director Dashboard — `/director/dashboard/*`

**Controller:** `apps/api/src/modules/director/presentation/dashboard.controller.ts:48-82` — 5 routes (`getDashboard`, `getKpis`, `getProductionSummary`, `getFinanceSummary`, `getHrSummary`).

**Service:** `apps/api/src/modules/director/application/dashboard-query.service.ts:90-146` — composes 3 parallel real-data queries per summary (production / finance / HR).

**Repository:** `apps/api/src/modules/director/infrastructure/repositories/dashboard-query.repository.ts:23-81` — 8 methods, all `safeCall + sql\`SELECT …\``:

| Method | SQL source | Verdict |
|---|---|---|
| `getActivePoCount` | `SELECT COUNT(*) FROM sales_orders WHERE status NOT IN ('cancelled','completed')` | REAL |
| `getCompletedTodayCount` | `production_orders WHERE status='completed' AND updated_at >= today` | REAL |
| `getAverageOee` | `mes_sessions … FILTER (WHERE quality_passed=true)` | REAL but proxy (quality-pass-rate, not OEE) |
| `getMonthlyRevenue` | `SUM(amount) FROM invoices WHERE status='paid'` | REAL |
| `getTopUnpaidInvoices` | `invoices WHERE status != 'paid' AND due_date < NOW() LIMIT 5` | REAL |
| `getAdvancePending` | `COUNT(*) FROM advances WHERE status='pending'` | REAL |
| `getAttendanceToday` | `COUNT(DISTINCT employee_id) FROM attendance WHERE DATE(check_in_time)=today` | REAL |
| `getOpenPayrollCount` | `COUNT(*) FROM payroll WHERE status='open'` | REAL |

`avgOee` here is mislabelled: it's actually the % of MES sessions that passed quality, not Availability × Performance × Quality. The dashboard widget will show it as "OEE %" — semantic bug (P2).

### 5.2 Director Analytics — `/analytics/*`

**Controller:** `apps/api/src/modules/director/analytics/analytics.controller.ts:25-79` — 11 routes (stats, course-progress, user-activity, test-results, learning-outcomes, funnel, by-department, by-position, leaderboard/{employees, departments, courses}).

**Repository:** `apps/api/src/modules/director/analytics/analytics.repository.ts:30-44` (spot-checked `findStats`):

```typescript
async findStats(): Promise<Result<StatsRow>> {
  return safeCall(async () => {
    const [uRows, cRows, tRows, scRows] = await Promise.all([
      runQuery<Row>(sql`SELECT COUNT(*) AS cnt FROM users`),
      runQuery<Row>(sql`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_active=true) AS active FROM lms_courses`),
      runQuery<Row>(sql`SELECT COUNT(*) AS total FROM lms_tests`),
      runQuery<Row>(sql`SELECT AVG(score)::numeric AS avg_score, COUNT(*) FILTER (WHERE passed=true) AS passed, COUNT(*) AS total FROM lms_test_attempts`),
    ]);
    …
  }, 'DB_ERROR');
}
```

All real queries against `users`, `lms_courses`, `lms_tests`, `lms_test_attempts`. **VERDICT: REAL** (sampled; remaining 10 methods follow same pattern based on file size and import shape).

### 5.3 HR Dashboard — `/hr/*`

**Controller:** `apps/api/src/modules/hr/presentation/hr-dashboard.controller.ts:1-248`. Two layers of routes:

1. Routes that delegate to `HrDashboardService` (real): `birthdays`, `birthdays/today`, `birthdays/upcoming`, `milestones/upcoming`, `monthly-trend`, `abc-analysis`, `alerts`, `discipline-records`, `pip`, `enps/surveys`, `ai-interview/sessions`, `daily-reports/stats`, `adaptation/at-risk`, `shifts/today`, `dashboard-stats`. The repository `apps/api/src/modules/hr/infrastructure/repositories/hr-dashboard.repository.ts:112-154` shows `getMonthlyTrend` and `getAbcAnalysis` are real SQL.

   `getAbcAnalysis` SQL (line 127-153) deserves callout:

   ```sql
   SELECT e.id, …
          COALESCE(e.vysotskiy_category, 'B') AS category,
          CASE COALESCE(e.vysotskiy_category, 'B')
               WHEN 'A' THEN 90 WHEN 'B' THEN 65 ELSE 40 END AS performance_score
   FROM employees e …
   WHERE e.status = 'active'
   ORDER BY category ASC, e.last_name LIMIT 100
   ```

   The "score" is a `CASE` lookup off a stored letter. It is **not** a derived KPI; whoever filled the `vysotskiy_category` column determines the dashboard. The shape looks like ABC but the math doesn't.

2. Routes that return hardcoded empty payloads inline (no service call, no error, no 501):

   | Line | Route | Body |
   |---|---|---|
   | 111-114 | `GET /hr/adaptation/:id` | `{ adaptation: null }` |
   | 116-119 | `GET /hr/alumni` | `{ items: [], total: 0 }` |
   | 121-124 | `GET /hr/alumni/:id` | `{ alumni: null }` |
   | 126-129 | `GET /hr/daily-reports` | `{ items: [], total: 0 }` |
   | 131-134 | `GET /hr/daily-reports/department` | `{ items: [], total: 0 }` |
   | 136-139 | `GET /hr/daily-reports/my` | `{ items: [], total: 0 }` |
   | 141-146 | `POST /hr/daily-reports` | `{ created: true }` (validates DTO then discards) |
   | 153-156 | `GET /hr/offboarding/questions` | `{ items: [], total: 0 }` |
   | 162-165 | `GET /hr/fp-cycle` | `{ items: [], total: 0 }` |
   | 167-170 | `GET /hr/hrc-tests/employee` | `{ items: [], total: 0 }` |
   | 172-175 | `GET /hr/hrc-tests/public` | `{ items: [], total: 0 }` |
   | 177-180 | `GET /hr/hrc-tests/stats` | `{ stats: null }` |
   | 182-185 | `GET /hr/360/reviewable` | `{ items: [], total: 0 }` |
   | 187-190 | `GET /hr/birthdays/settings` | `{ settings: null }` |
   | 192-197 | `POST /hr/birthdays/settings` | `{ saved: true }` (validates DTO then discards) |
   | 199-202 | `GET /hr/birthdays/settings/:id` | `{ settings: null }` |
   | 204-207 | `GET /hr/ai-interview/session` | `{ items: [], total: 0 }` |
   | 209-212 | `GET /hr/ai-interview/session/:id/review` | `{ review: null }` |
   | 214-217 | `GET /hr/documents/employee` | `{ items: [], total: 0 }` |
   | 219-222 | `GET /hr/documents/my` | `{ items: [], total: 0 }` |
   | 224-227 | `GET /hr/documents/pending` | `{ items: [], total: 0 }` |
   | 229-232 | `GET /hr/employee-corp` | `{ items: [], total: 0 }` |
   | 234-237 | `GET /hr/employees/operator-stats` | `{ stats: null }` |
   | 239-242 | `GET /hr/enps/surveys/results` | `{ items: [], total: 0 }` |
   | 244-247 | `GET /hr/abc-analysis/:id/calculate` | `{ result: null }` |

   These are silent stubs (return 200 OK with empty data). A frontend table will render "no data" instead of an error. **Severity P1** for the routes that the UI actively renders (daily-reports, documents, hrc-tests), **P2** for the rest.

3. `apps/api/src/modules/hr/presentation/hr-dashboard-stubs.controller.ts:206-209` and `hr-dashboard-stubs-write.controller.ts:39-43` still throw 501 for `/hr/abc-analysis/:id/calculate` (both GET and POST). These are the honest version — same route as `hr-dashboard.controller.ts:244` so depending on registration order one or the other wins. Round 1 noted this; still present.

### 5.4 POS reports — `/pos/reports/*`

**Controller:** `apps/api/src/modules/pos/presentation/reports.controller.ts:23-122` — 9 endpoints (kpi, stock, movement-stats, top-materials, audit, three-way-match, liabilities, abc-analysis, inactive-materials).

**Repository:** `apps/api/src/modules/pos/infrastructure/repositories/pos-reports.repository.ts` — all methods are real `db.execute(sql\`SELECT …\`)` patterns. `getAbcAnalysis` (line 70+) runs the canonical Pareto SQL:

```sql
WITH ranked AS (
  SELECT mc.id AS material_card_id, mc.xom_ashyo, …
         COALESCE(cs.quantity_on_hand, 0) * COALESCE(mc.last_purchase_price, 0) AS total_value,
         SUM(COALESCE(cs.quantity_on_hand, 0) * COALESCE(mc.last_purchase_price, 0)) …
```

**VERDICT: REAL.** (Round-1 marked unverified — now confirmed real.)

### 5.5 POS-v2 reports — `/pos-v2/reports/*`

**Controller:** `apps/api/src/modules/pos-v2/presentation/reports.controller.ts:43-58+` — CQRS-style via `QueryBus.execute(new GetMovementReportQuery(…))`. Wired to real query handlers. **VERDICT: REAL.**

### 5.6 Finance reports — `/reports/*`

**Controller:** `apps/api/src/modules/finance/presentation/reports.controller.ts:30-110`.

| Route | Verdict |
|---|---|
| `GET /reports/trial-balance` | REAL (delegates to `FinanceReportsService.findTrialBalance`) |
| `GET /reports/profit-loss` | REAL |
| `GET /reports/weekly-summary` + `/current-week` | REAL |
| `GET /reports/monthly-summary` | REAL |
| `GET /reports/kpi-dashboard` | REAL |
| `GET /reports/production-efficiency` | **501 NOT IMPLEMENTED** (honestly stubbed at line 76-78 — `notImplemented('GET /reports/production-efficiency')`) |
| `POST /reports/profitability/export` | **STUB** (line 88-109) — returns `{ jobId: \`prof-export-${Date.now()}\`, status: 'queued', … }` but no queue receives it. Grep for `prof-export-` finds zero consumers. |

### 5.7 Kanban reports — `/kanban/*`

**Controller:** `apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts:52-238`.

| Route | Delegates to | Verdict |
|---|---|---|
| `GET /kanban/reports/employee-performance` | `KanbanExtService.getEmployeePerformance` → `DrizzleKanbanStatsRepository.getEmployeePerformance` | REAL |
| `GET /kanban/reports/productivity` | `DrizzleKanbanStatsRepository.getProductivityReport` (line 182-204, real SQL on `kanban_cards`) | REAL |
| `GET /kanban/reports/overdue` | `DrizzleKanbanStatsRepository.getOverdueReport` (line 206-225, real SQL with JOIN) | REAL |
| `GET /kanban/analytics/summary` | `DrizzleKanbanStatsRepository.getAnalyticsSummary` (line 227-245, real SQL) | REAL |
| `GET /kanban/reports/export?format=excel\|pdf` | ExcelJS + pdfmake in-controller | REAL (see §7.1) |
| `GET /kanban/task-stats`, `dashboard/team-metrics`, `overdue-inbox` | service-backed | REAL |
| `GET /kanban/projects` | `notImplemented('GET /kanban/projects')` | Honest 501 |

### 5.8 WMS reports — `/wms/reports/*`

Unchanged since round 1: `WmsCatalogController` → `AbcAgingExpiryService` runs real SQL on `material_cards × warehouse_stock`. **VERDICT: REAL.**

### 5.9 IoT Camera-Heatmap reports

**File:** `apps/api/src/modules/iot/presentation/camera-heatmap-reports.controller.ts` (not exhaustively read, but wired to `CameraDashboardService`). Not analysed in depth — out of scope of this report; flagged for separate audit.

---

## 6. Scheduled reports

`apps/api/src/cron/` plus a few module-local crons. Behaviour of the report-related ones:

| Cron file | Schedule | Body | Verdict |
|---|---|---|---|
| `cron/kpi-calculate.cron.ts` | `30 23 * * *` | 3 `COUNT(*)` queries, sums into `result.processed` | **Real DB, no KPI write** (§2) |
| `cron/report-generate.cron.ts:13-29` | `0 23 * * *` | Comment-only body, `result.processed = 3` hardcoded | **STUB** — see §6.1 |
| `cron/daily-report.cron.ts:19-66` | `0 20 * * 1-5` | Real Drizzle queries + `INSERT INTO hr_daily_reports` for absent employees | **REAL** |
| `modules/finance/financial-reports/cron/financial-reports-daily.cron.ts:26-83` | `0 18 * * *` Asia/Tashkent | 6 parallel real queries, snapshot persist, HTML format, Telegram send, overstock + overdue alerts | **REAL — fully wired** |
| `modules/finance/financial-reports/cron/financial-reports-weekly.cron.ts`, `-monthly.cron.ts`, `-alerts.cron.ts` | weekly/monthly/alert | similar pattern | REAL (not deep-read; share services) |
| `cron/manager-daily-routine.cron.ts`, `cron/discipline.cron.ts`, `cron/birthday.cron.ts`, `cron/late-arrival-fine.cron.ts`, etc. | various | not in scope of "reports" but wire to real services | n/a |

### 6.1 report-generate.cron.ts — full body

**File:** `apps/api/src/cron/report-generate.cron.ts:1-30`

```typescript
@Injectable()
export class ReportGenerateCron {
  private readonly logger = new Logger(ReportGenerateCron.name)

  @Cron('0 23 * * *')
  async run(): Promise<void> {
    const result = { success: false, processed: 0, errors: [] as string[] }
    try {
      // Kunlik hisobotlar tuzilish va generatsiya
      // Sales Report: bugungi sotuvlar, mijozlar, to'lovlar
      // Production Report: smartfon ishlab chiqarish, QC, shunas
      // Warehouse Report: tuzilgan/chiqarilgan mahsulotlar
      // PDF/Excel format → admin email, storage
      result.success = true
      result.processed = 3 // 3 ta report
      this.logger.log(`✅ ReportGenerate: processed=${result.processed}`)
    } catch (err) {
      result.errors.push(String(err))
      this.logger.error(`❌ ReportGenerate error: ${String(err)}`)
    }
  }
}
```

Comments enumerate the three intended reports (Sales / Production / Warehouse, PDF/Excel + email). No DB query, no file generation, no email. The logger writes `processed=3` every night regardless. **STUB (P1).** This is the exact same anti-pattern round 1 caught in the KPI cron — pure log line in a real cron container.

---

## 7. Excel / PDF export

Module-by-module audit of file-producing endpoints.

### 7.1 Kanban export — REAL

**File:** `apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts:76-204`. Imports `ExcelJS` and `pdfmake` at module top (`require('pdfmake')`, `require('pdfmake/build/vfs_fonts')`). PDF branch builds a real `docDef` with header/table/styles, runs `printer.createPdfKitDocument(docDef)`, collects chunks via `'data'` / `'end'` events, and sets Content-Type `application/pdf` with attachment disposition. Excel branch creates a workbook with three sheets (Statistika, Jamoa, Kechikkanlar), writes a real `wb.xlsx.writeBuffer()`. Fallback (if pdfmake throws): returns bytes `Buffer.from('%PDF-1.4 placeholder')` (line 152) — a 13-byte fake PDF that browsers will reject. Minor (P2).

### 7.2 Org-structure export — REAL

**File:** `apps/api/src/modules/org-structure/org-export.service.ts:24-267`. Uses `ExcelJS.Workbook` and `pdf-lib` (`PDFDocument`, `StandardFonts`, `rgb`). `exportExcel` (line 24-138) and `exportPdf` (line 139-267) both produce real binary output. **VERDICT: REAL.**

### 7.3 General HR / Attendance CSV + PDF — MIXED

**File:** `apps/api/src/modules/export/export.service.ts:1-87`.

- `getEmployeesCsv`, `getAttendanceCsv`, `getDisciplineCsv` (line 19-35) — return real CSV from repo with a static-header fallback on repo error. **REAL.**
- `getHrStatsPdf` (line 37-79) — builds a real `pdf-lib` PDFDocument with embedded fonts and `drawText`. **REAL.**
- `getHrStatsExcel` (line 81-85) — returns `Buffer.from('﻿${csvString}', 'utf-8')`. UTF-8 BOM prefix lets Excel open a CSV with non-ASCII characters, but the Content-Type and download will still be CSV-data-in-an-xlsx-named-file. **Mislabelled as Excel (P2).**

### 7.4 Finance profitability export — STUB

**File:** `apps/api/src/modules/finance/presentation/reports.controller.ts:88-108`

```typescript
@Post('profitability/export')
@HttpCode(HttpStatus.ACCEPTED)
async exportProfitability(@Body() body: unknown) {
  try {
    const payload = (body ?? {}) as { from?: string; to?: string; format?: string };
    const format = payload.format ?? 'xlsx';
    const jobId = `prof-export-${Date.now()}`;
    this.logger.log(`Profitability export queued: jobId=${jobId} format=${format}`);
    return {
      jobId,
      status: 'queued',
      format,
      from: payload.from ?? null,
      to: payload.to ?? null,
      requestedAt: this._time.now().toISOString(),
      message: 'Eksport so\'rovi qabul qilindi. Tayyor bo\'lganda bildirishnoma yuboriladi.',
    };
  } catch (e) {
    this.logger.error(`exportProfitability: ${(e as Error).message}`);
    return { jobId: null, status: 'error', error: (e as Error).message };
  }
}
```

`grep -r "prof-export"` finds **zero** consumers across the API source. The `jobId` is purely cosmetic; no BullMQ job, no `@OnEvent` listener, no cron picks it up. The user will never receive the promised notification. **STUB (P1).**

### 7.5 Reports-Hub `generate` — STUB

**File:** `apps/api/src/modules/remaining/reports-hub.repository.ts:118-126`

```typescript
async insertRun(defId: number, userId: number): Promise<Result<Row | null>> {
  return safeCall(async () => {
    const rows = await runQuery<Row>(sql`
      INSERT INTO ai_report_runs (report_id, status, triggered_by, started_at, created_at)
      VALUES (${defId}, 'completed', ${userId}, NOW(), NOW()) RETURNING *
    `);
    return (rows.rows[0] ?? null) as Row | null;
    }, 'DB_ERROR');
}
```

`POST /reports-hub/generate/:definitionId` inserts a row immediately marked `'completed'` with no `file_url`, no `payload`, no row count, no `finished_at`. The UI will show the report as ready but `GET /reports-hub/runs/:runId` returns an empty completed row. **STUB (P1).**

### 7.6 Production orders Excel — STUB (honest)

**File:** `apps/api/src/modules/general/controllers/general-legacy-b.controller.ts:170-181`

```typescript
// ProductionReport page expects an Excel download endpoint. Until the real
// XLSX generator is in place we serve a JSON descriptor that the page can
// surface as "report not yet ready" without 404'ing.
@Get('production/orders/report/excel')
async getProductionOrdersReportExcel(@Query() _query: Record<string, string | undefined>) {
  return {
    ready:        false,
    url:          null,
    generated_at: null,
    reason:       'Excel eksport hali tayyor emas — JSON hisoboti /production/orders/report orqali mavjud',
  };
}
```

Honest placeholder. Returns 200 OK with `ready: false`. Frontend can render "not ready". **P2.**

---

## 8. Frontend integration

Frontend lives at `artifacts/erp-dashboard/` (Vite + React + Tanstack Query). Confirmed file: `package.json` plus `vite.config.ts` at that path. The originally claimed `apps/web/` does **not** exist.

### 8.1 EmployeeProfile — consumes ABC + course progress

**File:** `artifacts/erp-dashboard/src/pages/EmployeeProfile.tsx:160-161`

```typescript
const { data: abcData, isLoading: loadingAbc } = useQuery<AbcAnalysis>({ queryKey: ['/api/abc-analysis/user', id], enabled: !!id });
const { data: courseProgress, isLoading: loadingProgress } = useQuery<CourseProgressRecord[]>({ queryKey: ['/api/progress/user', id], enabled: !!id });
```

`abcData` flows into `<ProfileHeader … abcData={abcData} …>` (line 321). Because the API now returns the **real** shape `{ grade, score, performanceRate, … }` instead of round 1's `{ category, score }`, the frontend type `AbcAnalysis` must match. The TS interface lives in `artifacts/erp-dashboard/src/types.ts` (not opened). If the interface still expects `category`, the UI silently shows undefined for the grade label — worth a separate spot-check (P2).

### 8.2 HR Dashboard, WMS Reports, Warehouse Reports — references found

15 frontend files contain ABC/dashboard references including `pages/HRDashboard.tsx`, `pages/EmployeeStats.tsx`, `components/wms/reports/AbcAnalysisTab.tsx`, `pages/WarehouseReports.tsx`, `pos-monitor/api/pos-monitor.api.ts`, `pos-monitor/i18n/uz.json`, etc. Each consumes one of the dashboard routes audited in §5.

### 8.3 DashboardGateway socket subscribers — not searched

`pushKpiUpdate` is dead code on the API side (§4.1). Whether the frontend ever opens a `/dashboard` socket and subscribes to `kpi:update` is unverified. If it does, it sees permanent silence.

---

## 9. Findings summary

### P0 (none new — round 1 P0s downgraded)

All four round-1 P0 items are either resolved or downgraded:

- `GET /abc-analysis/user` — **RESOLVED**, now wired to real SQL.
- `getAbcAnalysisForUserRaw` dead wire — **RESOLVED**, called.
- KPI cron body empty — **PARTIAL** → P1.
- OEE hardcoded — **PARTIAL** → P1.

### P1 (verify-soon)

| # | Issue | File / line |
|---|---|---|
| P1-A | `kpi-calculate.cron.ts` counts rows but writes no KPI snapshot | `apps/api/src/cron/kpi-calculate.cron.ts:15-56` |
| P1-B | `calculateOEE` returns identical `availability` for every machine on a given date (no `machineId` filter); P + Q still hardcoded | `apps/api/src/modules/agents/production-agent.service.ts:88-122` |
| P1-C | `DashboardGateway.pushKpiUpdate` / `pushAlertUpdate` are never called — `/dashboard` WebSocket KPI broadcast is dead code | `apps/api/src/modules/director/dashboard.gateway.ts:63-70` |
| P1-D | `report-generate.cron.ts` body is empty; `result.processed = 3` hardcoded — same anti-pattern round 1 caught | `apps/api/src/cron/report-generate.cron.ts:13-29` |
| P1-E | `POST /reports/profitability/export` returns fake `jobId`, no consumer exists | `apps/api/src/modules/finance/presentation/reports.controller.ts:88-108` |
| P1-F | `POST /reports-hub/generate/:definitionId` inserts run row with `status='completed'`, no file content | `apps/api/src/modules/remaining/reports-hub.repository.ts:118-126` |
| P1-G | `hr-dashboard.controller.ts` ~10 routes return `{ items: [], total: 0 }` inline (UI-rendered ones: `daily-reports`, `daily-reports/department`, `daily-reports/my`, `documents/*`, `hrc-tests/*`, `ai-interview/session*`, `360/reviewable`) | `apps/api/src/modules/hr/presentation/hr-dashboard.controller.ts:111-247` |
| P1-H | `POST /hr/daily-reports` and `POST /hr/birthdays/settings` parse the DTO and respond `{ created: true }` / `{ saved: true }` without persisting | `hr-dashboard.controller.ts:141-146, 192-197` |

### P2 (informational / low-impact)

| # | Issue | File / line |
|---|---|---|
| P2-A | HR ABC analysis "score" is a `CASE` lookup on stored letter, not a computed KPI | `apps/api/src/modules/hr/infrastructure/repositories/hr-dashboard.repository.ts:127-153` |
| P2-B | Director dashboard `avgOee` is actually quality-pass-rate from `mes_sessions`, not OEE | `apps/api/src/modules/director/infrastructure/repositories/dashboard-query.repository.ts:37-42` |
| P2-C | `getHrStatsExcel` returns CSV bytes labelled as Excel | `apps/api/src/modules/export/export.service.ts:81-85` |
| P2-D | Kanban PDF export fallback returns 13-byte `%PDF-1.4 placeholder` Buffer on pdfmake error | `apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts:148-153` |
| P2-E | `GET /production/orders/report/excel` returns `{ ready: false }` placeholder | `apps/api/src/modules/general/controllers/general-legacy-b.controller.ts:170-181` |
| P2-F | `getAbcAnalysisUser` catch path returns `{ grade: 'C', score: 0, error: … }` — UI ignoring `error` field shows all failures as grade C | `apps/api/src/modules/general/controllers/general-legacy-b.controller.ts:130-133` |
| P2-G | `hr-dashboard.controller.ts:244` and `hr-dashboard-stubs.controller.ts:206` both declare `GET /hr/abc-analysis/:id/calculate` — route conflict, depending on registration order one wins (returns `{ result: null }`) or the other wins (501 honest stub) | both files |
| P2-H | Frontend type `AbcAnalysis` may still expect round-1 shape `{ category, score }` instead of round-2 `{ grade, score, performanceRate, … }` — verify | `artifacts/erp-dashboard/src/types*.ts` (not opened) |
| P2-I | `GET /reports/production-efficiency` returns 501 (honest) | `apps/api/src/modules/finance/presentation/reports.controller.ts:76-78` |
| P2-J | KPI cron uses `.catch(() => null)` per query, swallowing individual table failures into a silent 0 contribution to `processed` total | `apps/api/src/cron/kpi-calculate.cron.ts:23, 32, 41` |

---

## Files referenced

- `apps/api/src/modules/general/controllers/general-legacy-b.controller.ts`
- `apps/api/src/modules/general/services/legacy-kpi.helpers.ts`
- `apps/api/src/cron/kpi-calculate.cron.ts`
- `apps/api/src/cron/report-generate.cron.ts`
- `apps/api/src/cron/daily-report.cron.ts`
- `apps/api/src/modules/agents/production-agent.service.ts`
- `apps/api/src/modules/agents/agents.controller.ts`
- `apps/api/src/modules/iot/oee/oee-calculator.service.ts`
- `apps/api/src/modules/director/dashboard.gateway.ts`
- `apps/api/src/modules/director/presentation/dashboard.controller.ts`
- `apps/api/src/modules/director/application/dashboard-query.service.ts`
- `apps/api/src/modules/director/infrastructure/repositories/dashboard-query.repository.ts`
- `apps/api/src/modules/director/analytics/analytics.controller.ts`
- `apps/api/src/modules/director/analytics/analytics.repository.ts`
- `apps/api/src/modules/hr/presentation/hr-dashboard.controller.ts`
- `apps/api/src/modules/hr/presentation/hr-dashboard-stubs.controller.ts`
- `apps/api/src/modules/hr/presentation/hr-dashboard-stubs-write.controller.ts`
- `apps/api/src/modules/hr/application/hr-dashboard.service.ts`
- `apps/api/src/modules/hr/infrastructure/repositories/hr-dashboard.repository.ts`
- `apps/api/src/modules/pos/presentation/reports.controller.ts`
- `apps/api/src/modules/pos/application/services/pos-reports.service.ts`
- `apps/api/src/modules/pos/infrastructure/repositories/pos-reports.repository.ts`
- `apps/api/src/modules/pos-v2/presentation/reports.controller.ts`
- `apps/api/src/modules/finance/presentation/reports.controller.ts`
- `apps/api/src/modules/finance/reports/reports.service.ts`
- `apps/api/src/modules/finance/financial-reports/cron/financial-reports-daily.cron.ts`
- `apps/api/src/modules/finance/reports-hub/reports-hub.service.ts`
- `apps/api/src/modules/remaining/reports-hub.controller.ts`
- `apps/api/src/modules/remaining/reports-hub.service.ts`
- `apps/api/src/modules/remaining/reports-hub.repository.ts`
- `apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts`
- `apps/api/src/modules/kanban/application/kanban-ext.service.ts`
- `apps/api/src/modules/kanban/application/kanban-ext-flow.service.ts`
- `apps/api/src/modules/kanban/infrastructure/repositories/drizzle-kanban-stats.repo.ts`
- `apps/api/src/modules/kanban/infrastructure/repositories/drizzle-kanban-analytics.repo.ts`
- `apps/api/src/modules/export/export.service.ts`
- `apps/api/src/modules/org-structure/org-export.service.ts`
- `artifacts/erp-dashboard/src/pages/EmployeeProfile.tsx`
