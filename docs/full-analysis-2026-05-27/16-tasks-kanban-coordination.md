# Report 16 — Tasks / Kanban Coordination Module

**Date:** 2026-05-27  
**Analyst:** Forensic audit (read-only)  
**Scope:** `apps/api/src/modules/kanban/` · `artifacts/erp-dashboard/src/components/crm/`

---

## 1. Module Overview

The Kanban module is one of the most architecturally complete modules in the monorepo. It follows full CQRS (CommandBus + QueryBus), has a rich domain schema (11 tables), integrates with the SD (Sales/Order) module via domain events, exposes a robot/flow automation layer, and ships a dedicated recurring-task cron job.

**Backend entry:** `apps/api/src/modules/kanban/kanban.module.ts`  
**Schema source of truth:** `apps/api/src/shared/db/schema-kanban.ts`  
**Frontend board:** `artifacts/erp-dashboard/src/components/crm/workspace/KanbanView.tsx`

---

## 2. Inventory / Coverage

### 2.1 Database Tables

Source file: `apps/api/src/shared/db/schema-kanban.ts`

| Table | Key Columns | Notes |
|---|---|---|
| `kanban_boards` | id (serial), name, type (varchar 20), description, deleted_at | Soft-delete |
| `kanban_columns` | id, board_id, name, sort_order, color, deleted_at | Ordered columns |
| `kanban_cards` | id, board_id, column_id, title, description, priority, related_type, related_id, sort_order, deleted_at | `related_type`/`related_id` links to orders |
| `kanban_flows` | id (uuid), boardId, name, status, config (jsonb) | Automation flows |
| `kanban_robots` | id (uuid), boardId, trigger, actions (jsonb), isActive | Automation bots |
| `kanban_checklists` | id (uuid), cardId, title, position | Checklist per card |
| `kanban_checklist_items` | id, checklistId, title, isCompleted, assigneeId, dueDate | Per-item assignee |
| `kanban_card_comments` | id, cardId, userId, content, createdAt | Comments on cards |
| `kanban_card_watchers` | id, cardId, userId | Watchers/subscribers |
| `kanban_notifications` | id, userId, cardId, boardId, type, title, message, isRead | In-app notifications |
| `kanban_templates` | id, name, priority, boardId, checklistItems (jsonb), columnsConfig (jsonb) | Board templates |
| `kanban_time_tracks` | id, cardId, userId, startedAt, endedAt, durationMinutes, isRunning | Time tracking |
| `kanban_tags` | id, name, color, boardId | Labels |

Additional extended columns referenced in cron: `recurrence_pattern`, `completed_at`, `due_date`, `owner_user_id`, `estimated_time` — these are on `kanban_cards` but **not declared in the Drizzle schema** (schema-kanban.ts lines ~30-44 do not include them). They are accessed via raw SQL only.

### 2.2 Task Status Enum

Source: `apps/api/src/modules/kanban/domain/enums/task-status.enum.ts`

```
TaskStatus: BACKLOG | TODO | IN_PROGRESS | REVIEW | DONE
TaskPriority: LOW | MEDIUM | HIGH | URGENT
```

The status flow is linear but not enforced in the DB (no CHECK constraint visible in schema). WIP limits are enforced in-memory inside `KanbanService.checkWipLimit()`.

Default WIP limits (in-memory, lost on restart):
- `in_progress`: max 10
- `review`: max 5

### 2.3 API Controllers

| Controller | Path Prefix | Roles |
|---|---|---|
| `KanbanController` | `GET/POST/PATCH/DELETE /kanban` | super_admin, director, sales_manager, warehouse_manager |
| `KanbanBoardsController` | `GET/POST /kanban/boards`, `/kanban/cards`, `/kanban/templates`, `/kanban/notifications`, `/kanban/employees` | admin, manager, supervisor, operator, employee, viewer, director |
| `KanbanCoreController` | `/kanban/boards/:id/flows`, `/kanban/flows/:id`, `/kanban/robots/:id` | super_admin, director, manager, employee |
| `KanbanCardFilesController` | `/kanban/cards/:id/files` | (same guards) |
| `KanbanChecklistController` | `/kanban/checklists`, `/kanban/checklist-items` | (same guards) |
| `KanbanExtController` | `/kanban/ext/*` | (extended operations) |
| `KanbanReportsController` | `/kanban/reports/employee-performance`, `/kanban/reports/productivity`, `/kanban/reports/overdue`, `/kanban/analytics/summary`, `/kanban/reports/export` | super_admin, director, manager, employee |

### 2.4 Task Assignment

Who can be assigned:
- The `KanbanBoardsController` exposes `GET /kanban/employees` which delegates to `KanbanExtService.getEmployees()` — returns all employees from the employees table for dropdown selection.
- The `kanban_checklist_items.assigneeId` is an integer FK (no FK constraint visible in schema).
- The `kanban_cards.owner_user_id` is referenced in cron SQL but absent from Drizzle schema.
- There is no role-based restriction on *who can be assigned* — any user ID can be set.

---

## 3. Data Flow / Event Flow

### 3.1 CQRS Commands

| Command | Handler | Effect |
|---|---|---|
| `CreateTaskCommand` | `create-task.handler.ts` | Inserts card via repository |
| `UpdateTaskCommand` | `update-task.handler.ts` | Updates card, checks WIP limit |
| `DeleteTaskCommand` | `delete-task.handler.ts` | Soft-deletes card |

Queries: `GetTasksQuery`, `GetTaskQuery`

### 3.2 Events Emitted by Kanban

Source: `apps/api/src/modules/kanban/application/kanban.service.ts`

| Event String | Trigger | Listener? |
|---|---|---|
| `kanban.task.created` | After `CreateTaskCommand` succeeds | No `@OnEvent` listener found |
| `kanban.task.moved` | After `UpdateTaskCommand` with new status | No `@OnEvent` listener found |
| `kanban.task.assigned` | After update if `dto.assignedTo` present | No `@OnEvent` listener found |
| `kanban.task.deleted` | After `DeleteTaskCommand` succeeds | No `@OnEvent` listener found |
| `notifications.create` | When task assigned (with TASK_ASSIGNED payload) | No `@OnEvent` listener found |

**All four kanban-specific event strings are orphan emitters — no listeners registered anywhere in the codebase.**

### 3.3 Integration: Production Order → Kanban Card

Source: `apps/api/src/modules/kanban/application/event-handlers/`

| Event Handler | CQRS Event Listened | Action |
|---|---|---|
| `OrderCreatedKanbanHandler` | `OrderCreatedEvent` (CQRS IEventHandler) | Calls `kanbanBoardsRepo.createKanbanForOrder(...)` — auto-creates a Kanban card when a sales order is created |
| `OrderCancelledKanbanHandler` | `OrderCancelledEvent` (local class in same file) | Calls `kanbanBoardsRepo.moveOrderCardToCancelled(...)` — moves card to cancelled column |

The `OrderCancelledEvent` class is **defined locally** inside `order-cancelled-kanban.handler.ts` — it does not import from the SD module. This means if the SD module also emits `OrderCancelledEvent`, the handler may never fire (class identity mismatch).

### 3.4 Recurring Tasks Cron

Source: `apps/api/src/cron/kanban-recurring.cron.ts`

Runs daily at `07:00 Asia/Tashkent`. Finds cards where `recurrence_pattern != 'none'` and `completed_at IS NOT NULL`, computes `nextDueDate` per pattern (daily/weekly/monthly), deduplicates by `(title, board_id, due_date)`, then inserts a fresh card. Limited to 200 cards per run.

---

## 4. Gaps Identified

1. **WIP limits are in-memory only** — Any server restart resets them to defaults; no DB persistence for WIP limit configuration.
2. **`kanban.task.*` events have no listeners** — Notifications system (`notifications.create`) is emitted but no handler consumes it; task lifecycle events cannot trigger downstream workflows.
3. **`OrderCancelledEvent` defined locally** — Cross-module event identity mismatch; the SD module's `OrderCancelledEvent` and the local definition are different classes.
4. **Extended card columns missing from Drizzle schema** — `recurrence_pattern`, `completed_at`, `owner_user_id`, `estimated_time`, `due_date` are used in the cron via raw SQL but absent from `schema-kanban.ts`, preventing type-safe ORM access.
5. **`KanbanController` and `KanbanBoardsController` both mount on `/kanban`** — Route collision risk; NestJS will register both but route precedence is undefined for overlapping paths.
6. **No assignee role restriction** — Any user ID can be assigned a task; no validation that the assignee exists or has permission to receive tasks.
7. **Frontend column data not from DB** — `KanbanView.tsx` receives `stages` as a prop. Tracing required to confirm if these stages are fetched from `/kanban/boards/:id` (real) or from static config.

---

## Summary

The Kanban module has the most complete architecture in the codebase: 11 DB tables, full CQRS, robot/flow automation, time tracking, recurring tasks, and export endpoints. The SD → Kanban integration (order creates card) is real and implemented. The main risks are: four orphan event emits (no listeners), in-memory WIP limits (non-persistent), a local OrderCancelledEvent class that will not match the SD module's emit, and five extended DB columns accessed only via raw SQL.

---

## Gaps Table

| Issue | Severity | Evidence | Impact | Suggested Fix |
|---|---|---|---|---|
| `kanban.task.*` events have no listeners | P1 | `kanban.service.ts:66,98,105,111,129` | Task assignment notifications silently dropped | Add `@OnEvent('kanban.task.assigned')` in notifications module |
| `OrderCancelledEvent` locally redefined | P1 | `order-cancelled-kanban.handler.ts:16-23` | Handler never fires when SD emits OrderCancelled | Import SD module's canonical event class |
| WIP limits in-memory only | P2 | `kanban.service.ts:27-28` | Limits reset on restart; no persistence | Add `kanban_wip_limits` table or use board config jsonb |
| Extended columns missing from Drizzle schema | P2 | `kanban-recurring.cron.ts:28-46` vs `schema-kanban.ts:30-44` | Raw SQL only; no type safety for recurrence logic | Add columns to Drizzle schema |
| Dual `/kanban` controller mount | P2 | `kanban.controller.ts` + `kanban-boards.controller.ts` | Route shadowing for `GET /kanban` | Separate base paths (`/kanban/tasks` vs `/kanban/boards`) |
| Frontend stage source unverified | P3 | `KanbanView.tsx:12` receives `stages` prop | May render static columns instead of DB columns | Trace `stages` prop to API call |

---

## Open Questions / UNVERIFIED

- Does `KanbanBoardsService.createBoard()` seed default columns automatically, or must columns be added manually?
- Is `kanban_notifications` consumed by a frontend polling endpoint or WebSocket push? The `GET /kanban/notifications` endpoint exists but WebSocket push for kanban is unconfirmed.
- The `KanbanExtService.getEmployeePerformance()` and `getProductivityReport()` — are these real DB queries or synthetic? File `drizzle-kanban-analytics.repo.ts` exists but was not fully read.
- Is there a frontend page for the standalone Kanban board (separate from the CRM Kanban)?
