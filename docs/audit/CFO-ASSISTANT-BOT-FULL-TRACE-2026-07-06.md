# "Europrint CFO Assistant" Bot — Full Trace Investigation (read-only)

**Date:** 2026-07-06
**Scope:** Full backend (`apps/api/src`), all modules, all crons, entire git history (all branches + reflog), `.env` live config, docs.
**Method:** Investigation only. Nothing was created, modified, activated, or committed.
**Supersedes lead from:** `docs/audit/SFO-ASSISTANT-BOT-FULL-TRACE-2026-07-06.md` (which guessed `financial-reports-telegram.service.ts`).

---

## HEADLINE VERDICT

> **The "Europrint CFO Assistant" bot that produced the screenshot is NOT implemented in this repository.**
> Its distinctive message assembly — a personal morning greeting to the director *by name*, a "no reminders today" line, a *yesterday's-expenses* summary, a *health-check* line, a *meal-logging* reminder, and an **"AI KUNLIK MASLAHAT"** block with **"Bugungi fokus"** + **"Maslahat"** — has **zero code footprint and zero git-history footprint** anywhere in this codebase.

- The prior hypothesis (`financial-reports-telegram.service.ts`) is **REFUTED**: it is a generic 20-line *transport* that sends a pre-built `html` string to channel chat-IDs. Its only daily caller composes a **factory financial report** (`Kunlik Moliyaviy Hisobot`: cash / production / warehouse / receivables / payables) — none of the greeting, reminders, health, meal, or AI-advice content in the screenshot.
- Every "close" service in the repo differs substantially in content, recipient, or wiring (details below). None assembles the screenshot's message.
- The screenshot (dated *21 mart / 22 mart*) was clearly produced by a bot with **real Telegram credentials**. In the **live** environment, `TELEGRAM_BOT_TOKEN` is a **5-character dummy** and `OWNER_TELEGRAM_CHAT_ID` is **absent**, so even the in-repo daily crons that *do* exist could not have delivered it. → The producing bot is **external** to this repo (separate project / n8n-Make workflow / other codebase).

---

## Investigation table

| # | Question | Answer | Evidence (file:line) | Notes |
|---|---|---|---|---|
| 1 | Source of each screenshot line (greeting / "no reminders" / yesterday expenses / health / meal / AI advice) | **None of them trace to `financial-reports-telegram.service.ts`, and no single service in the repo produces this combination.** Only a *generic morning greeting* pattern exists elsewhere; the other five lines have no source at all. | greeting pattern: `cron/manager-daily-routine.cron.ts:77`; the transport hypothesised earlier: `modules/finance/financial-reports/services/financial-reports-telegram.service.ts:50` | The literal strings `Bugungi sog…`, `kechagi xarajat`, `meal_reminder`, `AI KUNLIK MASLAHAT`, `Bugungi fokus`, `eslatma yo'q` return **0 hits** in current code **and** `git log --all -S` (0 commits each). |
| 2 | Single bot/cron, or several combined? | In the repo, daily-push logic is **split across ≥3 unrelated crons** (finance report, owner CRM digest, manager routine) that never combine into one message. The screenshot's *unified* finance+health+meal+AI message matches **none** of them. | `financial-reports-daily.cron.ts:26`; `director/infrastructure/cron/owner-summary-daily.cron.ts`; `cron/manager-daily-routine.cron.ts:34` | The screenshot's single combined push is not assembled anywhere here. |
| 3 | Where does "AI KUNLIK MASLAHAT" come from? | **Not present in this repo.** The nearest in-repo AI daily feature (`generateExecutiveSummary`) IS a **real LLM call** via the AI router — but it summarises employees/leads/deals, is **log-only (never sent to Telegram)**, and has a **templated fallback** if the LLM fails. It is not the screenshot's advice block. | real LLM call: `modules/ai/services/director-ai.service.ts:167` (`this.ai.call({ taskType: 'director.kpi_explain' … })`); log-only trigger: `modules/ai/services/ai-automation-daily.service.ts:51-62`; templated fallback: `director-ai.service.ts:172,215` (`buildSummaryFallback`) | See **Concern** below re: the fallback. |
| 4 | Recipient targeting — how "Hurmatli Muhammad Ayubxon aka"? | **No in-repo mechanism hardcodes this director.** Two generic patterns exist: (a) per-employee `telegram_chat_id` pulled from the `employees` table; (b) a single `OWNER_TELEGRAM_CHAT_ID` env var. Neither emits "…aka" or the director's name as a literal. | (a) `manager-daily-routine.cron.ts:60-71` (`e.telegram_chat_id`, name = `first_name || last_name`); (b) `director/application/owner-summary.service.ts:120` (`OWNER_TELEGRAM_CHAT_ID`) | "Ayubxon" appears in the repo **only in docs** as a migration-approver example (`STANDARTLAR.md:820` "APPROVED: Ayubxon Pozilov"), never in code. |
| 5 | Live/active — would it fire today? | **No.** In live `apps/api/.env`, `TELEGRAM_BOT_TOKEN` is a **5-char dummy** and `OWNER_TELEGRAM_CHAT_ID` is **not set** (`grep -c` → 0). Every in-repo Telegram sender is config-gated and would **skip/no-op**. The `manager-daily-routine` cron is additionally **dead** (its class is not provided in any NestJS module → its `@Cron` never registers). | dummy token shape verified via `.env` read (value redacted); `OWNER_TELEGRAM_CHAT_ID` absent; unregistered cron: `git grep ManagerDailyRoutineCron` → only its own def file `cron/manager-daily-routine.cron.ts` | The dated screenshot therefore came from an **external** bot with real credentials, not this codebase. |
| 6 | Health-check + meal-logging source (HR/wellness?) | **No personal health-check or meal-*reminder* feature exists.** The only "meal" data in the repo is a **canteen/cafeteria facility log** (portion counts, cost-per-meal, employees-served) — a WMS/MRO facility feature, not a per-director wellness reminder. No "Bugungi sog'liq" health line exists in any service. | canteen facility (not personal): `modules/mro/maintenance/drizzle-maintenance-svc.repo.ts:223-234` (`mro_canteen_logs`, `meal_name`) | Confirms the screenshot's health/meal lines are **not** sourced from any repo module. |
| 7 | Full command/interaction set — one-way or interactive? | The screenshot bot is **not here**, so it has no command set in this repo. For context, the repo's *actual* interactive bots are: (a) the **bot-gateway** webhook bots (`/cashflow`, `/debts`, `/company_state`, `/weekly_digest`, `/zvs_status` …) and (b) the HR **telegram-bots** (telegraf long-polling). Neither matches the CFO Assistant format. | bot-gateway inbound: `modules/bot-gateway/bot-gateway.controller.ts` + `telegram-auth.guard.ts`; fin commands: `modules/bot-gateway/bots/fin.bot.ts:16-25`; HR polling bots: `modules/hr/telegram-bots/hr-bot.service.ts:44-47` | No incoming-message handler in the repo is bound to a "CFO Assistant" token. |
| 8 | Every table/service a daily digest reads (in-repo, for reference) | Finance daily: `finance_transactions` / `cashier_movements` / warehouse / receivables / payables. Owner digest: SD customers + CRM churn (`OwnerSummaryRepository`). Exec summary: employees/leads/deals (`getExecutiveSummaryMetrics`). **None reads a "yesterday expenses + health + meal + AI focus" set together.** | `financial-reports-daily.cron.ts:33-40`; `owner-summary.service.ts:50-53`; `director-ai.service.ts:165` | The screenshot's data mix is not read by any single in-repo path. |

---

## Plain final identification

**`financial-reports-telegram.service.ts` is NOT the source of the screenshot output** — it is only a dumb transport (`sendReport(channel, html)` → `bot.telegram.sendMessage`, `financial-reports-telegram.service.ts:50-65`). Its **only** content producers are:

- `financial-reports-daily.cron.ts:55-72` → `Kunlik Moliyaviy Hisobot` (cash/production/warehouse/receivables/payables to the `kunlik` channel-ID),
- `financial-reports-weekly.cron.ts` / `-monthly.cron.ts` / `-alerts.cron.ts` (weekly/monthly/alert reports).

None emits a personal greeting, "no reminders", health, meal, or an AI-advice block. **The bot in the screenshot is produced by code that does not exist in this repository** (current tree or any git history/branch/reflog).

**Every in-repo file that superficially resembles part of the screenshot (all confirmed to be *different* bots):**

1. `apps/api/src/cron/manager-daily-routine.cron.ts` — "☀️ Xayrli tong, {name}!" morning greeting, but body = team-size / open-tasks / pending-approvals only; broadcast to **all** managers; **class is unregistered → dead**.
2. `apps/api/src/modules/director/application/owner-summary.service.ts` — "Egasi kunlik hisoboti" = new/lost/small customers + sales trend + top churn risk; gated on `OWNER_TELEGRAM_CHAT_ID`.
3. `apps/api/src/modules/finance/financial-reports/cron/financial-reports-daily.cron.ts` (+ its transport `financial-reports-telegram.service.ts`) — factory financial report to channel-IDs.
4. `apps/api/src/modules/ai/services/ai-automation-daily.service.ts` → `modules/ai/services/director-ai.service.ts:generateExecutiveSummary` — a **real** AI-router LLM call, but employees/leads/deals summary, **log-only (never Telegram-pushed)**.

---

## Live status verdict

**Dormant / not present.** The producing bot is external. Even the repo's *own* daily Telegram crons cannot fire in the live environment:

- `TELEGRAM_BOT_TOKEN` = **5-char dummy** (live `apps/api/.env`); every sender that needs it warns and skips.
- `OWNER_TELEGRAM_CHAT_ID` = **not configured** → `owner-summary` returns `sent=false, reason: telegram_not_configured` (`owner-summary.service.ts:121-124`).
- `manager-daily-routine` cron is **not wired into any module**, so its `@Cron` handlers never register regardless of tokens.

The screenshot's dated messages ("21 mart"/"22 mart") therefore prove an **external** bot ran successfully with real credentials — consistent with nothing in this repo being able to send Telegram messages live.

---

## Concern found (GREEN-LIE vigilance)

- The screenshot bot's "AI kunlik maslahat" **cannot be verified real or templated here** because its code is not in this repo. This is the honest limit of the evidence — **do not assume it is a real AI call.**
- **However**, the repo's own nearest analogue *does* carry a silent-fallback risk worth flagging in case the external bot reused this pattern: `director-ai.service.ts:162-176` calls the LLM but, on any AI error, **silently substitutes a hand-templated `buildSummaryFallback()` (line 215)** with no visible marker to the reader. If the external CFO Assistant shares this codepath/logic, its "AI advice" could be a canned template whenever the LLM call fails — a classic green-lie surface. Recommend the owner check the external bot's source directly.

---

## What the owner should do next

To definitively identify the CFO Assistant, the owner needs to point to **where the bot actually runs** — it is not this repo. Likely candidates: a separate Node/Python project, an n8n/Make automation, or another repository holding a bot whose BotFather display name is "Europrint CFO Assistant". Supplying that bot's token or source is the only way to trace its exact message assembly and confirm whether its AI advice is a real LLM call.

---

*Investigation complete. No files other than this report were created or modified. Every claim above carries a `file:line` citation, a live-config check (values redacted), or an explicit git-history search result (0 commits where stated).*
