# EuroPrint ERP — Context Map

Date: 2026-05-17 · Scope: `apps/api/src/modules/` (56 modules)
Companion: `docs/ddd-deep-audit-strategic.md`, `docs/ddd-deep-audit-events-repos.md`, `apps/api/src/modules/ARCHITECTURE.md`

## 1. Overview

EuroPrint ERP is a **modular monolith** — a single NestJS process running 56 feature
modules over one Postgres database (per-context separation is by table-name prefix,
not schema/database). For strategic DDD we collapse the 56 modules into **8 bounded
contexts**: every module belongs to exactly one BC, and cross-BC traffic is meant
to flow through domain events (`@nestjs/cqrs EventBus` or, legacy, `EventEmitter2`).

The maturity of the contexts is mixed: 27 of 56 modules already follow the full
`domain/application/infrastructure/presentation` layout; the rest are flat services
plus 3 explicit legacy folders (`compatibility/`, `general/`, `remaining/`). Strategic
DDD discipline scores **58/100** (`docs/ddd-deep-audit-strategic.md` STEP 10).

If you only read one sentence from this document, read this: **the BC boundary is
strong by `@modules/*` alias, but weak by relative-path import** — 98 relative-path
imports cross context boundaries in production code, dominated by
`hr/common/db-rows.ts` (42 sites in 16 modules) and the MRP processor reaching
into PP+WMS domain services.

## 2. Bounded context inventory

| # | Bounded context | Member modules (file counts) | Owned aggregates | Primary technology | Maturity |
|---|---|---|---|---|---|
| BC-1 | **Sales & Customer** | crm(114), sd(67), sales(4), marketing(28), ecommerce(10), website(6) | `Lead`, `Deal`, `SalesOrder`, `Customer` (3 controllers, 1 shared VO) | DDD + CQRS (crm, sd canonical) | Mature |
| BC-2 | **Manufacturing** | pp(76), production(6), mes(40), qc(63), design(25), mm(47), technology(6), mro(21) | `ProductionOrder`, `Bom`, `Routing`, `WorkCenter`, `ProductionSession`, `Reclamation` (+ design/mm sub-aggregates) | DDD + CQRS | Mature (pp, mes, mm, qc) / Anemic (mm/material, qc/reclamation per DDD-deep-audit §D) |
| BC-3 | **Warehouse & Inventory** | wms(83), pos(139), pos-v2(24), logistics(24), storage(2) | `Stock`, `GoodsIssue`, `InventoryCount`, `TransferRequest`, `Delivery` | DDD (pos-v2, logistics) / Flat (pos) | In-flux — `pos` recently promoted from 21 flat controllers |
| BC-4 | **Finance** | finance(134), fi(1), order-workflow(16) | `Invoice`, `Budget`, `OrderAggregate` (tenant-aware) | DDD + CQRS | Mature (order-workflow) / Mixed (finance pseudo-repos) |
| BC-5 | **HR & People** | hr(230), hr-assets(6), lms(54), feedback-360(4), adaptation(4), applications(7) | `Employee`, `Attendance`, `LeaveRequest`, `Course`, `Certification` | DDD (hr, lms) | In-flux — see `docs/hr-module-audit.md`; LeaveRequest anemic |
| BC-6 | **Platform / Infrastructure** | auth(40), admin(28), ai(83), aisha(55), agents(19), ai-agents(11), iot(50), chat(29), kanban(50), notifications(31), director(60), communication-center(33), security(25), queue(11), export(4), analytics(8), org-structure(12), core(29) | `User`, `Notification`, `KanbanTask`, `SensorReading`, `Conversation` (aisha), `ApprovalRequest`, `SystemSettings` | DDD (aisha, kanban, iot, notifications, director, auth) | Mature for newer slices; `core` + `org-structure` anemic (P2-22 only partly enriched) |
| BC-7 | **Integration** | bot-gateway(13), sap(5), integration(12), erp(15), telegram(part of core) | None — adapter modules | Flat / adapter services | Legacy-adjacent — no ports yet |
| BC-8 | **Legacy / Migration** | compatibility(88), general(10), remaining(37) | None | Raw SQL pass-through | **Legacy** — no ACL, 36 `sql\`` calls; PA2-14 pending |

Cross-cutting: `shared(16)` + `common(5)` are **shared kernels** (Customer/Employee/Product IDs, `Money`, `Result`, `AggregateRoot`, `Email`, `PhoneNumber` VOs at `apps/api/src/modules/shared/domain/value-objects/`).

## 3. Context relationships

Relationships are derived from (a) the 20-trigger table in `apps/api/src/modules/ARCHITECTURE.md`, (b) the just-fixed PA0-1..5 trigger remediation, and (c) actual cross-context imports surveyed in `docs/ddd-deep-audit-strategic.md`.

| Upstream → Downstream | Type | Mechanism | Evidence |
|---|---|---|---|
| **CRM → SD** (Deal Won → SO create, Trigger 2) | **Customer-Supplier** (downstream waits on upstream signal) | Published Language: `DealWonEvent` in `crm/domain/events/deal-won.event.ts`; consumed by `sd/.../deal-won.listener.ts` | `crm/application/commands/mark-deal-won.handler.ts:47` publishes via CQRS `EventBus`; **PA0-1 fix** aligned the listener (was broken with `@OnEvent('deal.won')` string mismatch) |
| **SD → PP** (3-checkpoint passed → unlock production, Trigger 5) | **Customer-Supplier** | `SoTechCheckpointEvent`; listener `pp/.../design-lab-completed.listener.ts` | `sd/application/commands/approve-tech-checkpoint.handler.ts:55` + aggregate `sd/domain/aggregates/sales-order.aggregate.ts:216` |
| **SD → Design** (`design_flag=true`, Trigger 3) / **SD → QC** (`sample_flag=true`, Trigger 4) | **Customer-Supplier** | Events `SoDesignRequestedEvent`, `SoSampleRequestedEvent` | `sd/application/commands/create-order.handler.ts:92,100`; listeners in `design/` and `qc/` |
| **PP → MM, WMS** (PP released → reserve materials, Trigger 8) | **Customer-Supplier** (one-to-many fan-out) | `PpReleasedEvent`; listeners `mm/.../pp-released.listener.ts`, `wms/.../pp-released.listener.ts` | `docs/INTEGRATION_GUIDE.md` §"PP_RELEASED_TO_PRODUCTION" |
| **WMS → PP** (goods issued → in_production, Trigger 9) | **Customer-Supplier** | `WmsGoodsIssuedEvent` | `pp/.../wms-goods-issued.listener.ts` (PA0-3 fixed dangling listener) |
| **MES → QC** (session completed, Trigger 10) | **Customer-Supplier** | `MesCompletedEvent`; listeners in `qc/`, `hr/`, `mes/` | `qc/.../mes-completed.listener.ts` |
| **QC → WMS, Finance** (QC pass → FG receipt + rental timer, Triggers 11+12) | **Partnership** (both contexts iterate together on QC outcomes) | `QcPassedEvent`; `wms/.../qc-passed.listener.ts`, `finance/.../wms-fg-received.listener.ts` | §8.4 internal-rental timer in `docs/INTEGRATION_GUIDE.md` |
| **SD ↔ Logistics** (delivery dispatch + completion, Triggers 13+14) | **Customer-Supplier** | `SalesOrderConfirmedEvent`, `DeliveryCompletedEvent` | `logistics/.../sales-order-confirmed.listener.ts`; **PA0-4 fix** repaired `'logistics.delivery.completed'` ↔ `'DELIVERY_COMPLETED'` string mismatch at `logistics.controller.ts:136` |
| **Finance → SD** (full payment → order closed, Trigger 15) | **Customer-Supplier** | `InvoiceFullyPaid` aggregate event drained via `eventEmitter.emit(event.eventName, ...)` | **PA0-2 fix** at `finance/application/commands/record-payment.handler.ts:97`; SD listener `payment-received.listener.ts:22` updated |
| **MES → HR & People** (operator events feed HR 360, Trigger 16) | **Conformist** (HR consumes MES schema as-is) | `MesCompletedEvent` re-handled in `hr/.../mes-completed.listener.ts` | docs §10 |
| **LMS → MES** (cert expiry → MES hard block, Trigger 17, §8.3) | **Customer-Supplier** | `CertExpiredEvent`; `mes/.../lms-cert-expired.listener.ts` | Hard block in `mes/application/commands/start-session.handler.ts` |
| **MRO → PP** (machine stopped → PP halt, Trigger 18) | **Customer-Supplier** | `MachineStoppedEvent`; `pp/.../mro-stop.listener.ts` | docs §10 |
| **MM ↔ Suppliers feedback** (QC fail → vendor rating, Trigger 19) | **Partnership** | `SupplierQualityFailEvent`; `mm/.../supplier-quality-fail.listener.ts` | §17 3-way match |
| **SD → Director** (advance bypass audit, Trigger 20) | **Customer-Supplier** | `AdvanceBypassApprovedEvent` from `sd/domain/aggregates/sales-order.aggregate.ts:149` | **PA0-5 fix** added the missing listener (previously emitted to the void) |
| **Platform/Auth → ALL contexts** | **Open Host Service** | JWT global guard + `@CurrentUser()` decorator | `auth/auth.module.ts` exports `AUTH_REPO`, `JwtStrategy`, `PASSWORD_HASHER` |
| **Notifications ← any context** | **Open Host Service** | `ISmsSender`, `IEmailSender`, `ITelegramSender` ports (P0-3) | `notifications/domain/ports/` |
| **Modules/shared → ALL contexts** | **Shared Kernel** | 6 VOs (`CustomerId`, `EmployeeId`, `ProductId`, `Email`, `PhoneNumber`, `Money`) + `AggregateRoot`, `Result` bases | `apps/api/src/modules/shared/domain/value-objects/` |
| **Integration (bot-gateway, sap, erp, telegram) ↔ Sales, Finance, HR** | **Anti-Corruption Layer (target state)** — currently flat adapter | Plain controller wrappers | `bot-gateway/`, `sap/` — no ACL exists yet (PA3 candidate) |
| **Legacy (compatibility, general, remaining) ↔ everyone** | **Anti-Corruption Layer (scaffold landed; full migration pending)** | `IAclTranslator<TLegacy, TDomain>` contract; per-concern translators under `<module>/acl/`; legacy endpoints stay, new `*/v2` endpoints emit translated DTOs | Contract: `apps/api/src/modules/shared/domain/acl/i-acl-translator.ts`. References: `compatibility/acl/user-acl.ts`, `remaining/acl/order-acl.ts`. Reviewer: `scripts/reviewer-legacy-acl.sh` (registered as PA2-14 in `run-all-reviewers.sh`). |
| **Aisha (AI assistant) ↔ many contexts** | **Open Host Service** (Aisha exposes Conversation/ToolCall) | CQRS handlers + 5 named events | `apps/api/src/modules/aisha/domain/` — `Conversation` aggregate, `VoiceCommand` / `ToolCall` / `PendingApproval` VOs |

### Quick navigation: "I'm in CRM and I need a customer's payments — what do I call?"

1. **Do not import an SD service.** SD owns the `SalesOrder` and the payment events; CRM may not reach across.
2. **Listen** for `InvoiceFullyPaid` / `Trigger 15` if your logic is reactive (recommended).
3. If you need synchronous read access, **query through the SD Open Host** — the `IPaymentReadModel` exposed by SD (not yet formalised — strategic TODO; track via `IOrderHeader` interface plan in `docs/ddd-deep-audit-strategic.md` §10.4).
4. **Never** do `import { db } from '@shared/db'` and read `sales_orders` directly from CRM — that is the Rule-6+Rule-15 violation the audit flags in `tech-three-checkpoint.listener.ts:103,120,139`.

## 4. Anti-patterns observed

Cited from independent audit reports:

1. **Shared-kernel leak: `hr/common/db-rows.ts`** — imported by 16 non-HR modules (42 sites). A DB-row helper is trapped in the wrong context. **PA2-15 fixed** by relocating to `apps/api/src/common/db/db-rows.ts` with HR re-export. (`docs/ddd-deep-audit-strategic.md` STEP 2)
2. **5 unreconciled "Order" aggregates** — `sd/SalesOrder`, `pp/ProductionOrder`, `design/DesignOrder`, `mm/PurchaseOrder`, `order-workflow/OrderAggregate`; plus 3 controllers in `erp/`, `ecommerce/`, `compatibility/`. No shared `IOrderHeader` interface. **PA2-16 in flight.** (`docs/ddd-deep-audit-strategic.md` STEP 6)
3. **No ACL on `compatibility/` (88 files) + `remaining/` (37 files)** — raw SQL pass-through, 36 `sql\`` calls, no aggregates, no DTO mapping. **PA2-14 pending.** (`docs/ddd-deep-audit-strategic.md` STEP 4)
4. **Cross-context reach in queue/processors:** `queue/processors/mrp-run.processor.ts:17-19` directly imports `pp/domain/services/bom-explosion.service`, `wms/domain/services/eoq-calculator`, `wms/domain/services/safety-stock`. The MRP processor crosses three BCs at the domain-service layer. (`docs/ddd-deep-audit-strategic.md` STEP 7)
5. **53 application-layer pseudo-repositories** in CRM/HR/WMS/SD/director/finance — bypass interface contract, ship raw SQL, return DTOs instead of aggregates. (`docs/ddd-deep-audit-events-repos.md` §2.3)
6. **Triple event-dispatch** (CQRS `EventBus`, `EventEmitter2` string namespace, `EventEmitter2` by `event.eventName`) — caused 5 broken triggers; PA0-1..5 fixed those, but the underlying split remains (P2-18 deferred). (`docs/ddd-deep-audit-events-repos.md` §1.3)
7. **3 "Customer" controllers** (sd, crm, ecommerce) + **3 "Department" owners** (core, org-structure, hr) for the same logical entities. Ubiquitous language inconsistency.
8. **No `domain_events` outbox table** — every emit is in-process fire-and-forget; a crash between aggregate save and event publish silently loses the event. (`docs/ddd-deep-audit-events-repos.md` §1.6)

## 5. Migration plan — context-by-context

Ordered by ratio of (legacy debt) ÷ (refactor cost):

1. **BC-8 Legacy → ACL (highest priority).** Wrap `compatibility/`, `general/`, `remaining/` in ACL: each `*-compat.service.ts` becomes a translation adapter that maps legacy rows to current aggregates (CRM, SD, HR). Ban `sql.raw(...)` via reviewer (already partly enforced — Rule B, see `CLAUDE.md`).

   **PA2-14 scaffold landed (2026-05-17).** The `IAclTranslator<TLegacy, TDomain>` contract lives at `apps/api/src/modules/shared/domain/acl/i-acl-translator.ts`. Two reference implementations demonstrate the pattern: `compatibility/acl/user-acl.ts` (legacy users-compat row ↔ canonical `UserDto`, wired into `users-compat.controller.ts` as `GET /users/v2`) and `remaining/acl/order-acl.ts` (legacy `order_status_logs` row ↔ `OrderStatusLogDto`, wired into `order-status.controller.ts` as `GET /order-status/:orderId/log/v2`, plus a `GenericLegacyRowAclTranslator` base class for cases that only need snake_case→camelCase + Date coercion). Legacy endpoints stay live for backwards compatibility; new BC consumers target `*/v2` and receive validated DTOs. The reviewer `scripts/reviewer-legacy-acl.sh` (registered in `scripts/run-all-reviewers.sh` as rule PA2-14) fails the build if any `*.controller.ts` under `compatibility/`, `remaining/`, or `general/` contains `sql.raw`, `db.execute`, or `runQuery` — those calls must move into a repository fronted by a translator. Full migration of the remaining 88 + 37 + 10 legacy files is a separate sprint.
2. **BC-5 HR & People — split the 230-file module.** 13 sub-`*.module.ts` already exist; promote each sub-module to its own bounded context candidate (Recruitment, Attendance, Payroll, Performance, LMS, Adaptation). LeaveRequest aggregate to be made rich per `docs/hr-module-audit.md`.
3. **BC-7 Integration — promote to Open Host Service.** `bot-gateway/`, `sap/`, `erp/`, `integration/`, `telegram/` should expose stable APIs (REST/gRPC/event) and consume internal contexts only via published events. Currently they are flat adapter services with no ports.
4. **BC-6 Platform — extract org-structure + core into a dedicated "Org Domain" BC.** Three modules currently own Department/Position; consolidate ownership.
5. **BC-4 Finance — split `finance(134)`** into FI (general ledger / banking) and Controlling (budgets, payroll calc, CFO reports). Keep `order-workflow/` (tenant-aware) as its own context.
6. **BC-3 Warehouse & Inventory — merge `storage(2)` into `wms`**, finish promoting `pos(139)` to DDD layout.
7. **BC-2 Manufacturing — merge `production(6)` into `pp`** (overlap is total) and `technology(6)` into `mm`.
8. **BC-1 Sales & Customer — merge `sales(4)` into `sd`**, formalise CRM↔SD via `IOrderHeader` interface published in `modules/shared/domain/`.

Effort budget per `docs/ddd-deep-audit.md` §4: **5 sprints to reach honest 92-95/100** (vs current ~67-71/100).

## 6. Reading guide

- **Trigger map (event choreography between BCs):** `apps/api/src/modules/ARCHITECTURE.md` (20 triggers) and `apps/api/src/modules/INTEGRATION_GUIDE.md` (PP/MES/WMS/MM event flow).
- **Strategic-DDD audit (this document's primary source):** `docs/ddd-deep-audit-strategic.md`.
- **Tactical DDD audit (intra-context discipline):** `docs/ddd-layers-audit.md`, `docs/ddd-deep-audit-tactical.md`.
- **CQRS adoption:** `docs/ddd-deep-audit-cqrs.md`.
- **Events + repositories (where 5 triggers broke):** `docs/ddd-deep-audit-events-repos.md` — also documents the 53 application-layer pseudo-repositories.
- **Sprint summary (what the recent DDD work actually changed):** `docs/ddd-sprint-completion.md`.
- **HR-specific backlog (LeaveRequest, 20 remediation tasks):** `docs/hr-module-audit.md`.
- **Master remediation plan:** `docs/MASTER_REMEDIATION_PROGRAM.md`.

When in doubt about whether something is a cross-BC call, run:
```bash
grep -rn "from '\(\.\./\)\{2,\}" apps/api/src/modules/<your-module>/
```
Every `../../` two-or-more-levels-up import is a candidate cross-context leak; the legitimate exit is `@modules/*` alias + published events.
