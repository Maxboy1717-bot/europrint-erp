# Report 23 — Dead Code and Stubs

**Date:** 2026-05-27  
**Analyst:** Forensic audit (read-only)  
**Scope:** `apps/api/src/` · `artifacts/erp-dashboard/src/`

---

## 1. Module Overview

This report documents intentional and unintentional dead code across the monorepo: `TODO`/`FIXME` markers, `notImplemented()` stubs, placeholder UI components, stub cron jobs, orphan event emitters, and the `compatibility` module which is the largest technical debt hotspot.

---

## 2. TODO / FIXME Inventory

### 2.1 Backend (TypeScript)

**Total count:** 92 occurrences across `apps/api/src/`

Top files by occurrence:

| Count | File | Category |
|---|---|---|
| ~30 | `modules/compatibility/acl/*.ts` (29 files) | Each ACL file has one `TODO PA2-14: drop once typed repo ships` |
| 4 | `modules/hr/recruitment/recruitment-funnel.service.ts` | H.9-FOLLOW-UP: funnel domain not persisted |
| 4 | `modules/iot/infrastructure/repositories/drizzle-iot-tablet.repo.ts` | P3-31: tablet auth/schema |
| 3 | `modules/iot/application/iot-tablet.service.ts` + `iot-tablet.schemas.ts` | P3-31: tablet token auth |
| 2 | `apps/api/src/common/database/queries-technology.ts` | PA-SCHEMA: duplicate table conflict |
| 2 | `apps/api/src/common/database/queries-mm-goods.ts` | PA-SCHEMA: mm_goods duplicates |

Selected high-value TODOs:

```
modules/agents/production-agent.service.ts:34
WHY calculateOEE RETURNS HARDCODED 0.92/0.85/0.97 (TODO)
→ OEE metric is always fake

modules/notifications/domain/services/sms.service.ts:6
TODO: delete this file. No consumers import from this path.

modules/notifications/domain/services/telegram.service.ts:8
No consumers import from this path. TODO: delete this file.

modules/kanban/domain/enums/task-status.enum.ts:8
TODO = 'todo', // #339 kanban status enum qiymati
→ A TODO value *inside* the TODO enum — confusing naming

modules/lms/infrastructure/event-handlers/cert-expiry.handler.ts:33
TODO PA2-18: no command currently publishes CertificateExpiredEvent on the EventBus yet
→ Handler registered but event never emitted

modules/director/infrastructure/event-handlers/advance-bypass-approved.listener.ts:13
TODO PA0: Replace Logger-only audit with a persisted entry
→ Audit trail not written to DB
```

### 2.2 Frontend (TSX)

**Total count:** Not counted precisely (grep with Cyrillic regex had collation error; placeholder/coming-soon search returned input placeholder attributes, not stub components).

Notable `placeholder` in TSX context: 30+ occurrences found, mostly HTML `<input placeholder=...>` attributes which are not stubs. No `<div>Coming soon</div>` patterns were found in the TSX scan.

---

## 3. notImplemented() Stubs in Backend

**Total:** 284 references (includes the function definition, imports, and calls)  

Files with the most `notImplemented()` calls:

| Calls | File | Domain |
|---|---|---|
| 57 | `modules/marketing/presentation/marketing-analytics-stubs.controller.ts` | Marketing analytics |
| 26 | `modules/hr/presentation/hr-dashboard-stubs.controller.ts` | HR dashboard |
| 16 | `modules/mm/presentation/mm-dashboard.controller.ts` | Materials management |
| 14 | `modules/iot/presentation/iot-tablet.controller.ts` | IoT tablet endpoints |
| 10 | `modules/integration/integration-employee.controller.ts` | Employee integration |
| 9 | `modules/hr/presentation/hr-dashboard-stubs-write.controller.ts` | HR write stubs |
| 9 | `modules/finance/presentation/finance-extended-payroll.controller.ts` | Finance payroll |
| 8 | `modules/wms/presentation/wms-barcode.controller.ts` | WMS barcode |
| 6 | `modules/wms/presentation/wms-integration.controller.ts` | WMS integration |
| 6 | `modules/hr/presentation/hr-compat-a.controller.ts` | HR compat |
| 5 | `modules/security/presentation/security.controller.ts` | Security |
| 5 | `modules/design/presentation/design.controller.ts` | Design |
| 5 | `modules/compatibility/saas.controller.ts` | SaaS/tenant |
| 4 | `modules/pp/technology/technology.controller.ts` | Production planning |
| 4 | `modules/pos/presentation/pos-stub.controller.ts` | POS stubs |
| 4 | `modules/ai/presentation/ai.controller.ts` | AI module |

The `notImplemented()` function throws a `NotImplementedException` (HTTP 501). These are **live routes** registered in NestJS — they appear in Swagger but return 501 when called.

---

## 4. Stub / Empty Returns in Backend Services

Beyond `notImplemented()`, the codebase uses silent empty returns in services where real data is expected:

| Location | Return | Context |
|---|---|---|
| `cron/kpi-calculate.cron.ts:25` | `result.processed = 0` | KPI cron body is empty — no DB writes |
| `modules/general/controllers/general-legacy-b.controller.ts:116-119` | `{ category: 'A', score: 85 }` | Employee ABC analysis always returns max score |
| `modules/hr/presentation/hr-dashboard-stubs.controller.ts:245-247` | `{ result: null }` | Per-employee ABC calculate |
| `modules/agents/production-agent.service.ts:34` | Hardcoded 0.92/0.85/0.97 | OEE metrics |
| `apps/api/src/modules/notifications/domain/services/sms.service.ts` | Likely dead | File has TODO: delete |
| `apps/api/src/modules/notifications/domain/services/telegram.service.ts` (notifications module) | Likely dead | File has TODO: delete |

---

## 5. Dead Notification Services

Two files explicitly document themselves as dead:

```
modules/notifications/domain/services/sms.service.ts:6
"TODO: delete this file. No consumers import from this path."

modules/notifications/domain/services/telegram.service.ts:8
"No consumers import from this path. TODO: delete this file."
```

Note: these are inside `modules/notifications/` — distinct from the root `telegram/telegram.service.ts` which IS actively used. The notifications module has its own now-dead telegram/sms wrappers.

---

## 6. The `compatibility` Module — Tech Debt Analysis

### 6.1 What It Contains

`apps/api/src/modules/compatibility/` has **77 files** including:

| Category | Count | Examples |
|---|---|---|
| ACL adapters (`acl/`) | 29 | `approval-request-acl.ts`, `asset-acl.ts`, `bank-account-acl.ts` ... |
| Compat controllers | ~20 | `employees-compat.controller.ts`, `barcode-warehouse.controller.ts` ... |
| Compat services | ~20 | `employees-compat.service.ts`, `cfo.service.ts` ... |
| Specialty sub-services | ~8 | `employees-compat-profile-raw.service.ts`, `employees-compat-financials.service.ts` ... |

### 6.2 Why It's a Tech Debt Hotspot

Every ACL file in `compatibility/acl/` has this header pattern:
```typescript
// TODO PA2-14: drop once a typed `XxxRepository` ships.
```

The `compatibility` module is an **anti-corruption layer (ACL)** that bridges old raw-SQL data access patterns to the new domain-driven repositories. It exists because multiple domains (employees, warehouse, CRM, finance) have not yet been migrated to typed Drizzle ORM repositories. Until those migrations complete, this module:

1. **Performs raw SQL queries** (bypassing Drizzle type safety)
2. **Manually maps `unknown`-typed rows** to application DTOs
3. **Duplicates logic** that will eventually live in proper domain repos
4. **Couples unrelated domains** in a single module (employees + barcode + finance + CRM + SaaS + approval workflow all in one module)

### 6.3 Scope of Pending Migration (PA2-14)

29 ACL files each have a "drop once typed repo ships" TODO. Named typed repos that need to be created:

`ApprovalRequestRepository`, `AssetRepository`, `AuditLogRepository`, `BankAccountRepository`, `BarcodeRepository`, `CalendarEventRepository`, `CandidateRepository`, `CashPositionRepository`, `CrmInvoiceRepository`, `KpiRepository`, `DisciplineRecordsRepository`, `EmployeeFileRepository`, `EmployeeKpiRepository`, `EmployeeListRepository`, `GoalRepository`, `GuidelineRepository`, `HrMapRepository`, `LabelBatchRepository`, `MaterialRepository`, `MentorRepository`, `PosStockRepository`, `TenantRepository`, `SuccessionRepository`, `TelegramUserRepository`, `WorkflowRouteRepository`, `CompanyStateRepository`, `CostCenterRepository`, `CronJobRepository`, `ExceptionLogRepository`

At the current pace of migration (observed from Wave 4-6 comments in event-bridge), this backlog represents **several months of migration work**.

### 6.4 Specific compat sub-services

The `employees-compat-profile*.service.ts` has been split into three files:
- `employees-compat-profile.service.ts`
- `employees-compat-profile-raw.service.ts` — raw SQL variant
- `employees-compat-profile-orm.service.ts` — Drizzle ORM variant

Having three profile service variants simultaneously suggests the migration is **in-progress and the raw version has not yet been retired**.

---

## 7. Orphan Event Emitters (Dead Code)

See Report 18 for full analysis. Summary of orphan emitters that constitute dead code:

| Emitter | Event | Effect of orphan status |
|---|---|---|
| `absence-block.cron.ts:171` | `'access.chip.revoke'` | Badge revocation never happens |
| `absence-block.cron.ts:172` | `'iot.attendance.block'` | IoT block never happens |
| `absence-block.cron.ts:173` | `'email.account.disable'` | Email disable never happens |
| `kanban.service.ts:111` | `'notifications.create'` | Task notifications never sent |
| `agents/*.service.ts` | 6 agent result events | All AI agent outputs silently dropped |

---

## 8. Commented-Out Code

No systematic grep for `//` lines was performed (too broad — every comment qualifies). However, notable in-line commented-out code found during reading:

- `modules/hr/presentation/hr-dashboard.controller.ts` — several `// @Get(...)` routes marked as "moved to WmsWarehouseGatewayController" indicating route migration in progress
- `modules/pos/application/services/pos-wms-sync.service.ts:42,164` — Wave 4 comments marking that legacy `@OnEvent(...)` patterns were replaced but comments reference the old pattern for traceability
- `modules/pos/presentation/pos-stub.controller.ts:128` — `// TODO P3-26: migrate clients to /pos-v2/inventory and delete.`

---

## Summary

The codebase has three tiers of dead/stub code:

**Tier 1 — Silent lies (P0):** Code that appears functional but returns fake data. The employee ABC analysis (`{ category: 'A', score: 85 }`) and the KPI cron (`result.processed = 0`) fall here. These produce incorrect data in production without any error signal.

**Tier 2 — Loud stubs (P1):** 284 `notImplemented()` calls that throw HTTP 501. These are honest — they advertise incompleteness. The marketing analytics stub controller (57 endpoints) is the largest cluster.

**Tier 3 — Migration debt (P2):** The `compatibility` module with 29 ACL adapters and 29 "TODO PA2-14: drop once typed repo ships" markers. This is bounded technical debt with a clear exit path but no timeline.

---

## Gaps Table

| Issue | Severity | Evidence | Impact | Suggested Fix |
|---|---|---|---|---|
| Employee ABC hardcoded `{ category: 'A', score: 85 }` | P0 | `general-legacy-b.controller.ts:116` | All employees show fake maximum KPI | Wire to `getAbcAnalysisForUserRaw()` |
| KPI cron body empty (`processed = 0`) | P0 | `kpi-calculate.cron.ts:25` | KPI history table never written | Implement domain KPI SQL |
| OEE hardcoded 0.92/0.85/0.97 | P0 | `production-agent.service.ts:34` | Production efficiency always shows same fake values | Query MES session data |
| 57 marketing analytics stubs | P1 | `marketing-analytics-stubs.controller.ts` | Marketing reporting completely non-functional | Implement or hide from UI |
| 26 HR dashboard stubs | P1 | `hr-dashboard-stubs.controller.ts` | Multiple HR screens throw 501 | Implement per priority |
| Dead SMS/Telegram notification services | P1 | `notifications/domain/services/` | Dead code risk and confusion | Delete both files |
| 29 compatibility ACL adapters pending typed repos | P2 | `compatibility/acl/*.ts` | Raw SQL without type safety, migration incomplete | Complete PA2-14 repo migrations |
| 3 employees-compat-profile service variants | P2 | `compatibility/employees-compat-profile*.ts` | Unclear which variant is canonical | Retire raw variant, consolidate |
| `.bak.t2c` locale backup files | P3 | `locales/{uz,ru}/common.json.bak.t2c` | Repo bloat | Delete and gitignore |
| `notifications.create` orphan emit | P1 | `kanban.service.ts:111` | Task assignment push never sent | Add listener |

---

## Open Questions / UNVERIFIED

- Is `marketing-analytics-stubs.controller.ts` intended as temporary scaffolding, or is marketing analytics planned for a future sprint? No issue/ticket reference was found in the file.
- Are the `compatibility/acl/` files tracked by any migration ticket (PA2-14 is referenced but no ticket system was checked)?
- Is the `pos/presentation/pos-stub.controller.ts` coexisting with a `pos-v2` controller? The TODO says migrate to `/pos-v2/inventory` but whether pos-v2 is fully functional was not verified.
- How many of the 57 marketing stub endpoints are actually called by the frontend? If zero, the whole stub controller is dead at both ends.
- Is the notifications module (`modules/notifications/`) separate from the Kanban notification system (`kanban_notifications` table)? They appear to be distinct systems that were never integrated.
