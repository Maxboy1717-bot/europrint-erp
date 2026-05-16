# DDD Deep Audit — CQRS Dimension

Date: 2026-05-17 (independent, post-sprint `9cf7ae93` + `bedc9a4b`)
Scope: `apps/api/src/modules/**`

## STEP 1 — Infrastructure

- `@nestjs/cqrs ^11.0.3` present in `apps/api/package.json:67`.
- **24 modules import `CqrsModule`** (counted via `Grep -c CqrsModule`): aisha, core, crm, design, director, finance, hr, iot, kanban, lms, logistics, marketing, mes, mm, mro, notifications, order-workflow, pos-v2, pp, qc, sd, security, wms (plus a few re-imports in submodules). 
- Buses are **per-module** (each module imports `CqrsModule` itself; no `CqrsModule.forRoot()` in a global `AppModule` aggregator). This is the NestJS-recommended pattern.
- POS (legacy) and PP/POS subfeatures use `EventEmitter2` only — no `CqrsModule` import.

## STEP 2 — Command handlers

- **94 files** with `@CommandHandler` decorator across 23 modules. Sample 3 graded `handler|decorator|result|aggregate-flow|events`:
  - `crm/.../mark-deal-won.handler.ts:21` — 5/5 (textbook: load → `deal.markAsWon()` → save → `eventBus.publish`).
  - `hr/.../create-leave-request.handler.ts:16` — 4/5 (creates aggregate, but persists raw fields rather than calling `repo.save(aggregate)`; no domain event published).
  - `wms/.../reserve-material.handler.ts:19` — 4/5 (calls aggregate method `stock.reserve()`; no event publish even though "material reserved" is a candidate event).

## STEP 3 — Query handlers

- **76 files / 78 decorators** with `@QueryHandler`. Sample 3:
  - `finance/.../cash-flow.handler.ts:28` — pure read, returns flat DTO, no mutation. PASS.
  - `hr/.../get-employees.handler.ts:13` — paginated read, no mutation. PASS.
  - `notifications/.../get-notifications.handler.ts:14` — paginated read on aggregate; leaks `Notification` aggregate (not a read-DTO). Minor smell.
- `pos-v2/.../get-movement-report.query.ts` packs **3 query handlers** in one file (`GetMovementReportHandler`, `GetEmployeeActivityHandler`, `GetLowStockHandler`). Acceptable but file-naming convention is misleading (`*.query.ts` should be the Query class, not handlers).

## STEP 4 — Command/Query separation reality (5 controllers)

| Controller | Writes via bus | Reads via bus | Service still injected | Verdict |
|---|---|---|---|---|
| `crm-deals.controller.ts:64` | 2/6 (`create`, `markWon`) | 0/2 (uses `dealsService.findAll/findOne`) | `DealsService` | **Parallel paths** |
| `hr-leave.controller.ts:41` | 4/5 (uses bus); `deleteLeave` calls `hrRepo` directly | 2/3 (`getLeaveStats`+`getLeaveById` call `hrRepo`) | repo bypass | **Anti-pattern** |
| `wms-rental.controller.ts:34` | 1/3 (only `receive`); `patchRental`/`deleteRental` call `crudSvc` | `getRentals` returns hard-coded `[]` (Rule 10 violation) | `WmsCrudService` | **Mixed + stub** |
| `crm-deals.controller.ts:131` `markWon` | bus | n/a | yes | OK |
| `notifications.controller.ts` | bus | bus | none | **Clean** |

## STEP 5 — Services in `application/`

After P0-7, only 2 modules still hold `application/services/`:
- `auth/application/commands/` and `admin/application/commands/` are **empty directories** (P0-7 confirmed) — handlers renamed to `auth/application/services/*.service.ts` (8 files) and `admin/application/services/*.service.ts` (6 files). These are correctly **not** registered with `CommandBus` — controllers inject them directly. Acceptable, but the empty `commands/` dirs are dead noise.
- `pos/application/services/*` — **78 services**, none are CQRS handlers. POS is fully non-CQRS — legacy service-bus architecture. `lms/application/services/*` — 8 services. These are NOT anti-patterns per se (out-of-CQRS-scope modules), but POS is the elephant in the room: it dwarfs all other modules combined yet has 0 handlers.
- `pp/application/services/{pp-mps,pp-crp,pp-intelligence}.service.ts` — 3 services co-exist with `pp/application/commands/*.handler.ts`. Smell: read-side logic lives in service AND query handlers (`production-plan.handler.ts`, `get-mrp-report.handler.ts`).

## STEP 6 — Event bus usage

- **24 `*.event.ts` files**; **40 listener/handler files**.
- **`@OnEvent` × 111** vs **`@EventsHandler` × 7** (count by Grep). Confirms **P2-18 deferred** — EventEmitter2 dominates ~16:1.
- 3 listeners sampled:
  - `sd/.../deal-won.listener.ts:17` — `@OnEvent('deal.won')` → fires `commandBus.execute(new CreateOrderCommand(...))`. Correct chaining; but the upstream emit comes from `MarkDealWonHandler` calling `eventBus.publish(DealWonEvent)` — **two bus systems for the same event**. Works because the CRM module ALSO has a bridge (`crm/infrastructure/event-handlers/deal-won.listener.ts:1` uses `@OnEvent`), but the cross-bus contract is implicit.
  - `wms/.../rop-trigger.handler.ts:95` — `@OnEvent(ERP_EVENTS.STOCK_UPDATED)` + raw SQL (no bus chain). Pure side-effect path.
  - `kanban/.../order-created-kanban.handler.ts` — `@EventsHandler`. The 7 nestjs/cqrs handlers cluster in 5 modules (qc, kanban, iot, wms, design).

## STEP 7 — Top-5 anti-patterns

1. **Parallel paths in controllers** — `crm-deals.controller.ts:67,81,145,160,170,189` (DealsService for read/update/delete, bus for create/markWon). Same shape in `hr-leave.controller.ts:84,166–172` (repo direct) and `wms-rental.controller.ts:88,101` (CrudService for patch/delete).
2. **Command handler bypasses aggregate + repo, imports `db` directly** — `pos-v2/.../approve-count.command.ts:9-13,68-73`: `import { db } from '@shared/db'` and `await db.update(stock_items)...` inside the handler body. 9 commands have `from '@shared/db'` imports (Grep glob). Same shape in `wms/.../create-warehouse.handler.ts`, `iot/.../register-device.handler.ts`, `core/.../delete-department.command.ts`, `order-workflow/.../{transition-status,create-order,create-payment-plan}.handler.ts`. Violates Rule 15 (service direct-`db`) extended to handlers.
3. **Dual event mechanisms** — `crm/.../mark-deal-won.handler.ts:47` publishes `DealWonEvent` via `EventBus`, while `sd/.../deal-won.listener.ts:17` consumes via `@OnEvent('deal.won')` (EventEmitter2 string topic). The cross-wire works only because something else re-emits — not auditable from listener code. P2-18 (deferred).
4. **Query handler returns domain aggregate** — `notifications/.../get-notifications.handler.ts:22-47` returns `PaginatedResult<Notification>` (aggregate), not a read DTO. Same in `wms/.../get-warehouses.handler.ts`, `mes/.../get-sessions.handler.ts`.
5. **Empty `commands/` directories after P0-7 rename** — `auth/application/commands/` and `admin/application/commands/` are empty (verified with `ls`). Dead structure; should be deleted.

## STEP 8 — Top-10 CQRS matrix (DDD modules only)

| Module | Cmds | Qrys | CqrsModule | Bus used | Service-bypass | Score/10 |
|---|---:|---:|:---:|:---:|:---:|---:|
| crm | 9 | 3 | yes | yes | DealsService parallel | 7 |
| sd | 6 | 5 | yes | yes | clean | 9 |
| hr | 7 | 7 | yes | yes | hrRepo bypass on reads | 7 |
| finance | 6 | 8 | yes | yes | clean | 9 |
| wms | 4 | 4 | yes | yes | WmsCrudService parallel + stub | 6 |
| pp | 6 | 8 | yes | yes | 3 services co-exist | 7 |
| mm | 5 | 3 | yes | yes | clean | 8 |
| mes | 4 | 4 | yes | yes | clean | 8 |
| qc | 4 | 4 | yes | yes | clean | 8 |
| kanban | 3 | 2 | yes | yes | clean | 9 |
| pos-v2 | 6 | 4 | yes | yes | `db` import in handlers | 6 |
| pos (legacy) | 0 | 0 | no | no | 78 services | 1 |
| order-workflow | 3 | 2 | yes | yes | `db` import in handlers | 6 |

## Verdict

- **CQRS infrastructure**: solid — `@nestjs/cqrs` properly wired in 24 modules.
- **Handler count**: 94 commands + 78 queries = **172 handlers** is real adoption, not paper compliance.
- **Per-module adoption**: 23 of 27 DDD modules (~85%) use CQRS for writes; ~80% for reads.
- **Compliance % (write paths route through CommandBus)**: ~70% — the parallel-path anti-pattern in 6+ controllers materially lowers this.
- **Overall CQRS compliance**: **~75/100**.

### Match against claimed 93/100 (sprint doc says 95)

**Disagree for CQRS dimension only.** The DDD layers score of 95 is plausible (separation of folders, aggregates, repos is real). But the CQRS sub-dimension hides:
- Persistent parallel paths (controller wires both bus AND service to same domain).
- 9 command handlers reaching into `db` directly.
- P2-18 deferred (dual event mechanism) = real not-yet-CQRS.
- POS module (largest module by file count) has zero CQRS adoption.

If CQRS were graded in isolation: **75/100**. The sprint's 95 averages this away.

## Recommendations

1. Delete empty `auth/application/commands/` and `admin/application/commands/` directories.
2. Remove `@shared/db` imports from 9 command handlers; route writes through repositories.
3. Pick one controller class as the rule: bus-only for writes, query-bus for reads. Start with `crm-deals.controller.ts` (5 service callsites → CommandBus + QueryBus).
4. Resume P2-18: migrate at least the cross-module events (`deal.won`, `stock.updated`, `order.status_changed`) from `@OnEvent` to `@EventsHandler`.
5. POS legacy: out of CQRS scope is fine, but mark explicitly in `pos/README.md` so it doesn't drag future grades.
