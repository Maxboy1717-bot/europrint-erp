# DDD Deep Audit — Domain Events + Repository Pattern

Date: 2026-05-17 | Scope: `apps/api/src/modules/**` | Method: file-level inspection (Read/Glob/Grep)

---

## TL;DR

| Dimension | Score | Notes |
|---|---|---|
| Event-driven architecture compliance | **45 %** | Three dispatch mechanisms live simultaneously; string-namespace collisions break ~half the Trigger map. |
| Repository pattern compliance | **62 %** | 65 interfaces / 99 implementations, but 53 application-layer "repositories" bypass the contract entirely. |
| Outbox / persistence reliability | **0 %** | No `domain_events` table, no outbox publisher, all in-process fire-and-forget. |

Claimed sprint result (`docs/ddd-sprint-completion.md`) of 93/100 is **not corroborated** for these two dimensions. Realistic combined score ≈ **55/100**.

---

## PART 1 — Domain Events

### 1.1 Inventory

25 `*.event.ts` files. Modules with events: `auth, finance, hr, lms, sd, wms, crm, aisha, director, order-workflow`. Modules with aggregates but **no domain events**: `core, kanban, marketing, mes, mm, mro, notifications, pos-v2, qc, security, iot, pp, logistics, design, admin` (admin has event imports but no event class file).

Two parallel base classes coexist: `shared/domain/aggregate-root.base.ts` (constructor-less `DomainEvent` push) and `shared/domain/domain-event.ts` (used by `Employee`, `Attendance`, `Invoice`).

### 1.2 Aggregate emission

40 aggregate files exist. Only **18** call `this.addDomainEvent(...)` — 45 % emission rate.

Best: `sales-order.aggregate.ts:149,187,216` (3 events with `aggregateName/timestamp/data`), `deal.aggregate.ts:90,106`, `mes/production-session.aggregate.ts` (6 emissions).

Anemic (no emission, no events folder, no AggregateRoot):
- `hr/domain/aggregates/leave-request.aggregate.ts:24` — plain class, `throw DomainError` on `approve()`/`reject()` (lines 49–71).
- `hr/domain/aggregates/employee.aggregate.ts:48` — has own `events[]` but never pushes.
- `hr/domain/aggregates/attendance.aggregate.ts:24` — exposes `emitAttendanceRecorded()` (line 72) but business methods `recordCheckIn`/`recordCheckOut` (lines 39, 44) never call it.
- `pp/domain/aggregates/production-order.aggregate.ts:25` — extends `AggregateRoot`, but `release()` (line 79) and status mutators emit nothing.
- `mes/production-session.aggregate.ts` and `routing/bom/work-center` aggregates either don't extend `AggregateRoot` or emit on only one method.

### 1.3 Dispatch — TRIPLE mechanism (regression)

The codebase mixes **three** publishing pathways without a bridge:

1. **CQRS EventBus** — `mark-deal-won.handler.ts:47`, `update-order-status.handler.ts:66`, `approve-tech-checkpoint.handler.ts:47,55`, `create-order.handler.ts:92,100,113`. Fires only `@EventsHandler(SomeEvent)`.
2. **EventEmitter2 string namespace** — `tech-three-checkpoint.listener.ts:81` emits `ERP_EVENTS.ADVANCE_APPROVED = 'fi.advance.approved'`. Fires only `@OnEvent('fi.advance.approved')`.
3. **EventEmitter2 by `event.eventName`** — `record-payment.handler.ts:97,129` emits aggregates' `getDomainEvents()` keyed on `event.eventName` (e.g. `'InvoiceFullyPaid'`).

There are **111** `@OnEvent(...)` decorators across 40 files, **7** `@EventsHandler(...)` decorators across 7 files, and 119 `eventBus.publish/eventEmitter.emit` call sites. Listeners written for one mechanism are dead code for events emitted via another.

### 1.4 Listeners — 24 `*.listener.ts` + 6 `event-handlers/*.handler.ts`

Most use `@OnEvent` (legacy). Only the kanban/pos/design/qc/wms/iot ones use the canonical CQRS `@EventsHandler`. Several do nothing but log: `crm/infrastructure/event-handlers/deal-won.listener.ts:14-27` and `design/infrastructure/event-handlers/so-design-requested.listener.ts:22-32` are theatrical.

### 1.5 Trigger implementation matrix

| # | Trigger (ARCHITECTURE.md §10) | Emit site | Listener | Status |
|---|---|---|---|---|
| 1 | Lead qualified → pipeline | none | none | Missing |
| 2 | Deal Won → SO create | `mark-deal-won.handler.ts:47` (CQRS) | `sd/.../deal-won.listener.ts:17` (`@OnEvent('deal.won')`) | **Broken — namespace mismatch** |
| 3 | design_flag → design task | `create-order.handler.ts:92` (CQRS) | `so-design-requested.listener.ts:18` (`@EventsHandler(SoDesignRequestedEvent)` — different class) | **Broken — class mismatch** |
| 4 | sample_flag → sample task | `create-order.handler.ts:100` | `qc/.../so-sample-requested.listener.ts` (`@EventsHandler`) | **Broken — class mismatch** |
| 5 | 3-checkpoint → PP signal | `approve-tech-checkpoint.handler.ts:55` & aggregate `sales-order.aggregate.ts:216` | `pp/.../design-lab-completed.listener.ts` | Partial |
| 6 | Tech 3-checkpoint → advance check | none documented | `tech-three-checkpoint.listener.ts:41` listens `ERP_EVENTS.TECH_THREE_CHECKPOINT` | **Dangling listener** |
| 7 | Advance approved → unlock PP | `tech-three-checkpoint.listener.ts:81` emits `'fi.advance.approved'` | `pp/.../advance-approved.listener.ts:21` listens `'ADVANCE_APPROVED'` | **Broken — string mismatch** |
| 8 | PP released → WMS pick | `mm/.../pp-released.listener.ts` listens, no emit found in PP handlers | n/a | Missing emit |
| 9 | WMS goods issued → in_production | none in handlers | `pp/.../wms-goods-issued.listener.ts:34` listens `'wms.goods.issued'` | **Dangling listener** |
| 10 | MES completed → QC | listener present (`qc/.../mes-completed.listener.ts`) | dual listener also in `hr/` and `mes/` | Partial |
| 11 | QC passed → WMS FG | `wms/.../qc-passed.listener.ts` | n/a | Partial |
| 12 | WMS FG → invoice | `finance/.../wms-fg-received.listener.ts` | n/a | Partial |
| 13 | Delivery dispatch → driver | `logistics/.../sales-order-confirmed.listener.ts` | n/a | Partial |
| 14 | Delivery completed → invoice | `logistics.controller.ts:136` emits `ERP_EVENTS.LOGISTICS_DELIVERY_COMPLETED` ; listener at `delivery-completed.listener.ts:24` listens `'DELIVERY_COMPLETED'` | **Broken — string mismatch** |
| 15 | Full payment → order closed | aggregate emits `'InvoiceFullyPaid'`; SD listener listens `'payment.full'` | **Broken — string mismatch** |
| 16 | MES→HR 360 | none | none | Missing |
| 17 | LMS cert expired → MES lock | `lms/.../cert-expiry.handler.ts` & `mes/.../lms-cert-expired.listener.ts` | n/a | Partial |
| 18 | MRO machine stop → PP halt | `mro/.../machine-stopped.listener.ts` & `pp/.../mro-stop.listener.ts` | n/a | Partial |
| 19 | Supplier QC fail | `mm/.../supplier-quality-fail.listener.ts` | n/a | Partial |
| 20 | Advance bypass audit | aggregate `sales-order.aggregate.ts:149` emits `AdvanceBypassApproved`; no listener consumes it | **Missing listener** |

**Implemented end-to-end: 0 / 20.** Partial / one-way wiring: ~9. Broken namespace: 5. Missing entirely: 6.

### 1.6 Outbox / event store

No `domain_events` table (`grep domain_events` returns only comms-center unrelated hits). No outbox publisher cron or worker. Every emit is in-process, fire-and-forget; a process crash between aggregate save and event emit silently loses the event.

### Top 5 working end-to-end flows

1. `record-payment.handler.ts:95-98` → invoice aggregate events → `eventEmitter.emit(event.eventName, …)` (proper aggregate-events drain pattern).
2. `iot/.../record-sensor-reading.handler.ts` → `anomaly-detected.handler.ts` (CQRS, same class).
3. `kanban/.../order-created-kanban.handler.ts` & `order-cancelled-kanban.handler.ts` — CQRS handler pair.
4. `pp/infrastructure/event-handlers/design-lab-completed.listener.ts:97` emits canonical ERP_EVENTS constant.
5. `ecommerce.service.ts:202,218` → `crm/listeners/website-*-lead.listener.ts` (matching ERP_EVENTS key).

### Top 5 broken flows

1. Trigger 2 Deal-Won — CQRS emit vs `@OnEvent('deal.won')` (`mark-deal-won.handler.ts:47` ⇄ `sd/.../deal-won.listener.ts:17`).
2. Trigger 7 Advance-Approved — `'fi.advance.approved'` emit vs `'ADVANCE_APPROVED'` listener (`tech-three-checkpoint.listener.ts:81` ⇄ `pp/.../advance-approved.listener.ts:21`).
3. Trigger 15 Payment-Full — `'InvoiceFullyPaid'` emit vs `'payment.full'` listener vs `'fi.payment.full'` constant (`invoice.aggregate.ts:89` ⇄ `payment-received.listener.ts:22`).
4. Trigger 14 Delivery-Completed — `'logistics.delivery.completed'` emit vs `'DELIVERY_COMPLETED'` listener (`logistics.controller.ts:136` ⇄ `delivery-completed.listener.ts:24`).
5. Trigger 20 Advance-Bypass audit — aggregate emits `AdvanceBypassApproved`, **no listener anywhere**.

---

## PART 2 — Repository Pattern

### 2.1 / 2.2 Counts

- `i-*.repo.ts` interfaces: **65**.
- `drizzle-*.repo.ts` implementations: **99**.
- Application-layer concrete repositories (`application/**/*.repository.ts`): **53** — bypass the interface contract entirely.
- Interfaces lacking an implementation OR multiple implementations exist for one aggregate (e.g. `sd` has both `i-sales-order.repo.ts` + DDD shape, AND `i-sd-orders.repo.ts` + `orders.service.ts` shape): ≥ 12 modules show double-tracking.

### 2.3 Anti-patterns

1. **Application-layer "repositories"** (Rule 6 violation): `sd-payments.repository.ts`, `sd-leads.repository.ts`, `sd-quotations.repository.ts`, `sd-dashboard.repository.ts` registered as concrete providers in `sd.module.ts:75-111` with no interface token. Same pattern in `crm/application/crm-*.repository.ts` (10 files), `hr/application/hr-*.repository.ts` (5), `wms/application/*.repository.ts` (5), `director/application/*.repository.ts` (7), `finance/application/*.repository.ts` (4).
2. **Multiple repos per aggregate**:
   - SD orders: `i-sales-order.repo.ts` + `i-sd-orders.repo.ts` + `sd-leads.repository.ts`.
   - CRM leads: `i-lead.repo.ts` + `i-crm-leads.repo.ts` + `crm-leads-ops.repository.ts` + `crm-auto-lead.repository.ts`.
   - Kanban: 8 concrete `drizzle-kanban-*` repos and only 2 interfaces.
3. **Concrete class injection** (no Symbol token): `sd.module.ts:103` `DrizzleSdCustomersRepository`, same for `SdLeadsRepository`, `SdPaymentsService`, `SdDashboardRepository` — tight coupling, undermines P2-20 fix.
4. **Direct DB access in controllers** (Rule 6 + Rule 15 violations): `sd-contracts.controller.ts` (2), `mm-purchase-orders.controller.ts` (2), `lms-core.controller.ts` (1). Limited but real.
5. **Direct DB in listeners** (defeats repos): `tech-three-checkpoint.listener.ts:103,120,139` and `wms-goods-issued.listener.ts:64` use raw `db.execute(sql\`UPDATE sales_orders …\`)` instead of going through `ISalesOrderRepository`.
6. **Repository returning DTOs not aggregates** — `i-quotation.repo.ts` exports `MutationRow`, `QuotationUpdatePatch` (row-shaped types), no domain aggregate involved.

### 2.4 DI wiring

`SALES_ORDER_REPO`, `DEAL_REPO`, `FINANCE_REPO`, `PP_REPO`, `NOTIFICATION_REPO` are Symbol-based ✓. But `sd.module.ts` registers four concrete classes directly (no token), and the 53 application repositories use no tokens at all.

### 2.5 Repository test coverage

No `*.repo.spec.ts` discovered under `apps/api/src/modules/**`. Coverage = 0 % for the contract-style repos.

---

## Cross-reference to 93/100 sprint claim

`docs/ddd-sprint-completion.md` states "92% Sprint Score (5/6 phases complete)". For the two dimensions audited here:

- **Events**: not addressed in the sprint beyond P0-3 (notification adapters). Triple-dispatch ambiguity, string-namespace collisions, and missing outbox are pre-existing and **un-remediated**. Score for this dimension ≤ 45 %.
- **Repositories**: P0-6 (6 raw-SQL handlers migrated) and P2-20 (49 string tokens → Symbols) are real wins, but the 53 application-layer "repositories" + 4 concrete-class providers in `sd.module.ts` are larger violations that the sprint did not touch. Score ≤ 62 %.

Combined dimension score ≈ **55/100**, not the claimed 93/100. The gap is concentrated in (a) lack of an event-dispatch bridge / outbox and (b) the un-reconciled "service-style" `*.repository.ts` files that predate the DDD migration.

---

## Recommended remediation order

1. Pick **one** dispatch mechanism (CQRS EventBus or EventEmitter2) and write a bridge so the other forwards; the dual-mechanism note in `docs/ddd-sprint-completion.md` (P2-18) is **not** an internal detail — it is silently dropping ~5 production triggers.
2. Centralise event names: every emit and every listener must reference `ERP_EVENTS.*` constants (resolves Trigger 7/14/15/20).
3. Convert `LeaveRequest`, `Attendance`, `Employee`, `ProductionOrder`, `Routing`, `BOM` to emit on state transitions (each is 1–2 lines of `addDomainEvent`).
4. Introduce `domain_events` table + outbox publisher worker.
5. Migrate the 53 application-layer `*.repository.ts` files to `infrastructure/`, define interfaces, and replace concrete-class injections in `sd.module.ts`/`crm.module.ts` with Symbol tokens.
