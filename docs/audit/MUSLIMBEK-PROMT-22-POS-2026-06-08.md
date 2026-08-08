# EXECUTOR PROMPT #22 — BUILD T3: POS MONITOR (factory warehouse tablet, rework)
> Foundation is clean; T1 golden-thread modules are done. Now rework POS Monitor — the factory
> warehouse tablet app. The owner explicitly said the current state is "not what I wanted at all"
> (OMBOR-KASSIR-INTERVYU Q2). This is a REWORK + CONNECT, not a greenfield build.
> Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES
You are the **EXECUTOR** (green role). Read `CLAUDE.md` + `docs/agent-constitution.md` first.
All hard rules apply without exception:

**Code rules (CLAUDE.md §A–§Qoida 23):**
- Zod validation · Drizzle ORM (no `sql.raw(variable)`) · Result<T> pattern (no throw/null)
- File ≤ 900 lines · function ≤ 150 lines · constants from `business.constants.ts` (no magic numbers)
- Controller = transport only (no business logic) · service never touches DB directly (repo only)
- `@UseGuards` / `@Public` on every controller · no hardcoded secrets · ConfigService only
- `typedExecute<T>` for raw SQL casts · `Array.isArray()` before every `.map/.filter`

**Project rules (LOYIHA-QOIDALARI-2026-06-08.md §A–§J):**
- **C3 — Fake YO'Q:** every form does real DB INSERT/UPDATE. `{ok:true}` / echo / `[] as unknown` FORBIDDEN. Not-yet-ready endpoint → honest **501** (never fake "saved").
- **C4 — Round-trip proof:** create → save → reload → visible (mandatory verify).
- **C5 — No regression:** deleted cannot be re-created; working code stays working.
- **C6 — No rewrite:** system ~70% exists — FIX & CONNECT only.
- **D3 — Re-audit first:** map existing state READ-ONLY → owner approval → then build.
- **D5 — DoD = 7 conditions** (listed in §4 below).
- **E1 — AI observes → human confirms negative effects** (no auto-penalty/block/deduct).
- **E2 — Card-centric:** warehouse-worker GSD flows from their position card.
- **E3 — AI plans:** reorder suggestions, GL Debit/Credit, restock signal → AI auto; manager confirms.
- **E4 — Operator IoT-tablet:** floor hub — scanning, requests, handover acts on tablet.
- **E5 — Org-chart routing:** approvals travel vertically (warehouse manager → finance → director).
- **E6 — Single truth:** `warehouse_stock` is the ONE canonical stock table; `current_stock` = VIEW; `stocks` = lot/expiry (keep). No parallel stock worlds.
- **H2 — Canonical stock = `warehouse_stock`** (not `stocks`/`current_stock`/any new table).
- **H3 — GL canonical = `entries`** (not `gl_journal_entries` / `gl_lines`).
- **H4 — Before any new table:** check for existing table with same concept → use it; new table = **owner approval** (Q-35, `APPROVED:` comment in migration).
- **DDL = owner approval:** no `CREATE TABLE` / `ALTER TABLE` without explicit "APPROVED:" in the migration file comment and owner's "ha" in chat.
- **Design (G1/G2/G3):** EP Linear Soft tokens (`var(--ep-*)`, `var(--mod-*)`), existing templates (ListPage / FormPage / DetailPage / DashboardPage), no new design system.
- **git add <exact-file>** (never `git add -A`) · commit every phase · no `git stash`.
- **Sidebar Qoida 22:** POS = single `{ url: "pos-monitor" }` entry; no `/pos/*` cluster.
- **Report after each phase in Uzbek; wait for "davom" before next phase.**

**Owner overrides specific to POS (from OCHIQ-JAVOBLAR + OMBOR-KASSIR-INTERVYU):**
- **EP-POS-032** Texkarta guard = **hard block** (not just warning); only smena/reja leader can override (mirrors COR-088 STOP logic).
- **EP-POS-050** Material handover = **formal act (2 signatures: issuer + receiver) + audit-log** (resolved conflict with Q11 audit-log-only; warehouse material is official, not shift login).
- **EP-POS-069** Photo evidence = **mandatory** on damaged receipt / brak / large inventory discrepancy (tablet camera).
- **EP-POS-037** Makulatura warehouse = **PENDING OWNER FILE** — do NOT build until owner sends the file; use `501` stub for now.
- **POS current state = owner disapproved** ("umuman man xohlaganim emas") — full re-audit + rework.

═══════════════════════════════════════════════════════════════
## 1. WHY / GOAL

**POS Monitor** (Tier T3) is the **factory floor warehouse tablet app** — the physical entry/exit
point for all material movement in the factory. It is NOT a cash register (cash → Finance/Kassir).

**Role in the system:**
- Every material that enters or leaves the factory passes through POS Monitor.
- It bridges WMS (`warehouse_stock`), QC (quarantine gate), MES (FG receipt from production),
  MM (reorder signal), Finance (auto GL via `entries`), and org-chart (approvals).
- Warehouse-worker GSD statistics are computed from POS movements and flow to their org card.
- The owner's 7 defined warehouse types are managed here:
  1. Rulon paper warehouse (kg + QR per roll) · 2. Finished goods warehouse · 3. Raw material warehouse
  4. Household/office warehouse · 5. Equipment warehouse · 6. Scrap & reject warehouse · 7. Tool warehouse
  (Plus QC-owned: quarantine + quality-control warehouses → managed by QC module, visible here.)

**Vision = measure of correctness (C1/Q-40):** every operation must match the decided vision in:
- `docs/audit/decisions/19-pos.md` — 82-question decision map (57 answered, 25 resolved in OCHIQ-JAVOBLAR)
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` § "POS Monitor" — owner's 4 final decisions + A-defaults
- `docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md` — warehouse taxonomy (Q17), overflow logic (Q22-24),
  roll/rulon kirim (Q35-37), scrap warehouse (Q39-48), FG warehouse (Q50-54), pres-kirim flow (Q43-44)
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` — project-wide rules (this prompt §0 above)

Do NOT invent features. Build only to the decided vision.

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT existing POS implementation (READ-ONLY) — MANDATORY FIRST

The POS module was built but the owner said the current state is NOT what was wanted.
**Do not touch any code in this phase.** Map everything that exists vs the decided vision.

### 0a. Database audit (`_audit/q.cjs` — read-only)
Run against live DB and document:
- Tables currently used by POS: `pos_transactions`, `pos_movements`, `warehouse_stock`, `stocks`,
  `current_stock` (VIEW), any `pos_*` tables — list columns + row counts.
- Which of the 7 warehouse types exist as rows/types in the DB.
- Movement types present: EXTERNAL_IN / EXTERNAL_OUT / INTERNAL_ISSUE / INTERNAL_RETURN /
  INTERNAL_TRANSFER / DAMAGE — which are real vs missing.
- Approval workflow tables: do approval state-machine rows exist?
- GL link: does any POS movement write to `entries` (canonical)? Or to `gl_journal_entries` (wrong)?
- Quarantine/QC handoff table: exists?
- Audit log table for POS actions: exists? Retention strategy?
- Lot/batch tracking: `stocks` table usage.

### 0b. Backend audit
- Find all `pos/` controllers, services, repositories under `apps/api/src/`.
- For each endpoint: is it real (real DB write) or stub (`{ok:true}` / `[] as unknown` / 501)?
- Check: barcode scan endpoint (ZXing + OpenCV fallback), label print endpoint (ZPL/EPL/PDF),
  PDF act generation, GL posting from movement, approval state transitions.
- Check guards: `@UseGuards(JwtAuthGuard)` + role guard on every POS controller?
- Event emissions: does movement completion emit events consumed by QC / MES / Finance?

### 0c. Frontend audit
- Find `pos-monitor` page under `artifacts/erp-dashboard/src/`.
- What tabs/screens exist? What actually persists to DB (round-trip test)?
- Barcode scanner UI: ZXing.js integration present?
- Offline / PWA: is service worker configured for POS?
- Design: EP Linear Soft tokens used or raw hex/inline styles?

### 0d. Gap table → write to `docs/POS-RE-AUDIT-2026-06-08.md`
Format per row: Feature (EP-POS-### code) | Vision decision | Current state | Gap | Effort (S/M/L)

Group gaps into:
- A. Movement types & state machine (EXTERNAL_IN 5-step / EXTERNAL_OUT / INTERNAL_* / DAMAGE)
- B. Barcode scan + label print
- C. Approval workflow (role-based per movement type)
- D. GL bridge → `entries` (FIFO/FEFO, AI Debit/Credit)
- E. Quarantine / QC gate
- F. Inventory counting (offline, night/weekend)
- G. Offline PWA + conflict resolution
- H. Notifications / Telegram Mini App
- I. Analytics / GSD (warehouse worker card statistics)
- J. PDF act generation (2-signature handover)

→ **STOP. Show gap table to owner. Wait for "davom" before any code change.**

═══════════════════════════════════════════════════════════════
## BUILD PHASES

Each phase follows the same pattern:
**permission check → BE+FE parallel → verify (tsc 0 + DB-proof + FE round-trip) → DoD → commit → report in Uzbek → wait for "davom"**

═══════════════════════════════════════════════════════════════
### PHASE 1 — Movement type state machine + canonical DB wiring

**Scope (EP-POS-004/005/008/018/022/028/030):**

Fix the movement state machine to match decided vision. All movements write to `warehouse_stock`
(canonical, H2). No writes to any other stock table except `stocks` (lot/expiry data only).

**Movement types (code-level enum, not configurable):**
```
EXTERNAL_IN   → 5-step: DRAFT → QUARANTINE → QC_REVIEW → MANAGER_APPROVE → AI_GL_POST
EXTERNAL_OUT  → 3-step: DRAFT → MANAGER_APPROVE + FINANCE_APPROVE + AI_GL → COMPLETED
INTERNAL_ISSUE     → 2-step: DRAFT → MANAGER_APPROVE (1 signature)
INTERNAL_RETURN    → 2-step: DRAFT → AUTO_ACCEPT (no approval required; reason mandatory)
INTERNAL_TRANSFER  → same-type = fast (no approval); different-type = MANAGER_APPROVE
DAMAGE             → 2-step: DRAFT → QC_EVENT_EMITTED + GL_LOSS
```

**Cancellation rule (EP-POS-022):** DRAFT → cancelled (hard delete allowed). Any approved movement
→ storno (reverse movement created, original immutable). No direct deletion of approved records.

**Balance guard (EP-POS-010):**
- Assets (fixed equipment): full BLOCK if quantity > available.
- Consumables: WARNING + allow-with-reason (material type flag on material_card).

**Reason field (EP-POS-005):** mandatory on INTERNAL_RETURN and DAMAGE; optional on others.

**Texkarta guard (EP-POS-032 — owner override):** on INTERNAL_ISSUE, if order is linked and
scanned material does not match techcard specification → **hard block** (HTTP 422, FE red banner).
Only `smena_boshlig` or `reja_rahbar` role can override. Log override with reason. (Mirrors COR-088.)

**Tasks:**
1. Map existing movement table(s); if `pos_movements` exists, audit columns vs vision.
2. Add any missing state columns / enum values via **owner-approved DDL only**.
3. Fix service layer: all stock deltas → `warehouse_stock` (UPDATE qty/reserved); no writes to `current_stock` (VIEW) or `stocks` except for lot tracking.
4. Wire movement completion → domain event `PosMovementCompletedEvent` (already exists per memory — fix the double-write bug FIX4 from 4P0 sprint: canonical = `warehouse_stock`).
5. GL posting: on final approval step, call Finance GL service → insert into `entries` (canonical H3). Use FIFO partiya narxi (EP-POS-014). AI computes Debit/Credit account from movement type/reason (EP-POS-012/013).

**Verify:**
- `tsc` 0 errors.
- DB: create EXTERNAL_IN movement → check `warehouse_stock` qty before/after each step.
- DB: create DAMAGE movement → check `entries` row inserted with correct accounts.
- FE: movement form → submit → reload → movement visible in list with correct status.

**Op-codes logged:** EP-POS-004 / EP-POS-005 / EP-POS-008 / EP-POS-010 / EP-POS-022 / EP-POS-028 / EP-POS-032

**Separate commit. Report in Uzbek. Wait for "davom".**

═══════════════════════════════════════════════════════════════
### PHASE 2 — Barcode scan, label print, and material card integration

**Scope (EP-POS-006/007/033/057/061/078):**

**Barcode scanning (EP-POS-006):**
- Primary: dedicated USB/Bluetooth scanner (hardware input, no code needed — browser handles it).
- Fallback: ZXing.js in browser (camera). If ZXing fails → OpenCV server-side endpoint.
- FE: `useBarcodeScanner` hook — listens for rapid keystrokes (scanner) OR ZXing video stream.
- If barcode found → resolve to `material_card` row. If not found:
  - Show manual search (name/code autocomplete).
  - If still not found → "Create new material card" flow → send request to MM module (EP-POS-078).
  - Trigger admin Telegram notification (EP-POS-018 / EP-POS-078).

**Label generation (EP-POS-007):**
- On EXTERNAL_IN final approval → auto-generate label (ZPL/EPL/PDF selectable).
- Format: EAN-13 (per material card) + Code-128 (per lot/batch).
- Manual reprint endpoint.
- FE: print button on approved EXTERNAL_IN record.

**Material unit conversion (EP-POS-057):**
- Material card has unit conversion table: `{ from: 'rulon', to: 'kg', factor: N }`.
- On movement entry: user inputs in one unit → auto-convert to canonical unit for `warehouse_stock`.
- Roll paper (EP-OMBOR-INTERVYU Q35-37): each roll tracked by kg + QR + estimated m² (AI calculates).

**Location (bin) tracking (EP-POS-061):**
- Freeform text: operator types bin location (e.g. "A-3-12", "Tokcha-5") on receipt.
- Shown on issue/transfer to guide picker.

**Warehouse type display (EP-POS-003):**
- User sees only warehouses their department/role grants access to (HR-configured).
- 7 warehouse types as defined in OMBOR-KASSIR-INTERVYU Q17.

**Tasks:**
1. Audit existing barcode scan code in `pos/` FE; fix or replace with ZXing.js hook.
2. Audit label print endpoint; fix to produce ZPL/EPL/PDF per material card type.
3. Add/fix unit conversion logic in movement service.
4. Add bin location field to movement record (DDL if missing → owner approval required).
5. Warehouse type filter on FE warehouse selector.

**Verify:**
- Camera scan on tablet → material card resolved or "create new" dialog.
- EXTERNAL_IN approved → label PDF downloaded.
- Movement with 1 rulon → stored as correct kg equivalent in `warehouse_stock`.

**Op-codes logged:** EP-POS-006 / EP-POS-007 / EP-POS-033 / EP-POS-057 / EP-POS-061 / EP-POS-078

**Separate commit. Report in Uzbek. Wait for "davom".**

═══════════════════════════════════════════════════════════════
### PHASE 3 — EXTERNAL_IN 5-step flow: quarantine + QC gate + formal receipt act

**Scope (EP-POS-004/034/035/051/052/069 + owner-overrides EP-POS-050/069):**

**5-step EXTERNAL_IN flow:**
```
DRAFT (operator enters: supplier, PO ref, materials, quantities, photos)
  → QUARANTINE (system moves to quarantine warehouse; QC notified)
  → QC_REVIEW (QC module: lab result, QABUL / REWORK / CHIQARISH decision)
     - QABUL → MANAGER_APPROVE
     - CHIQARISH → supplier return movement (EP-POS-059 / EP-QC reject flow)
     - REWORK → stays in quarantine
  → MANAGER_APPROVE (warehouse manager signs)
  → AI_GL_POST (AI computes FIFO cost + Debit/Credit → inserts into `entries`)
  → COMPLETED (material available in main warehouse; label auto-printed)
```

**Photo evidence (EP-POS-069 — owner override: mandatory):**
- On DAMAGED goods receipt: tablet camera capture required (cannot proceed without photo).
- On large inventory discrepancy: photo required.
- Photo stored as URL (file upload endpoint → static storage).
- Linked to movement record.

**Formal handover act (EP-POS-050/051 — owner override):**
- PDF generated with: movement number, date, material list (expected vs actual quantities),
  supplier name/rekvizity, receiver name, issuer name.
- 2 signature fields: issuer (yetkazib beruvchi) + receiver (qabul qilgan ombor xodimi).
- Partial receipt (EP-POS-052): received quantity < ordered → DRAFT with open remainder;
  damaged portion → separate DAMAGE sub-movement; lot recorded.

**Lot/batch tracking (EP-POS-025):**
- Each EXTERNAL_IN creates lot record in `stocks` table: lot_id, material_card_id, expiry_date,
  purchase_price, currency, quantity.
- FIFO (non-expiry) / FEFO (expiry-tracked: bo'yoq, elim — EP-POS-060) dispatching.

**Karantin exit confirmation (EP-POS-034):**
- QC lab technician role required to move material from quarantine to main warehouse.
- Hard block: `warehouse_stock` for quarantine location stays 0 available until QC approves.

**Tasks:**
1. Implement/fix 5-step state machine in movement service + repository.
2. Add photo upload (multipart) to EXTERNAL_IN form.
3. Generate PDF act (server-side PDF library already in stack) with 2-signature fields.
4. Implement partial receipt split logic.
5. Integrate QC module event: `QcKarantinDecisionEvent` → triggers state transition.
6. Lot record creation in `stocks` on EXTERNAL_IN COMPLETED.

**Verify:**
- EXTERNAL_IN created with photo → quarantine status → QC approval → manager approve → material in `warehouse_stock`.
- PDF act downloadable with correct fields.
- Partial receipt: 80kg received of 100kg order → open remainder visible.
- FEFO material: lot with earlier expiry dispatched first.

**Op-codes logged:** EP-POS-004 / EP-POS-034 / EP-POS-035 / EP-POS-051 / EP-POS-052 / EP-POS-069

**Separate commit. Report in Uzbek. Wait for "davom".**

═══════════════════════════════════════════════════════════════
### PHASE 4 — Department material request + FG receipt from MES + Telegram Mini App

**Scope (EP-POS-024/031/040/042/043/047/058/065/071/072):**

**Department material request (EP-POS-042):**
- Flow: department employee creates request → department manager approves → warehouse worker issues.
- Request links to order (buyurtma) → material cost auto-accumulates on order (EP-POS-043).
- Ledger: DEBIT on issue (warehouse_stock ↓, order cost ↑).
- Overflow logic (OMBOR-KASSIR-INTERVYU Q22-24): if 5kg issued for 3kg need → +2kg to department
  internal store; AI tracks remainder and attributes subsequent usage to correct order.

**FG receipt from MES (EP-POS-024):**
- MES emits `MesSessionCompletedEvent` with produced FG quantity + order reference.
- POS listener creates EXTERNAL_IN-equivalent (type: FG_FROM_MES) into FG warehouse.
- No quarantine for FG; goes directly to FG warehouse (no QC karantin step).
- MES real-time integration: today's production plan visible in POS tablet (EP-POS-040).

**WIP / yarim tayyor tracking (EP-POS-047):**
- PRODUCTION_* warehouse types (already in DB per memory notes) used for WIP.
- INTERNAL_TRANSFER between PRODUCTION warehouses represents inter-stage movement.

**Finished goods shipment (EP-POS-072):**
- EXTERNAL_OUT from FG warehouse only.
- Approval chain: warehouse manager → finance (payment check) → AI GL.
- AI camera integration: every FG exit photographed + linked to order (OMBOR-KASSIR-INTERVYU Q52).

**INTERNAL_RETURN (EP-POS-058):**
- Leftover material from completed order returns to warehouse.
- Reason mandatory. Cost removed from order (tannarx correction).

**Reorder signal (EP-POS-065):**
- When `warehouse_stock.qty` < `material_card.min_qty` → AI creates reorder suggestion → MM/snabjeniye gets notification.
- EP-POS-011: per-material minimum qty configurable in material card.

**Telegram Mini App (EP-POS-071):**
- Core Telegram Mini App: barcode scan request, movement request, request history, approval action.
- Admin Telegram alert: when scanned material not found (EP-POS-018 / EP-POS-078).
- Notification matrix: event type → recipient role configured in admin panel (EP-POS-028).
- Use Telegraf.js (tech-stack A8).

**Tasks:**
1. Implement department request CRUD + approval flow.
2. Implement overflow logic (department internal store tracking).
3. Wire MES → POS event listener (fix existing no-op stub per Transmission Map memory).
4. Implement reorder trigger (cron + event-based check).
5. Build/fix Telegram Mini App endpoints + Telegraf.js bot commands.

**Verify:**
- Department request → manager approve → INTERNAL_ISSUE created → `warehouse_stock` decremented.
- MES session completed → FG appears in FG warehouse balance.
- Stock below minimum → MM notification created.
- Telegram: send `/status` → get today's stock levels for user's warehouse.

**Op-codes logged:** EP-POS-024 / EP-POS-031 / EP-POS-042 / EP-POS-043 / EP-POS-047 / EP-POS-058 / EP-POS-065 / EP-POS-071 / EP-POS-072

**Separate commit. Report in Uzbek. Wait for "davom".**

═══════════════════════════════════════════════════════════════
### PHASE 5 — Inventory counting + analytics + GSD + offline PWA

**Scope (EP-POS-015/016/019/020/027/029/056/075/080):**

**Inventory counting (EP-POS-015):**
- Conducted at night or on weekends (no work freeze needed; EP-POS-063).
- Tablet: start count session → scan each item → system shows expected qty → operator enters actual.
- System computes delta (actual − expected) per material.
- Delta displayed per item; large discrepancies flagged.

**Inventory discrepancy approval (EP-POS-016):**
- Delta submitted → auto-GL draft created → Finance department reviews and approves.
- Photo evidence mandatory for large discrepancies (EP-POS-069).
- On Finance approval: `entries` updated (loss or surplus GL entry).
- Cycle counting default (EP-POS-017 A-default): daily rotation (one group of materials per day → continuous accuracy).

**Formal handover act for inventory (EP-POS-050 owner override):**
- Shift-to-shift material handover: 2-signature PDF act (issuer + receiver).
- Audit log records who, when, what (EP-POS-027).

**AI planning and anomaly detection (EP-POS-019/020/077):**
- AI restock suggestion: generated from usage trend + min_qty + supplier lead time. Manager confirms.
- AI anomaly: movement outside shift hours + over-norm quantity → flagged as suspicious (EP-POS-077).
- AI observes and flags only; negative consequence (investigation, penalty) requires human confirmation (E1 / global principle).
- Norm-vs-actual variance warning (EP-POS-044 A-default): if INTERNAL_ISSUE exceeds techcard norm → red warning + reason required.

**Warehouse worker GSD → org card (EP-POS-029/056):**
- 3 metrics (EP-POS-056 A-default): plan_completion_% + delay_count + deviation_count.
- Computed from movement records (movements completed on time vs total planned).
- Written to HR org card statistics (E2: card-centric).
- Daily analytics visible to warehouse manager + director + finance + AI (EP-POS-075).

**Audit log (EP-POS-080):**
- Immutable log: every click / change / IP / timestamp (7-year retention per A6).
- Employee can see own movement history; manager/director sees all.
- Storno records linked to original movement (EP-POS-022).

**Offline PWA (EP-POS-021):**
- PWA service worker: cache movement forms + material card lookup for offline use.
- On reconnect: sync pending movements.
- Conflict resolution (EP-POS-070 A-default): conflict → "needs-review" status → manager resolves.

**Reports + export (EP-POS-027/073/075):**
- Daily movement journal (PDF + Excel).
- Warehouse balance report (PDF + Excel).
- Shipment act (PDF) with QR code on invoice.
- Role-based: warehouse manager sees daily; director sees strategic summary; finance sees monthly cost.

**Tasks:**
1. Implement inventory count session (CRUD + delta compute + GL draft).
2. Implement cycle-count schedule (cron: daily group rotation).
3. Implement AI anomaly flag (event-based: movements at odd hours + over-norm → notification).
4. Compute GSD metrics from movement data → push to HR card statistics endpoint.
5. Implement PWA service worker for offline movement forms (Qoida 22: no `/pos/*` sidebar cluster).
6. Implement conflict resolution queue for offline sync.
7. Build report export endpoints (PDF/Excel) for daily journal + balance.

**Verify:**
- Count session: scan items → deltas shown → submit → Finance sees pending approval.
- Anomaly: create movement at 3am in test → anomaly flag created in notifications table.
- GSD: after creating 10 movements → warehouse worker's card shows updated reja% metric.
- Offline: disable network in browser DevTools → create movement → re-enable → movement synced to DB.

**Op-codes logged:** EP-POS-015 / EP-POS-016 / EP-POS-019 / EP-POS-020 / EP-POS-027 / EP-POS-029 / EP-POS-056 / EP-POS-075 / EP-POS-080

**Separate commit. Report in Uzbek. Wait for "davom".**

═══════════════════════════════════════════════════════════════
### PHASE 6 — Pres-kirim, special flows, and FE tablet-optimized rework

**Scope (EP-POS-026/082 + OMBOR-KASSIR-INTERVYU pres-kirim + FE UX rework):**

**Pres-kirim (OMBOR-KASSIR-INTERVYU Q43-44):**
- Pres operator: opens POS page → enters kg → printer prints barcode sticker → sticks on roll.
- ERP auto-creates INTERNAL kirim (WIP type) for that roll.
- AI camera monitors the event.
- This is a simplified fast-path for in-process WIP receipt (no QC gate, no manager approval).

**Scrap (brak) / reject warehouse (OMBOR-KASSIR-INTERVYU Q39-48 + EP-POS-023):**
- DAMAGE movement → auto-event to QC module.
- Brak norm per order: if actual brak > norm → alert + cost attributed to responsible party.
- Scrap (makulatura): separate movement type SCRAP_IN into "Makulatura va Brak" warehouse.
  - EP-POS-037 makulatura details: **PENDING OWNER FILE — use 501 stub for this sub-flow.**
- FG warehouse lahtak (leftover remnant): owner assigns responsible party manually (OMBOR-KASSIR-INTERVYU Q54).

**INTERNAL_TRANSFER (EP-POS-018/031):**
- Same warehouse type → fast (no approval, instant balance update).
- Different warehouse types → manager approval required.
- Source balance decrements; destination balance increments atomically (DB transaction).

**Supplier return (EP-POS-059):**
- QC rejects material → QC emits `QcChiqarishDecisionEvent` → POS creates supplier-return movement.
- Finance credit-note request generated.
- MM vendor rating updated (event).

**Tablet-optimized FE rework (EP-POS-026/082):**
- Responsive web: large touch targets (min 48px), scan-centric layout (scan field prominent at top).
- Language: UZ + RU toggle (user preference). Kirill option: **PENDING OWNER DECISION** (EP-POS-082 — use UZ+RU only for now).
- Error UX: small error → toast; large error → modal (A7).
- Design: EP Linear Soft tokens, DashboardPage/ListPage templates, no new design.
- Sidebar: single `pos-monitor` entry (Qoida 22 enforced by `check-sidebar-regress.mjs`).
- "My inventory" page: employee sees own movement history (EP-POS-080 / EP-POS-047).
- Stock level card per warehouse type visible on main dashboard.

**Tasks:**
1. Implement pres-kirim fast-path endpoint + FE form.
2. Fix DAMAGE movement → QC event emission (fix existing no-op stub from Transmission Map memory).
3. Implement SCRAP_IN movement with 501 stub for makulatura sub-flow (EP-POS-037 pending).
4. Implement lahtak assignment endpoint (warehouse manager sets responsible party).
5. Implement supplier return flow from QC rejection event.
6. Full FE rework of `pos-monitor` page: tablet-optimized layout, touch targets, scan-first UX.
7. "My inventory" page.
8. Warehouse dashboard: balance cards per warehouse type.

**Verify:**
- Pres-kirim: kg entered → barcode generated → WIP warehouse balance updated.
- DAMAGE: created → QC module receives event → QC pending review visible in QC module.
- FE on 768px tablet viewport: scan field visible without scrolling; all buttons touch-sized.
- Supplier return from QC reject → `entries` credit-note GL entry created.

**Op-codes logged:** EP-POS-023 / EP-POS-026 / EP-POS-031 / EP-POS-059 / EP-POS-082

**Separate commit. Report in Uzbek. Wait for "davom".**

═══════════════════════════════════════════════════════════════
## 4. DoD — DEFINITION OF DONE (D5 — all 7 conditions per phase)

1. **BE real:** CRUD endpoints + Result<T> + Zod validation + real DB INSERT/UPDATE (no stubs).
2. **FE real:** EP Linear Soft template + token, loading/error states, round-trip persist (create → save → reload → visible).
3. **Docs:** gap doc updated; op-code registry entry created.
4. **Tests:** BE unit tests for service + repository methods; FE component tests for critical flows.
5. **i18n:** all UI labels in UZ + RU (`i18n/uz/` + `i18n/ru/` keys, no hardcoded Uzbek/Russian in JSX).
6. **Edge cases:** balance guard tested (negative stock blocked); FIFO/FEFO lot dispatch tested; balance-after-storno correct.
7. **Automation:** AI reorder signal fires on min_qty breach; GL auto-posts on movement completion; anomaly flag on off-hours movement.

**Each operation logs its EP-POS-### op-code:** `logger.info({ code: 'EP-POS-004', ... })`.

═══════════════════════════════════════════════════════════════
## 5. RAILS (per-phase enforcement)

- **Permission gate first:** confirm the requesting user's role grants access to the specific warehouse and movement type before executing.
- **BE + FE parallel:** neither half left incomplete. Both pass `tsc` before commit.
- **Verify:** `tsc 0` + DB-proof (query `warehouse_stock` before/after) + FE round-trip.
- **Separate commit per phase** with message format: `feat(pos): phase N — <description>`.
- **No regression:** run `scripts/reviewer-result-pattern.sh` + `scripts/reviewer-array-safety.sh` + `scripts/check-sidebar-regress.mjs` after each phase.
- **No rewrite:** fix & connect what exists; create new only for confirmed gaps.
- **Honest 501 over fake:** EP-POS-037 (makulatura) and EP-POS-082 (kirill) use 501 stubs until owner provides input.
- **DDL = owner approval:** any `CREATE TABLE` / `ADD COLUMN` requires `APPROVED:` comment + owner's explicit "ha".
- **Canonical tables:** all stock → `warehouse_stock`; all GL → `entries`; all orders → `sales_orders`.
- **Report in Uzbek after each phase:** what was done, what DB rows were created, what tsc showed, what round-trip test proved.

═══════════════════════════════════════════════════════════════
## 6. STOP POINTS (mandatory — do not proceed past without owner response)

1. **After Phase 0 RE-AUDIT** — show `docs/POS-RE-AUDIT-2026-06-08.md` gap table. Wait for "davom".
2. **Before any DDL** — show exact SQL, table name, columns, reason. Wait for "APPROVED:" confirmation.
3. **Before touching `warehouse_stock` schema** — this is the canonical stock table; any ALTER is high-risk.
4. **Before touching `entries` schema or GL posting logic** — Finance canonical; coordinate with Finance module owner.
5. **After each build phase** — show phase result report in Uzbek, wait for "davom" before Phase N+1.
6. **If EP-POS-037 (makulatura) owner file arrives mid-build** — pause current phase, read file, update plan, show owner updated scope, get "davom".
7. **If conflict found between this prompt and `docs/audit/decisions/19-pos.md`** — stop, show conflict to owner, wait for resolution. Do not resolve architectural conflicts unilaterally.

═══════════════════════════════════════════════════════════════
## CROSS-CUTTING PRINCIPLES APPLIED TO POS

| Principle | How it applies to POS Monitor |
|---|---|
| **E1: AI observes → human confirms** | AI anomaly flags (off-hours/over-norm): creates notification only; warehouse manager or director must confirm before any penalty or account adjustment |
| **E2: Card-centric** | Warehouse worker's daily movement count / on-time rate / deviation count → computed and pushed to their org card GSD (EP-POS-029/056) |
| **E3: AI plans orders** | Reorder suggestion generated by AI when `warehouse_stock.qty < min_qty`; MM snabjeniye receives and confirms (EP-POS-065/019) |
| **E4: Operator IoT-tablet** | POS Monitor IS the operator tablet for warehouse floor; scan-first layout, large touch targets, offline-capable PWA (EP-POS-021) |
| **E5: Org-chart routing** | INTERNAL_ISSUE approval → warehouse manager (INTERNAL_ISSUE); EXTERNAL_OUT → manager + finance; escalation follows vertikal (org manager_id chain) |
| **E6: Single truth** | `warehouse_stock` only; no second stock table; `current_stock` is a VIEW (read-only); `entries` only for GL |

**Owner-specific overrides (always take priority over A-defaults):**
- EP-POS-032: Texkarta guard = HARD BLOCK (not advisory) — smena/reja leader unlock only.
- EP-POS-050: Shift handover = formal 2-signature PDF act + audit log (not audit-log-only).
- EP-POS-069: Photo evidence = MANDATORY on damage/brak/large discrepancy.
- EP-POS-037: Makulatura warehouse = PENDING OWNER FILE (501 stub until received).
