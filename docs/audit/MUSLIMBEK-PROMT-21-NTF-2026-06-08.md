# EXECUTOR PROMPT #21 — BUILD T3: NTF / BILDIRISHNOMA + TELEGRAM (per-module bot)
> Foundation clean (prompts #01-#20 done). Now build the notification + Telegram layer that ties every module together.
> Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES
You are the **EXECUTOR**. Read `CLAUDE.md` + `docs/agent-constitution.md` first.
All hard rules apply (violation = phase NOT done):

**Code rules (CLAUDE.md):**
- Zod validation · Drizzle ORM (raw SQL only for complex lateral, with comment) · `sql.raw(variable)` BANNED
- Result<T> pattern everywhere (no throw, no return null)
- File <= 900 lines · function <= 150 lines · magic numbers -> `business.constants.ts`
- Controller = transport only · service does NOT touch DB directly (repo layer)
- `@UseGuards(JwtAuthGuard)` on every controller; no hardcoded secrets; ConfigService only
- `as unknown` stub BANNED — honest `501` if not yet implemented
- Delete operations require ConfirmDialog

**Process rules (LOYIHA-QOIDALARI-2026-06-08.md):**
- **C1** Correctness = vision (`docs/audit/`) not just 200 OK
- **C2** Verify-don't-trust: re-audit first, do NOT rebuild what exists
- **C3** No fake: every endpoint → real DB INSERT/UPDATE; no `{ok:true}` echoes
- **C4** Form round-trip: enter → save → reload → still visible
- **C5** No regression: previously working features stay working
- **C6** No full rewrite: ~70% already exists — fix & connect
- **D3** Re-audit first (Phase 0) → owner approval → build
- **D5** DoD = 7 conditions (see §4 below)
- **E1** AI observes → human confirms negative effects (no auto-penalty)
- **E2** Card-centric: notification routes to the **card/position**, not the person — auto-reroutes when employee changes
- **E3** AI plans order/routing/priority → manager confirms
- **E4** Operator IoT-tablet = floor hub (production halts, brak, TB checklist go through tablet)
- **E5** Org-chart routing: all notifications follow vertical (manager_id chain) + horizontal (workflow_rules)
- **E6** One canonical truth: `sales_orders`, `warehouse_stock`, `entries`; no two-world tables
- **H4** New table = owner approval (`APPROVED:` comment in migration)
- **I4** Executor prompts = English + detailed; reports to owner = Uzbek (lotin)
- `git add <specific-file>` only (never `git add -A`) · commit every phase · no `git stash`

**Design (mandatory, Qoida 21/G1-G2):**
- EP Linear Soft tokens (`var(--ep-*)`, `var(--mod-*)`) + existing templates (ListPage/FormPage/DetailPage/DashboardPage)
- NTF module color = use existing notification/alert token family (amber/orange for alerts, match `--mod-ntf-*` if defined, else `--ep-primary`)
- No new design system; no inline raw colors

═══════════════════════════════════════════════════════════════
## 1. WHY THIS MODULE / GOAL
NTF (Bildirishnoma / Telegram) is the **T3 operational communications layer** — it does not store business data but it is the nervous system that connects every other module: production halts, ЦКП results, order stage changes, digest digests, RD-5 escalations, ShVB command responses.

**Vision = the measure of "correct" (Q-40 / C1):**
The owner decided (Q50/Q101/Q102): **per-module Telegram bots, all wired to the ERP** — not one shared bot. Q140: every notification's send-time is owner-configurable per module. Q152: framework = **Telegraf.js**. ShVB YO'NALISH 38: four commands mandatory (`/zvs_status`, `/my_gsd`, `/company_state`, `/weekly_digest`).

**Source documents — read ALL before building:**
1. `docs/audit/decisions/18-notifications.md` — 82-question decision map (EP-NTF-001..082); 18 answered, 64 A-default. This is the feature registry.
2. `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` § "Bildirishnoma / Telegram" — 4 owner overrides + principle-based A-defaults. **Owner overrides WIN over decision-map A-defaults.**
3. `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` — project-wide rules block (§0 above).
4. `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` — org-unit model, ShVB YO'NALISH 38 cron schedule.
5. `docs/audit/IOT-MES-CURRENT-STATE-2026-06-08.md` — which IoT/MES signals already exist (do not duplicate).
6. `docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md` — warehouse/POS signal context.
7. `CLAUDE.md` full — code rules authority.

**Owner overrides (OCHIQ-JAVOBLAR § NTF — these override A-defaults):**
- **EP-NTF-008** Channel mode = **MIXED**: personal results → personal chat; department summary → group. (Not just personal, not just group.)
- **EP-NTF-018** Quiet hours = **normal during work hours, ONLY critical pass at night**; quiet window is owner-configurable per module (Q140).
- **EP-NTF-021** Telegram actions = **YES** (approve / reject / assign buttons via inline keyboard).
- **EP-NTF-016** Read-acknowledgement = **ONLY for important/urgent messages** ("I didn't see it" excuse eliminated).

**Key cross-cutting principles for NTF:**
- **E2 (card-centric):** Route to **card/position**, not to the person — when employee changes, routing auto-updates. EP-NTF-066 ANSWERED: `op=ntf.route.byCard`.
- **E5 (org-chart routing):** Vertical escalation uses `employees.manager_id` chain (Vysotskiy 7 model). Horizontal uses `workflow_rules` table. EP-NTF-010 + EP-NTF-017.
- **E1 (AI observes → human confirms):** AI can flag anomalies and queue notifications, but NEGATIVE actions (penalty, block, demotion signal) only fire after human confirmation — never auto. EP-NTF-006/007.
- **EP-NTF-019 (ANSWERED):** Per-module bot architecture (not one shared bot); all bots connected to one ERP core.
- **EP-NTF-003 (ANSWERED):** Digest schedule configurable; ShVB default = Monday 10:00 (GSD), Se 09:00 ZVS, daily 18:00 company state.
- **EP-NTF-015 (ANSWERED):** Message language = user's profile language (uz/uz-cyr/ru).
- **EP-NTF-079 (ANSWERED):** "Who-gets-what" routing matrix owned by the owner/director — one table, all routing derived from it.

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT existing NTF implementation (READ-ONLY) — DO THIS FIRST

The Telegram/notification layer is **partially built** (e.g. `TelegramBotAdmin.tsx` mentioned in SHvB-40, `fp-cycle.cron.ts` with 4 cron entries, `getTelegramGroup` in org-queries, some notification events in outbox). **Do NOT rebuild what exists.**

### What to map (read-only — no edits):

**DB / Schema:**
```bash
node _audit/q.cjs "SELECT table_name FROM information_schema.tables WHERE table_name ILIKE '%notif%' OR table_name ILIKE '%telegram%' OR table_name ILIKE '%bot%' OR table_name ILIKE '%alert%' OR table_name ILIKE '%message%' ORDER BY table_name"
```
- List all notification/telegram-related tables with column counts and row counts
- Check `ntf_*`, `notifications`, `telegram_*`, `bot_*`, `system_alerts`, `alert_*` patterns
- Check if `notification_log`, `notification_templates`, `bot_configs`, `notification_schedules` exist

**BE (NestJS):**
- Find all files matching `*telegram*`, `*notif*`, `*bot*`, `*alert*` under `apps/api/src/`
- For each: is it a real service with DB writes or a stub/cron-only?
- List all `@OnEvent` handlers that emit/receive notification events
- Check `fp-cycle.cron.ts` — what 4 crons exist, what do they actually do?
- Check outbox: are notification events being published? Are there consumers?
- Check `getTelegramGroup` — where it lives, what it returns

**FE:**
- Find `TelegramBotAdmin.tsx` or equivalent — what does it render, what mutations exist?
- Find notification bell / notification list in the main layout — real data or stub?
- Find any `/notifications` or `/settings/notifications` page

**Telegraf.js:**
- Is `telegraf` package installed (`package.json`)? Is there a `TelegramModule` or `BotService`?
- How many bots are configured (tokens)? Are they per-module or one shared?

### Output:
Write `docs/NTF-RE-AUDIT-2026-06-08.md` with:
- Table: Feature (EP-NTF-###) | Exists? | Real or Stub | Gap | Effort (S/M/L)
- List what is genuinely working vs pretending
- Identify canonical tables to use vs create (apply H4 — DDL needs owner approval)

**STOP HERE. Show owner the re-audit doc. Wait for "continue" before any build.**

═══════════════════════════════════════════════════════════════
## BUILD PHASES

Each phase follows this sequence:
`permission gate → BE + FE parallel → verify (tsc 0 + DB-proof + FE round-trip) → DoD check → separate commit → report in Uzbek → STOP, wait for "continue"`

---

### PHASE 1 — Core notification infrastructure: tables, templates, routing matrix

**Scope (EP-NTF codes):** EP-NTF-027 (log), EP-NTF-061 (type badges), EP-NTF-062 (priority levels), EP-NTF-079 (routing matrix), EP-NTF-038 (sender/receiver responsibility), EP-NTF-080 (immutable archive).

**Before any DDL: list proposed new tables → get `APPROVED:` from owner.**

Proposed tables (check re-audit first — may already exist partially):
- `ntf_templates` — (id, module_code, event_type, lang, title_template, body_template, priority, updated_at). Editable by admin without code deploy (EP-NTF-028).
- `ntf_log` — (id, template_id, recipient_user_id, recipient_card_id, channel, sent_at, read_at, ack_at, priority, payload JSONB, archived BOOLEAN DEFAULT false). Immutable (no UPDATE on sent rows — EP-NTF-080).
- `ntf_routing_matrix` — (id, event_code VARCHAR, role_code VARCHAR, channel ENUM('personal','group','both'), quiet_hours_exempt BOOLEAN). Owner-editable table — the single truth for "who gets what" (EP-NTF-079).
- `ntf_schedule_config` — (id, module_code, event_code, cron_expr, is_active, quiet_start TIME, quiet_end TIME). Per-module time config (Q140 / EP-NTF-003 / EP-NTF-018).
- `ntf_bot_config` — (id, module_code VARCHAR UNIQUE, bot_token_env_key VARCHAR, is_active BOOLEAN). Per-module bot registry — token stored in env, only env-key name in DB (security: F6 — never store token in DB).

**BE:**
- `NtfModule` with `NtfLogRepository` (Drizzle + Result<T>), `NtfTemplateRepository`, `NtfRoutingRepository`
- `NtfService`: `logNotification()`, `markRead()`, `markAck()`, `getUnread(userId)`, `getLog(filters)`
- `NtfTemplateService`: `getTemplate(module, eventCode, lang)`, `renderTemplate(template, vars)` (mustache or simple `${var}` replacement)
- `NtfRoutingService`: `resolveRecipients(eventCode, orgContext)` — reads routing matrix + Vysotskiy org chain
- Endpoints: `GET /api/ntf/log`, `GET /api/ntf/unread`, `PATCH /api/ntf/:id/read`, `PATCH /api/ntf/:id/ack`, `GET /api/ntf/templates`, `PUT /api/ntf/templates/:id`, `GET /api/ntf/routing-matrix`, `PUT /api/ntf/routing-matrix/:id`
- All endpoints: `@UseGuards(JwtAuthGuard)` + role-check (routing matrix = admin/owner only)
- Apply EP-NTF-038: every log row has `sender_user_id` + `recipient_user_id` + `read_at` (two-sided accountability)

**FE:**
- Notification bell in main layout (header): real `GET /api/ntf/unread` count + dropdown list
- `/notifications` list page using `ListPage` template: filter by type/priority/module/date; mark-read mutation
- `/settings/notifications/templates` — admin-only page: template list + inline edit (EP-NTF-028)
- `/settings/notifications/routing` — admin/owner-only: routing matrix table + edit
- `/settings/notifications/schedule` — per-module cron config (EP-NTF-003 / Q140)
- Type badges (EP-NTF-061): use tokens — `--ep-danger` for CRITICAL, `--ep-warning` for IMPORTANT, `--ep-muted` for INFO

**Verify:** `tsc 0` · `POST` a log row → `GET /api/ntf/unread` returns it · FE bell count updates · reload persists.

**DoD:** all 7 conditions (§4). Op-codes logged: `EP-NTF-027`, `EP-NTF-061`, `EP-NTF-062`, `EP-NTF-079`.

**Commit separately.** Report to owner in Uzbek.

---

### PHASE 2 — Telegraf.js bot layer: per-module bots + ShVB commands

**Scope (EP-NTF codes):** EP-NTF-001 (ShVB 4 commands), EP-NTF-019 (per-module bot), EP-NTF-015 (per-user language), EP-NTF-022 (bot RBAC), EP-NTF-023 (user onboarding), EP-NTF-021 (inline keyboard actions).

**Owner overrides:** EP-NTF-021 = YES (approve/reject/assign inline buttons). EP-NTF-015 = user profile language (uz/uz-cyr/ru).

**Architecture:**
- One `TelegramCoreModule` (Telegraf.js) — shared middleware (auth, RBAC, language resolver)
- Per-module bot instantiation driven by `ntf_bot_config` table (token from `ConfigService.get(row.bot_token_env_key)`, never from DB value)
- Security: bot command handler checks ERP JWT or telegram_id↔user mapping before any data is returned (EP-NTF-022 + F1)

**BE:**
- `TelegramCoreService`: `sendToUser(telegramId, message, opts)`, `sendToGroup(groupId, message, opts)`, `buildInlineKeyboard(actions[])`, `resolveUserLang(telegramId)`
- `TelegramUserLinkService`: maps `telegram_id` to ERP `user_id` + `language` (EP-NTF-015); uses existing `employees.telegram_id` column if present (check re-audit)
- ShVB command handlers (EP-NTF-001, ANSWERED — YO'NALISH 38):
  - `/zvs_status` → query Finance GL for ZVS metrics for the requesting user's department
  - `/my_gsd` → query Org/KPI for the user's card ЦКП result (current week)
  - `/company_state` → query 7-otdeleniye summary (EP-NTF-011): production%, sales, quality, cash — only for director/owner role (EP-NTF-022 RBAC)
  - `/weekly_digest` → trigger digest for that user now (EP-NTF-003)
- Onboarding flow (EP-NTF-023): when HR adds employee, generate one-time link `/start?token=<uuid>` → user taps → telegram_id linked to ERP user_id
- Inline keyboard (EP-NTF-021): `APPROVE_<taskId>`, `REJECT_<taskId>`, `ASSIGN_<taskId>` buttons; callback_query handler validates role, writes to DB via appropriate module's service, logs to `ntf_log`

**FE (admin):**
- `/settings/telegram/bots` — list `ntf_bot_config` rows (module_code, is_active, last_ping); toggle active; test-ping button
- Bot onboarding link generator (HR flow integration): show link in employee form after save

**Quiet hours (EP-NTF-018 / EP-NTF-063 ANSWERED):**
- Before `sendToUser`/`sendToGroup`, check `ntf_schedule_config.quiet_start..quiet_end`
- If quiet and priority != CRITICAL → enqueue for next morning (BullMQ delayed job)
- CRITICAL always passes through (EP-NTF-063)

**Verify:** run bot locally (test token from env) → `/zvs_status` returns real DB data, not mock · onboarding link creates DB row · RBAC: regular employee cannot call `/company_state`.

**DoD:** all 7. Op-codes: `EP-NTF-001`, `EP-NTF-019`, `EP-NTF-022`, `EP-NTF-023`.

**Commit separately.** Report in Uzbek.

---

### PHASE 3 — Digest engine: weekly digest + FP-cycle cron + leaderboard + ЦКП

**Scope (EP-NTF codes):** EP-NTF-003 (digest schedule), EP-NTF-004 (digest routing), EP-NTF-005 (FP-cycle reminders), EP-NTF-012 (leaderboard), EP-NTF-013 (card-AI fit digest), EP-NTF-020 (PDF attachment), EP-NTF-026 (ЦКП weekly), EP-NTF-045 (tri-rhythm: daily/weekly/monthly), EP-NTF-065 (aggregate vertical).

**Owner overrides (A-default confirmed):** EP-NTF-003 C-option = configurable; ShVB default = Monday 10:00 GSD, Se 09:00 ZVS, daily 18:00 company state. EP-NTF-004 = org-route (each level gets their own level's summary).

**BE:**
- `DigestService`: `buildUserDigest(userId, period)` — aggregates from HR/KPI, Org/ЦКП, Finance, MES modules; returns structured DTO
- `DigestCronService`: reads `ntf_schedule_config` for each module → triggers at configured cron expressions (BullMQ cron jobs, not hardcoded); replaces/extends existing `fp-cycle.cron.ts` (verify re-audit — do not regress existing crons)
- Vertical aggregation (EP-NTF-065): operator gets own data; department head gets department summary; org tree walks `manager_id` chain; director gets company-wide
- Leaderboard (EP-NTF-012): top-3 and bottom-3 by card ЦКП% — per department and overall; computed from existing KPI data (do NOT create new KPI storage)
- Card-AI fit digest (EP-NTF-013): reads AI assessment result (if AI module has one) and appends to digest — if AI module not yet ready, honest 501 wrapper (do not fake)
- ЦКП weekly (EP-NTF-026): per-card result% → sent to employee + manager; pulls from existing ЦКП tracking in Org module
- PDF attachment (EP-NTF-020): use existing PDF generation if available (check re-audit); if not, plain-text fallback with link to ERP full report (honest partial implementation)
- Tri-rhythm (EP-NTF-045): 3 separate crons — end-of-shift / weekly / monthly; separate addressees per rhythm; each idempotent (re-run safe)

**FE:**
- `/reports/digest` — view past digests sent to the current user (from `ntf_log` with type='digest')
- Digest preview in admin: `/settings/notifications/digest-preview?userId=X&period=week`

**Verify:** trigger digest manually via admin endpoint → `ntf_log` row created → Telegram message sent (test env) → FE digest page shows the row.

**DoD:** all 7. Op-codes: `EP-NTF-003`, `EP-NTF-005`, `EP-NTF-012`, `EP-NTF-026`, `EP-NTF-045`.

**Commit separately.** Report in Uzbek.

---

### PHASE 4 — Production / RD-5 escalation signals (critical-path alerts)

**Scope (EP-NTF codes):** EP-NTF-029 (production halt), EP-NTF-033 (ANSWERED — tech-card error 15-min), EP-NTF-034 (ANSWERED — 1-hour fix countdown), EP-NTF-035 (ANSWERED — night phone escalation), EP-NTF-036 (ANSWERED — night solo decision), EP-NTF-039 (ANSWERED — customer issue → sales), EP-NTF-040 (ANSWERED — trio meeting 1 hour), EP-NTF-047 (material shortage), EP-NTF-048 (equipment fault), EP-NTF-049 (delay risk button), EP-NTF-050 (late report measure), EP-NTF-059 (ANSWERED — defect route by role), EP-NTF-063 (ANSWERED — critical exempt from quiet hours).

**Note on IoT integration:** Equipment fault (EP-NTF-048) and production halt (EP-NTF-029) signals may already originate from IoT/MES module. **Check `IOT-MES-CURRENT-STATE-2026-06-08.md` and re-audit output first.** Do NOT duplicate — wire NTF as the delivery layer, not the detection layer.

**Owner overrides (all ANSWERED — respect exactly):**
- EP-NTF-033: tech-card error → head technologist signal + 15-min timer; no response → escalate to RD-4.
- EP-NTF-034: fix assignment → 1-hour countdown; 45-min reminder; 60-min → "deadline passed" to RD-5.
- EP-NTF-035: night-time call logged ("called / answered / not answered"); if no answer → visible to manager next morning.
- EP-NTF-036: night solo-decision → flagged log entry → visible in morning digest to head technologist + RD-5.
- EP-NTF-039: customer-related issue flag → auto-route to the order's sales manager (technical solution NOT given to sales — role boundary).
- EP-NTF-040: trio meeting call → signal to 3 leaders (RD-2/RD-4/RD-5) + 1-hour timer + decision logged.
- EP-NTF-059: defect signal → routed by nature: technical → technologist; customer-related → sales manager; role boundary enforced.
- EP-NTF-063: CRITICAL priority exempt from quiet hours always.

**BE:**
- `EscalationService`: `startCountdown(eventCode, contextId, durationMs, escalateTo)` — BullMQ delayed job; cancellable on resolve
- `TechCardAlertHandler` (EP-NTF-033/034): listens to `TechCardErrorEvent` from QC/MES module (or creates `@OnEvent('qc.techcard.error')`); starts 15-min + 1-hour countdowns; writes to `ntf_log` with `priority=CRITICAL`
- `NightProtocolHandler` (EP-NTF-035/036): call-log endpoint (`POST /api/ntf/night-call`) with `{caller_id, callee_id, called_at}` → `ntf_log` row; `PATCH /api/ntf/night-call/:id/answered` sets `answered_at`; morning digest aggregates unanswered
- `ProductionHaltHandler` (EP-NTF-029): `@OnEvent('mes.production.halt')` → CRITICAL signal to shift master + maintenance + department head simultaneously (EP-NTF-008 mixed channel rule applies)
- `MaterialShortageHandler` (EP-NTF-047): `@OnEvent('wms.stock.low')` → signal to head planner + procurement department
- `DelayRiskButton` (EP-NTF-049): `POST /api/ntf/delay-risk` with `{order_id, reporter_id, reason?}` → logs + notifies department head immediately
- `LateReportMeasure` (EP-NTF-050): cron job reads open issues, compares `issue_created_at` vs `first_notification_at`; stores delta in `ntf_log.payload`; feeds into monthly KPI (existing HR KPI system)
- `DefectRouter` (EP-NTF-059): `@OnEvent('qc.defect.detected')` → reads `defect.nature` flag → routes to technologist OR sales manager (never both for same message)

**FE:**
- `/ntf/escalations` — real-time escalation dashboard (admin/director): active countdowns, overnight unanswered calls, open production halts
- Delay-risk button: component added to MES/PP order detail page — one-tap, fires mutation, shows confirmation toast
- Night call log: accessible in `/ntf/night-log` for directors/HR

**E4 (IoT-tablet integration):** The production halt signal and delay-risk button should ALSO be accessible from the POS/IoT tablet view — confirm with POS module owner before adding there.

**Verify:** emit `mes.production.halt` event in test → check `ntf_log` row with CRITICAL priority created → Telegram message sent → quiet hours do NOT block it (EP-NTF-063).

**DoD:** all 7. Op-codes: `EP-NTF-029`, `EP-NTF-033`, `EP-NTF-034`, `EP-NTF-035`, `EP-NTF-036`, `EP-NTF-040`, `EP-NTF-059`.

**Commit separately.** Report in Uzbek.

---

### PHASE 5 — Document / governance signals + Orgorpolitika notifications

**Scope (EP-NTF codes):** EP-NTF-031 (ANSWERED — written formalize), EP-NTF-032 (verbal→written 24h track), EP-NTF-037 (bypass emergency signal), EP-NTF-041 (halt broadcast to chain), EP-NTF-042 (ANSWERED — orgpolicy announce), EP-NTF-043 (repeat error → write policy), EP-NTF-044 (daily NO-3 report reminder), EP-NTF-051 (card status change), EP-NTF-052 (approval wait signal), EP-NTF-053 (TT incomplete), EP-NTF-054 (corrector block), EP-NTF-055 (unapproved file), EP-NTF-056 (verbal plan = not official), EP-NTF-057 (plan change broadcast), EP-NTF-066 (ANSWERED — route by card/position), EP-NTF-067 (responsibility written-only), EP-NTF-074 (Kanban stuck), EP-NTF-075 (order completion report), EP-NTF-076 (scope violation), EP-NTF-077 (ANSWERED — adaptation confirm).

**Owner overrides (ANSWERED — respect exactly):**
- EP-NTF-031: 6 types of Telegram messages auto-formalized to official record (decision/plan-change/task/techcard-change/quality-conclusion/warning) → number + date + author assigned.
- EP-NTF-042: new orgpolicy → НО-3 + adaptation manager signal + 1-day training start deadline.
- EP-NTF-066: route to **card/position**, not person — when employee swaps, new holder gets it automatically.
- EP-NTF-077: employee reads + confirms new orgpolicy/instruction via Telegram button → НО-3 sees confirmed list.

**BE:**
- `FormalizeHandler` (EP-NTF-031): intercept 6 message types from Telegram → create `ntf_formal_record` entry (or use `ntf_log` with `is_formal=true`, `formal_ref_number`); auto-assign sequential ref number per type per year
- `VerbalTracker` (EP-NTF-032): `POST /api/ntf/verbal-task` → starts 24h countdown; if no written follow-up → signal to responsible + manager
- `BypassSignal` (EP-NTF-037): `POST /api/ntf/bypass-emergency` with `{reason}` → mandatory reason logged + copy to bypassed manager's Telegram
- `CardStatusSignal` (EP-NTF-051): `@OnEvent('crm.card.status_changed')` → next-stage responsible gets signal; uses routing matrix
- `ApprovalWaitSignal` (EP-NTF-052): approval request created → approver notified immediately + reminder at configurable interval → escalation if no response
- `TtIncompleteGuard` (EP-NTF-053): `@OnEvent('crm.tt.created')` → validate required fields; if missing → block progression + signal to sales team
- `CorrectorBlockSignal` (EP-NTF-054): `@OnEvent('design.corrector.error')` → signal to designer + block card progression until fixed
- `UnapprovedFileSignal` (EP-NTF-055): `@OnEvent('design.file.sent_unapproved')` → signal to department manager + log
- `KanbanStuckSignal` (EP-NTF-074): cron (configurable interval from `ntf_schedule_config`) → check kanban cards stale beyond threshold → signal to responsible + department head
- `AdaptationConfirm` (EP-NTF-077): Telegram inline button "Men o'qidim va tasdiqlaydi" → `POST /api/ntf/adaptation-confirm` → record in `ntf_log` with `ack_at`; НО-3 dashboard shows confirmed list
- Route-by-card (EP-NTF-066): `NtfRoutingService.resolveRecipients` uses `org_functions`/card table to find current holder, falls back to department head if vacant

**FE:**
- `/ntf/formal-records` — list of formalized Telegram messages (admin/director); filterable by type/date/ref
- Kanban stuck view integrated in Kanban module (flag badge on stuck cards, not new page)
- Adaptation confirmation status list in HR/LMS module (not new page — add column to existing adaptation tracker)

**Verify:** change a CRM card status → `ntf_log` row created with correct `recipient_card_id` → Telegram message delivered → after employee swap on that card, next event goes to new holder.

**DoD:** all 7. Op-codes: `EP-NTF-031`, `EP-NTF-042`, `EP-NTF-051`, `EP-NTF-066`, `EP-NTF-077`.

**Commit separately.** Report in Uzbek.

---

### PHASE 6 — Resend, escalation, ack, razryad, and remaining signals

**Scope (EP-NTF codes):** EP-NTF-006 (threshold alert), EP-NTF-007 (ANSWERED — owner sets thresholds), EP-NTF-009 (group↔org bind), EP-NTF-010 (vertical routing), EP-NTF-014 (razryad change), EP-NTF-016 (OWNER OVERRIDE — ack only for important/urgent), EP-NTF-017 (escalation vertical), EP-NTF-024 (order stage golden-thread), EP-NTF-025 (deadline two-stage), EP-NTF-030 (praise/feedback), EP-NTF-038 (responsibility split), EP-NTF-046 (shift report), EP-NTF-058 (analytics channel), EP-NTF-060 (damaged material), EP-NTF-064 (deadline two-stage rule), EP-NTF-068 (monthly responsibility digest), EP-NTF-069 (data request deadline), EP-NTF-070 (stale data warning), EP-NTF-071 (meeting task reminder), EP-NTF-072 (phone call log — night), EP-NTF-073 (mid-order plan change), EP-NTF-078 (shift handover), EP-NTF-081 (defect weekly stats), EP-NTF-082 (resend schedule).

**Owner overrides in effect:**
- EP-NTF-016 (OVERRIDE): ack button ONLY on important/urgent priority messages — not on every notification.
- EP-NTF-007 (ANSWERED): threshold per card/module = owner-configurable in `ntf_routing_matrix` / `ntf_schedule_config`; no universal fixed number.
- EP-NTF-008 (OVERRIDE, already implemented in Phase 1/2): mixed channel confirmed — personal results personal, dept summary group.

**BE:**
- `ThresholdAlertService` (EP-NTF-006/007): reads `ntf_routing_matrix` for configured thresholds per event_code; compares incoming metric; if crossed → IMPORTANT priority notification; triggered by AI observing (E1 — never auto-penalizes)
- `OrgGroupBinder` (EP-NTF-009): `PUT /api/ntf/org-group` `{org_unit_id, telegram_group_id}` → update org unit record (uses existing `getTelegramGroup` mechanism from org-queries)
- `VerticalRouter` (EP-NTF-010/017): in `NtfRoutingService` — walks `manager_id` chain from `employees` table; if employee.manager_id is NULL/0 → log warning (known backfill gap) + fall back to department head
- `RazryadChangeHandler` (EP-NTF-014): `@OnEvent('org.razryad.changed')` → notify employee + manager + HR simultaneously; include salary impact if changed (card-centric — EP-NTF-066)
- `AckManager` (EP-NTF-016/082): for `priority=IMPORTANT` or `priority=CRITICAL` messages only, set `requires_ack=true` in `ntf_log`; resend after configurable delay (default 30 min, 2 times) → then escalate (EP-NTF-017); DO NOT require ack for INFO priority
- `OrderStageHandler` (EP-NTF-024): `@OnEvent('sd.order.stage_changed')` → notify responsible department + sales manager + (if delayed) manager; golden-thread signal
- `DeadlineTwoStage` (EP-NTF-025/064): generic helper — `scheduleDeadlineAlerts(contextId, deadline, earlyWarnDuration, onBreachRecipientIds)` — used by PP, Kanban, Tech-card phases; reuse same pattern
- `PraiseFeedback` (EP-NTF-030): `POST /api/ntf/praise` `{recipient_card_id, message, is_public}` → if `is_public` → group channel; if negative → personal only; AI suggests based on KPI result, human (manager) sends (E1)
- `ShiftHandover` (EP-NTF-078): `@OnEvent('mes.shift.handover')` → open tasks + open STOPs → sent to next shift responsible + technologist; uses existing `mes_shift_handovers` view (check re-audit)
- `DefectWeeklyStats` (EP-NTF-081): weekly cron → aggregate defect counts by department from QC data → format as digest section; include repeat-offenders for EP-NTF-043 policy-writing trigger
- `StaleDataWarn` (EP-NTF-070): `@OnEvent('design.techcard.updated')` → find users who had old version open → notify "updated version available, please switch"
- `MonthlyResponsibilityDigest` (EP-NTF-068): monthly cron → Совершенствование + department heads receive decision→responsible→outcome table
- `MidOrderPlanChange` (EP-NTF-073): `@OnEvent('pp.plan.changed_mid_order')` → log reason (mandatory) + add to monthly inefficiency analysis

**FE additions:**
- Notification settings: per-user quiet hours preference (within owner-configured window)
- Admin: threshold config per event_code per module (UI for `ntf_routing_matrix` rows)
- Praise sender: small widget in employee card/KPI page for managers to send praise

**Verify:** trigger `sd.order.stage_changed` → `ntf_log` row with correct recipient card → send IMPORTANT message → confirm ack button appears in Telegram → re-send after 30 min if not acked.

**DoD:** all 7. Op-codes: `EP-NTF-006`, `EP-NTF-014`, `EP-NTF-016`, `EP-NTF-017`, `EP-NTF-024`, `EP-NTF-082`.

**Commit separately.** Report in Uzbek.

═══════════════════════════════════════════════════════════════
## 4. DoD — "TAYYOR" 7 SHART (har faza)

1. **BE real:** CRUD endpoints + Result<T> + Zod + real DB INSERT/UPDATE (no `{ok:true}` echo, no `[] as unknown`)
2. **FE real:** ListPage/FormPage/DetailPage/DashboardPage template + EP tokens, loading skeleton, error toast, form saves and persists on reload
3. **Docs:** update `docs/NTF-RE-AUDIT-2026-06-08.md` with phase completion notes
4. **Tests:** BE unit tests for service logic (routing, escalation countdown cancellation); FE component smoke tests
5. **i18n:** all new UI strings in `uz` + `ru` translation files; no hardcoded Uzbek/Russian text in TSX
6. **Edge cases:** manager_id NULL/0 → graceful fallback logged; quiet hours edge (midnight crossing); duplicate event deduplication (idempotency key in `ntf_log`)
7. **Automation:** cron jobs run on schedule (verify with BullMQ inspector); `@OnEvent` handlers registered and consuming; outbox events not accumulating

**Op-code logging:** every operation logs `level=info code=EP-NTF-<###> module=ntf action=<action> userId=<id>` (matches LOYIHA-QOIDALARI J1/J2).

═══════════════════════════════════════════════════════════════
## 5. RAILS (enforced on every phase)

| Rail | Rule |
|------|------|
| Permission gate | Before any edit: `fayl:satr` + exact change + reason → owner "ha" required |
| DDL | Any new `CREATE TABLE` or column → write `APPROVED:` comment in migration → STOP for owner sign-off |
| Canonical tables | `sales_orders` (not `orders`), `warehouse_stock` (not `stocks`), `entries` (not `gl_journal_entries`) — never create duplicate |
| No regression | Run `bash scripts/run-all-reviewers.sh` before and after each phase; zero new FAILs allowed |
| No rewrite | Existing working Telegraf bot code, fp-cycle crons, getTelegramGroup → extend, do NOT replace |
| Honest 501 | If AI module not ready → `throw new HttpException('AI module not yet ready', 501)` — never return fake data |
| Commits | `git add <specific-files>` only; one commit per phase; message includes phase number and EP-NTF codes |
| Report | After each phase write a Uzbek-language holat hisoboti to owner (done / deferred / commit hash) |
| Wait | After each phase STOP and wait for owner "continue" before starting the next |

═══════════════════════════════════════════════════════════════
## 6. STOP POINTS — mandatory pause for owner decision

1. **After Phase 0 RE-AUDIT** — before writing a single line of new code. Show gap table.
2. **Before any DDL** — list proposed tables/columns → get `APPROVED:` from owner (Q-35/H4).
3. **Before Phase 2** — confirm which Telegram bot tokens are in `.env` for each module; confirm per-module bot architecture is approved (vs one shared bot).
4. **Before Phase 4** — confirm IoT/MES integration points (what signals already exist); do NOT duplicate production-halt detection.
5. **Before Phase 5** — confirm `ntf_formal_record` design (use `ntf_log` extension vs separate table) — DDL decision.
6. **After each phase** — show Uzbek holat hisoboti; wait for "continue".

═══════════════════════════════════════════════════════════════
## QUICK REFERENCE — EP-NTF codes by phase

| Phase | EP-NTF codes (key) | Owner-decided / ANSWERED |
|-------|--------------------|--------------------------|
| 0 | RE-AUDIT | — |
| 1 (infra) | 027, 061, 062, 079, 038, 080 | 079 (routing matrix = owner table) |
| 2 (bots) | 001, 019, 015, 022, 023, 021 | 001, 019 (per-module), 015 (lang), 021 (inline actions) |
| 3 (digest) | 003, 004, 005, 012, 013, 020, 026, 045, 065 | 003 (configurable, ShVB defaults) |
| 4 (RD-5 alerts) | 029, 033, 034, 035, 036, 039, 040, 047, 048, 049, 050, 059, 063 | 033, 034, 035, 036, 039, 040, 059, 063 |
| 5 (governance) | 031, 032, 037, 041, 042, 043, 044, 051, 052, 053, 054, 055, 056, 057, 066, 067, 074, 075, 076, 077 | 031, 042, 066, 077 |
| 6 (remaining) | 006, 007, 009, 010, 014, 016, 017, 024, 025, 030, 038, 046, 058, 060, 064, 068, 069, 070, 071, 072, 073, 078, 081, 082 | 007, 016 (ack=important only) |

Total: 82 EP-NTF codes across 6 build phases (+ Phase 0 re-audit).
