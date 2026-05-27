# Report 17 — Reports and Analytics

**Date:** 2026-05-27  
**Analyst:** Forensic audit (read-only)  
**Scope:** All report/analytics endpoints across `apps/api/src/`

---

## 1. Module Overview

Analytics and reporting are spread across multiple modules rather than centralized. Key areas:

- **Employee KPI / ABC analysis** — `modules/general/services/legacy-kpi.helpers.ts` + `modules/general/controllers/general-legacy-b.controller.ts`
- **HR Dashboard** — `modules/hr/presentation/hr-dashboard.controller.ts` + `hr-dashboard-stubs.controller.ts`
- **WMS Catalog** — `modules/wms/application/wms-catalog/abc-aging-expiry.service.ts`
- **POS Reports** — `modules/pos/presentation/reports.controller.ts`
- **Kanban Reports** — `modules/kanban/presentation/kanban-reports.controller.ts`
- **KPI Cron** — `cron/kpi-calculate.cron.ts`
- **Director Dashboard** — `modules/director/dashboard.gateway.ts`

---

## 2. Inventory / Coverage

### 2.1 `/abc-analysis/user/:id` — Employee ABC Analysis

**Route declared at:** `modules/general/controllers/general-legacy-b.controller.ts:116`  
```
@Get('abc-analysis/user')
async getAbcAnalysisUser(@Query('employee_id') _empId?: string) {
  return { category: 'A', score: 85 };
}
```

**VERDICT: SYNTHETIC (hardcoded stub)**

This controller returns `{ category: 'A', score: 85 }` for every user regardless of input. The `_empId` parameter is prefixed with `_` indicating it is deliberately ignored.

**However**, a real implementation exists in `modules/general/services/legacy-kpi.helpers.ts:getAbcAnalysisForUserRaw()`. It executes a genuine DB query:

```sql
WITH rating AS (
  SELECT COALESCE(AVG(composite_score), 0)::numeric AS avg_score
  FROM employee_ratings WHERE employee_id = ${empId}
),
att AS (
  SELECT COUNT(*) FILTER (WHERE status = 'present') AS present_cnt, ...
  FROM attendance_logs WHERE employee_id = ${empId}
),
lms AS (
  SELECT COUNT(*) FILTER (WHERE passed = true) AS passed_cnt, ...
  FROM lms_exam_attempts WHERE user_id = ${empId}
)
SELECT ...
```

This real implementation is **not wired** to the route handler. The controller at line 116 never calls `getAbcAnalysisForUserRaw`. The real function exists but is unreachable via any HTTP route.

**Impact**: Every employee receives `{ category: 'A', score: 85 }` — identical fake data regardless of their actual performance.

---

### 2.2 `/progress/user` — Course Progress

**Route declared at:** `modules/general/controllers/general-legacy-b.controller.ts:92`

```typescript
@Get('progress/user')
async getProgressUser(@Query('employee_id') empId?: string) {
  const userId = empId ?? '0';
  const [coursesResult, enrollmentsResult] = await Promise.all([
    this.lmsRepo.findAllCourses({ limit: DEFAULT_PAGE_SIZE }),
    this.lmsRepo.findEnrollmentsByUser(userId, { limit: DEFAULT_PAGE_SIZE }),
  ]);
  ...
  return { courses, enrollments, progress, skills: [] };
}
```

**VERDICT: PARTIALLY REAL**

- `courses` and `enrollments` are fetched from real LMS tables via `LmsRepository`.
- `progress` is computed in-memory as `Math.round((completedCount / enrollments.length) * 100)`.
- `skills: []` is always an empty array — no skills data is fetched.

The `legacy-kpi.helpers.ts:getCourseProgressForUserRaw()` function provides a richer implementation querying `enrollments JOIN courses` directly, but this is also not wired to any HTTP route.

---

### 2.3 `/hr/abc-analysis` — HR Dashboard ABC Analysis

**Route declared at:** `modules/hr/presentation/hr-dashboard.controller.ts:51`

```typescript
@Get('abc-analysis')
async getAbcAnalysis() {
  return unwrapOrInternal(await this.svc.getAbcAnalysis());
}
```

**VERDICT: REAL (delegates to service)**  
Delegates to `HrDashboardService.getAbcAnalysis()`. The actual SQL was not read, but this follows the real service pattern. Requires further verification.

**Route also declared at:** `modules/hr/presentation/hr-dashboard-stubs.controller.ts:206`

```typescript
@Get('abc-analysis/:id/calculate')
calculateAbcAnalysis(@Param('id') _id: string) {
  return notImplemented('GET /hr/abc-analysis/:id/calculate');
}
```

**VERDICT: STUB** — Throws 501 Not Implemented.

And at: `modules/hr/presentation/hr-dashboard-stubs-write.controller.ts:39`
```typescript
@Post('abc-analysis/:id/calculate')
return notImplemented('POST /hr/abc-analysis/:id/calculate');
```
**VERDICT: STUB**

---

### 2.4 WMS ABC Analysis — `/wms/reports/abc-analysis`

**Route declared at:** `modules/wms/presentation/wms-catalog.controller.ts:35`  
**Service:** `modules/wms/application/wms-catalog/abc-aging-expiry.service.ts`

**VERDICT: REAL**

The service executes genuine SQL:
```sql
SELECT mc.id, mc.xom_ashyo, mc.abc_segment,
       SUM(ws.quantity * mc.unit_price) AS total_value
FROM material_cards mc
LEFT JOIN warehouse_stock ws ON ws.material_card_id = mc.id
WHERE mc.is_active IS NOT FALSE
GROUP BY mc.id, mc.xom_ashyo, mc.kod, mc.abc_segment
ORDER BY total_value DESC LIMIT 100
```

Pareto classification is computed in-memory: cumulative ≤ 80% → A, ≤ 95% → B, else C.

This is a **materials-level** ABC (inventory valuation), distinct from the employee-level ABC analysis above.

The same service also provides:
- `getAging(daysThreshold)` — returns batch lots aged beyond threshold, classifying as active/slow/obsolete. **REAL.**
- `getExpiry(daysAhead)` — returns batch lots expiring within N days. **REAL.**

---

### 2.5 POS ABC Analysis — `/pos/reports/abc-analysis`

**Route declared at:** `modules/pos/presentation/reports.controller.ts:103`  
**VERDICT: Unknown** — The service implementation was not read. Marked UNVERIFIED.

---

### 2.6 KPI Dashboard / Director Dashboard

**Source:** `modules/director/dashboard.gateway.ts` (WebSocket gateway)

The director dashboard pushes real-time KPI updates via WebSocket:
```typescript
this.server.to('kpi:global').emit('kpi:update', snapshot);
this.server.to('kpi:global').emit('alerts:update', { alertCount, criticalCount });
```

**KPI Calculation Cron:** `cron/kpi-calculate.cron.ts`

```typescript
@Cron('30 23 * * *')
async run(): Promise<void> {
  // ...
  result.processed = 0 // Hisoblangan xodimlar soni
  this.logger.log(`✅ KpiCalculate: processed=${result.processed}`)
}
```

**VERDICT: STUB** — The cron body contains only comments describing what *should* be calculated (sales KPIs, support KPIs, production KPIs, HR KPIs). `result.processed` is hardcoded to `0`. No actual DB queries are executed. The cron runs nightly at 23:30 UTC and does nothing.

---

### 2.7 Kanban Reports

Source: `modules/kanban/presentation/kanban-reports.controller.ts`

| Endpoint | Service Call | Verdict |
|---|---|---|
| `GET /kanban/reports/employee-performance` | `svc.getEmployeePerformance()` | Needs verification |
| `GET /kanban/reports/productivity` | `svc.getProductivityReport()` | Needs verification |
| `GET /kanban/reports/overdue` | `svc.getOverdueReport()` | Needs verification |
| `GET /kanban/analytics/summary` | `svc.getAnalyticsSummary()` | Needs verification |
| `GET /kanban/reports/export?format=excel\|pdf` | ExcelJS / pdfmake | REAL — export infrastructure exists |

---

### 2.8 Other Analytics Files Found

| File | Purpose |
|---|---|
| `modules/agents/production-agent.service.ts:34` | `calculateOEE()` — commented as returning hardcoded 0.92/0.85/0.97 (TODO) |
| `modules/sd/infrastructure/repositories/drizzle-sd-customers/customer-360.helpers.ts` | Customer 360 analytics — real DB queries |
| `modules/ai/forecast/forecast-persistence.service.ts` | AI demand forecast persistence |
| `modules/wms/domain/services/safety-stock.service.ts` | Safety stock calculation service |

---

## 3. Data Flow

```
Client → GET /abc-analysis/user?employee_id=X
  → GeneralLegacyBController.getAbcAnalysisUser()
    → Returns { category: 'A', score: 85 }  [STUB — never reads DB]

Real data exists but unreachable:
  legacy-kpi.helpers.ts → getAbcAnalysisForUserRaw(empId)
    → employee_ratings JOIN attendance_logs JOIN lms_exam_attempts
    → Returns real score/grade/rates
```

---

## 4. Gaps Identified

1. **Employee ABC route returns hardcoded `{ category: 'A', score: 85 }`** — every employee shows maximum rating.
2. **`getAbcAnalysisForUserRaw()` function exists but is not wired to any route** — real DB logic is dead code.
3. **KPI Calculate cron is an empty stub** — `result.processed = 0` hardcoded; no data written to any KPI table.
4. **`getCourseProgressForUserRaw()` not wired** — better implementation exists but unused.
5. **`skills: []` always empty** — no skills endpoint or data source connected.
6. **`/hr/abc-analysis/:id/calculate`** — throws 501 Not Implemented (both GET and POST).
7. **`calculateOEE()` in production agent returns hardcoded values** — cited in a `TODO` comment at `production-agent.service.ts:34`.

---

## Summary

The codebase has a fundamental split: real, well-implemented analytics logic exists in helper files (`legacy-kpi.helpers.ts`, `abc-aging-expiry.service.ts`) but the HTTP routes serving those endpoints return either hardcoded stubs or delegate to unimplemented services. The most critical issue is the employee ABC analysis route (`GET /abc-analysis/user`) returning a fixed `{ category: 'A', score: 85 }` for every employee while a full SQL implementation sits unused 200 lines away in the same directory. The nightly KPI cron also performs no computation.

---

## Gaps Table

| Issue | Severity | Evidence | Impact | Suggested Fix |
|---|---|---|---|---|
| Employee ABC route is hardcoded stub | P0 | `general-legacy-b.controller.ts:116-119` | All employees show A/85, destroying HR decision-making | Wire route to `getAbcAnalysisForUserRaw()` |
| `getAbcAnalysisForUserRaw()` is dead code | P0 | `legacy-kpi.helpers.ts:59-115` | Real KPI calculation never executes | Import and call from controller |
| KPI cron body is empty | P0 | `kpi-calculate.cron.ts:14-29` | Daily KPI snapshots never written | Implement DB queries per domain |
| `skills: []` always empty | P1 | `general-legacy-b.controller.ts:107` | Employee skills tab always empty | Wire to skills/competency table |
| `/hr/abc-analysis/:id/calculate` stub | P1 | `hr-dashboard-stubs.controller.ts:206-208` | Per-employee recalculation not available | Implement or remove route |
| `calculateOEE()` hardcoded | P1 | `production-agent.service.ts:34` | OEE always shows 92%/85%/97% | Query real MES production data |
| WMS ABC vs Employee ABC naming conflict | P2 | Two different `/abc-analysis` routes in different modules | Confusion about what "ABC analysis" means | Rename or namespace routes clearly |

---

## Open Questions / UNVERIFIED

- Does `HrDashboardService.getAbcAnalysis()` query real data (it follows real service pattern) or is it also a stub?
- What KPIs does `modules/director/` push via WebSocket — are they pulled from a pre-computed table or computed on demand?
- Is `modules/pos/presentation/reports.controller.ts:103` (POS ABC analysis) real or stub?
- Does any frontend component actually display the `score: 85` from the employee ABC stub, showing incorrect data in production?
