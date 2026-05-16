# DDD Layers — Execution Plan & Task Breakdown

Date: 2026-05-16
Source audit: `docs/ddd-layers-audit.md`
Branch: `chore/clean-faza-3`
Owner: IT Director (single executor) + parallel agents where safe.

---

## 0. Plan structure

This document is the **complete, ordered task list** for raising EuroPrint backend DDD discipline from **75/100 → 96/100** in three phases:

| Phase | Tasks | Effort estimate | Expected score |
|---|---:|---|---:|
| **P0 — Critical leaks** | 8 | 1 sprint (≈ 5 days) | 75 → 83 |
| **P1 — Discipline & safety** | 8 | 1 sprint (≈ 5 days) | 83 → 91 |
| **P2 — Consistency / consolidation** | 7 | 1 sprint (≈ 5 days) | 91 → 95 |
| **P3 — Polish & long tail** | 7 | 1 sprint (≈ 5 days) | 95 → 96 |
| **Total** | **30** | **4 sprints (20 working days)** | **96 / 100** |

### Each task block contains

- **Title + ID** (`P0-1`, `P0-2`, …)
- **Goal** — what success looks like.
- **Files** — full paths affected.
- **Change pattern** — concrete what-to-do.
- **Acceptance criteria** — measurable checks.
- **Dependencies** — task IDs that must land first.
- **Effort** — S (≤ 2 h), M (≤ 1 day), L (≤ 3 days).
- **Parallel-safe?** — can be dispatched to an agent.

### Sprint rhythm

Per task:
1. Read source file(s) and surrounding context.
2. Apply edits.
3. `pnpm --filter @europrint/api typecheck` — must stay green.
4. `pnpm --filter @europrint/api test` (if a test exists) — must stay green.
5. Run leak detector + `run-all-reviewers.sh` — no new violations.
6. Commit with `fix(ddd):` or `refactor(ddd):` prefix.

Per phase: rebase, smoke-test backend boot (`pnpm --filter @europrint/api run dev:unsafe`), update `docs/sprint-final-report.md`.

---

## P0 — Critical leaks (Sprint 1)

> **Goal:** stop the bleeding — eliminate the worst infrastructure leaks into the domain and the worst rule violations in the presentation layer.

### `P0-1` — Remove `pgTable` from `finance/domain/services/cfo-config.service.ts`

- **Goal:** A domain file MUST NOT declare a Drizzle table.
- **Files:**
  - `apps/api/src/modules/finance/domain/services/cfo-config.service.ts` (lines 8, 14–20)
  - `apps/api/src/shared/db/schema-finance.ts` (or new `schema-cfo-config.ts`)
  - `apps/api/src/modules/finance/domain/repositories/i-finance.repo.ts` (add `cfoConfig` methods)
  - `apps/api/src/modules/finance/infrastructure/repositories/drizzle-finance-cfo-config.repo.ts` (new — implement methods)
- **Change pattern:**
  - Move `pgTable('cfo_config', { … })` declaration → `shared/db/schema-finance.ts`.
  - Export `cfoConfigTable` and re-export from `shared/db/index.ts`.
  - Add `findCfoConfig(orgId)`, `upsertCfoConfig(...)` to `IFinanceRepo`.
  - Implement in Drizzle repo.
  - `CfoConfigService` constructor injects `@Inject(FINANCE_REPO) repo: IFinanceRepo`.
- **Acceptance:** no Drizzle imports in `cfo-config.service.ts`; `domain/` grep `pgTable\|drizzle-orm` → 0 hits in this file.
- **Dependencies:** none.
- **Effort:** M.
- **Parallel-safe:** yes.

### `P0-2` — Strip Drizzle / `@shared/db` from 15 domain services

- **Goal:** domain services compute over input; they don't read/write DB.
- **Files (15):**
  1. `apps/api/src/modules/finance/domain/services/break-even.service.ts`
  2. `…/finance/domain/services/cashflow-forecast.service.ts`
  3. `…/finance/domain/services/financial-ratios.service.ts`
  4. `…/finance/domain/services/standard-cost.service.ts`
  5. `…/finance/domain/services/tiered-pricing.service.ts`
  6. `…/finance/domain/services/variance-analysis.service.ts`
  7. `…/finance/domain/services/cfo-config.service.ts` (covered by P0-1)
  8. `apps/api/src/modules/qc/domain/services/spc.service.ts`
  9. `…/qc/domain/services/spoilage.service.ts`
  10. `…/qc/domain/services/dpmo.service.ts`
  11. `…/qc/domain/services/imposition.service.ts`
  12. `…/qc/domain/services/ink-consumption.service.ts`
  13. `…/qc/domain/services/delta-e.service.ts`
  14. `apps/api/src/modules/pp/domain/services/bom-explosion.service.ts`
  15. `apps/api/src/modules/hr/domain/services/overtime-calculator.service.ts`
  16. `apps/api/src/modules/lms/domain/services/certification.service.ts`
- **Change pattern:**
  - For each service: find every `runQuery(sql\`…\`)` / `db.select()` call.
  - Decide: pure compute (move data fetch upstream) or genuine query (move to repository).
  - Add corresponding method to module's `IXxxRepo` (e.g. `IFinanceRepo.fetchVarianceInputs(periodId): Promise<...>`).
  - Implement in `infrastructure/repositories/`.
  - Service now receives the data as a function argument or via the injected repo interface.
- **Acceptance:**
  - `grep -r "@shared/db\|drizzle-orm" apps/api/src/modules/*/domain/services/` → 0 hits.
  - All previously-failing finance/qc/pp/hr/lms domain tests still pass.
- **Dependencies:** P0-1 (overlapping file).
- **Effort:** L (2.5 days, 15 files).
- **Parallel-safe:** **3 sub-agents** (finance batch, qc batch, pp+hr+lms batch).

### `P0-3` — Move notification senders to infrastructure

- **Goal:** SMS / Telegram / Email senders are infrastructure adapters; domain only holds the **port**.
- **Files (move):**
  - `apps/api/src/modules/notifications/domain/services/sms.service.ts` → `notifications/infrastructure/external/eskiz-sms.adapter.ts`
  - `…/notifications/domain/services/telegram.service.ts` → `notifications/infrastructure/external/telegram.adapter.ts`
  - `…/notifications/domain/services/email-notification.service.ts` → `notifications/infrastructure/external/smtp-email.adapter.ts`
- **Files (new in domain):**
  - `notifications/domain/ports/i-sms-sender.port.ts`
  - `notifications/domain/ports/i-email-sender.port.ts`
  - `notifications/domain/ports/i-telegram-sender.port.ts`
- **Change pattern:**
  - Define each port as `interface IXxxSender { send(input): Promise<Result<void, AppErr>> }`.
  - Concrete adapters implement the port and live in `infrastructure/external/`.
  - DI tokens: `SMS_SENDER`, `EMAIL_SENDER`, `TELEGRAM_SENDER` (Symbols, co-located with port).
  - Update `notifications.module.ts` provider list to bind the symbols to the concrete adapters.
- **Acceptance:**
  - `grep -E "fetch|HttpService|axios" apps/api/src/modules/notifications/domain/` → 0 hits.
  - All consumers of `SmsService` / `TelegramService` / `EmailService` switch to `@Inject(SMS_SENDER)` etc.
- **Dependencies:** none.
- **Effort:** M.
- **Parallel-safe:** yes.

### `P0-4` — Add `@Public()` to `cc-public.controller.ts`

- **Goal:** Public QR-verify endpoints must skip the global JWT guard.
- **Files:**
  - `apps/api/src/modules/communication-center/presentation/cc-public.controller.ts` (line 46)
- **Change pattern:**
  - Add `@Public()` decorator to each public route (or to the controller class).
  - Verify imports: `import { Public } from '@common/decorators/public.decorator'`.
- **Acceptance:**
  - `curl -i http://127.0.0.1:3000/api/cc/verify/<id>` returns 200 / 404 (not 401).
  - Smoke test: scan QR with mobile + verify response.
- **Dependencies:** none.
- **Effort:** S.
- **Parallel-safe:** yes (trivial).

### `P0-5` — Move 13 inline SQL out of `sd-quotations.controller.ts`

- **Goal:** controllers are transport-only (Rule 6).
- **Files:**
  - `apps/api/src/modules/sd/presentation/sd-quotations.controller.ts` (lines 128–296, 13 routes)
  - `apps/api/src/modules/sd/application/services/sd-quotations.service.ts` (new or extend)
  - `apps/api/src/modules/sd/domain/repositories/i-quotation.repo.ts` (new or extend)
  - `apps/api/src/modules/sd/infrastructure/repositories/drizzle-quotation.repo.ts` (new or extend)
- **Change pattern:**
  - For each of `approve` / `send` / `mark-paid` / `cancel` / `sign` / `delete` (and 7 more):
    - Add corresponding method to `IQuotationRepo` (`approve(id)`, `send(id, recipients)`, etc.).
    - Implement with Drizzle query builder.
    - Service method wraps repo call + emits domain event.
    - Controller becomes `(req, res) => unwrapOrThrow(await this.service.approve(id))`.
- **Acceptance:**
  - `wc -l apps/api/src/modules/sd/presentation/sd-quotations.controller.ts` < 150.
  - `grep "runQuery\|sql\`" apps/api/src/modules/sd/presentation/` → 0 hits.
- **Dependencies:** none.
- **Effort:** L (2 days).
- **Parallel-safe:** yes.

### `P0-6` — Migrate raw-SQL application handlers behind repositories

- **Goal:** handlers orchestrate; they don't run SQL.
- **Files (6):**
  - `apps/api/src/modules/sd/application/commands/create-invoice.handler.ts`
  - `…/sd/application/commands/update-order-status.handler.ts`
  - `apps/api/src/modules/kanban/application/event-handlers/order-created-kanban.handler.ts`
  - `…/kanban/application/event-handlers/order-cancelled-kanban.handler.ts`
  - `apps/api/src/modules/finance/application/commands/record-payment.handler.ts`
  - `…/finance/application/commands/check-advance.handler.ts`
- **Change pattern:**
  - Add the relevant repo method (`ISalesOrderRepository.createInvoice(...)`, `IKanbanRepo.createCardForOrder(orderId)`, `IFinanceRepo.recordPayment(...)`).
  - Replace `runQuery(sql\`INSERT…\`)` blocks with `await this.repo.method(...)`.
  - Return `Result<T>` instead of throwing.
- **Acceptance:**
  - `grep -l "runQuery\|@shared/db" apps/api/src/modules/*/application/commands/*.handler.ts apps/api/src/modules/*/application/event-handlers/*.handler.ts` → 0 for these 6.
- **Dependencies:** none.
- **Effort:** M.
- **Parallel-safe:** yes.

### `P0-7` — Decorate or rename 12 admin/auth handlers

- **Goal:** files in `application/commands/` and `application/queries/` either register on the CQRS bus or stop pretending.
- **Files:**
  - 4 handlers in `apps/api/src/modules/admin/application/{commands,queries}/`
  - 6 handlers in `apps/api/src/modules/auth/application/{commands,queries}/`
  - 2 others (locate via `grep -L "@CommandHandler\|@QueryHandler" apps/api/src/modules/*/application/{commands,queries}/*.handler.ts`)
- **Change pattern:**
  - **Decide per file:** does it implement a real `ICommandHandler<TCommand>` or is it a service?
  - If handler → add `@CommandHandler(XxxCommand)` + register in module's `providers`.
  - If service → rename file to `*.service.ts`, drop `ICommandHandler` interface, move to `application/services/`.
- **Acceptance:**
  - `grep -L "@CommandHandler\|@QueryHandler\|@EventsHandler" apps/api/src/modules/*/application/{commands,queries,event-handlers}/*.handler.ts` → 0 results.
- **Dependencies:** none.
- **Effort:** M.
- **Parallel-safe:** yes.

### `P0-8` — Fix `USER_REPO` token collision

- **Goal:** one token per repository.
- **Files:**
  - `apps/api/src/modules/admin/domain/repositories/i-user.repo.ts` (line 35) — `Symbol('IUserRepo')`
  - `apps/api/src/modules/admin/admin.tokens.ts` (line 6) — `'USER_REPO'` string
- **Change pattern:**
  - Keep the Symbol in `i-user.repo.ts` (canonical).
  - Delete the string literal in `admin.tokens.ts`; re-export the Symbol from there if downstream relies on `admin.tokens.ts` path.
  - Update every `@Inject('USER_REPO')` → `@Inject(USER_REPO)`.
- **Acceptance:**
  - `grep -r "'USER_REPO'" apps/api/src/` → 0 hits.
  - Backend boots and `auth/login` still works.
- **Dependencies:** none.
- **Effort:** S.
- **Parallel-safe:** yes.

---

## P1 — Discipline & safety (Sprint 2)

### `P1-9` — Replace `throw *Exception` with `Err(AppErr)` in 7 handlers

- **Files:**
  - `apps/api/src/modules/sd/application/commands/create-invoice.handler.ts` (lines 39, 40, 42)
  - `…/sd/application/commands/update-order-status.handler.ts` (lines 49, 57, 71, 77)
  - `…/sd/application/commands/confirm-advance-payment.handler.ts`
  - `apps/api/src/modules/mes/application/commands/start-session.handler.ts` (line 58)
  - `apps/api/src/modules/finance/application/queries/get-invoices.handler.ts`
  - `…/finance/application/queries/get-payments.handler.ts`
  - `…/finance/application/queries/get-gl-entries.handler.ts`
- **Change pattern:**
  - `throw new BadRequestException('x')` → `return Err(AppErr('BAD_REQUEST', 'x'))`.
  - `throw new ForbiddenException('y')` → `return Err(AppErr('FORBIDDEN', 'y'))`.
  - `throw new NotFoundException('z')` → `return Err(AppErr('NOT_FOUND', 'z'))`.
  - Controller uses `unwrapOrThrow(res)` which already maps error codes to HTTP statuses.
- **Acceptance:** `grep "throw new.*Exception" apps/api/src/modules/*/application/**/*.handler.ts` → 0 hits.
- **Dependencies:** P0-6 (some overlap with `sd/create-invoice`).
- **Effort:** S.
- **Parallel-safe:** yes.

### `P1-10` — Wrap multi-write commands in `db.transaction(...)`

- **Files (5):**
  - `apps/api/src/modules/sd/application/commands/create-invoice.handler.ts`
  - `apps/api/src/modules/wms/application/commands/goods-issue.handler.ts`
  - `apps/api/src/modules/mm/application/commands/goods-receipt.handler.ts`
  - `apps/api/src/modules/mes/application/commands/complete-session.handler.ts`
  - `apps/api/src/modules/qc/application/commands/submit-inspection.handler.ts`
- **Change pattern:**
  - Wrap repo calls in `await db.transaction(async (tx) => { … })`.
  - Pass `tx` into repo methods (extend repo signatures: `save(entity, tx?: DbTx): Promise<...>`).
  - Or use a `UnitOfWork` helper if it exists; otherwise introduce one in `shared/db/unit-of-work.ts`.
- **Acceptance:** each handler shows exactly one `db.transaction` block enclosing all writes; rollback test passes (kill DB mid-handler → no partial data).
- **Dependencies:** P0-6.
- **Effort:** M.
- **Parallel-safe:** yes (different modules).

### `P1-11` — Pick one aggregate base; migrate 11 aggregates

- **Goal:** drop `@nestjs/cqrs AggregateRoot` from `domain/`; keep `shared/domain/aggregate-root.base.ts` only.
- **Files (11):**
  - `apps/api/src/modules/mes/domain/aggregates/production-session.aggregate.ts`
  - `…/wms/domain/aggregates/stock-movement.aggregate.ts`
  - `…/marketing/domain/aggregates/campaign.aggregate.ts`
  - `…/notifications/domain/aggregates/notification.aggregate.ts`
  - `…/logistics/domain/aggregates/delivery.aggregate.ts`
  - `…/qc/domain/aggregates/inspection.aggregate.ts`
  - `…/pp/domain/aggregates/routing.aggregate.ts`
  - `…/pp/domain/aggregates/production-order.aggregate.ts`
  - `…/pp/domain/aggregates/bom.aggregate.ts`
  - `…/mm/domain/aggregates/purchase-order.aggregate.ts`
  - `…/security/domain/aggregates/security-incident.aggregate.ts`
  - `…/iot/domain/aggregates/sensor-device.aggregate.ts`
  - `…/mro/domain/aggregates/maintenance-order.aggregate.ts`
  - `…/kanban/domain/aggregates/kanban-task.aggregate.ts`
  - `…/design/domain/aggregates/design-order.aggregate.ts`
- **Change pattern:**
  - Replace `extends AggregateRoot from '@nestjs/cqrs'` → `extends AggregateRoot from '@shared/domain/aggregate-root.base'`.
  - Replace `this.apply(event)` → `this.addDomainEvent(event)`.
  - Publish events in handlers: `aggregate.pullDomainEvents().forEach(e => this.eventBus.publish(e))`.
- **Acceptance:** `grep "from '@nestjs/cqrs'" apps/api/src/modules/*/domain/` → 0 hits.
- **Dependencies:** none.
- **Effort:** L (1.5 days).
- **Parallel-safe:** **3 sub-agents** (pp/mm/mes/qc, marketing/notifications/logistics/security, iot/mro/kanban/design).

### `P1-12` — Move bcrypt out of `password.vo.ts`

- **Files:**
  - `apps/api/src/modules/auth/domain/value-objects/password.vo.ts` (remove bcrypt)
  - `apps/api/src/modules/auth/domain/ports/i-password-hasher.port.ts` (new)
  - `apps/api/src/modules/auth/infrastructure/security/bcrypt-password-hasher.ts` (new)
- **Change pattern:**
  - `PasswordVo` becomes `HashedPassword(hash: string)` — pure VO, no `compare`.
  - `IPasswordHasher` defines `hash(plain: string): Promise<string>`, `verify(plain: string, hashed: string): Promise<boolean>`.
  - Concrete `BcryptPasswordHasher` implements with `bcrypt`. Bind in `auth.module.ts`.
  - Login handler uses `IPasswordHasher.verify(...)` injected by token.
- **Acceptance:** `grep "bcrypt" apps/api/src/modules/auth/domain/` → 0 hits.
- **Dependencies:** none.
- **Effort:** S.
- **Parallel-safe:** yes.

### `P1-13` — Replace `InternalServerErrorException` in 7 domain files

- **Files:**
  - `apps/api/src/shared/domain/value-objects/money.vo.ts`
  - `…/shared/domain/result.ts`
  - `apps/api/src/modules/finance/domain/aggregates/budget.aggregate.ts`
  - `…/director/domain/aggregates/approval-request.aggregate.ts`
  - `…/hr/domain/aggregates/leave-request.aggregate.ts`
  - `…/admin/domain/entities/system-settings.entity.ts`
  - `…/pos-v2/domain/aggregates/inventory-count.aggregate.ts`
  - `…/pos-v2/domain/aggregates/transfer-request.aggregate.ts`
- **Change pattern:**
  - Introduce `shared/domain/errors/domain-error.ts` — class with `code: string`, `message: string`.
  - Replace `throw new InternalServerErrorException('x')` → `return Result.Err(new DomainError('SOMETHING_INVALID', 'x'))` (or throw `DomainError` if caller can't change shape).
- **Acceptance:** `grep "InternalServerErrorException\|BadRequestException\|NotFoundException" apps/api/src/modules/*/domain/ apps/api/src/shared/domain/` → 0 hits.
- **Dependencies:** none.
- **Effort:** M.
- **Parallel-safe:** yes.

### `P1-14` — Replace `as Result<unknown>` cast with `unwrapOrThrow(res)`

- **Files:**
  - `apps/api/src/modules/crm/presentation/crm-leads-ops.controller.ts` (lines 49, 61, 78, 88)
- **Change pattern:**
  - Replace:
    ```ts
    const r = (await this.commandBus.execute(new UpdateLeadCommand(...))) as Result<unknown>;
    if (isErr(r)) throw new Error(...);
    ```
  - With:
    ```ts
    const r = await this.commandBus.execute<UpdateLeadCommand, Result<Lead, AppErr>>(new UpdateLeadCommand(...));
    return unwrapOrThrow(r);
    ```
  - Or type the return of `commandBus.execute<TCommand, TReturn>` explicitly so no cast is needed.
- **Acceptance:** `grep "as Result<unknown>" apps/api/src/` → 0 hits.
- **Dependencies:** P0-6.
- **Effort:** S.
- **Parallel-safe:** yes.

### `P1-15` — Migrate 24 controllers from bare Uzbek strings to `i18n.t()`

- **Files (24):**
  - `apps/api/src/modules/agents/agents.controller.ts` (lines 132, 140)
  - `…/sd/presentation/sd-customers.controller.ts` (lines 96, 127, 200, 222)
  - `…/sd/presentation/sd-quotations.controller.ts` (lines 133, 145, 169)
  - `…/wms/presentation/wms-stock.controller.ts` (line 86)
  - `…/wms/presentation/wms-integration.controller.ts` (line 50)
  - `…/compatibility/document-workflow-v2.controller.ts` (lines 60–62)
  - `…/pos/controllers/pos-warehouse-integration.controller.ts` (lines 77–79)
  - `…/communication-center/presentation/cc-webhook.controller.ts` (lines 51–88)
  - `…/finance/presentation/finance-break-even.controller.ts` (line 38)
  - `…/finance/presentation/finance-variance.controller.ts` (line 27)
  - `…/finance/presentation/finance-standard-cost.controller.ts` (line 36)
  - `…/admin/presentation/resources.controller.ts` (line 170)
  - `…/crm/presentation/crm-deals.controller.ts` (line 91) — English string
  - `…/aisha/presentation/voice.controller.ts` (line 34) — English string
  - `…/aisha/presentation/wake-config.controller.ts` (line 45)
  - + 9 more (`grep -E "throw new (BadRequest|NotFound|Forbidden)Exception\(['\"][А-Яа-яЎўҚқҒғҲҳ]" apps/api/src/`)
- **Change pattern:**
  - Inject `private readonly i18n: I18nService<I18nTranslations>` in controller.
  - Add missing keys to `apps/api/src/i18n/{uz,ru}/errors.json`.
  - `throw new BadRequestException(await this.i18n.t('errors.invalidPayload'))`.
- **Acceptance:** `grep -P "throw new .*Exception\(['\"][А-Яа-яЎўҚқҒғҲҳ]" apps/api/src/` → 0 hits.
- **Dependencies:** P0-5 (sd-quotations overlap).
- **Effort:** M.
- **Parallel-safe:** **2 sub-agents** (sd/finance/wms batch; agents/aisha/cc/admin/compatibility batch).

### `P1-16` — Add Zod schema to 73 controllers using `@Body() body: Record<string, unknown>`

- **Files:** discover with
  ```bash
  grep -rln "@Body() body: Record<string, unknown>" apps/api/src/modules/*/presentation/
  ```
- **Change pattern:**
  - For each controller method:
    - Find the actual request shape from frontend or existing DTO.
    - Write a Zod schema in `apps/api/src/modules/<m>/presentation/validation/<route>.schema.ts`.
    - Create DTO with `createZodDto(schema)` and replace `Record<string, unknown>` with the typed DTO.
- **Acceptance:** `grep "Record<string, unknown>" apps/api/src/modules/*/presentation/` → 0 hits.
- **Dependencies:** none.
- **Effort:** L (2.5 days).
- **Parallel-safe:** **4 sub-agents**, batched by module.

---

## P2 — Consistency / consolidation (Sprint 3)

### `P2-17` — Promote `pos/controllers/` (21 files) to DDD layout

- **Files:** `apps/api/src/modules/pos/controllers/*.controller.ts` (21 files).
- **Change pattern:**
  - Create `pos/{domain,application,infrastructure,presentation}/` folders.
  - Move each controller to `presentation/`.
  - Identify the use-cases and split logic into application handlers.
  - Pull POS aggregates (`PosTransaction`, `PosShift`, `PosReceipt`) into `domain/aggregates/`.
- **Acceptance:** `ls apps/api/src/modules/pos/controllers/` returns nothing; `presentation/` is the new home.
- **Dependencies:** none.
- **Effort:** L (3 days).
- **Parallel-safe:** no (cross-cutting refactor).

### `P2-18` — Pick one event mechanism (EventEmitter2 vs `@nestjs/cqrs EventBus`)

- **Decision:** standardise on `@nestjs/cqrs EventBus` (already used by 8 modules).
- **Files (modules using EventEmitter2):** `order-workflow`, `director`.
- **Change pattern:**
  - Replace `this.events.emit('order.created', payload)` with `await this.eventBus.publish(new OrderCreatedEvent(payload))`.
  - Replace `@OnEvent('order.created')` with `@EventsHandler(OrderCreatedEvent)`.
  - Aggregates use `.apply(event)` (new convention); handler calls `aggregate.commit()` at end.
- **Acceptance:** `grep "EventEmitter2\|@OnEvent" apps/api/src/modules/` → 0 hits.
- **Dependencies:** P1-11.
- **Effort:** M.
- **Parallel-safe:** yes (per module).

### `P2-19` — Consolidate dual `Result<T>` implementations

- **Files:**
  - **Delete:** `apps/api/src/shared/domain/result.ts` (legacy class).
  - **Keep:** `apps/api/src/common/result/result.ts` (discriminated union — canonical).
  - **Migrate consumers:** `Invoice`, `Employee`, `Attendance` aggregates + their handlers.
- **Change pattern:**
  - Replace `Result.success(x)` → `Ok(x)`; `Result.fail(e)` → `Err(e)`.
  - Replace `.isSuccess` → `isOk(...)`; `.getValue()` → `(r as Ok).value`.
- **Acceptance:** `grep "from '.*shared/domain/result'" apps/api/src/` → 0 hits.
- **Dependencies:** P1-11.
- **Effort:** M.
- **Parallel-safe:** yes.

### `P2-20` — Convert 49 string-literal DI tokens to `Symbol()`

- **Files:** discover with
  ```bash
  grep -rn "@Inject(['\"]" apps/api/src/modules/*/application/ apps/api/src/modules/*/presentation/
  ```
- **Change pattern:**
  - For each module: define `export const XXX_REPO = Symbol('XXX_REPO')` next to the interface in `domain/repositories/i-xxx.repo.ts`.
  - Replace every `@Inject('XXX_REPO')` with `@Inject(XXX_REPO)`.
  - Module provider: `{ provide: XXX_REPO, useClass: DrizzleXxxRepository }`.
- **Acceptance:** `grep "@Inject(['\"]" apps/api/src/modules/` → 0 hits.
- **Dependencies:** P0-8.
- **Effort:** M.
- **Parallel-safe:** yes (per module).

### `P2-21` — Introduce identity VOs

- **VOs to add (shared):**
  - `apps/api/src/shared/domain/value-objects/customer-id.vo.ts`
  - `…/value-objects/employee-id.vo.ts`
  - `…/value-objects/product-id.vo.ts`
  - `…/value-objects/email.vo.ts`
  - `…/value-objects/phone-number.vo.ts`
- **Change pattern:**
  - Each: `class XId extends ValueObject<{ value: number }>` with `XId.create(raw)` factory returning `Result<XId, AppErr>`.
  - Migrate CRM/SD/HR aggregates to accept VOs not primitives in factory methods.
  - Mappers convert DB row int → `XId.create(row.id).unwrap()`.
- **Acceptance:** at least 3 aggregates accept identity VOs in their factory methods; primitive `customerId: number` in those aggregates reduced.
- **Dependencies:** none.
- **Effort:** L (2 days).
- **Parallel-safe:** yes.

### `P2-22` — Enrich 8 anemic aggregates with behaviour

- **Files (8):**
  - `apps/api/src/modules/admin/domain/aggregates/user.aggregate.ts` — add `User.deactivate(by, reason)`, `User.promoteTo(role)`, emit events.
  - `…/kanban/domain/aggregates/kanban-task.aggregate.ts` — add transition rules, raise `KanbanTaskMovedEvent`.
  - `…/iot/domain/aggregates/sensor-reading.aggregate.ts` — add invariants (anomaly threshold).
  - `…/notifications/domain/aggregates/notification.aggregate.ts` — add `markAsRead`, `expire`.
  - `…/core/domain/aggregates/department.aggregate.ts` — emit creation events.
  - `…/core/domain/aggregates/panel.aggregate.ts` — emit creation events.
  - `…/core/domain/aggregates/position.aggregate.ts` — emit creation events.
  - `…/pp/domain/aggregates/work-center.aggregate.ts` — add capacity invariants.
- **Acceptance:** each aggregate has ≥ 2 invariant-enforcing methods; each emits ≥ 1 named event.
- **Dependencies:** P1-11.
- **Effort:** M.
- **Parallel-safe:** yes.

### `P2-23` — Add domain ports + retry for external adapters

- **Ports to add (4):**
  - `apps/api/src/modules/aisha/domain/ports/i-claude-port.ts`
  - `…/aisha/domain/ports/i-gemini-port.ts`
  - `apps/api/src/modules/notifications/domain/ports/i-telegram-port.ts` (covered by P0-3)
  - `…/notifications/domain/ports/i-sms-port.ts` (covered by P0-3)
- **Infrastructure adapters:** wrap each with `p-retry` (3 tries, exponential backoff, 30 s timeout).
- **Acceptance:** each external call surfaces `Result<T, AppErr>` with `EXTERNAL_TIMEOUT` / `EXTERNAL_5XX` codes; retry visible in logs.
- **Dependencies:** P0-3.
- **Effort:** M.
- **Parallel-safe:** yes.

---

## P3 — Polish & long tail (Sprint 4)

### `P3-24` — Swagger `@ApiOperation` / `@ApiResponse` on 263 controllers

- **Files:** all controllers without per-route docs.
- **Change pattern:** add minimal `@ApiOperation({ summary: '...' })` and `@ApiResponse({ status: 200, type: XDto })` to every public method.
- **Acceptance:** Swagger UI shows route description and example payload for every endpoint.
- **Dependencies:** none.
- **Effort:** L (3 days).
- **Parallel-safe:** **4 sub-agents**, batched by module group.

### `P3-25` — Resolve intra-file route duplicates in LMS

- **Files:**
  - `apps/api/src/modules/lms/presentation/lms-questionnaire.controller.ts` — `DELETE /lms/questionnaire/:id` ×2.
  - `…/lms-attempts.controller.ts` — `POST /lms/attempts/:id/submit` ×2.
  - `…/lms-lessons.controller.ts` — `GET /lms/lessons/:id` ×2.
- **Change pattern:** rename one to `:id/v2` or merge into a single handler with discriminator query param.
- **Acceptance:** Fastify boot has no warning; only one handler per METHOD+PATH.
- **Dependencies:** none.
- **Effort:** S.
- **Parallel-safe:** yes.

### `P3-26` — Replace 50 stub returns

- **Files (23 controllers):** `hr-dashboard-stubs.controller.ts`, `marketing-analytics-stubs.controller.ts`, `pos-stub.controller.ts`, …
- **Change pattern:**
  - For each stub method:
    - If the frontend page is shipped → wire to real service/query.
    - If the page is a placeholder → return a feature-flag-aware 503 with `Retry-After`, or remove the route and let frontend show empty-state.
- **Acceptance:** `grep "items: \[\], total: 0\|return {}\|return { ok: true }" apps/api/src/modules/*/presentation/` → 0 hits in non-stub controllers.
- **Dependencies:** none.
- **Effort:** L.
- **Parallel-safe:** yes.

### `P3-27` — Move 13 `pgTable` from `infrastructure/` to `shared/db/schema-*.ts`

- **Files:**
  - `apps/api/src/modules/admin/infrastructure/repositories/admin-extra.repo.ts:21-47`
  - `…/ai/infrastructure/db/ai-usage-logs.table.ts`
  - `…/pos-v2/infrastructure/.../drizzle-pos-v2-request.repo.ts`
  - + 10 more (find via `grep -rn "pgTable(" apps/api/src/modules/*/infrastructure/`)
- **Acceptance:** `grep -rn "pgTable(" apps/api/src/modules/` → 0 hits.
- **Dependencies:** P0-1 (cfo_config table consolidation pattern).
- **Effort:** M.
- **Parallel-safe:** yes.

### `P3-28` — Named Throttle profiles

- **Files:** every controller using `@Throttle({ default: { limit: 100, ttl: 60_000 } })`.
- **Change pattern:**
  - Create `apps/api/src/common/decorators/throttle-profiles.ts` exporting `@ApiThrottle()`, `@AuthThrottle()`, `@PublicThrottle()`.
  - Replace inline literals.
- **Acceptance:** `grep -c "Throttle({" apps/api/src/modules/` drops from ~80 to <5.
- **Dependencies:** none.
- **Effort:** S.
- **Parallel-safe:** yes.

### `P3-29` — Fix `pos-v2` N+1

- **Files:** `apps/api/src/modules/pos-v2/infrastructure/repositories/drizzle-pos-v2.repo.ts` (lines 87–92).
- **Change pattern:**
  - Replace the `Promise.all(countsRows.map(async c => db.select().from(inventoryCountLines).where(eq(..., c.id))))` with a single `inArray(inventoryCountLines.countId, countsRows.map(c => c.id))` query.
  - Group rows in memory by `countId`.
- **Acceptance:** EXPLAIN ANALYZE shows 1 SQL call instead of N; load test shows constant query count.
- **Dependencies:** none.
- **Effort:** S.
- **Parallel-safe:** yes.

### `P3-30` — Replace 449 `runQuery(sql\`…\`)` with Drizzle query builder

- **Files:** 43 repository files.
- **Change pattern:**
  - For each `runQuery(sql\`SELECT/INSERT/UPDATE/DELETE …\`)`:
    - If translatable to Drizzle query builder → replace.
    - If genuinely complex (LATERAL, CTE, conditional WHERE built at runtime) → keep but ensure the `NOTE` block above explains why.
- **Acceptance:** `grep -c "runQuery(sql\`" apps/api/src/modules/*/infrastructure/repositories/` total drops from ~449 to ≤ 80 (genuinely complex cases).
- **Dependencies:** none.
- **Effort:** L (3 days).
- **Parallel-safe:** **4 sub-agents**, batched by module group.

---

## FINAL — Verification cadence

After each phase:

1. `pnpm --filter @europrint/api typecheck` — 0 errors.
2. `pnpm --filter @europrint/api test` — all green.
3. `pnpm --filter @europrint/api run dev:unsafe` — backend boots successfully.
4. `bash run-all-reviewers.sh` — track delta vs baseline.
5. `node scripts/i18n-leak-detector.mjs --mode=static` — still 0.
6. Update `docs/sprint-final-report.md` with the new score.
7. Commit each task as its own atomic commit: `fix(ddd/<module>): <task-id> <one-liner>`.
8. Push branch; tag the phase release: `ddd-phase-0`, `ddd-phase-1`, etc.

---

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Repo signature changes break callers | High | M | One repo at a time; typecheck after each. |
| `db.transaction(...)` changes ripple to all callers | M | M | Add `tx?: DbTx` optional param to repo methods; default to `db`. |
| Migration of 11 aggregates to in-house base breaks event subscribers | M | H | Migrate one aggregate + its handlers + tests at a time; staging smoke. |
| Removal of legacy `Result<T>` breaks Invoice/Employee/Attendance | L | M | Run full test suite + manual finance/hr smoke. |
| Frontend depends on stub-controller shapes | M | L | Coordinate with frontend before P3-26; mark each stub removal in commit body. |

---

## Parallel-agent dispatch plan

Tasks safe to dispatch **in parallel** (no shared file) within the same sprint:

**Sprint 1 (P0):**
- Agent A: P0-1, P0-2 (finance batch)
- Agent B: P0-2 (qc batch)
- Agent C: P0-2 (pp+hr+lms batch), P0-3 (notifications)
- Agent D: P0-4, P0-7, P0-8 (small/quick fixes)
- Solo: P0-5 (sd-quotations refactor, single file, sequential)
- Solo: P0-6 (raw-SQL handler migrations, sequential)

**Sprint 2 (P1):**
- Agent A: P1-9, P1-13 (exception → Result)
- Agent B: P1-10 (transactions)
- Agent C: P1-11 (aggregate base migration — 3 sub-batches itself)
- Agent D: P1-15 (i18n migration — 2 sub-batches)
- Solo: P1-12, P1-14
- Solo: P1-16 (Zod schemas — 4 sub-batches by module group)

**Sprint 3 (P2):** mostly sequential; P2-22 + P2-21 parallel.

**Sprint 4 (P3):** P3-24, P3-30 parallel (4 batches each).

---

## Definition of Done (DDD Audit)

- **Score ≥ 96 / 100** on `docs/ddd-layers-audit.md` rubric.
- `run-all-reviewers.sh` passes 20+ rules out of 22.
- 0 raw `db.execute(sql\`…\`)` outside the documented `admin-extra.repo.ts` exception.
- 0 Drizzle imports in any `domain/` folder.
- 100% of canonical repos behind interfaces with Symbol tokens.
- 100% of CQRS-named handlers actually registered on the bus.
- 100% of controllers transport-only (no `runQuery`/`sql\`` calls).
- Backend boots and serves `/api/aisha/chat` end-to-end with the AIsha tool round-trip.
