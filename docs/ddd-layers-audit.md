# DDD Layers Audit — EuroPrint ERP Backend

Date: 2026-05-16
Branch: `chore/clean-faza-3`
Scope: `apps/api/src/modules/**` (57 modules) + `apps/api/src/shared/**` + global cross-cutting.
Method: 4 parallel deep-scan agents, one per layer + cross-cutting concerns.

---

## TL;DR

| Dimension | Value |
|---|---:|
| Total modules | **57** |
| Full-DDD modules (`domain/`+`application/`+`infrastructure/`+`presentation/`) | **27** |
| Flat (non-DDD) modules | **~26** |
| Partial / shell modules | **4** (`ai-agents`, `common`, `shared`, `fi`) |
| Domain files | 174 |
| Application files | 481 |
| Infrastructure files | 139 |
| Controllers | 332 |
| HTTP endpoints | ~2,975 |
| Total reviewable files (DDD slice) | ~1,100 |

**Headline verdict.** The skeleton is solid — repository pattern, Result type, CQRS bus, value objects, aggregate roots — but the **domain layer is leaking infrastructure** in 41 files, the **application layer bypasses repositories** in 55 handlers (34 %), and the **presentation layer still has 12 controllers writing raw SQL**. None of these are catastrophic; all are mechanical to fix.

---

## 1. Module DDD-coverage map

### Full DDD (27)

admin · ai · aisha · auth · communication-center · core · crm · design · director · finance · hr · iot · kanban · lms · logistics · marketing · mes · mm · mro · notifications · order-workflow · pos-v2 · pp · qc · sd · security · wms

### Flat / legacy (≈26)

adaptation · agents · analytics · applications · bot-gateway · chat · compatibility · ecommerce · erp · export · feedback-360 · fi · general · hr-assets · integration · org-structure · pos · production · queue · remaining · sales · sap · storage · technology · website

**Classification**:
- **Legacy / pass-through** (3): `compatibility` (31 controllers, all `*-compat.controller.ts`), `general`, `remaining` — keep until migration sunset.
- **Infrastructure** (1): `queue` (BullMQ wiring, no HTTP).
- **Shell** (1): `fi` (only a tax service, no controller).
- **Active-but-flat** (21): rest. **`pos` is the worst** — 21 controllers under `controllers/` flat folder, should be promoted to DDD layout.

---

## 2. Domain layer — findings

### Inventory

| Category | Count | Notes |
|---|---:|---|
| Aggregate roots | 41 | `*.aggregate.ts` convention is uniform |
| Entities | 1 | only `admin/.../system-settings.entity.ts` |
| Value Objects | 11 | concentrated in `aisha`, `crm`, `auth`, `sd`, `order-workflow`, `shared` |
| Domain Events | 28 files (15 named, 13 placeholders) | no `eventVersion`, no `occurredAt` discipline |
| Repository interfaces | 25 | every module except `ai`, `aisha`, `communication-center`, `order-workflow` |
| Domain services | 45 | top: `finance` (11), `pp` (9), `qc` (9) |
| Domain errors (`*.error.ts`) | **0** | all using `Result<T>` strings or NestJS exceptions |
| Specifications / Policies | **0** | none |

### Violations

| Violation | Count | Top offenders |
|---|---:|---|
| `@nestjs/common` import in `domain/` | **41** | `finance/domain/services/*` (8), `qc/domain/services/*` (8), `pp/domain/services/*` (7) |
| `drizzle-orm` / raw DB in `domain/` | **15** | `finance/domain/services/cfo-config.service.ts` **declares its own `pgTable`!**, `qc/spc`, `spoilage`, `dpmo`, `imposition`, `ink-consumption`, `pp/bom-explosion`, `hr/overtime-calculator` |
| `@shared/db` import in `domain/` | 16 | same files + `lms/domain/services/certification.service.ts` |
| `bcrypt` / HTTP in domain | 3 | `auth/.../password.vo.ts` (bcrypt), `notifications/.../telegram.service.ts` (`HttpService`), `notifications/.../sms.service.ts` (raw `fetch` to eskiz.uz) |
| `@nestjs/cqrs AggregateRoot` mixed with in-house base | **11** | `mes`, `wms`, `marketing`, `notifications`, `logistics`, etc. — two competing aggregate bases |
| `InternalServerErrorException` thrown from domain | 7 | `shared/domain/value-objects/money.vo.ts`, `shared/domain/result.ts`, `finance/.../budget.aggregate.ts`, others |
| Domain → infrastructure inversion | 1 | `lms/domain/services/certification.service.ts:10` imports `../../infrastructure/repositories/drizzle-lms.repo` |
| Anemic aggregates (data + getters, no invariants) | 8 | `admin/user`, `kanban/kanban-task`, `iot/sensor-reading`, `notifications/notification`, `core/{department,panel,position}`, `pp/work-center` |
| Aggregates that never emit events | **17 of 41** | including `admin/user`, all of `core/*`, `hr/employee`, `pp/{work-center,bom,routing,production-order}`, `kanban/kanban-task` |

### Strongest modules

1. **`sd`** — `SalesOrder` aggregate enforces idempotency, optimistic version, invariants in `confirmAdvancePayment` / `bypassAdvance` / `approveTechCheckpoint`. Three named events.
2. **`aisha`** — Conversation aggregate, 5 named event classes, 3 VOs (`VoiceCommand`, `ToolCall`, `PendingApproval`). Zero infra leaks.
3. **`order-workflow`** — Clean state machine via `OrderStatusVo.canTransitionTo`, optimistic concurrency.
4. **`crm`** — Lead + Deal aggregates with rich behaviour and 3 VOs.
5. **`shared`** — `AggregateRoot`, `ValueObject<T>`, `Result<T>` bases.

### Weakest modules

1. **`finance`** — 9/11 domain services import Drizzle. `cfo-config.service.ts` literally declares a `pgTable` inside `domain/`.
2. **`qc`** — 6/9 domain services read/write Postgres directly. `spc.service.ts:59` does `import { db, qc_spc_data } from '@shared/db'`.
3. **`pp`** — Aggregates exist but lack behaviour (only getters + `apply()` shim). `bom-explosion.service.ts` issues raw SQL.
4. **`notifications`** — All 3 "domain" services are pure infrastructure (SMS/Telegram/Email). Belong in `infrastructure/`.
5. **`lms`** — Architectural inversion: domain service imports its own infra repo.

---

## 3. Application layer — findings

### Inventory

| Category | Count |
|---|---:|
| Application files | 481 |
| Command handlers (`*.handler.ts` in `commands/`) | ~100 |
| Query handlers (`*.handler.ts` in `queries/`) | ~61 |
| Application services | 117 |
| CQRS Sagas (`@Saga`) | **0** |
| Event handlers (`@EventsHandler`) | 2 (both in `kanban/event-handlers/`) |
| Application-layer repositories (smell) | 54 |

### Adoption metrics

- **Result pattern**: 158/161 handlers use `Result/Ok/Err` (98 %). Only 7 still throw `*Exception` mid-flow (`sd/create-invoice`, `sd/update-order-status`, `mes/start-session`, 3× finance queries).
- **CQRS decorators**: 149/161 (93 %) correctly declare `@CommandHandler`/`@QueryHandler`/`@EventsHandler`. **12 handlers in `admin/` and `auth/` are missing the decorator** → they never register with the bus despite the filename.
- **`CommandBus.execute()` callsites**: 39 controllers (97 calls) + 38 controllers using `QueryBus.execute()`. The `as Result<unknown>` cast is only in `crm-leads-ops.controller.ts` (4 callsites — recent regression). Every other controller uses the cleaner `unwrapOrThrow(res)` helper from `@common/http-result` (746 callsites).
- **Drizzle leakage**: **55 / 161 handlers (34 %)** import `@shared/db` directly. Only **2** wrap their mutations in `db.transaction(...)` — both in `order-workflow`.

### Strongest application layers

1. **`crm`** — Pure use-case handlers, repository interface tokens (`@Inject('ILeadRepository')`), VOs (`Money.of`, `AIScore.create`), Result everywhere.
2. **`director`** — Typed repo tokens (`@Inject(APPROVAL_REPO)`), `safeCall`, `AppErr` codes.
3. **`mes`** — Aggregate drives logic, repos behind interface (one minor throw in `start-session`).
4. **`design`** — Small focused handler, EventBus.publish, factory `DesignOrder.create()`.
5. **`iot`** — Consistent `@Inject('IIotRepository')`, `Result<void>`, EventBus publish.

### Weakest application layers

1. **`sd`** — `create-invoice.handler.ts` imports `db, runQuery, invoices` and runs raw SQL → INSERT. No repo. Throws `BadRequestException`. No transaction across order-status validate + invoice insert.
2. **`order-workflow`** — Best transaction discipline (uses `db.transaction(...)`) but `create-order.handler.ts` and `transition-status.handler.ts` reach around `IOrderRepo` for reads. Repo interface lives under `infrastructure/repositories/` instead of `domain/repositories/`.
3. **`kanban/event-handlers`** — Both `order-created-kanban.handler.ts` and `order-cancelled-kanban.handler.ts` are pure `runQuery(sql\`...\`)` against `kanban_boards/columns/cards` from inside an event handler.
4. **`mes`** — `start-session.handler.ts:58` throws `ForbiddenException` inside a Result-returning handler.
5. **`finance`** — 14 handlers run raw SQL queries; `record-payment.handler.ts` mutates state via raw SQL.

### Event dispatch — inconsistent (4 mechanisms in use)

a. `super.addDomainEvent({...})` on in-house `shared/AggregateRoot` (Lead, SalesOrder).
b. `this.apply({ type, data })` on `@nestjs/cqrs AggregateRoot` (ProductionSession, ProductionOrder).
c. `this.events.push(new XEvent(...))` private array (Invoice, Employee, Attendance, Conversation).
d. No events at all (User, KanbanTask, Notification, SensorReading, all `core/*`).

Plus modules split between `EventEmitter2` (order-workflow, director) and `@nestjs/cqrs EventBus` (crm, design, wms, sd, qc, mes, mm, pp).

---

## 4. Infrastructure layer — findings

### Inventory

| Category | Count |
|---|---:|
| Total infra files | 139 |
| Repository implementations | 94 (87 `*.repo.ts` + 7 `*.repository.ts`) |
| Event listeners | 24 (21 listeners + 3 handlers) |
| **Dedicated mapper files (`*.mapper.ts`)** | **0** — mapping is inline (`toDomain`, ad-hoc) |
| External adapters in `infrastructure/` | **0** — they live in `application/` or top-level |
| Schemas declared inside `infrastructure/` (leak) | 13 |
| BullMQ processors | 7 (6 in `modules/queue` + 1 hr) |

### Repository ↔ interface coverage

- **29 / 29 main repos implement an explicit interface** (`drizzle-*.repo.ts implements I*Repo`).
- **~16 helper / sub-repos** have no interface (kanban sub-repos, iot camera/main repos, finance helpers, wms root-level repos).
- Overall: **65 % of all `*.repo.ts` files** have an interface contract.

### Raw SQL inventory

- Strict `db.execute(sql\`...\`)`: **only 1 file** (`admin/infrastructure/repositories/admin-extra.repo.ts:139, 213`) — properly documented `NOTE` block, Rule 4 exception.
- `runQuery(sql\`...\`)` (functionally raw SQL via wrapper): **449 occurrences across 43 files**. Top offenders:
  - `iot/.../drizzle-iot-sensors.repo.ts` — 21
  - `iot/.../drizzle-iot-main.repo.ts` — 20
  - `iot/.../drizzle-sensor.repo.ts` — 19
  - `finance/.../drizzle-finance.repo.ts` — 18
  - `hr/.../drizzle-leave.repo.ts` — 18
  - `lms/.../drizzle-lms-misc.repo.ts`, `drizzle-lms.repo.ts` — 17 / 17

Each has in-file `NOTE` block claiming the SQL is too complex for Drizzle — policy-allowed but worth re-examining.

### N+1 hotspots

- `pos-v2/infrastructure/repositories/drizzle-pos-v2.repo.ts:87-92` — `Promise.all(countsRows.map(async (c) => db.select().from(inventoryCountLines).where(eq(..., c.id))))` — classic N+1. Replace with `inArray(...)` single query.
- `notifications/infrastructure/event-handlers/erp-events.listener.ts:39-44` — fan-out write; not strictly N+1 but bulk insert preferable.

### External adapters

Adapter|Location|Has port?|Retry/Timeout
---|---|---|---
Telegram bot|`apps/api/src/telegram/telegram.service.ts`|No (concrete)|**None** + reads `process.env.TELEGRAM_BOT_TOKEN` directly (Rule 7 violation)
Anthropic Claude|`modules/aisha/application/llm/claude.service.ts`|No|None
Google Gemini|`modules/aisha/application/llm/gemini-fallback.service.ts`|No|None
SMS (Eskiz / Infobip)|`modules/notifications/domain/services/sms.service.ts`|No|None
Email|`modules/queue/processors/email.processor.ts`|No|BullMQ retry only
ElevenLabs / Picovoice|`modules/aisha/...`|No|None

**Zero retry / circuit-breaker / timeout logic anywhere.** All external clients are best-effort.

### DI token consistency

| Pattern | Count |
|---|---:|
| `Symbol('XXX_REPO')` (canonical) | 15 |
| String literal `'XXX_REPO'` | 49 |

**Only 23 % use the Symbol pattern; 76 % use string literals.** Some handlers use `@Inject('IWmsRepository')` (raw string with interface name) — brittle.

**Duplicate / collision risk**: `USER_REPO` is `Symbol('IUserRepo')` in `admin/domain/repositories/i-user.repo.ts:35` AND `'USER_REPO'` string in `admin/admin.tokens.ts:6`.

### Schema leakage

13 `infrastructure/` files declare their own `pgTable(...)`. Worst offenders:
- `admin/infrastructure/repositories/admin-extra.repo.ts:21-47`
- `ai/infrastructure/db/ai-usage-logs.table.ts`
- `pos-v2/.../drizzle-pos-v2-request.repo.ts`

Source-of-truth should be `apps/api/src/shared/db/schema-*.ts` (66 schema files exist).

---

## 5. Presentation layer + cross-cutting — findings

### Inventory

| Metric | Value |
|---|---:|
| Controllers | 332 |
| HTTP endpoint decorators | ~2,975 |
| WebSocket gateways | 5 (`chat`, `cc`, `pos`, `ai-interview-v2`, `territory`) |
| SSE endpoints | 1 (`aisha-sse.gateway.ts`) |
| Global guard chain | `Throttler → Jwt → Roles → Sod → Permission` |
| Global interceptors | `Audit → ResultUnwrap` |
| Global pipe | `ZodValidationPipe` |
| Global filter | `GlobalExceptionFilter` |

### Rule compliance

| # | Rule | Status |
|---|---|---|
| 3 / 20 | Zod DTO validation | **WARN** — 90/281 controllers use Zod inline; 73 still accept `@Body() body: Record<string, unknown>` |
| 6 | Controller is transport-only | **FAIL** — 12 controllers still call `runQuery`/`sql\`` directly |
| 8 | JWT guard on every controller | **PASS** — global `APP_GUARD`; 30 `@Public()` opt-outs all justified except 1 missing |
| Route uniqueness | METHOD+PATH duplicates across files | **PASS** — 0 cross-file dups (after recent `/legacy/*` fix) |
| Intra-file duplicates | 3 controllers list a route twice (LMS) | **WARN** — `lms-questionnaire`, `lms-attempts`, `lms-lessons` |
| HTTP semantics | GET-only-reads | **PASS** |
| DTO↔Domain leakage | Raw `rows[0]` returns | **WARN** — `sd-quotations.controller.ts:135,146,170…` |
| i18n in controllers | `i18n.t()` adoption | **FAIL** — only 6/332 controllers (<2 %); ~24 still throw bare Uzbek strings |
| OpenAPI / Swagger | `@ApiOperation`/`@ApiResponse`/`@ApiTags` | **PARTIAL** — 101/332 (30 %) have any tag; only 69/332 (21 %) have per-route `@ApiOperation` |

### Top Rule-6 violators (controllers with raw SQL)

| # | File | Direct DB calls | Action |
|---|---|---:|---|
| 1 | `modules/sd/presentation/sd-quotations.controller.ts` | 9 `runQuery` (13 inline UPDATE/DELETE) | Move to `SdQuotationsService` |
| 2 | `modules/wms/presentation/wms-gateway-binszone.controller.ts` | 10 `rawSql` | Move to `WmsWarehouseGatewayService` |
| 3 | `modules/wms/presentation/wms-gateway-warehouses.controller.ts` | 10 `rawSql` | Move to service |
| 4 | `modules/hr/presentation/hr-employee-goals.controller.ts` | 6 partial-UPDATE COALESCE | Documented Rule 4 exception — keep but flag |
| 5 | `modules/wms/presentation/wms-gateway-inventory.controller.ts` | 4 `rawSql` | Move to service |

Also flagged: `sd-contracts`, `mm-purchase-orders`, `kanban-cards`, `qc-reclamations`, `cc-documents`, `cc-public`, `wms-warehouses`, `wms-gateway-warehouse-lots`, `lms-core`.

### JWT guard — 1 violation

- **`cc-public.controller.ts`** has no `@Public()` decorator but is meant to be public (QR verify). Endpoints `/api/cc/verify/:id` are blocked by global JWT guard.

### WebSocket / SSE — all guarded

- All 6 (5 WS + 1 SSE) re-verify JWT in `handleConnection` (gateways don't inherit global guards in NestJS).

---

## 6. Cross-cutting issues that span all layers

1. **Two competing aggregate bases** — `@nestjs/cqrs AggregateRoot` (11 aggregates) vs `shared/domain/aggregate-root.base.ts` (in-house). Pick one.

2. **Two competing `Result<T>` implementations** — `@common/result` (discriminated union) vs `@shared/domain/result.ts` (class). New code uses the union; older aggregates (Invoice, Employee, Attendance) mix in `Logger.warn`-and-silently-return patterns.

3. **No domain error types** — zero `*.error.ts` files. Errors are either strings inside `Result.Err(...)` or `HttpException` thrown straight from domain.

4. **No specifications / policies** — business rules are inline private methods inside aggregates.

5. **Primitive obsession** — only 5 identity/status VOs exist (`LeadStatus`, `DealStatus`, `SoStatus`, `OrderStatusVo`, `AIScore`). `Money` is the sole "common" VO. `customerId`, `employeeId`, `productId`, `email`, `phone` are `number`/`string` everywhere.

6. **TashkentTimeService instantiated as side-effect-on-import** in ~25 aggregates — `const _time = new TashkentTimeService()` at module level.

7. **External-service ports missing** — Telegram, Claude, Gemini, SMS, Email, ElevenLabs all lack `IXxxPort` interfaces. Hard to mock, hard to swap.

8. **No retry / timeout / circuit-breaker** on any external call.

9. **Inconsistent DI token style** — `Symbol()`, string literal, class-based — three patterns coexist; `USER_REPO` has a Symbol + string collision.

10. **i18n adoption gap** — <2 % of controllers use `I18nService`. Backend Telegram-bot handlers + ~40 compatibility validation messages still in Uzbek.

---

## 7. Strongest vs weakest modules — combined ranking

| Rank | Strongest (DDD discipline) | Weakest (cross-layer issues) |
|---|---|---|
| 1 | **`sd`** (rich aggregate, idempotency, invariants) | **`finance`** (cfo-config declares pgTable in domain; 14 raw-SQL handlers) |
| 2 | **`aisha`** (5 events, 3 VOs, zero infra leaks) | **`qc`** (6/9 domain services import Drizzle) |
| 3 | **`order-workflow`** (state-machine VO, optimistic concurrency, transactions) | **`pp`** (anemic aggregates, raw SQL in domain `bom-explosion`) |
| 4 | **`crm`** (rich aggregates, 3 VOs, clean handlers) | **`notifications`** (SMS/Telegram/Email are pure infra in `domain/`) |
| 5 | **`director`** (typed tokens, safeCall, AppErr) | **`lms`** (domain → infra inversion) |
| 6 | **`mes`** (aggregate-driven, repos behind interface) | **`sd`** application/presentation (raw SQL in handler + controller) |
| 7 | **`design`** (small, focused, factory + event publish) | **`pos`** (21 flat controllers, no DDD layout) |
| 8 | **`iot`** application (consistent injection, EventBus) | **`iot`** infrastructure (60+ raw-SQL fragments) |

The fact that `iot` and `sd` appear on both sides illustrates the gap between **logical model** (clean) and **persistence/transport plumbing** (still leaks).

---

## 8. Priority fixes — recommended sequence

### P0 — fix this sprint

1. Remove `pgTable` from `finance/domain/services/cfo-config.service.ts` — move to `shared/db/schema-*.ts`, query through `IFinanceRepository`.
2. Strip Drizzle imports from 15 domain services (finance × 7, qc × 6, pp/bom-explosion, hr/overtime-calculator).
3. Move `notifications/domain/services/{sms,telegram,email}.service.ts` → `infrastructure/`. Add `ISmsSender` / `IEmailSender` ports in domain.
4. Fix `cc-public.controller.ts` — add `@Public()` decorator (endpoints currently dead).
5. Move 13 inline UPDATE/DELETE SQL out of `sd-quotations.controller.ts` into a service.
6. Migrate raw-SQL application handlers behind repositories: `sd/create-invoice`, `sd/update-order-status`, both kanban event-handlers, finance `record-payment`/`check-advance`.
7. Decorate or rename the 12 missing-`@CommandHandler` handlers in `admin/` and `auth/`.
8. Fix `USER_REPO` token collision (`Symbol('IUserRepo')` vs `'USER_REPO'` string).

### P1 — next sprint

9. Eliminate `throw *Exception` inside Result-returning handlers (7 files in `sd`, `mes`, `finance`).
10. Wrap multi-write commands in `db.transaction(...)`: `sd/create-invoice`, `wms/goods-issue`, `mm/goods-receipt`, `mes/complete-session`, `qc/submit-inspection`.
11. Pick one aggregate base — migrate the 11 `@nestjs/cqrs AggregateRoot` usages to `shared/domain/aggregate-root.base.ts`.
12. Move bcrypt out of `auth/domain/value-objects/password.vo.ts` → infrastructure `IPasswordHasher`.
13. Replace `throw new InternalServerErrorException` in 7 domain files with `Result.Err(AppErr(...))` or a domain error class.
14. Replace `as Result<unknown>` cast in `crm-leads-ops.controller.ts` with `unwrapOrThrow(res)`.
15. Migrate 24 controllers throwing bare Uzbek strings to `i18n.t('errors.…')`.
16. Eliminate the 73 controllers using `@Body() body: Record<string, unknown>` without a Zod schema.

### P2 — quality / consistency

17. Promote `pos/controllers/` (21 files) to DDD layout.
18. Pick one event mechanism (EventEmitter2 vs `@nestjs/cqrs EventBus`); standardise aggregate `.apply()`.
19. Consolidate `Result<T>` — delete `shared/domain/result.ts`, migrate Invoice/Employee/Attendance to `@common/result`.
20. Convert all string-literal DI tokens to `Symbol()` co-located with the interface (49 sites).
21. Introduce identity VOs across CRM/SD/HR boundaries (`CustomerId`, `EmployeeId`, `ProductId`, `Email`, `PhoneNumber`).
22. Add behaviour to anemic aggregates: `User.deactivateBy`, `KanbanTask` transition rules, `Notification.markAsRead`, `core/*` creation events.
23. Add domain ports for external adapters: `ITelegramPort`, `IClaudePort`, `IGeminiPort`, `ISmsPort` + retry/timeout wrappers.

### P3 — long tail

24. Add `@ApiOperation` / `@ApiResponse` to remaining 263 controllers (30 % → 100 %).
25. Resolve intra-file route duplicates in LMS controllers.
26. Replace 50 stub returns (`return { items: [], total: 0 }`) — confirmed 23 controllers still return stubs.
27. Move 13 `pgTable` definitions out of `infrastructure/` into `shared/db/schema-*.ts`.
28. Migrate from repeated `Throttle({default…})` literal `{ limit: 100, ttl: 60_000 }` to named profile decorator.
29. Fix N+1 in `pos-v2/.../drizzle-pos-v2.repo.ts:87-92` with `inArray(...)`.
30. Replace 449 `runQuery(sql\`...\`)` occurrences with Drizzle query-builder calls where feasible.

---

## 9. Score estimate

| Layer | Score | Notes |
|---|---:|---|
| Domain | **72 / 100** | Structure is good but 41 infra leaks + 17 silent aggregates drag it down |
| Application | **78 / 100** | 98 % Result adoption, 93 % CQRS decoration; 34 % handlers bypass repos |
| Infrastructure | **74 / 100** | Repo interfaces exist for canonical repos; raw SQL via `runQuery` is wide |
| Presentation | **82 / 100** | Global guards solid; 12 raw-SQL controllers + 73 unvalidated bodies |
| Cross-cutting | **70 / 100** | Two aggregate bases, two Result types, no domain errors, no specs |
| **Overall DDD discipline** | **75 / 100** | Good skeleton, mechanical fixes needed |

After P0 (1 sprint): **~83 / 100**
After P0 + P1 (2 sprints): **~91 / 100**
After P0 + P1 + P2 (3 sprints): **~96 / 100**

---

## 10. What this audit did NOT cover

- **Test coverage per layer** — unit/integration ratio, mocks vs in-memory repos.
- **Module dependency graph** — which modules import which (potential cycles).
- **Frontend DDD** — the React side has its own folder discipline; out of scope.
- **Bounded-context boundaries** — should `crm` and `sd` share the same `Customer` aggregate, or maintain separate models with a translation layer? Strategic-DDD question.
- **Read model materialisation** — most queries hit the OLTP tables directly; no projections/views.

These are next-sprint candidates for a strategic-DDD review.
