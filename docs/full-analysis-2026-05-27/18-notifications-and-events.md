# Report 18 — Notifications and Event System

**Date:** 2026-05-27  
**Analyst:** Forensic audit (read-only)  
**Scope:** `apps/api/src/` — all `@OnEvent`, `eventEmitter.emit`, EventBus, and Telegram integrations

---

## 1. Module Overview

The EuroPrint ERP uses **three co-existing event mechanisms** which were progressively unified but remain partially mixed:

1. **CQRS `EventBus`** (`@nestjs/cqrs`) — typed domain events, `IEventHandler` classes.
2. **`EventEmitter2`** with `ERP_EVENTS` string constants — string-keyed `@OnEvent(ERP_EVENTS.X)` listeners.
3. **`EventEmitter2`** with raw string literals — ad-hoc `this.events.emit('some.string', payload)`.

A bridge service (`EventBridgeService`) was introduced to translate CQRS EventBus events → EventEmitter2 string events, but it only covers a specific set of class→string mappings and the list is incomplete.

**Key infrastructure files:**
- `apps/api/src/modules/shared/events/event-bridge.service.ts` — CQRS→EventEmitter2 bridge
- `apps/api/src/common/constants/erp-events.constants.ts` — `ERP_EVENTS` string constants
- `apps/api/src/telegram/telegram.service.ts` — core Telegram bot service

---

## 2. Complete @OnEvent Handler Inventory

### 2.1 AI Agents

| File | Event String | Handler Method |
|---|---|---|
| `modules/ai-agents/common/ai-alerts.service.ts:55` | `'mes.machine.emergency_stop'` | Emergency stop alert |
| `modules/ai-agents/common/ai-alerts.service.ts:70` | `'mes.machine.anomaly_alert'` | Machine anomaly alert |
| `modules/ai-agents/common/ai-alerts.service.ts:92` | `'sales.copilot.auto_price'` | Auto-price notification |
| `modules/ai-agents/common/ai-alerts.service.ts:151` | `'sales.copilot.director_approval_required'` | Director approval push |

### 2.2 HR — Attendance & Territory

| File | Event String | Handler Method |
|---|---|---|
| `modules/hr/attendance/territory.gateway.ts:100` | `'attendance.territory_enter'` | WebSocket push |
| `modules/hr/attendance/territory.gateway.ts:105` | `'attendance.territory_exit'` | WebSocket push |
| `modules/hr/attendance/territory.gateway.ts:110` | `'attendance.late_arrival'` | WebSocket push |
| `modules/hr/attendance/territory.gateway.ts:115` | `'security.unknown_face'` | WebSocket push |
| `modules/hr/attendance/territory.gateway.ts:120` | `'hr.room_anomaly'` | WebSocket push |
| `modules/hr/attendance/territory.gateway.ts:125` | `'hr.fatigue_alert'` | WebSocket push |

### 2.3 HR — Telegram Bots (Attendance)

| File | Event String | Handler Method |
|---|---|---|
| `modules/hr/telegram-bots/attendance-bot.service.ts:154` | `'attendance.late_arrival'` | Telegram DM to manager |
| `modules/hr/telegram-bots/attendance-bot.service.ts:174` | `'attendance.early_departure'` | Telegram DM |
| `modules/hr/telegram-bots/attendance-bot.service.ts:186` | `'attendance.employee_blocked'` | Telegram DM |

### 2.4 HR — Telegram Bots (LMS)

| File | Event String | Handler Method |
|---|---|---|
| `modules/hr/telegram-bots/learning-bot.service.ts:247` | `'lms.course_assigned'` | Telegram notification |
| `modules/hr/telegram-bots/learning-bot.service.ts:265` | `'lms.certificate_issued'` | Telegram notification |

### 2.5 HR — Telegram Bots (Recruitment)

| File | Event String | Handler Method |
|---|---|---|
| `modules/hr/telegram-bots/telegram-bots-cron-recruitment.service.ts:94` | `'vacancy.published'` | Telegram broadcast |
| `modules/hr/telegram-bots/telegram-bots-cron-recruitment.service.ts:147` | `'candidate.applied'` | Telegram notification |
| `modules/hr/telegram-bots/telegram-bots-cron-recruitment.service.ts:176` | `'candidate.stage_changed'` | Telegram notification |
| `modules/hr/telegram-bots/telegram-bots.service.ts` (cron) | `'incident.created'` | Telegram notification |

### 2.6 HR — Telegram Bots (PIP / HrV2Events)

Source: `modules/hr/telegram-bots/telegram-bots-pip-events.service.ts`

| Event | HrV2Events Constant | Handler |
|---|---|---|
| `:38` | `HrV2Events.PIP_STARTED` | Telegram |
| `:46` | `HrV2Events.PIP_PROGRESS_UPDATED` | Telegram |
| `:52` | `HrV2Events.PIP_COMPLETED` | Telegram |
| `:58` | `HrV2Events.PIP_FAILED` | Telegram |
| `:64` | `HrV2Events.DISCIPLINE_ISSUED` | Telegram |
| `:70` | `HrV2Events.GAMIFICATION_BADGE_AWARDED` | Telegram |
| `:76` | `HrV2Events.GAMIFICATION_POINTS_AWARDED` | Telegram |
| `:82` | `HrV2Events.CANDIDATE_HIRED` | Telegram |
| `:92` | `HrV2Events.ATTENDANCE_LATE` | Telegram |
| `:98` | `HrV2Events.ADAPTATION_AT_RISK` | Telegram |
| `:119` | `HrV2Events.OFFBOARDING_STARTED` | Telegram |
| `:125` | `HrV2Events.VACANCY_PUBLISHED_INTERNAL` | Telegram |
| `:140` | `HrV2Events.AI_INTERVIEW_COMPLETED` | Telegram |
| `:161` | `HrV2Events.AI_INTERVIEW_CANCELLED` | Telegram |

Source: `modules/hr/telegram-bots/telegram-bots.service.ts`

| Line | HrV2Events Constant | Handler |
|---|---|---|
| `:113` | `HrV2Events.EMPLOYEE_BLOCKED` | Telegram |
| `:122` | `HrV2Events.EMPLOYEE_UNBLOCKED` | Telegram |
| `:131` | `HrV2Events.DAILY_REPORT_OVERDUE` | Telegram |
| `:141` | `HrV2Events.DAILY_REPORT_REMINDER` | Telegram |
| `:153` | `HrV2Events.VISITOR_CHECKED_IN` | Telegram |
| `:162` | `HrV2Events.SHIFT_REMINDER` | Telegram |
| `:171` | `HrV2Events.DOCUMENT_SUBMITTED` | Telegram |
| `:180` | `HrV2Events.DOCUMENT_APPROVED` | Telegram |
| `:189` | `HrV2Events.DOCUMENT_REJECTED` | Telegram |

### 2.7 HR Recruitment Gateway

| File | Event | Handler |
|---|---|---|
| `modules/hr/recruitment/recruitment.gateway.ts:119` | `CANDIDATE_STAGE_CHANGED_EVENT` (constant) | WebSocket push |

### 2.8 POS Events

Source: `modules/pos/application/event-handlers/pos-secondary-events.handler.ts`

| Line | Event String | Handler |
|---|---|---|
| `:30` | `'pos.request.pending'` | Log/notification |
| `:37` | `'pos.request.approved'` | Log/notification |
| `:51` | `'pos.request.rejected'` | Log/notification |
| `:59` | `'pos.request.issued'` | Log/notification |
| `:64` | `'pos.damage.qc_required'` | QC trigger |
| `:76` | `'pos.inventory_count.started'` | Log |
| `:82` | `'pos.inventory_count.completed'` | Log |
| `:91` | `'pos.stock.low_alert'` | Alert |
| `:97` | `'pos.stock.expiry_alert'` | Alert |
| `:103` | `'pos.gl.approved'` | GL post |
| `:109` | `'pos.gl.rejected'` | GL reject |
| `:119` | `'hr.employee.exit'` | HR offboarding sync |

Source: `modules/pos/application/event-handlers/pos.events.ts`

| Line | Event String |
|---|---|
| `:56` | `'pos.movement.data.created'` |
| `:94` | `'pos.movement.data.pending'` |
| `:108` | `'pos.movement.data.approved'` |
| `:166` | `'pos.movement.data.completed'` |
| `:176` | `'pos.movement.data.cancelled'` |
| `:184` | `'pos.movement.data.ai_processing'` |
| `:191` | `'pos.movement.data.qc_approved'` |
| `:197` | `'pos.movement.data.qc_rework'` |
| `:203` | `'pos.movement.data.qc_rejected'` |
| `:209` | `'pos.qc.decision'` |

---

## 3. Event Emitter Inventory (selected critical emitters)

| File | Line | Event Emitted | Has Listener? |
|---|---|---|---|
| `cron/absence-block.cron.ts` | 73 | `'employee.absence.day1'` | **NO** |
| `cron/absence-block.cron.ts` | 106 | `'employee.absence.day2'` | **NO** |
| `cron/absence-block.cron.ts` | 170 | `'employee.blocked'` | **NO** |
| `cron/absence-block.cron.ts` | 171 | `'access.chip.revoke'` | **NO** |
| `cron/absence-block.cron.ts` | 172 | `'iot.attendance.block'` | **NO** |
| `cron/absence-block.cron.ts` | 173 | `'email.account.disable'` | **NO** |
| `modules/kanban/application/kanban.service.ts` | 66 | `'kanban.task.created'` | **NO** |
| `modules/kanban/application/kanban.service.ts` | 98 | `'kanban.task.moved'` | **NO** |
| `modules/kanban/application/kanban.service.ts` | 105 | `'kanban.task.assigned'` | **NO** |
| `modules/kanban/application/kanban.service.ts` | 111 | `'notifications.create'` | **NO** |
| `modules/kanban/application/kanban.service.ts` | 129 | `'kanban.task.deleted'` | **NO** |
| `modules/ai-agents/mes/mes-monitor.service.ts` | 201 | `'mes.machine.emergency_stop'` | YES (ai-alerts.service.ts:55) |
| `modules/ai-agents/mes/mes-monitor.service.ts` | 213 | `'mes.machine.anomaly_alert'` | YES (ai-alerts.service.ts:70) |
| `modules/ai-agents/sales/sales-copilot.service.ts` | 232 | `'sales.copilot.auto_price'` | YES (ai-alerts.service.ts:92) |
| `modules/ai-agents/sales/sales-copilot.service.ts` | 252 | `'sales.copilot.director_approval_required'` | YES (ai-alerts.service.ts:151) |
| `modules/ecommerce/ecommerce.service.ts` | 210 | `ERP_EVENTS.WEBSITE_ORDER_CREATED` | YES (via bridge) |
| `modules/finance/application/commands/record-payment.handler.ts` | 107 | `ERP_EVENTS.INVOICE_FULLY_PAID` | YES |
| `modules/communication-center/presentation/cc-webhook.controller.ts` | 99 | `'cc.spawn'` | YES (cc-event.listener.ts) |
| `modules/pos/application/services/pos-movement.service.ts` | 170 | `'pos.movement.data.created'` | YES (pos.events.ts:56) |
| `modules/ai-agents/planning/planner.service.ts` | 213 | `'ai.planner.deadline_risk'` | **NO** |
| `modules/agents/cashflow-agent.service.ts` | 123 | `'finance.fraud_suspected'` | **NO** |
| `modules/agents/inventory-agent.service.ts` | 90 | `'stock.critical'` | **NO** |
| `modules/agents/production-agent.service.ts` | 81 | `'production.delayed'` | **NO** |
| `modules/agents/quality-agent.service.ts` | 47 | `'quality.defect_rising'` | **NO** |
| `modules/agents/security-agent.service.ts` | 69 | `'security.emergency'` | **NO** |

---

## 4. EventBridgeService — CQRS → EventEmitter2

Source: `apps/api/src/modules/shared/events/event-bridge.service.ts`

The bridge maps CQRS event class names to ERP_EVENTS strings. Mapped events:

`DealWonEvent`, `InvoiceFullyPaidEvent`, `InvoicePartiallyPaidEvent`, `AdvanceBypassApprovedEvent`, `DeliveryCompletedEvent`, `MroMaintenanceStopEvent`, `WmsGoodsIssuedEvent`, `PpReleasedEvent`, `WmsFgReceivedEvent`, `MesCompletedEvent`, `MesToHr360Event`, `StockUpdatedEvent`, `AdvanceApprovedEvent`, `OrderCreatedEvent`, `QcFailedEvent`, `CertificateExpiredEvent`, `DesignApprovedEvent`, `LabTestPassedEvent`, `CertificateExpiredLiveEvent`, `WebsiteOrderCreatedEvent`, `WebsiteContactSubmittedEvent`, `DocumentSubmittedEvent`, `DocumentApprovedEvent`, `DocumentRejectedEvent`, `CertificateEarnedEvent`, `CrmLeadCreatedEvent`, `HrCandidateAddedEvent`, `FinanceInvoiceCreatedEvent`, `SosAlertRaisedEvent`, `CcSpawnRequestedEvent`, `TechThreeCheckpointEvent`, `PosMovementCompletedEvent`, `DailyReportSubmittedEvent`, `OrderStatusChangedEvent`

Notable comment: `PosMovementCreatedEvent` is **intentionally not mapped** to avoid double-fire (the service emits both the typed event and the legacy string topic directly).

---

## 5. Telegram Module

**Core service:** `apps/api/src/telegram/telegram.service.ts`  
Uses `node-telegram-bot-api` with `polling: false` (webhook mode).  
Token: `process.env.TELEGRAM_BOT_TOKEN`

**Telegram handler files:**

| File | Domain |
|---|---|
| `telegram/handlers/ai-reports.handler.ts` | AI report delivery |
| `telegram/handlers/crm.handler.ts` | CRM deal notifications |
| `telegram/handlers/hr.handler.ts` | HR notifications |
| `telegram/handlers/kanban.handler.ts` | Kanban task notifications |
| `telegram/handlers/lms.handler.ts` | LMS certificate/course |
| `telegram/handlers/production.handler.ts` | Production alerts |
| `telegram/handlers/warehouse.handler.ts` | Warehouse alerts |

**What triggers Telegram:**
1. Absence block cron → employee blocked (emits `'employee.blocked'` — no listener!)
2. HR telegram-bots services → HrV2Events (PIP, discipline, attendance, recruitment) — have listeners
3. `TelegramService.sendDirectorDailyReport()` — called by daily-report cron
4. `KanbanService` emits `kanban.task.assigned` — no listener, so Telegram handler in `telegram/handlers/kanban.handler.ts` may not be triggered

---

## 6. Orphan Analysis

### Orphan Emitters (emit with no listener):
- `'employee.absence.day1'`, `'employee.absence.day2'` — absence cron notifies nobody
- `'employee.blocked'`, `'access.chip.revoke'`, `'iot.attendance.block'`, `'email.account.disable'` — all absence-block side effects silently dropped
- `'kanban.task.created'`, `'kanban.task.moved'`, `'kanban.task.assigned'`, `'kanban.task.deleted'`, `'notifications.create'`
- `'ai.planner.deadline_risk'`
- `'finance.fraud_suspected'`, `'stock.critical'`, `'production.delayed'`, `'quality.defect_rising'`, `'security.emergency'` — AI agent outputs with no downstream consumers

### Orphan Listeners (handler registered but no known emitter):
- `'attendance.early_departure'` (`attendance-bot.service.ts:174`) — no emitter found in grep
- `'hr.room_anomaly'` and `'hr.fatigue_alert'` (territory gateway) — no emitter found
- Some `HrV2Events.*` listeners — emitter locations were not fully traced

---

## 7. EventEmitter2 Injection

EventEmitter2 is injected via standard NestJS DI:
```typescript
constructor(private readonly eventEmitter: EventEmitter2) {}
// or
constructor(private readonly events: EventEmitter2) {}
```

No custom injection tokens are used for EventEmitter2 itself. The CQRS EventBus uses `@nestjs/cqrs` standard injection. The agent event bus uses a wrapper service (`AgentEventBusService`) that wraps EventEmitter2.

---

## Summary

The event system has three parallel mechanisms in various states of migration. The `EventBridgeService` partially unifies CQRS → EventEmitter2 but only for ~33 mapped event classes. The most critical operational gap is the **absence-block cron**: it correctly identifies and blocks employees but all downstream effects (`access.chip.revoke`, `iot.attendance.block`, `email.account.disable`) are emitted to listeners that do not exist — meaning chip access revocation, IoT block, and email disabling are silently skipped. The kanban task assignment notification system (`notifications.create`) similarly emits but nobody listens.

---

## Gaps Table

| Issue | Severity | Evidence | Impact | Suggested Fix |
|---|---|---|---|---|
| `'access.chip.revoke'` has no listener | P0 | `absence-block.cron.ts:171` | Employee badge access NOT revoked on block | Add handler in IoT/security module |
| `'email.account.disable'` has no listener | P0 | `absence-block.cron.ts:173` | Employee email NOT disabled on block | Add handler in integration/auth module |
| `'iot.attendance.block'` has no listener | P0 | `absence-block.cron.ts:172` | IoT device access NOT revoked | Add handler in IoT module |
| `'notifications.create'` (kanban) has no listener | P1 | `kanban.service.ts:111` | Task assignment push notifications never sent | Add notifications module listener |
| `'kanban.task.assigned'` has no listener | P1 | `kanban.service.ts:105` | Telegram/webhook for task assignment dropped | Wire to `telegram/handlers/kanban.handler.ts` |
| AI agent outputs have no consumers | P1 | `cashflow-agent.service.ts:123`, `quality-agent.service.ts:47` | Fraud, defect, delay alerts silently dropped | Add listeners or remove emit calls |
| `'ai.planner.deadline_risk'` has no listener | P1 | `planner.service.ts:213` | Planning risk alerts never acted on | Add deadline risk handler |
| `CertificateExpiredEvent` — emitter missing | P1 | `cert-expiry.handler.ts:33` comment | LMS cert expiry handler exists but never fires | Publish event from LMS cert expiry check |
| `PosMovementCreatedEvent` double-emit comment | P2 | `event-bridge.service.ts` comment | Intentional omission but poorly documented | Add explicit warning in EventBridgeService |
| `'attendance.early_departure'` has no known emitter | P2 | `attendance-bot.service.ts:174` | Listener registered for event never emitted | Find emitter or remove dead listener |

---

## Open Questions / UNVERIFIED

- Does `telegram/handlers/kanban.handler.ts` use `@OnEvent('kanban.task.*')` — if so it is never triggered?
- Are HrV2Events emitters confirmed to use the exact same string values as the `@OnEvent` constants?
- Is `TELEGRAM_BOT_TOKEN` configured in production or is the Telegram bot completely inactive?
- Does `'attendance.late_arrival'` have two listeners (territory.gateway + attendance-bot.service)? This is intentional (WebSocket push AND Telegram DM) — but needs runtime confirmation that both fire.
