# EXECUTOR PROMPT #13 — BUILD T2: COR / KOORDINATSIYA (Kengash va hujjat governance)
> T2 governance layer. ShVB 5-kengash + Доклад + Протокол + Приказлар + Рек.Совет + operatsion koordinatsiya.
> Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES
You are the 🟢 **EXECUTOR**. Read `CLAUDE.md` + `docs/agent-constitution.md` first. All hard rules apply:

**Code rules (CLAUDE.md):**
- Zod validation (not class-validator) · Drizzle ORM (raw SQL only for LATERAL, with comment) · Result<T> pattern (no throw/return null) · file ≤900/func ≤150 lines · no fake (Q-40/43) · verify-don't-trust (Q-29) · permission gate (Q-28) · DDL = owner approval (Q-35, `APPROVED:` comment in migration) · no regressions (Q-39) · `git add <specific-file>` only · commit every step · report after each phase in Uzbek (Q-38) · NO REWRITE — fix & connect (~70% may exist).

**Project rules (LOYIHA-QOIDALARI-2026-06-08.md — sections A through J):**
- A-stack: NestJS+React/Vite+Drizzle+PostgreSQL; SSO (no module-specific login); responsive web only.
- B-code: TypeScript strict; Result<T>; Zod; no sql.raw(variable); no hardcoded secrets.
- C-correctness: C1 vision=measure-of-correct; C3 no fake; C4 form persists (round-trip); C5 no regress; C6 no rewrite.
- D-DoD: D1 BE+FE parallel; D3 re-audit-first; D4 phase-by-phase with owner approval; D5 7-condition DoD.
- E-cross-cutting (apply to every phase — see §5 below for COR-specific application).
- F-security: RBAC from card (field-level); immutable approved docs (F5); audit-log 7 years (A6).
- G-design: EP Linear Soft tokens only; existing templates (ListPage/FormPage/DetailPage/DashboardPage); no new design; max 2 tab levels (Q-42); standard button placement (Q-41).
- H-canonical data: buyurtma=`sales_orders`; stok=`warehouse_stock`; GL=`entries`/`gl_entries`; no two-world (H4).
- I-process: one executor at a time; permission gate before every change (I3); `git add <file>` (I6).
- J-op-codes: every operation logs `EP-COR-###` (J1/J2).

**Design (mandatory, Q-41/Qoida 21):** EP Linear Soft tokens (`var(--ep-*)`, `var(--mod-*)`) + existing templates — no new design. COR module color = neutral management / dark-blue family (governance layer).

═══════════════════════════════════════════════════════════════
## 1. WHY THIS MODULE / GOAL (Q-40 — the measure of "correct")

**COR is the T2 governance layer** — it is the ShVB (Sohibkor va Boshqaruv) control plane that sits above operational modules. Every council decision, order, directive, and escalation flows through it. Without COR, the org-chart is structurally defined (ORG/T1) but ungoverned: there is no formal council session, no protocol, no приказ, no doklad routing, no escalation chain.

**Vision = what the owner decided (source docs below — read ALL before touching code):**
- `docs/audit/decisions/04-coordination.md` — full 135-decision map (EP-COR-001..135); 73 ANSWERED + 62 now resolved via OCHIQ-JAVOBLAR.
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` → "## Coordination" section — **these OVERRIDE all A-defaults**. Key overrides listed in §3 below.
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` — project-wide rules block (this section).
- `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` — ShVB structural detail (5 councils, Доклад blank, workflow).
- `docs/audit/IOT-MES-CURRENT-STATE-2026-06-08.md` — IoT/MES current state (operator tablet = floor hub; COR touches it via downtime/priladka/smena-checklist).
- `docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md` — skim for any cross-module coordination flows involving warehouse or cashier.

**Tier:** T2 (BOSHQARUV/NAZORAT — ShVB governance layer). Build after T1 foundation (ORG/HR/Finance/SD/PP) is stable.

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT existing COR implementation (READ-ONLY) — DO THIS FIRST

The coordination module likely has partial stubs from earlier sessions. **Do not rebuild anything.** Map what EXISTS vs what the vision needs:

**Tables to check (read-only via `_audit/q.cjs` or `psql`):**
- Council/governance tables: `council_levels`, `council_members`, `meeting_protocols`, `meeting_protocol_items`, `orders` (приказ — NOT the production `orders` world; check carefully for naming collision), `directives`/`rasporyazheniya`, `doklady`, `rec_council_sessions` — list row counts and columns.
- Cross-module: `workflow_rules` (horizontal routing), `escalation_log` — do they exist?

**Backend to check:**
- Existing coordination controllers/services/repos in `apps/api/src/modules/coordination/` (or similar path) — list each endpoint, mark real vs stub (501/`{ok:true}`/`[] as unknown`).
- Event listeners for coordination events — wired or zero-listener?

**Frontend to check:**
- `artifacts/erp-dashboard/src/pages/` — what coordination pages exist? What renders, what saves (round-trip)?
- Sidebar entry for coordination — is it registered in `constants.ts`?

**Boundary clarification (owner override EP-COR-051):**
- `распоряжение` (farmoyish/topshiriq) **LIVES IN KANBAN** — it is created from a protocol decision, but its lifecycle (accept/complete/overdue/reject) is managed by the Kanban module. COR only creates the распоряжение record and links it; do NOT rebuild распоряжение CRUD here.
- "3-savat" (3-tray inbox) is also Kanban-side.
- Document approval gateway → `CC` (Hujjat module). COR references it but does not own the approval engine.

**Output:** write `docs/COR-RE-AUDIT-2026-06-08.md` with:
- Feature (from vision EP-COR-###) | EXISTS (table/endpoint/page) | REAL or STUB | GAP | EFFORT (S/M/L)
- Boundary map: what COR owns vs Kanban vs CC vs IoT.

→ **STOP. Show owner the re-audit report. Get explicit "continue" before any build.**

═══════════════════════════════════════════════════════════════
## OWNER OVERRIDES FROM OCHIQ-JAVOBLAR (apply throughout all phases)

These override A-defaults from the decision map. Cite them in commits.

1. **EP-COR-037 ⭐ Council structure = org-chart:** All meeting types (Operativ/Oylik/Choraklik/Favqulodda) — membership, quorum, participants — come from the org-chart (7-otdeleniye Vysotskiy hierarchy). Not a separate master-data list of people. Card → member.

2. **EP-COR-046 ⭐ Доклад + AI camera auto-draft:** Meeting room AI camera transcribes speech → auto-drafts Доклад and Protocol. Build the data model to accept AI-generated drafts; the camera integration itself is Phase-IoT, but the schema must support `source: 'ai_camera' | 'manual'` and `draft_text`.

3. **EP-COR-051 ⭐ Распоряжение → KANBAN boundary:** COR creates the record (from protocol decision or direct issue), immediately hands off to Kanban for lifecycle. COR's role: create + link to protocol/source. Kanban's role: accept/progress/complete/overdue. Do NOT duplicate lifecycle state in COR.

4. **EP-COR-057 Приказ categories = Uzbek:** 4 categories with Uzbek names: **Kadrlar (K) / Asosiy (OD) / Moliya (F) / Xo'jalik (AX)**; each gets its own prefix and sequential number series.

5. **EP-COR-086 ⭐ 24h plan = floor core (golden-thread):** Daily 1-cycle plan auto-generates → pushes to logistics/uchastka/warehouse card. Change → push + log. This is the operational heartbeat linking COR to PP/MES/WMS.

6. **EP-COR-087 ⭐ Downtime = HR-082 same source:** Downtime event (reason+time+responsible dept) → auto statistics. Shares data source with HR module (HR-082 downtime); do not create a separate table — use or extend the canonical downtime log.

7. **EP-COR-088 ⭐ Logistics STOP:** Techkarta-mismatch → output blocked + notify designer; STOP can only be released by planning/design manager.

8. **EP-COR-098 ⭐ Priladka = IoT tablet:** Operator enters setup time via IoT tablet. Do not build a web form for this in COR; COR reads/displays the data from IoT.

9. **EP-COR-130 ⭐ Smena checklist = IoT tablet:** Shift readiness checklist (material/qolip/dastgoh/xodim) lives on IoT tablet. Currently NOT in the system (GAP confirmed in IOT-MES-CURRENT-STATE). COR provides the checklist definition; IoT executes it.

10. **EP-COR-132 Director approval gate:** Certain decisions (new position/large expense/приказ) must pass through Director Pozilov A.A. approval step (electronic confirmation in ERP).

11. **AI-REJALASHTIRISH PRINTSIP:** Order sequence/routing/priority/material-balance = AI automatic (7-step: buyurtma→material→bron→marshrut→vaqt→reja→ijro). Manager only confirms. This applies to EP-COR-115/116/118/121/122/123/125/126/127/128/129 (all auto-resolved as A-default under AI-planning principle).

12. **GLOBAL PRINCIPLE (E1):** AI observes and flags (camera/downtime/defect/low-fit), but NEGATIVE EFFECT (fine/score-drop/block/demotion) ONLY with human confirmation — never automatic. Apply to EP-COR-073 (execution rating affects KPI only via confirmation), EP-COR-108 (manager fault → KPI only via confirmation).

═══════════════════════════════════════════════════════════════
## BUILD PHASES

Each phase follows: permission gate (Q-28) → BE+FE parallel (D1) → verify (tsc 0 + DB-proof + FE persist round-trip) → DoD check → separate commit (git add <specific-file>) → report to owner in Uzbek (Q-38) → wait for "continue".

---

### PHASE 1 — Council master-data + membership from org-chart

**Scope:** EP-COR-001/002/003/031/032/033/034/035/036

**BE:**
- Table `council_levels` (if not exists — DDL = owner approval): id, name_uz, name_ru, council_type (FOUNDERS/EXECUTIVE/ADVISORY/COMMITTEE/DEPUTIES), description, is_active, created_at.
- Table `council_members`: id, council_level_id (FK), card_id (FK → org card — EP-COR-003: membership tied to the CARD not the person; card changes → membership auto-transfers), role (CHAIR/SECRETARY/MEMBER/GUEST), is_active, created_at. Real Drizzle schema + migration with `APPROVED:` comment.
- Service: `getCouncilMembers(councilLevelId)` — resolves current card holder → name from employee on the card. If card is vacant → member shows as "Vakant".
- Quorum check helper: 2/3 of voting members (CHAIR+MEMBER) present → valid; otherwise → "maslahat majlisi" (advisory only, no binding decision).
- Voting: simple majority; tie → CHAIR decides (EP-COR-034).
- Delegation: written proxy record (EP-COR-035); conflict-of-interest → member excluded from that agenda item (EP-COR-036).
- All operations log `EP-COR-001` through `EP-COR-036` op-codes.

**FE:**
- Council management page (ListPage template): list councils, click → members list with roles.
- Member assignment form: select card (from org-chart cards list) + role + active toggle. Persists (round-trip verify: assign → save → refresh → still assigned).
- Quorum indicator on council detail: "N/M a'zo — kvorum: HA/YO'Q".

**DoD:** table created + migration approved + endpoints real + FE persists + tsc 0 + i18n uz/ru + EP-COR-### logged.

---

### PHASE 2 — Meeting scheduling + agenda + attendance

**Scope:** EP-COR-037/038/039/040/041/042/081/082/085

**BE:**
- Table `council_meetings`: id, council_level_id, meeting_type (OPERATIVE/MONTHLY/QUARTERLY/EMERGENCY), scheduled_at, actual_started_at, actual_ended_at, status (SCHEDULED/IN_PROGRESS/COMPLETED/POSTPONED/CANCELLED), language (uz/uz_cyr/ru — EP-COR-085), agenda_locked_at, created_by.
- Table `council_meeting_agenda_items`: id, meeting_id, title, description, order_index, time_allocated_min, status (PENDING/DISCUSSED/DEFERRED), deferred_to_meeting_id (nullable).
- Table `council_meeting_attendance`: id, meeting_id, member_id, status (PRESENT/ABSENT_EXCUSED/ABSENT_UNEXCUSED/LATE/DELEGATED), delegate_member_id (nullable, EP-COR-035), created_at.
- CRON: recurring schedule (Seshanba 08:45 for Рек.Совет — EP-COR-017; configurable weekly/monthly templates — EP-COR-038). Advance notice: 2 business days for regular, 3 hours for emergency (EP-COR-039).
- Agenda lock: 1 business day before meeting; after lock, additions require CHAIR role (EP-COR-040).
- Attendance auto-status (EP-COR-041): 4 states; 3 unexcused absences → HR warning event.
- Duration limit: Operative 30 min / Monthly 90 min target; overflow → agenda items marked DEFERRED and auto-moved to next meeting (EP-COR-042).
- Postpone rule (EP-COR-081): postponed meeting auto-reschedules, all agenda items + prepared doklads preserved.
- Emergency meeting (EP-COR-082): light quorum 50%; subsequently ratified at next regular meeting.

**FE:**
- Meeting list (ListPage) + create meeting dialog (FormPage): type, council, date/time, language.
- Agenda builder: drag-order items, lock indicator, "add item" disabled after lock for non-CHAIR.
- Attendance sheet inside meeting detail: mark each member present/absent/delegated.
- Quorum banner: live quorum % as attendance is marked.

**DoD:** tables + crons + agenda-lock logic real + attendance round-trip + tsc 0 + i18n + EP-COR-### logged.

---

### PHASE 3 — Доклад (report) module

**Scope:** EP-COR-004/005/006/007/043/044/045/046/047/048

**Key override: EP-COR-046 — AI camera can auto-draft the доклад. Schema must support `source` field.**

**BE:**
- Table `council_doklady`: id, meeting_id (nullable — доклад can be standalone or tied to meeting), council_level_id, doklad_type (PLANNED/RESPONSE/PROBLEM — EP-COR-043), subject, period, completed_work, plan_fact_deviation, problems, proposals, attachments (JSONB array), status (DRAFT/SUBMITTED/READ/RESOLVED/ARCHIVED), source ('manual'|'ai_camera'), draft_text (text — AI-generated raw transcript, nullable), submitted_at, read_at, resolved_at, archived_at, author_id, routing_council_level_id.
- Response deadline: standard 3 business days / urgent 1 business day (EP-COR-044, consistent with Q-121 "per-doc deadline").
- Escalation CRON (EP-COR-045): D-1 reminder → after deadline → escalate to upper manager via org-chart manager_id → +2 days → KPI "late" flag (human confirmation required before KPI impact — E1 principle).
- Routing: sender selects council level; system notifies all members (EP-COR-006). Primary routing = org-chart auto (EP-COR-028); `vertikal → gorizontal, no skip`.
- Notifications: ERP-internal + Telegram group (EP-COR-007/080); recipient from `council_members` + `telegram_group` field on org unit.
- Status audit-log: every status transition recorded (who/when/IP — A6).

**FE:**
- Доклад list (ListPage): filter by type/status/council/date.
- Доклад form (FormPage): 6 mandatory fields (Davr/Bajarilgan/Reja-fakt/Muammo/Taklif/Ilova) + type + council routing. All in Uzbek labels (EP-COR-046 override).
- Status timeline: visual steps (Yuborildi → O'qildi → Hal qilindi → Arxiv) with timestamps.
- Round-trip verify: create доклад → submit → status = SUBMITTED → recipient sees it → mark READ → status = READ.

**DoD:** full status flow real + escalation cron wired + AI-draft schema present + FE persists + tsc 0 + i18n + EP-COR-### logged.

---

### PHASE 4 — Protocol + decision-to-распоряжение chain

**Scope:** EP-COR-011/012/013/014/062/063/064/065/066/067/068/069/070/071/072

**Key override: EP-COR-051 — распоряжение lifecycle lives in Kanban. COR creates it and links; do NOT build accept/complete/overdue here.**

**BE:**
- Table `council_protocols`: id, meeting_id, council_level_id, status (DRAFT/AWAITING_SECRETARY_SIGN/AWAITING_CHAIR_SIGN/APPROVED/ARCHIVED), agenda_items_summary (JSONB), attendees_summary (JSONB), decisions_count, next_meeting_date, source ('manual'|'ai_camera'), draft_text (nullable), secretary_signed_at, chair_signed_at, secretary_id, chair_id, version (int, starts 1), locked_at.
- Table `council_protocol_decisions`: id, protocol_id, text, responsible_card_id, deadline, status (OPEN/ASSIGNED/DONE/CARRIED_OVER), evidence_required (bool — required for HIGH/URGENT, optional for normal — EP-COR-071), objection_text (nullable — EP-COR-067 "alohida fikr"), created_kanban_task_id (FK → kanban tasks table, nullable).
- Sign flow (EP-COR-063): SECRETARY signs → CHAIR signs → APPROVED. 2-sign principle (EP-COR-023 pattern): physical signature + ERP confirmation (who/when/IP).
- Sign deadline (EP-COR-065): CHAIR must sign within 2 business days of meeting; overdue → reminder + escalate to CEO list.
- Immutability (EP-COR-066/F5): once APPROVED → locked; correction only via new "tuzatish protokoli" linked as amendment; original preserved.
- Auto-распоряжение (EP-COR-013/068): on each protocol decision → create record in Kanban tasks table (or fire event `ProtocolDecisionCreatedEvent` that Kanban module listens to) with: responsible_card_id, deadline, source_protocol_id, source_decision_id, priority derived from urgency.
- PDF export (EP-COR-012): generate PDF from protocol template (factory blank style); endpoint `GET /api/coordination/protocols/:id/pdf`.
- Archive search (EP-COR-014/074/075): full-text search across protocols by council type / date range / keyword / responsible / number / status.
- Decision carry-over CRON (EP-COR-070): incomplete decisions auto-appear in next meeting's agenda as "bajarilmagan qaror" section; responsible must explain.

**FE:**
- Protocol detail page (DetailPage template): meeting summary, agenda items, decisions table (with responsible/deadline/status from Kanban), sign-flow status bar.
- Decision tracker: shows execution % per decision (data pulled from Kanban task status — EP-COR-069).
- "Alohida fikr" button per decision: opens text input, saves as objection_text.
- "Export PDF" button: triggers PDF endpoint, downloads file.
- Archive search page (ListPage + filters): council type / date range / keyword / status.

**DoD:** protocol sign-flow real + decisions auto-create Kanban event fired + PDF endpoint real + search real + tsc 0 + i18n + EP-COR-### logged.

---

### PHASE 5 — Приказлар (Orders) registry

**Scope:** EP-COR-019/020/021/022/023/024/025/049/056/057/058/059/060/061/132

**Key override: EP-COR-057 — Uzbek category names. EP-COR-132 — Director approval gate.**

**BE:**
- Table `company_orders` (приказлар — verify no naming collision with production `orders`; if collision, use `official_orders` or `prikazlar` — run H4 two-world check first):
  id, order_number (format: `{PREFIX}-{YYYY}-{NNN}`, auto-generated, unique per category+year), category (KADRLAR/ASOSIY/MOLIYA/XOJALIK), prefix (K/OD/F/AX), title, content (text), basis_document (text — mandatory: reference to source doc/meeting decision/application — EP-COR-059), issued_at, effective_date (nullable, separate from issued_at — EP-COR-021), expiry_date (nullable), status (DRAFT/AWAITING_SIGN/SIGNED/IN_FORCE/CANCELLED/SUPERSEDED), signed_by_id, signed_at, signed_confirmation_text (who confirmed physical signature — 2-sign model EP-COR-023), director_approved_at (nullable — EP-COR-132), director_id (nullable), is_immutable (bool, set true on SIGNED), version (int), superseded_by_id (FK self — EP-COR-061), attachments (JSONB), created_by.
- Auto-numbering: sequential per category+year; gap preserved on cancel (EP-COR-058, immutable+gap=legal).
- Director gate (EP-COR-132): for categories KADRLAR and MOLIYA → Director must confirm (Telegram + ERP notification → confirms in ERP). Without director confirmation → status stays AWAITING_SIGN.
- Immutability (F5/EP-COR-061): once SIGNED → is_immutable=true; change → new order with reference to original.
- Familiarization (EP-COR-025): table `order_acknowledgements` (order_id, employee_id, acknowledged_at) — employees notified + "tanishdim" confirmation collected.
- PDF export (EP-COR-024): `GET /api/coordination/orders/:id/pdf`.

**FE:**
- Приказлар list (ListPage): filter by category/status/date/number; "Register number" column prominent.
- New order form (FormPage): category dropdown (Uzbek names) → prefix auto-shown → basis document field (mandatory), effective date, content editor.
- Sign workflow panel: current status + "Imzolash tasdig'i" button (sets signed_at + confirmation text) + Director approval indicator.
- Familiarization tab: list of employees notified + acknowledged/pending counts.
- "Export PDF" per order.

**DoD:** auto-numbering real + director gate real + immutability enforced + acknowledgement round-trip real + PDF real + tsc 0 + i18n + EP-COR-### logged.

---

### PHASE 6 — Рек.Совет (Advisory Council ZVS session) + Coordination dashboard

**Scope:** EP-COR-015/016/017/018/026/027/028/083/089/101/102/106/108/119/120/131/134/135

**Key override: EP-COR-086 (24h plan push), EP-COR-028 (org-chart vertical routing), EP-COR-119 (horizontal workflow_rules).**

**BE (Рек.Совет sessions):**
- Table `rec_council_sessions`: id, session_date, status (OPEN/IN_REVIEW/CLOSED), opened_by, closed_by, opened_at, closed_at, total_zvs_count, approved_count, partial_count, rejected_count, total_approved_amount, total_rejected_amount.
- Table `rec_council_zvs_items`: id, session_id, zvs_ref (reference to Finance ZVS request — FK), decision (APPROVED/PARTIAL/REJECTED), approved_amount, rejected_amount, note, decided_by, decided_at.
- CRON Tuesday 08:45 (EP-COR-017): notify Рек.Совет members "bugun sessiya, X ta ZVS kutmoqda" → Telegram + ERP.
- Session report (EP-COR-018): auto-report (approved/rejected/totals) → linked to protocol if meeting-based.

**BE (routing + escalation):**
- `workflow_rules` table (EP-COR-119): source_dept_id, target_dept_id, document_type, routing_rule (JSONB) — horizontal cross-dept routing. Admin panel to configure (no code deploy needed).
- Escalation engine (EP-COR-027/053): 3-step chain via org-chart manager_id (Vysotskiy 7): D-1 reminder → immediate manager → +2 days otdeleniye head → +3 days CEO. Cron fires daily.
- Cross-module event dispatch (EP-COR-083): on council decision by type → fire domain event to relevant module (e.g., `HRCouncilDecisionEvent` / `FinanceCouncilDecisionEvent`). Golden-thread integration.
- 24h plan cron (EP-COR-086): daily cycle generates plan → pushes to logistics/uchastka/warehouse (event or direct record).
- Downtime log (EP-COR-087): extend or reference canonical downtime table (shared with HR-082) — add coordination FK; do not create duplicate table.
- Coordination KPI auto-compute (EP-COR-102): execution events from Kanban + doklad/protocol timestamps → auto KPI; no manual entry (30/70 principle); KPI impact only with human confirmation (E1).
- Card AI feed (EP-COR-135): coordination events (late/STOP/defect/norm%/SLA) → emit `CardAiCoordinationEventFeed` for card-AI module.
- RBAC field-level (EP-COR-076/131): meeting/document `is_confidential` flag; confidential → only members+CEO; RBAC from card role (F1).

**BE (Coordination dashboard — EP-COR-026):**
- Endpoint `GET /api/coordination/dashboard`: open doklads count, pending Kanban-распоряжения count (pulled from Kanban module), upcoming meetings (next 7 days), active приказлар count, overdue escalations.

**FE:**
- Рек.Совет session page: open session → add ZVS items (linked to Finance module ZVS requests) → decision per item (approved/partial/rejected + amount) → close session → auto-report shown.
- Coordination dashboard (DashboardPage template): 4 stat cards (open doklads / pending directives / upcoming meeting / active приказлар) + escalation list.
- Workflow rules admin panel (ListPage + FormPage): create/edit routing rules (source dept → target dept → doc type → rule).

**DoD:** Рек.Совет session round-trip real + dashboard real data (not hardcoded) + routing rules CRUD real + escalation cron wired + cross-module events fired + tsc 0 + i18n + EP-COR-### logged.

═══════════════════════════════════════════════════════════════
## 4. DoD — 7 CONDITIONS (all phases, ERP-SIFAT-STANDARTLARI)

Every phase must satisfy ALL 7 before commit:
1. **BE real:** CRUD endpoints + Result<T> pattern + Zod validation + real Drizzle DB operations (no `{ok:true}` / no `[] as unknown` / no echo).
2. **FE real:** EP Linear Soft tokens + existing template (ListPage/FormPage/DetailPage/DashboardPage) + loading/error states + persists on round-trip (kirit → saqla → qayta och → ko'rinadimi).
3. **Documentation:** update `docs/COR-RE-AUDIT-2026-06-08.md` marking items as DONE; note any deferred items.
4. **Tests:** BE unit test for at least the sign-flow / escalation / immutability logic; FE test for form submission.
5. **i18n:** all UI strings in `uz` and `ru` translation files (no hardcoded Uzbek/Russian strings in JSX).
6. **Edge-cases handled:** vacant card → member shows as "Vakant" (not crash); quorum not met → meeting labeled "maslahat majlisi"; immutable doc → edit blocked with clear message; director gate → status shows "Direktor tasdig'i kutilmoqda".
7. **Automation:** every operation emits its `EP-COR-###` op-code to the audit log (A6/J1); cron jobs registered in NestJS scheduler; domain events fired where cross-module.

═══════════════════════════════════════════════════════════════
## 5. RAILS — 6 CROSS-CUTTING PRINCIPLES (COR-specific application)

Apply in every phase:

**E1 — AI observes → human confirms negative effects:**
- COR-073 (execution rating → KPI): AI computes the score, but the KPI field update fires only after manager confirmation step. Build a `pending_kpi_impact` record that manager approves/rejects.
- COR-108 (manager fault → their KPI): same — AI flags, human confirms before KPI write.
- Escalation notification is automatic; escalation that affects KPI/salary/record is human-gated.

**E2 — Card-centric:**
- Council membership tied to `card_id` (position card), not `employee_id`. When a card changes occupant, membership auto-transfers to new holder (no manual re-assignment).
- Responsible person on protocol decisions = `responsible_card_id`; resolve to current card occupant at runtime.
- RBAC for coordination docs: access rights derive from card role (F1).

**E3 — AI plans orders:**
- EP-COR-086 (24h plan), EP-COR-096/126 (routing/algo type), EP-COR-110 (priority queue), EP-COR-121/123/127 (deviation signals) — all AI-auto; coordination module receives signals and displays them, does not compute them manually.
- EP-COR-073 (execution rating): AI calculates; human confirms KPI impact.

**E4 — Operator IoT-tablet = floor hub:**
- EP-COR-098 (priladka): COR only displays data read from IoT. The write path is on the IoT tablet. Do not build a web-form entry for priladka in COR.
- EP-COR-130 (smena checklist): COR defines the checklist template (which items to check); IoT executes it. Build `smena_checklist_templates` table; IoT result rows are read-only in COR.
- EP-COR-087 (downtime): extend the canonical downtime log (not a new table) — add `coordination_ref` FK.

**E5 — Org-chart routing:**
- All document routing (Доклад, Приказ notification, escalation chain) follows Vysotskiy 7 vertical (manager_id chain) then horizontal (workflow_rules table). No skip.
- Council membership = org-chart derived (7-otdeleniye heads = permanent members — EP-COR-031).
- Director Pozilov A.A. approval (EP-COR-132) = top of the approval chain.

**E6 — One canonical truth:**
- Downtime log: one table, shared with HR module (EP-COR-087 = HR-082 same source).
- Kanban tasks: one table; COR fires the creation event, Kanban owns the lifecycle.
- `workflow_rules` table: one table for all cross-module horizontal routing.
- No two-world for documents: приказлар in ONE table (check for naming collision with production `orders` world — H4 rule).

═══════════════════════════════════════════════════════════════
## 6. STOP POINTS (mandatory — do not proceed past these without owner approval)

1. **After Phase 0 RE-AUDIT** — show `docs/COR-RE-AUDIT-2026-06-08.md` to owner; get "continue" before any code change.
2. **Before any new DDL** — for every new table/column: state table name + columns + FK + reason; wait for owner "APPROVED"; add `APPROVED: [date]` comment in migration file (Q-35).
3. **Before touching canonical tables** — `sales_orders` / `warehouse_stock` / `entries` / `kanban_tasks` / `employees` / `org_functions` / `manager_id` chain: describe the exact change + why; wait for explicit approval.
4. **Before Phases 4 and 5** — protocol immutability + приказ immutability are irreversible architectural decisions; confirm the sign-flow design with owner before implementation.
5. **After each phase** — show holat hisoboti (phase summary in Uzbek): nima qilindi / nima commitlandi / nima deferred / qaysi EP-COR-### kodlar yopildi. Wait for "davom" before next phase.
6. **If Kanban module is not yet built** — распоряжение creation (Phase 4, EP-COR-013) can write to a `pending_directives` staging table with `status='awaiting_kanban'`; do NOT build a parallel Kanban-like lifecycle in COR. Confirm this approach with owner at Phase 4 stop.
