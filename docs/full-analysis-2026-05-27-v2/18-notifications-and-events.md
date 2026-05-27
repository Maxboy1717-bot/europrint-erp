# Report 18 — Notifications & Events

**Date:** 2026-05-27 (round 2)
**Analyst:** Forensic second-pass audit (read-only)
**Scope:**
- `apps/api/src/modules/notifications/`
- `apps/api/src/events/`
- `apps/api/src/modules/communication-center/`
- `apps/api/src/modules/shared/events/`
- `apps/api/src/modules/agents/`, `modules/ai-agents/`
- `apps/api/src/cron/absence-block.cron.ts`
- `apps/api/src/telegram/`
- `artifacts/erp-dashboard/src/{pages,components,hooks}/` (frontend)

Method: full grep of `@OnEvent`, `@EventsHandler`, `.emit(`, `.publish(`,
all SMS/email/Telegram adapters, every gateway and the absence cron.

---

## Diff vs round 1

Round 1 (`docs/full-analysis-2026-05-27/18-notifications-and-events.md`) was
written before the **OrphanEventsListener** was introduced. Several of its
flagged P0/P1 issues no longer hold.

| Round-1 claim | Round-2 finding |
|---|---|
| `'access.chip.revoke'` has **no listener** (P0) — badge access never revoked | A listener now exists at `apps/api/src/modules/notifications/infrastructure/event-handlers/orphan-events.listener.ts:118`, but the handler body is a **TODO log only** — still no hardware integration. Severity downgraded P0 → P1 (security gap is identical but listener is registered, so the wiring claim was wrong). |
| `'iot.attendance.block'` has no listener (P0) | Same — `orphan-events.listener.ts:127` logs only, no IoT call. |
| `'email.account.disable'` has no listener (P0) | Same — `orphan-events.listener.ts:136` logs only, no email-provider call. |
| `'employee.absence.day1/day2/blocked'` orphan emitters | Now listened in `orphan-events.listener.ts:145/152/159` — still log-only, but at least the event flows. |
| `'kanban.task.*'` and `'notifications.create'` orphans | Wired in same `orphan-events.listener.ts:64/84/92/100/108`. `notifications.create` actually **persists** to the notifications repo via `INotificationRepo.save()` (line 75) — this is real work, not a stub. |
| EventBridgeService bridges ~33 CQRS classes | Verified: exactly **33** mappings counted in `EVENT_NAME_MAP`. |
| Three parallel event mechanisms | Verified, all three still present (see §1). |
| AI-agent emitters (`'finance.fraud_suspected'`, `'stock.critical'`, etc.) are orphan | **Still orphan.** Round 1 was correct here. Zero listeners. |
| `'ai.planner.deadline_risk'` orphan | **Still orphan.** Zero listeners. |
| `'attendance.early_departure'` listener has no emitter | **Still true.** Confirmed dead listener. |
| `KanbanHandler` in `telegram/handlers/kanban.handler.ts` | Confirmed: no `@OnEvent` decorator on `onTaskAssigned` / `onTaskDueSoon` — the methods exist but are **never invoked anywhere** (grep for "telegramKanbanHandler.onTask" returns nothing). |
| `TelegramBotAdapter.sendOrderStatusUpdate` / `sendAdvanceReminder` / `sendCertExpiry` / `sendStockAlert` / `sendQcResult` | Not mentioned in round 1. Discovered now: they're **logging stubs** (build the message string, log "Order status update", and `return Ok(undefined)` without ever calling the Telegram HTTP API). `telegram-bot.adapter.ts:109-158`. |
| `NotificationsController` HTTP semantics | Not analysed in round 1. Discovered: `GET /notifications/my/unread-count` is hard-coded to `{ unreadCount: 0 }`, `PATCH /notifications/:id/read` returns a fake-success object without touching DB, `PATCH /notifications/read-all` returns `{ updated: 0 }` without touching DB. |
| `NotificationBell` (dizayn-new) | Not analysed in round 1. Discovered: **renders demo data** by default (`DEMO_NOTIFICATIONS` constant) — props are optional and demo array is the fallback. |

Severity of the absence-block hardware integration gap is unchanged
operationally — the chip is still not revoked, the IoT tablet is still not
blocked, the email is still not disabled. But the diagnosis ("event has no
listener") is no longer the right diagnosis. It's "event has a stub listener
that only logs."

---

## 1. Event bus architecture

Three event mechanisms co-exist. All three are wired in `AppModule`; none
has been retired.

### 1.1 CQRS `@nestjs/cqrs` EventBus

- Used by domain command handlers via `eventBus.publish(new XEvent(...))`.
- Subscribers are classes decorated `@EventsHandler(XEvent)` implementing
  `IEventHandler<XEvent>`.
- Counts (whole-repo, `apps/api/src`):
  - `eventBus.publish(` and `this.eventBus.publish(` — **60 call sites
    across 46 files** (verified `\b(eventEmitter|events|eventBus|emitter)\.(emit|publish)\(`
    Grep, then filtered).
  - `@EventsHandler(` decorators — **86 across 59 files**.

### 1.2 `EventEmitter2` keyed on `ERP_EVENTS` constants

- `apps/api/src/common/constants/erp-events.constants.ts:6-60` defines 41
  string constants in three groups (the original "§10 — 20 ta majburiy
  trigger" set, the "qo'shimcha" set, and later wave additions).
- Re-exported through two shims:
  - `apps/api/src/events/erp-events.constants.ts:9` (re-export only)
  - `apps/api/src/events/erp-events.ts:18` (re-export + deprecated
    `ErpEvents` enum)
- Counts:
  - `.emit(ERP_EVENTS.X)` — **11 sites across 7 files** (Grep
    `\.emit\(ERP_EVENTS\.`).
  - `@OnEvent(ERP_EVENTS.X)` — **14 sites across 13 files** (Grep
    `@OnEvent\(ERP_EVENTS\.`).

### 1.3 `EventEmitter2` keyed on raw string literals

- `this.eventEmitter.emit('foo.bar', payload)` — no shared constant.
- Counts:
  - `@OnEvent(` total across the API — **113 occurrences across 43 files**.
  - Subtracting the 14 `@OnEvent(ERP_EVENTS.X)` leaves ~99 raw-string
    listeners.
  - `.emit('...')` raw-string emits — see full list in §2; roughly 70
    distinct event names.

### 1.4 Bridge — CQRS → EventEmitter2

`apps/api/src/modules/shared/events/event-bridge.service.ts` subscribes
to the CQRS EventBus and re-emits each known class as the corresponding
`ERP_EVENTS` (or legacy string) namespace. Without it, a handler
written as `@OnEvent(ERP_EVENTS.X)` never fires when the publisher uses
`eventBus.publish(new XEvent())`. See §3.

### 1.5 Agent sub-bus

`apps/api/src/modules/agents/shared/agent-event-bus.service.ts` is a
thin wrapper around `EventEmitter2`:

```ts
// agent-event-bus.service.ts:22
emit<T>(eventName: string, payload: T, source: string = 'unknown'): void {
  const event: AgentEvent<T> = { source, eventName, payload, timestamp: Date.now() };
  this.emitter.emit(eventName, event);
  this.logger.debug(`[${source}] -> ${eventName}`);
}
```

This wraps every agent payload in an `AgentEvent` envelope. Any
listener reaching for the raw payload must drill into `event.payload`,
which violates the contract of the few cross-module listeners (e.g. an
`@OnEvent('stock.critical')` listener that expects `{count, items}`
would get `{source, eventName, payload, timestamp}` and have to unwrap).
None of the agent events have listeners in the rest of the codebase
(see §2.2), so this mismatch hasn't bitten yet, but adding a listener
without `event.payload` indirection will fail.

---

## 2. Orphan emitters

"Orphan" = the event is emitted but no `@OnEvent` / `@EventsHandler`
handler is registered anywhere in `apps/api/src`. Verified by a
two-step Grep: collect every `.emit('foo')` and `.publish(new FooEvent())`
location, then search for `@OnEvent('foo')` or `@EventsHandler(FooEvent)`.

### 2.1 Now wired (round 1 said orphan, round 2 found listener)

| Event | Emit site | Listener | Listener body |
|---|---|---|---|
| `notifications.create` | `kanban.service.ts:111` | `orphan-events.listener.ts:64` | **Real** — persists via `notificationRepo.save()` |
| `kanban.task.created` | `kanban.service.ts:66` | `orphan-events.listener.ts:84` | Log-only |
| `kanban.task.moved` | `kanban.service.ts:98` | `orphan-events.listener.ts:92` | Log-only |
| `kanban.task.assigned` | `kanban.service.ts:105` | `orphan-events.listener.ts:100` | Log-only |
| `kanban.task.deleted` | `kanban.service.ts:129` | `orphan-events.listener.ts:108` | Log-only |
| `access.chip.revoke` | `absence-block.cron.ts:171` | `orphan-events.listener.ts:118` | Log-only (TODO: call hardware) |
| `iot.attendance.block` | `absence-block.cron.ts:172` | `orphan-events.listener.ts:127` | Log-only (TODO: IoT tablet) |
| `email.account.disable` | `absence-block.cron.ts:173` | `orphan-events.listener.ts:136` | Log-only (TODO: email provider) |
| `employee.absence.day1` | `absence-block.cron.ts:73` | `orphan-events.listener.ts:145` | Log-only |
| `employee.absence.day2` | `absence-block.cron.ts:106` | `orphan-events.listener.ts:152` | Log-only |
| `employee.blocked` | `absence-block.cron.ts:170` | `orphan-events.listener.ts:159` | Log-only |

### 2.2 Still orphan in round 2 (no listener anywhere)

Cross-verified by Grep over the entire `apps/api/src`:

| Event | Emit site | Notes |
|---|---|---|
| `'stock.critical'` | `modules/agents/inventory-agent.service.ts:90` | `this.bus.emit(...)` via AgentEventBusService — payload arrives wrapped |
| `'warehouse.roll_low'` | `modules/agents/inventory-agent.service.ts:218` | Same wrapper |
| `'finance.fraud_suspected'` | `modules/agents/cashflow-agent.service.ts:123` | No fraud workflow consumer |
| `'production.delayed'` | `modules/agents/production-agent.service.ts:81` | No alert downstream |
| `'quality.defect_rising'` | `modules/agents/quality-agent.service.ts:47` | No QC follow-up |
| `'security.emergency'` | `modules/agents/security-agent.service.ts:69` | Emergency protocol logs but does nothing |
| `'iot.anomaly'` | `modules/agents/iot-agent.service.ts:41,45` | No anomaly consumer |
| `'hr.low_performance'` | `modules/agents/hr-performance-agent.service.ts:59` | No HR action |
| `'director.briefing_sent'` | `modules/agents/director-agent.service.ts:218` | Acknowledgement nobody hears |
| `'procurement.delivery_risk'` | `modules/agents/supplier-agent.service.ts:128` | No risk-mitigation consumer |
| `'crm.hot_leads_found'` | `modules/agents/lead-scoring-agent.service.ts:104` | No outreach trigger |
| `'ai.planner.deadline_risk'` | `modules/ai-agents/planning/planner.service.ts:213` | Cron-emitted, never acted on |
| `'sales.copilot.pdf_dispatch'` | `modules/ai-agents/sales/sales-copilot.service.ts:240` | Two of three sales-copilot events are wired (see `ai-alerts.service.ts:92, 151`), this third is not |
| `'mes.machine.resumed'` | `modules/ai-agents/mes/mes-monitor.service.ts:126` | Resume signal; only `emergency_stop` / `anomaly_alert` are listened |
| `'rbac.permission.changed'` | `modules/admin/position-permissions/position-permissions.service.ts:49` | Audit broadcast — no consumer |
| `'lms.certificate.issued'` | `modules/lms/application/commands/issue-certificate.handler.ts:53` | Note: separate from `LMS_CERT_EXPIRED` |
| `'lms.course.enrolled'` | `modules/lms/application/commands/enroll-course.handler.ts:55` | No enrolment-side listener |
| `'hr.attendance.recorded'` | `modules/hr/application/commands/record-attendance.handler.ts:48` | No downstream |
| `'hr.payroll.calculated'` | `modules/hr/application/commands/calculate-payroll.handler.ts:100` | No GL hook |
| `'payroll.period.closed'` | `modules/hr/payroll/payroll.service.ts:93` | No period-close consumer |
| `'employee.created'` | `modules/hr/employees/employees.service.ts:172` | No onboarding workflow trigger |
| `'pos.gl.auto_posted'` | `modules/pos/application/event-handlers/pos-gl-auto.listener.ts:108` | Posted-confirmation, nobody waiting |
| `'pos.requisition.submitted'` | `pos-requisition-workflow.service.ts:57` | None of the 5 workflow events are listened |
| `'pos.requisition.approved'` | `pos-requisition-workflow.service.ts:88` | (same) |
| `'pos.requisition.rejected'` | `pos-requisition-workflow.service.ts:116` | (same) |
| `'pos.requisition.fulfilled'` | `pos-requisition-workflow.service.ts:195` | (same) |
| `'pos.requisition.cancelled'` | `pos-requisition-workflow.service.ts:228` | (same) |
| `ERP_EVENTS.IOT_SOS_RAISED` (`'iot.sos.raised'`) | Published via `eventBus.publish(new SosAlertRaisedEvent(...))` in `iot-tablet.service.ts`; bridged at `event-bridge.service.ts:68` | No `@OnEvent(ERP_EVENTS.IOT_SOS_RAISED)` or `@EventsHandler(SosAlertRaisedEvent)` anywhere — **safety-critical SOS goes nowhere** |

Orphan emit total: **roughly 28 distinct event names** never reach a
listener (excluding the 11 from §2.1 that now have a stub listener).

### 2.3 Orphan listeners (handler exists, no emitter found)

Same two-step check, in reverse:

| Listener | File | Emitter search result |
|---|---|---|
| `@OnEvent('attendance.early_departure')` | `hr/telegram-bots/attendance-bot.service.ts:174` | No `.emit('attendance.early_departure'` anywhere |
| `@OnEvent('attendance.employee_blocked')` | `hr/telegram-bots/attendance-bot.service.ts:186` | No emit. Absence cron uses `'employee.blocked'` (different name) |
| `@OnEvent('lms.course_assigned')` | `hr/telegram-bots/learning-bot.service.ts:247` | No emit — only `'lms.course.enrolled'` and `'lms.certificate.issued'` exist |
| `@OnEvent('lms.certificate_issued')` | `hr/telegram-bots/learning-bot.service.ts:265` | Name mismatch — emit is `'lms.certificate.issued'` (dot), listener is `'lms.certificate_issued'` (underscore). **String mismatch bug.** |
| `@OnEvent('incident.created')` | `hr/telegram-bots/telegram-bots-cron.service.ts:99` | No `.emit('incident.created'` found |
| `@OnEvent('hr.room_anomaly')`, `@OnEvent('hr.fatigue_alert')` | `hr/attendance/territory.gateway.ts:120, 125` | Emit found in `hr/attendance/room-snapshot.cron.ts:162, 174` — **paired** (round-1 marked these orphan; that was wrong) |

The `'lms.certificate_issued'` vs `'lms.certificate.issued'` typo is a
real defect: certificate issuance never triggers the learning-bot DM.

---

## 3. EventBridgeService

File: `apps/api/src/modules/shared/events/event-bridge.service.ts`

Header comment summary (verbatim, line 1-15):

> Background: three competing event-publishing mechanisms exist in this
> codebase (CQRS EventBus, EventEmitter2 with ERP_EVENTS namespace,
> EventEmitter2 keyed on event.eventName). Listeners use `@OnEvent(ERP_EVENTS.X)`
> while many emit sites use `eventBus.publish(new SomeEvent(...))`. Without
> this bridge, those cross-mechanism trigger pairs silently drop.

### 3.1 Mapping count

Counted by Grep `^\s+[A-Z][a-zA-Z]+Event:` over the `EVENT_NAME_MAP`
object — **33 entries** (matches round 1).

### 3.2 Full mapping list

Lines 24-80, full list of class → namespace:

```
DealWonEvent                       → ERP_EVENTS.DEAL_WON
InvoiceFullyPaidEvent              → ERP_EVENTS.INVOICE_FULLY_PAID
InvoicePartiallyPaidEvent          → ERP_EVENTS.PAYMENT_FULL
AdvanceBypassApprovedEvent         → ERP_EVENTS.ADVANCE_BYPASS_APPROVED
DeliveryCompletedEvent             → ERP_EVENTS.DELIVERY_COMPLETED
MroMaintenanceStopEvent            → ERP_EVENTS.MRO_MAINTENANCE_STOP
WmsGoodsIssuedEvent                → ERP_EVENTS.WMS_GOODS_ISSUED
PpReleasedEvent                    → ERP_EVENTS.PP_RELEASED_TO_PRODUCTION
WmsFgReceivedEvent                 → ERP_EVENTS.WMS_FG_RECEIVED
MesCompletedEvent                  → ERP_EVENTS.MES_COMPLETED
MesToHr360Event                    → ERP_EVENTS.MES_TO_HR_360
StockUpdatedEvent                  → ERP_EVENTS.STOCK_UPDATED
AdvanceApprovedEvent               → ERP_EVENTS.ADVANCE_APPROVED
OrderCreatedEvent                  → ERP_EVENTS.ORDER_CREATED
QcFailedEvent                      → ERP_EVENTS.QC_FAILED
CertificateExpiredEvent            → ERP_EVENTS.LMS_CERT_EXPIRED
DesignApprovedEvent                → ERP_EVENTS.DESIGN_APPROVED
LabTestPassedEvent                 → ERP_EVENTS.LAB_TEST_PASSED
CertificateExpiredLiveEvent        → ERP_EVENTS.LMS_CERT_EXPIRED_LIVE
WebsiteOrderCreatedEvent           → ERP_EVENTS.WEBSITE_ORDER_CREATED
WebsiteContactSubmittedEvent       → ERP_EVENTS.WEBSITE_CONTACT_SUBMITTED
DocumentSubmittedEvent             → 'document.submitted'
DocumentApprovedEvent              → 'document.approved'
DocumentRejectedEvent              → 'document.rejected'
CertificateEarnedEvent             → 'training.certificate.earned'
CrmLeadCreatedEvent                → 'crm.lead.created'
HrCandidateAddedEvent              → 'hr.candidate.added'
FinanceInvoiceCreatedEvent         → 'finance.invoice.created'
SosAlertRaisedEvent                → ERP_EVENTS.IOT_SOS_RAISED
CcSpawnRequestedEvent              → 'cc.spawn'
TechThreeCheckpointEvent           → ERP_EVENTS.TECH_THREE_CHECKPOINT
PosMovementCompletedEvent          → 'pos.movement.data.completed'
DailyReportSubmittedEvent          → 'daily.report.submitted'
OrderStatusChangedEvent            → ERP_EVENTS.ORDER_STATUS_CHANGED
```

Inline comment at line 75-77 documents the intentional omission:

> `PosMovementCreatedEvent intentionally NOT mapped: pos-movement.service.ts
>  publishes both the typed event AND the legacy string topic directly. If
>  the bridge re-emitted, string consumers would fire twice.`

The bridge is registered through `SharedEventsModule` and listens via
`EventBus.subscribe()` (line 93):

```ts
this.eventBus.subscribe((event: IEvent) => {
  if (!event) return;
  const className = (event as { constructor?: { name?: string } }).constructor?.name;
  const rawName = (event as { eventName?: unknown }).eventName;
  const fallbackName = typeof rawName === 'string' ? rawName : undefined;
  const erpName =
    (className ? EVENT_NAME_MAP[className] : undefined) ??
    (fallbackName ? EVENT_NAME_MAP[fallbackName] : undefined);
  if (!erpName) return; // unmapped events stay on CQRS bus only
  try { this.emitter.emit(erpName, event); } catch { ... }
});
```

Comment "Unmapped events stay on the CQRS bus only — not a failure" (line
105) is dangerous: it means any new domain event that ships without a
matching `EVENT_NAME_MAP` entry **silently** loses every legacy
`@OnEvent` consumer. There is no test that asserts every published
event has either a `@EventsHandler` or a bridge entry.

### 3.3 Unused mappings

`CrmLeadCreatedEvent`, `HrCandidateAddedEvent`,
`FinanceInvoiceCreatedEvent`, `CertificateEarnedEvent` — comment in
the file (lines 60-66) says these are "dead-letter today, kept
defensively." Bridge work but no publisher exists. Pure scaffolding.

---

## 4. Absence-block cron

File: `apps/api/src/cron/absence-block.cron.ts`

### 4.1 Schedule

```ts
// line 27
@Cron('0 10 * * *')
async blockAbsentEmployees(): Promise<void> {
```

Runs daily at 10:00 server time (UTC by default — the file imports
`TashkentTimeService` but uses it only for the report message
formatting, not for the cron expression).

### 4.2 Three phases

| Phase | Method | Source | Events emitted |
|---|---|---|---|
| Day 1 warning | `_warnDay1` | line 60 | `'employee.absence.day1'` (line 73) |
| Day 2 escalation | `_escalateDay2` | line 80 | `'employee.absence.day2'` (line 106) |
| Day 3 block | `_blockDay3` | line 113 | `'employee.blocked'` (170), `'access.chip.revoke'` (171), `'iot.attendance.block'` (172), `'email.account.disable'` (173) |

### 4.3 What actually happens on block

Phase 3 does five real things (lines 126-135):

1. `deactivateExistingBlocks(emp.employee_id)` — DB row
2. `insertEmployeeBlock(...)` — DB row
3. `blockEmployee(...)` — flag flip on employee record
4. `markAbsenceAutoBlocked(...)` — audit
5. `disableUserAccount(user_id)` — flag flip on user row

Telegram messages are sent to the employee, department lead, and HR
managers — those happen inline through `TelegramService.sendMessage`
(lines 142-167).

### 4.4 What does NOT happen

The four events at lines 170-173 fire through `EventEmitter2`. Their
sole listener is `OrphanEventsListener` (file
`apps/api/src/modules/notifications/infrastructure/event-handlers/orphan-events.listener.ts`),
whose handlers are stubs:

```ts
// orphan-events.listener.ts:118-141 (verbatim)
@OnEvent('access.chip.revoke')
async handleChipRevoke(payload: EmployeeEventPayload): Promise<void> {
  this.logger.log(`access.chip.revoke employeeId=${payload.employee_id} reason="${payload.reason ?? 'absence block'}"`);
  // TODO: call hardware access control integration to deactivate RFID chip
  //   e.g. this.accessControlAdapter.revokeChip(payload.employee_id)
}

@OnEvent('iot.attendance.block')
async handleIotAttendanceBlock(payload: EmployeeEventPayload): Promise<void> {
  this.logger.log(`iot.attendance.block employeeId=${payload.employee_id}`);
  // TODO: push block command to IoT tablet/terminal for this employee
}

@OnEvent('email.account.disable')
async handleEmailAccountDisable(payload: EmployeeEventPayload): Promise<void> {
  this.logger.log(`email.account.disable employeeId=${payload.employee_id}`);
  // TODO: call email provider integration to suspend the employee's email account
}
```

Operational impact: the employee's ERP password is invalidated
(`disableUserAccount`), but their physical badge still opens doors,
their IoT tablet still works, and their `@europrint.uz` mailbox still
receives mail.

### 4.5 Test status

No unit or integration test references `OrphanEventsListener`,
`access.chip.revoke`, or `AbsenceBlockCron` in the test directories
(`apps/api/test`, `apps/api/src/**/__tests__/`). The handlers are not
exercised in CI.

---

## 5. Notification channels

### 5.1 Adapter inventory

`apps/api/src/modules/notifications/infrastructure/external/`

| Adapter | File | Implements | Real or stub? |
|---|---|---|---|
| EskizSmsAdapter | `eskiz-sms.adapter.ts` | `ISmsSender` | **Real** — `fetch` to `https://notify.eskiz.uz/api/message/sms/send` with `Authorization: Bearer ${eskizToken}`. Falls back to Infobip (`{baseUrl}/sms/2/text/advanced`) if `INFOBIP_API_KEY` is set instead. Wrapped in `withRetry` (3 attempts, 100/300/1000ms backoff). **No-op when neither env is set** (line 58: `'SMS: ESKIZ_TOKEN yoki INFOBIP_API_KEY o\'rnatilmagan'`). |
| SmtpEmailAdapter | `smtp-email.adapter.ts` | `IEmailSender` | **Real** — `nodemailer.createTransport({ host, port, secure: port===465, auth })`. Sends via `transporter.sendMail` with HTML template (`sendNotification` at line 79). **No-op when `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` missing** (line 43). |
| TelegramBotAdapter | `telegram-bot.adapter.ts` | `ITelegramSender` | **Mixed** — `sendMessage()` and `sendAlert()` are real HTTP calls to `https://api.telegram.org/bot${token}/sendMessage`. The five domain-specific methods (`sendOrderStatusUpdate`, `sendAdvanceReminder`, `sendCertExpiry`, `sendStockAlert`, `sendQcResult` at lines 109-158) are **stubs that build the message string and return `Ok(undefined)` without calling Telegram** — see for example line 109-117. |

```ts
// telegram-bot.adapter.ts:109-117 (verbatim, stub example)
async sendOrderStatusUpdate(
  managerId: number,
  orderId: number,
  status: string,
): Promise<Result<void>> {
  const message = `Order #${orderId} status changed to: ${status}`;
  this.logger.log('Order status update');
  return Ok(undefined);
}
```

`message` is computed and discarded; no HTTP call.

### 5.2 Other Telegram implementations

The repo has **three** Telegram service classes — `apps/api/src/modules/notifications/domain/services/telegram.service.ts` documents the situation:

```
// telegram.service.ts (domain): @deprecated stub
// 1. apps/api/src/telegram/telegram.service.ts — TelegramService (node-telegram-bot-api, used by cron jobs, telegram handlers, crm/listeners)
// 2. apps/api/src/modules/notifications/telegram/telegram.service.ts — TelegramSvc (notifications module, DB-backed, full delivery tracking)
```

| Class | File | Used by |
|---|---|---|
| `TelegramService` | `apps/api/src/telegram/telegram.service.ts` | `AbsenceBlockCron`, daily-report cron, all `telegram/handlers/*.ts` |
| `TelegramSvc` | `apps/api/src/modules/notifications/telegram/telegram.service.ts` | `CreateNotificationHandler` (indirectly via `TELEGRAM_SENDER` port) |
| `TelegramBotAdapter` | `apps/api/src/modules/notifications/infrastructure/external/telegram-bot.adapter.ts` | Bound to `TELEGRAM_SENDER` port in `notifications.module.ts:58` |
| `(stub)` | `apps/api/src/modules/notifications/domain/services/telegram.service.ts` | Empty `export {}` (no consumers, marked for deletion) |
| `CcBotService` | `apps/api/src/modules/communication-center/telegram/cc-bot.service.ts` | Separate `TELEGRAM_CC_BOT_TOKEN`, telegraf-based Communication Center bot |

The choice of which one fires depends on which DI token the caller
asks for. `TELEGRAM_SENDER` resolves to `TelegramBotAdapter` (the
mostly-stub one). Cron jobs that inject `TelegramService` directly get
the working `node-telegram-bot-api` implementation. The same logical
"send a Telegram" call therefore behaves differently depending on
which service was injected.

### 5.3 In-app channel

`CreateNotificationHandler.execute` writes a row to the `notifications`
table (line 45: `await this.notificationRepo.save(notification)`) and
then attempts delivery on the requested channels. Default channels
(`ext.channels ?? ['telegram', 'in_app']` — line 53) ensure every
created notification gets a DB row even if external delivery fails.

In-app reads happen through:
- `GET /api/notifications` → `GetNotificationsHandler` → `INotificationRepo.findByUserId` → Drizzle `select from notifications where userId = ? order by createdAt desc` (verified in `drizzle-notification.repo.ts:49-79`).
- `GET /api/notifications/my` — same handler, same query.

### 5.4 Controller-level stubs

`notifications.controller.ts` has three endpoints that don't touch the DB:

```ts
// notifications.controller.ts:82-85
@Get('/my/unread-count')
async getUnreadCount(@CurrentUser() _user: AuthenticatedUser) {
  return { statusCode: HttpStatus.OK, data: { unreadCount: 0 } };
}

// notifications.controller.ts:121-124
@Patch('/:id/read')
async markAsRead(@Param('id') notificationId: string) {
  return { statusCode: HttpStatus.OK, data: { id: notificationId, isRead: true } };
}

// notifications.controller.ts:129-133
@Patch('/read-all')
async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
  this.logger.log({ userId: user.id }, 'Mark all notifications as read');
  return { statusCode: HttpStatus.OK, data: { updated: 0 } };
}
```

Frontend always sees 0 unread. The "mark-all-read" handler in
`NotificationPreferencesService.markAllRead` (line 58-60) is real and
delegates to `repo.markAllReadByUserId`, but only the `/my/mark-all-read`
(POST and PATCH) endpoints call it — the controller-level
`/read-all` (PATCH) does not. **Two routes, two behaviours.**

### 5.5 Alerts sub-module

`apps/api/src/modules/notifications/alerts/alerts.service.ts` is a thin
CRUD over the `notifications` table from
`@europrint/schemas`. It is **not connected to the event bus** —
nobody calls `alertsService.create()` from a listener; it's a manual
admin CRUD only. Round 1 missed this module entirely.

---

## 6. Templates & preferences

### 6.1 Preferences

`apps/api/src/modules/notifications/application/notification-preferences.service.ts`

```ts
// notification-preferences.service.ts:23-33
const DEFAULTS: NotificationPrefsRow = {
  emailEnabled: true,
  telegramEnabled: true,
  pushEnabled: false,
  orderUpdates: true,
  productionAlerts: true,
  hrAlerts: true,
  qcAlerts: true,
  financeAlerts: false,
  systemAlerts: true,
};
```

API:
- `GET /api/notifications/preferences` — returns DEFAULTS or the user's stored row.
- `PUT /api/notifications/preferences` — upserts via `NotificationPreferencesRepository`.
- `PATCH /api/notifications/preferences` — alias, same handler.

### 6.2 Schema bootstrap

`NotificationSchemaService.onModuleInit()` (line 14) calls
`repo.ensurePreferencesTables()` which delegates to
`ensureNotificationTables()` in `@common/database/ddl-migrations`. So
the `notification_preferences` table is auto-created at boot — this is
DDL-on-boot rather than migration-based.

### 6.3 Where preferences are actually consulted

Critical finding: **none of the notification senders read the
preferences row before sending**. Grep `notificationPreferences` /
`NotificationPreferencesService` returns:

- `notifications.module.ts` — provider registration
- `notifications.controller.ts` — API
- `notification-preferences.service.ts` — the service itself
- `cc-notification-prefs.repo.ts` — separate communication-center prefs

No event handler or send path injects `NotificationPreferencesService`
or queries `notification_preferences`. The prefs UI updates a row that
the back end never reads.

### 6.4 CC-side preferences

`modules/communication-center/presentation/cc-notification-prefs.controller.ts`
exposes a parallel `/api/cc/notification-prefs` endpoint that reads from
`cc_notification_prefs` table via `CcNotificationPrefsRepository`. CC
bot at least references this — but **POST returns just `{ success: true }`**
(line 38-40), not the created row. Two notification-prefs systems, both
imperfect.

### 6.5 Templates

No `notification_templates` table is referenced anywhere in
`apps/api/src` (Grep confirmed). The closest thing is
`cc_document_templates` consumed by `CcEventListener.handle` for
Communication Center documents. Pure notification messages are
hand-written strings inside each emit site (see kanban service's
`'Yangi vazifa tayinlandi'` literal at `kanban.service.ts:114`, or
the AbsenceBlockCron Uzbek strings at lines 64-68). No i18n on these.

---

## 7. WebSocket gateway

### 7.1 Gateway inventory

Search for `@WebSocketGateway` — **10 gateways** registered in the API:

| File | Namespace | Purpose |
|---|---|---|
| `modules/chat/chat.gateway.ts` | (no namespace, default `/`) | Chat messaging |
| `modules/hr/attendance/territory.gateway.ts` | `/territory` | Attendance / security alerts |
| `modules/iot/presentation/iot.gateway.ts` | (varies) | IoT tablet pushes |
| `modules/director/dashboard.gateway.ts` | (varies) | Director live KPIs |
| `modules/mes/mes.gateway.ts` | (varies) | MES line monitoring |
| `modules/hr/ai-interview-v2/gemini-live.gateway.ts` | (varies) | AI interview streaming |
| `modules/hr/recruitment/recruitment.gateway.ts` | (varies) | Candidate stage changes |
| `modules/hr/ai-interview-v2/ai-interview-v2.gateway.ts` | (varies) | Interview session |
| `modules/pos/presentation/pos.gateway.ts` | (varies) | POS realtime |
| `modules/communication-center/presentation/cc.gateway.ts` | `/cc` | Document workflow events |

### 7.2 No notifications namespace

There is **no `/notifications` or `/alerts` gateway**. Notification
delivery to the browser uses:

1. The general-purpose `CcGateway` for CC documents only.
2. Polling — frontend hooks `useMyNotifications` (`refetchInterval: 60000`)
   and `useUnreadCount` (`refetchInterval: 30000`) — `artifacts/erp-dashboard/src/hooks/use-notifications.ts:13, 19`.
3. Polling in `NotificationCenter.tsx` — `setInterval(() => void load(), 30000)`
   at line 70.

### 7.3 TerritoryGateway as the closest realtime push

`territory.gateway.ts` exposes six `@OnEvent` handlers (lines 100-128)
that rebroadcast attendance/security events to all socket clients in
the `/territory` namespace:

```ts
@OnEvent('attendance.late_arrival')
onLateArrival(payload: unknown) {
  this.server.emit('territory.event', { type: 'late_arrival', ...this._safeObj(payload) });
}
```

JWT verification is performed in `handleConnection` (line 49-94) and
only six roles are allowed. This is the canonical "real-time push for
notifications" pattern in this codebase, but it's scoped to
HR/security events, not general notifications.

### 7.4 CcGateway

`apps/api/src/modules/communication-center/presentation/cc.gateway.ts`
exposes a more polished pattern:

- Namespace `/cc`, JWT auth at `handleConnection`.
- Joins per-user room `cc:user:<userId>` and per-role room `cc:role:<role>`.
- Exposes `emitToUser(userId, event, data)`, `emitToRole(role, ...)`,
  and `broadcast(event, data)` helpers (lines 79-87).
- Exports `getCcGateway()` factory so the SLA cron can grab the
  instance and push without a circular DI (line 36).

Events: `inbox:new`, `inbox:overdue`, `pending:moved`, `outbox:moved`,
`approved`, `rejected`, `cancelled`, `summary:updated`.

---

## 8. Frontend integration

Frontend lives at `artifacts/erp-dashboard/src/`. (The repo's `apps/`
directory only contains `api/`.)

### 8.1 Hooks

`artifacts/erp-dashboard/src/hooks/use-notifications.ts` — six hooks
backed by REST polling:

- `useMyNotifications()` — `GET /api/notifications/my`, polls 60 s
- `useUnreadCount()` — `GET /api/notifications/my/unread-count`, polls 30 s. Always returns 0 (backend hardcodes; line 24 in the hook tolerates either `count` or `unreadCount`).
- `useNotificationPreferences()` — `GET /api/notifications/preferences`
- `useMarkNotificationRead()` — `PATCH /api/notifications/:id/read` (backend stub returns `{ isRead: true }` without touching DB)
- `useMarkAllRead()` — `POST /api/notifications/my/mark-all-read` (the working endpoint)
- `useUpdateNotificationPreferences()` — `PUT /api/notifications/preferences`

### 8.2 Pages and components

| File | Notes |
|---|---|
| `pages/NotificationCenter.tsx` | Calls **`/api/pos/notifications`** (not `/api/notifications`!) at line 61. Wrong route — POS namespace, not the generic notifications module. |
| `pages/NotificationSettings.tsx` | Preferences UI, uses the hooks. |
| `pages/kanban/NotificationsPanel.tsx` | Calls `/api/kanban/notifications` — yet another route family (line 35). |
| `components/dizayn-new/NotificationBell.tsx` | Defaults to demo data — line 54 defines `DEMO_NOTIFICATIONS` with five hand-written entries; the component falls back to it when props are empty (which is the default for the header import). |
| `components/dizayn-new/NotifItem.tsx` | Item renderer. |
| `components/chat/ChatNotificationBell.tsx` | Chat unread badge — separate code path through `useChatSocket`. |
| `components/DesignNotifications.tsx` | Design-module-specific notifications. |
| `pos-monitor/components/PosNotificationsDrawer.tsx` | POS variant. |

### 8.3 Three parallel notification URLs from the frontend

- `/api/notifications/*` — generic notifications module (NotificationsController)
- `/api/pos/notifications` — POS-specific (called by `NotificationCenter.tsx`)
- `/api/kanban/notifications` — Kanban-specific (called by `NotificationsPanel.tsx`)

The `NotificationCenter.tsx` ("ERP — Markaziy xabarnomalar sahifasi" /
"central notifications page" comment, line 3) bypasses the central
notifications API entirely and goes to POS. This is a routing mistake,
not a stub — the central page shows only POS movement notifications.

### 8.4 No WebSocket subscription for notifications

Grep `io\(.+'/notification|namespace.*notification` in the frontend
returns zero matches in any notifications-related file. The
`NotificationBell` and `NotificationCenter` rely entirely on
`refetchInterval` polling. The 30s/60s polling latency is the
expected upper bound for "live" notifications.

---

## 9. Findings summary

### P0 (production-broken or safety-critical)

| # | Issue | Evidence | Impact |
|---|---|---|---|
| P0-1 | **SOS alert has no consumer.** `SosAlertRaisedEvent` is published by `iot-tablet.service.ts` and bridged to `ERP_EVENTS.IOT_SOS_RAISED`, but no `@OnEvent` or `@EventsHandler` exists. | `event-bridge.service.ts:68`, no listener anywhere | Safety-critical SOS button on IoT tablets fires, gets persisted to DB, and **alerts nobody** — no Telegram blast, no email, no WebSocket push. |
| P0-2 | **Hardware access not revoked on absence block.** `'access.chip.revoke'` listener logs only; no integration with door/RFID system. | `orphan-events.listener.ts:118-123` | An employee blocked for 3 consecutive absences still has their physical badge active. |
| P0-3 | **IoT tablet not blocked on absence block.** Same pattern. | `orphan-events.listener.ts:127-132` | Blocked employee can still operate the production-floor tablet they were last assigned to. |
| P0-4 | **Email account not disabled on absence block.** Same. | `orphan-events.listener.ts:136-141` | Blocked employee retains email access; could exfiltrate or impersonate. |

### P1 (significant functional gaps)

| # | Issue | Evidence | Impact |
|---|---|---|---|
| P1-1 | **String typo: `'lms.certificate_issued'` vs `'lms.certificate.issued'`.** Listener uses underscore, emitter uses dot. | `learning-bot.service.ts:265`, `issue-certificate.handler.ts:53` | Telegram learning-bot DM never fires on certificate issuance. |
| P1-2 | **`getUnreadCount` controller is a hard-coded 0.** | `notifications.controller.ts:84` | UI badge never reflects actual unread count from `/api/notifications/my/unread-count` (the polled endpoint). |
| P1-3 | **`markAsRead` (PATCH) controller does not touch DB.** | `notifications.controller.ts:122-124` | UI shows item as read; next poll re-fetches it as unread. |
| P1-4 | **`/notifications/read-all` (PATCH) is a no-op.** Distinct from `/my/mark-all-read` (POST) which works. | `notifications.controller.ts:130-133` | Mass mark-as-read button in some pages does nothing. |
| P1-5 | **Notification preferences are stored but never read.** No event handler consults `NotificationPreferencesService` before sending. | Grep of `NotificationPreferencesService` consumers | Disabling "Telegram alerts" in preferences has no effect — all alerts still fire. |
| P1-6 | **`TelegramBotAdapter.sendOrderStatusUpdate/sendAdvanceReminder/sendCertExpiry/sendStockAlert/sendQcResult` are stubs.** They format the message string and return `Ok(undefined)` without calling Telegram. | `telegram-bot.adapter.ts:109-158` | Anyone wiring these methods (search returns no callers today, but bridge mappings exist) expects delivery and gets silent success. |
| P1-7 | **`NotificationCenter.tsx` calls wrong route** (`/api/pos/notifications`). | `NotificationCenter.tsx:61` | "Central notifications" page shows only POS movement notifications, not the generic notifications stream. |
| P1-8 | **`NotificationBell` component shows demo data** when no props are passed. | `NotificationBell.tsx:54-99` | Header bell may show fake demo notifications in production if the parent doesn't supply `notifications` prop. |
| P1-9 | **All AI-agent emitters are dead-end.** 13 distinct events (`stock.critical`, `fraud_suspected`, `production.delayed`, `quality.defect_rising`, `security.emergency`, `iot.anomaly`, `crm.hot_leads_found`, etc.) emit with zero listeners. | §2.2 table | Agents do their analysis, emit, and the result is dropped on the floor. Logs only. |
| P1-10 | **POS requisition workflow events all orphan.** 5 events (`submitted`, `approved`, `rejected`, `fulfilled`, `cancelled`). | `pos-requisition-workflow.service.ts:57-228` | No telegram/email on requisition state changes. |
| P1-11 | **Telegram handlers under `apps/api/src/telegram/handlers/` are not wired.** Class methods like `KanbanHandler.onTaskAssigned` exist but have no `@OnEvent` decoration and no caller. | `telegram/handlers/kanban.handler.ts:29`, no caller in Grep | The seven domain handlers (ai-reports, crm, hr, kanban, lms, production, warehouse) are dead code. |

### P2 (cleanup / hygiene)

| # | Issue | Evidence |
|---|---|---|
| P2-1 | Three parallel TelegramService classes (`telegram/telegram.service.ts`, `notifications/telegram/telegram.service.ts`, `notifications/infrastructure/external/telegram-bot.adapter.ts`) plus two `@deprecated` stubs (`notifications/domain/services/telegram.service.ts`, `notifications/domain/services/sms.service.ts`). | §5.2 |
| P2-2 | Three frontend route families (`/api/notifications/*`, `/api/pos/notifications`, `/api/kanban/notifications`) — no canonical unified route. | §8.3 |
| P2-3 | `erp-events.ts` and `erp-events.constants.ts` in `apps/api/src/events/` are pure re-export shims, but documentation still references `ErpEvents` enum and `ErpEventNames` constant which are flagged `@deprecated`. | `apps/api/src/events/erp-events.ts:24`, `erp-events.constants.ts:15` |
| P2-4 | `EventBridgeService` silently skips unmapped events (line 105: "not a failure"). No test asserts coverage. Adding a new domain event without a bridge entry will silently lose all `@OnEvent` consumers — there's no compile-time or test-time safeguard. | `event-bridge.service.ts:104-106` |
| P2-5 | Four bridge mappings (`CrmLeadCreatedEvent`, `HrCandidateAddedEvent`, `FinanceInvoiceCreatedEvent`, `CertificateEarnedEvent`) have no publisher today — pure dead scaffolding. | `event-bridge.service.ts:60-66`; comment "dead-letter today, kept defensively" |
| P2-6 | `AgentEventBusService.emit` wraps the payload in `{source, eventName, payload, timestamp}`. Cross-module listeners expecting the raw payload will get the envelope. Not biting today because all agent events are orphan, but a future listener will be confused. | `agent-event-bus.service.ts:22-26` |
| P2-7 | Hand-rolled Uzbek strings in cron and service emit sites — none use `i18n.t()`. Mixing translation strategies. | `absence-block.cron.ts:64-68, 88-91, 144-146, 162-163`; `kanban.service.ts:114` |
| P2-8 | `AlertsService` (`modules/notifications/alerts/alerts.service.ts`) is a CRUD-only service over the `notifications` table; not wired to the event bus, not consulted by any handler. Pure REST endpoint. Round 1 missed it. | `alerts.service.ts` |
| P2-9 | `CcNotificationPrefsController.create()` returns `{ success: true }` without creating anything (line 38-40). The method exists for swagger parity only. | `cc-notification-prefs.controller.ts:38-40` |
| P2-10 | Two `notification_preferences` schemas: the global one (`ensureNotificationTables`) and the CC-specific `cc_notification_prefs`. No unification. | §6.2, §6.4 |

---

## Net assessment

The event ecosystem is in a **partially-migrated state**: three buses
co-exist, a bridge papers over the gap for 33 specific class names, and
roughly 40 string-keyed events are wired through `EventEmitter2`
directly. The migration discipline is loose — there is no test that
verifies "every published event class either has a `@EventsHandler` or
a bridge entry," so new events silently lose their legacy consumers.

The notifications module itself is more mature than round 1 reported:
the `OrphanEventsListener` was added at some point between round-1 and
now, plugging the worst kanban/absence-block listener gaps. **However**,
most of its handlers are TODO logs, so the *operational* impact for the
critical absence-block flow (chip revoke, IoT block, email disable) is
unchanged from round 1.

The single biggest new finding is **P0-1: SOS alert has no consumer**.
This is a regression: a safety-critical workflow was wired through the
EventBridge but never given a listener. The bridge fires, the legacy
namespace gets the event, and nothing happens.

The three biggest cleanup priorities are the **three duplicate TelegramService classes**, the **three notification REST URL families** on the frontend, and the **string-typo defect** for `lms.certificate.issued` (P1-1) which is one character away from working.
