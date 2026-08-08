# EXECUTOR PROMPT #17 — BUILD T3: CRM (360°, field-visits, AI)
> Foundation + T1 + T2 modules done. Now build the CRM module: the golden-thread entry-point (lead → deal → order) + 360° customer card + field-visit tracking + AI scoring.
> Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES
You are the 🟢 **EXECUTOR**. Read `CLAUDE.md` + `docs/agent-constitution.md` first. All hard rules apply without exception:

**Code quality (CLAUDE.md):**
- Zod validation (no class-validator) · Drizzle ORM (no `sql.raw(variable)`) · Result<T> pattern (no throw/null) · file ≤900/func ≤150 · no magic numbers (business.constants.ts) · controller = transport only · service never touches DB directly (repo layer) · `@UseGuards`/`@Public` on every controller.

**Correctness (LOYIHA-QOIDALARI C-block):**
- **C1 Vizyon = to'g'rilik o'lchovi:** code works (200) ≠ correct. Correct = matches `docs/audit/` vision.
- **C2 Verify-don't-trust:** treat every audit claim as stale until confirmed by live DB + code probe.
- **C3 Fake YO'Q:** every endpoint does real DB INSERT/UPDATE. `{ok:true}`/echo/`[] as unknown` BANNED. Not-ready → honest **501**.
- **C4 Round-trip proof:** enter → save → reload → visible.
- **C5 No regression:** removed things are not recreated; previously working features stay working.
- **C6 No rewrite:** system ~70% built — fix & connect only. Full rewrites BANNED.

**Architecture (LOYIHA-QOIDALARI A/H-block):**
- Canonical order table = **`sales_orders`** (`sd_sales_orders`=VIEW; `orders` dropped — H1).
- Canonical stock = **`warehouse_stock`** (H2). Canonical GL = **`entries`/`gl_entries`** (H3).
- New table = "two-world check" first, then **owner approval** (Q-35, `APPROVED:` comment required).

**Process (LOYIHA-QOIDALARI I-block + CLAUDE.md Q-28/29/35/38/39):**
- Permission gate before every change (file:line + exact change + reason → owner says "yes").
- DDL (CREATE TABLE / ALTER TABLE) = owner approval in every case, no exceptions.
- `git add <specific-file>` only (never `git add -A`). Commit after every phase.
- Report to owner in Uzbek (lotin) after each phase, then wait for "continue".

**Design (LOYIHA-QOIDALARI G-block + CLAUDE.md Q-41/Qoida 21):**
EP Linear Soft tokens (`var(--ep-*)`, `var(--mod-*)`) + existing templates (ListPage/FormPage/DetailPage/DashboardPage) — no new design. CRM module color = use SD/sales orange family (`var(--mod-sd-*)`). Tab depth ≤ 2 levels (Q-42). Delete confirm dialog required (Qoida 14).

═══════════════════════════════════════════════════════════════
## 1. WHY THIS MODULE / GOAL (Q-40 — the measure of "correct")
CRM is **T3 supporting** module — but it is the **golden-thread entry-point**: every customer journey starts here (lead → deal → `sales_orders` → PP plan → MES production → WMS delivery). Without a working CRM, the golden thread breaks at the very first step.

**Vision scope:**
- Full funnel (EP-CRM-001/002): Namuna → Klishe/STP tasdiq → Narx → Shartnoma → Buyurtma.
- 360° customer card (EP-CRM-015): orders + payments + debt + communications + complaints in one view.
- Field-visit tracking (EP-CRM-007 override): manager visits (outbound sales) logged alongside digital channels.
- AI scoring + churn prediction (EP-CRM-011/013/014/019): AI observes → human confirms negative actions.
- Card-centric RBAC (EP-CRM-022/030/062): each salesperson's card defines which customers they see (field-level).
- Corporate communication policy (EP-CRM-031..035): corporate number stays with the company (НО-2).
- Debt separation (EP-CRM-036): collection = Daromadlar department, not sales.
- Папка№ link (EP-CRM-039/040): every deal ties to a production folder.
- KPI/GSD feed (EP-CRM-023): closed deals/volume auto-feeds salesperson's card GSD.

**⭐ Owner overrides from OCHIQ-JAVOBLAR (these OVERRIDE A-defaults):**
- **EP-CRM-002** Funnel stages = **Namuna → Klishe/STP tasdiq → Narx → Shartnoma → Buyurtma** (factory-process order; owner edits later).
- **EP-CRM-007** Channels = **ALL** (Telegram + WhatsApp + SMS + Email) **+ manager VISIT** (field/outbound sales tracked; SD-076 visit-source matches).
- **EP-CRM-063** Abandonment rule = **~60 days** inactive → appears in manager's panel for reassignment (not 30 days).
- **EP-CRM-057** Price recalc trigger = **~5% paper price rise** → affected customers list + "review price" task (linked to MM supply price-feed).

**Cross-cutting principles that apply to this module (LOYIHA-QOIDALARI E-block):**
- **E1 AI observes → human confirms:** AI flags churn risk / hot-lead / scoring — but negative effect (block, demotion, fine) ONLY with human approval. Never automatic.
- **E2 Card-centric:** sales rep's org-card determines CRM access scope (which customers, which fields visible). Card = primary; employee profile = secondary.
- **E3 AI plans orders:** when deal is won, AI suggests production slot/timeline from CRP data (EP-CRM-060); manager confirms.
- **E5 Org-chart routing:** debt escalation, approval chains, deal-above-threshold → follow org hierarchy (Vysotskiy-7 vertical); new department → auto-creates related structures.
- **E6 Single truth:** `sd_customers` = canonical customer master (not a duplicate `customers` table). `sales_orders` = canonical order. Bitrix24 is replaced entirely (owner Q33).

**Source documents (read these, build to them — do NOT invent):**
- `docs/audit/decisions/13-crm.md` — full 85-question decision map (EP-CRM-001..085).
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` → CRM section (owner's 4 overrides + 8 A-defaults confirmed).
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` — project rules (A/B/C/D/E/F/G/H/I/J blocks).
- `docs/audit/LOYIHA-BITGAN-XOLAT-2026-06-08.md` — op-code numbering + DoD reference.
- `docs/audit/ERP-SIFAT-STANDARTLARI-2026-06-08.md` — 7-condition DoD.

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT existing CRM implementation (READ-ONLY) — MANDATORY FIRST STEP

CRM code **already partially exists**. Do NOT rebuild — map what's there vs what the vision needs.

**Audit checklist (read-only, no changes):**
1. **Tables** — run `_audit/q.cjs` (read-only): find `crm_*`, `leads`, `deals`, `sd_customers`, `crm_activities`, `crm_tasks`, any customer or contact table. List: name · row count · key columns · FK links.
2. **Backend** — scan `apps/api/src/modules/crm/`, `compatibility/crm-extended.*`, `agents/lead-scoring-agent.service.ts`, `churn.service*`, `rfm*`, `nba*`. For each file: real DB query or stub? Result<T>? Zod? Guard?
3. **Frontend** — scan `artifacts/erp-dashboard/src/pages/` for CRM/lead/customer pages. What renders? What saves (real mutation vs stub)?
4. **Endpoints** — check `/api/crm/*`, `/api/sd/customers/*` routes. Which are real vs 501?
5. **Known gaps from prior audits** — `crm-extended.service.ts` has `as unknown[]` stubs (CLAUDE.md Qoida 5 FAIL:3); `sd-customers.controller.ts` has `return {}` stubs (CLAUDE.md Qoida 10).

**Output:** write `docs/CRM-RE-AUDIT-2026-06-08.md` with:
- Feature (from vision, EP-CRM-### code) | Exists? | Real or Stub? | Gap | Effort (S/M/L)
- List of tables that need DDL (flag as "needs owner approval").
- List of stubs to convert to real.

→ **STOP. Show owner the re-audit doc. Get approval before any build work.**

═══════════════════════════════════════════════════════════════
## BUILD PHASES
Each phase: permission gate → BE+FE parallel → verify (tsc 0 + DB-proof + FE persist round-trip) → DoD check → separate commit → Uzbek report → wait for "continue".

---

### PHASE 1 — Customer master-data + canonical `sd_customers` (foundation)
**Scope:** EP-CRM-017 (single canonical customer source) + EP-CRM-018 (segments/ABC) + EP-CRM-030 (RBAC — salesperson sees only own customers, manager sees all) + EP-CRM-053/054 (B2B customer profile: what product they pack, volume flag).

**BE tasks:**
- Verify `sd_customers` is the canonical table (not a parallel `customers` table — H4 two-world check). Fix any stubs in `sd-customers.controller.ts` (known: 4× `return {}`).
- Implement real CRUD: createCustomer / updateCustomer / getById / list (with filters: segment/ABC/search/assigned-to). All Result<T> + Zod + Drizzle.
- Add `segment` field (ABC auto-classification hook) + `is_key_account` flag (EP-CRM-054 Indorama-type) + `business_profile` JSONB (what they pack, EP-CRM-053).
- Permission gate: `@Roles('salesperson', 'sales_manager', 'director')`. Salesperson scope = assigned customers only (EP-CRM-022/030/062 RBAC). Manager = all. Field-level: contact phone/email hidden from other sales reps (EP-CRM-067).
- DDL changes → **owner approval required** before executing. Write migration with `APPROVED:` comment.

**FE tasks:**
- `CustomerListPage` (ListPage template): table + filters (segment/ABC/search/assigned). Real `useQuery` with loading skeleton + error state. At least one mutation (assign/update).
- `CustomerDetailPage` (DetailPage template): basic info + segment badge + key-account flag.
- i18n keys UZ+RU.

**Verify:** tsc 0 → create customer → DB probe (row exists) → reload page → visible. RBAC: salesperson 403 on other's customer.

**DoD:** BE real CRUD+Result+Zod+DB · FE template+token, loading/error, persists · docs · tests · i18n UZ+RU · edge-cases (duplicate phone, empty segment) · EP-CRM-017/018 op-codes logged.

---

### PHASE 2 — Lead management + funnel (golden-thread start)
**Scope:** EP-CRM-001 (funnel stages) + EP-CRM-002 override (Namuna→Klishe/STP→Narx→Shartnoma→Buyurtma) + EP-CRM-003 (lead sources) + EP-CRM-004 (auto-lead from Telegram/web) + EP-CRM-005 (round-robin assignment) + EP-CRM-020 (lost-deal reason: format/narx/muddat/raqobat — mandatory list, owner fills exact labels later) + EP-CRM-021 (KP/quotation send + status tracking).

**⭐ Owner override EP-CRM-002:** funnel stages are factory-specific: Namuna → Klishe/STP tasdiq → Narx → Shartnoma → Buyurtma. Store stages as configurable master-data (owner edits names later without code change).

**BE tasks:**
- `crm_leads` table (check if exists, else DDL → owner approval). Fields: source, assigned_to (FK to users/cards), stage (FK to configurable `crm_funnel_stages`), score, status.
- `crm_funnel_stages` master-data table (configurable; seed with 5 owner-specified stages).
- leadCreate / leadUpdate / leadConvert (lead → deal) / leadList (with funnel-stage filter) / assignLead (round-robin or manual). All Result<T> + Zod.
- Lost-deal: mandatory `lost_reason` field (enum from master-data list: format/narx/muddat/raqobat + free text). EP-CRM-020.
- KP quotation: `crm_quotations` (check existence first). Status: draft/sent/viewed/accepted/rejected. EP-CRM-021.
- Guard: salesperson creates/updates own leads; manager reassigns.

**FE tasks:**
- `LeadListPage` (ListPage template) + funnel Kanban-style view (BoardPage template) — same data, two views.
- `LeadDetailPage` (DetailPage template): stage selector, assigned-to, source badge.
- Lost-deal dialog: required reason dropdown + optional note.
- KP send: form with status tracking.
- i18n UZ+RU.

**Verify:** create lead → assign → move stage → lose with reason → DB probe each step. KP: send → status changes to "sent".

**DoD:** all 7 conditions. EP-CRM-001/002/003/005/020/021 op-codes logged.

---

### PHASE 3 — 360° customer card + activity log + field-visit tracking
**Scope:** EP-CRM-006 (activity journal) + EP-CRM-008 (communication history saved) + EP-CRM-007 override (all channels + **field VISIT**) + EP-CRM-009 (tasks + reminders) + EP-CRM-010 (overdue task escalation) + EP-CRM-015 (360° view: orders + payments + debt + complaints) + EP-CRM-031/032/035 (corporate number → card, subscriber scope limit, Telegram/WhatsApp account → CRM).

**⭐ Owner override EP-CRM-007:** channels = Telegram + WhatsApp + SMS + Email + **VISIT** (manager physically visits client — tracked as an activity with geo/time/notes). This is outbound/field sales tracking. SD-076 visit as a lead source matches.

**⭐ Global principle E1:** AI flags anomalies (contact outside approved subscriber list per НО-2 EP-CRM-032) — but block/flag only with human (Inspeksiya bo'limi) confirmation. Never auto-block.

**BE tasks:**
- `crm_activities` table: type ENUM (call/email/telegram/whatsapp/sms/visit/note), channel, direction (in/out), contact_name, duration_sec (calls), body_preview, linked_customer_id, linked_deal_id, performed_by, performed_at. Check if exists; DDL → owner approval.
- activityCreate / activityList (by customer, by type, date range). Result<T> + Zod.
- Visit activity: additional fields geo_lat/geo_lon (optional), visit_purpose, outcome_note.
- `crm_tasks` table (check existence): title, due_date, assigned_to, linked_customer_id, linked_deal_id, status (open/done/overdue), escalated_to.
- Overdue task cron (EP-CRM-010): runs daily; tasks past due → status=overdue → escalate to manager (send notification via NTF module event). EP-CRM-010 op-code.
- 360° customer view: aggregate endpoint `/api/crm/customers/:id/360` → returns {customer, recentOrders (from sales_orders), debtStatus (from Finance read — read-only, not modifiable by CRM), openComplaints (from QC), activityHistory, openTasks}. Read-only aggregation, no cross-module writes.
- Corporate phone assignment (EP-CRM-031): `corporate_phone` field on sales rep card (org_node FK). When rep leaves, field reassigned to new rep.

**FE tasks:**
- `CustomerDetailPage` gains tabs (≤2 levels Q-42): **Asosiy · Faoliyat · Vazifalar · 360° ko'rinish · Yozishmalar**. Each tab real data.
- Activity feed with type icons (call/visit/email/etc.) + "Add activity" button for each type.
- Visit form: purpose + outcome + optional GPS.
- Task list with overdue highlight + "Add task" button.
- 360° tab: orders summary (from sales_orders), debt status (read-only from Finance), open complaints (from QC, read-only).
- i18n UZ+RU.

**Verify:** log a visit activity → DB row → appears in feed. Create task → set past due → cron runs (or simulate) → status=overdue. 360° tab: shows real order count from sales_orders.

**DoD:** all 7 conditions. EP-CRM-006/007/008/009/010/015/031/032/035 op-codes logged.

---

### PHASE 4 — AI scoring + churn prediction + NBA (AI observes, human confirms)
**Scope:** EP-CRM-011 (hot-lead auto-flag) + EP-CRM-012 (lead scoring — criteria from owner, formula configurable) + EP-CRM-013 (NBA — next best action: AI suggests, salesperson approves) + EP-CRM-014 (churn prediction: AI lists at-risk customers, creates return task) + EP-CRM-019 (RFM/CLV analysis) + EP-CRM-026 (follow-up campaigns: 30/60/90-day silence cron) + EP-CRM-055 (customer kg-volume trend: decrease = churn signal).

**⭐ Owner override EP-CRM-012:** lead scoring criteria = configurable (owner/HR sets weights in admin panel). Formula: score = weighted sum of (interest/activity/response_speed/deal_size). Constants go to `business.constants.ts` as defaults until owner sets them.

**⭐ Global principle E1 (critical for this phase):** AI flags churn risk / low score — but NO automatic penalty, block, or reassignment. AI produces a list with signal strength; a human (sales manager) reviews and decides action. The system creates a *suggested task*, not an enforced action.

**BE tasks:**
- `lead-scoring-agent.service.ts` already exists — verify it uses real DB (not stubs), fix if needed. Ensure scoring runs after each activity event (EventEmitter2).
- Scoring result stored back on `crm_leads.score` (integer 0-100). No auto-block on low score.
- Churn prediction: `churn.service.*` already exists — verify real data. Output: customer list with churn probability + "suggested follow-up task" created (not forced). Manager sees list, confirms which tasks to activate. EP-CRM-014.
- NBA endpoint `/api/crm/leads/:id/nba` → returns top-3 suggested next actions (AI-generated text + action type). Salesperson picks one and confirms → creates activity/task. EP-CRM-013.
- RFM/CLV: `rfm*` / `clv*` code exists — verify, wire to real `sales_orders` data (canonical). EP-CRM-019.
- Follow-up cron (EP-CRM-026): daily job — customers with 0 activity for 30/60/90 days → creates suggested follow-up task (not forced send). Constants: `CRM_FOLLOWUP_30_DAYS`, `CRM_FOLLOWUP_60_DAYS`, `CRM_FOLLOWUP_90_DAYS` in business.constants.ts.
- Abandonment cron (EP-CRM-063, owner override ~60 days): customers with no activity for 60 days → appears in manager "reassign" panel. Manager acts, not system.
- kg-trend signal (EP-CRM-055): monthly job reads sales_orders volume by customer → if decline >20% month-over-month → churn-risk flag (AI signal, not auto-action).

**FE tasks:**
- `CustomerListPage`: "Churn risk" filter tab (shows AI-flagged at-risk customers). Churn badge on customer row.
- `LeadListPage`: hot-lead badge (auto-flag from scoring). Score column sortable.
- `LeadDetailPage` → NBA suggestions widget (top-3 cards, "Accept" button per suggestion).
- CRM dashboard widget: churn risk count, hot leads count, follow-up due today.
- i18n UZ+RU.

**Verify:** create activity → lead score updates in DB. Churn list: force a customer to 0 activity (test data) → appears in at-risk list. NBA: endpoint returns structured suggestions. RFM: returns real customer rankings from sales_orders data.

**DoD:** all 7 conditions. EP-CRM-011/012/013/014/019/026/055/063 op-codes logged.

---

### PHASE 5 — Папка№ link + production chain + debt/RBAC/security
**Scope:** EP-CRM-016 (golden thread: won deal → sales_order auto-created) + EP-CRM-023 (salesperson KPI/GSD feed from closed deals) + EP-CRM-024 (debt warning — linked to FIN/SD limit; Daromadlar dept decides, sales sees read-only) + EP-CRM-036 (debt ownership = Daromadlar, not sales) + EP-CRM-039/040/041/042 (Папка№ link, days-elapsed, paper spec, notes) + EP-CRM-046 (electronic GP delivery blank: 3 signatures) + EP-CRM-059/060/061 (deal → production plan, real deadline from CRP) + EP-CRM-066/068 (export block + audit log) + EP-CRM-069 (advance payment flag — no production without avans gate).

**⭐ Golden-thread (E6):** When a deal moves to stage "Buyurtma" (won), system creates a `sales_orders` record (canonical table, not `orders`). This is the core golden-thread link. EP-CRM-016.

**⭐ Owner override EP-CRM-024/036:** debt status is set ONLY by Finance/Daromadlar module (auto from GL). Sales cannot edit it. CRM shows debt read-only. If debt limit exceeded → new deal auto-flagged "debt block" + Daromadlar department notified. Manager needs Daromadlar approval to proceed. Global principle E1: block only after human approval.

**BE tasks:**
- Deal-won event → emit `CrmDealWonEvent` → SD module listener creates `sales_orders` record (use existing event bus). EP-CRM-016.
- KPI/GSD feed: `CrmDealClosedEvent` → update salesperson's card GSD counters (closedDeals, weeklySalesVolume from ShVB YO'NALISH 26). EP-CRM-023.
- Debt check on new deal: read Finance debt status (read-only cross-module query from `entries`/`gl_entries`). If exceeds limit → flag + emit notification to Daromadlar. EP-CRM-024/036.
- Папка№: `deal_folder_number` field on deals; FK or denormalized link to production papka. `days_elapsed` computed column. EP-CRM-039/040.
- Paper spec profile on customer (Наименование/Формат/Грам from kitob Заявка bumagi). Auto-fills on new deal. EP-CRM-041.
- Notes field on deal (kitob Примечание). EP-CRM-042.
- GP delivery blank: `crm_delivery_blanks` (check existence; DDL → owner approval). 3-signature flow: warehouse → driver → sales_manager. None of 3 = "not delivered". EP-CRM-046.
- Advance payment flag: `advance_required` + `advance_paid` on deal. Gate: if advance_required=true and advance_paid=false → production order blocked (EP-CRM-069). Finance confirms payment → flag auto-updates.
- Audit log (EP-CRM-068): every CRM action (view/edit/export) logged to `audit_log` table (existing). Inspeksiya bo'limi can filter by CRM module.
- Export gate (EP-CRM-066): bulk export (>50 records or full customer list) requires manager role; each export logged. Individual record PDF = allowed.
- Real deadline from CRP (EP-CRM-060): `/api/crm/deals/:id/estimate-deadline` → calls PP/CRP service to get earliest available slot. Returns suggested delivery date (read-only suggestion; AI suggests, manager confirms).

**FE tasks:**
- `DealDetailPage` (DetailPage template): stage progress bar (5 funnel stages). "Mark as Won" button → triggers sales_order creation confirmation dialog.
- Папка№ field + days-elapsed badge (green/yellow/red by aging).
- Paper spec section (auto-filled from customer profile, editable per deal).
- Debt status badge on CustomerDetailPage (read-only, from Finance).
- GP delivery blank workflow UI: 3-step signature panel.
- Advance payment flag + gate warning.
- Export button: triggers confirmation + logs action.
- i18n UZ+RU.

**Verify:** move deal to "won" → check `sales_orders` row created in DB. Debt: set debt flag manually → CRM shows warning. Export: confirm audit_log row created. CRP deadline: returns structured data from PP module.

**DoD:** all 7 conditions. EP-CRM-016/023/024/036/039/040/041/042/046/059/060/066/068/069 op-codes logged.

---

### PHASE 6 — CRM dashboard + manager panel + ShVB KPI (YO'NALISH 26)
**Scope:** EP-CRM-027 (manager dashboard: funnel + salesperson leaderboard + AI signals + overdue tasks) + EP-CRM-062 (sales manager role vs salesperson view) + ShVB YO'NALISH 26 GSD: `weeklySalesVolume`/`closedDeals`/`averageDealSize`/`conversionRate`/`salesCycleLength`/`customerRetention`/`debtorControl`/`salesTarget`/`salesVsTarget` + salesperson leaderboard + debtor trend chart + EP-CRM-075/076/077 (monthly kg by customer, yearly volume, order→ready→shipped status chain).

**BE tasks:**
- `/api/crm/dashboard` → aggregated stats: funnel by stage (deal counts), salesperson leaderboard (closedDeals/volume from canonical `sales_orders`), churn risk count, overdue task count, hot-lead count, debtor total (from Finance read-only). ShVB 9 GSD metrics calculated from real DB.
- `/api/crm/reports/monthly-kg` → customer × month kg matrix (from `sales_orders` line items). EP-CRM-075.
- `/api/crm/reports/yearly-volume` → yearly top customers by volume. EP-CRM-076.
- `/api/crm/customers/:id/order-status-chain` → {ordered_kg, produced_kg, shipped_kg} real-time from `sales_orders` + WMS. EP-CRM-077.
- Conversion rate: deals won / deals created (per salesperson, per period). salesCycleLength: avg days from lead created to deal won.

**FE tasks:**
- `CrmDashboardPage` (DashboardPage template): 9 ShVB GSD metric cards + funnel visualization + salesperson leaderboard table + debtor trend chart + AI signals panel (churn count, hot leads) + overdue tasks panel.
- Manager-only sections hidden from salesperson role (RBAC at FE level, BE enforces).
- Monthly kg report: table + sparkline per customer.
- Order status chain: progress bar on CustomerDetailPage 360° tab.
- i18n UZ+RU.

**Verify:** dashboard loads real data from DB (not stubs). Leaderboard shows real closed-deal counts from `sales_orders`. Conversion rate computed correctly (manual check with known test data).

**DoD:** all 7 conditions. EP-CRM-027/062/075/076/077 + ShVB YO'NALISH 26 GSD op-codes logged.

═══════════════════════════════════════════════════════════════
## DoD — 7 conditions (all required, every phase)
1. **BE real:** CRUD + Result<T> + Zod + real DB (Drizzle ORM) — zero stubs, zero `as unknown`.
2. **FE real:** EP Linear Soft template + tokens, loading skeleton, error state, mutations persist (round-trip verified Q-43).
3. **Docs:** inline JSDoc on service methods + op-code comments.
4. **Tests:** BE unit tests for service + repo; FE component smoke test.
5. **i18n:** all UI strings in UZ + RU (no hardcoded Cyrillic/Latin in JSX).
6. **Edge-cases:** duplicate customer phone, empty funnel stage, debt block on new deal, export attempt by salesperson (403), visit with no GPS (allowed), deal won with open complaint (warn, not block per EP-CRM-073).
7. **Automation:** AI scoring event fires on activity create; churn cron registered; follow-up cron registered; deal-won event wires to SD.
   Each operation logs its **EP-CRM-### op-code** (`level=info code=EP-CRM-016 action=deal_won customer_id=...`).

═══════════════════════════════════════════════════════════════
## RAILS (per-phase enforcement)
- **Permission gate (Q-28):** before touching any file, state: `file:line` + exact change + reason. Wait for owner "ha".
- **DDL = owner approval (Q-35):** every `CREATE TABLE` / `ALTER TABLE` needs `-- APPROVED: <owner> <date>` in migration. If approval not yet given → write the migration file, mark PENDING, stop. Do NOT execute.
- **Verify (Q-29/C4):** after each phase → `tsc 0` (both BE and FE) + DB probe (read actual row) + FE round-trip (create → reload → visible).
- **Separate commit per phase:** `git add <specific files>`. Message: `feat(crm): phase N — <description>`. Never `git add -A`.
- **No regression (Q-39/C5):** after each phase run `scripts/run-all-reviewers.sh`. Zero new FAILs allowed.
- **No rewrite (C6):** existing `lead-scoring-agent.service.ts` / `churn.service` / `rfm*` / `crm-extended.*` → fix and connect, do NOT rewrite from scratch.
- **Honest 501 over fake (C3):** if a feature cannot be completed this phase (e.g. waiting for owner DDL approval), return `HttpStatus.NOT_IMPLEMENTED` — never return `{ok:true}` or empty array as a placeholder.
- **Report in Uzbek (I4/Q-38):** after each phase, write a short report to owner: nima qilindi / nima qoldi / commit hash / qayerda to'xtadi / keyingi bosqich uchun ruxsat so'rash.

═══════════════════════════════════════════════════════════════
## STOP POINTS (mandatory — wait for owner before proceeding)
1. **After Phase 0 RE-AUDIT** — show `docs/CRM-RE-AUDIT-2026-06-08.md` and get approval before any build.
2. **Before any DDL** (CREATE TABLE / ALTER TABLE) — present exact SQL, wait for owner "ha, tasdiqlandi".
3. **Before touching `sd_customers` or `sales_orders`** — these are canonical master tables (H1); any schema change needs explicit owner approval + two-world check.
4. **Phase 4 AI scoring weights** — present configurable scoring formula to owner before implementing; owner sets weights in admin panel (not hardcoded).
5. **Phase 5 deal-won → sales_order creation** — confirm exact field mapping (customer, product, qty, deadline) with owner before wiring the event listener.
6. **After each phase** — show Uzbek report + commit hash. Wait for "davom" before next phase.
