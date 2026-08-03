# EXECUTOR PROMPT #15 — BUILD T2: AI / MARKAZIY-AI (per-card AI, camera cross-check)
> Foundation (#01) done. ORG/KARTALAR (#02) is the prerequisite — AI plugs into the card model.
> Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES
You are the 🟢 **EXECUTOR**. Read `CLAUDE.md` + `docs/agent-constitution.md` first.
All hard rules from `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` apply in full:

**Code (B-block):**
- TypeScript strict · Zod validation only (no class-validator) · Drizzle ORM (no `sql.raw(variable)`) · Result<T> pattern (no throw/null) · file ≤900/func ≤150 · constants in `business.constants.ts` (no magic numbers) · Controller = transport only (business logic in service) · Service never hits DB directly (repo layer) · ConfigService not `process.env` · every controller guarded (`@UseGuards`/`@Public`).

**Correctness (C-block):**
- **No fake (Q-40/C3):** every endpoint does a real DB operation; `{ok:true}` / echo / `[] as unknown` = FORBIDDEN. Honest **501** if table not ready.
- **Verify-don't-trust (Q-29/C2):** treat every audit claim as stale until confirmed by live code + DB probe.
- **Permission gate (Q-28/I3):** before any change show `file:line` + exact delta + reason → wait for owner "yes".
- **DDL = owner approval (Q-35/H4):** every new table/column/migration needs `APPROVED:` comment before running.
- **No regressions (Q-39/C5):** what worked before must still work after.
- **No rewrite (C6):** system is ~70% built — fix & connect only.

**Design (G-block / Q-41):**
- EP Linear Soft tokens (`var(--ep-*)`, `var(--mod-*)`) only — no inline hex colors.
- New page = existing template (ListPage / FormPage / DetailPage / DashboardPage) + props — no new design.
- Tab nesting max 2 levels (Q-42). Buttons in standard positions (Q-41).
- AI module color = neutral/indigo family (consult existing `var(--mod-ai-*)` token or define once in the token file).

**Data canonical (H-block):**
- Orders = `sales_orders` · Stock = `warehouse_stock` · GL = `entries` · No two-world tables.
- New table → first run the "two-world check" (H4) → only then request owner approval.

**Process (I-block):**
- `git add <specific-file>` only (never `-A`) · commit after every phase · report to owner in **Uzbek** after each phase · wait for "davom" before next phase.

**Cross-cutting build-rails (E-block — mandatory for THIS module):**
- **E1 (AI observes → human confirms):** AI flags/detects; negative effects (penalty/block/grade-drop/salary-gate) ONLY with human approval — never automatic.
- **E2 (Card-centric):** AI context = `card_id`; data aggregates card → profile; AI fits against the card definition, not against the employee directly.
- **E3 (AI plans):** AI auto-proposes order/route/priority; manager confirms.
- **E4 (Operator IoT-tablet):** AI camera feed + ЦКП auto-collect flows through the operator tablet (floor hub).
- **E5 (Org-chart routing):** AI reports route via `manager_id` chain (vertical), not by "dept head" shortcut.
- **E6 (One canonical truth):** single master data (card-model DDL); A-System replaced in full.

═══════════════════════════════════════════════════════════════
## 1. WHY THIS MODULE / GOAL (Q-40 — the measure of "correct")

The **AI / Markaziy-AI** module is T2 (Management/Control layer) — the "brain" of the ERP.
Vision: **one central AI** that every module connects to; inside it are director / finance / HR "views"
(no scattered per-module AI). The AI's primary axis is the **card↔employee fit** (KARTALAR Q30, owner-confirmed A):
the central AI evaluates every card↔employee match using data from MES/QC/HR/LMS/attendance/ЦКП,
produces PDF reports for employee + manager + HR (KARTALAR Q31, owner-confirmed A), and routes them
through the org-chart manager chain (E5).

**AI is T2 but ORG/KARTALAR (T1) is its prerequisite.** Do not start building AI until
`card_id` FK is available and the card master-data CRUD is live (EP-AI-034, EP-AI-002).

**Source documents (read these; build only to what is decided here):**
- `docs/audit/decisions/17-ai.md` — full decision map (95 questions, EP-AI-001..095; 42 answered, 53 A-default)
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` §AI section — owner overrides for EP-AI-025/028/042/059 (these OVERRIDE A-defaults)
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` — project rules (this section)
- `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` — AI planning 7-step, rating 7-factor, gofra 3-formula
- `docs/audit/IOT-MES-CURRENT-STATE-2026-06-08.md` — IoT/MES current state (AI receives events from here)
- `docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md` — POS/warehouse context where AI monitors

**Owner overrides from OCHIQ-JAVOBLAR (§AI — these take precedence over A-defaults):**
- **EP-AI-028** camera cross-check = **Yes** (employee report ↔ camera observation compared; mismatch → manager/HR signal).
- **EP-AI-042** legacy import = **Yes** (historical data from old system imported once for AI learning; A-System archived).
- **EP-AI-025** AI chat scope = **both** (ЦКП/training teaching + ERP data queries, within RBAC card scope).
- **EP-AI-059** feedback tone = **constructive** (weakness + concrete improvement step together; not punishment, growth direction).

**Global principle (OCHIQ-JAVOBLAR §GLOBAL):**
> AI OBSERVES and FLAGS (camera, downtime, defect, low-fit, late-arrival), but NEGATIVE effects
> (penalty / score-drop / block / grade-demotion) happen ONLY via human approval — NEVER automatic.
> This applies to every AI-triggered action in this module.

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT existing AI implementation (READ-ONLY) — DO THIS FIRST

The system already has partial AI infrastructure. **Do not rebuild what exists.**
Map exactly what is real vs stub:

**Tables to locate and check row counts (use `_audit/q.cjs` read-only):**
- `ai_alerts`, `ai_recommendations`, `ai_report_log`, `ai_fit_scores`, `ai_chat_sessions`,
  `ai_chat_messages`, `ai_ckp_questions`, `ai_ckp_responses`, `ai_violation_log`,
  `ai_block_log`, `ai_provider_config`, `ai_self_calibration` — list columns + row counts.
- Also check existing forecast/ai-data/finance-ai/warehouse-kpi repos flagged WARN in CLAUDE.md
  (`ai-alerts.service.ts` — 5 direct DB calls; confirm what is real vs stub).

**Services/controllers to locate:**
- `apps/api/src/modules/ai/` (or similar) — list all controllers, services, repos.
- Look for: `AiAlertsService`, `AiRecommendationService`, `CentralAiService`, `AiFitService`,
  `GeminiService`, `AiChatService` — for each: real DB or stub?
- Check `ai-alerts.service.ts` (CLAUDE.md flags 5 direct-DB calls — confirm which ones).
- Check `ForecastService`, `FinanceAiService` (WARN repos from CLAUDE.md §Qoida 1).

**Frontend pages to locate:**
- FE route `/ai` — currently `StubPage` (listed in CLAUDE.md F4). What subpages exist?
- `/ai-camera`, `/ai-exam`, `/ai/hr`, `/ai/marketing`, `/ai-planning`, `/ai/wms` — all stubs per CLAUDE.md.
- Look in `artifacts/erp-dashboard/src/pages/` for any existing AI-related pages.

**Event listeners to verify:**
- Which AI-related `@OnEvent` handlers exist and are they real (MEMORY: many 0-listener events)?
- Does the outbox deliver to AI handlers? (`domain_events` table row count?)

**Write gap table to `docs/AI-RE-AUDIT-2026-06-08.md`:**

| Feature (vision) | EP-AI code | Exists? | Real/Stub | Gap | Effort |
|---|---|---|---|---|---|
| Central AI architecture | EP-AI-001 | | | | |
| Card context resolution | EP-AI-002 | | | | |
| ЦКП daily chatbot | EP-AI-008 | | | | |
| Salary gate (3h/16h) | EP-AI-010 | | | | |
| IoT/MES auto-ЦКП | EP-AI-011 | | | | |
| Company state log | EP-AI-014 | | | | |
| Bonus recommendation | EP-AI-019 | | | | |
| 3-day profile block | EP-AI-030 | | | | |
| AI succession list | EP-AI-029 | | | | |
| Weekly digest cron | EP-AI-044 | | | | |
| Report route to manager | EP-AI-045 | | | | |
| Camera cross-check | EP-AI-028 | | | | |
| Violation detect | EP-AI-027 | | | | |
| Gemini provider config | EP-AI-032 | | | | |
| PDF report | EP-AI-006 | | | | |
| AI chat (both scopes) | EP-AI-025 | | | | |
| Director top-3 priorities | EP-AI-080 | | | | |
| Burnout early detect | EP-AI-082 | | | | |
| Human override + log | EP-AI-052/060 | | | | |
| Dispute / appeal | EP-AI-090 | | | | |
| Self-calibration report | EP-AI-095 | | | | |

→ **STOP after writing audit. Show owner. Get approval before Phase 1.**

═══════════════════════════════════════════════════════════════
## BUILD PHASES
Each phase: permission gate → BE + FE parallel → verify (tsc 0 + DB-proof + FE persist round-trip) → DoD → separate commit → report in Uzbek → wait for "davom".

---

### PHASE 1 — Central AI infrastructure + Gemini provider config
**Decided features:** EP-AI-001 (one central AI), EP-AI-002 (card context), EP-AI-032 (Gemini provider), EP-AI-034 (single master data source), EP-AI-065 (graceful degrade), EP-AI-074 (mask before provider).

**What to build:**
- `CentralAiService` — singleton that resolves `card_id` from JWT (E2), builds AI context object, calls Gemini API. Every AI feature goes through this service.
- `AiProviderConfigService` — reads from `ai_provider_config` table: Gemini API key (from `ConfigService`, never hardcoded — Qoida A), per-task enable/disable, cost limit, model version. Owner-configurable from settings UI (EP-AI-032).
- **Privacy guard (EP-AI-074):** before sending any data to Gemini, strip PII fields (salary amounts, personal ID, health data) — mask to anonymized tokens. Log what was masked in audit-log (A6).
- **Graceful degrade (EP-AI-065):** if Gemini is unreachable, ERP continues; AI-dependent gates (salary-gate, block) are deferred not crashed; return `{aiAvailable: false}` flag to callers.
- **DDL (owner approval required — Q-35):** `ai_provider_config` table (id, task_code, enabled, model, cost_limit_daily, updated_by, updated_at). Request `APPROVED:` before migration.
- FE: Settings → AI Config page (DetailPage template) — show provider status, enable/disable per task, daily cost counter. Real save (E2 RBAC: only `super_admin`/`director`).

**Verify:** tsc 0 · DB-proof (`ai_provider_config` row round-trip) · Gemini reachability test with masked payload · degrade mode returns correct flag.

**op-codes logged:** `ai.central.architecture` · `ai.context.resolveByCard` · `ai.provider.config` · `ai.privacy.maskBeforeProvider` · `ai.failover.gracefulDegrade` · `ai.datasource.singleMaster`.

---

### PHASE 2 — ЦКП daily chatbot + salary gate + IoT/MES auto-collect
**Decided features:** EP-AI-008 (ЦКП chatbot), EP-AI-009 (question generation), EP-AI-010 (salary gate), EP-AI-011 (IoT/MES auto-ЦКП), EP-AI-039 (validate measurable), EP-AI-044 (3-tier reports).

**Owner-confirmed details:**
- ЦКП question generation: AI reads the ЦКП text + formula from the card (HR wrote it per EP-ORG-049/111), generates daily question for the employee (KARTALAR Q16 = A). HR approves question bank before go-live.
- Salary gate: if employee does not submit ЦКП report by the deadline, that day is not credited in payroll. HR can override (add it back) with director approval. **Deadline: owner confirmed KARTALAR Q18 (16h) vs ShVB Q118 (3h) — ⚠️ CONFLICT; ask owner before coding the hard cutoff time.**
- IoT/MES auto-ЦКП (EP-AI-011): for machine operators, ЦКП data comes automatically from IoT production session (KARTALAR Q17 = A). Listen to `MES_SESSION_COMPLETED` event → write ЦКП result for operator's card.
- Validate measurable (EP-AI-039): when HR creates/edits ЦКП text for a card, AI checks if it is measurable (SON/FOIZ/VAQT per EP-ORG-049) and returns a warning if not. HR can override.

**DDL (owner approval required):**
- `ai_ckp_questions` (id, card_id, question_text, formula_ref, approved_by_hr, created_at).
- `ai_ckp_responses` (id, employee_id, card_id, date, response_text, auto_from_iot, iot_session_id, submitted_at).
- `ai_salary_gate_log` (id, employee_id, card_id, date, gate_passed, override_by, director_approved, note).

**What to build:**
- `AiCkpService.generateDailyQuestions(card_id)` — Gemini call with ЦКП formula context.
- CRON: every working day end (configurable time from `ai_provider_config`) → generate questions for all active cards → Telegram notification per employee (Telegraf.js, LOYIHA-QOIDALARI A8).
- `AiCkpService.submitResponse(employee_id, card_id, date, text)` — saves response, marks gate passed.
- Event listener `@OnEvent('MES_SESSION_COMPLETED')` → auto-write ЦКП for operator card (no chatbot needed).
- CRON: salary gate check at deadline time → write `ai_salary_gate_log`.
- FE: Employee ЦКП dashboard (DashboardPage template) — daily question + text input + submit. Operator sees their auto-collected data read-only. HR gate override page (with ConfirmDialog — Qoida 14).

**⚠️ STOP POINT:** Before coding the hard gate cutoff hour, show owner the 16h vs 3h conflict and get a single confirmed time.

**Verify:** tsc 0 · manual ЦКП submit → DB row → FE shows submitted · IoT event → auto-row · salary gate log row created.

**op-codes logged:** `ai.ckp.dailyChatbot` · `ai.ckp.generateQuestions` · `ai.ckp.salaryGate` · `ai.ckp.fromIotMes` · `ai.ckp.validateMeasurable`.

---

### PHASE 3 — Card↔employee fit evaluation + PDF reports + 3-tier routing
**Decided features:** EP-AI-003 (fit inputs), EP-AI-004 (fit display), EP-AI-005 (report routing), EP-AI-006 (PDF), EP-AI-019 (bonus recommendation), EP-AI-029 (succession list), EP-AI-031 (bottom-up aggregation), EP-AI-045 (route to manager), EP-AI-048 (draft for manager), EP-AI-062 (same-card ranking), EP-AI-075 (card + individual), EP-AI-088 (official signed export).

**Owner-confirmed details:**
- Fit score display: percentage (%) + traffic-light color (green/yellow/red) + short text explanation (EP-AI-004 A-default).
- Report recipients (KARTALAR Q31 = A confirmed): employee (own growth) + direct manager (team) + HR (overall), each sees only their appropriate section (RBAC — F1).
- Fit inputs: ЦКП completion + test results + attendance + quality + manager rating + peer comparison. All from live DB; no manual entry.
- Ranking: only within same card type (EP-AI-062, KARTALAR Q1/Q2) — never mix roles.
- Per-card AI: each card has its own fit evaluator that aggregates from below (EP-AI-031, KARTALAR Q30/Q21 tree). The central AI collects the bottom-up result.
- Bonus recommendation (EP-AI-019/020): AI computes recommendation using configurable criteria (HR/Finance/manager-set system, no KPI — KARTALAR Q25 = A); HR + Finance confirm before Payroll. AI proposes, human approves (E1).
- Succession list (EP-AI-029): from skill-matrix → ordered list with reasons + internal growth recommendation. Rahbar confirms (E1).
- **Tone (EP-AI-059, owner override):** constructive — weakness + concrete improvement step; not punishment, not pure praise.
- Report routing (EP-AI-045): follow `manager_id` chain (vertical org-chart per E5, KARTALAR Q21 daraxt); do NOT skip levels; do NOT use "dept head" shortcut.

**DDL (owner approval required):**
- `ai_fit_scores` (id, employee_id, card_id, score_pct, grade_color, explanation, inputs_json, evaluated_at, evaluator_version).
- `ai_report_log` (id, employee_id, card_id, report_type [weekly/monthly/ondemand], recipients_json, pdf_url, signed_at, created_at).
- `ai_bonus_recommendations` (id, employee_id, card_id, period, criteria_json, recommended_amount, approved_by_hr, approved_by_finance, payroll_period_id, created_at).
- `ai_succession_candidates` (id, card_id, candidate_employee_id, score_pct, reason_text, confirmed_by_manager, created_at).

**What to build:**
- `AiFitService.evaluate(card_id, employee_id)` — aggregates MES/QC/HR/LMS/attendance data → Gemini scoring call → saves `ai_fit_scores`. Returns `Result<FitScore>`.
- `AiReportService.generateReport(employee_id, card_id, period)` — assembles data, calls Gemini for narrative, generates PDF (use existing PDF utility or `@react-pdf/renderer`), saves to `ai_report_log`, triggers CC/document archive event.
- CRON: weekly digest (Monday morning) → generate fit reports for all active card-employee links → route via `manager_id` chain → Telegram + in-app notification.
- `AiBonusService.recommend(card_id, period)` → saves recommendation → HR approval flow.
- `AiSuccessionService.buildList(card_id)` → list ranked by fit score (same card only) → manager confirmation.
- FE: HR → AI Fit Scores page (ListPage template) — filter by card/department/grade. Employee profile tab showing own fit score + trend sparkline. Manager view showing team fit summary. Report page with "Generate PDF" button + history list (real mutations — Qoida 19).

**Verify:** tsc 0 · evaluate() → DB row → FE shows score + color · PDF generated → file URL in DB · report routed to correct manager (check manager_id chain) · bonus recommendation → HR approval mutation works.

**op-codes logged:** `ai.fit.evaluate` · `ai.fit.render` · `ai.report.route` · `ai.report.pdf` · `ai.report.threeTier` · `ai.report.routeToManager` · `ai.hr.bonusRecommend` · `ai.bonus.configurable` · `ai.succession.list` · `ai.aggregate.bottomUp` · `ai.rank.sameCardOnly` · `ai.eval.cardPlusIndividual` · `ai.report.officialSigned` · `ai.feedback.constructiveTone`.

---

### PHASE 4 — AI-camera cross-check + violation detect + 3-day block
**Decided features:** EP-AI-027 (violation detect), EP-AI-028 (camera cross-check — owner override YES), EP-AI-030 (3-day block), EP-AI-064 (confidential RBAC scope), EP-AI-082 (burnout early detect), EP-AI-083 (control sheet tracking), EP-AI-086 (dead card detect), EP-AI-094 (statistical fraud detect).

**Owner overrides and confirmed details:**
- Camera cross-check (EP-AI-028, owner override): employee self-report ↔ what camera observed are compared; mismatch → signal to manager + HR. **AI flags only (E1); no automatic penalty.** Camera data comes via IoT module (per VLM — LOYIHA-QOIDALARI A8). If camera module not yet live, implement the comparison endpoint as 501 with honest stub (Qoida 10 / C3).
- 3-day profile block (EP-AI-030, KARTALAR Q34 = A): after 3 consecutive unexcused absences, AI triggers block → Auth module blocks login. Unblock chain: HR dalolatnoma → director approval → super_admin action (KARTALAR Q34 / ShVB Q108/Q111). **Block = Auth event, not AI direct DB write; AI raises event, Auth confirms.**
- Burnout early detect (EP-AI-082): AI detects a slow downward trend (not yet past threshold) and warns HR early. Sources: eNPS, PIP flags, fit score trend. **RBAC: PIP/eNPS data only visible to HR/director (FIX1 from MEMORY — fail-open already patched).**
- Statistical fraud (EP-AI-094): AI flags unnaturally uniform/perfect report patterns as suspicious — this is independent of camera; statistical anomaly detection.
- Violation detect (EP-AI-027): sources = AI camera + AI analysis + manager + HR inputs. Log in `ai_violation_log`. **Never auto-apply penalty (E1, OCHIQ-JAVOBLAR §GLOBAL).**
- Dead card detect (EP-AI-086): CRON scans for cards with no incoming data for configurable N days → list for owner/HR review.

**DDL (owner approval required):**
- `ai_violation_log` (id, employee_id, card_id, source [camera/report/manager/hr], violation_type, evidence_ref, flagged_at, reviewed_by, outcome, outcome_at).
- `ai_block_log` (id, employee_id, card_id, trigger [3day_absence], triggered_at, hr_report_id, director_approved_by, unblocked_at, unblocked_by).
- `ai_camera_crosscheck` (id, employee_id, card_id, date, report_summary, camera_summary, mismatch_score, flagged, reviewed_by, created_at).

**What to build:**
- `AiViolationService.flag(employee_id, source, evidence)` → saves `ai_violation_log` → notifies manager + HR via event. Returns Result<Violation>.
- `AiBlockService.check3DayAbsence()` CRON → if 3 consecutive unexcused days → emit `AI_PROFILE_BLOCK_REQUESTED` event (Auth module listens) → save `ai_block_log`. Unblock: HR creates dalolatnoma → director confirms → super_admin unlocks.
- `AiCameraService.crossCheck(employee_id, date)` → compare self-report vs camera observation → if mismatch score > threshold → flag → notify. If camera data not available → `{cameraAvailable: false}` (graceful degrade, not crash).
- `AiBurnoutService.detectEarlyTrend(employee_id)` — reads fit score trend + eNPS + PIP; if 3-week decline detected → warn HR (RBAC-gated, only HR/director sees PIP data).
- `AiFraudService.detectStatistical(employee_id, card_id)` — checks if ЦКП responses are unnaturally uniform → flags suspicious patterns.
- FE: HR → Violations page (ListPage); HR → Block Log page (with unblock workflow ConfirmDialog); HR → Camera Cross-Check page (shows mismatch signals, reviewed/unreviewed filter).

**⚠️ STOP POINT:** before any Auth.block DB write, confirm the Auth module's `AI_PROFILE_BLOCK_REQUESTED` event handler exists (verify-don't-trust). If not, implement it in Auth first.

**Verify:** tsc 0 · violation created → DB row → manager notification event emitted · 3-day block event raised → Auth receives it (E2E or unit mock) · camera cross-check with no camera returns graceful flag · PIP/eNPS endpoints return 403 for `manager` role (confirm FIX1 still active per MEMORY).

**op-codes logged:** `ai.violation.detect` · `ai.report.cameraCrossCheck` · `ai.profile.block3day` · `ai.burnout.earlyDetect` · `ai.card.deadDetect` · `ai.report.fraudStatistical` · `ai.controlSheet.trackUnread` · `ai.confidential.rbacScope`.

---

### PHASE 5 — Director-AI + Central forecast + AI chat
**Decided features:** EP-AI-012 (director state explain), EP-AI-013 (forecast), EP-AI-014 (state log), EP-AI-016 (cashflow forecast), EP-AI-021 (bottleneck detect), EP-AI-023 (central forecast), EP-AI-024 (chat access), EP-AI-025 (chat scope — owner override: both), EP-AI-026 (language), EP-AI-040 (downtime root cause), EP-AI-044 (3-tier reports), EP-AI-057 (calibrate forecast), EP-AI-073 (pessimistic/optimistic range), EP-AI-080 (director top-3 priorities).

**Owner-confirmed details:**
- AI chat (EP-AI-025, owner override): both ЦКП/training teaching AND ERP data queries; each user sees only their card-RBAC scope (KARTALAR Q23 = A). Language = 3-script: UZ-lotin + UZ-kirill + RU (detected from user profile per EP-AI-026 / ShVB Q21/Q47).
- Director top-3 (EP-AI-080, ShVB Q123 = A): AI surfaces 3-5 most important signals daily, rest in drill-down. Director sees full cross-module view.
- Forecast range (EP-AI-073): pessimistic/expected/optimistic with confidence — never a single number only. Maps to existing `FORECAST_PESSIMISTIC/OPTIMISTIC` constants in `strategic-agent.service.ts` (CLAUDE.md Qoida 12).
- Bottleneck (EP-AI-021/022): full chain (supply → production → warehouse → delivery → document flow); AI identifies the single slowest link per day and suggests action.
- Downtime root cause (EP-AI-040): each downtime logged with time + category (logistics/material/machine/document) + responsible card; weekly summary.
- State log (EP-AI-014): daily company state saved; trend chart 30 days (EP-DIR-004 shared table — check if `company_state_log` exists before creating new table).

**DDL (owner approval required — check EP-DIR-004 first to avoid two-world):**
- `ai_chat_sessions` (id, user_id, card_id, language, started_at, ended_at).
- `ai_chat_messages` (id, session_id, role [user/assistant], content, sources_json, confidence, created_at).
- `ai_forecast_log` (id, forecast_type, period, pessimistic, expected, optimistic, confidence, actual_when_known, accuracy_pct, created_at).
- `ai_bottleneck_log` (id, date, chain_step, delay_minutes, responsible_card_id, suggested_action, reviewed_by, created_at).

**What to build:**
- `AiDirectorService.explainState()` → reads Director module state formula → Gemini call → returns cause analysis + recommendation.
- `AiDirectorService.topPriorities()` → aggregates signals from all modules → returns top-3-5 with severity ranking (EP-AI-089 signal prioritize).
- `AiForecastService.generate(type, period)` → returns range (pessimistic/expected/optimistic) + confidence → saves `ai_forecast_log`.
- CRON: weekly → compare forecast vs actual → update `accuracy_pct` → update self-calibration.
- `AiBottleneckService.detectDaily()` CRON → reads MES/PP/WMS/SD data → finds slowest link → saves `ai_bottleneck_log` → notifies Director/PP.
- `AiChatService.sendMessage(session_id, user_message)` → resolves card RBAC scope → Gemini call with scoped context → returns answer with sources + confidence. Language from user profile (i18n 3-script). ЦКП/training teaching scope: reads card's ЦКП definition + LMS course content.
- FE: AI Chat page (full-screen chat interface) — message thread, confidence badge per response, language selector. Director → AI Summary widget (DashboardPage) showing top-3 signals + state trend 30-day chart. Forecast page (ListPage + chart) showing range bands.

**Verify:** tsc 0 · chat message → DB session + message rows → response returned with confidence · director top-3 returns non-empty with sources · forecast range pessimistic < expected < optimistic · bottleneck log row after CRON run (or manual trigger in dev).

**op-codes logged:** `ai.director.explainState` · `ai.director.topPriorities` · `ai.state.log` · `ai.forecast.central` · `ai.finance.cashflowForecast` · `ai.bottleneck.detect` · `ai.bottleneck.fullChain` · `ai.chat.access` · `ai.chat.scope` · `ai.chat.language` · `ai.downtime.rootCause` · `ai.report.threeTier` · `ai.forecast.range` · `ai.forecast.calibrate` · `ai.signal.prioritize`.

---

### PHASE 6 — Human override, dispute, self-calibration + AI governance
**Decided features:** EP-AI-033 (human approve), EP-AI-052 (human override + feedback loop), EP-AI-053 (audit trail), EP-AI-054 (honest uncertainty), EP-AI-060 (decision log — accept/reject), EP-AI-085 (governed criteria change), EP-AI-090 (employee dispute), EP-AI-091 (confidence level), EP-AI-095 (self-calibration report).

**Owner-confirmed details:**
- Every AI recommendation can be overridden by a human with a mandatory reason (KARTALAR Q10/Q25/Q26 + ShVB Q114/Q115). Override feeds back as calibration signal.
- Employee appeal (EP-AI-090, ShVB Q130/Q90 = A): any employee can dispute an AI score; dispute goes to manager for re-review.
- Criteria governance (EP-AI-085, KARTALAR Q29/Q9): changing AI scoring criteria requires HR/director central approval + written to change-log. Prevents each manager gaming "their" scores.
- Self-calibration (EP-AI-095): periodic report showing AI's own accuracy by feature (ЦКП gate correctness, fit score vs actual performance, forecast accuracy). Published to director.
- Honest uncertainty (EP-AI-054): if AI has insufficient data, it explicitly says so ("low confidence / data insufficient") — never presents a guess as a fact (CLAUDE.md Q-40).

**DDL (owner approval required):**
- `ai_human_overrides` (id, employee_id, card_id, ai_recommendation_type, ai_value, human_value, override_reason, overridden_by, overridden_at, fed_back_at).
- `ai_dispute_log` (id, employee_id, card_id, ai_score_id, dispute_reason, submitted_at, reviewed_by_manager, outcome, outcome_at).
- `ai_criteria_change_log` (id, criteria_type, old_config_json, new_config_json, changed_by, approved_by, approved_at, note).
- `ai_calibration_report` (id, period, feature, accuracy_pct, total_predictions, correct_predictions, notes, generated_at).

**What to build:**
- `AiOverrideService.override(recommendation_id, human_value, reason, user_id)` → saves `ai_human_overrides` → sends feedback to Gemini context calibration queue.
- `AiDisputeService.submit(employee_id, ai_score_id, reason)` → saves `ai_dispute_log` → notifies manager via event → E5 routing.
- `AiGovernanceService.changeCriteria(type, new_config, approver_id)` → requires director/HR role check → saves `ai_criteria_change_log` → audit-log (A6).
- CRON: monthly → generate self-calibration report (`ai_calibration_report`) comparing AI predictions vs actual outcomes → publish to director dashboard.
- `AiConclusion.withConfidence(result, data_completeness)` utility — wraps every AI output with confidence badge and data-sufficiency flag. If completeness < threshold → `{confident: false, reason: "data insufficient"}`.
- FE: AI Governance page (ListPage, HR/director only) — criteria change history + approve/reject UI. Employee profile → Dispute button on each AI score card (ConfirmDialog + reason textarea). HR → Override log page. Director → AI Self-calibration report page (DashboardPage with accuracy charts).

**Verify:** tsc 0 · dispute submitted → DB row → manager notification event · criteria change → approval required (403 without director role) · calibration report generated → DB row → visible in director dashboard · low-confidence response returns `{confident: false}` flag.

**op-codes logged:** `ai.recommend.humanApprove` · `ai.conclusion.override` · `ai.conclusion.auditTrail` · `ai.uncertainty.honest` · `ai.recommend.decisionLog` · `ai.criteria.governedChange` · `ai.eval.dispute` · `ai.conclusion.confidence` · `ai.self.calibrationReport`.

═══════════════════════════════════════════════════════════════
## DoD (Definition of Done) — all 7 conditions required per phase

1. **BE real:** CRUD endpoints + Result<T> + Zod validation + real DB INSERT/UPDATE/SELECT; no `{ok:true}` stubs; no `as unknown`.
2. **FE real:** uses existing template (ListPage/FormPage/DetailPage/DashboardPage) + EP tokens; loading skeleton + error toast; persists (round-trip confirmed); at least one CREATE/UPDATE mutation (Qoida 19).
3. **Docs:** `docs/AI-RE-AUDIT-2026-06-08.md` updated; any new schema decisions recorded in `docs/`.
4. **Tests:** BE unit tests for core services (fit evaluation formula, salary gate logic, block conditions); FE component test for override/dispute flows.
5. **i18n:** all UI strings in UZ + RU translation files; AI response language matches user profile (`ai.chat.language`); 3-script support (UZ-lotin/UZ-kirill/RU).
6. **Edge cases:** card with no employee → graceful (no score, "no data"); Gemini unavailable → graceful degrade not crash; confidential data (PIP/eNPS) → 403 for non-HR roles; negative effects (block/gate) → only after human approval chain (E1 enforced).
7. **Automation:** CRON tasks registered with `@Cron` decorator; events registered with `@OnEvent`; each operation logs its **EP-AI-### op-code** to audit-log (A6) with timestamp + user_id + card_id.

═══════════════════════════════════════════════════════════════
## RAILS (mandatory every phase)

- **Permission gate:** before writing any file, show `file:line` + exact change + reason; wait for owner "yes".
- **Verify before trust:** probe every existing AI service to confirm real vs stub before connecting to it.
- **Separate commit per phase:** `git add <specific-file>` — never `git add -A`.
- **No regressions:** run `tsc` + all reviewer scripts after each phase; any new FAIL = fix before next phase.
- **No rewrite:** if a service exists and is mostly correct, patch it; do not rewrite from scratch.
- **Honest 501:** if a feature's DDL is not yet approved, return `HttpStatus.NOT_IMPLEMENTED` — never a fake response.
- **DDL = owner approval:** every `CREATE TABLE` / `ALTER TABLE` needs `-- APPROVED: <date> by owner` comment in the migration file before executing.
- **Report in Uzbek:** after each phase write a short Uzbek status summary (done items, deferred items, commit hash, any open questions) and wait for "davom".
- **Global AI principle (E1):** every AI-triggered negative effect (block, gate, grade-drop) must have a human approval step in the code — assert this in the phase's test.

═══════════════════════════════════════════════════════════════
## STOP POINTS (mandatory — do not proceed past these without owner confirmation)

1. **After Phase 0 RE-AUDIT** — show gap table; do not write any code before approval.
2. **Before any DDL** — present exact migration SQL + reason; wait for `APPROVED:` confirmation.
3. **Phase 2: salary gate cutoff time** — resolve the 16h (KARTALAR Q18) vs 3h (ShVB Q118) conflict; ask owner for the single confirmed value.
4. **Phase 3: bonus recommendation formula** — confirm configurable criteria schema with owner before creating `ai_bonus_recommendations` table.
5. **Phase 4: Auth block event** — verify `AI_PROFILE_BLOCK_REQUESTED` listener in Auth module before raising the event (verify-don't-trust, Q-29).
6. **After each phase** — show Uzbek report; wait for "davom" before starting the next phase.
7. **Before changing any canonical table** (`sales_orders`, `warehouse_stock`, `entries`, `employees`) — STOP; these are off-limits without explicit owner instruction.
