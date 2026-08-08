# EXECUTOR PROMPT #19 — BUILD T3: KAN / KANBAN + VAZIFALAR (org-scoped, assigner-confirm)
> Poydevor toza (prompt #01 done). Kanban = T3 qo'llab-quvvatlovchi, ko'pi mavjud — FIX & CONNECT.
> Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES
You are the 🟢 **EXECUTOR**. Read `CLAUDE.md` + `docs/agent-constitution.md` first. All hard rules apply:

**Code rules (CLAUDE.md):** Zod · Drizzle ORM · Result<T> · parametrized SQL (sql.raw(variable) BANNED) · file ≤900/func ≤150 · no fake (Q-40/43) · verify-don't-trust (Q-29) · permission gate (Q-28) · DDL = owner approval (Q-35, `APPROVED:` comment in migration) · no regressions (Q-39) · `git add <file>` only · commit every step · report after each phase in Uzbek (Q-38) · NO REWRITE — fix & connect (~70% exists, re-audit first).

**Project rules (LOYIHA-QOIDALARI-2026-06-08.md — full block):**
- A: Stack = NestJS+React/Vite+Drizzle+PostgreSQL · SSO/JWT (no per-module login) · responsive web · UZ+RU i18n · offline · 7-year audit-log.
- B: TypeScript strict · Zod · Result<T> · constants from business.constants.ts · controller = transport only · repo layer required.
- C: Vizyon = correctness measure (docs/audit/) · fake = 0 · form round-trip · no regression · no rewrite · unclear = ask owner.
- D: BE+FE parallel · re-audit first · phased + owner "continue" · DoD = 7 conditions.
- E (6 cross-cutting rails — apply where this module touches them):
  - **E1. AI observes → human confirms:** AI flags (camera/downtime/defect/rollover threshold), but NEGATIVE effect (penalty/score-drop/block/grade-drop) ONLY with human confirmation — never automatic.
  - **E2. Card-centric:** tasks link to the lavozim-KARTA (position card), not directly to the employee; if the employee leaves, the task stays on the card. Card = primary, employee = secondary.
  - **E3. AI plans:** task assignment suggestion by category/card-type (AI suggests → manager confirms), recurring task scheduling, pattern detection from archive (EP-KAN-061, EP-KAN-131).
  - **E4. Operator IoT-tablet:** floor tasks (brak/TB-checklist/defect → rework task) originate on the operator tablet (KAN+IoT touchpoint EP-KAN-113, EP-KAN-135).
  - **E5. Org-chart routing:** escalation follows manager_id vertical chain (Vysotskiy-7); horizontal transfer goes to target dept head's inbox. Stops at CEO.
  - **E6. One canonical truth:** basket data = CC (`cc_documents.basket_state`/`basket_owner_user_id`) — do NOT create a second basket table. Confirm with owner which wins if `kanban_tasks.basket_type` also exists (two-worlds risk, see Phase 0).
- F: RBAC from card (lavozim), field-level; 5 global guards. BE role-scope first, FE filter second.
- G: EP Linear Soft design — `var(--ep-*)` / `var(--mod-*)` tokens only · existing templates (ListPage / FormPage / DetailPage / DashboardPage / BoardPage) + props — no new design. KAN module color = coordination/neutral family (not HR purple, not MES orange). Tab nesting ≤ 2 levels (Q-42).
- H: canonical tables — orders=`sales_orders` · stock=`warehouse_stock` · GL=`entries`. New table = owner approval (Q-35).
- I: Executor = one at a time · git add <file> · commit each phase.
- J: Each operation logs its **EP-KAN-###** op-code (`level=info code=EP-KAN-027 ...`); register in `docs/op-codes/REGISTRY.md` + `apps/api/src/common/op-codes.ts`.

**⭐ OWNER OVERRIDES (OCHIQ-JAVOBLAR-2026-06-08.md — KAN section — these OVERRIDE A-defaults):**
- **EP-KAN-027/032 [CRITICAL]:** Completion approval = the **ASSIGNER (topshiruvchi)** confirms, NOT necessarily the direct manager. This closes the rasporyajenie-loop (распоряжение→task→assigner-confirm). A-default said "manager closes" — OVERRIDDEN.
- **EP-KAN-015:** Board = exactly **4 columns** (Reja / Jarayonda / Tekshiruvda / Bajarildi). Dept can add columns. The 3-basket (Kiruvchi/Kutilmoqda/Chiquvchi) is the PERSONAL DESKTOP — separate from the board columns.
- **EP-KAN-014:** Task → card/GSD link = YES (task optionally links to lavozim-karta and GSD; completion auto-contributes).
- **EP-KAN-009:** Rollover limit = 3 times → mandatory escalation to manager (A-default confirmed).
- **E6 basket canonical:** 3-basket data = CC `basket_state` (LIVE infra: `cc_documents`, `cc-baskets.repo.ts`, `cc-sla.cron.ts` 24h/48h). Kanban unified desktop reads FROM CC — do not duplicate basket storage. If `kanban_tasks.basket_type` already exists, resolve conflict in Phase 0 (ask owner before merge/drop).

═══════════════════════════════════════════════════════════════
## 1. WHY THIS MODULE / GOAL (Q-40 — measure of "correct")
KAN = T3 supporting module. Its role: **personal + team task management + production order board** — the execution layer that closes every loop: rasporyajenie→task→assigner-confirm, policy→task, defect→rework task, order→board card. Without KAN, COR decisions float unexecuted, ORG cards have no daily work, and production tracking stays in Excel.

**Tier T3** means: most scaffolding already exists (kanban_tasks schema, kanban_observers, card-files, possibly PersonalProgram, recruiting kanban). Do NOT rebuild. Re-audit first, then fix & connect.

**Correctness measure (Q-40):** A task that "saves" but doesn't actually close a loop is WRONG even if the API returns 200. Correct = the assigner (not just any manager) receives the completion for review, the rollover counter increments, the CC basket is the single source, and the lavozim-karta gets the GSD contribution.

**Source documents (read before building — do NOT invent features):**
- `docs/audit/decisions/15-kanban.md` — full 137-question decision map (EP-KAN-001…137); answered=9, A-default=128.
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` → **KAN section** — owner's 4 overrides + 107-total confirmed.
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` — project rules block (used in §0 above).
- `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` — production board (Производство 2026.xlsx structure: Наименование/Тираж/Дата готовности/Статус/operator-station mapping/product types 5х/2х/gofra/karton).
- ShVB Y19 (3-basket personal desktop) + ShVB Y20 (PersonalProgram daily soat-grid + rollover) — cited throughout decision map.
- `docs/audit/IOT-MES-CURRENT-STATE-2026-06-08.md` — IoT+MES touchpoints for floor tasks (brak→rework, TB checklist on tablet).

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT (READ-ONLY) — MANDATORY FIRST STEP
Most modules are ~70% built. Do NOT rebuild before mapping what exists.

**Map the following (read-only, use `_audit/q.cjs` for DB, no writes):**

**DB tables:**
- `kanban_tasks` — columns, row count, basket_type column presence
- `kanban_observers` — columns, row count
- `kanban_card_files` (or card-files variant) — columns
- `cc_documents` with `basket_state` / `basket_owner_user_id` — confirm LIVE
- `personal_tasks` (or similar) — columns, `rolledOverFrom`, `scheduledTime`
- `kanban_boards`, `kanban_columns` (if any) — columns
- `kanban_ext_*` tables from `kanban-extended-tables.sql` — list all

**BE (apps/api/src/modules/kanban/ or similar):**
- Existing controllers, services, repositories — list endpoints + real vs stub
- `drizzle-kanban.repo.ts` / `drizzle-kanban-ext.repo.ts` (known: 964 lines — needs split ≤900)
- CC basket repo (`cc-baskets.repo.ts`) — confirm 24h/48h SLA cron is LIVE
- PersonalProgram service — does it exist? real or stub?

**FE (artifacts/erp-dashboard/src/):**
- Kanban board page — does it render? does it save?
- PersonalProgram component — soat-grid, rollover UI?
- Recruiting Kanban (`RecruitingKanban.tsx`) — note as HR-KAN bridge, do not touch here

**Gap table → write to `docs/KAN-RE-AUDIT-2026-06-08.md`:**
| Feature (from vision) | EP-KAN-### | Exists? | Real/Stub | Gap | Effort |
Each row for the 10 key decided features: 3-basket desktop (CC bridge) · 4-column board · assigner-confirm close · rollover+counter · task→card/GSD link · personal program soat-grid · rasporyajenie→task event · production order board · observer (kanban_observers) · escalation chain.

**⚠️ Two-worlds risk:** If `kanban_tasks.basket_type` AND `cc_documents.basket_state` both exist as basket sources — flag this conflict explicitly. Do NOT resolve without owner decision.

**⚠️ File size:** `drizzle-kanban-ext.repo.ts` is 964 lines (over 900 limit). Flag for split in Phase 1.

→ **STOP. Show owner the re-audit doc. Get explicit "continue" before any build.**

═══════════════════════════════════════════════════════════════
## BUILD PHASES

Each phase follows this sequence:
**permission gate (Q-28) → BE + FE parallel → verify (tsc 0 + DB-proof + FE persist round-trip) → DoD check → separate commit → Uzbek report → wait for "continue"**

DDL in any phase = STOP and get owner approval (Q-35) before executing migration.

---

### PHASE 1 — Task core: CRUD + assigner-confirm + rollover counter

**What to build / fix:**
- `kanban_tasks` must have: `assigner_user_id` (the person who assigned — EP-KAN-027 assigner-confirm), `assignee_user_id`, `status` enum (Yangi/Qabul_qilindi/Jarayonda/Tekshiruvda/Bajarildi/Bekor/Rad), `priority` enum (Shoshilinch/Oddiy/Past), `deadline` (NOT NULL — EP-KAN-047 deadline required), `category` (master-data ref), `title`, `expected_outcome` (EP-KAN-111), `rollover_count` (int default 0), `original_deadline` (for rollover history — EP-KAN-065), `rolled_over_from` date, `is_confidential` bool (EP-KAN-120), `card_id` FK → lavozim-karta (nullable — EP-KAN-014/108/132).
- If columns are missing: write DDL migration with `-- APPROVED: <owner name> <date>` comment, STOP for owner approval before running.
- **CRUD endpoint:** create (deadline REQUIRED — Zod guard), read, update status, soft-delete. Result<T> + Zod + repo layer.
- **⭐ Assigner-confirm (EP-KAN-027/032 override):** Moving task to "Bajarildi" goes to "Tekshiruvda" first; the **assigner_user_id** (not just manager) gets a notification and must confirm → moves to "Bajarildi". BE permission: only assigner or owner can confirm close. This is the override — not A-default manager-closes.
- **Rollover counter:** each rollover increments `rollover_count`; at 3 → emit escalation event to manager (EP-KAN-009). Log op-code EP-KAN-063 (rollover cron) + EP-KAN-064 (count check).
- **Deadline required guard (EP-KAN-047):** Zod schema rejects task creation without deadline. No deadline = cannot save.
- **Repo split:** if `drizzle-kanban-ext.repo.ts` is still 964+ lines, split into `drizzle-kanban-core.repo.ts` (CRUD) + `drizzle-kanban-board.repo.ts` (board queries) during this phase.
- **FE:** Task create form (title + assignee + deadline + category + expected_outcome — all required shown per EP-KAN-077); status transitions; assigner-confirm UI (Tekshiruvda → confirm button visible only to assigner).

**Verify:** tsc 0 · create task in DB (DB-proof) · move to Tekshiruvda → confirm as assigner → status=Bajarildi in DB · FE persist round-trip.

**DoD:** (1) BE real CRUD+Result+Zod · (2) FE template+token, loading/error, saves · (3) docs · (4) tests · (5) i18n UZ/RU · (6) edge-cases (deadline=null rejected, non-assigner cannot confirm) · (7) rollover cron registered. Op-codes: EP-KAN-025 (status), EP-KAN-027 (assigner-confirm), EP-KAN-047 (deadline-guard), EP-KAN-063/064 (rollover).

**Separate commit. Uzbek report. Wait for "continue".**

---

### PHASE 2 — 3-basket personal desktop (CC bridge)

**What to build / fix:**
- **E6 canonical source:** The 3-basket (Kiruvchi / Kutilmoqda / Chiquvchi) reads from `cc_documents.basket_state` ('inbox'/'pending'/'outbox') + `basket_owner_user_id`. Do NOT create a new basket table or duplicate storage.
- If `kanban_tasks.basket_type` exists as a second source: resolve with owner first (basket canonical = CC wins per E6). Then build unified read-only view.
- **Unified desktop endpoint:** `GET /api/kanban/my-desktop` — merges: (a) CC basket items for current user + (b) kanban_tasks assigned to current user. Single paged response sorted by priority+deadline.
- **3-basket UI (BoardPage template):** three columns (Kiruvchi/Kutilmoqda/Chiquvchi) reading from CC basket; task drag → `PUT /api/cc/basket/move` (CC side); 24h SLA badge (LIVE from `cc-sla.cron.ts`); escalation badge (48h — LIVE).
- **EP-KAN-003 / EP-KAN-006:** These are already covered by `cc-sla.cron.ts`. Verify it fires and confirm EP-KAN-003 (24h red badge) is visible in UI. If UI only needs wiring, wire it; if cron logic is missing, add it with owner approval.
- **Outbox auto-archive (EP-KAN-006):** 24h after outbox → auto-archive. Check if CC handles this; if not, add cron — but get owner approval (Q-35 if new table needed).
- **FE:** personal desktop page (`/kanban/desktop`) using BoardPage template + 3 columns + task cards per column. Loading states, error states, empty states.

**Verify:** login as user → desktop shows CC inbox items → drag to pending → DB basket_state updates → reload persists.

**DoD:** all 7. Op-codes: EP-KAN-001 (unified desktop), EP-KAN-005 (moveToPending), EP-KAN-006 (outbox archive). No new basket table.

**Separate commit. Uzbek report. Wait for "continue".**

---

### PHASE 3 — 4-column board + observer + task→card/GSD link

**What to build / fix:**
- **4-column board (EP-KAN-015 owner-confirmed):** columns = Reja / Jarayonda / Tekshiruvda / Bajarildi. Scope: personal board / department board / project board (EP-KAN-016). Department can add columns (stored in `kanban_boards` or `kanban_columns` table — if missing, DDL=owner approval first).
- **Transition rules (EP-KAN-032/035/036):** only assignee can move forward; "Bajarildi" needs assigner-confirm (Phase 1 already built); no skipping columns (EP-KAN-035); "Jarayonda" requires deadline+assignee filled (EP-KAN-036). Back-move allowed with reason (EP-KAN-033). Reopen by manager with reason (EP-KAN-034).
- **WIP limit (EP-KAN-038):** max 3 tasks in "Jarayonda" per user. BE guard on status transition. FE warning badge.
- **Observer (EP-KAN-017 / kanban_observers LIVE):** add observer (max 5 — EP-KAN-074); manager auto-observer on high-priority tasks (EP-KAN-073). Observer sees + comments, cannot change status. Confidential task: only confirmed observers (EP-KAN-075).
- **Task → lavozim-karta link (EP-KAN-014/108/132 — E2 card-centric):** `card_id` FK on kanban_tasks → lavozim-karta. On task completion (Bajarildi), emit GSD contribution event (EP-KAN-014). Task assigned to card position → current cardholder sees it; empty card → falls to manager (EP-KAN-132). EP-KAN-108: if employee leaves, task stays on card.
- **Attachment / comments (EP-KAN-029/083):** file + comment thread (card-files already exists). @mention types: @info (read-only) vs @request (drops task into mentioned user's inbox — EP-KAN-125).
- **FE:** BoardPage template per scope; drag-drop columns; observer badge; card detail with comment thread + attachments; card→lavozim link picker.

**Verify:** create dept board → assign task to card position → employee leaves card → task still visible · add observer → observer sees comment · WIP=4 → blocked with toast.

**DoD:** all 7. Op-codes: EP-KAN-016 (board scope), EP-KAN-017 (observer), EP-KAN-014 (card/GSD link), EP-KAN-032 (transition permission), EP-KAN-078 (assignee model).

**Separate commit. Uzbek report. Wait for "continue".**

---

### PHASE 4 — Personal program (soat-grid + rollover + recurring + daily lock)

**What to build / fix (ShVB Y20 build-prompt is the spec):**
- **Entity:** `personal_tasks` table (or `kanban_personal_tasks`) — `scheduledTime` (hour slot), `rolledOverFrom` date, `rolloverCount`, `priority` (3-color: Yuqori=red/O'rta=yellow/Past=green — EP-KAN-010), `estimateMinutes` optional (EP-KAN-011), `habitTemplate` bool, `lockedAt` (day lock). If missing → DDL migration, STOP for owner approval.
- **Soat-grid (EP-KAN-007/049):** 1-hour slots (08:00–18:00 + beyond as needed) · fixed slots for tanaffus/tushlik/namoz show as locked (EP-KAN-088). Smena shift lunch auto-slot (EP-KAN-089).
- **Rollover cron (EP-KAN-008/063):** nightly (at smena end, per EP-KAN-067) — incomplete tasks roll to next day; `rolloverCount` increments; at 3 → escalate to manager (EP-KAN-009). Date-fixed tasks do NOT roll — escalate instead (EP-KAN-066).
- **Plan vs fact (EP-KAN-050):** each hour slot shows reja/fakt/farq at day end. Gap slots shown in yellow (EP-KAN-053).
- **Manager morning view (EP-KAN-051/116):** employee confirms day plan at start; manager read-only view of team's day plans.
- **Day lock (EP-KAN-055):** after day end → locked (read-only). No edits after lock.
- **Recurring habits (EP-KAN-022/054):** set once → appear daily automatically (CRON). Kanban board tasks auto-appear in personal program (EP-KAN-028/048).
- **FE:** PersonalProgram.tsx — soat-grid + color-coded priority cards + rollover badge + plan/fact markers + locked day indicator. Use DetailPage/DashboardPage template.

**Verify:** create task for 10:00 slot → at EOD incomplete → rollover cron → appears next day with count=1 → at count=3 → escalation event fires.

**DoD:** all 7. Op-codes: EP-KAN-007 (daily create), EP-KAN-008 (rollover cron), EP-KAN-010 (priority color), EP-KAN-022 (recurring), EP-KAN-050 (plan/fact), EP-KAN-055 (day lock).

**Separate commit. Uzbek report. Wait for "continue".**

---

### PHASE 5 — Production order board + escalation chain + reports

**What to build / fix:**
- **Production order board (EP-KAN-097/098 — CHAT-TARIXI-YANGI spec):** Each `sales_orders` record → a production Kanban card. Columns = real tech stages (Флексо / Высечка / Резка / Ламинация / etc.) configured per product route. Card shows: Наименование + Тираж + progress-bar (done/total EP-KAN-099) + payment balance badge (EP-KAN-100) + operator-station (EP-KAN-101) + helper role (EP-KAN-102) + product-type color (EP-KAN-129: 5х/2х/gofra/karton). Special note badge on card face (EP-KAN-106). Internal ("Академияга") vs external flag (EP-KAN-115).
- **Stage dependency (EP-KAN-122):** card blocked by previous stage; auto-unblocks when preceding card closes. Log op-code.
- **Due-date escalation (EP-KAN-105):** Дата готовности overdue → auto-notify production head + sales manager (CRON). Uses `sales_orders.delivery_date`.
- **Order sync (EP-KAN-127):** if sales order Тираж/deadline changes → card auto-updates; if stage in-progress → operator gets confirmation prompt.
- **Shift relay (EP-KAN-112):** at shift end CRON — incomplete cards list → next shift operator confirms receipt (estafeta handover).
- **Material request (EP-KAN-103/136):** card approaching Печать stage + paper stock low → auto task to supply inbox (EP-KAN-103). Заявка quantity vs warehouse stock check (EP-KAN-136).
- **Packaging→warehouse/delivery event (EP-KAN-128):** Упаковка stage close → emit warehouse-receive task + delivery task (if payment complete).
- **Brak→rework task (EP-KAN-113 — E4 IoT-tablet):** defect flagged at stage → rework task auto-created with quantity+reason. GSD + QC linked.
- **Escalation chain (EP-KAN-040/042/043):** task overdue 24h work-hours → escalate to assignee's direct manager (Vysotskiy-7 manager_id chain). Another 24h → next level up, stops at CEO (EP-KAN-043). Channel: in-app + Telegram (EP-KAN-044). Escalation count in monthly report (EP-KAN-045). Manager can dismiss with reason (EP-KAN-046).
- **Daily/weekly personal report (EP-KAN-030):** done/rolled/overdue per user → feeds GSD/KPI.
- **Standup mode (EP-KAN-124):** board "летучка" view — today's tasks + overdue + blocked in one screen.
- **FE:** production board page (BoardPage template, tech-stage columns) + escalation admin view + standup mode toggle.

**Verify:** create sales_order → production card appears on board → move through stages → Упаковка close → warehouse task auto-created in DB · overdue task 24h+ → escalation event fires → manager sees notification.

**DoD:** all 7. Op-codes: EP-KAN-097 (order card), EP-KAN-098 (tech stage cols), EP-KAN-105 (due escalation), EP-KAN-113 (rework from defect), EP-KAN-128 (packaging→wh/delivery), EP-KAN-040/042/043 (escalation chain).

**Separate commit. Uzbek report. Wait for "continue".**

═══════════════════════════════════════════════════════════════
## DoD — "TAYYOR" = 7 SHART (D5 — all must pass for each phase)
1. **BE real:** CRUD + Result<T> + Zod validation + real DB INSERT/UPDATE (no fake/echo/[] as unknown).
2. **FE real:** EP Linear Soft template + `var(--ep-*)` tokens + loading/error states + real persist (kirit → saqla → qayta och → ko'rinadimi).
3. **Docs:** Phase changes logged in `docs/` (gap doc updated).
4. **Tests:** BE unit (repo+service) + FE component test. New endpoint = test required (Q-29).
5. **i18n:** All new UI strings in UZ + RU (`uz/` + `ru/` namespaces). No hardcoded UZ/RU text in TSX.
6. **Edge-cases:** deadline=null rejected · non-assigner cannot confirm close · WIP>3 blocked · rollover>3 escalates · confidential task hidden from non-observers · empty card → task to manager.
7. **Automation:** Each cron/event wired (rollover nightly, escalation 24h, shift relay, day lock, habit recurring). Each operation logs its **EP-KAN-### op-code** (`level=info code=EP-KAN-027 action=assigner-confirm ...`).

═══════════════════════════════════════════════════════════════
## RAILS (per every phase)
- **Permission gate (Q-28):** Before any change — show `file:line` + exact change + reason → get owner "ha". Recommendation ≠ permission.
- **Verify, don't trust (Q-29):** All audit claims treated as stale until proven with live DB + tsc. Run `_audit/q.cjs` (read-only) for DB proof.
- **Separate commit per phase:** `git add <specific-files>` only. Never `git add -A` (other sessions share repo).
- **No regression (Q-39):** After each change, verify previously working features still work. CC basket cron must stay LIVE.
- **No rewrite (C6):** ~70% already exists. Re-audit first, fix & connect. Full rewrite = BANNED.
- **Honest 501 over fake (C3/Q-10):** If a sub-feature is not ready, return `HttpStatus.NOT_IMPLEMENTED` — never `{ok: true}` or `{data: []}`.
- **DDL = owner approval (Q-35):** Any new table or column migration must have `-- APPROVED: <name> <date>` comment AND owner verbal "ha" before running.
- **Report in Uzbek (Q-38):** After each phase: what was done / what is deferred / commit hashes. Owner reads Uzbek reports.
- **Basket canonical (E6):** CC `basket_state` = single source. If conflict with `kanban_tasks.basket_type` — STOP, ask owner, do not resolve unilaterally.
- **File size (B4/Qoida 13):** `drizzle-kanban-ext.repo.ts` at 964 lines must be split in Phase 1. Any new file starts ≤900 lines.

═══════════════════════════════════════════════════════════════
## STOP POINTS (explicit owner approval required)
1. **After Phase 0 RE-AUDIT** — before any build. Show gap doc, wait for "continue".
2. **Before ANY DDL** (new column / new table / migration) — show exact SQL + reason + `APPROVED:` marker draft. Wait for owner "ha".
3. **Basket two-worlds conflict** (if `kanban_tasks.basket_type` AND `cc_documents.basket_state` both live) — do NOT merge/drop without owner decision.
4. **Assigner-confirm implementation detail** — if `assigner_user_id` is missing from `kanban_tasks`, confirm with owner before adding column (DDL approval).
5. **After each phase** — show Uzbek report, wait for "continue" before starting next phase.
6. **Production board columns** — tech-stage column list (Флексо/Высечка/etc.) must match the actual factory route. Confirm master-data with owner before seeding.
