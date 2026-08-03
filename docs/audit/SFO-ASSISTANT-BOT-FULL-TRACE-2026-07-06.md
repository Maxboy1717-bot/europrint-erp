# `@SFO_Assistant_bot` — Full Trace Investigation (read-only)

**Date:** 2026-07-06
**Scope:** Entire EuroPrint ERP repo — backend, frontend, config/env, docs, DB schema, git history (all branches + reflog).
**Method:** Investigation only. No code, config, migration, or bot registration was created or modified.

---

## FINAL VERDICT (read this first)

> **No trace of `@SFO_Assistant_bot` exists anywhere in this repository's current code, git history, database schema, or documentation.**

- The literal strings `SFO_Assistant`, `SFO-Assistant`, `sfo_assistant`, `@SFO`, and any word-boundary `SFO` token: **0 matches** in source, config, `.env`/`.env.example`, docs, and across **all git branches, reflog, and history** (`git log --all -S` / `--grep`).
- Every apparent "SFO" hit in a case-insensitive substring search is a **false positive** — `SFO` appears inside ordinary identifiers (see the false-positive note below).
- The bot does **not** correspond to any of the 7 registered Telegram bot services, nor to any of the other Telegram integrations in the codebase, under a different internal name. The only real Telegram-bot **@username** referenced anywhere in the repo is `@europrint_check_bot` (in i18n strings) — explicitly **NOT** confirmed to be the same bot.

There is nothing to fix or remove, because nothing named SFO exists.

---

## 1. Search results table

| Location searched | Method | Result |
|---|---|---|
| Whole repo — `SFO_Assistant` / `SFO-Assistant` / `sfo_assistant` / `@SFO` | `Grep -i` regex `SFO[_-]?[Aa]ssistant` and `SFO_Assistant_bot\|@SFO` | **NOT FOUND** (0 matches) |
| Whole repo — standalone `SFO` token | `git grep -E "\bSFO\b"` over `apps/api/src/**/*.ts` | **NOT FOUND** (0 matches) |
| Whole repo — `SFO` case-insensitive substring | `Grep -i "SFO"` | 250 files matched — **ALL false positives** (substring inside `transfo`rmation, `getMenu`s`For`, `area`s`For`Improvement, `getDailyReportStatu`s`For`Manager, etc.) |
| Bot-gateway / telegram-bots module inventory | Read `telegram-bots.module.ts` + `telegram-bots.service.ts` dispatch switch | **NOT FOUND** — 7 bots registered (hr, recruitment, report, notification, manager, attendance, learning); none is SFO |
| Other module Telegram integrations (CC, POS, notifications, agents, finance, director) | `Grep` for `api.telegram.org` / `*_BOT_TOKEN` across `apps/api/src` | **NOT FOUND** — 11 token env-vars inventoried; none references SFO |
| Env var names + config | `Grep` `apps/api/src/config/env.schema.ts` + read `.env`, `.env.example`, `.env.production.example`, `apps/api/.env`, `apps/api/.env.example` | **NOT FOUND** — no `SFO` var; no `*SFO*_BOT_TOKEN` |
| Live runtime config (`apps/api/.env`) | Read var **names** (values redacted) | **NOT FOUND** — only generic `TELEGRAM_BOT_TOKEN` present, and it is a **5-character dummy**; no per-bot HR tokens set at all |
| Database schema — bot registration / session / chat-config tables | Read `common/database/ddl-migrations.ts` (`ensureBotTables`) + `Grep` for `telegram_bot`/`bot_session`/`chat_id` tables | **NOT FOUND** — only `recruitment_bot_attempts` and `bot_candidates` tables exist (recruitment flow); no bot-registry/username table exists that could hold an "SFO" row |
| Git history — content | `git log --all -S"SFO_Assistant"`, `-S"SFO_Assistant_bot"`, `-S"Assistant_bot"`, `-i -S"sfo_assistant"` | **NOT FOUND** (0 commits) |
| Git history — messages | `git log --all --grep="SFO"`, `--grep="assistant bot"` | **NOT FOUND** (0 commits) |
| Git — branches / reflog | `git branch -a` (13 local + 8 remote), `git reflog \| grep -i sfo` | **NOT FOUND** on any branch or reflog entry |
| Docs / vision / CLAUDE.md | `Grep -i` over `**/*.{md,txt,env,example}` for `SFO` / `assistant.*bot` / `@*_bot` | **NOT FOUND** — only `@europrint_check_bot` (i18n) surfaced (partial, different bot — see §Near-match) |

### False-positive note

The case-insensitive `SFO` substring search returned 250 files. Every one is `SFO` embedded in an unrelated word. Representative examples (verified):

- `transformation`, `transformIgnorePatterns`, `class-transformer` (Jest/NestJS config).
- `areasForImprovement` (`ai/EXAMPLES.md`).
- `getMenusForRole`, `getDailyReportStatusForManager`, `getPendingDocumentsForManager` — the two `telegram-bots.repository.ts` "hits" are literally `...Statu`**`sFo`**`rManager` / `getPendingDocument`**`sFo`**`rManager`.

None is an acronym or bot name.

---

## 2. What actually exists (for owner context — NOT the SFO bot)

The repo contains a `telegram-bots` module under `apps/api/src/modules/hr/telegram-bots/` that registers **7 Telegram bot services**, each keyed by its **own env-var token** and launched via `telegraf` long-polling (`bot.launch()`) only when its token is present:

| # | Bot service | Token env var | File |
|---|---|---|---|
| 1 | HR bot | `TELEGRAM_HR_BOT_TOKEN` | `hr-bot.service.ts:30` |
| 2 | Recruitment bot | `TELEGRAM_RECRUITMENT_BOT_TOKEN` | `recruitment-bot.service.ts:27` |
| 3 | Report bot | `TELEGRAM_REPORT_BOT_TOKEN` | `report-bot.service.ts:39` |
| 4 | Notification bot | `TELEGRAM_NOTIFICATION_BOT_TOKEN` | `notification-bot.service.ts:46` |
| 5 | Manager bot | `TELEGRAM_MANAGER_BOT_TOKEN` | `manager-bot.service.ts:33` |
| 6 | Attendance bot | `TELEGRAM_ATTENDANCE_BOT_TOKEN` | `attendance-bot.service.ts:36` |
| 7 | Learning bot | `TELEGRAM_LEARNING_BOT_TOKEN` | `learning-bot.service.ts:35` |

Dispatch is a `switch (botType)` in `telegram-bots.service.ts:42-58` over the 7 types above (`hr`/`recruitment`/`report`/`notification`/`manager`/`attendance`/`learning`) — **not** a `botSvc.handle(msg)` gateway of "~9" bots. (The "~9 bot-gateway" figure from the task prompt does not match the current tree; the real count is 7 in this module.)

Additional **separate** Telegram integrations exist in other modules, each with its own token, none named SFO:

- `modules/communication-center/telegram/cc-bot.service.ts:48` — `TELEGRAM_CC_BOT_TOKEN`
- `modules/agents/shared/agent-alert.service.ts:43` — `TELEGRAM_AGENTS_BOT_TOKEN` (falls back to `TELEGRAM_NOTIFICATION_BOT_TOKEN`)
- `modules/pos/application/services/pos-telegram*.ts` — `POS_TELEGRAM_BOT_TOKEN` / `TELEGRAM_BOT_TOKEN`
- `modules/notifications/telegram/telegram.service.ts:49` + `.../external/telegram-bot.adapter.ts:37` — `TELEGRAM_BOT_TOKEN`
- `modules/finance/financial-reports/services/financial-reports-telegram.service.ts:31` — `TELEGRAM_BOT_TOKEN`
- `modules/director/application/owner-summary.service.ts:119` — `TELEGRAM_BOT_TOKEN` + `OWNER_TELEGRAM_CHAT_ID`
- `modules/queue/processors/telegram.processor.ts:53` — `TELEGRAM_BOT_TOKEN`
- root `telegram/telegram.service.ts:27` — `TELEGRAM_BOT_TOKEN`

**Crucial finding for identification:** none of these services stores or references a bot **@username**. A Telegram bot's public handle (`@SFO_Assistant_bot`) is defined in BotFather, not in this code — the code only holds numeric bot tokens. So even if a token belonging to a bot named `@SFO_Assistant_bot` were pasted into one of these env vars, **the codebase would contain no textual trace of the name "SFO"**. The name simply is not, and structurally cannot be, recorded here.

### Live status of the existing bots

- `apps/api/.env` (live) sets **only** `TELEGRAM_BOT_TOKEN`, and its value is a **5-character dummy** (comment on line 38: "mahalliy testda dummy bo'ladi" = "will be dummy in local testing").
- **None** of the 7 per-bot HR tokens is present in the live env → all 7 bots boot into their "token not configured — skipping" branch and never call `bot.launch()`. They are **dormant** in the current environment.

---

## Near-match (explicitly NOT confirmed to be the SFO bot)

The only real Telegram-bot **@username** literal anywhere in the repo is:

- **`@europrint_check_bot`** — appears in i18n translation strings only:
  - `docs/i18n-quality-errors.md:146` (`europrintCheckBot` → `@europrint_check_bot`)
  - `docs/agents/agent-ru-translations-report.md:125`

This is a **display string in localization files**, not a wired bot token, and its name is `europrint_check`, **not** `SFO_Assistant`. There is also an "Aisha" conversational AI assistant (`modules/aisha/`, described in `docs/full-analysis-2026-05-27/01-architecture-monorepo.md:236`), but it is an in-ERP web chatbot, **not** a Telegram bot and **not** named SFO.

**Neither `@europrint_check_bot` nor Aisha is confirmed to be `@SFO_Assistant_bot`.** They are reported here only for completeness; the owner should decide whether either is what was recalled. Given the names do not match, the more likely explanation is that `@SFO_Assistant_bot` was never part of this repository.

---

## 3. Answering items 7–12 (documentation of the found bot)

Not applicable — **no bot named `@SFO_Assistant_bot` was found**, so there is no handler code, no token, no command set, no data access, no access-control list, and no ERP integration to document for it. (Items 7–12 can only be filled once/if the owner supplies the token or points to where they saw it.)

---

## What "SFO" could mean (open question for owner)

"SFO" does not appear as a defined acronym anywhere in EuroPrint's terminology docs, glossary (`docs/LUGAT.md`), or vision files. It is not an internal EuroPrint abbreviation used in this codebase. If the owner recalls this bot, the most probable situations are:

1. The bot exists **only in Telegram/BotFather** (external), and its token was **never committed** here (consistent with the live env holding only a dummy token). — Most likely.
2. It lived in a **different project/repo**, not EuroPrint-Clean.
3. It is misremembered / was a working name for one of the 7 existing bots (but no evidence ties the name "SFO" to any of them).

To resolve definitively, the owner would need to provide the bot token or the BotFather account so the token can be matched to whichever env var (if any) it was ever placed in.

---

*Investigation complete. No files were created, registered, or modified other than this report. Every claim above is backed by a `file:line` citation, a live config check (values redacted), or an explicit git-history search that returned zero results.*
