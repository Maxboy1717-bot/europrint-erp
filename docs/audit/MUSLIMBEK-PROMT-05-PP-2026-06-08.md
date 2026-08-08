# EXECUTOR PROMPT #05 — BUILD T1: PP / REJALASHTIRISH (Planning, AI 7-step)
> T1 core: oltin-ip yadrosi — SD→**PP**→MES→QC→WMS→FIN. Foundation (#01) + ORG/KARTALAR (#02) tugagan. Now build the Planning module.
> Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES

You are the 🟢 **EXECUTOR**. Read `CLAUDE.md` + `docs/agent-constitution.md` first. All hard rules apply:

**Code rules (CLAUDE.md):**
- Zod (class-validator EMAS) · Drizzle ORM (raw SQL faqat murakkab join) · Result<T> pattern (throw/null EMAS)
- File ≤ 900 / function ≤ 150 lines · magic numbers → `business.constants.ts`
- Controller = transport only (logic in service, service uses repo) · `@UseGuards` / `@Public` on every controller
- `ConfigService` for env vars · no hardcoded secrets · no `sql.raw(variable)` (SQL injection)

**Process rules (LOYIHA-QOIDALARI-2026-06-08.md):**
- **No fake (C3/Q-40):** every endpoint does real DB INSERT/UPDATE. `{ok:true}` / echo / `[] as unknown` = BANNED. Unimplemented → honest **501**.
- **Verify-don't-trust (C2/Q-29):** treat every existing claim as stale until live-probed (`_audit/q.cjs` read-only + HTTP probe).
- **Permission gate (F1/B6):** RBAC from card; field-level (salary only to authorized roles); 5 global guards already active.
- **DDL = owner approval (H4/Q-35):** new `CREATE TABLE` / migration only with `APPROVED:` comment from owner. STOP and ask before any DDL.
- **No regression (C5/Q-39):** nothing working before is broken after. Verify with tsc + DB-proof + FE round-trip.
- **No rewrite (C6):** system is ~70% built — fix & connect only. Do NOT rebuild existing services from scratch.
- **Canonical tables (H1-H3):** orders = `sales_orders` (sd_sales_orders=VIEW); stock = `warehouse_stock` (current_stock=VIEW); GL = `entries`; no two-world duplication.
- **Commit per phase:** `git add <exact-file>` only (never `git add -A`); commit after each phase; report to owner in Uzbek.

**Design (G1-G4/Q-41):** EP Linear Soft tokens (`var(--ep-*)`, `var(--mod-*)`); existing templates (ListPage / FormPage / DetailPage / DashboardPage / BoardPage); no new design system. PP module color = production orange family (`--mod-pp-*`). Tab depth ≤ 2 levels (Q-42).

**6 Cross-cutting principles (E1-E6 — MANDATORY for this module):**
- **E1. AI observes → human confirms negative effects** (auto-penalty/block = BANNED; confirm dialog required).
- **E2. Card-centric:** operator assignment from card (razryad/skill); data flows card → profile.
- **E3. AI plans orders:** 7-step (buyurtma→material→bron→marshrut→vaqt→reja→ijro); planner confirms, AI proposes.
- **E4. Operator IoT-tablet = floor hub:** start/stop timestamps, brak entry, TB checklist — all from tablet.
- **E5. Org-chart routing:** approvals travel vertically (operator→smena→bo'lim→5-Dept→CEO→Owner).
- **E6. One canonical truth:** A-System/Excel replaced by ERP (E6); no two parallel worlds.

═══════════════════════════════════════════════════════════════
## 1. WHY THIS MODULE / GOAL

**PP = T1 OLTIN-IP YADROSI** (golden thread core). It sits between SD (sales orders) and MES (floor execution). Every production order flows through PP: SD creates an order → PP plans it (tech card + MRP + CRP + shift + AI schedule) → MES executes it → QC validates → WMS ships → FIN costs. Without PP, the chain is broken.

**Vision measure (Q-40):** "correct" = the decided vision in `docs/audit/`. Code that compiles but violates the vision = wrong.

**Source docs (read these; build only to them — do NOT invent):**
- `docs/audit/decisions/07-pp.md` — full per-question decision map (136 decisions, EP-PP-001..136)
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` → PP section (owner overrides + resolved conflicts — **THESE OVERRIDE A-defaults**)
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` — project-wide hard rules
- `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` — AI 7-step planning model, gofra formulas, rating 7-factor
- `docs/audit/IOT-MES-CURRENT-STATE-2026-06-08.md` — IoT/MES current state (PP overlaps operator tablet)
- `docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md` — warehouse/material context (MRP feeds from WMS stock)

**Owner overrides (OCHIQ-JAVOBLAR PP section — apply verbatim):**
- **EP-PP-063:** Split delivery = ALLOWED (qisman yetkazish SD bilan); but WORK is never split — each partition 100% complete before next starts. [book conflict resolved]
- **EP-PP-025:** Frozen zone = **~3 days** (only owner/director can unlock).
- **EP-PP-082:** Order status lifecycle = **7 statuses** (Reja→Tasdiqlandan→Ishga tushgan→Jarayonda→Sifatda→Tugadi→Yopildi + Bekor/To'xtatilgan) + every transition logged with who/when.
- **EP-PP-105:** Assembly gate = YES (full part-set required before packing; if one part missing → warning block).
- **EP-PP-001/067 (conflict #5):** Planning horizon = **multi-layer** (monthly→weekly→daily→hourly); daily sutkalik plan = operational layer (book policy); weekly+monthly = management layer.
- **EP-PP-109:** Code dictionary (KT/PT/E/GL prefixes) = master-data; **owner will input meanings later** → placeholder UI only, no hardcode.

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT: MAP WHAT EXISTS (READ-ONLY) — DO THIS FIRST

**Goal:** understand what is actually built vs what the vision needs. Do NOT build yet.

Map the following (use `_audit/q.cjs` for DB row counts; HTTP-probe `:3030` for live endpoints):

**DB tables to check (do they exist? columns? row counts?):**
- `pp_production_orders` / `production_orders` / `papka_orders` — which is canonical?
- `pp_tech_cards` / `tech_cards` / `ow_tech_cards` — any existing tech card table?
- `pp_routes` / `pp_routing_operations` / `routing_operations` — routing/marshrut?
- `work_centers` — does `efficiency_rate` column exist? (known CRP-503 bug, EP-PP-051)
- `pp_shifts` / `shift_handovers` / `shift_schedules` — smena tables?
- `pp_mrp_requests` / any MRP/reorder table?
- `pp_machine_cards` / `machines` / any stanok master?

**BE to check (real vs stub):**
- `/api/pp/*` routes — list all, probe each for real DB vs stub
- `pp-intelligence.controller.ts` — known partial stub (CLAUDE.md Qoida 11)
- `pp-mps.service.ts` — known drift fix (memory: two-worlds phase1 fix 4a2f6ab6)
- `pp-crp` / `pp-routing` — real or stub?

**FE to check:**
- PP pages in `artifacts/erp-dashboard/src/pages/` — which exist, which render real data?
- Sidebar entries for PP — do they match canonical `constants.ts`?

**Output:** `docs/PP-RE-AUDIT-2026-06-08.md`
- Table: feature (from vision, cite EP-PP-###) | exists? | real/stub | gap | effort estimate
- List confirmed canonical tables (with row counts)
- List broken endpoints (503/501)

→ **STOP. Show owner the re-audit. Get "continue" before Phase 1.**

═══════════════════════════════════════════════════════════════
## BUILD PHASES

> Each phase: permission gate → BE + FE parallel → verify (tsc 0 + DB-proof + FE persist round-trip) → DoD check → separate commit → Uzbek report → wait for owner "continue".

---

### PHASE 1 — Tech Card (Texkarta) master-data + CRUD
**Scope (EP-PP codes):** EP-PP-012, EP-PP-013, EP-PP-014, EP-PP-032..040, EP-PP-037, EP-PP-087..090, EP-PP-094, EP-PP-116, EP-PP-122

**What to build:**
- Tech card = 6 elements (RD5 book, EP-PP-090): material turi / bosma parametrlari (rang soni+profil+registr+plotnost) / kesim / qolip / qo'shimcha ishlovlar / ish tartibi — store these as structured JSONB or dedicated columns.
- Tech card BOM (EP-PP-089): material code + quantity (kg/list) + layer (2-sloy/profil/mikro) — MRP reads this.
- Route/marshrut: operation sequence 10-step (10,20,30…, EP-PP-032); per-operation: machine bind + alternative machine (EP-PP-033); norm (dona/soat, EP-PP-034); setup time per color count (EP-PP-035, EP-PP-102); scrap norm = fixed + % (EP-PP-036).
- Direction (yo'nalish): ofs-kar / ofs-gof / flx-gof master (EP-PP-087); kashirovka auto-added for ofs-gof (EP-PP-088); post-press checkboxes (begovka/tisnenie/kongrev/oynakcha/laminat/lak/vib-lak, EP-PP-122); finish type + pack type (EP-PP-113, EP-PP-114).
- Format/profile master (EP-PP-116, EP-PP-117): gofra profile (E/B/C mikro, 2-sloy, 5-sloy) + format codes (105/72) → machine format matching.
- Raskroy (EP-PP-094): list format + "N dona per list"; system auto-computes list count (tiraj ÷ N + scrap reserve).
- Versioning (EP-PP-014, EP-PP-037): every change = new version (draft/approved/archived); version history stored.
- Lab approval gate (EP-PP-091): tech card needs LAB "Одобрена" stamp before plan can start; without it plan blocked.
- Die/qolip gate (EP-PP-115): qolip ID + status (bor/buyurtma-berilgan/yo'q); if missing → plan "qolip kutilmoqda".
- Quality gate — unapproved maket → plan in "waiting" state; only dizayn-rahbar approval (audit log) unlocks (EP-PP-123).
- Plan start gate = 3 conditions AND (EP-PP-124): maket-approved AND techcard+lab-approved AND material-available.
- Operator skill requirement per operation (EP-PP-038): min razryad + LMS certificate; mismatch → warning (E2 cross-cut).
- Who creates: Savdo opros-list → tex-menejer creates → SOZ manager checks completeness → bosh-rejalashtirish → LAB approves (EP-PP-013); permission guard accordingly.

**BE:** tech card repo/service/controller; Drizzle schema (DDL = owner approval required before migration); Result<T>; Zod validation on all mutations.
**FE:** FormPage template; all 6 elements editable; version history tab; lab-approval button (E5 org-chart: approval flows to authorized role); gate status badges (maket/techcard/material — 3 traffic lights); i18n UZ/RU.

**Verify:** create tech card → save → reload → data persists; lab approval changes status in DB; gate badge updates.

---

### PHASE 2 — Machine master-data + CRP foundation
**Scope (EP-PP codes):** EP-PP-046..052, EP-PP-051 (CRP-503 fix), EP-PP-121

**What to build:**
- Machine (stanok) card (EP-PP-046, EP-PP-121): code / name / type (flexo/offset/post-press) / format limit (EP-PP-050) / capacity unit (EP-PP-047) / work calendar (smena/soat per machine, EP-PP-048) / planned downtime / PM schedule (EP-PP-049) / efficiency_rate coefficient (EP-PP-051).
- ⭐ **CRP-503 fix (EP-PP-051):** `work_centers.efficiency_rate` column must exist in DB (known bug from memory). Verify before touching — if missing, add via migration (owner approval first). CRP endpoint `/api/pp/crp` must return 200 after fix.
- Machine group (EP-PP-052): group of same-type machines; planner auto-assigns least busy in group.
- 22+ machines from Bandlik.xlsx as seed data: Flexo gofra/pechat/tigel, Gofra mikro, Bosma SM 72/52, Laminatsiya, Laklash, Koshirofka, GTO, Begovka, Tisnenie, Kongrev, Avto Kley, Qadoqlash, Oynakcha, etc. (EP-PP-121). Seed = idempotent script.
- Machine-format matching (EP-PP-117): format code (105/72/105ф) → machine format (SM 72/52); planner auto-filters incompatible machines.
- OEE basis: machine efficiency_rate updated from real MES facts (EP-PP-051); CRP uses this.
- Labor-constrained CRP (EP-PP-132): CRP checks both machine capacity AND operator availability per shift (post-press: 1 operator runs multiple machines — constraint is operators, not machines).

**BE:** machine repo/service/controller; efficiency_rate migration (owner approval); CRP service reads efficiency_rate.
**FE:** ListPage + DetailPage for machines; capacity Gantt (rangli: yashil=bo'sh, qizil=to'la, EP-PP-005); format-filter in machine selection.

**Verify:** `/api/pp/crp` returns 200 (not 503); machine CRUD round-trip; CRP shows per-machine load %.

---

### PHASE 3 — MRP (Material Requirements Planning)
**Scope (EP-PP codes):** EP-PP-006, EP-PP-007, EP-PP-064..071, EP-PP-068, EP-PP-070

**What to build:**
- MRP shortage check (EP-PP-006): when plan is created, auto-check all materials (BOM × tiraj + scrap norm) against `warehouse_stock` (canonical H2). If shortage → red alert with "X material, Y kg missing, Z days lead time".
- Shortage response (EP-PP-007): (1) auto purchase request to Xarid (EP-PP-007 → op=pp.mrp.purchaseRequest); (2) order SHIFTED (plan status → "material kutilmoqda"); "keyin keladi" = BANNED by book policy.
- Reorder point per material (EP-PP-064): each material has reorder point + min stock; when drops below → auto purchase request. Lead time types = uzoq (no material → order not scheduled) vs tez (delivered before shift start, EP-PP-065).
- ATP check (EP-PP-066): when SD creates order, auto check raw material + capacity → if short → red + estimated date (oltin-ip SD↔PP).
- Material reservation/allocation (EP-PP-068): confirmed order reserves material; "free stock" = total − reserved; prevents mix-up (5-layer vs 3-layer gofra, book 259/931).
- WIP stock (zagotovka, EP-PP-069): semi-finished goods tracked separately; plan uses them first.
- Lot/batch tracking (EP-PP-070): FIFO/FEFO auto-suggestion; expired batch → blocked (QC lab partiya block).
- Dynamic reorder (EP-PP-071): CRON — reorder point recalculated from last 1-3 months average consumption.
- Gofra profile master (EP-PP-116): profile mismatch (5-layer vs 3-layer) detected at MRP stage → error alert.

**BE:** MRP service reads BOM from tech card + stock from `warehouse_stock`; creates purchase requests in Xarid module (event/outbox); reservation in DB; Result<T>; all parametrized SQL.
**FE:** MRP results panel on order detail; shortage list with purchase request status; ATP indicator on SD order form.

**Verify:** create order with insufficient material → shortage alert appears; purchase request created in DB; ATP on SD shows correct date.

---

### PHASE 4 — Production Order lifecycle + Shift Planning
**Scope (EP-PP codes):** EP-PP-002, EP-PP-010, EP-PP-015, EP-PP-021, EP-PP-022, EP-PP-026, EP-PP-030, EP-PP-060, EP-PP-061, EP-PP-072..079, EP-PP-080..084, EP-PP-097..108, EP-PP-118, EP-PP-119

**What to build:**
- Production order (papka) model (EP-PP-021): planning unit = operation × machine; order has 7-status lifecycle (EP-PP-082 owner override: Reja→Tasdiqlangan→Ishga tushgan→Jarayonda→Sifatda→Tugadi→Yopildi +Bekor/To'xtatilgan); every transition logged (who/when/reason).
- Papka № auto (EP-PP-103): format 2024-0499 (year-sequence); auto-assigned.
- Multi-line orders (EP-PP-118): one order = multiple line items (positions); each has own route/tiraj; "order complete" = all positions complete.
- Part-set (to'plam) gate (EP-PP-105, owner override): A/B side + top/bottom/inner/paddon linked as set; "complete set" gate before packing; if one missing → warning.
- Priority system (EP-PP-010, EP-PP-058..062): 4 levels (Shoshilinch/Yuqori/Oddiy/Past) + ZARUR ZAKAZLAR special zone (EP-PP-097); auto-rank by deadline + customer tier. Priority change = only ishlab chiqarish boshlig'i + direktor + written reason in audit log (EP-PP-060 — book policy).
- No preemption (EP-PP-061 — book STRICT): running job always completed; shoshilinch goes to next free slot. Only director's formal written order can interrupt.
- Split delivery allowed (EP-PP-063, owner override): qisman yetkazish OK (SD); but each partition 100% complete before next begins.
- Urgent order insertion (EP-PP-030): "ZARUR" flag → AI finds least-disruption slot; shifted orders get written + reason (book policy).
- Shift plan (EP-PP-072, EP-PP-073): smena × stanok × buyurtma × ishchi (operator + helper — 2 roles per slot); shift template ден/ноч (2-smena, EP-PP-107).
- Queue position (EP-PP-085): per-machine visible queue number (1,2,3…); drag-drop reorder; "Очеред"/"Очеред2" real field.
- Shift slot = day + smena (EP-PP-107): each machine has 2 slots per day.
- Worker substitution (EP-PP-076): if absent, system suggests same-skill available worker (usta confirms).
- Shift handover (EP-PP-077): end-of-shift electronic handover (remaining qty / machine state / note) — "Остал.сд-ть" field.
- Overtime (EP-PP-078): extra shift marked separately with coefficient; rahbar approval required (E5).
- Shift dashboard (EP-PP-079): auto dashboard — norma% / brak% / prostoy / dona / worst machine.
- Frozen window (EP-PP-025, owner override): **~3 days** frozen; unlock = only owner/director; oral change = BANNED.
- Daily re-plan CRON (EP-PP-080): auto nightly re-plan; manual trigger button for urgent changes.
- Order cancel/pause (EP-PP-083): consumed material/labor = "loss" with mandatory reason; WIP → stock.
- Material prep + delivery stages in route (EP-PP-119): route starts with "material tayyorlash" + ends with "yetkazib berish" (time-normed); full lead time shown.
- Waiting zone (EP-PP-101): orders not started shown with reason (material/maket/qolip/tasdiq).
- 3-timer auto (EP-PP-100): system computes ketgan kun / qolgan kun / boshlanmagan kun auto.
- Manager notification (EP-PP-098): each order linked to manager; on readiness/delay change → auto Telegram notification (book 1584); E5 org-chart.
- Order readiness % (EP-PP-099): completed departments ÷ total (5 of 3 = 60%).
- Repeat order (EP-PP-104): catalog look-up of old tech card; only tiraj/muddat updated.
- Skill check on assignment (EP-PP-075): operator razryad vs operation min razryad; mismatch → warning (E2; NOT a block unless explicitly configured).

**BE:** order repo/service/controller; status machine with audit log; shift plan service; priority ranking; CRON for daily re-plan + dynamic reorder; outbox events for manager Telegram; Result<T>.
**FE:** BoardPage (Kanban by status) + ListPage (table with Papka №); order detail tabs: Marshrut / Shift-reja / MRP / Brak / Tarix; shift Gantt (per machine, per day, ден/ноч slots); drag-drop queue; ZARUR zone block; frozen zone badge; 3-timer display; i18n UZ/RU.

**Verify:** order created → status lifecycle transitions persist in DB; frozen zone blocks edit; manager Telegram triggered on delay; shift plan saved and reloads.

---

### PHASE 5 — Plan-Fact tracking + Operator 4-number entry
**Scope (EP-PP codes):** EP-PP-023, EP-PP-053..057, EP-PP-091..093, EP-PP-110, EP-PP-127, EP-PP-128

**What to build:**
- Smena 4-number entry (EP-PP-092 — book: "Plan/Fakt vyrabotka / Ostalsya sdelat / Brak"): reja / fakt / qolgan / brak — entered at shift close by usta; or auto from MES. Izoh (reason code) mandatory if fakt < reja.
- Reason code 5 groups (EP-PP-055 — book EXACT): material yo'qligi / dastgoh buzilishi / kadr yetishmasligi / texnologik xato / reja noto'g'ri tuzilgan (+ boshqa/izoh). Unclosed without reason = counted as "bajarilmagan" (book 1407).
- Plan-fact comparison (EP-PP-023, EP-PP-053): 4 dimensions — buyurtma / stanok / smena / ishchi; 4 metrics — miqdor / vaqt / muddat / tannarx og'ishi.
- Threshold alert (EP-PP-056): configurable threshold per metric (%) → if exceeded → auto notification (Telegram/UI).
- Brak → rework task (EP-PP-093): brak entered → shortfall = order_qty − (fakt − brak); if > 0 → rework task auto-added to plan (linked to original order; material re-requested).
- Operator norm % auto (EP-PP-127): tizim computes fakt ÷ norma daily + monthly; linked to HR payroll. Idle time (no plan in slot) does NOT count against operator KPI (EP-PP-128 — E1 fairness principle; AI observes, human confirms any penalty).
- Weekly plan-fact (EP-PP-110): 3 views: daily / weekly / monthly; hafta = main management view.
- Norm auto-calibrate (EP-PP-135): planned duration = norm × tiraj + setup; if actual deviation > X% → system recommends norm revision (texnolog confirms, NOT auto-apply — E1).
- Lab gate in plan-fact (EP-PP-091): partiya with gramaj/humidity out of range → that partiya's plan BLOCKED until lab re-approves.

**BE:** plan-fact service; reason code master (5 groups, seeded); brak rework trigger (event/outbox → new plan task); norm calibration suggestion (not auto-apply); Drizzle queries by dimension; Result<T>.
**FE:** shift close form (4 numbers + reason dropdown); plan-fact dashboard (drill-down: order → machine → shift → worker); threshold config panel (admin); brak counter with auto rework status; operator KPI card (norm %, idle separated).

**Verify:** enter 4 numbers at shift close → plan-fact comparison updates; brak > 0 → rework task appears in DB; operator KPI shows correct separation of idle vs slow; reason code mandatory enforced.

---

### PHASE 6 — AI Planning Layer (7-step) + Owner Dashboard
**Scope (EP-PP codes):** EP-PP-003, EP-PP-009, EP-PP-024, EP-PP-031, EP-PP-095, EP-PP-096, EP-PP-106, EP-PP-130, EP-PP-131, EP-PP-134, EP-PP-136

**What to build:**
- AI 7-step planner (E3 — CHAT-TARIXI-YANGI 7-step model): buyurtma keladi → (1) material check → (2) bron/reserve → (3) marshrut tanlash → (4) vaqt hisob (norm×tiraj+setup) → (5) reja jadvali → (6) smena to'ldirish → (7) ijrochiga topshirish. AI proposes full plan; planner confirms 1-click (E3).
- AI explains each suggestion (EP-PP-031): each AI proposal has visible reason ("2-stanok bo'sh va format mos"); not a black box.
- AI fill-next-shift (EP-PP-130): AI proposes optimal smena fill: ZARUR buyurtmalar first + rang-guruh (priladka saving) + material-available + bottleneck-full. Planner 1-click approve or edit.
- Bottleneck/TOC (EP-PP-131): AI auto-identifies bottleneck machine (most loaded); builds plan around it (maximize throughput). Owner's real bottleneck = 90m flexo gofra line.
- AI raskroy optimization (EP-PP-095): AI suggests optimal format (size × list × dona × foyda kg); texnolog confirms (E1 — human confirms before apply).
- Small order warning (EP-PP-096): system knows min tiraj/size threshold; below → "kichik buyurtma" + profit dona/kg shown (alert to sales).
- Historical fact for ATP (EP-PP-106): repeat product → AI reads past actual times (avg + range) → suggests ATP date; sourced from real order history.
- CRP overload resolve (EP-PP-009): when overload detected → AI offers 3 options (smena qo'shish / order surish / boshqa stanokka); planner picks; if shift added → HR notified (E5 org-chart).
- Algorithm type class (EP-PP-086): system auto-computes route complexity (count of departments = 2..8) → "algoritm turi" tag on order; filter/stats.
- Core vs total time (EP-PP-111): "asosiy bosqich" (print) marked in route; asosiy vs umumiy times shown separately; bottleneck stage identified.
- AI delay Pareto (EP-PP-136): monthly CRON → AI groups reason codes → Pareto report (most frequent delay cause); direct to owner dashboard.
- Excel export (EP-PP-129): plan exportable to Excel (Bandlik / ketgan kun column structure); transition-period compatibility.
- Owner dashboard (EP-PP-134): single clean screen: vaqtida % / kechikyapti soni / bottleneck stanok / bugungi chiqim vs reja / ZARUR buyurtmalar / AI Pareto top-3. Non-technical language. Feeds Director module.
- Bandlik dashboard (EP-PP-120): per-department/machine load % + queue count + free slots (rangli: yashil/sariq/qizil).
- Code dictionary (EP-PP-109): master-data table for KT/PT/E/GL prefixes → UI shows editable table; **owner fills meanings later**; placeholder text "Ma'no kiritilmagan".

**BE:** AI planning service (7-step orchestration, Gemini API via A8 config); TOC service; Pareto CRON; export service (xlsx); owner dashboard aggregation service; Result<T>.
**FE:** AI planning panel (step-by-step progress, E3); Bandlik dashboard (DashboardPage template); owner dashboard (DashboardPage, simplified); code dictionary admin page; Excel export button.

**Verify:** AI 7-step produces a plan with DB records; planner confirms → order status changes; owner dashboard shows live figures; Excel export downloads valid file; Pareto CRON runs and saves result.

═══════════════════════════════════════════════════════════════
## DoD — per phase, ALL 7 conditions (ERP-SIFAT-STANDARTLARI)

1. **BE real:** CRUD + Result<T> + Zod + real DB (no stubs; unimplemented = honest 501)
2. **FE real:** EP Linear Soft template + tokens; loading/error states; data persists on reload (Q-43 round-trip)
3. **Docs:** inline comments on complex logic; DDL migrations with `APPROVED:` comment
4. **Tests:** BE unit tests for service logic; FE smoke test per page
5. **i18n:** all labels UZ + RU (no hardcoded Uzbek/Russian strings in TSX)
6. **Edge cases:** empty list, no machine available, material shortage, lab blocked, frozen zone, duplicate order
7. **Automation:** each operation logs its **EP-PP-### op-code** in audit log; AI events/CRONs wired (not stub)

═══════════════════════════════════════════════════════════════
## RAILS (apply every phase without exception)

| Rail | Rule |
|------|------|
| Permission gate | Check/add `@Roles`/`@UseGuards` before writing any code (F1, B6) |
| Verify-don't-trust | Live-probe every existing endpoint before assuming it works (C2) |
| Separate commit | One commit per phase; `git add <exact-file>` only (I6) |
| No regression | tsc 0 + previously working endpoints still return 200 (C5) |
| No rewrite | Fix and connect existing code; do not rebuild from scratch (C6) |
| Honest 501 | Unimplemented = `HttpStatus.NOT_IMPLEMENTED`; never `{ok:true}` fake (C3) |
| DDL = owner approval | STOP and ask owner before any `CREATE TABLE` / new column migration (H4/Q-35) |
| Report in Uzbek | After each phase: list what was done, what was deferred, commit hashes (I4) |
| Canonical tables | sales_orders / warehouse_stock / entries — no duplicates (H1-H3) |
| E1 (AI negative) | Any AI-driven penalty/block requires confirm dialog — never auto-apply (E1) |

═══════════════════════════════════════════════════════════════
## STOP POINTS (ask owner, do not proceed without "continue")

1. **After Phase 0 RE-AUDIT** — before writing any code. Show gap table.
2. **Before any DDL / new migration** — show exact SQL, get `APPROVED:` from owner (Q-35).
3. **Before touching `work_centers` schema** (CRP-503 / efficiency_rate fix) — confirm with owner.
4. **Before changing canonical table structure** (`sales_orders`, `warehouse_stock`, `entries`) — mandatory owner approval.
5. **After each phase (1 through 6)** — show what was built, what is deferred, commit hash; wait for "davom" before next phase.
6. **EP-PP-109 code dictionary** — owner must input KT/PT/E/GL meanings before populating; do not hardcode guesses.
