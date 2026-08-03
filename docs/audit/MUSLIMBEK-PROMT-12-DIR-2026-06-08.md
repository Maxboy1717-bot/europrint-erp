# EXECUTOR PROMPT #12 — BUILD T2: DIR / DIRECTOR / STRATEGIYA (state-formula, 5-level)
> T2 tier: nazorat qatlami — ShVB state-formula, 5 daraja, holat tarixi, ideal kartina, OKR, taktik reja, stat-reglament, director dashboard.
> Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES
You are the 🟢 **EXECUTOR**. Read `CLAUDE.md` + `docs/agent-constitution.md` first. All hard rules apply:

**Code quality:** Zod · Drizzle ORM · Result<T> pattern · parametrized SQL only (`sql.raw(variable)` FORBIDDEN) · file ≤ 900 lines / func ≤ 150 lines · no magic numbers → `business.constants.ts` · controller = transport layer only (business logic in service, service via repo, no direct `db.*` in service) · `@UseGuards`/`@Public` on every controller · `ConfigService` not `process.env` · no non-null assertion (`!`).

**Correctness:** **no fake (C3/Q-40/Q-43)** — every form/endpoint does a REAL DB INSERT/UPDATE; `{ok:true}`/echo/`[] as unknown` FORBIDDEN; honest `501` if table not ready. **verify-don't-trust (C2/Q-29)** — treat every claim as stale until confirmed by code + DB (`_audit/q.cjs` read-only). **permission gate (Q-28/I3)** — before any change: file:line + exact change + reason → owner "yes". **DDL = owner approval (Q-35, `APPROVED:` comment required)**. **no regressions (C5/Q-39)** — previously working features must still work after your change. **NO REWRITE (C6)** — system is ~70% built; fix & connect only.

**Project rules reference:** `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` (sections A–J). Canonical tables: `sales_orders` (not orders), `warehouse_stock` (not stocks), `entries`/`gl_entries` (not `gl_journal_entries`). No two-world pattern. New table requires `APPROVED:` comment + owner sign-off.

**Design (mandatory, Q-41/Qoida 21):** EP Linear Soft tokens (`var(--ep-*)`, `var(--mod-*)`) + existing templates (ListPage / FormPage / DetailPage / DashboardPage / BoardPage) — no new design. DIR module = neutral/dark executive palette (no single-module color forced; use token defaults). Tab depth max 2 levels (Q-42).

**Process:** `git add <specific-file>` only (no `git add -A`) · commit every step · report after each phase in Uzbek (Q-38) · wait for owner "davom" before next phase.

---

## 1. WHY / GOAL (Q-40 — the measure of "correct")
DIR is the **T2 control layer** — the Director's command center. Its job is to aggregate KPIs from all other modules into a single state-formula, show the gap between reality and the ideal picture, track strategic OKR → tactical → weekly plans, and maintain the stat-regulation master-data. Vision = the ShVB "Формула Состояний" model: every shift in company health is visible to the director in one screen before 07:10 each morning.

**Owner-confirmed decisions (from OCHIQ-JAVOBLAR-2026-06-08.md, Director section, lines 187–204):**
- **EP-DIR-001** State formula = **5 weighted metrics** (cash-flow + production plan% + orders + employees + quality), each with a **configurable weight** (owner-tunable master-data). ⭐ Owner override.
- **EP-DIR-029** State levels = **5 levels** (OSISH / NORMAL / EHTIYOT / XAVF / INQIROZ, colored). ⭐ Owner override.
- **EP-DIR-037** Deviation counter = **mandatory reason category** (material/transport/operator/mold/other) → root-cause chain. Owner override.
- **EP-DIR-033** Card products per position = **flexible 2-4** (per position type), each with a stat metric.
- **EP-DIR-039** A-System migration = **DEFERRED to IoT phase** (same as ORG-133). Do not build now.
- All 71 remaining questions accepted as A-default (per OCHIQ-JAVOBLAR automatic acceptance list).

**Source documents (read these; build to them — do NOT invent):**
- `docs/audit/decisions/05-director.md` — full 85-question decision map (EP-DIR-001..085); 9 answered, 76 A-default.
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` → Director section — 4 owner overrides + 71 auto-accepted.
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` — project rules (sections A–J, E1–E6 cross-cutting).
- `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` — Vysotskiy-7 org-tree model (state aggregation from cards).

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT existing DIR implementation (READ-ONLY)
The director module may be partially built (dashboard stubs, some KPI endpoints, possible `director_*` tables). **Do not rebuild.** Map what EXISTS vs what the vision needs:

- **DB:** Search for tables matching `director_*`, `company_state*`, `state_threshold*`, `ideal_target*`, `strategic_goal*`, `monthly_plan*`, `stat_regulation*`, `diary_entry*` — list columns + row counts via `_audit/q.cjs`.
- **BE:** Existing director services/controllers/repos — list endpoints (`/api/director/*` etc.), mark each as real vs stub.
- **FE:** Existing director pages/components — what renders, what saves (round-trip or local-only).
- **Gap table** → write to `docs/DIR-RE-AUDIT-2026-06-08.md`:

| Feature (vision) | EP-DIR-### | Exists? | Gap | Effort |
|---|---|---|---|---|
| Company state calc (5 metrics) | 001/003 | ? | ? | ? |
| ... | | | | |

**STOP after Phase 0 — show re-audit to owner. Wait for "davom" before any build.**

═══════════════════════════════════════════════════════════════
## BUILD PHASES
Each phase: **permission gate → BE + FE parallel → verify (tsc 0 + DB-proof + FE persist round-trip) → DoD check → separate commit → Uzbek report → wait for "davom".**

---

### PHASE 1 — State master-data: levels, thresholds, weights

**Scope (EP-DIR-029, EP-DIR-002, EP-DIR-001 config side):**
- `company_state_levels` table: `id`, `code` (OSISH/NORMAL/EHTIYOT/XAVF/INQIROZ), `label_uz`, `label_ru`, `color_hex`, `rank` (order). CRUD API + FE admin screen. Seed 5 rows on migration.
- `state_thresholds` table (per metric, per level): `metric_key` (cash_flow / production_plan / orders / hr / quality), `level_code`, `min_value`, `max_value`, `weight` (configurable decimal 0–1; weights must sum to 1.0 per formula). CRUD.
- FE: `DirectorSettingsPage` — tabs: State Levels (color-coded table + edit dialog) + Metric Weights (5-metric weight sliders, real-time sum validation).
- All 5 levels stored in DB; director can recolor/relabel from UI; weights saved to DB (not hardcoded).

**Cross-cutting (E1):** AI observes → human confirms. Threshold changes are owner-only (permission-gated: `super_admin`/`director` role).

**DDL approval required before migration.** Add `APPROVED: owner 2026-06-08` comment to migration file.

**DoD:** BE CRUD real (Result+Zod+Drizzle) · FE form saves + re-opens with correct values · tsc 0 · i18n UZ/RU · op-codes `EP-DIR-029`/`EP-DIR-002` logged.

---

### PHASE 2 — Company state calculation, history, and alerts

**Scope (EP-DIR-001, EP-DIR-003, EP-DIR-004, EP-DIR-005, EP-DIR-006):**

**BE — `company-state.service.ts`:**
- `calculateState()`: reads live KPIs from 5 modules (FIN cash-flow endpoint / PP plan% / SD order count / HR employee count / QC defect%) → applies weights from `state_thresholds` → scores → maps to state level → returns `{ state: 'NORMAL', scores: {...}, detectedAt }`.
- `company_state_log` table: `id`, `state_code`, `kpis` JSONB, `score_total`, `detected_at`, `resolved_at`. INSERT on every recalculation.
- `@Cron('0 7 * * *')` job (07:00 daily): call `calculateState()` → insert log → if state changed → `sendAlert()` (op=`dir.companyState.cron` / EP-DIR-003).
- `sendAlert(state)`: notify director + responsible card owner (org-chart lookup via `manager_id` chain) via NTF module's existing notification service. Telegram via CC Telegram bot if connected (EP-DIR-005).
- `getHistory(days: number)`: returns last N days of `company_state_log` rows (for 30-day mini-chart).

**FE — `CompanyStateWidget`:**
- Shows current state level (color badge from `company_state_levels`), score breakdown (5 metric bars), 30-day mini spark-chart from history.
- Real-time refresh: re-query every 5 min or on manual refresh button.

**Owner override citations:** EP-DIR-001 (5 metrics + configurable weights) · EP-DIR-029 (5 levels OSISH/NORMAL/EHTIYOT/XAVF/INQIROZ) · EP-DIR-003 (07:00 cron, confirmed).

**Cross-cutting (E6):** One canonical KPI source per module — read from canonical tables only (`warehouse_stock`, `sales_orders`, `entries`). Do NOT create shadow copies.

**DoD:** Cron runs + inserts log (DB-proof) · state changes produce alert (verify with test trigger) · history endpoint returns 30 rows for 30 days · FE widget shows correct state + spark-chart · tsc 0 · op-codes EP-DIR-003/004/005 logged.

---

### PHASE 3 — Ideal picture (Ideal Kartina) + gap analysis

**Scope (EP-DIR-011, EP-DIR-012, EP-DIR-013, EP-DIR-014):**

**BE:**
- `ideal_targets` table: `id`, `metric` (profit/revenue/branches/employees/…), `ideal_value`, `current_value`, `unit`, `year` (versioned by year), `updated_at`. Seed 4 rows: 100M profit / 800M revenue / 15 branches / 500 employees (ShVB seed values).
- `getGapAnalysis()`: for each target row, compute `gap = ideal_value - current_value`, `progress_pct = current_value / ideal_value * 100`, `time_to_ideal` (estimated based on current trend from history).
- `updateCurrent()` cron (daily): pulls real values from FIN (profit/revenue), HR (employee count), SD (branch count) — updates `current_value` column. (op=`dir.ideal.refresh` / EP-DIR-013).
- CRUD for `ideal_targets` (owner-only): create/update ideal values per year.

**FE — `IdealPicturePanel`:**
- For each target: metric name + unit + ideal vs current (progress bar) + gap + time estimate.
- Year selector (EP-DIR-014 versioned by year).
- Edit button (owner/director only) → inline edit dialog → real POST/PUT.

**Owner override citations:** EP-DIR-011 (confirmed, seed values from ShVB) · EP-DIR-012 (gap analysis confirmed) · EP-DIR-013 (auto-fill from modules confirmed).

**DoD:** Gap analysis endpoint returns real computed values · edit saves to DB · year versioning works · FE round-trip confirmed · tsc 0 · op-codes EP-DIR-011/012 logged.

---

### PHASE 4 — Stat-regulation (Statistika Reglamenti) master-data

**Scope (EP-DIR-020, EP-DIR-021, EP-DIR-022, EP-DIR-023):**

**BE:**
- `stat_regulations` table: `id`, `name_uz`, `name_ru`, `definition`, `formula`, `unit`, `frequency` (daily/weekly/monthly), `source_module`, `owner_card_id` (FK to org_functions/cards), `target_value`, `version` (integer), `valid_from`, `is_active`. CRUD + versioning (insert new row on update, mark old as inactive — history preserved for consistent historical reporting).
- Endpoints: list, create, update (creates new version), get-history-by-name.
- Alert: when `current_value < target_value` → notify `owner_card_id` owner (EP-DIR-071 stat owner → EP-DIR-006 alert routing).

**FE — `StatRegulationPage` (ListPage template):**
- Table: name / unit / frequency / owner-card / target / version / active badge.
- Create / Edit dialog (FormPage template): all fields + frequency dropdown + owner-card selector.
- Version history drawer: show all past versions with dates.

**Owner override citations:** EP-DIR-020 (full stat-regulation confirmed) · EP-DIR-021 (per-metric frequency) · EP-DIR-022 (versioning) · EP-DIR-023 (owner = card, not person).

**Cross-cutting (E2 card-centric):** `owner_card_id` links to the position card (ORG module), not a user. Alert routes via org-chart (E5).

**DoD:** CRUD saves real DB rows · versioning creates new row (old preserved) · FE version history shows correct data · owner-card alert fires on threshold miss · tsc 0 · op-codes EP-DIR-020/022/023 logged.

---

### PHASE 5 — Strategic OKR + Tactical plan (monthly → weekly)

**Scope (EP-DIR-015, EP-DIR-016, EP-DIR-017, EP-DIR-018, EP-DIR-019, EP-DIR-030):**

**BE:**
- `strategic_goals` table: `id`, `objective_uz`, `objective_ru`, `level` (company/department/card), `owner_card_id`, `year`, `key_results` JSONB (array of `{description, target, current, unit}`), `milestones` JSONB (array of `{title, due_date, completed_at}`), `status` (active/completed/archived).
- OKR cascade: `parent_goal_id` FK (self-referential) for company → department → card cascade (EP-DIR-016).
- `monthly_plans` table: `id`, `strategic_goal_id` FK, `month` (YYYY-MM), `objectives` JSONB, `weekly_tasks` JSONB (array of 4 weeks, each `{week_num, tasks: [{title, owner_card_id, due_date, status}]}`), `completion_pct` (computed).
- `completeMilestone(milestoneId)`: sets `completed_at`, logs op EP-DIR-030.
- `assignTask(taskId, cardId)`: links weekly task to card (EP-DIR-019).

**FE — `StrategicTasksPanel`:**
- OKR tree: company level → department level → card level (collapsible, 2-level tab max Q-42).
- Monthly plan accordion: 12 months → weekly tasks per month.
- Milestone timeline: completed milestones shown with checkmark + date.
- Create/edit dialogs for goals, key results, monthly plans.

**Owner override citations:** EP-DIR-015 (OKR confirmed) · EP-DIR-017 (strategic→monthly confirmed) · EP-DIR-018 (monthly→weekly confirmed) · EP-DIR-019 (task→card assignment) · EP-DIR-016 (cascade: company→department→card = oltin ip).

**Cross-cutting (E2 card-centric):** every tactical task assigned to a card (position), not a person. (E5 org-chart routing): OKR cascade follows Vysotskiy-7 hierarchy.

**DoD:** OKR CRUD saves real DB · cascade shows parent→child correctly · weekly task assignment to card saves · milestone complete marks DB `completed_at` · FE round-trip confirmed · tsc 0 · op-codes EP-DIR-015/016/017/018 logged.

---

### PHASE 6 — Execution diary (Kundalik / Дневник Выполнения)

**Scope (EP-DIR-007, EP-DIR-008, EP-DIR-009, EP-DIR-010):**

**BE:**
- `diary_entries` table: `id`, `author_card_id`, `date` (unique per author per day), `daily_state` (auto-filled from company_state_log), `main_kpi_value` (auto-filled), `main_issue` (text, manual), `solution` (text, manual), `tomorrow_plan` (text, manual), `carry_over_issues` JSONB (unresolved issues from previous day), `status` (draft/submitted).
- Auto-fill: on diary open for today, if `daily_state` empty → fetch latest state from `company_state_log`, populate. If `main_kpi_value` empty → fetch plan% from PP module.
- Carry-over: on next day's diary open, any unresolved issues from yesterday → insert into `carry_over_issues` (EP-DIR-010).
- Multi-author: department heads each write their own diary; director sees all (RBAC: author sees own, director sees all).

**FE — `DiaryPage`:**
- Date picker (default today). Auto-filled state + KPI badge (read-only). Manual fields: main issue / solution / tomorrow plan (text areas).
- "Carry-over issues" section (read-only list from yesterday's unresolved).
- Save (draft) + Submit buttons. Submitted entries show in director's overview.
- Director view: filter by author-card + date range; table of all entries.

**Owner override citations:** EP-DIR-007 (5-section diary confirmed, ShVB source) · EP-DIR-008 (multi-author: department heads + director) · EP-DIR-009 (state+KPI auto-fill confirmed) · EP-DIR-010 (carry-over unresolved issues confirmed).

**Cross-cutting (E1):** auto-fill = AI observes; human adds issue/solution/plan (inson qo'lda yozadi, tizim faqat faktni oldindan to'ldiradi).

**DoD:** Diary save persists to DB · auto-fill reads real state + KPI · carry-over inserts yesterday's open issues · director sees all authors' entries · tsc 0 · op-codes EP-DIR-007/009/010 logged.

---

### PHASE 7 — Director dashboard (command center) + daily digest cron

**Scope (EP-DIR-025, EP-DIR-028, EP-DIR-036, EP-DIR-053, EP-DIR-062, EP-DIR-069, EP-DIR-073):**

**BE — `/api/director/dashboard` endpoint:**
- Single response object (snapshot + real-time):
  - `companyState`: current state level + scores (from Phase 2).
  - `idealGap`: top 3 metrics furthest from ideal (from Phase 3).
  - `openIssues`: today's unresolved carry-over issues across all diary authors.
  - `planFulfillment`: production plan% (PP module) — "Reja bajarilish %" (EP-DIR-036).
  - `planFact`: per-department plan/fact/remaining table (EP-DIR-053).
  - `orderProgress`: top 5 orders with readiness% + current department (EP-DIR-062).
  - `statTrends`: for each stat-regulation metric, last 7 data points (trend) + trend direction (rising/falling/stable, EP-DIR-069).
  - `alerts`: unread director alerts (state changes + threshold misses).
- Mode query param: `?mode=realtime` (live) vs `?mode=snapshot` (07:00 frozen snapshot from log, EP-DIR-073).
- Daily digest cron `@Cron('0 7 * * *')`: after state calculation (Phase 2), generate digest summary (state + top 3 gaps + open issues count) → send via NTF module to director (EP-DIR-028).

**FE — `DirectorDashboardPage` (DashboardPage template):**
- Layout (top-to-bottom, DashboardPage template + EP Linear Soft tokens):
  - Row 1: `CompanyStateWidget` (Phase 2) + 5 metric score cards (colored by level).
  - Row 2: `IdealPicturePanel` (Phase 3 gap bars, top 3).
  - Row 3: Plan fulfillment% + Plan/Fact table (per department).
  - Row 4: `StrategicTasksPanel` (Phase 5, compact view).
  - Row 5: Order progress list + Stat trends (sparklines).
  - Row 6: Active alerts (dismissable, each with EP-DIR op-code).
- Mode toggle: "Real-time" / "07:00 Snapshot" (query param toggle).
- Refresh button (manual).

**Owner override citations:** EP-DIR-025 (full command center confirmed, Q123 "hammasini va to'liq ko'rinsin") · EP-DIR-028 (daily morning digest confirmed) · EP-DIR-073 (real-time + snapshot dual mode confirmed).

**Cross-cutting (E5 org-chart routing):** alerts route to director via `manager_id` chain (Vysotskiy-7 vertical). (E6 one truth): dashboard reads from canonical tables only — no shadow copies.

**DoD:** Dashboard endpoint returns all 7 sections with real data · digest cron inserts NTF record + sends to director · mode toggle returns correct data source · FE renders all sections with real data (no stubs) · tsc 0 · i18n UZ/RU on all labels · op-codes EP-DIR-025/028/036/053 logged.

═══════════════════════════════════════════════════════════════
## DoD per phase (ERP-SIFAT-STANDARTLARI — all 7 conditions)
1. **BE real:** CRUD + Result<T> + Zod + real DB (no `as unknown`, no `{ok:true}` echo).
2. **FE real:** ListPage/FormPage/DashboardPage template + token colors + loading/error states + saves to DB + round-trip confirmed.
3. **Docs:** phase summary in `docs/DIR-BUILD-LOG.md`.
4. **Tests:** BE unit test per service method + FE component render test.
5. **i18n:** UZ + RU keys for every label (no hardcoded strings).
6. **Edge cases:** empty state (no data yet) · concurrent writes · invalid weights (sum ≠ 1) · state not changed (no duplicate alert).
7. **Automation:** crons fire at correct times · events propagate to NTF module · AI observes → human confirms negative effects (E1).

Each operation logs its **EP-DIR-### op-code** in structured log: `level=info code=EP-DIR-003 op=dir.companyState.cron`.

═══════════════════════════════════════════════════════════════
## RAILS (repeat for every phase)
- **Permission gate (Q-28/I3):** before touching any file → file:line + exact change + reason → owner "yes". No silent changes.
- **BE + FE parallel (D1):** each phase delivers both layers; neither left half-done.
- **Verify (C2/Q-29/Q-40):** tsc 0 + DB-proof (run `_audit/q.cjs` to check row counts) + FE persist round-trip (enter → save → reload → still there).
- **Separate commit per phase (I6):** `git add <specific-file>` · commit message includes phase number + EP-DIR-### range.
- **No regressions (C5/Q-39):** run existing reviewers (`bash scripts/run-all-reviewers.sh`) after each phase; no new FAILs allowed.
- **No rewrite (C6):** map existing code first (Phase 0); fix & connect only.
- **Honest 501 (C3):** if a Phase 7 widget depends on Phase 2 data not yet built → return `{ status: 501, message: 'Coming in Phase 2' }` rather than fake data.
- **DDL = owner approval (Q-35):** every new `CREATE TABLE` migration needs `APPROVED: owner 2026-06-08` comment before running.
- **Report in Uzbek (Q-38/I4):** after each phase, write a short Uzbek-language summary: nima qurildi, qaysi EP-DIR-### kodlar, tsc/DB natijasi, keyingi bosqich nomi.
- **Windows nest-watch (Q-44/I7):** if backend drops to 000 after rebuild — muhit xatosi (not code error); restart `pnpm --filter @europrint/api run dev:unsafe`; use static fallback (typecheck + DB-proof) to confirm fix.

═══════════════════════════════════════════════════════════════
## STOP POINTS (ask owner before proceeding)
1. **After Phase 0 RE-AUDIT** — show gap table → get "davom" before any build.
2. **Before any new DDL** (every migration) — confirm `APPROVED:` comment with owner.
3. **Before Phase 2** — confirm KPI source endpoints from FIN/PP/SD/HR/QC modules are accessible and return the expected fields (verify-don't-trust: probe live endpoints, don't assume).
4. **Before Phase 5** — confirm OKR cascade depth (company → department → card = 3 levels max) and whether existing `org_functions` table can serve as card reference for `owner_card_id`.
7. **After each phase** — show Uzbek report → wait for "davom".

═══════════════════════════════════════════════════════════════
## 6 CROSS-CUTTING PRINCIPLES — application to DIR module

**(E1) AI observes → human confirms negative effects:**
- State deterioration detected by algorithm → shown as alert → director sees and acts. Alert does NOT auto-trigger sanctions (no salary deduction, no auto-block). Director decides.
- Trend condition (EP-DIR-070: keskin tushish=Danger) auto-detected → AI suggests cause → human confirms action.

**(E2) Card-centric (card → profile):**
- Stat-regulation `owner_card_id` links to position card (ORG module) — not a person. When the person leaves, ownership stays with the card.
- Tactical tasks (Phase 5) assigned to cards (`owner_card_id`), not users — consistent with ORG module.
- State formula aggregates card-level KPIs upward (EP-DIR-024: holat kartalardan yig'iladi).

**(E3) AI plans orders:**
- Not directly applicable to DIR core, but: director's "order priority" (EP-DIR-054) feeds into PP AI planner. DIR sets strategic context; PP AI uses it for scheduling.

**(E4) Operator IoT-tablet = floor hub:**
- Not directly in DIR scope, but DIR dashboard reads downtime data (EP-DIR-038) that originates from operator IoT tablet (MES/COR). DIR is a read consumer of IoT data, not a writer.

**(E5) Org-chart routing:**
- Alerts (EP-DIR-005/006) route via `manager_id` chain (Vysotskiy-7 vertical): responsible card owner notified first, then escalates up.
- All approvals in DIR (stat-regulation ownership changes, OKR owner changes) follow org-chart hierarchy — ultimately reaches director (CC-028 principle: "hammasi oxiri DIREKTORGA").

**(E6) One canonical truth:**
- DIR never creates its own copy of sales/stock/GL data. It reads from `sales_orders`, `warehouse_stock`, `entries` (canonical tables, LOYIHA-QOIDALARI H1–H3).
- A-System replacement (EP-DIR-039) is DEFERRED to IoT phase — do not implement in this prompt.
- No "two-world" pattern: if a metric exists in a canonical module table, read it; do not shadow-copy it into a `director_*` table.
