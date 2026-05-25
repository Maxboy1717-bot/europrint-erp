# DDD Tactical Patterns — Deep Audit

**Date:** 2026-05-17
**Scope:** `apps/api/src/modules/**` — Aggregates · Entities · Value Objects · Domain Services · Domain Events
**Baseline:** `docs/ddd-layers-audit.md` ; **Claimed:** `docs/ddd-sprint-completion.md` (75/100 → 93/100)

## 1. Per-module DDD inventory

29 modules contain a `domain/` folder; 27 of them have at least one aggregate. The `ai/` and `communication-center/` folders carry only types/index (no aggregates, VOs, services or events).

| module | aggregates | VOs | services | events | repo I/F |
|---|--:|--:|--:|--:|--:|
| admin | 1 | 0 | 0 | 0 | 2 |
| ai | 0 | 0 | 0 | 0 | 0 |
| aisha | 1 | 3 | 0 | 5 | 0 |
| auth | 1 | 1 | 0 | 1 | 1 |
| communication-center | 0 | 0 | 0 | 0 | 0 |
| core | 3 | 0 | 0 | 0 | 1 |
| crm | 2 | 3 | 3 | 3 | 2 |
| design | 1 | 0 | 0 | 0 | 1 |
| director | 1 | 0 | 0 | 6 | 1 |
| finance | 2 | 0 | 10 | 2 | 1 |
| hr | 3 | 0 | 3 | 2 | 1 |
| iot | 2 | 0 | 0 | 0 | 1 |
| kanban | 1 | 0 | 0 | 0 | 2 |
| lms | 1 | 0 | 1 | 1 | 1 |
| logistics | 1 | 0 | 3 | 0 | 1 |
| marketing | 1 | 0 | 0 | 0 | 1 |
| mes | 2 | 0 | 0 | 0 | 0 |
| mm | 2 | 0 | 0 | 0 | 0 |
| mro | 1 | 0 | 0 | 0 | 1 |
| notifications | 1 | 0 | 0 | 0 | 1 |
| order-workflow | 1 | 1 | 0 | 1 | 0 |
| pos | 0 | 0 | 0 | 0 | 1 |
| pos-v2 | 2 | 0 | 0 | 0 | 1 |
| pp | 4 | 0 | 8 | 0 | 0 |
| qc | 3 | 0 | 8 | 0 | 1 |
| sd | 1 | 1 | 0 | 3 | 2 |
| security | 1 | 0 | 0 | 0 | 1 |
| shared | 0 | 6 | 0 | 0 | 0 |
| wms | 1 | 0 | 4 | 0 | 0 |

**Totals:** 40 aggregates, 15 VOs (6 in shared), 40 domain services, 24 domain events, 26 repo interfaces. **Modules missing aggregates entirely:** `ai`, `communication-center`, `pos` (pos has only a repo I/F).

## 2. Aggregate quality — top 15

Scored 0-10 per dimension out of 60 total. Files at `apps/api/src/modules/<m>/domain/aggregates/`.

| aggregate | rich | invariants | events | encaps | result | clean | **/60** |
|---|--:|--:|--:|--:|--:|--:|--:|
| sd/sales-order (338 LoC) | 9 | 10 | 9 | 9 | 10 | 10 | **57** |
| crm/lead (258 LoC) | 9 | 9 | 9 | 9 | 9 | 10 | **55** |
| crm/deal (156 LoC) | 9 | 10 | 9 | 9 | 10 | 10 | **57** |
| order-workflow/order (114 LoC) | 8 | 9 | 5 | 9 | 10 | 10 | **51** |
| pp/work-center (83 LoC) | 8 | 9 | 9 | 8 | 10 | 10 | **54** |
| core/department (60 LoC) | 8 | 9 | 9 | 7 | 10 | 10 | **53** |
| kanban/kanban-task (125 LoC) | 8 | 8 | 8 | 4 | 9 | 10 | **47** |
| admin/user (184 LoC) | 7 | 7 | 6 | 9 | 6 | 10 | **45** |
| mes/production-session (146 LoC) | 9 | 9 | 8 | 9 | 10 | 10 | **55** |
| mm/purchase-order (144 LoC) | 9 | 10 | 7 | 9 | 10 | 10 | **55** |
| auth/auth-user (141 LoC) | 8 | 7 | 0 | 9 | 4 | 10 | **38** |
| notifications/notification (140 LoC) | 6 | 6 | 5 | 3 | 5 | 10 | **35** |
| hr/employee (169 LoC) | 7 | 5 | 7 | 8 | 6 | 9 | **42** |
| hr/leave-request (99 LoC) | 7 | 8 | 0 | 2 | 0 | 10 | **27** |
| finance/invoice (109 LoC) | 6 | 4 | 6 | 8 | 1 | 10 | **35** |

Average across 15: **45.7/60 (76 %)**.

## 3. Value Object scorecard — 10 samples

Scored 0-10 each (max 50).

| VO | immut | equals | validate | result | self-contained | **/50** |
|---|--:|--:|--:|--:|--:|--:|
| shared/customer-id.vo:18 | 10 | 10 | 10 | 10 | 10 | **50** |
| shared/employee-id.vo:18 | 10 | 10 | 10 | 10 | 10 | **50** |
| shared/product-id.vo:17 | 10 | 10 | 10 | 10 | 10 | **50** |
| shared/email.vo:23 | 10 | 10 | 10 | 10 | 10 | **50** |
| shared/phone-number.vo:23 | 10 | 10 | 10 | 10 | 10 | **50** |
| shared/money.vo:7 | 10 | 0 | 8 | 0 | 9 | **27** |
| crm/ai-score.vo:14 | 10 | 10 | 10 | 10 | 10 | **50** |
| sd/so-status.vo:31 | 10 | 10 | 10 | 10 | 10 | **50** |
| order-workflow/order-status.vo:83 | 10 | 0 | 10 | 10 | 10 | **40** |
| auth/password.vo:18 | 10 | 0 | 8 | 0 | 8 | **26** |

Average: **44/50 (88 %)**.

## 4. Domain services

Sampled 5: `finance/cashflow-forecast`, `finance/depreciation`, `hr/tax-calculator`, `pp/scheduling`, `qc/spc`.

- **Stateless:** yes (all take inputs, return Results).
- **Operates on VOs/aggregates:** mixed — most operate on DTO-style typed records (e.g. `WeeklyForecast`), not on rich aggregates. The `_drift` reconciliation field in `tax-calculator.service.ts:22` is real domain logic.
- **No DB/HTTP imports:** verified clean — grep for `drizzle-orm` / `@shared/db` / `@nestjs/axios` in `**/domain/services/*.service.ts` returns 0 hits. P0-2 stuck.
- **Real business logic:** yes — SPC charts, EOQ, Johnson Rule, depreciation schedules, INPS/JSHD tax brackets are non-trivial.

One concern: `pp/scheduling.service.ts` is a **facade** that only delegates to three sibling services (`SchedulingJohnsonService`, `SchedulingNetworkService`, `SchedulingCapacityService`) — that is orchestration, not business logic. Acceptable as a coordinator.

## 5. Anti-patterns (top 5)

1. **Anemic Domain Model — `mm/material.aggregate.ts:7-27` (27 LoC).** Pure public-field bag with two readonly getters. No `addStock` / `consumeStock` behaviour despite being the obvious owner of stock invariants. Not even an `AggregateRoot` subclass.
2. **Anemic Domain Model — `qc/reclamation.aggregate.ts:18-38` (38 LoC).** All fields `public` (some `readonly`), exactly one method `resolve()`. Throws nothing, validates nothing, no events.
3. **Constructor Telescope / God-flag — `notifications/notification.aggregate.ts:33-91`, `security/security-incident.aggregate.ts:31-78`, `mro/maintenance-order.aggregate.ts:33-97`, `logistics/delivery.aggregate.ts:33-75`.** All four use dual constructor overloads with type-sniffing inside one body (`if (typeof xOrY === 'string')`). This is the classic "constructor as discriminator" smell — a god-flag that mixes two legacy data shapes. Drops encapsulation score and produces ambiguous public fields.
4. **Throw-instead-of-Result violates Rule 1 — `hr/leave-request.aggregate.ts:53,65,83`, `director/approval-request.aggregate.ts:33,45,50`, `pos-v2/transfer-request.aggregate.ts:45,66`.** Aggregates throw `DomainError` instead of returning `Result<T>` as the project's own Rule 1 mandates. The HR audit memo already flagged `LeaveRequest` as anemic — this is **regression evidence** that the sprint did not fix it.
5. **Primitive obsession + public fields — `kanban/kanban-task.aggregate.ts:19-32`, `iot/sensor-device.aggregate.ts:14-25`, `marketing/campaign.aggregate.ts:13-24`, `design/design-order.aggregate.ts:13-26`.** All bare fields are `public`; no `EmployeeId`/`UserId` VO usage even though those VOs exist in `shared/`. `iot/sensor-device.aggregate.ts:56` even contains an `Array.isArray` guard inside the aggregate — domain logic leaking from controllers.

Additional minor: **Money VO has no `equals()`, no `Result` factory, throws raw `DomainError`** (`shared/money.vo:7-25`). Subtract has only `add()`, no `subtract`/`multiply`/`divide` — incomplete.

## 6. Specific findings

- **Best 3 aggregates (file + why):**
  1. `sd/sales-order.aggregate.ts` — private fields, VO-typed constructor, `transitionStatus` with declared state graph (line 281), idempotency-keyed `confirmAdvancePayment` (line 163-202), full `Result<T>` flow.
  2. `crm/deal.aggregate.ts` — strict `markAsWon`/`markAsLost` terminal-state guards (lines 75/95), refuses raw `updateStatus` to terminal states (line 115).
  3. `crm/lead.aggregate.ts` — VO-typed factories (`fromRaw` combines `Email`, `PhoneNumber`, `CustomerId` failures, lines 115-144) and lifecycle `qualify` / `convertToDeal` / `markAsLost`.
- **Worst 3 aggregates:**
  1. `mm/material.aggregate.ts` — anemic, public bag, missing `AggregateRoot`.
  2. `qc/reclamation.aggregate.ts` — anemic, no encapsulation, throws nothing, no events.
  3. `hr/leave-request.aggregate.ts` — public fields, throws `DomainError` (Rule 1 violation), but documented in HR audit memo as "anemic" — confirms HR audit conclusion still holds.
- **Anemic count:** **8** aggregates qualify (`material`, `reclamation`, `leave-request`, `approval-request`, `transfer-request`, `delivery`, `maintenance-order`, `campaign`).
- **Modules with NO aggregates:** `ai`, `communication-center`, `pos` (CRUD-only). Other modules without `domain/` folders entirely: `adaptation`, `agents`, `analytics`, `ecommerce`, `erp`, `fi`, `general`, `org-structure`, `sales`, `sap`, `storage`, `website` — these are pure compatibility/CRUD packages.
- **Domain logic in wrong places:** `hr/employee.aggregate.ts:112-141` performs `calculateGrossSalary`, `calculateInps`, `calculateJshd`, `calculateNetSalary` — but `hr/domain/services/tax-calculator.service.ts` exists and does the same job. Duplication. `iot/sensor-device.aggregate.ts:53-58` carries `calculateOEE` — should be a domain service so the formula isn't tied to one device aggregate.
- **Most well-designed VO:** `shared/customer-id.vo.ts` (private constructor, `Result` factory, type-distinct from EmployeeId/ProductId, equals, fromRaw escape hatch). Tied with `email.vo.ts` for cleanliness.
- **Worst VO violation:** `shared/money.vo.ts` — no `equals()`, `add()` throws `DomainError`, factory `Money.of()` does not return `Result`, missing `subtract`/`multiply`/`compareTo`. For a Money VO this is the *core* DDD example and it falls short.

## 7. Cross-cutting compliance

- **AggregateRoot base** (`shared/domain/aggregate-root.base.ts`): minimal — just `_domainEvents[]` + `addDomainEvent`/`getDomainEvents`. No `apply()` event-sourcing pattern; aggregates emit events but state mutations are imperative. The base accepts `event: DomainEvent | any` (line 9) — the `any` is a typing escape that should be removed.
- **ValueObject base** uses `JSON.stringify` for `equals()` (`value-object.base.ts:11`) — fine for primitives, brittle if a VO ever holds nested objects or differently-ordered keys.
- **Tactical compliance %:** weighted across 40 aggregates and 15 VOs:
  - Aggregates 76 % (top-15 average; long-tail anemics drop it).
  - VOs 88 % (excellent shared layer, Money is the outlier).
  - Domain services 95 % (clean of Drizzle, real logic).
  - **Overall tactical DDD: ~80 %.**

## 8. Verdict on 93/100 claim

- The sprint's claim of 93/100 is **partially overstated** for the tactical dimension. My measurement: **~80/100** for tactical patterns.
- Of 27 modules with aggregates, **roughly 12-13 implement tactical DDD properly** (rich, encapsulated, Result-returning, event-emitting): sd, crm (lead+deal), order-workflow, mes, mm/purchase-order, pp/work-center + production-order, kanban, core/department, admin/user, aisha, finance/invoice (partial), hr/employee (partial), wms/stock. The remaining 14-15 are anemic, dual-constructor, or throw exceptions.
- **Regressions / missed items vs the sprint doc:**
  - `hr/leave-request` still throws instead of returning `Result` — directly contradicts Rule 1.
  - `mm/material` is not even an `AggregateRoot` subclass.
  - `shared/money.vo` missing `equals()` and `Result` factory — should have been part of the 6-VO shared layer fix.
  - Four aggregates still use dual-constructor type-sniffing (`notification`, `security-incident`, `delivery`, `maintenance-order`) — a code-smell the sprint claimed to have cleaned up.
  - `hr/employee.aggregate` and `hr/domain/services/tax-calculator.service` duplicate INPS/JSHD math.
- **Infra discipline is genuinely solid** (P0-2 stuck): 0 Drizzle imports across `domain/**`. That part of the sprint did land.

For tactical DDD, the realistic score is **80/100** — strong foundation, clean shared VOs, clean services, but at least 8 anemic aggregates and one critical anti-pattern (throw-vs-Result) keep it short of 93.
