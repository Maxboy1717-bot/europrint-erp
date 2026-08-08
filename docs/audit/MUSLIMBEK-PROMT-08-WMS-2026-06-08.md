# EXECUTOR PROMPT #08 — BUILD T1: WMS / OMBOR (taxonomy + kassir-linked)
> T1-core oltin-ip moduli. Foundation (#01) tayyor. Bu prompt WMS ni qurishga mo'ljallangan.
> Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES
You are the 🟢 **EXECUTOR**. Read `CLAUDE.md` + `docs/agent-constitution.md` + `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` FIRST. All hard rules apply:

**Code rules:** Zod · Drizzle ORM · Result<T> pattern (no throw/null) · parametrized SQL only (`sql.raw(variable)` FORBIDDEN) · file ≤900 lines / func ≤150 lines · magic numbers → `business.constants.ts` · controller = transport only · no direct `db.*` in services (repo only) · `@UseGuards`/`@Public` on every controller · ConfigService not `process.env`.

**Build rules (C-rail):** no fake data (Q-40/43) · verify-don't-trust (Q-29) · permission gate before every change (Q-28) · DDL = owner approval only (Q-35, `APPROVED:` comment required) · no regressions (Q-39) · NO REWRITE — fix & connect (~70% exists) · round-trip proof for every form (kirit→saqla→qayta-och→ko'rinadi) · honest `501` over fake `{ok:true}`.

**Data canonical rules (H-rail):** stock = `warehouse_stock` (`current_stock`=VIEW; `stocks`=partition/batch, keep) · orders = `sales_orders` · GL = `entries`/`gl_entries` · before any new table: "two-world check" (H4) · `git add <exact-file>` only (add -A FORBIDDEN) · commit every step · report after each phase in Uzbek (Q-38).

**Design (mandatory, Q-41/Qoida 21):** EP Linear Soft tokens (`var(--ep-*)`, `var(--mod-*)`) + existing templates (ListPage / FormPage / DetailPage / DashboardPage) — NO new design. WMS module color = logistics/orange family (`--mod-wms-*`). Tabs max 2 levels (Q-42).

**Op-code logging (J-rail):** every operation logs its `EP-WMS-###` code (`level=info code=EP-WMS-003 ...`) to the registry at `docs/op-codes/REGISTRY.md` + `apps/api/src/common/op-codes.ts`.

═══════════════════════════════════════════════════════════════
## 1. WHY THIS MODULE / GOAL (Q-40 — the measure of "correct")
WMS is a **T1 core / oltin-ip** module — every other module flows through it (MES draws material, QC gates every inbound, Finance gets GL from every movement, PP reserves stock, SD ships finished goods). It is NOT a simple CRUD: 70% of its value is analysis, AI reorder signals, and hard enforcement gates (karantin block, negative-stock block, gofra-mismatch block).

**Vision = correctness measure.** Build ONLY to the decided vision in the source docs below. Do not invent features; do not skip decided features.

**Owner overrides (OCHIQ-JAVOBLAR WMS section — these OVERRIDE A-defaults):**
- **EP-WMS-073** Topology = **structured address** (Zona→Qator→Javon→Yacheyka, e.g. A-12-3-2; auto empty-slot suggestion).
- **EP-WMS-019/020** Warehouse storage = **finished goods ONLY** (not raw-material давальческий); storage charge is written to the **responsible MANAGER** (not to the client) — COR-104 menejer-egasi principle.
- **EP-WMS-047/060** Tolerance = **receipt ±2% / inventory count ±1%** (above = manager approval + mandatory reason).
- **EP-WMS-067** Min/max = **dynamic AI** (auto-recalculate from last 3-6 months consumption, seasonal-adaptive).
- **Conflict resolved EP-WMS-079/110** Pricing = **FIFO/FEFO** (POS Q35 overrides v2-A average-cost).
- **Conflict resolved EP-WMS-001** Canonical stock = **`warehouse_stock`** (memory confirms; `stocks` table = batch/expiry rows, keep both but `warehouse_stock` is the single truth for balances).

**Taxonomy override (OMBOR-KASSIR-INTERVYU §1 — owner interview):**
7 warehouses in scope for WMS: (1) Rulon qog'oz ombori, (2) Tayyor mahsulot ombori (+ijara), (3) Hom-ashyo ombori, (4) Xo'jalik ombori, (5) Jihozlar ombori, (6) Makulatura/brak ombori, (7) Asbob-uskunalar ombori. QC ombori + Sifat nazorati ombori → QC module. Flekso/Ofset ombori → MES module.

**Kassir linkage (OMBOR-KASSIR-INTERVYU §8):** Every item any employee takes is recorded → written to employee profile as debt → cleared only when goods appear in warehouse as receipt. Warehouse is the closure point for all cash advances.

**Source docs (read all before building — do NOT invent):**
- `docs/audit/decisions/10-warehouse.md` — 134 per-question decision map (EP-WMS-001..134)
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` § WMS — 59 owner answers + 4 new decisions + 2 conflict resolutions
- `docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md` — taxonomy, rulon, kassir-linkage, AI camera, raqamlash
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` — project-wide rules (section A-J)
- `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` — rulon-card fields, gofra 3/5-layer, overflow logic
- `docs/audit/IOT-MES-CURRENT-STATE-2026-06-08.md` — what IoT/POS tablet already exists (scan-before-work flow)

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT existing WMS implementation (READ-ONLY) — DO THIS FIRST

The WMS is partially built (~60-70%). Do NOT rebuild. Map what EXISTS vs what the vision needs.

**Audit checklist:**
- DB tables: `warehouse_stock`, `current_stock` (view), `stocks`, `warehouse_transactions`, `warehouse_movements`, `warehouse_locations`, `material_cards`, `low_stock_alerts`, any `wms_*` tables — list columns + row counts via `_audit/q.cjs`.
- BE: existing WMS controllers/services/repos (which endpoints return real data, which return stubs/`{ok:true}`/`[]`). Check `wms-catalog.controller.ts` (known: 5 business-logic methods must move to service per CLAUDE.md Qoida 6). Check `wms-integration.controller.ts` (known stubs at lines 60/66/88).
- FE: `/warehouse/*` pages — which render real data, which are stub/EPComingSoon. Check `/warehouse/rolls` (memory: LIVE). Check `/ai/wms` (memory: stub page).
- POS Monitor: memory says owner called it "not what I wanted at all" — map current state as-is, do not touch yet (POS is a separate prompt scope).
- Gap table → `docs/WMS-RE-AUDIT-2026-06-08.md`: feature (EP-WMS-### code) | exists? | gap | effort | phase.

→ **STOP. Show owner the re-audit doc. Get explicit "continue" before any build.**

═══════════════════════════════════════════════════════════════
## BUILD PHASES

Each phase follows: permission gate → BE + FE parallel → verify (tsc 0 + DB-proof + FE persist round-trip) → DoD check → separate commit → report in Uzbek → wait for "continue".

---

### PHASE 1 — Warehouse taxonomy master-data + movement numbering
**Decided features:** EP-WMS-002, EP-WMS-021, EP-WMS-073, OMBOR-KASSIR-INTERVYU §1, §13.

- Seed/ensure the 7 WMS warehouse types in the warehouse-types master-data table (MAIN_RAW / ROLL_PAPER / FINISHED_GOODS / RAW_MATERIAL / HOUSEHOLD / EQUIPMENT / TOOLS / SCRAP_BRAK). QC_QUARANTINE and PRODUCTION_* types exist but are owned by QC/MES modules — do NOT duplicate.
- Structured locator: `warehouse_locations` table — Zona → Qator → Javon → Yacheyka (A-12-3-2 format). If table exists, verify schema; if missing, DDL → **STOP for owner approval before creating**.
- Movement numbering: `HOM-KIRIM-2026-00001` format (ombor-type + action-type + year + sequence). Confirm or add sequence generator.
- FE: warehouse selector (ListPage template) showing all 7 warehouses with type badge + current-stock total. Excel-like table view (per OMBOR-KASSIR-INTERVYU §1 "jadval ko'rinishi, kartochka emas").
- **Cross-cutting E5:** org chart routing — warehouse creation auto-links to org department (new dept → auto-warehouse, CHAT-TARIXI).
- **DoD check:** round-trip — create locator address → save → reload → address persists. Op-codes logged: `EP-WMS-002`, `EP-WMS-021`.

---

### PHASE 2 — Inbound receipt flow (kirim) with QC karantin gate
**Decided features:** EP-WMS-003, EP-WMS-016, EP-WMS-017, EP-WMS-046, EP-WMS-047, EP-WMS-048, EP-WMS-050, EP-WMS-051, EP-WMS-105, EP-WMS-091.

- Receipt flow: DRAFT → KARANTIN → QC_PASS/REWORK/REJECT → MAIN_WAREHOUSE (5-step per POS Q21/Q30).
- **Every external inbound goes to quarantine first** — no exceptions (even household goods per OMBOR-KASSIR-INTERVYU §3).
- Mandatory receipt fields: date + supplier + document-number + material + quantity + unit + batch + receiver + locator (EP-WMS-046).
- Weight tolerance ±2% auto-accept, above ±2% → manager approval + mandatory reason (EP-WMS-047 owner override).
- Gramaj check at receipt: sample weighed → ±tolerance → karantin if failed (EP-WMS-091).
- Photo on damage flag: if "shikast bor" checkbox → photo required before saving (EP-WMS-105 / global principle E1).
- QC three-decision gate: QABUL → free zone | REWORK → MES | CHIQARISH → return to supplier. Fires event to QC module.
- Negative stock: assets → FULL BLOCK; consumables → WARNING + allow (POS Q38 / EP-WMS-056).
- **GL auto-posting** on receipt confirmation: debit inventory / credit AP → writes to `entries` (EP-WMS-109, gl_entries kanonik).
- **Cross-cutting E1:** AI flags gramaj/weight anomaly → human (QC role) confirms before karantin release. Never auto-approve.
- **DoD:** create receipt → save draft → QC approves → stock appears in `warehouse_stock` → GL entry in `entries` → round-trip visible in FE. Op-codes: `EP-WMS-003`, `EP-WMS-016`, `EP-WMS-017`.

---

### PHASE 3 — Rulon qog'oz ombori (roll paper warehouse — factory core)
**Decided features:** EP-WMS-014, EP-WMS-032..039, EP-WMS-083, EP-WMS-125, EP-WMS-129, OMBOR-KASSIR-INTERVYU §4.

- Roll card fields: noyob ID + QR label auto-print on receipt (ZPL/EPL/PDF per POS Q19) + kenglik (mm) + diametr + gramaj g/m² (dropdown 80..300) + boshlang'ich og'irlik (kg) + joriy qoldiq (kg) + taxminiy uzunlik (m, auto-calc = weight/(gramaj×kenglik)) + tur (kraft/test-liner/fluting/white/makulatura) + yetkazib beruvchi + sertifikat + kelgan sana + namlik% + saqlash zonasi.
- Roll status: To'liq / Ochilgan / Qoldiq (FIFO: ochilgan rulonlar birinchi).
- IoT scan before work: before production starts, operator scans roll on IoT tablet → system validates roll is correct material/gramaj for the work order → then issues (OMBOR-KASSIR-INTERVYU §4 + E4 cross-cutting).
- Overflow logic (OMBOR-KASSIR-INTERVYU §2): 3 kg needed but 5 kg container → 5 kg issued → dept internal warehouse +2 kg → main warehouse -2 kg flagged → AI tracks both warehouses for that order's cost.
- Qoldiq/obrezka return: used offcut returned as "ikkilamchi" (secondary quality flag) via INTERNAL_RETURN (EP-WMS-083/125, POS Q24).
- Kesilgan list zaxirasi: cutting operation reduces roll (kg) and creates list (dona) stock — dual-unit linkage (EP-WMS-129).
- `/warehouse/rolls` endpoint is LIVE per memory — verify it works, fix contract drift if any, do NOT rebuild.
- **Cross-cutting E4:** IoT tablet = scan point for roll issue; block if gramaj mismatch (EP-WMS-085 gofra-layer check).
- **DoD:** create roll → label printed → MES scan deducts → qoldiq updated in `warehouse_stock` → visible in FE rolls list. Op-codes: `EP-WMS-014`, `EP-WMS-032`, `EP-WMS-036`.

---

### PHASE 4 — Chiqim (outbound) flow + FIFO/FEFO enforcement + inventory reservation
**Decided features:** EP-WMS-052..057, EP-WMS-055, EP-WMS-084, EP-WMS-085, EP-WMS-100, EP-WMS-103, EP-WMS-112, EP-WMS-117.

- Outbound reasons: INTERNAL_ISSUE / EXTERNAL_OUT / DAMAGE / RETURN / INTERNAL_TRANSFER (POS Q21-26).
- FIFO default; FEFO for dated materials (kley/bo'yoq/kimyo — POS Q37 / EP-WMS-055).
- Link to production order: mandatory link to PP work order for INTERNAL_ISSUE (EP-WMS-053).
- Tech-card material match block: if issued material code ≠ tech-card required material → BLOCK issue + notify designer/technologist (EP-WMS-084, kitob: toplayner vs makulatura example).
- Gofra layer mismatch block: scanner compares gofra type to tech-card → mismatch → BLOCK (EP-WMS-085, kitob: 3-layer vs 5-layer).
- Dual-approval for large outbound: EXTERNAL_OUT → warehouse manager + finance; INTERNAL_ISSUE → 1 manager signature above threshold (POS Q22/Q23 / EP-WMS-057). Threshold = configurable master-data.
- Reservation: production plan books material (available = total − reserved − in-transit); free stock visible in FE (EP-WMS-100).
- Spisaniye (write-off): damage act (material + reason + quantity + approver) → Finance loss GL entry (EP-WMS-103 / POS Q26).
- **Cross-cutting E1:** BLOCK signals (gofra, tech-card, karantin) are automatic; but write-off financial impact and negative-stock override require human approval.
- **DoD:** issue material → FIFO batch selected → tech-card check passes → warehouse_stock decremented → GL debit cost-of-goods → round-trip. Op-codes: `EP-WMS-052`, `EP-WMS-055`, `EP-WMS-084`.

---

### PHASE 5 — Inventory count (inventarizatsiya) + ABC cycling + min/max AI reorder
**Decided features:** EP-WMS-007..010, EP-WMS-027, EP-WMS-058..063, EP-WMS-064..068, EP-WMS-111, EP-WMS-131.

- Inventory count types: cyclic (A-class weekly, B-monthly, C-yearly — EP-WMS-131/058) + annual full count.
- Count runs during off-hours / weekends, zone-level freeze during counting (EP-WMS-062, POS Q52).
- Blind count: operator enters quantity without seeing the system balance (EP-WMS-059).
- Variance: ±1% → auto-adjust; above ±1% → manager + finance approval + mandatory reason from picklist (EP-WMS-060/061 owner override). GL variance entry written to `entries`.
- MОЛ (материально-ответственное лицо) per zone: shortage links to responsible person (EP-WMS-111).
- ABC auto-classification: annual consumption × FIFO price → A/B/C categories → drives count frequency (EP-WMS-027/044).
- Min/max dynamic AI: auto-recalculate from last 3-6 months consumption (EP-WMS-067 owner override). Reorder point = (avg daily consumption × lead time) + safety stock (EP-WMS-065). Max = configurable upper cap (EP-WMS-066).
- Low-stock event: fires to CC/NTF → warehouse manager + purchasing + warehouse head + Telegram (EP-WMS-011, POS Q59).
- Auto PR draft: when stock hits reorder → auto draft purchase request (ZVS/ZNO) for purchasing to approve (EP-WMS-012).
- GSD accuracy KPI: per count → accuracy% = (correct/total)×100, stored per count, trend chart (EP-WMS-008).
- **Cross-cutting E3:** AI plans reorder suggestion → human (purchasing) confirms purchase request (never auto-buy).
- **Cross-cutting E2:** warehouse-staff card GSD includes inventory accuracy% and logistics-delay count (EP-WMS-023/119).
- **DoD:** run count → blind entry → variance auto-calc → if >1% finance approves → GL entry → GSD accuracy updated → visible. Op-codes: `EP-WMS-007`, `EP-WMS-027`, `EP-WMS-064`.

---

### PHASE 6 — Finished-goods warehouse + kassir-linkage + outbound shipping
**Decided features:** EP-WMS-026, EP-WMS-077, EP-WMS-097, EP-WMS-098, EP-WMS-099, EP-WMS-123, EP-WMS-133, OMBOR-KASSIR-INTERVYU §6 §8.

- FG warehouse is separate (EP-WMS-077); MES finishing auto-creates FG receipt to `warehouse_stock` (EP-WMS-026, event from MES).
- FG outbound (отгрузка): shipping doc auto-generated from sales order (buyer + products + qty + driver + vehicle + departure-time). AI camera photos every outbound + links to sales order (OMBOR-KASSIR-INTERVYU §6).
- Delivery confirmation: driver returns → "delivered / returned / partial" + reason → loop closes (EP-WMS-099).
- **Ijara (storage fee):** finished goods stored beyond 30 days → per-day m² charge → written to the responsible **MANAGER** (not client) — EP-WMS-019/020 owner override. Manager gets daily PDF. After free period system auto-creates Finance charge record against manager profile.
- **Lahtak (remnant after pickup):** after goods collected, leftover tagged → system assigns to responsible person (warehouse manager marks who is accountable) → stays in that person's profile until resolved (OMBOR-KASSIR-INTERVYU §6).
- **Kassir-linkage (OMBOR-KASSIR-INTERVYU §8 — owner override):** any employee taking goods/cash → debt on employee profile → debt cleared ONLY when goods appear as receipt in warehouse. FE: employee profile shows total taken / purpose / pending-confirm / debt. This is a cross-module link (WMS receipt ↔ Finance cassir ↔ HR profile).
- Davalcheskiy (customer material): each stock row has `owner_type` (US / CLIENT_ID). Client material visible only for that client's orders (EP-WMS-123).
- **Cross-cutting E1:** AI camera flags unlogged outbound → security/warehouse confirms → then GL posts. Never auto-post on camera alone.
- **DDL note:** `owner_type` column on `warehouse_stock` — check if exists; if not → **STOP, owner approval before ALTER TABLE**.
- **DoD:** FG receipt from MES → visible in FG warehouse → shipping doc created → driver delivers → confirmation closes → GL debit COGS / credit inventory in `entries`. Op-codes: `EP-WMS-026`, `EP-WMS-097`, `EP-WMS-109`.

---

### PHASE 7 — Batch/partiya tracking + expiry FEFO + full audit trail + reporting
**Decided features:** EP-WMS-018, EP-WMS-030, EP-WMS-078, EP-WMS-079, EP-WMS-089, EP-WMS-107, EP-WMS-108, EP-WMS-109, EP-WMS-119, EP-WMS-132.

- Batch (partiya) per receipt: unique batch number, linked to every outbound (forward/backward traceability — EP-WMS-078).
- FEFO for dated materials: expiry date + N-days warning (configurable: 30/15/7 days) + BLOCK when expired (EP-WMS-079/018, POS Q37).
- Waste/residue split: recoverable qoldiq (→ secondary stock) vs chiqindi (→ disposal). Makulatura = partial-recovery revenue (EP-WMS-089, kitob: chiqindi/qoldiq chiqarish).
- Full audit log: every action logged (user + timestamp + quantity + reason + IP), immutable, 7-year retention (EP-WMS-030, POS Q6/Q7).
- PDF blanks: movement acts + invoices (separate PDFs per OMBOR-KASSIR-INTERVYU §13). Two-signature QR blanks (EP-WMS-132). Login = ERP login = signature (no wet ink needed per §13).
- Daily auto-report (CRON): stock balance + movements + signals → CC → warehouse manager + director (EP-WMS-013/107, POS Q57).
- Proactive material shortage signal (CRON): planned consumption vs current stock → "X material runs out in Y days" forecast → CC + Taʼminot + PP (EP-WMS-108).
- Logistics-delay KPI: downtime caused by "material shortage / logistics" → separate code, monthly stats → links to warehouse-staff card GSD (EP-WMS-088/119, kitob).
- Turnover days dashboard + dead-stock report (N days without movement) → Finance + Sotuv signal (EP-WMS-082/115).
- **Cross-cutting E2 (card-centric):** warehouse-staff GSD auto-filled from formulas — inventory accuracy%, logistics delay count, receipt speed (EP-WMS-023/113, ORG-113). Card is primary; employee profile aggregates.
- **Cross-cutting E6 (one canonical truth):** all reports read from `warehouse_stock` (not `stocks`). GL reads from `entries`. No parallel worlds.
- **DoD:** daily cron fires → CC receives report → readable in FE notification. Shortage signal fires when stock < reorder. Turnover days chart visible on WMS dashboard. Op-codes: `EP-WMS-013`, `EP-WMS-030`, `EP-WMS-107`.

═══════════════════════════════════════════════════════════════
## DoD — per phase, all 7 conditions (ERP-SIFAT-STANDARTLARI)
1. **BE real:** CRUD + Result<T> + Zod validation + real DB (Drizzle, no stubs).
2. **FE real:** EP Linear Soft template + tokens, loading/error states, persists (round-trip).
3. **Docs:** gap-table updated, op-codes registered in REGISTRY.md.
4. **Tests:** BE unit (service + repo) + FE component test for each new form.
5. **i18n:** UZ + RU keys for every label, toast, error message (no hardcoded strings).
6. **Edge cases:** negative stock block, karantin block, tolerance enforcement, gofra mismatch, duplicate material-card warning.
7. **Automation:** every AI signal/cron/event handler actually fires (no no-op stubs); verify with DB-proof.

Each operation logs its **EP-WMS-### op-code** to `apps/api/src/common/op-codes.ts`.

═══════════════════════════════════════════════════════════════
## RAILS (mandatory on every phase)
- **Permission gate (Q-28):** state `file:line` + exact change + reason → owner says "ha" before touching.
- **BE + FE parallel (D1):** never leave one layer half-done.
- **Verify (Q-29/C2):** every claim about existing tables/endpoints = live probe first, not assumption.
- **Separate commit per phase:** `git add <exact-file>` → commit → push. Never `git add -A`.
- **No regressions (Q-39/C5):** `/warehouse/rolls` (LIVE) must keep working. All existing green tests must stay green.
- **No rewrite (C6):** if an endpoint exists and works, fix & connect — do not rebuild.
- **Honest 501 over fake:** if a feature's DB schema is not approved yet → return `HttpStatus.NOT_IMPLEMENTED`, not `{ok:true}`.
- **DDL = owner approval (Q-35):** any new table or ALTER TABLE → STOP, write `APPROVED: <owner>` comment, wait.
- **Report in Uzbek (Q-38):** after each phase show: bajarildi / defer / commit hashes / keyingi qadam.
- **Windows nest watch (Q-44):** if server drops after rebuild → restart dev, not a code error.

═══════════════════════════════════════════════════════════════
## STOP POINTS (mandatory — ask owner before proceeding)
1. **After Phase 0 RE-AUDIT** — show gap doc, get "continue" before any build.
2. **Before any new table / ALTER TABLE / DDL** (Q-35) — even adding a column to `warehouse_stock`.
3. **Before touching `warehouse_stock`, `entries`, `sales_orders`** canonical tables — confirm exact change.
4. **Before Phase 6 kassir-linkage** — confirm exact schema for `employee_debt` / `warehouse_receipt_link` with owner (cross-module, Finance + HR + WMS).
5. **After each build phase** — show report in Uzbek, wait for "davom" before next phase.
