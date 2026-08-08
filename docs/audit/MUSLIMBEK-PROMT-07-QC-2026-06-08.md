# EXECUTOR PROMPT #07 — BUILD T1: QC / SIFAT NAZORATI
> Foundation (prompt #01) done. Golden-thread module: QC is the quality gate for every production step.
> Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES
You are the 🟢 **EXECUTOR**. Read `CLAUDE.md` + `docs/agent-constitution.md` + `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` **first**. All hard rules apply:

**Code quality (CLAUDE.md §B + LOYIHA-QOIDALARI §B):**
- TypeScript strict · Zod only (no class-validator) · Drizzle ORM (no `sql.raw(variable)`) · Result<T> (no throw/null) · file ≤900 / func ≤150 · constants in `business.constants.ts` · controller = transport only · service uses repo, never `db.*` directly · ConfigService not `process.env`.

**Correctness (§C):**
- **No fake (Q-40/43):** every form → real DB INSERT/UPDATE. `{ok:true}` / echo / `[] as unknown` BANNED. Honest HTTP 501 over fake. Verify: insert → reload → visible (round-trip).
- **Verify-don't-trust (Q-29):** treat every catalog/audit claim as stale. Confirm with code + DB (`_audit/q.cjs` read-only) + live probe before building.
- **Permission gate (Q-28):** before any change: `file:line` + exact change + reason → owner says "ha".
- **DDL = owner approval (Q-35):** every new table / column needs `APPROVED:` comment in the migration + explicit owner sign-off. Stop and show before any DDL.
- **No regressions (Q-39):** deleted code stays deleted; working features must keep working after every change.
- **No rewrite (§C6):** system is ~70% built — fix & connect. Full rewrite BANNED.

**Security (§F):** RBAC from card/position; field-level guard (salary only to entitled); JWT guard on every controller; no hardcoded secrets; no log commits.

**Design (mandatory §G + Q-41/Qoida 21):** EP Linear Soft tokens (`var(--ep-*)`, `var(--mod-*)`) + existing templates (ListPage / FormPage / DetailPage / DashboardPage). QC module color = EP Linear Soft quality/warning family. No new design, no inline raw colors. Tab depth ≤ 2 (Q-42). Buttons STANDARD placement (Q-41).

**Process (§I):** `git add <exact-file>` only (add -A BANNED) · commit every phase · report to owner in Uzbek after each phase, then wait for "davom et".

═══════════════════════════════════════════════════════════════
## 1. WHY THIS MODULE / GOAL (Q-40 — measure of "correct")

**QC (Sifat nazorati)** is a **T1 core / golden-thread** module. Vision = "measure of correct" means: every production step has a quality gate. A shipment without QC approval cannot leave the warehouse. A defect without a root cause is not a closed defect.

**The РД-5 stepwise chain (kitob law — Abdullaev):**
1. Zakaz start → operator self-check (texkarta + material + parameters)
2. Every smena → ОТК interim quality check on semi-finished goods
3. Defect found → СОЗ notified immediately → texnolog + uchastka head evaluates
4. Decision by bosh texnolog / ishlab chiqarish rahbari (ОТК gives evidence, NOT the verdict)
5. Order finish → ОТК: QABUL / REWORK / CHIQARISH
6. Month end → Совершенствование recurring-defect analysis + corrective action

**Owner's 4 new business decisions (OCHIQ-JAVOBLAR QC section):**
- **EP-QC-003** AQL = **standard AQL 2.5** (sample size from lot size table; Ac/Re per severity).
- **EP-QC-005** Defect weight = **3 levels**: kritik (0% pass) / jiddiy / kichik (cosmetic threshold).
- **EP-QC-072** Sort = **1/2/3-sort + brak, each with a price coefficient** (usable product is not scrapped, sold cheaper).
- **EP-QC-090** Defect causation = **"incoming defect" (previous step) vs "this step defect" separate** (fair accountability).

**Source documents (read these — build to them, do NOT invent):**
- `docs/audit/decisions/09-qc.md` — full 134-question decision map (100 answered / 34 open with A-defaults)
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` → QC section (owner's 4 new decisions + A-defaults)
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` — project rules block
- `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` — IoT tablet as floor hub, GSD/ЦКП formulas
- `docs/audit/IOT-MES-CURRENT-STATE-2026-06-08.md` — MES→QC currently a no-op stub (MEMORY: transmission map); build the real event bridge
- `docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md` — warehouse QUARANTINE/QC/DEFECTIVE zones, kirim karantin flow

**Canonical tables (LOYIHA-QOIDALARI §H — do NOT create duplicates):**
- Orders → `sales_orders` (`sd_sales_orders` = VIEW)
- Stock → `warehouse_stock` (`current_stock` = VIEW)
- GL → `entries` / `gl_entries`
- Check for existing: `qc_reclamations` (exists per memory schema_dedup BOSQICH 10), `shift_handovers` (VIEW → `mes_shift_handovers`).

**6 cross-cutting build rails (LOYIHA-QOIDALARI §E):**
- **E1. AI observes → human confirms negative effect:** AI flags defect anomaly / brak-risk / operator downtime — but jarima / ball reduction / razryad demotion only with explicit human approval. Never automatic.
- **E2. Card-centric:** QC inspector role comes from org card (razryad-gated: operator = self-check; ОТК = interim/final). Brak % flows card → GSD → operator rating (EP-QC-023/121). Data aggregates card → profile.
- **E3. AI plans:** AI brak-risk prediction (EP-QC-126) flags order before production. AI CAPA auto-opens on threshold breach (EP-QC-127). AI sends daily/weekly quality digest (EP-QC-125).
- **E4. Operator IoT-tablet = floor hub:** Brak entry (EP-QC-083), pre-production checklist (EP-QC-105), smena handover quality note (EP-QC-120) — all on the operator tablet (POS Monitor).
- **E5. Org-chart routing:** QC override → must go through sifat boshlig'i / director (EP-QC-082). Escalation follows org-chart vertical (Vysotskiy 7).
- **E6. Single canonical truth:** MES→QC bridge (was no-op stub) → build real event. No parallel QC tables; reuse `qc_reclamations`.

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT (READ-ONLY) — MANDATORY FIRST STEP

QC is partially built (transmission map: MES→QC = no-op stub; `qc_reclamations` exists). **Do NOT rebuild. Map what EXISTS vs what the vision needs.**

**0.1 DB audit** (`_audit/q.cjs` read-only):
- Tables: list all `qc_*` tables + columns + row counts.
- Check `shift_handovers` / `mes_shift_handovers`, `warehouse_stock`, `qc_reclamations`.
- Note: any `inspection_*`, `defect_*`, `brak_*`, `quality_*` tables?

**0.2 BE audit:**
- Find all QC controllers, services, repos in `apps/api/src/modules/`.
- For each endpoint: real DB query vs stub (echo / 501 / `{ok:true}`)?
- Check MES→QC event handler: does it exist and does it do real work?

**0.3 FE audit:**
- Find QC pages in `artifacts/erp-dashboard/src/pages/`.
- What renders, what saves, what shows 501?

**0.4 Gap table** → write to `docs/QC-RE-AUDIT-2026-06-08.md`:
| Vision feature (EP-QC-###) | Exists? | Gap | Effort |

→ **STOP. Show owner the gap table. Get explicit approval before Phase 1.**

═══════════════════════════════════════════════════════════════
## BUILD PHASES

Each phase: permission gate → BE + FE parallel → verify (tsc 0 + DB-proof + FE persist round-trip) → DoD → separate commit → report in Uzbek → wait for "davom et".

---

### PHASE 1 — Master-data: Defect catalog + QC parameters
**Scope:** The foundation dictionary every other QC feature depends on.

**BE tasks:**
- Defect type master-data (EP-QC-004/037/110): codified list with groups (bosma / biriktirish / material / o'lcham); seed from "кўп учрайдиган хатолар" (Nazirov); i18n UZ+RU+UZ-Cyr (EP-QC-130). Table: check for existing `defect_types` — if absent, request DDL approval (STOP).
- Defect severity 3-level (EP-QC-005/038): kritik / jiddiy / kichik. Each with AQL Ac/Re (kritik=0, owner decides jiddiy/kichik threshold — A-default: jiddiy Ac=1 / kichik Ac=3).
- AQL 2.5 table (EP-QC-003/054/056): lot size → sample size → Ac/Re per severity. Store as configurable master-data (not hardcoded).
- Sort levels (EP-QC-072): 1/2/3-sort + brak; price coefficient per sort (owner set in admin UI). Configurable.
- Brak causation split (EP-QC-090): "incoming defect" vs "this-step defect" — flag on every brak record.
- Physical parameter norms (EP-QC-015/031/033): gramaj g/m², namlik %, RCT/BCT/SCT, Bursting, qalinlik — per material_card; min/max/unit fields. Link to GOST field (EP-QC-032) — text, owner fills values.
- Product family QC norm link (EP-QC-096): KT / PT / E prefix → norm set auto-attached.
- Material type norm variant (EP-QC-091): Топлайнер / Тестлайнер / Меловка → separate tolerance. Reads from `raw_materials` (existing canonical table).
- Food-safety block (EP-QC-092): makulatura-based paper + food-type order → QC block event + warning.
- Tolerance by product risk category (EP-QC-116): tibbiy/dori = 0%, oziq-ovqat = low, sovg'a = medium — configurable per category.

**FE tasks:**
- Admin: defect catalog CRUD (ListPage + FormPage templates).
- Admin: AQL table view; sort levels config; physical norms per material card.
- All forms: real save with round-trip verify. i18n UZ/RU.
- Permission: only sifat boshlig'i / super_admin can edit master-data.

**Verify:** tsc 0 · DB: INSERT defect_type, read back · FE: save norm → reload → visible.
**DoD:** all 7 conditions. Each operation logs `EP-QC-004`, `EP-QC-005`, `EP-QC-003`, etc.
**DDL stop:** if any new table needed → show owner → `APPROVED:` comment → then migrate.

---

### PHASE 2 — Inspection gates: HOP-4 + pre-production checklist
**Scope:** Stepwise quality gate — the 4 control points from РД-5 + pre-production hard block.

**Owner overrides to cite:**
- EP-QC-007: hard block — MES/production cannot open without pre-production checklist passed.
- EP-QC-008: final "passed" mark required → shipment block.
- EP-QC-082: override only by sifat boshlig'i / director + mandatory reason + journal entry + customer notified.

**BE tasks:**
- 4 inspection points (EP-QC-001): xom-ashyo kirimi → bosma → biriktirish → final. Each as a `qc_inspection` record (linked to order + stage + operator + result).
- Inspection plan per texkarta (EP-QC-002/076): parameters + tolerance + sample count — drawn from material_card / texkarta once, reused per order.
- Pre-production checklist (EP-QC-105/007): material + qolip + fayl + namuna + gramaj — all checked; `production_session` start BLOCKED until checklist status = PASSED. Event: `PreProductionChecklistPassedEvent` → MES unlocks.
- Incoming material karantin (EP-QC-009/059/071): EXTERNAL_IN receipt → auto QUARANTINE status → QC approval → main warehouse OR DEFECTIVE zone. Reads `warehouse_stock` canonical table. Event: `MaterialKarantinReleasedEvent`.
- Material mismatch block (EP-QC-095): at operation start, QC compares texkarta material vs issued material code — mismatch → block event.
- Final shipment gate (EP-QC-008/065/117): order "100% ready" status only when final QC = QABUL. Chiqim blocked without QC pass. Override: EP-QC-082 (sifat boshlig'i) + reason + log.
- QC skip detection (EP-QC-119): auto-detect if a required inspection point was bypassed → flag + responsible person logged.
- Razryad-gated roles (EP-QC-021): operator = self-check (own operations); ОТК role (razryad-qualified) = interim smena + final. RBAC from org card.

**FE tasks:**
- Operator tablet (POS Monitor / floor tablet): pre-production checklist form (E4 IoT-tablet rail); simple checkboxes → submit → real save.
- Inspector UI: inspection record form (stage selector, parameter values vs norm, auto pass/fail, photo upload EP-QC-079).
- QC gate status badge on order detail page.
- Override dialog: reason + confirmation (sifat boshlig'i only, Q-14 ConfirmDialog pattern).

**Verify:** start MES without checklist → blocked; complete checklist → unblocked; add material mismatch → block fires; final QC QABUL → chiqim unblocked.
**DoD:** EP-QC-001, EP-QC-007, EP-QC-008, EP-QC-009, EP-QC-021, EP-QC-065, EP-QC-095, EP-QC-105, EP-QC-119.

---

### PHASE 3 — Defect recording + MES event bridge
**Scope:** Real-time defect capture at each operation; MES→QC event bridge (currently no-op stub).

**Owner overrides to cite:**
- EP-QC-083: every operation close must prompt for brak soni + reason (mandatory field).
- EP-QC-090: each brak record has TWO causation fields: "incoming defect" (prev step) vs "this step". Fair accountability.
- EP-QC-086: brak auto-linked to smena (den/noch) + operator + yordamchi from MES session.

**BE tasks:**
- MES→QC event bridge (EP-QC-029): subscribe to `OperationClosedEvent` from MES → create `qc_defect_record` with brak_count + reason (mandatory). Currently a no-op stub — build the real handler. STOP and confirm current stub location before replacing.
- Defect record fields (EP-QC-039/040/042): stage (kirim/jarayon/tayyor/reklamatsiya) + defect_type (from catalog) + severity + quantity + unit + brak % auto-calc + smena + operator_id + mashina_id + causation (incoming_defect / this_step_defect EP-QC-090) + photo (min 1 required EP-QC-079).
- Operation-type brak split (EP-QC-085): defect per operation (Резка / Печать / Ламинация / Лак / Высечка / Тигель / Беговка / Автокляй / Кашировка...) — operation_type field from MES.
- Setup (приладка) brak separate (EP-QC-087): is_priladka boolean on defect record; separate norm threshold.
- Brak limit breach event (EP-QC-089/024): brak% > threshold → event → СОЗ notified + MES auto-pause proposal → QC decision (continue / stop / re-setup). Notification via Telegram (EP-QC-024). AI observes, human confirms stop (E1).
- Smena handover quality note (EP-QC-120): mandatory shift handover record (open defects + machine state + unfinished orders). Uses `shift_handovers` / `mes_shift_handovers` canonical table.
- Downtime ↔ priladka brak link (EP-QC-088): downtime event → auto-tag next priladka brak batch as downtime-caused.
- Digital signature on every QC record (EP-QC-111/074): laborant + datetime + tool + smena auto-stamped (audit trail).

**FE tasks:**
- Operator tablet (E4): operation close dialog — "brak soni + sabab" mandatory fields; photo attach; submit → real save.
- Incoming defect vs this-step defect selector (EP-QC-090) — radio group in the form.
- Brak limit alert banner on sex monitor screen.
- Shift handover form: quality summary section.

**Verify:** close operation without brak field → blocked; fill brak + reason + photo → saves to DB; brak% > threshold → Telegram notification fires; smena handover record in DB.
**DoD:** EP-QC-029, EP-QC-039, EP-QC-040, EP-QC-042, EP-QC-083, EP-QC-085, EP-QC-086, EP-QC-087, EP-QC-088, EP-QC-089, EP-QC-120.

---

### PHASE 4 — Reclamation + returns + rework workflow
**Scope:** Customer reclamation lifecycle, returned goods re-inspection, rework→MES bridge.

**Owner overrides to cite:**
- EP-QC-010/041: every defect gets a verdict: QABUL / REWORK (→MES) / CHIQARISH (→ta'minotchiga). Rework → mandatory re-inspection before ship (EP-QC-030).
- EP-QC-047: compensation result auto-creates Finance credit-note (Finance module connector).
- EP-QC-070: return accepted → credit-note auto in Finance (sum = qty × price).

**BE tasks:**
- Reclamation CRUD using existing `qc_reclamations` table (EP-QC-011/012/043): mijoz + buyurtma + partiya + smena + material_lot + defect_type + qty + photo + customer demand + status zanjiri (Yangi→Tergovda→Tasdiqlandi/Rad→Hal qilinmoqda→Yopildi). Mandatory fields include photo (EP-QC-079).
- Reclamation SLA cron (EP-QC-045): first response 1 ish kuni / investigation 3 / final 10 → escalate to sifat boshlig'i + director via Telegram if overdue (E5 org-chart routing).
- 8D / root-cause record (EP-QC-013/048): for kritik/jiddiy reclamations: root_cause + corrective_action + responsible_card_id + due_date. Linked to Совершенствование cycle.
- CAPA auto-open (EP-QC-127): recurring defect type exceeds threshold → auto CAPA task + responsible + deadline. AI flags pattern, human confirms action (E1).
- Returned goods flow (EP-QC-066/067/068): return receipt form → QUARANTINE zone → re-inspection → verdict (resellable / 2-sort / rework / utilizatsiya). Uses `warehouse_stock` canonical. Event: `ReturnedGoodsDecisionEvent`.
- Rework → MES bridge (EP-QC-029/030/118): QC "REWORK" verdict → auto create rework production task in PP/MES + material requisition. Re-inspection mandatory after rework cycle.
- Finance credit-note connector (EP-QC-047/070): reclamation compensation type (almashtirish / pul qaytarish / chegirma / kredit) → Finance event. Credit-note auto in Finance (amount = qty × price from sales_orders).
- Defect reason category (EP-QC-107/133): dizayn / ishlab chiqarish / material / qolip / operator / rejalashtirish — each links to its department GSD/karta (E2 card-centric).
- Sort-level verdict (EP-QC-072): 2-sort / 3-sort goods → Ombor with price coefficient tag.
- Incoming-defect causation split (EP-QC-090): on each brak record in reclamation — who caused it (zavod / mijoz / logistika) for fair cost allocation (EP-QC-069).

**FE tasks:**
- Reclamation list (ListPage) + detail/create (DetailPage + FormPage). Status badges. Photo viewer.
- Root-cause / 8D section in reclamation detail (collapsible, only for kritik/jiddiy).
- CAPA task link in reclamation detail.
- Returned goods receipt form.
- Sort verdict dialog (QC inspector only).

**Verify:** create reclamation → DB record; attach photo → stored; change status → updated; SLA overdue → Telegram fires; rework verdict → PP task created; credit-note event → Finance receives it.
**DoD:** EP-QC-010, EP-QC-011, EP-QC-012, EP-QC-013, EP-QC-030, EP-QC-041, EP-QC-044, EP-QC-045, EP-QC-047, EP-QC-048, EP-QC-066, EP-QC-067, EP-QC-068, EP-QC-070, EP-QC-072, EP-QC-107, EP-QC-118, EP-QC-127.

---

### PHASE 5 — Quality certificate + quality dashboard + traceability
**Scope:** Auto quality certificate per order; KPI dashboard; full lot traceability.

**Owner overrides to cite:**
- EP-QC-061: cert number = auto sequential SF-2026-NNNNN (owner confirms prefix format first — STOP).
- EP-QC-063: multilingual template uz/ru/en (i18n standard). Owner confirms export template need.
- EP-QC-082: QC skip log must appear in the dashboard.

**BE tasks:**
- Quality certificate (EP-QC-014/060-064): auto-generate on final QC QABUL. Fields: cert# (SF-2026-NNNNN) + sana + mijoz + mahsulot + partiya + miqdor + GOST/TU + measured parameters (norm vs actual vs result) + laborant_id + sifat_boshlig'i_id + QR code (link to DB record). PDF export (uz/ru/en template). Requires DDL approval if new table.
- Lot traceability (EP-QC-081/114): raw_material_lot → stanok → smena → tayyor partiya → mijoz — full chain queryable. View / materialized per order. Shows in reclamation detail.
- Material lot ↔ brak link (EP-QC-114): brak record linked to material_lot; ombor confirms lot at issue.
- Supplier quality rating (EP-QC-026/059/078): incoming inspection results aggregate per vendor → brak% + rejection rate → vendor scorecard. Reads from `raw_materials` / incoming inspection records.
- Internal vs external defect split (EP-QC-122): ratio = QC effectiveness KPI (internally caught / escaped to customer).
- Quality KPI cron (EP-QC-077/018/025): monthly: brak% / FTQ / reklamatsiya count+type / smena/stanok breakdown / DPMO (start with brak%, sigma optional pending owner) / COQ (brak material cost + rework labor + reclamation compensation — owner confirms formula, STOP). CRON auto-runs.
- Pareto analysis (EP-QC-020): defect by type/cause/smena/material — top-N. Used by Совершенствование.
- AI brak-risk prediction (EP-QC-126): before order production, AI scores risk (material + operator + machine + smena pattern) → risk badge on order. AI flags, operator sees, production continues (E1 — no auto-block).
- Daily/weekly digest to owner Telegram (EP-QC-125/019): cron sends quality summary. Role-based dashboard (owner = trend; sifat boshlig'i = detail; inspektor = own tasks).
- Document version control (EP-QC-027): QC normatives with version + "in-force" flag + sana.
- Calibration tracker (EP-QC-073): instrument → calibration_date + next_due → cron reminder ("muddat o'tdi → ishlatmang").
- Quality audit (internal, EP-QC-128): periodic audit schedule + checklist + findings + corrective action (Совершенствование link).
- Order close quality summary (EP-QC-124): auto-generate on order close: plan/fakt/brak/operation breakdown/final QC decision.

**FE tasks:**
- Quality certificate viewer + PDF download (DetailPage).
- Traceability view on order detail (collapsible chain: material_lot → smena → brak → final).
- KPI dashboard (DashboardPage template): brak trend chart, Pareto chart, FTQ gauge, reclamation count, internal/external split, AI risk badges per order.
- Supplier scorecard page (ListPage).
- Calibration instrument list (ListPage + due-date badge).

**Verify:** final QC QABUL → cert auto-created in DB; PDF downloads with real data; KPI cron produces non-zero aggregates; traceability chain resolves to material_lot.
**DoD:** EP-QC-014, EP-QC-019, EP-QC-020, EP-QC-025, EP-QC-026, EP-QC-059, EP-QC-060-064, EP-QC-073, EP-QC-077, EP-QC-078, EP-QC-081, EP-QC-114, EP-QC-122, EP-QC-124, EP-QC-125, EP-QC-126, EP-QC-128.

---

### PHASE 6 — Operator GSD link + brak → salary bridge + i18n + data migration stub
**Scope:** Close the card-centric loop; defect % → operator card GSD → payroll signal. Plus i18n and historical data import stub.

**Owner overrides to cite:**
- EP-QC-023/121: brak% auto-flows to operator card GSD → weekly rating → bonus PROPOSAL. HR/rahbar must confirm bonus/penalty (E1 — never automatic).
- EP-QC-121: monthly salary = quantity (норма %) + quality (brak%) combined. Payroll reads from QC.
- EP-QC-129: A-System / Excel historical brak data → one-time import to ERP (owner performs). ERP receives; no parallel system.

**BE tasks:**
- Brak % → card GSD event (EP-QC-023/083/086): weekly cron computes operator brak% per card → GSD metric update → weekly rating recalc. Event: `OperatorQualityGSDUpdatedEvent` → HR/Payroll subscribes. AI suggests rating impact, HR confirms (E1).
- Salary signal (EP-QC-121): monthly cron: send quality_metric (brak%) to Payroll module per operator card. Payroll uses this as input (not automatic jarima — E1).
- Defect reason → department GSD link (EP-QC-107/023): dizayn brak → dizayn dept GSD; rejalashtirish brak → PP GSD. Auto-route using brak_cause_category (E2 card-centric, E5 org-chart routing).
- i18n 3-language (EP-QC-130): defect catalog, inspection points, status labels, cert fields — all in UZ lotin + UZ kirill + RU. Use existing i18n pipeline.
- Historical data import endpoint (EP-QC-129): admin-only POST `/api/qc/import-historical` — accepts structured JSON (brak records from Excel/A-System format); validates; inserts with `is_historical=true` flag. Owner runs once.
- External certification expiry tracker (EP-QC-134): sertifikat / normativ + amal_muddati + cron warning (30 days before expiry → Telegram to sifat boshlig'i). Linked to EP-QC-027.

**FE tasks:**
- Operator card quality profile tab: weekly brak% trend, GSD quality score, AI suggestion badge (read-only for operator; sifat boshlig'i sees confirm button).
- Quality metric confirm dialog (sifat boshlig'i / HR only) — ConfirmDialog pattern (Q-14).
- i18n: all QC pages fully translated UZ/RU; defect catalog shows 3-language names.
- Historical import UI (admin): file upload → preview → confirm → import progress.

**Verify:** week ends → GSD updated in DB for operator card → Payroll module receives quality_metric → HR sees confirm prompt (not auto-applied). Import endpoint: upload test JSON → records appear with is_historical flag.
**DoD (all 7):** EP-QC-023, EP-QC-121, EP-QC-107, EP-QC-129, EP-QC-130, EP-QC-134. Plus full i18n coverage across all QC phases.

═══════════════════════════════════════════════════════════════
## DoD — 7 conditions (must ALL be met before any phase is "done")
1. **BE real:** CRUD + Result<T> + Zod + real DB (Drizzle) — no fake, no echo, no stub.
2. **FE real:** EP Linear Soft template + token colors, loading/error states, persists (round-trip verified).
3. **Docs:** gap table updated; new tables/endpoints documented in `docs/QC-RE-AUDIT-2026-06-08.md`.
4. **Tests:** BE unit (repo + service) + FE component test for each new feature.
5. **i18n:** UZ lotin + RU for every new label, toast, error message.
6. **Edge cases:** empty lot, zero brak, override with/without reason, AQL boundary, food-safety block, QC skip detection.
7. **Automation:** every AI/cron/event feature fires correctly (verified in test or live probe). Each operation logs its **EP-QC-### op-code** (`level=info code=EP-QC-083 ...`).

═══════════════════════════════════════════════════════════════
## RAILS (per-phase checklist)
- ☐ Permission gate: show `file:line` + exact change + reason → owner "ha" before touching.
- ☐ BE + FE parallel: both layers complete in same phase — neither left half-done.
- ☐ Verify: `tsc 0` + DB-proof (INSERT/SELECT confirms real data) + FE persist round-trip.
- ☐ Separate commit per phase: `git add <exact-files>` (no -A). Commit message cites EP-QC-### codes.
- ☐ No regressions: run `bash scripts/run-all-reviewers.sh` after each phase; PASS = 0 new failures.
- ☐ No rewrite: find what exists first (Phase 0); extend/connect, not replace.
- ☐ Honest 501 over fake: if a feature cannot be completed in this phase, return 501 with explanation — never `{ok:true}`.
- ☐ DDL = owner approval: new table / column → STOP → show owner → `APPROVED:` comment in migration.
- ☐ Report to owner in Uzbek after each phase (what was done, what was deferred, which EP-QC-### codes, commit hash). Then wait for "davom et".

═══════════════════════════════════════════════════════════════
## STOP POINTS (mandatory — do not proceed without owner confirmation)
1. **After Phase 0 RE-AUDIT** — show gap table before any build.
2. **Before any new DDL** (new table, new column, migration) — show exact SQL, get `APPROVED:` sign-off.
3. **Before Phase 2** — confirm: which existing MES event to hook for pre-production gate (code location + line).
4. **Before Phase 3** — confirm: current MES→QC stub location (`file:line`) + replacement plan.
5. **Before Phase 4** — confirm: Finance credit-note event connector (Finance module API / event name).
6. **Before Phase 5** — confirm: certificate number prefix format (SF-2026-NNNNN or owner variant) + COQ formula components.
7. **After each phase** — show Uzbek report + commit hash → wait for "davom et".
