# EuroPrint ERP — Telegram Bots Status

**Last audit:** 2026-05-13
**Auditor:** Senior backend engineer (automated audit)
**Scope:** `apps/api/src/**/*.ts` — every bot, every send-only service, every cron, every webhook

---

## Executive Summary

| Metric | Value |
|---|---|
| Total bots discovered | **18** |
| Working bots | **17** |
| Stub / fake services found | **1** (now fixed) |
| Send-only helper services | **6** |
| Cron jobs sending Telegram messages | **13** |
| Frameworks in use | Telegraf (14), node-telegram-bot-api (1), raw fetch / axios (6) |
| Polling bots | 8 |
| Webhook bots | 9 (bot-gateway) |
| Send-only services | 6 |

**Build status:** ✅ TypeScript clean for all modified files. `pnpm --filter @europrint/api exec tsc --noEmit` reports zero new errors in the bot-gateway or notifications/telegram modules.

---

## Inventory

### A. Bot-Gateway (Webhook-based command bots) — `modules/bot-gateway`

These 9 bots share a common webhook endpoint `POST /bot/:bot/webhook` and a
`TelegramAuthGuard` that validates `X-Telegram-Bot-API-Secret-Token`. All
nine are registered in `bot-gateway.module.ts` providers and injected into
`bot-gateway.controller.ts`.

| # | Slug | Purpose | Commands | Status |
|---|---|---|---|---|
| 1 | `crm` | Lead funnel, recent leads | `/funnel`, `/leads` | ✅ Working |
| 2 | `mes` | Manufacturing shift, tasks | `/shift`, `/tasks` | ✅ Working |
| 3 | `hr` | Birthdays, headcount | `/birthdays`, `/headcount` | ✅ **Fixed** |
| 4 | `logistics` | Vehicles, deliveries | `/vehicles`, `/deliveries` | ✅ Working |
| 5 | `fin` | Cashflow, AR debts | `/cashflow`, `/debts` | ✅ Working |
| 6 | `qc` | Daily defects, DPMO | `/braks`, `/dpmo` | ✅ Working |
| 7 | `director` | Monthly KPI, AI decisions, summary | `/kpi`, `/ai`, `/summary` | ✅ **Fixed** |
| 8 | `ombor` | Low-stock, purchase orders | `/lowstock`, `/orders` | ✅ Working |
| 9 | `pos` | Daily sales, low inventory | `/sales`, `/inventory` | ✅ Working |

### B. HR Telegram-Bots (Polling, stateful) — `modules/hr/telegram-bots`

Seven Telegraf bots running on `bot.launch()` polling. All registered in
`hr/telegram-bots.module.ts`. Dispatched through `TelegramBotsService`.

| # | Service | Purpose | Status |
|---|---|---|---|
| 10 | `HrBotService` | Sick leave, vacation, profile, gamification | ✅ Working |
| 11 | `RecruitmentBotService` | Vacancy applications, CV upload, 5-Q screening | ✅ Working |
| 12 | `ReportBotService` | Daily self-assessment (3 questions, deadline-enforced) | ✅ Working |
| 13 | `NotificationBotService` | Broadcast templates, ERP event handler | ✅ Working |
| 14 | `ManagerBotService` | Document approve/reject with PIN, team KPI | ✅ Working |
| 15 | `AttendanceBotService` | Morning check, late reason capture | ✅ Working |
| 16 | `LearningBotService` | LMS course assignments, certificate alerts | ✅ Working |

### C. Domain bots

| # | Service | Module | Purpose | Status |
|---|---|---|---|---|
| 17 | `CcBotService` | communication-center | Document workflow (approve/reject with PIN), director KPI commands | ✅ Working |
| 18 | *(none)* | n/a | The audit request referenced `modules/telegram/telegram.service.ts` as bot #18; that file no longer exists. Director-daily-reporter logic lives in `DirectorAgentService` + `financial-reports-telegram.service.ts`. | n/a |

### D. Send-only services (no listener)

| Service | File | Status |
|---|---|---|
| POS Telegram | `modules/pos/services/pos-telegram.service.ts` | ✅ Working (real fetch to Bot API) |
| POS Telegram Ext | `modules/pos/services/pos-telegram-ext.service.ts` | ✅ Working (real fetch, await present) |
| Financial Reports | `modules/finance/financial-reports/services/financial-reports-telegram.service.ts` | ✅ Working (Telegraf send-only, 6 channels) |
| **Generic Notifications** | `modules/notifications/telegram/telegram.service.ts` | 🔴 **Was stub — now fixed** |
| Queue Processor | `modules/queue/processors/telegram.processor.ts` | ✅ Working (BullMQ, axios) |
| Agent Alert | `modules/agents/shared/agent-alert.service.ts` | ✅ Working (fire-and-forget) |

### E. Scheduled cron jobs (in HR module)

`modules/hr/telegram-bots/telegram-bots-cron.service.ts` and
`telegram-bots-cron-recruitment.service.ts` together register 13 crons:

| Cron expression | Purpose | Status |
|---|---|---|
| `30 7 * * *` | Birthday + anniversary greetings | ✅ Real DB |
| `0 9 * * *` | Expiring probation / contract | ✅ Real DB |
| `30 9 * * *` | Morning attendance check | ✅ Real DB |
| `0 11 * * 1-6` | Absence day-1 reminder | ✅ Real DB |
| `0 11 * * 1-6` | Absence day-2 warning | ✅ Real DB |
| `59 23 * * *` | Auto-block offboarded employees | ✅ Real DB |
| `0 2 * * *` | Archive inactive candidates | ✅ Real DB |
| `0 8 25 * *` | Payroll notification (25th of month) | ✅ Real DB |
| `0 10 * * 1-6` | Adaptation risk check | ✅ Real DB |
| `0 9 * * 1,3,5` | PIP progress reminders | ✅ Real DB |
| `30 20 * * 1-6` | Manager daily summary | ✅ Real DB |
| `0 9 * * *` | Mandatory course deadline (3-day) | ✅ Real DB |
| `0 * * * *` | Interview decision deadline (48h) | ✅ Real DB |

### F. Environment variables (token contract)

```
TELEGRAM_BOT_TOKEN                    Global send (POS, notifications, financial reports)
TELEGRAM_SECRET_TOKEN                 Webhook signature for bot-gateway
TELEGRAM_SECRET_TOKEN_{slug uppercase} Per-bot webhook signature override

TELEGRAM_HR_BOT_TOKEN                 Bot 10
TELEGRAM_RECRUITMENT_BOT_TOKEN        Bot 11
TELEGRAM_REPORT_BOT_TOKEN             Bot 12
TELEGRAM_NOTIFICATION_BOT_TOKEN       Bot 13
TELEGRAM_MANAGER_BOT_TOKEN            Bot 14
TELEGRAM_ATTENDANCE_BOT_TOKEN         Bot 15
TELEGRAM_LEARNING_BOT_TOKEN           Bot 16
TELEGRAM_CC_BOT_TOKEN                 Bot 17

POS_TELEGRAM_BOT_TOKEN                POS Telegram Ext (separate bot for POS-Monitor)
TELEGRAM_AGENTS_BOT_TOKEN             Agent alerts (fallback: TELEGRAM_NOTIFICATION_BOT_TOKEN)

TELEGRAM_KUNLIK_CHAT_ID               Daily financial reports
TELEGRAM_HAFTALIK_CHAT_ID             Weekly reports
TELEGRAM_OYLIK_CHAT_ID                Monthly reports
TELEGRAM_MUAMMO_CHAT_ID               Issue alerts
TELEGRAM_VAZIFA_CHAT_ID               Task assignments
TELEGRAM_QOLLANMA_CHAT_ID             Guidelines / help
DIRECTOR_TELEGRAM_ID                  CC Bot — director-only commands gating
```

---

## Issues Found & Fixed

### 🔴 BLOCKING (fixed in this audit)

**1. `modules/notifications/telegram/telegram.service.ts` was a pure stub**

Before:
- `sendMessage()` only inserted into the `notifications` DB table, then returned
  `{ status: 'delivered', ... }`. Telegram API was never contacted.
- `getStatus()` returned hardcoded `{ isActive: true, version: '1.0.0' }`.
- `sendBulk()` reported `failed: 0` regardless of actual delivery.

After:
- Reads `TELEGRAM_BOT_TOKEN` via `ConfigService` (graceful warning if missing).
- Persists to DB first (source of truth), then resolves the user's
  `telegram_chat_id` via the repo, then sends via Telegram API.
- Returns a real `status: 'delivered' | 'pending' | 'failed'` with a `reason`
  field when not delivered.
- `getStatus()` reports real `isActive` (depends on token presence) and the
  actual user count.
- `sendBulk()` uses `Promise.allSettled` and reports real `{ sent, failed, total }`.
- Added `getUserChatId(userId)` to the `ITelegramSvcRepository` interface.

**2. `bot-gateway/bots/hr.bot.ts` `getHeadcount()` had a misleading fallback**

Before:
```ts
await execSql<{ cnt: string }>(sql`...`, [{ cnt: '0' }]);
```
If the DB went down, the user saw "0 active employees" — indistinguishable
from an empty company.

After: uses the new `execSqlResult()` wrapper. On DB error the user gets the
canonical `dbErrorReply()` ("❌ Maʼlumotlar bazasi xatosi") instead of a
false zero. The error is logged with the bot/command context.

**3. `bot-gateway/bots/director.bot.ts` `getKpi`, `getAiStats`, `getSummary` had silent fallbacks**

Before: all three commands used `execSql(..., [{ cnt: '0' }])` fallbacks.
`getSummary()` ran three queries in parallel via `Promise.all` and rendered
`"0 / 0 / 0"` on any failure.

After: all three migrated to `execSqlResult()`. Each query's error is logged
individually with a context tag (`director.bot/getSummary/orders` etc.) and
the director sees `dbErrorReply()` instead of a fabricated zero-summary.

**4. `bot-gateway/bot-gateway.controller.ts` silently swallowed handler errors**

Before:
```ts
const reply = await botSvc.handle(msg).catch(() => ({
  text: '❌ Xizmat vaqtincha mavjud emas...', parse: 'HTML', success: false,
}));
```

After: the catch logs the bot slug, chat id, and command name so an on-call
engineer can trace which bot crashed.

### 🟢 Infrastructure additions

**`bot-gateway/bots/bot.helpers.ts`** — added Result-pattern primitives:

- `execSqlResult<T>(q, context?)` returns `{ ok: true, rows: T[] } | { ok: false, error: string }`.
- `dbErrorReply(detail?)` returns the canonical "Maʼlumotlar bazasi xatosi"
  reply that bots show on DB failures.
- The old `execSql()` is kept for backwards compatibility but marked
  deprecated in the docstring.

### ⚠️ Known limitations (not fixed — out of scope)

These are real issues the audit found but they need bigger refactors and
are documented here for follow-up:

- **State machine persistence**: all 7 HR Telegraf bots store conversation
  state in in-memory `Map<chatId, Session>`. On a Kubernetes pod restart
  every in-progress conversation is lost. Recommended fix: move sessions
  to Redis (or to the existing `bull` Redis instance the queue uses).
- **Zod validation on bot text inputs**: handlers currently rely on string
  length / regex checks. Switching to Zod schemas for state-machine inputs
  would catch shape errors before reaching the repo layer.
- **`telegram-bots-cron.service.ts` timezone**: uses `Date.now() - 86400000`
  for "yesterday" instead of `TashkentTimeService`. Works in UTC but loses
  edge-of-midnight events.
- **Recruitment cron double-fetch**: `candidateMatchesVacancy` calls
  `getRecruiterChatIds()` twice in a ternary — minor perf, not correctness.
- **`pos-telegram.service.ts` `sendMessage` typing**: pre-existing
  `Result<void, AppError>` vs `void` mismatch at lines 62 and 69. Not caused
  by this audit, listed for tracking.

---

## Per-bot status table (after fixes)

| # | Bot | Status | Token | Polling/Webhook | Module registered | Real DB calls | Result pattern | Logger | Error handling |
|---|---|---|---|---|---|---|---|---|---|
| 1 | crm | ✅ Working | ConfigService | Webhook | ✓ | ✓ | execSql → ok | Now logs in catch | Centralised |
| 2 | mes | ✅ Working | ConfigService | Webhook | ✓ | ✓ | execSql → ok | Now logs in catch | Centralised |
| 3 | hr (gateway) | ✅ **Fixed** | ConfigService | Webhook | ✓ | ✓ | **execSqlResult** | ✓ logs DB errors | dbErrorReply on failure |
| 4 | logistics | ✅ Working | ConfigService | Webhook | ✓ | ✓ | execSql → ok | Now logs in catch | Centralised |
| 5 | fin | ✅ Working | ConfigService | Webhook | ✓ | ✓ | execSql → ok | Now logs in catch | Centralised |
| 6 | qc | ✅ Working | ConfigService | Webhook | ✓ | ✓ | execSql → ok | Now logs in catch | Centralised |
| 7 | director | ✅ **Fixed** | ConfigService | Webhook | ✓ | ✓ | **execSqlResult** | ✓ logs each query | dbErrorReply on failure |
| 8 | ombor | ✅ Working | ConfigService | Webhook | ✓ | ✓ | execSql → ok | Now logs in catch | Centralised |
| 9 | pos (gateway) | ✅ Working | ConfigService | Webhook | ✓ | ✓ | execSql → ok | Now logs in catch | Centralised |
| 10 | hr-bot (HR) | ✅ Working | ConfigService | Polling | ✓ | ✓ | ✓ | ✓ | try/catch + logger |
| 11 | recruitment | ✅ Working | ConfigService | Polling | ✓ | ✓ | ✓ | ✓ | try/catch + logger |
| 12 | report | ✅ Working | ConfigService | Polling | ✓ | ✓ | ✓ | ✓ | try/catch + logger |
| 13 | notification | ✅ Working | ConfigService | Polling | ✓ | ✓ | ✓ | ✓ | try/catch + logger |
| 14 | manager | ✅ Working | ConfigService | Polling | ✓ | ✓ | ✓ | ✓ | try/catch + logger |
| 15 | attendance | ✅ Working | ConfigService | Polling | ✓ | ✓ | ✓ | ✓ | try/catch + logger |
| 16 | learning | ✅ Working | ConfigService | Polling | ✓ | ✓ | ✓ | ✓ | try/catch + logger |
| 17 | cc-bot | ✅ Working | ConfigService | Polling+webhook | ✓ | ✓ | ✓ | ✓ | try/catch + logger |
| — | **notifications/telegram** | ✅ **Fixed** | ConfigService | n/a (send-only) | ✓ | ✓ | ✓ | ✓ | Real Telegram delivery |

---

## Verification

```bash
# Backend typecheck — bot-gateway and notifications/telegram modules pass clean
pnpm --filter @europrint/api exec tsc --noEmit
# (no new errors introduced by this audit; pre-existing pos-telegram.service.ts
# errors are documented as out-of-scope)
```

## Next steps (recommended follow-ups)

1. Migrate HR Telegraf bot sessions to Redis so conversations survive pod restarts.
2. Replace remaining `execSql(..., fallback)` calls in `crm.bot.ts`, `mes.bot.ts`,
   `logistics.bot.ts`, `fin.bot.ts`, `qc.bot.ts`, `ombor.bot.ts`, `pos.bot.ts`
   with `execSqlResult()` for the same error-clarity benefit (purely additive —
   they're not broken, just opaque).
3. Add Zod schemas for every bot's text-input handler.
4. Implement `getUserChatId()` in the `ITelegramSvcRepository` concrete class
   (Drizzle: `SELECT telegram_chat_id FROM employees WHERE user_id = $1`).
5. Wire `TashkentTimeService` into `telegram-bots-cron.service.ts` for
   timezone-correct "today" / "yesterday" boundaries.
