# DIRECTIVE — VISION-BUILD · MODULE: PP / AI PRODUCTION PLANNING (deep 2nd pass)

> **Advisor (Claude) → Executor (Muslimbek).** 2026-06-18. English; report in Uzbek.
> ⭐ **OWNER PIVOT (2026-06-18):** the design-cleanup phase is OVER as a separate track — **WE BUILD THE VISION NOW**,
> and **fold EP design standardization INTO each page as we build it** (no standalone cosmetic pass). Owner also
> ordered: **stop wasting tokens** — advisor verifies cheaply inline (NO subagent fleets); Muslimbek self-verifies
> as the primary gate.
>
> **Owner picked PP as the first vision module** = "AI ishlab chiqarish reja" (the AI 7-step planner — the vision
> centerpiece: AI auto-plans every order: material→reserve→route→time→schedule→shift→assign).
>
> **This directive WORKS WITH the existing spec — do NOT reinvent:**
> - `docs/audit/MUSLIMBEK-PROMT-05-PP-2026-06-08.md` — the full 6-phase PP build spec (Phase 0 re-audit already done; Phases 1-6 are the build). **READ IT — it has the EP-PP-### code map per phase.**
> - `docs/audit/decisions/07-pp.md` — 136 decisions (EP-PP-001..136).
> - `docs/audit/VISION-1000-SAVOL-JAVOB-2026-06-08.md` → PP section — implementation-detail answers.
> - `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` — the AI 7-step model + gofra 3-formula + routing flekso→ofset→kashirovka→tigel→qadoq.
> - `docs/PP-RE-AUDIT-2026-06-17.md` — what's already built (don't rebuild).
> This file = the BUILD-NOW wrapper: current-state delta + phase sequencing + the design-fold-in standard + the
> cheap-verify cadence + DDL watch-list. Combined with #05 + the 1000-Q&A, the spec Muslimbek reads is exhaustive.

---

## §0 — ROLE, MODE, SCOPE

- **You are the 🟢 EXECUTOR.** Read `CLAUDE.md` + `docs/agent-constitution.md` + the source docs above first.
- **Mode = MASSIVE single-agent, autonomous, self-verify-is-the-gate.** ONE executor (Qoida 23 — no fleet). Run
  Phases 1→6 in order; report per PHASE (not per file); 2 rails only: (1) **DDL shown before running** (owner "ha"),
  (2) **advisor reviews each phase live** (read-only, cheap). All other per-step "continue" gates dropped.
- **Module = PP (Production Planning).** Canonical table = `production_orders` (NOT papka_orders=messaging, NOT
  pp_production_orders). It is the golden-thread core: SD→**PP**→MES→QC→WMS→FIN.
- **Goal of this module = the AI 7-step planner working end-to-end** (Phase 6), standing on Phases 1-5
  (tech-cards, machines/CRP, MRP, order-lifecycle/shift, plan-fact). The AI is the centerpiece; 1-5 are its inputs.
- **Working dir:** `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module`. BE = `apps/api/src`. FE = `artifacts/erp-dashboard/src`.

---

## §1 — RULES BLOCK (binding every phase)

### 1.1 — Code rules (CLAUDE.md)
- Zod (NOT class-validator) · Drizzle ORM (raw SQL only for complex joins, parametrized — never `sql.raw(variable)`)
  · Result<T> (no throw/null) · file ≤900 / function ≤150 lines · magic numbers → `business.constants.ts` ·
  controller = transport only (logic in service, service → repo, never `db.*` in service) · `@UseGuards`/`@Public`
  on every controller · `ConfigService` for env.

### 1.2 — No-fake / honest-501 (C3/Q-40/Qoida 10,17)
- Every endpoint does a REAL DB INSERT/UPDATE. `{ok:true}` / echo / `[] as unknown` = BANNED. Unimplemented →
  honest `HttpStatus.NOT_IMPLEMENTED` (501). ⭐ "Works ≠ correct" — the truth measure is the VISION (`docs/audit/`),
  not "returns 200". A green-but-wrong calc (fake price, hardcoded plan) = a bug.

### 1.3 — Q-46 DELETE-NOTHING / broken-fully-deleted
- Working code is NEVER deleted (no "cleanup" removal of working stats/buttons/features). Broken/dead/fake code is
  deleted FULLY or fixed — never left half. In a BUILD pass you mostly ADD; if you must remove, prove it's
  broken (Q-29) + unimported (Q-39), else leave it and report.

### 1.4 — C6 no-rewrite (PP is ~70% built)
- FIX & CONNECT existing PP code — do NOT rebuild services from scratch. The CQRS/DDD scheduling, CRP/MRP/BOM
  engines, and the 10 PP controllers EXIST. Extend them; wire the deferred features onto them.

### 1.5 — Canonical tables (H1-H3) — no two-world duplication
- orders = `sales_orders` (sd_sales_orders=VIEW) · production = `production_orders` (papka_orders=messaging) ·
  stock = `warehouse_stock` (current_stock=VIEW) · GL = `entries`. ⛔ NEVER touch `gl_journal_entries`/`gl_lines`
  (SAP#76) or payroll-closure/GL-posting logic.

### 1.6 — DDL = owner approval (H4/Q-35)
- New `CREATE TABLE` / column / index ONLY with owner `APPROVED:`. STOP, show the exact SQL, wait for "ha".
  PP build WILL need DDL (tech_cards, machine cards, MRP, shift_plan, plan_fact tables likely don't exist) — batch
  the DDL per phase, show it, get approval, then build. Additive only (no destructive ALTER on live data).

### 1.7 — 6 cross-cutting principles (E1-E6) — MANDATORY
- **E1.** AI observes → human CONFIRMS any negative effect (auto-penalty/block = BANNED; confirm dialog). The AI
  PROPOSES the plan; the planner approves. AI norm-revision/raskroy = suggestion, texnolog confirms.
- **E2.** Card-centric: operator assignment reads razryad/skill from the card; mismatch = WARNING not block.
- **E3.** AI plans orders: the 7-step (§11). AI proposes full plan, planner 1-click confirms.
- **E4.** Operator IoT-tablet = floor hub (start/stop, brak, checklist) — PP feeds it shift plans.
- **E5.** Org-chart routing: approvals/notifications travel vertically (operator→smena→bo'lim→dept→CEO→Owner).
- **E6.** One truth: A-System/Excel replaced; no parallel worlds.

### 1.8 — Design folds in (the pivot) — EP standard on EVERY PP page you touch/create (§3)

### 1.9 — Commit per phase, exact files (`git add <file>` — never `-A`); report Uzbek per phase. Logs never committed (Q-45).

---

## §2 — CURRENT STATE (from re-audit + #03/#05 sweep — do NOT rebuild these)

**Already built + wired (verified in the 1st pass):**
- PP CQRS/DDD structure, 10 controllers live (401 guarded).
- Scheduling engines: Johnson / network / capacity. CRP / MRP / BOM modules present.
- ⭐ **CRP-503 already fixed** — `work_centers.efficiency_rate` EXISTS (the #05 Phase-2 assumption is stale; verify then skip the migration).
- Golden-thread inbound listeners wired: Design/Lab/Advance/Mro/Wms → PP.
- ⭐ **CORE create-crash already fixed** (commit b1f2d238): production-order insert threads `product_id` + `sales_order_id` + `planned_quantity`; `savePo` branches id>0→UPDATE (no duplicate rows). `production_orders.status` widened varchar(50) (commit bbe360b0). So **PP can now create + release an order** (the golden-thread PP blocker is gone).
- Canonical = `production_orders`. ⚠️ **All PP tables are EMPTY + `products` is EMPTY** (build phase — no data to migrate; this is a build, not a migration).

**Deferred to THIS build (the deep vision — Phases 1-6 of #05):**
- Phase 1: Tech-card (texkarta) master-data + 6 elements + BOM + route/marshrut + versioning + lab/die/maket gates.
- Phase 2: Machine (stanok) master-data + seed 22+ machines (Bandlik.xlsx) + machine-format matching + labor-constrained CRP.
- Phase 3: MRP shortage check vs `warehouse_stock` + auto purchase-request + reservation + reorder points + ATP.
- Phase 4: Production-order 7-status lifecycle (EP-PP-082) + shift planning + priority + queue + frozen-zone + manager notify.
- Phase 5: Plan-fact (4-number shift entry: reja/fakt/qolgan/brak) + 5 reason-code groups + brak→rework + operator norm%.
- Phase 6: ⭐ AI 7-step planner + TOC bottleneck + raskroy optimization + Pareto + owner dashboard (THE centerpiece).

**Phase-0 re-audit is DONE** (`docs/PP-RE-AUDIT-2026-06-17.md`) — do NOT repeat it; just re-confirm a table's existence with `_audit/q.cjs` right before you build on it (Q-29 cheap check), then build.

---

## §3 — DESIGN FOLDS IN: EP STANDARD ON EVERY PP PAGE (the pivot)

As you build/touch each PP page, apply the EP standard (same one proven on Finance). This replaces the separate
design phase. PP module color = **`--mod-pp`** (production green, `#2E8A5A`).

- **Page root = `space-y-6`** (NEVER `p-5`/`h-full`/`overflow-auto` — the shell `AppShellModern.tsx:180` already
  pads `p-4 lg:p-6` + scrolls. A full-height board page may use `flex flex-col h-full gap-5` with NO own padding.)
- **Header = `<EPPageHeader title subtitle actions />`** (import from `@/components/ep`). No bespoke `text-3xl/4xl`
  page titles, no gradient strips.
- **KPI tiles = `<EPKpiCard label value|staticValue icon iconBg="pp" />`** (count-up; `iconBg="pp"` = production green).
- **Status = `<EPStatusPill tone=...>`** — map the 7 PP statuses: Reja→`neutral`, Tasdiqlangan→`info`, Ishga
  tushgan→`brand`, Jarayonda→`brand`, Sifatda→`warning`, Tugadi→`success`, Yopildi→`success` (muted), Bekor→`danger`,
  To'xtatilgan→`warning`. NO raw `<Badge className="bg-*-500">`.
- **Surfaces = `<EPCard>`** (tables: `<EPCard padding={0}>`). **States** = `EPErrorState`/`EPEmptyState`/`EPSkeleton*`.
- **Tokens only** — no inline `#hex`, no Tailwind palette numbers (`bg-green-500`). Capacity Gantt colors
  (EP-PP-005 yashil=bo'sh/qizil=to'la) → `var(--ep-green)`/`var(--ep-yellow)`/`var(--ep-red)`.
- **Templates:** ListPage / FormPage / DetailPage / DashboardPage / BoardPage (Kanban). Tab depth ≤2 (Q-42).
- **i18n:** UZ + RU, no hardcoded strings; ru → Yandex pipeline (don't hand-write ru).
- **Grep gate before "phase done":** `grep <Page>*.tsx` (page + co-located `*Sections/*Tabs/*Dialogs/*Cards/*Charts`)
  = 0 inline hex / 0 palette numbers, EPPageHeader present. (Co-located files count — Finance lesson.)

---

## §4 — PHASE 1: TECH CARD (TEXKARTA) MASTER-DATA + CRUD
**Spec:** #05 Phase 1 (EP-PP-012/013/014/032..040/037/087..090/094/116/122). Read it for the code-level detail.

**Current state:** check `tech_cards`/`pp_tech_cards`/`ow_tech_cards` existence (`_audit/q.cjs`). #05 notes `technology/cards generate+optimize` = honest 501 (not built). Likely needs DDL for the tech-card table + BOM + route.

**Build:**
- Tech card = 6 elements (material turi / bosma parametrlari [rang soni+profil+registr+plotnost] / kesim / qolip /
  qo'shimcha ishlovlar / ish tartibi) — structured columns or JSONB.
- BOM (EP-PP-089): material code + qty (kg/list) + layer (2-sloy/profil/mikro) — MRP reads this.
- Route/marshrut (EP-PP-032): 10-step ops (10,20,30…); per-op machine bind + alternative (EP-PP-033) + norm
  (dona/soat, EP-PP-034) + setup time per color (EP-PP-035) + scrap norm fixed+% (EP-PP-036).
- Direction master (EP-PP-087): ofs-kar / ofs-gof / flx-gof; kashirovka auto-added for ofs-gof (EP-PP-088);
  post-press checkboxes (begovka/tisnenie/kongrev/oynakcha/laminat/lak/vib-lak, EP-PP-122).
- Format/profile master (EP-PP-116): gofra E/B/C mikro/2-sloy/5-sloy + format 105/72; raskroy "N dona per list"
  → auto list-count (tiraj ÷ N + scrap reserve, EP-PP-094).
- Versioning (EP-PP-014/037): every change = new version (draft/approved/archived) + history.
- Gates: lab "Одобрена" (EP-PP-091) · die/qolip status (EP-PP-115) · maket-approved (EP-PP-123) · plan-start = 3
  AND conditions (maket+techcard/lab+material, EP-PP-124). Operator skill req per op (EP-PP-038, E2 warning).

**BE:** tech-card repo/service/controller; Drizzle schema (DDL → owner approval); Result<T>; Zod.
**FE (EP §3):** FormPage; 6 elements editable; version-history tab; lab-approval button (E5); 3 gate traffic-lights
(maket/techcard/material); `<EPPageHeader title="Texnologik kartalar" />`, root `space-y-6`.
**DDL watch:** tech_cards + tech_card_bom + tech_card_routes (+ versions) — show SQL, owner-approve.
**Verify (cheap):** create tech card → save → reload persists (DB-proof); lab-approval flips status in DB; gate
badges update. tsc 0. golden-thread harness still exit 0. login 200/422.
**Acceptance:** tech card CRUD real + versioned + 3 gates enforced; EP design clean (grep 0 hex/palette).

---

## §5 — PHASE 2: MACHINE (STANOK) MASTER-DATA + CRP
**Spec:** #05 Phase 2 (EP-PP-046..052/121/132).

**Current state:** ⭐ CRP-503 ALREADY fixed (`work_centers.efficiency_rate` exists — confirm with q.cjs, then SKIP
that migration). Check `machines`/`pp_machine_cards`/`work_centers` for a stanok master.

**Build:**
- Machine card (EP-PP-046/121): code/name/type(flexo/offset/post-press)/format-limit(EP-PP-050)/capacity-unit/
  work-calendar(smena·soat)/planned-downtime/PM-schedule/efficiency_rate.
- Seed 22+ machines (Bandlik.xlsx, EP-PP-121): Flexo gofra/pechat/tigel, Gofra mikro, Bosma SM 72/52, Laminatsiya,
  Laklash, Koshirofka, GTO, Begovka, Tisnenie, Kongrev, Avto Kley, Qadoqlash, Oynakcha… — idempotent seed script.
- Machine group (EP-PP-052): least-busy auto-assign. Machine-format matching (EP-PP-117): 105/72 → SM 72/52
  filter. Labor-constrained CRP (EP-PP-132): CRP checks machine capacity AND operator availability (post-press: 1
  operator runs N machines → constraint is operators).
- CRP uses efficiency_rate from real MES facts (EP-PP-051).

**BE:** machine repo/service/controller; CRP service reads efficiency_rate (already fixed). No DDL if efficiency_rate
exists; machine-master table may need DDL (owner-approve).
**FE (EP §3):** ListPage + DetailPage machines; capacity Gantt (token colors yashil/sariq/qizil); format-filter.
**Verify (cheap):** `/api/pp/crp` returns 200 (confirm not 503); machine CRUD round-trip; CRP shows per-machine
load %. harness exit 0.
**Acceptance:** machine master real + seeded; CRP live + labor-constrained; EP clean.

---

## §6 — PHASE 3: MRP (MATERIAL REQUIREMENTS PLANNING)
**Spec:** #05 Phase 3 (EP-PP-006/007/064..071).

**Build:**
- MRP shortage check (EP-PP-006): on plan create, compute BOM × tiraj + scrap vs `warehouse_stock` (canonical) →
  shortage → red alert "X material, Y kg missing, Z days lead".
- Shortage response (EP-PP-007): auto purchase-request to MM/Xarid (event/outbox `pp.mrp.purchaseRequest`) + order
  SHIFTED to "material kutilmoqda" ("keyin keladi" BANNED by book).
- Reorder point per material (EP-PP-064) + lead-time types uzoq/tez (EP-PP-065). ATP check on SD create (EP-PP-066,
  oltin-ip SD↔PP). Reservation/allocation (EP-PP-068): free = total − reserved. WIP/zagotovka (EP-PP-069).
  Lot/FEFO (EP-PP-070). Dynamic reorder CRON (EP-PP-071). Profile mismatch detect (EP-PP-116).

**BE:** MRP service reads BOM(tech-card) + stock(`warehouse_stock`); creates MM purchase-requests via event/outbox;
reservation in DB; parametrized SQL; Result<T>. ⚠️ Don't touch WMS issue logic — read warehouse_stock only.
**FE (EP §3):** MRP panel on order detail; shortage list + purchase-request status; ATP indicator on SD order form.
**DDL watch:** mrp_reservations / reorder_points if absent — owner-approve.
**Verify (cheap):** order with insufficient material → shortage alert; purchase-request row created (DB-proof); ATP
on SD shows correct date. harness exit 0.
**Acceptance:** MRP real against warehouse_stock; reservation prevents double-allocation; ATP wired to SD.

---

## §7 — PHASE 4: PRODUCTION-ORDER 7-STATUS LIFECYCLE + SHIFT PLANNING
**Spec:** #05 Phase 4 (EP-PP-082 [7-status] + 010/021/025/030/060..063/072..085/097..108/118/119).

**Build (highlights):**
- 7-status lifecycle (EP-PP-082, owner override): Reja→Tasdiqlangan→Ishga tushgan→Jarayonda→Sifatda→Tugadi→Yopildi
  (+Bekor/To'xtatilgan); EVERY transition logged (who/when/reason). Status machine on `production_orders` (status
  col already varchar(50) — fits).
- Papka № auto (EP-PP-103, 2024-0499). Multi-line orders (EP-PP-118): positions, each own route/tiraj; complete =
  all positions complete. Part-set gate (EP-PP-105). Priority 4-level + ZARUR zone (EP-PP-010/097); priority change
  = boss+director + written reason (EP-PP-060). No preemption (EP-PP-061 — running job always finishes).
- Shift plan (EP-PP-072/073): smena × stanok × buyurtma × ishchi (operator+helper); ден/ноч template (EP-PP-107).
  Queue position per machine + drag-drop (EP-PP-085). Worker substitution (EP-PP-076). Shift handover (EP-PP-077).
  Overtime + rahbar approval (EP-PP-078). Shift dashboard (EP-PP-079: norma%/brak%/prostoy/dona/worst-machine).
- Frozen window ~3 days (EP-PP-025, owner; unlock = owner/director only). Daily re-plan CRON (EP-PP-080). Cancel/
  pause = loss + reason, WIP→stock (EP-PP-083). Waiting zone with reason (EP-PP-101). 3-timer auto (EP-PP-100).
  Manager Telegram notify on readiness/delay (EP-PP-098, E5). Readiness % (EP-PP-099). Repeat order (EP-PP-104).

**BE:** order repo/service/controller; status machine + audit log; shift-plan service; priority ranking; CRON
(daily re-plan + dynamic reorder); outbox → manager Telegram; Result<T>.
**FE (EP §3):** **BoardPage** (Kanban by 7-status, root `flex flex-col h-full gap-5` no padding) + ListPage (Papka №);
order-detail tabs (≤2 levels): Marshrut / Shift-reja / MRP / Brak / Tarix; shift Gantt (per machine/day, ден/ноч);
drag-drop queue; ZARUR zone; frozen badge; 3-timer; statuses → `EPStatusPill` (§3 mapping).
**DDL watch:** order_status_log / shift_plans / shift_slots / shift_handovers (some may exist — check) — owner-approve.
**Verify (cheap):** status transitions persist + logged; frozen zone blocks edit; manager Telegram fires on delay
(or outbox row written); shift plan saves + reloads. harness exit 0.
**Acceptance:** 7-status lifecycle real + audited; shift plan real; priority/frozen/queue enforced; EP clean.

---

## §8 — PHASE 5: PLAN-FACT + OPERATOR 4-NUMBER ENTRY
**Spec:** #05 Phase 5 (EP-PP-023/053..057/091..093/110/127/128/135).

**Build:**
- Shift-close 4-number entry (EP-PP-092): reja/fakt/qolgan/brak (by usta or auto from MES); izoh mandatory if
  fakt<reja. 5 reason-code groups (EP-PP-055, book EXACT): material yo'qligi / dastgoh buzilishi / kadr yetishmasligi
  / texnologik xato / reja noto'g'ri (+boshqa). Unclosed-without-reason = "bajarilmagan".
- Plan-fact compare (EP-PP-023/053): 4 dims (buyurtma/stanok/smena/ishchi) × 4 metrics (miqdor/vaqt/muddat/tannarx).
  Threshold alert (EP-PP-056). Brak→rework task (EP-PP-093): shortfall = order_qty−(fakt−brak); >0 → auto rework
  task + material re-request. Operator norm% auto (EP-PP-127): fakt÷norma daily+monthly → HR payroll; idle (no plan)
  does NOT count against KPI (EP-PP-128, E1 fairness). Weekly/monthly views (EP-PP-110). Norm auto-calibrate
  (EP-PP-135): deviation>X% → recommend revision (texnolog confirms, NOT auto — E1). Lab gate (EP-PP-091).

**BE:** plan-fact service; reason-code master (5 groups seeded); brak→rework (event/outbox); norm-calibration
suggestion (not auto); Result<T>. ⚠️ HR payroll link = READ/feed only; don't touch payroll-closure/GL (rail).
**FE (EP §3):** shift-close form (4 numbers + reason dropdown); plan-fact DashboardPage (drill order→machine→shift→
worker); threshold config (admin); brak counter + rework status; operator KPI card (norm%, idle separated).
**DDL watch:** plan_fact / shift_close_entries / reason_codes if absent — owner-approve.
**Verify (cheap):** 4-number entry → plan-fact updates; brak>0 → rework row; operator KPI separates idle vs slow;
reason mandatory enforced. harness exit 0.
**Acceptance:** plan-fact real 4×4; brak→rework wired; norm% fair (idle excluded); EP clean.

---

## §9 — PHASE 6: ⭐ AI 7-STEP PLANNER + OWNER DASHBOARD (THE CENTERPIECE)
**Spec:** #05 Phase 6 (EP-PP-003/009/024/031/086/095/096/106/109/111/120/129/130/131/134/136) + §11 below + CHAT-TARIXI 7-step.

**Build:**
- **AI 7-step planner (E3) — see §11 for the exact 7 steps.** AI proposes the FULL plan; planner 1-click confirms
  (E3 — AI proposes, human confirms). Each AI suggestion shows its REASON (EP-PP-031: "2-stanok bo'sh va format mos"
  — not a black box).
- AI fill-next-shift (EP-PP-130): optimal smena fill = ZARUR first + rang-guruh (priladka saving) + material-
  available + bottleneck-full. Planner 1-click approve/edit.
- TOC bottleneck (EP-PP-131): AI auto-identifies the most-loaded machine, plans around it (owner's real bottleneck
  = 90m flexo gofra line). Core-vs-total time (EP-PP-111: asosiy=print stage marked).
- AI raskroy optimization (EP-PP-095): suggests optimal format (size×list×dona×foyda kg); texnolog confirms (E1).
  Small-order warning (EP-PP-096): below min tiraj/size → "kichik buyurtma" + profit dona/kg.
- Historical-fact ATP (EP-PP-106): repeat product → read past actual times → suggest ATP. CRP overload resolve
  (EP-PP-009): AI offers 3 options (smena qo'shish / surish / boshqa stanok); planner picks; shift-add → HR notify.
- AI delay Pareto CRON (EP-PP-136): monthly → group reason codes → Pareto → owner dashboard. Excel export
  (EP-PP-129, Bandlik structure). Algorithm-type tag (EP-PP-086: dept count 2..8).
- **Owner dashboard (EP-PP-134):** ONE clean screen, non-technical language: vaqtida % / kechikyapti soni /
  bottleneck stanok / bugungi chiqim vs reja / ZARUR buyurtmalar / AI Pareto top-3. Feeds Director module.
  Bandlik dashboard (EP-PP-120: per-machine load% + queue + free slots, token colors). Code dictionary (EP-PP-109):
  editable KT/PT/E/GL master-data table; owner fills meanings later; placeholder "Ma'no kiritilmagan" — NO hardcode.

**BE:** AI planning service (7-step orchestration; LLM via ConfigService key — never print the key, Q-30); TOC
service; Pareto CRON; xlsx export; owner-dashboard aggregation; Result<T>.
**FE (EP §3):** AI planning panel (step-by-step progress with reasons, E3); Bandlik DashboardPage; **owner
DashboardPage** (simplified, the money screen); code-dictionary admin page; Excel export button. Aisha-futuristic
is a SEPARATE module (Q-41) — PP uses standard EP, NOT the Aisha look.
**Verify (cheap):** AI 7-step produces a plan with real DB records (not hardcoded — Q-40); planner confirm → order
status changes; owner dashboard shows LIVE figures (DB-proof, not zeros); Excel downloads valid; Pareto CRON saves.
harness exit 0.
**Acceptance:** the AI actually plans a real order end-to-end (material→…→assign) with explained suggestions, human
confirms, DB records written; owner dashboard live; EP clean. ⭐ This is the module's success criterion.

---

## §10 — CADENCE, VERIFY, DoD, STOP-POINTS

### 10.1 — Cheap-verify cadence (owner's anti-waste order)
- **Muslimbek self-verifies each phase** (primary gate): tsc 0 + DB-proof of the new feature (`_audit/q.cjs`) + FE
  round-trip (create→save→reload) + golden-thread harness `node scripts/golden-thread-chain-proof.cjs` exit 0 +
  login 200/422 + `grep <Page>*.tsx` design-clean. Report per phase in Uzbek (done/deferred/commit hashes).
- **Advisor verifies cheaply inline** (read-only, NO subagent fleets): read the key diff + run the harness + a DB
  spot-check + grep design. Deep adversarial workflow ONLY if a phase touches money/GL/auth/stock posting (it
  shouldn't — PP reads warehouse_stock, feeds MM/HR via events, never posts GL).

### 10.2 — DoD per phase (all 7)
1. BE real (CRUD + Result<T> + Zod + real DB; unimplemented = 501). 2. FE real (EP §3 template + tokens + states +
reload-persist). 3. Docs (complex-logic comments; DDL with `APPROVED:`). 4. Tests (BE service unit + FE smoke).
5. i18n UZ+RU. 6. Edge cases (empty, no machine, shortage, lab-blocked, frozen, duplicate). 7. Each op logs its
EP-PP-### + AI events/CRONs wired (not stub).

### 10.3 — STOP points (only these gate you)
1. **Before ANY DDL** — show exact SQL, get owner `APPROVED:` (Q-35). Batch per phase.
2. **After each phase** — report; advisor reviews live (cheap) before next phase.
3. **EP-PP-109 code dictionary** — owner inputs KT/PT/E/GL meanings; no hardcode guesses.
Everything else = autonomous (massive mode).

---

## §11 — THE AI 7-STEP PLANNER (centerpiece detail — CHAT-TARIXI model + E3)

The owner's core vision: **a sales order arrives → the AI plans the entire production automatically**, the planner
just confirms. The 7 steps (each writes real DB state; each is explainable — EP-PP-031):

1. **Buyurtma (order intake):** read the `sales_orders` order + its product(s) → resolve the tech-card (route, BOM,
   norms). (Repeat product → pull historical actuals for ATP, EP-PP-106.)
2. **Material check (MRP):** BOM × tiraj + scrap vs `warehouse_stock` → enough? If short → shortage + auto
   purchase-request + order → "material kutilmoqda" (Phase 3). AI shows the exact shortage reason.
3. **Bron (reserve):** reserve the available material against this order (free = total − reserved, EP-PP-068) so two
   orders don't grab the same stock.
4. **Marshrut (route select):** pick the operation route + machine per op (direction ofs/flx-gof, format matching,
   alternative machine if primary busy). AI explains the machine choice ("format mos + bo'sh").
5. **Vaqt (time compute):** per-op duration = norm × tiraj + setup(per color) + material-prep + delivery (EP-PP-119).
   Sum → lead time. TOC: plan around the bottleneck (90m flexo gofra, EP-PP-131).
6. **Reja (schedule) + smena (shift fill):** place the ops into shift slots (ден/ноч), respecting frozen window
   (~3 days), priority (ZARUR first), no-preemption, rang-guruh batching (priladka saving, EP-PP-130). Queue
   positions per machine.
7. **Ijrochiga topshirish (assign):** assign operator+helper per slot from the CARD (razryad/skill match, E2;
   mismatch = warning). Push the shift plan to the operator IoT-tablet (E4). Manager linked for notifications (E5).

**The whole 7-step output = a proposed plan (DB rows in draft) + an explanation per step.** The planner reviews and
**1-click confirms** (E3) → order status Reja→Tasdiqlangan, slots committed. The AI NEVER auto-commits a negative
effect (E1): overload/penalty/norm-revision = suggestion + human confirm. If overload → AI offers 3 resolves
(EP-PP-009), planner picks.

**Build order within Phase 6:** wire steps 1-5 first (they reuse Phases 1-3 engines), then 6-7 (shift fill + assign
reuse Phase 4), then the explanation layer + owner dashboard + Pareto. The AI orchestration is a service that calls
the existing MRP/CRP/route/shift engines in sequence — NOT a from-scratch rebuild (C6).

---

## §12 — SEQUENCING (what to do first) + APPENDIX

**Order:** Phase 1 (tech-card — everything depends on it) → 2 (machines/CRP) → 3 (MRP) → 4 (lifecycle/shift) →
5 (plan-fact) → 6 (AI 7-step + owner dashboard). The AI (6) is the goal but is meaningless without 1-5 supplying
tech-cards, machines, material checks, order states, and norms. Build the foundation, then the brain.

**First action:** Phase 1. Re-confirm tech-card table existence (`_audit/q.cjs`), draft the tech-card + BOM + route
DDL, **show the owner the SQL (STOP for `APPROVED:`)**, then build Phase 1 BE+FE (EP §3), self-verify, commit,
report. Then advisor reviews → Phase 2.

**Command cheatsheet:**
```bash
cd /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
node _audit/q.cjs "SELECT to_regclass('public.tech_cards')"            # table exists?
node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='work_centers' AND column_name='efficiency_rate'"  # CRP-503 confirm
node scripts/golden-thread-chain-proof.cjs                              # spine intact (exit 0)
grep -nE "#[0-9a-fA-F]{6}|(bg|text|border)-(red|green|blue|amber|...)-[0-9]{3}" artifacts/erp-dashboard/src/pages/<PpPage>*.tsx   # design clean
git add <exact files> && git commit -m "feat(pp): <phase> — <what>, vision-build"
```

**Glossary:** EP-PP-### = the decision codes in `decisions/07-pp.md` (cite in audit log). `--mod-pp` = production
green. Canonical production table = `production_orders`. Texkarta = tech card. Marshrut = route. Smena = shift.
Reja/Fakt = plan/actual. ZARUR = urgent zone. Bron = reserve. Priladka = press setup (color batching saves it).

---

## §13 — DDL DRAFTS (per phase — PROPOSALS for owner approval; re-audit existence first)

⚠️ These are DRAFTS. Before each phase: `_audit/q.cjs "SELECT to_regclass('public.<table>')"` — if it EXISTS, do
NOT recreate (use it / ADD missing columns only). If absent, show the owner the exact SQL below (adjust to the
re-audit), get `APPROVED:`, then migrate. All additive, no destructive ALTER on live data. Money/qty = numeric;
ids = serial int (match `production_orders` int convention, NOT uuid — uuid-vs-int was the #03/#05/#07 crash family).

**Phase 1 — tech cards:**
```sql
-- APPROVED: <owner>
CREATE TABLE IF NOT EXISTS tech_cards (
  id serial PRIMARY KEY, code varchar(50) UNIQUE, product_id integer, name varchar(200) NOT NULL,
  direction varchar(20),            -- ofs-kar / ofs-gof / flx-gof (EP-PP-087)
  material_type varchar(50), print_params jsonb, kesim jsonb, qolip_id integer, post_press jsonb, ish_tartibi jsonb,
  format_code varchar(20), gofra_profile varchar(20), raskroy_per_list integer, scrap_pct numeric(5,2),
  version integer NOT NULL DEFAULT 1, status varchar(20) NOT NULL DEFAULT 'draft', -- draft/approved/archived
  lab_approved boolean DEFAULT false, lab_approved_by integer, lab_approved_at timestamptz,
  maket_approved boolean DEFAULT false, created_by integer, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tech_card_bom (
  id serial PRIMARY KEY, tech_card_id integer NOT NULL, material_code varchar(50) NOT NULL,
  quantity numeric(14,3) NOT NULL, unit varchar(10) NOT NULL DEFAULT 'kg', layer varchar(20), created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tech_card_routes (
  id serial PRIMARY KEY, tech_card_id integer NOT NULL, op_seq integer NOT NULL,         -- 10,20,30…
  operation varchar(100) NOT NULL, machine_id integer, alt_machine_id integer,
  norm_per_hour numeric(12,2), setup_minutes integer, scrap_fixed integer, scrap_pct numeric(5,2),
  min_razryad integer, is_core boolean DEFAULT false, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tech_card_versions (
  id serial PRIMARY KEY, tech_card_id integer NOT NULL, version integer NOT NULL, snapshot jsonb NOT NULL,
  changed_by integer, changed_at timestamptz DEFAULT now()
);
```

**Phase 2 — machines:** (CRP-503 `work_centers.efficiency_rate` already exists — DO NOT re-add)
```sql
-- APPROVED: <owner>
CREATE TABLE IF NOT EXISTS pp_machines (
  id serial PRIMARY KEY, code varchar(50) UNIQUE NOT NULL, name varchar(200) NOT NULL,
  type varchar(30) NOT NULL,         -- flexo / offset / post-press
  format_limit varchar(20), capacity_unit varchar(20), shifts_per_day integer DEFAULT 2, hours_per_shift integer DEFAULT 12,
  efficiency_rate numeric(5,2) DEFAULT 1.0, planned_downtime_pct numeric(5,2), pm_schedule jsonb,
  machine_group varchar(50), is_active boolean DEFAULT true, created_at timestamptz DEFAULT now()
);
```

**Phase 3 — MRP:**
```sql
-- APPROVED: <owner>
CREATE TABLE IF NOT EXISTS pp_material_reservations (
  id serial PRIMARY KEY, production_order_id integer NOT NULL, material_code varchar(50) NOT NULL,
  reserved_qty numeric(14,3) NOT NULL, unit varchar(10), status varchar(20) DEFAULT 'reserved', created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS pp_reorder_points (
  id serial PRIMARY KEY, material_code varchar(50) UNIQUE NOT NULL, reorder_point numeric(14,3), min_stock numeric(14,3),
  lead_time_days integer, lead_time_type varchar(10), updated_at timestamptz DEFAULT now()  -- uzoq/tez (EP-PP-065)
);
```

**Phase 4 — lifecycle + shift:**
```sql
-- APPROVED: <owner>
CREATE TABLE IF NOT EXISTS pp_order_status_log (
  id serial PRIMARY KEY, production_order_id integer NOT NULL, from_status varchar(50), to_status varchar(50) NOT NULL,
  changed_by integer, reason text, changed_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS pp_shift_plans (
  id serial PRIMARY KEY, plan_date date NOT NULL, shift varchar(10) NOT NULL,   -- den/noch (EP-PP-107)
  machine_id integer NOT NULL, production_order_id integer, operator_id integer, helper_id integer,
  queue_position integer, status varchar(20) DEFAULT 'planned', created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS pp_shift_handovers (
  id serial PRIMARY KEY, shift_plan_id integer, remaining_qty numeric(14,2), machine_state varchar(50), note text,
  handed_by integer, handed_at timestamptz DEFAULT now()
);
```
(⚠️ `shift_handovers` / `mes_shift_handovers` VIEW already exist for MES — check before creating; reuse if they fit.)

**Phase 5 — plan-fact:**
```sql
-- APPROVED: <owner>
CREATE TABLE IF NOT EXISTS pp_shift_close (
  id serial PRIMARY KEY, shift_plan_id integer NOT NULL, reja integer, fakt integer, qolgan integer, brak integer,
  reason_code varchar(50), izoh text, closed_by integer, closed_at timestamptz DEFAULT now()  -- reason mandatory if fakt<reja
);
CREATE TABLE IF NOT EXISTS pp_reason_codes (
  id serial PRIMARY KEY, code varchar(50) UNIQUE NOT NULL, group_name varchar(50) NOT NULL, label_uz varchar(200), label_ru varchar(200)
);  -- seed 5 groups: material yo'qligi / dastgoh buzilishi / kadr yetishmasligi / texnologik xato / reja noto'g'ri
```

**Phase 6 — AI/dashboard:**
```sql
-- APPROVED: <owner>
CREATE TABLE IF NOT EXISTS pp_code_dictionary (         -- EP-PP-109, owner fills meanings later
  id serial PRIMARY KEY, prefix varchar(10) NOT NULL, code varchar(50), meaning_uz varchar(200) DEFAULT 'Ma''no kiritilmagan', meaning_ru varchar(200)
);
CREATE TABLE IF NOT EXISTS pp_pareto_reports (
  id serial PRIMARY KEY, period_month date NOT NULL, reason_code varchar(50), count integer, pct numeric(5,2), generated_at timestamptz DEFAULT now()
);
```
(AI plan proposals can live as draft rows in `production_orders` + `pp_shift_plans` with status='draft' — no new table needed; or a `pp_ai_plan_proposals` snapshot table if you prefer reviewable history — owner choice.)

---

## §14 — PER-PHASE PP PAGES + EP TREATMENT (design folds in — §3)

Every page below: root `space-y-6` (or BoardPage `flex flex-col h-full gap-5`), `EPPageHeader`, `--mod-pp` accent,
`EPKpiCard`/`EPStatusPill`/`EPCard`, 0 hex/0 palette, UZ+RU. Check co-located `*Sections/*Tabs/*Dialogs/*Charts`.

| Phase | Page(s) | Template | EP treatment |
|---|---|---|---|
| 1 | TechCard list + TechCard form/detail + version-history tab | ListPage + FormPage + DetailPage | header; 3 gate traffic-lights as `EPStatusPill`; version tab (≤2 levels) |
| 2 | Machines list + Machine detail + Capacity Gantt | ListPage + DetailPage + DashboardPage | Gantt colors = `var(--ep-green/yellow/red)`; load% `EPKpiCard iconBg="pp"` |
| 3 | MRP panel (on order detail) + Shortage list + ATP indicator (on SD form) | embedded sections | shortage = `EPStatusPill tone="danger"`; ATP = pill on SD form |
| 4 | Production-order **BoardPage** (Kanban by 7-status) + order ListPage + order-detail tabs (Marshrut/Shift/MRP/Brak/Tarix) + shift Gantt | BoardPage + ListPage + DetailPage | 7 statuses → pill (§3 map); frozen badge; 3-timer; ZARUR zone card; drag-drop queue |
| 5 | Shift-close form (4 numbers + reason) + Plan-fact DashboardPage + operator KPI card | FormPage + DashboardPage | brak counter; KPI `EPKpiCard` (norm%, idle separated); threshold config (admin) |
| 6 | AI planning panel (7-step progress) + Bandlik DashboardPage + **Owner DashboardPage** + code-dictionary admin | DashboardPage ×3 + admin table | AI step reasons in `EPCard`; owner dashboard = clean `EPKpiCard` row (vaqtida%/kechikish/bottleneck/chiqim/ZARUR/Pareto) |

**Sidebar:** PP entries must match canonical `constants.ts`; `check-sidebar-routes.mjs` stays green; add pages via
`EPComingSoon` wrapper FIRST if a route is registered before the page is ready (Qoida 20). No new design system.

---

## §15 — EDGE-CASE CATALOG (DoD condition 6 — handle these per phase)

- **Phase 1:** tech card with no BOM (block plan); unapproved maket (waiting state); missing qolip (qolip kutilmoqda);
  operator below min razryad (warning, not block — E2); duplicate code (reject); version rollback.
- **Phase 2:** no machine of required type (CRP infeasible → alert); machine in PM/downtime (excluded from schedule);
  format mismatch (filtered out); all machines in group busy (queue).
- **Phase 3:** material shortage (red + purchase-request, order→material kutilmoqda); partial stock (reserve what's
  there + request rest); profile mismatch 5-layer vs 3-layer (error, EP-PP-116); expired batch (blocked, FEFO).
- **Phase 4:** frozen-zone edit attempt (blocked unless owner/director); priority change without reason (rejected,
  EP-PP-060); preemption attempt (rejected — running job finishes, EP-PP-061); multi-line order partial complete
  (order not complete until all positions); part-set incomplete (packing blocked, EP-PP-105); duplicate Papka №.
- **Phase 5:** shift close with fakt<reja and no reason (rejected — counted bajarilmagan); brak>fakt (validation);
  idle slot (excluded from operator KPI — E1 fairness); norm deviation>threshold (suggest revision, texnolog
  confirms — not auto).
- **Phase 6:** AI overload (offer 3 resolves, planner picks — EP-PP-009); AI suggestion rejected by planner (no
  commit); small order below min tiraj (warning + profit shown); LLM unavailable (graceful — show inputs, let
  planner plan manually; never fake a plan — Q-40); code-dictionary meaning empty (placeholder, no hardcode).

---

## §16 — PER-PHASE ACCEPTANCE CHECKLIST (Muslimbek ticks; advisor spot-checks cheaply)

**Phase 1 — Tech card:**
- [ ] tech_cards + bom + routes + versions tables (DDL owner-approved) OR existing reused
- [ ] CRUD real (create→save→reload persists, DB-proof); 6 elements editable; BOM + 10-step route
- [ ] versioning real (new version on change; history tab); 3 gates (maket/lab/material) enforce plan-start
- [ ] EP §3 clean (grep 0 hex/palette; EPPageHeader; `--mod-pp`); UZ+RU; tsc 0; harness exit 0; login 200/422

**Phase 2 — Machines/CRP:**
- [ ] `work_centers.efficiency_rate` confirmed exists (CRP-503 skip); pp_machines (or existing) real CRUD
- [ ] 22+ machines seeded (idempotent); machine-group least-busy; format matching filters
- [ ] `/api/pp/crp` returns 200 + per-machine load%; labor-constrained (operator availability checked)
- [ ] EP §3 clean (capacity Gantt token colors); tsc 0; harness exit 0

**Phase 3 — MRP:**
- [ ] shortage check vs warehouse_stock real; shortage → auto purchase-request row (DB-proof) + order→material kutilmoqda
- [ ] reservation prevents double-allocation (free = total−reserved); ATP wired to SD order form
- [ ] EP §3 clean; tsc 0; harness exit 0; WMS issue logic untouched

**Phase 4 — Lifecycle/shift:**
- [ ] 7-status machine on production_orders + status_log (every transition who/when/reason)
- [ ] shift_plans real (smena×stanok×order×operator+helper); queue + drag-drop; frozen-zone blocks edit
- [ ] priority/ZARUR/no-preemption enforced; manager Telegram (or outbox row) on delay; 3-timer; readiness%
- [ ] BoardPage Kanban (7-status pills §3); EP §3 clean; tsc 0; harness exit 0

**Phase 5 — Plan-fact:**
- [ ] 4-number shift-close (reja/fakt/qolgan/brak) real; reason mandatory if fakt<reja; 5 reason-codes seeded
- [ ] plan-fact 4×4 (order/machine/shift/worker × miqdor/vaqt/muddat/tannarx); brak>0 → rework task row
- [ ] operator norm% (idle excluded — E1); norm-calibration = suggestion not auto; payroll/GL untouched
- [ ] EP §3 clean; tsc 0; harness exit 0

**Phase 6 — AI 7-step + owner dashboard:**
- [ ] AI 7-step produces a REAL plan (DB draft rows, not hardcoded — Q-40); each step explained (EP-PP-031)
- [ ] planner 1-click confirm → order Reja→Tasdiqlangan + slots committed (E3); E1 (no auto negative effect)
- [ ] TOC bottleneck identified; raskroy/norm = texnolog-confirm; CRP overload → 3 options
- [ ] owner DashboardPage LIVE figures (DB-proof, not zeros); Bandlik dashboard; Pareto CRON saves; Excel exports
- [ ] code-dictionary editable (placeholder, no hardcode); EP §3 clean; tsc 0; harness exit 0; LLM key never printed (Q-30)

**Module-done (all phases):** golden-thread harness exit 0 throughout; login intact; every phase advisor-reviewed;
owner has seen the AI plan a real order end-to-end. → PP vision module COMPLETE → owner sign-off → next vision module.

---

---

## §17 — CRASH-PATTERN GUARDRAILS (the recurring bugs from the #01–#22 sweep — AVOID them up front)

Every prior module crashed on the SAME small set of drift patterns. Check each BEFORE writing any insert/update.
This section will save you the most time — these are not hypothetical, they bit SD/PP/MES/QC/WMS/MM/HR/FIN.

1. **uuid-vs-integer id (22P02 / 23502)** — the #1 killer (hit #03/#05/#06/#07). Many id/fk columns are `integer
   serial`, but old code inserted random uuid strings or sent `user.id`(int) into a uuid column (or vice versa).
   ⤷ **Rule:** before insert, `_audit/q.cjs "SELECT column_name,data_type FROM information_schema.columns WHERE
   table_name='X'"`. For integer PKs → OMIT id on insert (let the sequence) or `Number(id)`. `sales_orders.created_by`
   is **uuid** (int user.id → throw → set NULL or coerce). `production_orders.id` is **int**. equipment/work_center
   may be uuid (0=unassigned sentinel pattern used in #03).

2. **VIEW-over-base (23502 / 42703)** — many `mm_*`, `hr_*`, `lms_*`, `cc_*`, `mes_*` names are VIEWS over a base
   table (`mm_goods_receipts`→`goods_receipts`, `hr_applications`→`applications`, `mes_shift_handovers`→
   `shift_handovers`, `mes_production_sessions`→`production_sessions`). Inserting INTO the view misses the BASE
   table's NOT-NULL columns or hits a view-only column that doesn't exist.
   ⤷ **Rule:** `_audit/q.cjs "SELECT relkind FROM pg_class WHERE relname='X'"` (r=table, v=view). If view → find the
   base table, insert into the BASE with ALL its NOT-NULL columns. Check the view definition for conflated columns.

3. **ADD-ONLY superset NOT-NULL omission (23502)** — a table has BOTH legacy cols AND newer canonical cols, both
   NOT-NULL; old code wrote only the legacy set (e.g. `leave_requests` wrote `employee_id` but missed canonical
   `user_id`/`leave_type`/`start_date`/`end_date`/`total_days`).
   ⤷ **Rule:** list ALL NOT-NULL columns (`WHERE is_nullable='NO' AND column_default IS NULL`) and supply every one.

4. **Missing table (42P01)** — don't build on a table that doesn't exist (zvs/zno were absent → 42P01).
   ⤷ **Rule:** `to_regclass('public.X')` returns NULL → table absent → DDL (owner-approve, §13) before building.

5. **Missing unique index for upsert (42P10)** — `ON CONFLICT (...)` needs a matching unique index (video_progress
   had none).
   ⤷ **Rule:** if the upsert target lacks a unique index, either manual UPDATE-then-INSERT (NO DDL) or owner-approve
   `CREATE UNIQUE INDEX`. Don't assume the index exists.

6. **Canonical-table discipline (two-world)** — ALWAYS: production = `production_orders` (NOT papka_orders=messaging,
   NOT pp_production_orders); stock = `warehouse_stock` (NOT `stocks`/`wms_stock`); GL = `entries` (NEVER
   `gl_journal_entries`/`gl_lines` — SAP#76); orders = `sales_orders`. Writing to the wrong twin = invisible data.

7. **Status varchar length (22001)** — long status strings overflow `varchar(20)` (PP hit this: 'released_to_
   production'=22 chars). `production_orders.status` already widened to varchar(50). New status tables → varchar(50).

8. **Fake-green (Q-40)** — `{ok:true}`, echo, hardcoded numbers that "look" right. The AI plan / owner dashboard
   MUST read real DB rows. A dashboard of zeros or a plan of constants = a bug, even if it renders.

⤷ **Method every phase:** Phase-0-style 2-minute re-confirm of the tables you'll write (relkind + NOT-NULL cols +
id types) via `_audit/q.cjs`, THEN write. This is cheap and prevents 90% of the crashes.

---

## §18 — EVENT WIRING MAP (golden-thread — extend, never break)

PP sits mid-spine. The harness `scripts/golden-thread-chain-proof.cjs` proves it (must stay exit 0 every phase).

**Inbound to PP:**
- SD `SalesOrderCreated` → PP planning (the order to plan). ATP check flows back to SD (EP-PP-066).
- Design / Lab / Advance / Mro / Wms → PP listeners (already wired in the sweep — confirm, don't rebuild).

**PP internal / outbound:**
- PP release → `PpReleasedMesListener` opens a `production_sessions` row (MES). (Already wired #03 HOP-2.)
- PP MRP shortage → MM purchase-request via event/outbox (`pp.mrp.purchaseRequest`) — Phase 3 wires this.
- PP shift-add (overload resolve) → HR notify (E5). PP delay/readiness → manager Telegram via outbox (EP-PP-098).
- PP completion continues the spine → MES → QC → WMS → FIN (already green).

⤷ **Rule:** when you add a new cross-module effect (purchase-request, manager-notify), emit an event/outbox row —
do NOT directly write another module's tables. Keep the spine event-driven. Run the harness after each phase.

---

## §19 — EXISTING PP CODE TO EXTEND (C6 no-rewrite — confirm + extend, do NOT rebuild)

PP is ~70% built. At each phase, `grep`/read the existing service FIRST, then extend it. Known existing pieces:
- `pp-mps.service.ts` — MPS query (already drift-fixed: sales_order_items cols + delivery_date timestamptz). Extend for Phase 4 scheduling inputs.
- `pp-crp` service — CRP (efficiency_rate already present). Extend for Phase 2 labor-constraint + Phase 6 overload-resolve.
- `pp-routing` — routing/marshrut. Extend for Phase 1 route master.
- `pp-intelligence.controller.ts` — partial stub (CLAUDE.md Qoida 11). Extend for Phase 3 MRP matrix + Phase 6 AI (move logic to a service — Qoida 6, controller=transport only).
- Scheduling engines: johnson / network / capacity (present). The AI 7-step (Phase 6) ORCHESTRATES these — it does
  not replace them.
- CQRS handlers: `execSavePo` / `execUpdatePoStatus` (create/release already fixed b1f2d238 — threads product_id +
  sales_order_id + planned_quantity; id>0→UPDATE). Extend for the 7-status lifecycle (Phase 4).
⤷ **Rule:** a 2-line grep (`grep -rl "pp-crp\|PpPlanning\|production_orders" apps/api/src`) at phase start maps the
real files. Extend them. Rebuilding from scratch = C6 violation + regression risk.

---

## §20 — PER-PHASE VERIFY COMMANDS (cheap — Muslimbek runs; advisor spot-checks)

```bash
cd /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
# generic (every phase):
node scripts/golden-thread-chain-proof.cjs            # spine intact → exit 0 (MANDATORY every phase)
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3030/health            # 200
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3030/api/pp/crp        # 200 (not 503)
pnpm --filter erp-dashboard exec tsc --noEmit         # FE tsc 0   (BE: nest build / tsc)
grep -nE "#[0-9a-fA-F]{6}|(bg|text|border|from|to)-(red|green|blue|indigo|violet|emerald|amber|orange|purple|pink|cyan|teal|rose|sky|lime)-[0-9]{3}" artifacts/erp-dashboard/src/pages/<PpPage>*.tsx   # design clean (0)

# phase table re-confirm (run for each table you'll write — §17 method):
node _audit/q.cjs "SELECT relkind FROM pg_class WHERE relname='<table>'"                          # r=table v=view
node _audit/q.cjs "SELECT column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_name='<table>' ORDER BY ordinal_position"

# phase-specific DB-proof (examples):
node _audit/q.cjs "SELECT id,status,product_id,sales_order_id FROM production_orders ORDER BY id DESC LIMIT 5"   # P4 lifecycle
node _audit/q.cjs "SELECT * FROM pp_material_reservations ORDER BY id DESC LIMIT 5"                              # P3 reserve
node _audit/q.cjs "SELECT reja,fakt,brak,reason_code FROM pp_shift_close ORDER BY id DESC LIMIT 5"               # P5 plan-fact

# commit (exact files only, per phase):
git add <exact files>
git commit -m "feat(pp): phase-N <what> — vision-build (design folded in)"
```

⤷ **Advisor cheap-verify (no fleets, per owner's anti-waste order):** read the phase's key diff + run the harness +
one DB spot-check + the design grep. That is the whole verification — proportionate, no subagent army.

---

> END — PP vision-build. Build Phases 1→6 on #05 (+ this wrapper: current-state delta, DDL drafts §13, EP-fold-in
> §3/§14, edge cases §15, acceptance §16, crash-guardrails §17, event-map §18, existing-code §19, verify §20).
> Design folds in; cheap-verify (no fleets); DDL owner-gated; **the AI 7-step planner planning a REAL order
> end-to-end (material→reserve→route→time→schedule→shift→assign), explained, human-confirmed, DB-persisted = the
> success criterion.** Report per phase in Uzbek. This file + #05 (283 lines) + the PP 1000-Q&A = exhaustive (Q-47).
