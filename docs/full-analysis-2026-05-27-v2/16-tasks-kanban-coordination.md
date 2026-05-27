# Report 16 — Tasks / Kanban Coordination

**Date:** 2026-05-27 (second-pass)
**Scope:** `apps/api/src/modules/kanban/`, `apps/api/src/cron/kanban-recurring.cron.ts`,
`apps/api/src/modules/notifications/infrastructure/event-handlers/orphan-events.listener.ts`,
`apps/api/src/modules/sd/domain/events/order-cancelled.event.ts`,
`apps/api/src/shared/db/schema-kanban.ts`,
`artifacts/erp-dashboard/src/pages/KanbanBoard.tsx`,
`artifacts/erp-dashboard/src/hooks/useKanbanBoard*.ts`.

Round-1 source: `docs/full-analysis-2026-05-27/16-tasks-kanban-coordination.md`.

---

## Diff vs round 1

Round 1 made three claims that no longer match the source code. The codebase has moved on:

| # | Round-1 claim | Verified status | Evidence |
|---|---|---|---|
| 1 | `OrderCancelledEvent` is **defined locally** inside `order-cancelled-kanban.handler.ts` (class identity mismatch with SD) | **FALSE today.** Handler now imports the canonical SD class. There is a single class definition. | `apps/api/src/modules/kanban/application/event-handlers/order-cancelled-kanban.handler.ts:13` imports `OrderCancelledEvent from '../../../sd/domain/events/order-cancelled.event'`. Only one `class OrderCancelledEvent` in the repo: `apps/api/src/modules/sd/domain/events/order-cancelled.event.ts:12`. |
| 2 | Five orphan event emits — `kanban.task.created/.moved/.assigned/.deleted/notifications.create` — have **no listeners** | **FALSE today.** All five are subscribed by `OrphanEventsListener` in the notifications module. | `apps/api/src/modules/notifications/infrastructure/event-handlers/orphan-events.listener.ts:64,84,92,100,108` — `@OnEvent` decorators for all five strings. |
| 3 | `KanbanController` (`@Controller('kanban')` with `@Get()`/`@Get(':id')`) **collides** with `KanbanBoardsController` (`@Controller('kanban')` with `@Get('boards')`, …) | **FALSE.** No route collision: `KanbanController` registers `GET /kanban` and `GET /kanban/:id`; `KanbanBoardsController` registers `GET /kanban/boards`, `GET /kanban/employees`, etc. The path `:id` parameter is matched after the literal `boards` / `employees` / `notifications` / `templates` routes by NestJS path ordering, but practically `:id` would shadow any new literal segment registered later. Today there is no shadowing for any extant route. | `apps/api/src/modules/kanban/presentation/kanban.controller.ts:45,57,80`; `…/kanban-boards.controller.ts:42,51,145,161`. |

Three round-1 findings are **still accurate**:

- WIP limits remain pure in-memory state on `KanbanService` — no DB table, no Redis (`kanban.service.ts:32`).
- Extended `kanban_cards` columns (`recurrence_pattern`, `recurrence_end_date`, `completed_at`, `owner_user_id`, `estimated_time`, `parent_card_id`, `accepted_at`, `accepted_by_id`, `completion_report`) and `kanban_boards.department_id` are added by raw SQL migration `kanban-extended-tables.sql` but **not declared** in Drizzle `schema-kanban.ts`.
- `KanbanRecurringCron` operates entirely on those undeclared columns via `runQuery(sql\`…\`)`.

New issues this pass surfaces:

- **No producer publishes `OrderCancelledEvent`** anywhere in `apps/api/src/`. The single handler is dead code in production — only exercised by unit tests. Grep for `new OrderCancelledEvent(` returns only the spec file (4 hits). `orders.service.cancel()` and `sd-quotations.service.cancelOrder()` mutate DB but never `this.eventBus.publish(new OrderCancelledEvent(...))`.
- `TaskCreatedEvent` (CQRS) is published from `CreateTaskHandler` (`create-task.handler.ts:39`) but **no `@EventsHandler(TaskCreatedEvent)` exists** — neither in kanban nor any consumer module. Same for `TaskMovedEvent`, `TaskAssignedEvent`, `KanbanTaskMovedEvent`, `KanbanTaskAssignedEvent`, `KanbanTaskCompletedEvent` (all declared in `domain/events/index.ts`, only the last three are added to aggregates as domain events, none are dispatched out of the aggregate to a real handler).
- `KanbanController` (line 35-39) declares a local Uzbek-specific `enum Role { SUPER_ADMIN, DIRECTOR, SALES_MANAGER, WAREHOUSE_MANAGER }` while `KanbanBoardsController` uses string-literal roles `'admin', 'manager', 'supervisor', 'operator', 'employee', 'viewer', 'director'`. The two controllers therefore enforce **different role sets on the same `/kanban` mount**.
- `KanbanService.setWipLimit()` exists (line 140) but is **not exposed** via any HTTP controller — only callable from inside the API process.

---

## 1. Module structure & CQRS

`apps/api/src/modules/kanban/kanban.module.ts` lists the slice contents (47 files total under `modules/kanban/`).

```
modules/kanban/
├── kanban.module.ts                                  module wiring
├── application/
│   ├── kanban.service.ts                             facade (CQRS dispatcher)
│   ├── kanban-boards.service.ts                      board/column/card CRUD
│   ├── kanban-ext.service.ts                         extended ops
│   ├── kanban-ext-flow.service.ts
│   ├── kanban-ext-card.service.ts
│   ├── kanban-robot.service.ts
│   ├── commands/
│   │   ├── create-task.command.ts  + .handler.ts
│   │   ├── update-task.command.ts  + .handler.ts
│   │   └── delete-task.command.ts  + .handler.ts
│   ├── queries/
│   │   ├── get-tasks.query.ts      + .handler.ts
│   │   └── get-task.query.ts       + .handler.ts
│   └── event-handlers/
│       ├── order-created-kanban.handler.ts           @EventsHandler(OrderCreatedEvent)
│       └── order-cancelled-kanban.handler.ts         @EventsHandler(OrderCancelledEvent)
├── domain/
│   ├── aggregates/kanban-task.aggregate.ts
│   ├── enums/task-status.enum.ts
│   ├── events/index.ts                                6 event classes
│   └── repositories/
│       ├── i-kanban.repo.ts
│       └── i-kanban-boards.repo.ts
├── infrastructure/
│   ├── kanban.repository.ts
│   ├── kanban-tables.ts                               re-export shim
│   ├── repositories/
│   │   ├── drizzle-kanban.repo.ts
│   │   ├── drizzle-kanban-core.repo.ts
│   │   ├── drizzle-kanban-cards.repo.ts
│   │   ├── drizzle-kanban-flows-robots.repo.ts
│   │   ├── drizzle-kanban-engagement.repo.ts (+ -base, -time-tags)
│   │   ├── drizzle-kanban-analytics.repo.ts
│   │   ├── drizzle-kanban-results-files.repo.ts
│   │   ├── drizzle-kanban-stats.repo.ts
│   │   ├── drizzle-kanban-ext.repo.ts
│   │   ├── kanban-boards.repo.ts
│   │   ├── kanban-columns.repo.ts
│   │   └── kanban-cards.repo.ts
│   └── seed/kanban-templates.seed.ts                  4 default templates
├── dto/kanban.dto.ts                                  Zod schemas
└── presentation/
    ├── kanban.controller.ts                           /kanban (CQRS, internal Role enum)
    ├── kanban-boards.controller.ts                    /kanban (boards/columns/cards/employees/notifications/templates)
    ├── kanban-core.controller.ts                      /kanban (flows/robots)
    ├── kanban-cards.controller.ts                     /kanban/boards/:boardId/cards… (extended)
    ├── kanban-card-files.controller.ts                /kanban/cards/:id/results, time-tracks, files
    ├── kanban-checklist.controller.ts                 /kanban/cards/:id/checklists
    ├── kanban-reports.controller.ts                   /kanban/reports/*
    └── kanban-ext.controller.ts                       barrel re-export
```

CQRS wiring is real (`kanban.module.ts:44-46`):

```ts
const commandHandlers = [CreateTaskHandler, UpdateTaskHandler, DeleteTaskHandler];
const queryHandlers   = [GetTasksHandler, GetTaskHandler];
const eventHandlers   = [OrderCreatedKanbanHandler, OrderCancelledKanbanHandler];
```

and `imports: [CqrsModule, AuthModule]` on line 54.

### 1.1 Commands

| Command | Handler file | Real DB call? | Domain event? |
|---|---|---|---|
| `CreateTaskCommand` | `commands/create-task.handler.ts` | Yes — `KANBAN_REPO.save(task)` (line 34) | Publishes `new TaskCreatedEvent(...)` via `EventBus.publish` (line 39) |
| `UpdateTaskCommand` | `commands/update-task.handler.ts` | Yes — `KANBAN_REPO.update(command.id, task)` (line 57) | None |
| `DeleteTaskCommand` | `commands/delete-task.handler.ts` | Yes — `KANBAN_REPO.delete(command.id)` (line 40) | None |

`UpdateTaskHandler` also enforces a status-transition guard (line 15-21) using `isTransitionAllowed`:

```ts
const KANBAN_TRANSITIONS: Record<string, string[]> = {
  todo:        ['in_progress', 'blocked'],
  in_progress: ['review', 'todo', 'blocked'],
  review:      ['done', 'in_progress'],
  done:        [],
  blocked:     ['todo', 'in_progress'],
};
```

Note: the keys here (`todo`, `in_progress`, `review`, `done`, `blocked`) overlap-but-do-not-match the `TaskStatus` enum (`backlog`, `todo`, `in_progress`, `review`, `done` — no `blocked`). `backlog → todo` is **not** allowed by this map, even though `backlog` is the initial state set by the aggregate (`kanban-task.aggregate.ts:45`).

### 1.2 Queries

| Query | Handler | Real DB call? |
|---|---|---|
| `GetTasksQuery` | `queries/get-tasks.handler.ts` | Yes — `kanbanRepo.findAll(query.filters)` (line 23), returns `PaginatedResult<KanbanTask>` |
| `GetTaskQuery` | `queries/get-task.handler.ts` | Yes — single fetch by id |

### 1.3 Event bus subscriptions (kanban → external producers)

`@EventsHandler` consumers within the kanban module:

| File | Decorator | Producer module |
|---|---|---|
| `event-handlers/order-created-kanban.handler.ts:21` | `@EventsHandler(OrderCreatedEvent)` | SD — published by `modules/sd/application/commands/create-order.handler.ts:193` |
| `event-handlers/order-cancelled-kanban.handler.ts:22` | `@EventsHandler(OrderCancelledEvent)` | **No producer found** (see §3) |

The kanban module itself **also publishes** several event types but **none of them has a consumer**:

| Publisher line | Event class / string | Mechanism | Consumer? |
|---|---|---|---|
| `commands/create-task.handler.ts:39` | `TaskCreatedEvent` | `EventBus.publish` (CQRS) | None |
| `kanban.service.ts:66` | `'kanban.task.created'` | `EventEmitter2` | `OrphanEventsListener.handleKanbanTaskCreated` |
| `kanban.service.ts:98` | `'kanban.task.moved'` | `EventEmitter2` | `OrphanEventsListener.handleKanbanTaskMoved` |
| `kanban.service.ts:105` | `'kanban.task.assigned'` | `EventEmitter2` | `OrphanEventsListener.handleKanbanTaskAssigned` |
| `kanban.service.ts:111` | `'notifications.create'` | `EventEmitter2` | `OrphanEventsListener.handleNotificationsCreate` (persists notification) |
| `kanban.service.ts:129` | `'kanban.task.deleted'` | `EventEmitter2` | `OrphanEventsListener.handleKanbanTaskDeleted` |
| `domain/aggregates/kanban-task.aggregate.ts:88` | `KanbanTaskMovedEvent` | `addDomainEvent` (aggregate buffer) | None — aggregate-buffered events are never published |
| `domain/aggregates/kanban-task.aggregate.ts:101` | `KanbanTaskAssignedEvent` | `addDomainEvent` | None |
| `domain/aggregates/kanban-task.aggregate.ts:112` | `KanbanTaskCompletedEvent` | `addDomainEvent` | None |

Important nuance about the string-emitter listeners (`OrphanEventsListener`): only `'notifications.create'` actually does meaningful work (persists a row in `notifications`). The four `kanban.task.*` handlers log a single line and contain a `// TODO` comment — see lines 84-114 of `orphan-events.listener.ts`:

```ts
@OnEvent('kanban.task.created')
async handleKanbanTaskCreated(payload: KanbanTaskPayload): Promise<void> {
  this.logger.log(
    `kanban.task.created taskId=${payload.taskId} title="${payload.title ?? ''}" by=${payload.createdBy ?? 'unknown'}`,
  );
  // TODO: push notification to assigned user or board watchers when assignee is set at creation
}
```

So round-1's "no listeners" claim is technically wrong — they exist — but the listeners are **no-op log stubs**, so the *user-facing effect* is the same: a task assignment never produces a board-watcher notification or a Telegram push.

---

## 2. Task event emitters & listeners

### 2.1 The 5 string emits from `kanban.service.ts`

`apps/api/src/modules/kanban/application/kanban.service.ts`, lines 65-130 (verbatim emit calls):

```ts
// line 66 — after CreateTaskCommand
await this.eventEmitter.emit('kanban.task.created', {
  taskId: task.data,
  title: dto.title,
  createdBy: userId,
});

// line 98 — after UpdateTaskCommand if status changed
await this.eventEmitter.emit('kanban.task.moved', {
  taskId: id,
  newStatus: dto.status,
  movedBy: userId,
});

// line 105 — after UpdateTaskCommand if assignedTo present
await this.eventEmitter.emit('kanban.task.assigned', {
  taskId: id,
  assigneeId: dto.assignedTo,
  assignedBy: userId,
  taskTitle: dto.title,
});

// line 111 — sibling notification emit
await this.eventEmitter.emit('notifications.create', {
  userId: String(dto.assignedTo),
  type: 'TASK_ASSIGNED',
  title: 'Yangi vazifa tayinlandi',
  body: dto.title ? `"${dto.title}" vazifasi sizga tayinlandi` : 'Yangi vazifa tayinlandi',
});

// line 129 — after DeleteTaskCommand
await this.eventEmitter.emit('kanban.task.deleted', { taskId: id, deletedBy: userId });
```

### 2.2 Listener registry

`apps/api/src/modules/notifications/infrastructure/event-handlers/orphan-events.listener.ts:64-114`:

```ts
@OnEvent('notifications.create')
async handleNotificationsCreate(payload: NotificationsCreatePayload): Promise<void> { … this.notificationRepo.save(notification) … }

@OnEvent('kanban.task.created')    async handleKanbanTaskCreated(...)  { /* log-only */ }
@OnEvent('kanban.task.moved')      async handleKanbanTaskMoved(...)    { /* log-only */ }
@OnEvent('kanban.task.assigned')   async handleKanbanTaskAssigned(...) { /* log-only */ }
@OnEvent('kanban.task.deleted')    async handleKanbanTaskDeleted(...)  { /* log-only */ }
```

| Event string | Listener exists? | Actually does something? |
|---|---|---|
| `kanban.task.created` | Yes | No — log only |
| `kanban.task.moved` | Yes | No — log only |
| `kanban.task.assigned` | Yes | No — log only |
| `kanban.task.deleted` | Yes | No — log only |
| `notifications.create` | Yes | **Yes** — inserts a row into `notifications` via `INotificationRepo.save` (line 75) |

### 2.3 The Telegram-handler hypothesis

Round-1 18-notifications report speculated that `apps/api/src/telegram/handlers/kanban.handler.ts` was the intended consumer.

<details>
<summary>Inspection of `telegram/handlers/kanban.handler.ts`</summary>

Its functions `notifyTaskAssigned` and `notifyTaskDueSoon` (`telegram/handlers/kanban.handler.ts:38,57`) are **not annotated with `@OnEvent`** — they are imperative methods that have to be called explicitly. They are never called from `kanban.service.ts` either, so the Telegram path is not wired.
</details>

### 2.4 The CQRS `TaskCreatedEvent`

Distinct from the string emits, `CreateTaskHandler` publishes `new TaskCreatedEvent(task.id, task.boardId, task.title)` via `EventBus` (CQRS). Grep `EventsHandler\(TaskCreatedEvent` returns zero hits — there is no consumer.

```bash
# verified
grep -rn "EventsHandler(TaskCreatedEvent" apps/api/src/   # 0 matches
grep -rn "EventsHandler(TaskMovedEvent"   apps/api/src/   # 0 matches
grep -rn "EventsHandler(TaskAssignedEvent" apps/api/src/  # 0 matches
grep -rn "EventsHandler(KanbanTaskMovedEvent" apps/api/src/      # 0 matches
grep -rn "EventsHandler(KanbanTaskAssignedEvent" apps/api/src/   # 0 matches
grep -rn "EventsHandler(KanbanTaskCompletedEvent" apps/api/src/  # 0 matches
```

So six declared CQRS event classes (`domain/events/index.ts:6-54`) have **no `@EventsHandler` consumer** anywhere in the codebase. Three of them (`KanbanTaskMovedEvent`, `KanbanTaskAssignedEvent`, `KanbanTaskCompletedEvent`) are only ever added to an aggregate's domain-event buffer (`kanban-task.aggregate.ts:88,101,112`) but the buffer is never drained, because neither `CreateTaskHandler`, `UpdateTaskHandler`, nor `DeleteTaskHandler` calls `task.commit()` or `eventBus.publish(...task.getUncommittedEvents())`.

---

## 3. OrderCancelledEvent class identity

### 3.1 Single canonical definition

The only `class OrderCancelledEvent` in the repo lives at `apps/api/src/modules/sd/domain/events/order-cancelled.event.ts:12`:

```ts
import { DomainEvent } from '@shared/domain/domain-event.base';

export class OrderCancelledEvent extends DomainEvent {
  readonly aggregateName: string = 'SalesOrder';

  constructor(
    public readonly orderId: number,
    public readonly orderNumber: string,
  ) {
    super(orderId, 'OrderCancelled');
  }
}
```

The file header docstring (line 5) confirms the historical issue was fixed:
> "Canonical single-source-of-truth for OrderCancelledEvent. Previously the kanban module defined this class locally (class identity mismatch risk). All consumers must import from this path."

### 3.2 Handler imports the canonical class

`apps/api/src/modules/kanban/application/event-handlers/order-cancelled-kanban.handler.ts:13`:

```ts
import { OrderCancelledEvent } from '../../../sd/domain/events/order-cancelled.event';
…
export { OrderCancelledEvent };                                    // re-export for spec
@EventsHandler(OrderCancelledEvent)
export class OrderCancelledKanbanHandler implements IEventHandler<OrderCancelledEvent> {
```

The `export { OrderCancelledEvent };` on line 19 is a re-export for the unit spec (`test/kanban/order-cancelled-kanban.handler.spec.ts:10`) and does **not** create a second class. It is the same reference.

### 3.3 The new problem: no producer

Although class identity is fixed, **nothing in the application code publishes `new OrderCancelledEvent(...)`**. Searches:

```
grep -rn "new OrderCancelledEvent(" apps/api/src/                    # 0 hits
grep -rn "publish.*OrderCancelledEvent" apps/api/src/                # 0 hits
grep -rn "OrderCancelledEvent" apps/api/src/                          # 11 hits, all imports/refs
```

The two order-cancellation flows that exist mutate DB directly without publishing the event:

1. `apps/api/src/modules/sd/orders/orders.service.ts:70-80` (`cancel(id)`):
   ```ts
   async cancel(id: number){
     const alreadyCancelledMsg = await this.i18n.t('errors.orderAlreadyCancelled');
     const cancelledMsg = await this.i18n.t('messages.orderCancelled');
     return safeCall(async () => {
       const order = await this.findOne(id);
       if (order.status === 'cancelled' || order.overallStatus === 'CANCELLED') throw new BadRequestException(alreadyCancelledMsg);
       const result = await this.sdOrdersRepo.cancel(id);
       if (!result.ok) throw new InternalServerErrorException(result.error);
       return { message: cancelledMsg, code: 'ORDER_CANCELLED' };
     });
   }
   ```
   No `eventBus.publish(new OrderCancelledEvent(...))`.

2. `apps/api/src/modules/sd/application/sd-quotations.service.ts:192-197` (`cancelOrder(id, body)`):
   ```ts
   async cancelOrder(id: string, body: Record<string, unknown>): Promise<Result<Row>> {
     const r = await this.quotationRepo.cancelSalesOrder(id, body['reason']);
     if (!r.ok) return r as Result<Row>;
     if (!r.data) return Err(AppErr('NOT_FOUND', `Order ${id} topilmadi`));
     return Ok({ id, cancelled: true, status: 'cancelled', updated_at: r.data['updated_at'] });
   }
   ```
   Also no publish.

The only references to `new OrderCancelledEvent(...)` are inside `test/kanban/order-cancelled-kanban.handler.spec.ts` (lines 46, 55, 63, 68) — the unit test constructs the event directly to call `handler.handle(...)`.

### 3.4 Implication

`OrderCancelledKanbanHandler` is registered but never invoked at runtime. Cancelling a sales order in SD does **not** move/soft-delete the linked kanban card. The "OrderCreated → kanban card created" path works (publisher present at `create-order.handler.ts:193`) but its mirror "OrderCancelled → kanban card moved" is broken end-to-end.

The fix is one line of code in either `orders.service.cancel()` or wherever the SO aggregate is committed:
```ts
this.eventBus.publish(new OrderCancelledEvent(orderId, orderNumber));
```

This is a downgrade from round-1's "class identity mismatch" (P1) to a different P1: **producer missing**. The end-user impact is identical (cancellation does not propagate to kanban).

---

## 4. WIP limits implementation

### 4.1 Definition

`apps/api/src/modules/kanban/application/kanban.service.ts:20-32`:

```ts
export interface WipLimitConfig {
  [status: string]: number;
}

const DEFAULT_WIP_LIMITS: WipLimitConfig = {
  [TaskStatus.IN_PROGRESS]: 10,
  [TaskStatus.REVIEW]:       5,
};

@Injectable()
export class KanbanService {
  private readonly logger = new Logger(KanbanService.name);
  private wipLimits: WipLimitConfig = { ...DEFAULT_WIP_LIMITS };
```

`wipLimits` is a private mutable property on the singleton service instance. NestJS instantiates `KanbanService` once at module bootstrap, so the property survives across requests but **resets on every restart**, **per-process** (no propagation across PM2 workers / containers), and **per-board is impossible** (no board scoping in the map).

### 4.2 Mutation API

`kanban.service.ts:140-144`:

```ts
async setWipLimit(status: TaskStatus, maxItems: number): Promise<void> {
  if (maxItems < 1) throw new BadRequestException(await this.i18n.t('errors.wipLimitMin'));
  this.wipLimits[status] = maxItems;
  this.logger.log(`WIP limit yangilandi: ${status} → max ${maxItems}`);
}
```

`setWipLimit` is **not exposed by any controller** (grep `setWipLimit` returns one hit — only the declaration). Therefore even the in-memory state cannot be changed at runtime via HTTP; the defaults (`IN_PROGRESS: 10`, `REVIEW: 5`) are effectively hard-coded.

`getWipLimits()` (line 136) is also unused outside the service class itself.

### 4.3 Enforcement

`kanban.service.ts:146-161`:

```ts
private async checkWipLimit(newStatus: TaskStatus, currentTaskId?: string): Promise<void> {
  const limit = this.wipLimits[newStatus];
  if (!limit) return;

  const result = await this.queryBus.execute(new GetTasksQuery({ status: newStatus, limit: KANBAN_BATCH_FETCH }));
  if (!result?.ok) return;

  const tasks = result.data?.items ?? result.data ?? [];
  const currentCount = Array.isArray(tasks) ? tasks.filter((t: Record<string, unknown>) => t.id !== currentTaskId).length : 0;

  if (currentCount >= limit) {
    throw new BadRequestException(
      `WIP limit oshib ketdi: "${newStatus}" kolonnasida max ${limit} ta vazifa bo'lishi mumkin (hozir: ${currentCount})`,
    );
  }
}
```

Issues:

1. **No board scope.** It counts every task across every board with the target status. A multi-board setup where two teams each have 8 `in_progress` cards will already over-flow the global `10` limit even though each board is under its own intended cap.
2. **Off-by-one drift if `KANBAN_BATCH_FETCH` < total.** `currentCount` is computed from the page returned by `GetTasksQuery`, not from a count query. If there are more tasks than the page size, `currentCount` undercounts and the limit fails silently.
3. **Bypassable via PATCH that omits `status`.** `checkWipLimit` is only called from `KanbanService.updateTask` when `dto.status` is set (`kanban.service.ts:80`). The `KanbanBoardsController.moveCard` (`/kanban/cards/:id/move`) route, which goes through `KanbanBoardsService.moveCard → boardsRepo.moveCard` (column change, not status change), **never invokes `checkWipLimit`**. So the limit is enforced only on the CQRS path, not on the drag-drop column move that the UI actually uses.

### 4.4 No DB persistence

```
grep -rn "kanban_wip" apps/api/                   # 0 hits
grep -rn "wip_limits"  apps/api/                  # 0 hits in db code
```

There is no `kanban_wip_limits` table in `schema-kanban.ts` or anywhere in `apps/api/src/shared/db/`.

---

## 5. Kanban boards/columns/cards

### 5.1 Drizzle schema (canonical)

`apps/api/src/shared/db/schema-kanban.ts` declares 18 tables (round 1 said 11):

| Table | Lines | Notes |
|---|---|---|
| `kanbanBoards` | 11-19 | `id serial`, `name`, `type` (default `custom`), `description`, soft-delete |
| `kanbanColumns` | 21-30 | `board_id integer` (no FK constraint declared), `sort_order`, `color`, soft-delete |
| `kanbanCards` | 32-45 | `board_id`, `column_id`, `title`, `description`, `priority` (default `normal`), `related_type`, `related_id`, `sort_order`, soft-delete |
| `kanbanFlows` | 47-56 | uuid PK, `boardId text` (note: different column type than `kanbanColumns.board_id integer`), `config jsonb` |
| `kanbanRobots` | 58-66 | uuid PK, `trigger`, `actions jsonb`, `isActive` |
| `kanbanChecklists` | 69-75 | uuid PK, `cardId text` |
| `kanbanChecklistItems` | 77-86 | `checklistId text`, `assigneeId integer`, `dueDate text` |
| `kanbanCardComments` | 88-94 | per-card comments |
| `kanbanCardWatchers` | 96-101 | watchers |
| `kanbanNotifications` | 104-114 | in-app notifications (separate from generic `notifications`) |
| `kanbanTemplates` | 117-129 | template definitions |
| `kanbanTimeTracks` | 132-143 | `startedAt`, `endedAt`, `durationMinutes`, `targetMinutes`, `isRunning` |
| `kanbanTags` | 146-152 | tag pool |
| `kanbanCardTags` | 154-159 | M:N join |
| `kanbanResults` | 162-169 | per-card outcome records |
| `kanbanResultFiles` | 171-179 | files attached to a result |
| `kanbanObservers` | 182-187 | extra watcher type |
| `kanbanCoExecutors` | 189-194 | co-assignees |
| `kanbanFiles` | 197-207 | direct card attachments |

### 5.2 Type discrepancy — board_id

`kanbanColumns.board_id` and `kanbanCards.board_id` are `integer` (lines 23, 34), but `kanbanFlows.boardId`, `kanbanRobots.boardId`, `kanbanTemplates.boardId`, `kanbanTags.boardId`, `kanbanCardWatchers.cardId`, etc. are `text` (lines 49, 60, 122, 150, 71, …). The same logical foreign-key is encoded as two different types. In code, `KanbanBoardsService.deleteBoard(boardId: string)` (line 47) takes a string while `kanbanBoards.id` is `serial` (integer) — coercion happens at query time, type safety is lost.

### 5.3 Extended columns not declared in Drizzle schema

Round-1 listed 5 missing columns. The SQL migration `apps/api/src/shared/db/migrations/kanban-extended-tables.sql:130-188` actually adds **9** columns to `kanban_cards` and 1 to `kanban_boards` that are **not** in `schema-kanban.ts`:

- `kanban_cards.accepted_at TIMESTAMPTZ`
- `kanban_cards.accepted_by_id TEXT`
- `kanban_cards.completed_at TIMESTAMPTZ`
- `kanban_cards.completion_report TEXT`
- `kanban_cards.recurrence_pattern TEXT NOT NULL DEFAULT 'none'`
- `kanban_cards.recurrence_end_date DATE`
- `kanban_cards.parent_card_id TEXT`
- `kanban_cards.owner_user_id` (referenced by cron line 33, 67-72)
- `kanban_cards.estimated_time` (referenced by cron line 33, 67-72)
- `kanban_cards.due_date` (referenced by cron line 50, 58, 74)
- `kanban_boards.department_id TEXT` (line 186)

Every access happens via raw SQL or `Record<string, unknown>` casts — no type-safe ORM access is possible. `KanbanBoardsService.updateCard` (line 81-99) accepts all these fields through `Record<string, unknown>` and forwards them, with `KanbanBoardsRepository.updateCard` building the UPDATE statement manually.

### 5.4 Board creation does NOT auto-seed columns

`KanbanBoardsService.createBoard` (`kanban-boards.service.ts:38-44`) only inserts a row into `kanban_boards` — there is no default-column logic:

```ts
createBoard(body: Record<string, unknown>): Promise<Result<KanbanBoard>> {
  return this.boardsRepo.createBoard({
    name: String(body.name || 'Yangi Doska'),
    type: String(body.type || 'custom'),
    description: body.description != null ? String(body.description) : null,
  });
}
```

Default columns must be added by:
- the `POST /kanban/templates/:templateId/apply` endpoint (`kanban-boards.controller.ts:237-271`), which iterates `template.columnsConfig[]` and calls `boardsSvc.addColumn` for each, OR
- the frontend "Quick Start" mutation (`useKanbanBoard.mutations.ts`), OR
- manual `POST /kanban/boards/:boardId/columns`.

A board without columns will fail the `createKanbanForOrder` flow at `kanban-cards.repo.ts:165` (returns `{ ok: false, reason: 'no-column' }`).

### 5.5 The sales board lookup (heuristic)

`apps/api/src/modules/kanban/infrastructure/repositories/kanban-cards.repo.ts:136-152`:

```ts
const boardRows = await tx
  .select({ id: kanbanBoards.id })
  .from(kanbanBoards)
  .where(
    and(
      isNull(kanbanBoards.deleted_at),
      or(
        eq(kanbanBoards.type, 'sales'),
        ilike(kanbanBoards.name, '%buyurtma%'),   // Uzbek for "order"
        ilike(kanbanBoards.name, '%order%'),
        ilike(kanbanBoards.name, '%sotuv%'),       // Uzbek for "sale"
      ),
    ),
  )
  .orderBy(asc(kanbanBoards.created_at))
  .limit(1);
```

This couples the SD → Kanban integration to board *names* / `type` field. Renaming a board can break the auto-card creation silently — the only signal is a `logger.warn(…)` on line 184.

---

## 6. Task assignments & priorities

### 6.1 Task status / priority

`apps/api/src/modules/kanban/domain/enums/task-status.enum.ts`:

```ts
export enum TaskStatus {
  BACKLOG     = 'backlog',
  TODO        = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW      = 'review',
  DONE        = 'done',
}

export enum TaskPriority {
  LOW    = 'low',
  MEDIUM = 'medium',
  HIGH   = 'high',
  URGENT = 'urgent',
}
```

But `kanbanCards.priority` (schema line 38) defaults to `'normal'` — **not** in the `TaskPriority` enum:

```ts
priority: varchar('priority', { length: 20 }).notNull().default('normal'),
```

And `KanbanAddCardSchema` (`dto/kanban.dto.ts:42`) restricts:

```ts
priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
```

So we have three priority vocabularies in three layers: enum (`low|medium|high|urgent`), DB default (`normal`), Zod schema (`low|normal|high|urgent`). `medium` is in the enum but rejected by the schema; `normal` is in the schema/DB but absent from the enum. Any code path that compares `task.priority === TaskPriority.MEDIUM` will never match a card created through the HTTP endpoint.

### 6.2 Assignment fields

Two separate columns / aggregate properties:

1. `KanbanTask.assigneeId: number | null` (aggregate, `kanban-task.aggregate.ts:24`) — set via `assignTo(userId, by)` (line 92-103) — produces `KanbanTaskAssignedEvent` (not consumed).
2. `kanban_cards.owner_user_id text` — used by raw SQL (cron, boards repo update). This is the field the UI reads as `card.ownerUserId` (`useKanbanBoard.ts:105`).

These two are **not synchronized**. `CreateTaskHandler` (line 26-33) only sets `assigneeId` via aggregate; the kanban_cards row inserted by `KanbanRepository.save` does not populate `owner_user_id`. So a task created through `POST /kanban` (CQRS path) has no UI-visible owner.

The "boards" path uses `owner_user_id`: `KanbanBoardsService.updateCard` accepts `body.ownerUserId / body.owner_user_id` and writes to `owner_user_id` directly. The two paths are independent assignment systems on the same table.

### 6.3 Checklist item assignment

`kanbanChecklistItems.assigneeId: integer` (schema line 82) and `dueDate: text` (line 83) allow per-checklist-item owners and dates. No FK constraint declared in Drizzle.

### 6.4 Due-date logic

- `due_date` column added by migration only, type `DATE`.
- The aggregate `KanbanTask.dueDate: Date | null` (aggregate property, line 28) — also unsynchronized with the column.
- `UpdateTaskHandler:55` sets `task.dueDate = command.dueDate` (where `command.dueDate` is a string, but the field is typed `Date | null` — runtime mismatch).
- The cron (`kanban-recurring.cron.ts:50-58`) computes `nextDueDate` and inserts a new card whose `due_date` is shifted by the pattern.
- Frontend computes `overdueCount` and `cardsByDeadline` in `useKanbanBoard.ts:115-155`.

### 6.5 No assignee validation

`KanbanService.updateTask` accepts `dto.assignedTo` and `KanbanBoardsService.updateCard` accepts `body.ownerUserId` without checking that:
- the user exists,
- the user has appropriate role,
- the user is a member of the board / department.

This is unchanged from round 1.

---

## 7. Frontend integration

### 7.1 Routes / pages

| File | Role |
|---|---|
| `artifacts/erp-dashboard/src/pages/KanbanBoard.tsx` | Top-level page (235 lines). Uses `useKanbanBoard()` hook. |
| `artifacts/erp-dashboard/src/pages/KanbanBoardSections.tsx` | `EmptyBoardState` + `BoardContent` (renders columns) |
| `artifacts/erp-dashboard/src/pages/KanbanBoardDialogs.tsx` | All modals (`TaskDetailSheet`, `RobotsDialog`, `FlowsDialog`, `TemplatesDialog`, `ReportsDialog`, `BoardDialogs`) |
| `artifacts/erp-dashboard/src/pages/kanban/KanbanColumn.tsx` | Column UI |
| `artifacts/erp-dashboard/src/pages/kanban/KanbanCard.tsx` | Card UI |
| `artifacts/erp-dashboard/src/pages/crm/KanbanColumn.tsx` | **Separate** column used by CRM (`workspace/KanbanView.tsx`) — duplicate name, different file |
| `artifacts/erp-dashboard/src/components/kanban/KanbanBoardView.tsx` | Standalone board view |
| `artifacts/erp-dashboard/src/components/kanban/KanbanViewTabs.tsx` | Tab switcher (column/deadline view modes) |
| `artifacts/erp-dashboard/src/components/crm/workspace/KanbanView.tsx` | CRM workspace board (received `stages` prop) |
| `artifacts/erp-dashboard/src/components/recruiting/KanbanBoardGrid.tsx` | Recruiting kanban — yet another kanban implementation |
| `artifacts/erp-dashboard/src/components/recruiting/KanbanColumn.tsx` | Recruiting column |

So there are **three** independent kanban front-ends (main `pages/KanbanBoard`, CRM `workspace/KanbanView`, recruiting `KanbanBoardGrid`). Only the first is wired to `/api/kanban/boards/*`.

### 7.2 Data fetching

`artifacts/erp-dashboard/src/hooks/useKanbanBoard.ts`:

| Line | Query key | Endpoint |
|---|---|---|
| 55 | `["/api/kanban/boards"]` | `GET /api/kanban/boards` |
| 58 | `["/api/kanban/boards", selectedBoardId]` | `GET /api/kanban/boards/:id` |
| 63 | `["/api/kanban/employees"]` | `GET /api/kanban/employees` |
| 73 | `["/api/kanban/templates"]` | `GET /api/kanban/templates` |
| 78 | `["/api/kanban/notifications/unread-count"]` | `GET /api/kanban/notifications/unread-count` |

Confirmed: **stages/columns come from the API**, not from a static config. `columns = boardData?.columns || []` (line 92). Round-1 P3 "frontend stage source unverified" is resolved — real DB.

### 7.3 Mutations

`artifacts/erp-dashboard/src/hooks/useKanbanBoard.mutations.ts`:

- `createBoardMutation` → `POST /api/kanban/boards`
- `createColumnMutation` → `POST /api/kanban/boards/:id/columns`
- `createCardMutation` → posts to a card endpoint (need to verify which controller)
- `updateCardMutation`, `deleteCardMutation`, `moveCardMutation`, `deleteColumnMutation`, `deleteBoardMutation`

The mutation calls go through `apiRequest` from `@/lib/queryClient`.

### 7.4 Drag/drop

`useKanbanBoard.drag.ts` (referenced from `useKanbanBoard.ts:172`) wires `@dnd-kit/core` `PointerSensor`/`KeyboardSensor` (lines 49-52) into `handleDragStart`/`handleDragEnd`, which call `moveCardMutation` (board path) — meaning drag-drop bypasses `KanbanService.updateTask` and therefore **bypasses `checkWipLimit`** (already noted in §4.3).

### 7.5 Notification view

`unreadCountData` (line 77) is fetched from `/api/kanban/notifications/unread-count`. The kanban notification UI displays this count next to a bell icon (`BoardHeader` prop `unreadCount`). The actual list comes from `GET /api/kanban/notifications` (declared on `KanbanBoardsController:161`).

---

## 8. Findings summary

### P0 — none

(No critical data loss, auth bypass, or stability issue in this slice. The cancellation flow is broken but the data is preserved.)

### P1

| # | Issue | Evidence | Impact | Fix |
|---|---|---|---|---|
| 1 | **No producer publishes `OrderCancelledEvent`** | `apps/api/src/modules/sd/orders/orders.service.ts:70-80`; `…/sd-quotations.service.ts:192-197`; grep `new OrderCancelledEvent` → only spec | `OrderCancelledKanbanHandler` is dead code; cancelling an order in SD never moves/soft-deletes the linked kanban card | Add `this.eventBus.publish(new OrderCancelledEvent(orderId, orderNumber))` to the cancel flow |
| 2 | **WIP limit bypassed on drag-drop** | `kanban.service.ts:80` calls `checkWipLimit` only in CQRS update path; `KanbanBoardsService.moveCard → boardsRepo.moveCard` never calls it; UI drag-drop uses `moveCardMutation` → `PUT /kanban/cards/:id/move` | Users can drag any number of cards into `in_progress` / `review` columns; limit is enforced only on the rarely-used `PATCH /kanban/:id` route | Wire `checkWipLimit` into `KanbanBoardsService.moveCard` (or attach it as a domain invariant in `KanbanCardsRepository.moveCard`) |
| 3 | **6 CQRS event classes (`TaskCreatedEvent`, `TaskMovedEvent`, `TaskAssignedEvent`, `KanbanTaskMovedEvent`, `KanbanTaskAssignedEvent`, `KanbanTaskCompletedEvent`) have zero consumers** | `domain/events/index.ts:6-54`; grep `EventsHandler\(Task…` / `EventsHandler\(KanbanTask…` → 0 hits | Domain events published by `EventBus.publish` (one place) and added to aggregate buffers (three places) silently disappear | Either delete the unused event classes, or register handlers (e.g. notification dispatch, audit log) |

### P2

| # | Issue | Evidence | Impact | Fix |
|---|---|---|---|---|
| 4 | **WIP limits are in-memory only and not exposed by HTTP** | `kanban.service.ts:32`; `setWipLimit` defined line 140 but no controller route | Limits reset on every restart; defaults `IN_PROGRESS:10`, `REVIEW:5` are effectively hard-coded; no way to set per-board limits | Add `kanban_wip_limits(board_id, status, max_items)` table; expose `GET/PUT /kanban/boards/:id/wip-limits` |
| 5 | **WIP limit lacks board scope** | `checkWipLimit` (`kanban.service.ts:146-161`) counts all tasks of status across all boards | Multi-board deployments share one global limit; bigger teams accidentally trip the limit | Filter `GetTasksQuery` by `boardId` and use a `COUNT(*)` query instead of paginated fetch |
| 6 | **9 `kanban_cards` columns + `kanban_boards.department_id` are not in Drizzle schema** | Compare `schema-kanban.ts:32-45` vs `migrations/kanban-extended-tables.sql:130-188` | Raw SQL only; no type safety for cron, completion flow, recurrence | Add columns to `schema-kanban.ts`; replace raw SQL in `kanban-recurring.cron.ts` with ORM calls |
| 7 | **Priority vocabulary mismatch across 3 layers** | `enum TaskPriority { LOW, MEDIUM, HIGH, URGENT }` vs schema default `'normal'` vs Zod schema `['low','normal','high','urgent']` | `task.priority === TaskPriority.MEDIUM` never matches HTTP-created cards | Pick one vocabulary; align enum to `low/normal/high/urgent`, drop `MEDIUM` |
| 8 | **`assigneeId` (aggregate) and `owner_user_id` (DB column) are two unsynchronized assignment systems** | `kanban-task.aggregate.ts:24,99` vs `kanban-boards.service.ts:90` | Task created via `POST /kanban` (CQRS) has no UI-visible owner because UI reads `card.ownerUserId` | Drop one or sync them in the repository layer |
| 9 | **Status-transition map (`UpdateTaskHandler:15`) doesn't include `backlog`** | Initial state set to `BACKLOG` (`kanban-task.aggregate.ts:45`); `KANBAN_TRANSITIONS` lacks a key for `backlog`, so any first PATCH from `backlog` fails `isTransitionAllowed` | Newly-created tasks cannot be moved through the CQRS path | Add `backlog: ['todo', 'in_progress']` to the map |
| 10 | **All 4 `kanban.task.*` listeners are log-only no-ops with a `TODO` comment** | `orphan-events.listener.ts:84-114` | Task lifecycle events are not pushed to assignees / board watchers; Telegram handler in `telegram/handlers/kanban.handler.ts` is not connected | Wire the assigned/moved handlers to `notifications.create` emission for relevant users; call the Telegram handler |

### P3

| # | Issue | Evidence | Impact | Fix |
|---|---|---|---|---|
| 11 | **`board_id` is `integer` on cards/columns but `text` on flows/robots/templates/tags** | `schema-kanban.ts:23,34` vs `:49,60,122,150` | Same logical FK is two types; coercion happens at query time | Pick one type and migrate |
| 12 | **Sales-board lookup uses ILIKE on board name** | `kanban-cards.repo.ts:144-148` matches `name ILIKE '%buyurtma%' OR '%order%' OR '%sotuv%'` | Renaming the sales board silently breaks the SD → kanban integration | Use a stable identifier (e.g. `type = 'sales'` only) or a configurable env var |
| 13 | **No FK constraints declared between kanban tables** | `schema-kanban.ts` — all `board_id` / `column_id` / `card_id` columns have no `.references(...)` | Orphan rows possible (column for deleted board, card for deleted column) | Add FKs with `onDelete: 'cascade'` or `'set null'` |
| 14 | **Three independent kanban implementations on the frontend** | `pages/KanbanBoard.tsx` (main), `components/crm/workspace/KanbanView.tsx` (CRM), `components/recruiting/KanbanBoardGrid.tsx` (recruiting) | Three codebases for the same UX concept; CRM/recruiting are not wired to `/api/kanban` | Consolidate or document which one is canonical |
| 15 | **`KanbanController` declares a local `enum Role` with 4 values, `KanbanBoardsController` uses 7 string-literal roles** | `kanban.controller.ts:35-39,58` vs `kanban-boards.controller.ts:38` | Two controllers on the same `/kanban` mount apply different RBAC | Centralize role names in a shared `Role` enum (likely the `@modules/auth/roles.ts`) |
| 16 | **`KanbanRecurringCron` limits to 200 cards per run with no continuation cursor** | `kanban-recurring.cron.ts:45` | If ever >200 recurring cards exist, the rest are silently skipped each run | Either remove the LIMIT or implement cursor-based batching |

---

## Open questions / UNVERIFIED in this report

- **Aggregate domain events not drained.** `KanbanTask.moveToColumn / assignTo / complete` add events via `this.addDomainEvent(...)` (`kanban-task.aggregate.ts:88,101,112`) but I did not trace whether any handler iterates `getUncommittedEvents()` on the aggregate before persisting. Quick grep suggests none do. If confirmed, finding P1#3 escalates to "domain events never escape the aggregate at all" rather than "no consumer registered".
- **`KanbanReportsService.getEmployeePerformance` / `getProductivityReport`** are forwarded to `DrizzleKanbanAnalyticsRepository` but the actual SQL in that file was not read in this pass. Round 1 said they are real DB queries — not verified here.
- **`KanbanRobotService`** and the flow/automation layer (`kanbanFlows`, `kanbanRobots` tables) were inventoried but their execution path (who invokes the robot trigger when a card moves) was not traced.
