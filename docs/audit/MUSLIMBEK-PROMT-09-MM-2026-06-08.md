# EXECUTOR PROMPT #09 — BUILD T1: MM / TA'MINOT (Procurement)
> P2P ta'minot zanjiri: ariza→tasdiq→PO→qabul→QC→to'lov. 140 qaror, 75 javoblangan, 65 A-default.
> Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES
You are the 🟢 **EXECUTOR**. Read `CLAUDE.md` + `docs/agent-constitution.md` first.
Reference: `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` (full project rules — mandatory).

**All hard rules apply:**
- Code style: Zod · Drizzle ORM · Result<T> pattern · parametrized SQL only (`sql.raw(var)` FORBIDDEN) · file ≤900/func ≤150 · `business.constants.ts` (no magic numbers).
- Quality gates: **no fake data (Q-40/C3/Qoida 10)** · **verify-don't-trust (Q-29/C2)** · **permission gate before every change (Q-28/I3)** · **DDL = owner approval (Q-35, `APPROVED:` comment mandatory)** · **no regressions (Q-39/C5)** · **no rewrite — fix & connect (C6, ~70% already exists)**.
- Process: `git add <specific-file>` only (never `-A`) · commit every phase · report after each phase in **Uzbek** (Q-38/I4) · wait for "davom" before next phase.
- Design (mandatory, Q-41/Qoida 21): **EP Linear Soft** tokens (`var(--ep-*)`, `var(--mod-*)`) · existing templates only (ListPage / FormPage / DetailPage / DashboardPage / BoardPage) — **no new design** · tab depth ≤ 2 levels (Q-42) · MM module color = orange/supply family (`--mod-mm-*`).
- Canonical tables (H1/H2/H3 rules — never create a parallel world):
  - Orders → `sales_orders` (`sd_sales_orders` = VIEW)
  - Stock → `warehouse_stock` (`current_stock` = VIEW)
  - GL → `gl_entries` / `entries` (never `gl_journal_entries` + `gl_lines`)

═══════════════════════════════════════════════════════════════
## 1. WHY THIS MODULE / GOAL (Q-40 — measure of "correct")
MM / Ta'minot is a **T1-core** module — it is the procurement spine of EuroPrint:
P2P chain (ariza → tasdiq → PO → transport → QC karantin → ombor → to'lov → GL).
Without functioning MM: materials are not ordered correctly, lab quality gates are bypassed, costs are wrong, and Finance has no supplier debt to manage.

**Vision = the measure of correct.** Build only to decided features. Do not invent.

**Source documents (read all before building):**
- `docs/audit/decisions/11-mm.md` — full 140-decision map (EP-MM-001..140); focus on ✅ JAVOBLANGAN items + ⭐ markers.
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` § "MM / Ta'minot" — owner overrides (3 explicit + transport pending).
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` — project rules block (sections A–I).
- `docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md` — POS Q21–Q60 (EXTERNAL_IN 5-step, karantin, QC 3-decisions, FIFO/FEFO, valyuta, PDF/Excel export).
- `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` — reyting formula, AI-planning 7-step, gofra formulas.

**⭐ Owner overrides from OCHIQ-JAVOBLAR (these OVERRIDE A-defaults):**
- **EP-MM-002/040**: Vendor rating = **sifat 40% + muddat 30% + narx 20% + hujjat 10%** (weights configurable by owner/admin).
- **EP-MM-054/058**: Currency conflict RESOLVED — store price in **original currency** (POS Q36) + convert to UZS at **MB rate on RECEIPT date** (v2-Q17); both fields saved.
- **EP-MM-056/057**: Tender = **3+ quotations → 5-column comparison** (narx/muddat/to'lov/reyting/masofa) → aggregate score → **human confirms**; if not-cheapest selected, reason field is **mandatory**.
- **⏳ EP-MM-062/063/064**: Fuel/transport deep-dive = **PENDING owner 10-question session** — build transport master-data (vehicles/drivers, EP-MM-020/059/060) but **DO NOT build fuel accounting formulas** until owner deep-dive completes; mark those endpoints as honest 501.

**⭐ 6 cross-cutting principles — apply wherever MM touches them:**
- **E1 (AI observes → human confirms):** AI suggests low-stock reorders, price alerts, vendor rating drops — but negative effects (block, penalty, rejection) require human approval. No auto-punishments.
- **E2 (Card-centric):** Ta'minot bo'limi KPI panel ties to the card-model ЦКП (EP-MM-027/028/137). Card = source; profile = aggregate.
- **E3 (AI plans orders):** Min-stock → auto draft requisition (EP-MM-069/009); BOM × order qty = material demand (EP-MM-129); seasonal forecast (EP-MM-139). AI drafts, manager confirms.
- **E4 (Operator IoT-tablet):** Goods receipt scan at POS Monitor tablet (EXTERNAL_IN 5-step). MM's reception flow feeds into POS/WMS — do not duplicate, link.
- **E5 (Org-chart routing):** Approval chains (EP-MM-024/047) route through org-chart: <5M → supply head, 5–50M → finance, >50M → director. Urgent = director SMS/app, then document. Conflict-of-interest vendor requires higher approval (EP-MM-102).
- **E6 (Single canonical truth):** vendor data lives in one supplier table; material data links to `material_cards` (canonical, JONLI); GL posting to `gl_entries` only; no duplicate worlds.

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT existing MM implementation (READ-ONLY) — MANDATORY FIRST

MM is **partially built** (~60-70%). Do not rebuild. Map what EXISTS vs what the vision needs.

**What to check:**
- **DB tables**: `purchase_orders`, `purchase_order_items` (EP-MM mem: `mm_purchase_order_lines → purchase_order_items` fixed in poydevor sprint), `vendors`/`suppliers`, `material_cards`, `warehouse_stock`, `gl_entries` — list columns + row counts (`_audit/q.cjs` read-only).
- **BE**: existing procurement endpoints/services/repos (modules/mm/ or modules/procurement/) — what's real vs stub (Result<T>? real DB? or `return { ok: true }`?).
- **FE**: procurement/supply pages — what renders, what saves, what is EPComingSoon.
- **Integration points**: PP→MM (MRP ariza), MM→WMS (EXTERNAL_IN), MM→QC (karantin), MM→Finance (GL kreditor).

**Output**: write `docs/MM-RE-AUDIT-2026-06-08.md` with gap table:

| Feature (EP-MM-###) | Exists? | Real or Stub? | Gap | Effort |
|---|---|---|---|---|
| Vendor CRUD (EP-MM-037/039) | ... | ... | ... | ... |
| PO CRUD 7-status (EP-MM-050) | ... | ... | ... | ... |
| ... | | | | |

→ **STOP. Show owner the re-audit. Get approval before any build.**

═══════════════════════════════════════════════════════════════
## BUILD PHASES

Each phase follows this sequence:
1. Permission gate → confirm with owner before touching canonical tables or DDL.
2. BE + FE in parallel (never leave one half done).
3. Verify: `tsc 0` + DB-proof (INSERT then SELECT, not just "no error") + FE persist round-trip (enter → save → reload → visible).
4. DoD check (7 conditions — see §4 below).
5. Separate git commit with phase label.
6. Report to owner in **Uzbek** → wait for "davom".

---

### PHASE 1 — Vendor master-data (supplier card)

**Scope** (decided features only):
- Vendor card CRUD with mandatory fields (EP-MM-037): nomi, STIR/INN, bank account, MFO, yuridik address, phone, contact person — saving blocked if mandatory fields missing.
- Vendor type classification (EP-MM-038): 6 preset types (xom-ashyo / kimyo / ehtiyot-qism / xizmat / yoqilg'i / transport) — mandatory on card.
- Vendor status 5-values (EP-MM-039): Faol / Yangi-tekshiruvda / To'xtatilgan / Qora-ro'yxat / Arxiv. "Qora-ro'yxat" status = order fully blocked. Who adds to blacklist: ta'minot boshlig'i + sifat bo'limi recommends (kitob РД-5).
- Vendor documents tab (EP-MM-030/042/079): contract (number/date/expiry/scan/payment-terms) + certificates/licenses. CRON: 30-day expiry warning (Telegram + screen).
- Payment terms on contract (EP-MM-043/067): payment type (prepayment/postpay) + delay days; Finance auto-calculates due-date from receipt date.
- Vendor contact history journal (EP-MM-085): date/who/topic/result log on card — CRM pattern reuse.
- Conflict-of-interest flag (EP-MM-102): "related party" checkbox (employee/relative + who); such vendor requires higher-level approval in PO flow.
- Rekvizit change approval (EP-MM-089): bank detail changes go through director/finance approval; old rekvizit stays in history.
- Vendor payment-requisite change triggers APPROVE workflow (EP-MM-089).
- NDS flag (EP-MM-080): "NDS to'lovchi" on card; used in tender cost comparison.

**Permission**: DDL only if vendor table missing required columns — get owner approval first.
**Verify**: create vendor → add documents → change status to Qora-ro'yxat → confirm blocked on PO page → reload → all fields visible.
**Commit label**: `feat(mm): phase-1 vendor master-data`

---

### PHASE 2 — Purchase Requisition (ariza) + Approval chain

**Scope** (decided features only):
- Requisition form (EP-MM-046/045): 7 fields: material / qty / unit / needed-by-date / reason / which-order / estimated-price. "needed-date" and "qty" = mandatory.
- Who can create (EP-MM-045): warehouse (min-stock trigger), production (plan), supply team — source recorded.
- Auto-draft from min-stock (EP-MM-069/009): when `warehouse_stock` drops below `min_qty` → system auto-creates draft requisition (qty = max − current); supply manager confirms. Link to `material_cards` canonical table.
- BOM→auto requisition (EP-MM-129): BOM norm × order quantity = material demand → auto-draft ariza. Connects to PP MRP service (`pp-mps.service.ts` — already partially built, verify-don't-trust first).
- Approval chain by sum (EP-MM-024/047):
  - < 5 mln UZS → ta'minot boshlig'i
  - 5–50 mln UZS → moliya bo'limi
  - > 50 mln UZS → direktor
  - Threshold = **configurable** (EP-MM-025) — settings screen, no hardcode.
  - Currency: thresholds work for both UZS and USD (converted at current MB rate).
- Urgent flag (EP-MM-032/088): "shoshilinch" tag → single-step fast approval (director SMS/app); reason field mandatory afterward.
- Rejection flow (EP-MM-048): reject requires reason field; rejected ariza returns to author with status "Qaytarilgan"; author can edit+resubmit.
- Telegram notification (EP-MM-036): approval request + receive + payment-due sent via Telegram.
- Each operation logs its **EP-MM-### op-code** to audit_log.

**E3 principle**: AI creates draft; manager approves. Never auto-approve.
**E5 principle**: approval routing uses org-chart vertical chain.
**Permission**: confirm threshold config table DDL with owner if not exists.
**Verify**: create requisition → approval notification → approve → status changes → urgent path test.
**Commit label**: `feat(mm): phase-2 requisition-approval`

---

### PHASE 3 — Purchase Order (PO) + 3-way match + vendor comparison

**Scope** (decided features only):
- PO number format (EP-MM-005): auto sequential + year: `PO-2026-000123`.
- From approved requisition → "Buyurtma yaratish" button → fields copied from ariza (EP-MM-049); supply team adds vendor + price only.
- PO line items (EP-MM-006/077): each line: real material name (from `material_cards`), qty, unit (with conversion EP-MM-086), unit price, total. No "Vendor #5, qabul:0" placeholder data.
- PO 7 statuses (EP-MM-050/031): Qoralama / Yuborildi / Tasdiqlandi / Qisman-keldi / To'liq-keldi / Yopildi / Bekor.
- Partial delivery tracking (EP-MM-012/078): per line "ordered / received / remaining"; status stays "Qisman-keldi" until remaining = 0.
- Currency (EP-MM-034): order currency selectable (UZS/USD/other); store original currency + MB rate on receipt date + UZS equivalent. Both fields saved (owner override EP-MM-054).
- Price history per material (EP-MM-007/053): after each purchase → auto-save to price history (date/price/vendor/qty); chart on material card. Price alert: 10% → yellow, 25% → red + notify boss (EP-MM-008/055).
- 3-way match (EP-MM-018/052): PO + receipt + invoice must match within ±3% (configurable tolerance); if over threshold → payment blocked + approval required.
- Vendor tender comparison (EP-MM-056/057): 3+ quotation entries → 5-column table (narx/muddat/to'lov/reyting/masofa) → aggregate score displayed → **human selects** (never auto); if not-cheapest selected → reason **mandatory** (owner override).
- Conflict-of-interest vendor in PO → triggers higher approval (EP-MM-102).
- Signature trail (EP-MM-087): "created by / approved by / sent by" auto-logged (actor+timestamp).
- PO auto-close (EP-MM-138): PO closes automatically only when: mol to'liq qabul + all documents attached + payment completed. No partial auto-close.

**Owner override**: EP-MM-056/057 tender → aggregate score visible but human decides; if not-cheapest → reason mandatory.
**Verify**: create PO from ariza → add lines with real material_cards → save → reload → lines visible; test 3-way mismatch → payment blocked.
**Commit label**: `feat(mm): phase-3 purchase-order-3way`

---

### PHASE 4 — Goods Receipt + QC lab gate (РД-5)

**Scope** (decided features only):
- Receipt linked to PO (EP-MM-011/051): on receipt, PO opens → per-line "ordered / received / difference" displayed.
- EXTERNAL_IN 5-step flow (POS Q21): align with POS Monitor tablet flow — do NOT duplicate; link MM receipt to WMS EXTERNAL_IN event.
- Quarantine → QC gate (EP-MM-014/072): all critical raw materials (kraft/chemistry) go to quarantine first; only after QC approval → main warehouse. Uncleared → karantin zone.
- Lab РД-5 gate (EP-MM-090): each received batch gets "laboratory status": kutilmoqda / o'tdi / shartli / rad. Status "o'tmaguncha" PP cannot use material.
  - Lab fields (EP-MM-090 ↳A): namlik %, граммаж g/m², qalinlik mkr, qog'oz-turi/marka, ECT.
  - Moisture auto-karantin (EP-MM-091): if namlik > configurable threshold → auto-karantin + vendor claim. Threshold per material mark.
  - Граммаж check vs texkarta (EP-MM-092): compare received граммаж to BOM spec ± tolerance → alert if outside.
  - Топлайнер vs местный class check (EP-MM-093): material class attribute mandatory; cross-check on issue vs texkarta.
  - ECT/qavat gofra check (EP-MM-094): gofra card has qavat (3/5), ECT mark, граммаж; cross-check vs texkarta.
- QC 3-decisions (EP-MM-095/POS Q31): passed / conditional (with restriction, record who authorized) / rejected.
- Reject → vendor return document (EP-MM-013/076): rejection creates return doc (reason/qty/sum); ombor chiqim; vendor debt reduced or credit-note.
- Shortage (EP-MM-071/126): short receipt recorded → deducted from payment → affects vendor rating.
- Over-delivery tolerance (EP-MM-125): ±5% configurable; beyond → requires approval.
- Commission acceptance for expensive import batches (EP-MM-136): multi-signature (ombor + laborant + ta'minot).
- Lot traceability (EP-MM-096): full chain: incoming batch → warehouse → issue → PP order. Kitob: "текширилган хом-ашё партиялари сони".
- Brak reason journal (EP-MM-097): каждому браку → sabab + decision + vendor response log; feeds into vendor rating.
- Etalon sample (EP-MM-100): approved reference sample (photo/dimensions/mark) stored; incoming compared to it.
- Waybill (nakladnoy) scan attachment (EP-MM-127/059): nakladnoy number + date + scan file on receipt doc.
- Vendor articul → our code mapping (EP-MM-128): cross-catalog (vendor code ↔ our material code); auto-match on receipt.

**E1 principle**: lab result triggers alert; PP block only confirmed by QC/supply head — not auto.
**E4 principle**: physical receipt scan happens on IoT/POS tablet (EXTERNAL_IN) — link, don't rebuild.
**Permission**: confirm DDL for receipt/quarantine/lab-result tables before creating. If tables exist, add missing columns only.
**Verify**: receive partial PO → lab form → set shartli → verify PP cannot issue until cleared; rejection → return doc created in DB.
**Commit label**: `feat(mm): phase-4 receipt-qc-lab`

---

### PHASE 5 — Vendor rating + Finance integration (AP/GL)

**Scope** (decided features only):
- Vendor rating auto-calculation (EP-MM-001/041): recalculated after every receipt/brak. Formula (owner override EP-MM-002/040):
  - **sifat 40%** (lab pass%, brak%) + **muddat 30%** (promised vs actual date EP-MM-133) + **narx 20%** (price vs market) + **hujjat 10%** (doc completeness). Weights = configurable admin setting.
  - Lab pass % feeds rating as separate metric (EP-MM-098).
  - Manager can add comment/override but cannot change score without audit trail.
- Low-rating vendor alert (EP-MM-003): auto warning + director approval required for new PO. Full block = blacklist (not just low rating).
- New vendor onboarding (EP-MM-101): starts in "sinovda" status; trial batch must pass lab → then "tasdiqlangan".
- Multi-vendor per material (EP-MM-073/132): primary + backup vendors per material; if primary unavailable → system suggests backup. Backup analog requires lab confirmation (EP-MM-130).
- Accounts payable (EP-MM-015/065): per-vendor payable balance + aging buckets (0-30 / 31-60 / 60+ days). Separate screen from AR (EP-FIN-015 rule).
- Payment due CRON (EP-MM-017/066): 3 days before due → notification; overdue → red + director alert. Due-date calculated from receipt date (EP-MM-067).
- 3-way match payment block (EP-MM-018/052): if PO+receipt+invoice mismatch > 3% → payment blocked until approved.
- GL posting on receipt (EP-MM-023/026/POS Q43): each receipt → `gl_entries` Debit (materials) / Credit (accounts payable). Use canonical `gl_entries` table only. ShVB ЗНО/ЗВС flow: payment creates ЗНО ariza in Finance.
- Advance (avans) tracking (EP-MM-068/140): advance linked to PO; cleared on receipt; open advances list. Import avans cycle: advance → receipt → zachet → residual debt.
- Landed cost for imports (EP-MM-033/075): import costs (customs/VAT/broker/transport) summed → allocated to material qty → added to unit cost. Connects to Finance tannarx.
- Currency exchange posting (EP-MM-034/054): original currency stored; UZS equivalent at MB rate on receipt date; exchange difference booked to GL on payment date.
- Vendor reconciliation act (EP-MM-083): any period → auto reconciliation (opening + receipts + payments = closing), PDF export. POS Q55 format.
- Procurement budget (EP-MM-081): monthly budget (total + per category); 90% → alert; 100% → director approval.
- Supplier KPI panel (EP-MM-028/137): vaqtida% / narx tejovi / brak% / qarz aylanishi / faol PO soni. Links to card-model ЦКП (EP-MM-027).

**E2 principle**: KPI panel values link to org-card ЦКП of the ta'minot bo'limi.
**E6 principle**: GL posting uses only `gl_entries`; supplier debt in one canonical AP table.
**Permission**: confirm GL posting DDL approach with owner before touching `gl_entries`.
**Verify**: receive goods → GL entry created in `gl_entries` DB (SELECT proof) → AP balance updated → due-date CRON fires in test.
**Commit label**: `feat(mm): phase-5 vendor-rating-finance`

---

### PHASE 6 — Material master-data + internal logistics + analytics

**Scope** (decided features only):
- Material groups (EP-MM-131): hierarchy (qog'oz/gofra/kimyo/folga/qadoq/asbob); links to existing `master_categories` seed; reporting + budget per group.
- Material spec cards for finishing materials (EP-MM-103/104/105/106/107): lak (ВД лак/glyans/matt, kg/litr, min-stock) · folga (rang, eni, rulon-uzunligi) · lamination (glyans/matt, mkr, eni) · bo'yoq (Pantone kod, kg) · kley/qadoq materials. Each gets a `material_cards` entry with min-stock + reorder-trigger.
- Customer-supplied material (EP-MM-108/109): material card "owner: zavod/mijoz"; mijoz materials not purchased (reception only); not included in cost. Trafaret/klishe register (owner: mijoz/zavod, design, shelf location).
- Roll/sheet spec (EP-MM-110): rulon specification (eni mm, diameter, uzunlik) saved; links to format planning.
- Waste/offcut norm (EP-MM-111): norm % per order vs actual; deviation > threshold → alert. Connects to PP efficiency.
- FIFO/FEFO dispatch (EP-MM-112/115): FIFO for non-expiry materials; FEFO for dated (lak/kley/bo'yoq — срок годности).
- Bin location (EP-MM-113): freeform location code per batch (A-3-12, Tokcha-5); follows POS Q33 pattern.
- Hazardous material (EP-MM-116): MSDS file + storage conditions (temperature, separate warehouse zone).
- Rohler/poddon inventory (EP-MM-118): internal transport equipment register (number, status: ishlayapti/ta'mirda/yaroqsiz, last inspection). Links to Assets module.
- Internal transfer document (EP-MM-119): between uchastkalar (source → destination uchastka, qty, time, responsible). Links to POS Q25 INTERNAL_TRANSFER.
- Logistics disruption journal (EP-MM-120): what was missing, how long stopped, reason → feeds MES downtime/OEE.
- Waste/scrap disposal log (EP-MM-121/122): waste type (qog'oz-qirqim/brak/plastik) + qty + date; secondary market sell/internal reuse document. Makulatura income → Finance.
- Outbound delivery document (EP-MM-123): finished-goods dispatch (order/client/driver/vehicle/route/delivered-time). Links to SD module.
- Seasonal demand forecast (EP-MM-139): 12-month history → seasonal forecast → recommended stock levels. AI drafts; manager confirms. Mark as AI action.
- Transport master-data (EP-MM-020/059/060): vehicle register (make/plate/fuel-norm l/100km) + driver register. Build master-data structure. ⏳ **Fuel accounting formulas (EP-MM-062/063/064) = 501 until owner completes deep-dive.**
- Vendor lead time (EP-MM-070): per-vendor lead time record; system alert "order by X date to receive by Y date".
- Vendor frame contract + delivery schedule (EP-MM-134): ramkali shartnoma + schedule; each delivery deducted from contract balance.
- Price negotiation log (EP-MM-135): date/who/initial-price/final-price/discount%/comment. Links to tender selection history (EP-MM-058).

**E3 principle**: AI seasonal forecast → draft only; manager confirms stock levels.
**Permission**: check which tables exist before any DDL; get owner approval for each new table.
**Verify**: create lak material card → set min-stock → drop warehouse_stock below min → auto-draft requisition created in DB → confirm FIFO vs FEFO logic.
**Commit label**: `feat(mm): phase-6 material-master-internal-logistics`

═══════════════════════════════════════════════════════════════
## 4. DoD — ALL 7 CONDITIONS (per phase, from LOYIHA-QOIDALARI D5)

1. **BE real** — CRUD + Result<T> + Zod validation + real DB INSERT/UPDATE (no stubs, no echo, no `[] as unknown`).
2. **FE real** — ListPage/FormPage/DetailPage template + EP tokens + loading/error states + form persists (enter → save → reload → visible).
3. **Docs** — brief update to `docs/` noting what was built, what deferred.
4. **Tests** — at least BE unit test per service method + FE smoke (form renders, mutation called).
5. **i18n** — all labels in UZ + RU translation files; no hardcoded Uzbek/Russian strings in TSX.
6. **Edge cases** — null checks, empty lists, missing FK, over-delivery, currency mismatch, duplicate vendor.
7. **Automation** — CRON/EVENT/AI where the decision map says so (payment-due CRON, low-stock EVENT, lab-gate APPROVE, price-alert EVENT, rating auto-recalc EVENT).

**Each operation logs its EP-MM-### op-code** to the audit_log (actor + timestamp + op-code + payload).

═══════════════════════════════════════════════════════════════
## 5. RAILS (non-negotiable per phase)

| Rail | Rule |
|---|---|
| Permission gate | Before every file/DB change: `file:line` + exact change + reason → owner "ha". Recommendation ≠ permission. |
| Verify-don't-trust | Treat every existing audit claim as unverified. Confirm with `_audit/q.cjs` (read-only) + `tsc` + live DB SELECT. |
| Separate commit | Each phase = its own commit. Never mix phases. `git add <file>` only. |
| No regression | After every change: previously working endpoints still return correct data. Run `scripts/run-all-reviewers.sh`. |
| No rewrite | ~70% exists. Fix and connect. Do not replace working code. |
| Honest 501 | If DB schema not ready → `throw new HttpException('...', HttpStatus.NOT_IMPLEMENTED)`. Never fake success. |
| DDL = owner | Any new `CREATE TABLE` or `ALTER TABLE` requires `APPROVED:` comment in migration file + owner confirmation. |
| Uzbek report | After each phase write a short Uzbek report: what was done, what was deferred, commit hash. Show owner, wait for "davom". |
| Canonical tables | `warehouse_stock` for stock; `gl_entries` for GL; `material_cards` for materials; `sales_orders` for orders. No new parallel tables for these concepts. |
| Fuel/transport formulas | EP-MM-062/063/064 → 501 stubs until owner deep-dive. Transport master-data (vehicles/drivers) is fine to build. |

═══════════════════════════════════════════════════════════════
## 6. STOP POINTS (mandatory owner check)

- ⛔ **After Phase 0 RE-AUDIT** — show gap table, get approval before any build.
- ⛔ **Before any DDL** (new table or column) — confirm `APPROVED:` with owner (Q-35).
- ⛔ **Before touching `gl_entries` / canonical GL** — confirm posting approach with owner.
- ⛔ **Before Phase 5 vendor-rating formula** — show formula (sifat 40%+muddat 30%+narx 20%+hujjat 10%) to owner, confirm weights are saved as configurable settings not hardcode.
- ⛔ **Fuel formulas (EP-MM-062/063/064)** — do NOT build until owner completes 10-question deep-dive. Mark as 501 and note in report.
- ⛔ **After each phase** — show Uzbek report, wait for "davom" before continuing.
