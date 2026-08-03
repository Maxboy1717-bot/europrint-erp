# EXECUTOR PROMPT #06 — BUILD T1: MES / Ishlab chiqarish (+ IoT-tablet)
> Floor coordinator, OEE engine, operator tablet hub. ~70% already built — fix & connect, don't rebuild.
> Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES
You are the 🟢 **EXECUTOR**. Read `CLAUDE.md` + `docs/agent-constitution.md` FIRST. All hard rules apply without exception:

**Code quality (CLAUDE.md):**
Zod validation · Drizzle ORM (no `sql.raw(variable)`) · Result<T> pattern (no throw/null) · file ≤900 lines / func ≤150 · no magic numbers (`business.constants.ts`) · controller = transport only · service → repo (no direct `db.*` in service) · `@UseGuards` or `@Public` on every controller · no `as unknown` stub · `typedExecute<T>` for raw SQL casts.

**Build integrity (LOYIHA-QOIDALARI + Q-rules):**
- **No fake (C3/Q-40/Q-43):** every endpoint hits real DB. `{ok:true}` / echo / `[]` = FORBIDDEN. No table yet → honest `501`.
- **Verify-don't-trust (C2/Q-29):** every audit claim confirmed with `node _audit/q.cjs` + live probe before touching.
- **Permission gate (Q-28/I3):** show `file:line` + exact change + reason → get owner "yes" before touching.
- **DDL = owner approval (Q-35/H4):** any new `CREATE TABLE` / migration → `APPROVED:` comment in file + owner explicit "yes". Check H4: does another table already hold this concept?
- **No regressions (C5/Q-39):** previously working code must still work after your change.
- **No rewrite (C6):** system is ~70% built — fix & connect only. Full rewrite = FORBIDDEN.
- **Canonical tables (H1-H3):** `sales_orders` (not `orders`/`sd_sales_orders`), `warehouse_stock` (not `stocks`/`current_stock` for writes), `entries`/`gl_entries` for GL. No two-world duplication.
- **git add <exact-file>** only (never `git add -A`) · commit every step · `git stash` NEVER.

**Design (mandatory, Q-41/Qoida 21):** EP Linear Soft tokens (`var(--ep-*)`, `var(--mod-*)`) + existing templates (ListPage/FormPage/DetailPage/DashboardPage). MES module color = production amber/orange family. No new design — use existing templates + props only.

**Op-code logging (J1-J3):** every operation logs its `EP-MES-###` code: `level=info code=EP-MES-028 ...`.

---

## 1. WHY THIS MODULE (Q-40 — the measure of "correct")
MES / Ishlab chiqarish is a **T1 core** module — the factory floor engine. It connects PP (plan), WMS (material), QC (quality), HR (card/rating), GL (cost), and the operator IoT-tablet. Without real MES, OEE is unknown, production cost is fiction, and operator cards have no data.

**Vision = the measure of "correct" for this module:**
- `docs/audit/decisions/08-mes.md` — full 82-question decision map (33 decided + 49 A-default)
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` → MES section — 4 owner overrides + 45 A-defaults
- `docs/audit/IOT-MES-CURRENT-STATE-2026-06-08.md` — current state: tablet ~70% built, 6 gaps
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` — project-wide rules block (sections A–J)
- `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` — floor model, smena/norma/OEE details
- `docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md` — production context

**4 owner overrides from OCHIQ-JAVOBLAR (these OVERRIDE A-defaults):**
1. **EP-MES-006** Material deduction = norma auto-calc + **operator/usta CONFIRMATION** required (blocks wrong deduction; full auto+GL comes later).
2. **EP-MES-001** Session = **3 stages** (sozlash/setup → asosiy/main → yakunlash/finish; correct OEE Availability).
3. **EP-MES-014** OEE level = **all levels** (machine + shift + brigade + shop-floor).
4. **EP-MES-027** MES bonus = **score → A/B/C → bonus PROPOSAL → HR approval** (HR-014 + global principle: AI proposes, human confirms negative effects).

**6 cross-cutting principles applied to MES:**
- **E1 (AI observes → human confirms):** downtime auto-flag, brak AI-detect, score drop — ALL need human confirmation before negative effect lands on card. Never automatic penalty.
- **E2 (Card-centric):** every session/brigade result writes to operator's card (GSD fulfillment). Card primary, employee secondary. EP-MES-019/020.
- **E3 (AI plans orders):** smena reja auto-generated from PP (EP-MES-063 → B first, then A); AI suggests order priority + bottleneck routing.
- **E4 (Operator IoT-tablet = floor hub):** brak entry, TB safety checklist, downtime logging, priladka timing, material-kit scan — ALL go through operator tablet (EP-MES-080/IOT-MES-CURRENT-STATE).
- **E5 (Org-chart routing):** SOS escalation goes vertical (operator → usta → bo'lim boshlig'i → direktor, EP-MES-009/018). НО-mas'ul (EP-MES-081) tied to org position card.
- **E6 (One canonical truth):** canonical session table chosen in Phase 0 (production_sessions vs mes_sessions gap — HIGH priority). No two-world.

---

## PHASE 0 — RE-AUDIT existing MES/IoT-tablet implementation (READ-ONLY) — DO FIRST
The system is **~70% built** (IOT-MES-CURRENT-STATE). **Do NOT rebuild anything.** Map exactly what EXISTS vs what the vision NEEDS.

**Check and document:**
- Tables: `production_sessions` (34 cols) vs `mes_sessions` (13 cols) vs `mes_production_sessions` (32 cols) — all 0 rows (unused). Also: `downtime_events`, `sos_alerts`, `inline_qc_checks`, `material_kits`, `shift_handovers`, `shift_evaluations`, `machine_crews`, `mes_papka_orders`, `mes_telemetry`. Count columns, check FK integrity with `node _audit/q.cjs`.
- BE: `apps/api/src/modules/mes/` — controllers (mes-sessions, mes-production-sessions, mes-operations, mes-maintenance, mes-shifts-stats, mes.gateway WS). Which endpoints are real vs stub? Check `GetOeeHandler` (known: `new GetOeeHandler()` direct — DI missing).
- IoT tablet FE+BE: `artifacts/erp-dashboard/src/pages/IoTTablet.tsx` + `src/pages/iot/*` — login/schedule/checklist/dashboard/completion. Which flows actually persist (round-trip test)?
- Known gaps (IOT-MES-CURRENT-STATE) to verify: (1) two session tables unsynchronized, (2) TB-safety/shift-readiness checklist missing (COR-130/HR-079), (3) `operator` role missing from IOT_READ guard, (4) MesCompletedEvent → QC/HR handler unconfirmed, (5) `machine_crews` POST missing (404 silent), (6) OEE GetOeeHandler DI-broken.
- MES norma/smena data: `downtime_reason_codes` table — does it exist + have karton/qolib/peredelivka codes (EP-MES-011)?
- Smena model: current `morning/afternoon/night` vs needed `A/B/C` labels (EP-MES-061).

**Output:** `docs/MES-RE-AUDIT-2026-06-08.md` — for each feature from vision: exists? stub or real? gap? effort (S/M/L). Include canonical session table recommendation.

→ **STOP. Show owner the re-audit document. Get explicit approval before any build.**

═══════════════════════════════════════════════════════════════
## BUILD PHASES
Each phase follows: permission gate → BE + FE parallel → verify (tsc 0 + DB-proof + FE persist round-trip) → DoD → separate commit → Uzbek report → wait for "davom et".

---

### PHASE 1 — Canonical session table + operator role guard fix
**Scope:** Resolve the two highest-priority gaps from IOT-MES-CURRENT-STATE.

**1a. Canonical session table (E6 — one truth):**
- Decide (with owner): which table is canonical — `production_sessions` or `mes_sessions`? Recommendation: `production_sessions` (34 cols, richer). If DDL change needed (merge/alias) → **DDL = owner approval FIRST (Q-35)**.
- Make IoT tablet and MES dashboard read/write from the SAME canonical table. No two-world.
- Op-codes: `EP-MES-080` (session start/stop), `EP-MES-002` (manual stage progression).

**1b. Operator role guard fix:**
- Add `operator` role to `IOT_READ` permission list so operator JWT can call `/api/iot/*` endpoints without 403.
- Verify: operator login → `/api/iot/production-sessions` → 200 (not 403).
- Op-code: `EP-MES-052` (mustaqil ishlash ruxsati guard).

**1c. machine_crews POST endpoint:**
- Implement `POST /api/iot/production-sessions/:id/crew` — save operator + yordamchi (EP-MES-033).
- Result<T> + Zod validation. Real DB insert into `machine_crews`.
- Op-codes: `EP-MES-033` (operator+yordamchi), `EP-MES-004` (brigada).

**Verify:** tsc 0 · DB-proof (INSERT visible via `node _audit/q.cjs`) · FE persist round-trip (create crew → reload → visible).

**DoD checklist (all 7):** (1) real CRUD+Result+Zod+DB · (2) FE loading/error states + persists · (3) docs updated · (4) BE unit test for guard fix · (5) UZ/RU i18n keys · (6) edge cases (operator logs in with expired cert → correct error) · (7) op-code logged.

**Separate commit. Report in Uzbek. Wait for "davom et".**

---

### PHASE 2 — 3-stage session lifecycle + OEE real calculation
**Scope:** EP-MES-001 (3 stages owner override) + OEE engine fix.

**2a. 3-stage session (EP-MES-001 — owner override):**
- Session stages: `SOZLASH` (setup/priladka) → `ASOSIY` (main run) → `YAKUNLASH` (finishing/packaging). Each stage has its own start/end timestamp (4 time fields: EP-MES-032 planned-start/actual-start/planned-end/actual-end per stage).
- Map to existing domain aggregate lifecycle: `passChecklist() → CHECKLIST_PENDING → start() → RUNNING → ...`. Add `advanceStage()` command: SOZLASH → ASOSIY → YAKUNLASH → complete().
- Sozlash time feeds OEE Availability separately (EP-MES-048 murakkab sozlash alohida).
- Op-codes: `EP-MES-001`, `EP-MES-048`.

**2b. OEE GetOeeHandler fix:**
- Fix `new GetOeeHandler()` direct instantiation → inject via NestJS DI properly.
- OEE formula: Availability = net_run / scheduled · Performance = actual_output / (norm_rate × net_run) · Quality = sof_mahsulot / umumiy_son.
- All 4 OEE levels (EP-MES-014 — owner override): machine / shift / brigade / shop-floor. Each level aggregates from session data.
- OEE target per machine (EP-MES-015): configurable field in machine master-data.
- Op-codes: `EP-MES-014`, `EP-MES-015`, `EP-MES-020`.

**2c. "Umumiy/Brak/Sof" triple (EP-MES-060):**
- Session completion form: three fields (umumiy_son, brak_soni, sof_mahsulot) with auto-check: sof = umumiy − brak. FE validation before submit.
- Brak% per machine norm (EP-MES-073): configurable master-data; alert when exceeded.
- Op-codes: `EP-MES-060`, `EP-MES-073`.

**Verify:** tsc 0 · start session → advance through 3 stages → complete → OEE visible in dashboard · DB-proof (all timestamps saved) · FE persist round-trip.

**Separate commit. Report in Uzbek. Wait for "davom et".**

---

### PHASE 3 — Downtime engine + SOS escalation + smena A/B/C
**Scope:** EP-MES-010/011/012 (downtime codes), EP-MES-009/018 (SOS/escalation), EP-MES-061/062 (A/B/C shifts), EP-MES-036 (ish-yo'q separate).

**3a. Downtime reason codes master-data (EP-MES-011 — A-default decided):**
- Seed karton/qolib sex-specific codes (~20): changeover/настройка, qog'oz uzilishi, bo'yoq, qolib kechikishi (EP-MES-047/076), remont (EP-MES-078), ish-yo'q (EP-MES-036/066), переделка (EP-MES-046/075).
- 3 types per code: rejali (planned) / rejasiz (unplanned) / sifat (quality) — auto-assigned, feeds correct OEE bucket (EP-MES-012).
- "Ish yo'q" = SEPARATE type (not downtime for operator; feeds PP planning GSD) — EP-MES-036.
- "Ish yo'q → qayta biriktirilgan ish" field: archish/kadoqlash/avtokarton (EP-MES-037).
- Downtime entry: operator logs immediately from tablet — start time manual, reason added after (EP-MES-013/080).
- Op-codes: `EP-MES-010`, `EP-MES-011`, `EP-MES-012`, `EP-MES-036`, `EP-MES-037`.

**3b. SOS escalation (EP-MES-009 — decided A):**
- Verify existing `/api/iot/tablet/sos-alert` endpoint is real (not stub).
- Escalation org-chart vertical (E5): operator → usta → bo'lim boshlig'i → direktor. Auto-escalate if unacknowledged: 15 min → usta signal, 30 min → direktor signal (EP-MES-018).
- SOS reason categories: 6 types from kitob (material/texnologik/sifat/kadr/reja-xato/boshqa) + izoh majburiy for "boshqa" (EP-MES-010).
- Op-codes: `EP-MES-009`, `EP-MES-018`.

**3c. Smena A/B/C (EP-MES-061/062 — decided):**
- Rename morning/afternoon/night → A/B/C (update DB enum/string field, migration with owner DDL approval).
- Brigade permanent assignment to A/B/C smena (EP-MES-062): base from HR, daily change (sick/vacation) logged.
- Shift time ranges: configurable (12-hour default per kitob Кун тартиби).
- Op-codes: `EP-MES-003`, `EP-MES-061`, `EP-MES-062`.

**Verify:** tsc 0 · create downtime with each type → OEE recalculates correctly · SOS triggers Telegram notification along org-chart route · smena shows A/B/C in UI · DB-proof all records saved.

**Separate commit. Report in Uzbek. Wait for "davom et".**

---

### PHASE 4 — TB safety checklist + smena handover + material deduction confirmation
**Scope:** COR-130/HR-079 (safety checklist — CURRENTLY MISSING), EP-MES-023 (handover), EP-MES-006 (material deduction owner override), EP-MES-065/066 (qog'oz zayavka).

**4a. TB safety + smena readiness checklist (HR-079/COR-130 — currently missing per IOT-MES-CURRENT-STATE):**
- Before session start, operator sees mandatory safety checklist on tablet: material/qolib/dastgoh/xodim readiness items.
- TB-xavfsizlik items: specific to machine type (per kitob). Operator confirms each item → sessiya starts.
- Without checklist confirmation → session start BLOCKED (domain: `passChecklist()` already exists — wire to real checklist data).
- `standalone_safety_checklist` endpoint: `POST /api/iot/tablet/safety-checklist/:sessionId` (DDL for checklist items table — owner approval Q-35).
- Op-codes: `EP-MES-052` (mustaqil ruxsat gate), HR-079 linked.

**4b. Smena handover (EP-MES-023 — decided A):**
- Verify existing `/api/iot/tablet/handover` endpoint is real (saves to `shift_handovers`).
- Required fields: tugamagan_buyurtmalar (list) + ochiq_nosozliklar + izoh + keyingi_smena tasdiqlaydi.
- Policy: bajarilmagan reja kelingi kunga "sababsiz ko'chib qolmaydi" (kitob orgpolitika — EP-MES-025 reja-fakt, EP-MES-023).
- AI smena xulosasi (EP-MES-079 — decided A): after handover saved, AI generates: top yo'qotish + brigada reytingi + takror sabab + tavsiya. Shown to usta + direktor. Owner sees daily digest. AI observes → human acts (E1).
- Op-codes: `EP-MES-023`, `EP-MES-079`.

**4c. Material deduction with confirmation (EP-MES-006 — owner override):**
- Session completion: show operator calculated material usage (norma × qty from PP texkarta — EP-MES-007 read-only).
- Operator/usta confirms. Only on confirmation → WMS deduction event fires (warehouse_stock update).
- Deviation tracking: actual vs norma (EP-MES-008). Deviation > threshold → alert to usta.
- Qog'oz zayavka link (EP-MES-065): link session's paper usage to WMS zayavka record (format A×B + gramm + kg — EP-MES-066).
- Op-codes: `EP-MES-006`, `EP-MES-007`, `EP-MES-008`, `EP-MES-065`, `EP-MES-066`.

**Verify:** tsc 0 · start session without checklist → BLOCKED · complete checklist → proceeds · handover saves and AI summary generated · material deduction requires confirmation · deviation alert fires · DB-proof all records.

**Separate commit. Report in Uzbek. Wait for "davom et".**

---

### PHASE 5 — Event handler wiring + MES-to-card score + live monitoring FE
**Scope:** EP-MES-019 (card link — decided A), EP-MES-027 (bonus owner override), EP-MES-016/017 (live monitoring — decided A), MesCompletedEvent handlers (IOT-MES-CURRENT-STATE gap).

**5a. MesCompletedEvent handlers (currently unconfirmed — verify first):**
- Verify `MES_SESSION_COMPLETED` event is handled by: (1) QC module pickup handler, (2) HR 360° handler, (3) WMS stock deduction handler (via EP-MES-006 confirmation already in Phase 4).
- If handlers exist but are no-op stubs → wire to real services (no rewrite — fix & connect).
- `MES_TO_HR_360` event → HR module should record GSD result for operator's card.
- Op-codes: `EP-MES-019`, `EP-MES-022`.

**5b. Session result → operator card (EP-MES-019 — decided A, card-centric E2):**
- After session completes + QC passes: write GSD fulfillment record to operator's card (org_node_portret or card GSD table — verify canonical location from Phase 0 re-audit).
- GSD = vaznli ball: yaroqli miqdor (sof_mahsulot vs norm) + OEE score + norma-sarf compliance (EP-MES-020 — A-default).
- Razryad link (EP-MES-021): GSD result feeds razryad advancement data in HR.
- Op-codes: `EP-MES-019`, `EP-MES-020`, `EP-MES-021`.

**5c. Smena score + bonus proposal (EP-MES-026/027 — owner override):**
- Weighted smena ball (configurable weights): OEE% + reja-fakt% + brak% + sarf-norm% → total 0-100.
- Score → A/B/C toifa (configurable threshold, master-data).
- Toifa → bonus PROPOSAL (not automatic): system generates proposal, HR must confirm (EP-MES-027 + global principle E1). Sends to HR module for approval workflow.
- Op-codes: `EP-MES-026`, `EP-MES-027`.

**5d. Live monitoring FE dashboard (EP-MES-016/017 — A-default decided):**
- Sex tablosi (shop-floor live board): each machine as colored tile — RUNNING/IDLE/DOWNTIME/SOS. Show: live OEE, current operator name, current order, progress vs plan.
- Refresh: 1-5 minute polling (EP-MES-017 B-default: no heavy push in IoT-less environment; SOS = immediate push separately).
- "Kim hozir qaysi mashinada" live table (EP-MES-043): operator → machine live assignment.
- Uses WebSocket gateway already in `mes.gateway` — verify and wire.
- Op-codes: `EP-MES-016`, `EP-MES-017`, `EP-MES-043`.

**Verify:** tsc 0 · complete session → QC event fires (verify handler receives it) → card GSD record created → bonus proposal appears in HR queue · live dashboard shows session state within 5 min · DB-proof all writes.

**Separate commit. Report in Uzbek. Wait for "davom et".**

---

### PHASE 6 — Norma master-data + machine master-data + "А смена План" screen
**Scope:** EP-MES-034/035 (norma bases), EP-MES-039/040 (machine master-data), EP-MES-031/032/033 (А смена форма screen), EP-MES-049/050/051 (tanaffus/namoz).

**6a. Machine master-data (EP-MES-039/040 — decided A):**
- Seed ~30 machines from kitob Станоклар норма: Резка, Гф линия, SM-52/SM-72/KBA-105, Трафарет/UV лак, Ламинация, кашировка, Автовысечка, Тигель 1-10 (each numbered separately — EP-MES-040), ФСМ, Окошка, Степлер, Эмбоссинг.
- Machine fields: id, code, name, bo'lim (Ofset НО-12-1 / Flekso НО-12-2 — EP-MES-038/081), type, norma_hourly, brak_percent_norm, unit (м2/лист/штук/удар — EP-MES-035/082), oee_target.
- НО-mas'ul (EP-MES-081): each bo'lim linked to responsible lavozim card (Махмудов НО-12-1 / Юсупов НО-12-2). Reports carry the НО-mas'ul name.
- DDL: if machine table doesn't exist → owner DDL approval Q-35. Use existing table if found in re-audit.
- Op-codes: `EP-MES-039`, `EP-MES-040`, `EP-MES-038`, `EP-MES-081`, `EP-MES-082`.

**6b. Norma master-data (EP-MES-034/056 — decided A):**
- Norma: hourly base + 12-hour auto-calc (×12 − tanaffuslar from Кун тартиби — EP-MES-034/049).
- Norma version with date + approval chain: РД-4 + direktor (EP-MES-055/056). Version history kept.
- Staged norms per job type (pog'onali 400-3000 — EP-MES-072): stored in texkarta (PP module, EP-MES-007 read-only from MES).
- Work units configurable per machine type (EP-MES-035): м2 / лист / дона / удар. Canonical unit master-data approved by РД-4+direktor (EP-MES-082).
- Op-codes: `EP-MES-034`, `EP-MES-049`, `EP-MES-055`, `EP-MES-056`, `EP-MES-072`.

**6c. "А смена План" screen (EP-MES-031/032 — decided A):**
- Screen mirrors the factory Excel form: smena → machine → order row. Columns: buyurtma (EP-MES-057 format 2025-3499/KT4438/папка), operator+yordamchi, planned-start/actual-start/planned-end/actual-end (4 fields — EP-MES-032), norma, umumiy/brak/sof, OEE%.
- "Keyingi ish" (next queue) column per machine (EP-MES-041).
- "ZARUR ZAKAZLAR" urgent flag section at top (EP-MES-068).
- Tanaffus markers auto-shown in timeline: УЖИН/ОБЕД/ТУШЛИК/ПОЛДНИК (EP-MES-071). Smena-shift 3-wave lunch coordination (EP-MES-050). Namoz tanaffus separately tracked (EP-MES-051).
- Planlovchi + Texnolog signature fields (EP-MES-064). НО-mas'ul auto-linked.
- Op-codes: `EP-MES-031`, `EP-MES-032`, `EP-MES-041`, `EP-MES-057`, `EP-MES-064`.

**Verify:** tsc 0 · machine seeded and visible · norma version saves with approval fields · А смена план screen loads real data, persists mutations · 4 time fields saved correctly · tanaffus markers display · DB-proof.

**Separate commit. Report in Uzbek. Wait for "davom et".**

---

## DoD — "TAYYOR" (7 conditions, all must pass before module is done)
1. **BE real:** CRUD + Result<T> + Zod + real DB INSERT/UPDATE for every operation. No stub.
2. **FE real:** EP Linear Soft template + tokens, loading skeleton + error toast/modal, persists (create → reload → visible).
3. **Docs:** `docs/MES-RE-AUDIT-2026-06-08.md` updated per phase; op-code registry updated.
4. **Tests:** BE unit test per service method; FE component test for forms; at least stub E2E for session lifecycle.
5. **i18n:** UZ + RU keys for all new strings. No hardcoded UI text.
6. **Edge cases:** operator with no cert → blocked (EP-MES-052); norma 0 → validation error; brak > umumiy → validation blocked; SOS unacknowledged → escalates at 15/30 min.
7. **Automation:** AI smena xulosasi (EP-MES-079) fires on handover; bonus proposal (EP-MES-027) fires on smena close; MesCompletedEvent → QC/HR/WMS handlers confirmed wired; op-code logged for every operation.

---

## RAILS (enforced at every phase)
- **Permission gate** before any file change (Q-28): file:line + change + reason → "yes".
- **Verify-don't-trust** (Q-29): every gap claim verified with `node _audit/q.cjs` + HTTP probe before fixing.
- **Separate commit** per phase with descriptive message (`feat(mes): phase N — ...`).
- **No regressions** (Q-39/C5): run `bash scripts/run-all-reviewers.sh` after each phase; all 0 FAIL required.
- **No rewrite** (C6): IoT tablet is ~70% built — extend, don't replace.
- **Honest 501** over fake: if a feature can't be completed this phase → `throw new HttpException('Not implemented', 501)` with op-code comment.
- **DDL = owner approval** (Q-35): every new table/migration shows owner the SQL + gets "APPROVED:" comment.
- **Report in Uzbek** after each phase: what was done, what was skipped (with reason), commit hash, next phase plan.
- **Windows nest-watch 000 = environment (Q-44)**: if backend drops after rebuild → restart `pnpm --filter @europrint/api run dev:unsafe`, not a code bug (verify with static fallback).
- **Log files never committed (Q-45):** `backend.log*` / `*.log.*` → never `git add`.

---

## STOP POINTS (must pause and get owner response)
1. **After Phase 0 RE-AUDIT** — show `docs/MES-RE-AUDIT-2026-06-08.md`, get approval before any build.
2. **Before any DDL** (new table / migration / column rename) — show SQL, wait for owner explicit "yes" + `APPROVED:` comment (Q-35).
3. **Before changing canonical session table** — if merging `production_sessions` ↔ `mes_sessions`, this is a structural decision; requires owner approval and careful FK analysis.
4. **Before Phase 4 checklist DDL** — checklist items table (if missing) needs owner approval.
5. **After each phase** — show Uzbek report + commit hash + next phase plan. Wait for "davom et" before proceeding.
6. **If MesCompletedEvent handlers are stubs touching QC/HR/WMS** — confirm with owner before wiring live events (cross-module side effects).
