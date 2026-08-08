# EXECUTOR PROMPT #03 — BUILD T1 GOLDEN THREAD (oltin ip: SD→PP→MES→QC→WMS→FIN)
> Runs AFTER #02 ORG is built (cards exist). The business heart: one real order flows end-to-end, event-driven.
> Advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES (same as #01/#02)
🟢 EXECUTOR. Read `CLAUDE.md` + constitution first. All hard rules apply: Zod · Drizzle · Result<T> · parametrized SQL · file ≤900/func ≤150 · **no fake (Q-40/43)** · **verify-don't-trust (Q-29)** · **permission gate (Q-28)** · **DDL = owner approval (Q-35)** · **no regressions (Q-39)** · `git add <file>` · commit every step · report after each phase in Uzbek · **NO REWRITE — fix & connect (~70% exists, mostly UNWIRED)**.

## 1. GOAL (Q-40 — the measure of "correct")
The "golden thread" (vizyon #21): **ONE real order flows boshdan-oxir, uzilishsiz, event-driven**:
```
CRM lead → SD order → Avans(70%) → AI-plan(reserve) → PP(MPS) → MES(produce) → QC → WMS(finished) → Delivery → FIN/GL
```
This is BOTH the business heart AND the acceptance test. Today the modules are ~85% built individually but **UNWIRED** (events fire into no listeners). Your job = **connect the spine**, not rebuild.

**Source of truth:**
- `docs/TRANSMISSIYA-XARITA-HISOBOT-2026-06-05.md` (transmission map — the known breaks)
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` (SD/PP/MES/QC/WMS/FIN sections) + `decisions/06-sd…10-warehouse…03-finance.md`
- `docs/audit/OMBOR-KASSIR-INTERVYU` (supply/warehouse flow) + `CHAT-TARIXI-YANGI` (AI-planning 7-step, gofra formula, routing)
- `docs/audit/IOT-MES-CURRENT-STATE-2026-06-08.md` (MES/IoT current build)

**Known breaks to fix (verify each live first — Q-29):** SD↔`sales_orders` bridge · GL posting → `entries` (not log) · `manager_id` 0/30 NULL backfill · MES→QC no-op stub · IoT anomaly handler no-op · 13+ zero-listener events · outbox runs but `domain_events=0`.

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT the golden thread (READ-ONLY) — FIRST
Trace ONE order through the chain live; at each hop, confirm: does the event fire? is there a listener? does the next stage's table get a row? `node _audit/q.cjs` + endpoint probe. Write `docs/OLTIN-IP-RE-AUDIT-2026-06-08.md`: hop · event · listener? · next-table-write? · break. → STOP, show owner, approve.

═══════════════════════════════════════════════════════════════
## BUILD PHASES (each: permission → fix/connect → verify (event fires + next-table row, DB-proof) → commit → report → wait)

### PHASE 1 — SD order is canonical + real line items
- Canonical = **`sales_orders`** (`sd_sales_orders`=VIEW; `orders` dropped). Order line items = **products only** (tayyor mahsulot), NOT material_cards — material consumed inside production, customer never sees it (CHAT-TARIXI).
- Order create → real row + line items (`sales_order_items`). Avans 70% recorded (SD vizyon). Customer credit-limit gate (EP-FIN-060/SD-060).

### PHASE 2 — SD → AI-PLANNING (7-step) → PP/MPS
- On order confirm, fire the AI-planning chain (CHAT-TARIXI 7-step): **order → material check (AI reads ombor) → RESERVE → route → time-estimate → plan+approve → execute+replan**.
- Missing material → Ta'minotchi request → CC 3-savat → Kanban → buy → logistics → ombor kirim (supply chain, OMBOR-KASSIR §9).
- PP/MPS reads the order (fix the known `pp-mps` drift if still present); manager only confirms, FIFO queue.

### PHASE 3 — PP → MES (production) + routing
- Production session per order (MES exists — IOT-MES-CURRENT-STATE). Routing = **flekso→ofset→kashirovka→tigel→qadoqlash** (CHAT-TARIXI A3), each sex: material in → consume → semi-finished to next → remainder controlled.
- Operator IoT-tablet: scan material before work, record produce/brak/downtime. Gofra/sloy formula (m²/kg/grammaj, configurable). Fix MES→next-stage wiring.

### PHASE 4 — MES → QC (fix the no-op stub)
- On session complete, fire MES→QC for real (currently a no-op stub). Staged inspection (QC vizyon). Brak → responsible (HR-057: IoT-tablet entry → QC sex-lead/technologist; AQL 2.5; brak attribution kirim-vs-this-stage EP-QC-090). QC 3-decision: QABUL→warehouse / REWORK→MES / CHIQARISH→supplier.

### PHASE 5 — QC → WMS (finished goods)
- QC pass → finished-goods into canonical **`warehouse_stock`** (conflict #8; `stocks`=batch/expiry kept). Structured bin (WMS-073). Finished-goods rental: 30-day free then per-m² → manager (WMS-019). FIFO/FEFO.

### PHASE 6 — WMS/Delivery → FIN/GL (atomic, canonical)
- Movement/sale → GL posting into **canonical `entries`/`gl_entries`** (NOT a log; NOT `gl_journal_entries` — that's SAP #76). Atomic debit/credit in a transaction (the FIX3 pattern). Tushum → 4-account auto-split (EP-FIN-005). Invoice 3 types (internal/customer/export).

### PHASE 7 — END-TO-END ACCEPTANCE TEST
- Create ONE real order → drive it through all hops → DB-proof a row exists at EACH stage (sales_orders → plan → mes_session → qc → warehouse_stock → entries). This proves the thread is unbroken. Write it as an automated acceptance test (Vitest + Supertest + real PostgreSQL) so it stays green.

═══════════════════════════════════════════════════════════════
## DoD per phase (7 conditions) + EP-<MODULE>-### op-code logged per operation.
## RAILS: per-phase permission · verify (event fires + next-table row + DB-proof) · separate commits · no regressions · no rewrite · honest 501 over fake · DDL=owner-approval · report Uzbek after each phase, wait for "continue".
## STOP POINTS: after Phase 0 re-audit · before any DDL · before changing canonical table choices · after each phase.
