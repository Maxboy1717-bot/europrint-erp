# EXECUTOR PROMPT #20 — BUILD T3: IOT — IoT / Sensor + AI-camera (passive → VLM)
> Foundation modules (T1 + T2 core) are done. Now build the floor intelligence hub: the IoT/AI-camera module.
> Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES
You are the 🟢 **EXECUTOR**. Read `CLAUDE.md` + `docs/agent-constitution.md` + `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` before touching a single file. All hard rules apply without exception:

**Code quality (CLAUDE.md B1–B6):**
- TypeScript strict · validatsiya = **Zod only** (class-validator NEVER)
- DB = **Drizzle ORM**; raw SQL only for LATERAL joins + `APPROVED:` comment; **`sql.raw(variable)` BANNED**
- Errors = **Result\<T\>** pattern only (`throw`/`return null` BANNED)
- File ≤ 900 lines · function ≤ 150 lines · magic numbers → `business.constants.ts`
- Controller = transport only (no business logic) · service never touches DB directly (repo only)
- No hardcoded secrets · ConfigService only · every controller `@UseGuards` or `@Public`

**Correctness (C1–C7):**
- **verify-don't-trust**: every existing claim re-verified live (DB probe + endpoint hit)
- **no fake (Q-40/43)**: every form/endpoint REAL DB INSERT/UPDATE; honest **501** over fake `{ok:true}`
- **no rewrite (C6)**: system ~70% built — fix & connect only
- **no regress (C5)**: whatever worked before must still work after your change

**Process (D, I):**
- **permission gate (I3/Q-28)**: state `file:line` + exact change + reason BEFORE touching; no implicit approval
- **DDL = owner approval (Q-35)**: new `CREATE TABLE` / migration requires owner "APPROVED:" comment in file
- **git add \<specific-file\>** only (add -A BANNED) · commit every phase · report in Uzbek after each phase
- **no scope creep**: do EXACTLY the asked task; no unsolicited extra fixes

**Design (G, Q-41):** EP Linear Soft tokens (`var(--ep-*)`, `var(--mod-*)`) + existing templates (ListPage / FormPage / DetailPage / DashboardPage) — no new design system. IoT module color = MES/production orange family. Fix only the 2 known design issues if you touch them.

**Canonical tables (H1–H4):**
- Orders = `sales_orders` · Stock = `warehouse_stock` · GL = `entries`/`gl_entries`
- "Two-worlds" check before any new table; new table = owner approval first

═══════════════════════════════════════════════════════════════
## 1. WHY THIS MODULE / GOAL

**IoT** is the EuroPrint floor intelligence layer — Tier T3 (supporting). It is the **physical bridge** between the factory floor and the ERP: machines, cameras, and the operator tablet are the data sources; every other module (MES, HR, QC, Finance, ShVB) consumes what IoT feeds.

**Role in the golden thread:** IoT data → MES sessions (real production counts) → QC (brak %) → HR card GSD (bonus-eligible performance) → Finance (energy → cost price) → Director ShVB dashboard. Without real IoT data, the "planned vs actual" loop is broken.

**Key owner constraints:**
- Sensors are **NOT YET INSTALLED** — manual/Excel today. Build the data model and UI for when they arrive; meanwhile qo'lda (manual) entry via operator tablet.
- AI-camera (room inspection, attendance, safety PPE) is **already decided** (460 owner answers Q57/Q88/Q97/Q98/Q108/Q128) — this is the **primary deliverable** of this module.
- Sensor rollout = **ALL machines at once** (owner override EP-IOT-001 — not phased).
- A-System is **fully replaced** by EuroPrint ERP (owner override, DIR-039); no parallel system.

**Vision = measure of "correct" (Q-40).** Source documents (read before building, do not invent):
- `docs/audit/decisions/16-iot.md` — 83-question decision map (37 answered, 46 phased-default)
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` — IoT section (owner overrides EP-IOT-001, A-System, EP-IOT-021, EP-IOT-018/030 + global principles)
- `docs/audit/IOT-MES-CURRENT-STATE-2026-06-08.md` — floor tablet ~70% built; 6 known gaps
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` — project rules (this doc)
- `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` — ShVB Y37 IoT-MES integration, GSD/ЦКП, card-model
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` — cross-cutting: HR-057 (brak→tablet), HR-079 (TB checklist), HR-082 (downtime→human confirm), COR-098 (priladka→tablet), COR-130 (smena checklist)

**6 cross-cutting principles applied to IoT:**
1. **AI observes → human confirms negatives** (EP-IOT-010/011/012, EP-IOT-077/078): AI camera flags violations; jarima/ball drop only after human (HR/manager) approval — never auto.
2. **Card-centric** (EP-IOT-024/025/042): machine alerts route to the *card* (mexanik card, operator card); GSD flows card → employee profile; operator+assistant both linked by HR card.
3. **AI plans** (EP-IOT-013/027): MES/IoT session data feeds AI shift planner; AI downtime breakdown auto-explains missed norma (EP-IOT-074).
4. **Operator IoT-tablet = floor hub** (EP-IOT-022/046/057/059): ALL floor input — defect reason, downtime, TB checklist, smena handover, priladka, alternative-work — goes through the tablet.
5. **Org-chart routing** (EP-IOT-024/028): alerts/notifications routed by Vysotskiy-7 org-chart (anomaliya→mexanik card, long downtime→sex boshliq, critical→director); Telegram per-module bot (Q101/Q102/Q140).
6. **One canonical truth** (EP-IOT-029/031/070): single machine registry (`machines` or existing canonical table) — all IoT/MES/QC/finance operations reference it; no two-worlds.

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT existing IoT/MES/camera implementation (READ-ONLY)

The IoT/MES floor system is **~70% built** (per `IOT-MES-CURRENT-STATE-2026-06-08.md`). **Do not rebuild.** Map exactly what EXISTS vs what the vision needs.

**Read-only exploration tasks:**
1. **Tablet FE:** `artifacts/erp-dashboard/src/pages/IoTTablet.tsx` + `src/pages/iot/*` — which flows are real (login/session/brak/downtime/QC/handover) and which are stubs?
2. **Tablet BE:** `/api/iot/*` endpoints — hit each, record HTTP status + DB row count change.
3. **Session tables:** `production_sessions` (34 cols) vs `mes_sessions` (13 cols) vs `mes_production_sessions` (32 cols) — run `SELECT count(*) FROM each`; identify the canonical one or confirm split.
4. **Machine registry:** does a `machines` or `equipment` table exist? What columns? Row count?
5. **AI-camera:** any existing table/endpoint for room inspection, attendance, PPE check? (`ai_camera_*`, `room_inspections`, `attendance_*`)
6. **Downtime/brak:** `downtime_events`, `defect_records` — real columns, FK to machine? To operator card?
7. **OEE:** `GetOeeHandler` — is it a stub (`new GetOeeHandler()` without DI) or real?
8. **Operator guard:** does `operator` role appear in `IOT_READ` or `IOT_WRITE` permission sets?
9. **Event handlers:** `MesCompletedEvent` → QC handler + HR 360° handler — are `@EventsHandler` decorators wired?
10. **machine_crews POST:** does `POST /api/iot/production-sessions/:id/crew` exist in BE?

Produce gap table → `docs/IOT-RE-AUDIT-2026-06-08.md`:

| Feature (vision EP-IOT-###) | Exists? | Real/Stub? | Gap | Effort |
|---|---|---|---|---|
| ... | ... | ... | ... | S/M/L |

→ **STOP. Show owner the re-audit doc. Get "continue" before any build.**

═══════════════════════════════════════════════════════════════
## BUILD PHASES

Each phase: permission → BE+FE parallel → verify (tsc 0 + DB-proof + FE round-trip) → DoD → separate commit → report in Uzbek → wait for "continue".

---

### PHASE 1 — Machine Registry + Operator Session Foundation fixes

**Why first:** Every IoT operation (downtime, defect, OEE, GSD) references a machine. Without a clean canonical machine registry, nothing else can be wired correctly. Also fix the 2 blocking gaps from Phase 0: operator-role guard and canonical session table.

**EP codes:** EP-IOT-029, EP-IOT-031, EP-IOT-032, EP-IOT-033, EP-IOT-002 (machine status master-data), EP-IOT-040 (smena A/B/C), EP-IOT-042 (operator+assistant card linkage).

**Owner override:** EP-IOT-001 = ALL machines at once (not phased). Seed the machine registry from "Станоклар норма" book names: SM-52, SM-72, KBA-105, Тигель 1–10, Гофра линия, ФСМ большой/маленький, Автовысечка (картон/гофра separate EP-IOT-062), Ламинация, UV Лак, Трафарет, Степлер 1/2/3, Склейка, Резка, Окошка. Each machine has: `name`, `machine_type`, `status` (5 states: ishlayapti/to'xtagan/sozlanmoqda/nosoz/o'chiq EP-IOT-002), `unit_of_measure` (м2/лист/штук/удар per machine type EP-IOT-033), `norma_per_hour`, `norma_per_12h` (EP-IOT-032), `shift_hours` (configurable EP-IOT-048), `sex_id` (workshop FK), `responsible_card_id` (FK to org card), `brak_threshold_%` (per-machine-type EP-IOT-051).

**DDL requirement:** If `machines` table doesn't exist → write `migrations/add-machines-registry.sql` with `APPROVED:` comment → **STOP for owner DDL approval before running migration.**

**Operator guard fix (no DDL):** Add `operator` role to `IOT_READ` + `IOT_WRITE` permission arrays in the existing guard/permissions constants. Verify: operator JWT can call `/api/iot/production-sessions`.

**Canonical session fix:** Per re-audit, pick ONE canonical session table (likely `production_sessions` — 34 cols, IoT-driven). Add a DB view or migration note so `mes_sessions` references it. **STOP for owner DDL approval on session canonicalization.**

**Smena A/B/C (EP-IOT-040):** Smena field on sessions: `smena_type` enum (A/B/C) + `smena_boss_card_id` FK. Each shift's metrics tracked separately.

**Operator+assistant (EP-IOT-042):** `machine_crews` POST endpoint (currently 404 per gap list). Add missing BE handler: operator card + assistant cards linked to session. Kitob: "Оператор: ___ / Ёрдамчи: ___".

**Verify:** `tsc 0` + `SELECT count(*) FROM machines` shows seeded rows + operator JWT hits `/api/iot` endpoints with 200 (not 403) + FE machine list renders + crew POST saves to DB.

**DoD:** Machine registry CRUD real (BE+FE) · guard fix proven · canonical session confirmed · smena A/B/C field · crew POST works · EP-IOT-029/031/032/033/002/042 op-codes logged · commit + Uzbek report.

---

### PHASE 2 — Operator Tablet: TB Checklist + Smena Handover (COR-130 / HR-079)

**Why second:** The biggest confirmed gap is the missing TB (xavfsizlik) checklist and smena tayyorlik checklist — required by HR-079, COR-130, and cross-module build rails. Until this is in place, the operator tablet is incomplete for floor use.

**EP codes:** EP-IOT-022 (operator tablet), HR-079 (TB checklist on tablet), COR-130 (smena checklist), EP-IOT-080 (pre-start machine checklist), EP-IOT-058 (smena handover A→B).

**Owner overrides:**
- HR-079: "har ishni boshlashdan oldin IoT tabletда CHEK-LIST ko'rinadi, xodim TASDIQLAYDI" — checklist is blocking (cannot start session without confirming).
- COR-130: "IoT tabletда tayyorlik: material/qolip/dastgoh/xodim; tasdiqsiz bekor-turish hisoblanmaydi."
- EP-IOT-080: majburiy checklist (yog'/tozalik/qolip/material) — ish ochilmaydi without confirmation.

**BE:** `POST /api/iot/tablet/checklist/tb-confirm` — saves TB checklist sign-off (xodim card_id + timestamp + checklist_items JSON). `POST /api/iot/tablet/checklist/smena-ready` — smena readiness (material/qolip/machine/crew). Both gated: session cannot transition to RUNNING without these two confirmations (add guard in `passChecklist()` domain method).

**FE:** Two new screens in `src/pages/iot/`: `TbChecklist.tsx` + `SmenaReadyChecklist.tsx`. Each item = tap to confirm. Submit only when all items checked. EP Linear Soft design, operator-friendly large tap targets (tablet UX). On submit → POST → navigate to session dashboard.

**Smena handover (EP-IOT-058):** Existing `handover` endpoint — verify it captures: unfinished work + machine state + qolip/material left + izoh. FE smena-handover screen must show all three and require izoh field. If DB columns missing → DDL approval needed first.

**Verify:** Start session without TB checklist → blocked (401/403 or domain error). After checklist → session starts. Handover form saves all fields to DB. `tsc 0`.

**DoD:** TB checklist blocking gate works · smena checklist works · handover captures all fields · EP codes logged (HR-079/COR-130/EP-IOT-022/058/080) · commit + Uzbek report.

---

### PHASE 3 — Downtime Master-data + Defect Codes (Kitob-grounded)

**Why:** The operator tablet already has downtime/defect entry (Phase 0 shows it's partially real), but the reason code master-data is not seeded from the book's real categories. Without correct reason codes, Pareto analysis and ShVB reports are meaningless.

**EP codes:** EP-IOT-004/005 (downtime reasons master-data), EP-IOT-036 (иш йук separate category), EP-IOT-037 (колиб тайёр эмас), EP-IOT-038 (переделка code), EP-IOT-039 (настройка setup time), EP-IOT-057 (defect reason tablet selection), EP-IOT-059 (alternative work иш йук → арчиш/паддон).

**Owner override:** All 5 from the kitob are CONFIRMED (✅ JAVOBLANGAN):
- "иш йук" = separate planning-deficiency category (not machine fault) — EP-IOT-036
- "Колиб тайёр эмас" = separate reason + responsible department (qolip tsex) — EP-IOT-037
- "Кайта урилди (переделка)" = rework code + short comment — EP-IOT-038
- "Настройка" = setup time counted separately (not in OEE ishlash time) — EP-IOT-039
- "арчиш/паддон" during иш йук = recorded separately, worker paid for alternative work — EP-IOT-059

**DDL:** `downtime_reason_codes` table likely exists (MES has `downtime_reason_codes` per decision map). Verify live. If exists → seed only. If missing → DDL approval. Same for `defect_reason_codes`.

**Seed data (downtime):** 10 codes: Sozlash/Настройка · Ta'mirlash/Ремонт · Material yo'q · Qolip tayyor emas · Иш йук (rejalashtirish) · Tok yo'q · Operator yo'q · Tozalash · Переделка (qayta urish) · Boshqa. Each with: `code`, `name_uz`, `name_ru`, `category` (planned/unplanned/idle), `responsible_dept_id` (nullable FK).

**Seed data (defect):** 8 codes from kitob: Qolip yarim / Podrezka / Rang ketdi / Karton ho'l / Настройка murakkab / Kuydi / Переделка / Boshqa. Each with: `code`, `name_uz`, `name_ru`, `machine_type` (nullable — some codes are machine-specific).

**Alternative work (EP-IOT-059):** When downtime reason = "Иш йук", tablet shows prompt: "Muqobil ishga o'tkazish? (арчиш/паддон/tozalash)". If yes → `alternative_work_log` entry with start/end timestamps. This time counted in HR for oylik (worker not penalized for planning failure).

**FE:** Operator tablet downtime modal → reason dropdown now shows seeded codes grouped by category. Defect modal → reason dropdown from `defect_reason_codes`. "иш йук" selection → auto-show alternative work option.

**Verify:** Downtime POST saves `reason_code_id` to DB. Defect POST saves `defect_reason_code_id`. Alternative work log persists. `tsc 0`.

**DoD:** All kitob reason codes seeded · tablet dropdowns populated from DB (not hardcoded) · иш йук alternative work flow works · EP-IOT-004/005/036/037/038/039/057/059 logged · commit + Uzbek report.

---

### PHASE 4 — OEE Real Calculation + Norma vs Actual + GSD→Card Bridge

**Why:** OEE handler is currently a stub (`new GetOeeHandler()` without DI — per IOT-MES-CURRENT-STATE gap). ShVB requires real OEE (3 factors). Card-GSD linkage is the payoff of the whole IoT module.

**EP codes:** EP-IOT-003 (uptime), EP-IOT-014 (OEE full), EP-IOT-025 (GSD→card), EP-IOT-032 (norma штук), EP-IOT-048 (отработано часов vs 12h smena), EP-IOT-074 (norma missed → auto downtime breakdown), EP-IOT-082 (KPI linkage — adolatli: exclude иш йук/material/qolip from operator KPI), EP-IOT-081 (OEE→ShVB auto push).

**Owner override (EP-IOT-082):** "bonusga ta'sir qiladi, lekin faqat operatorga bog'liq qism (idle/material/qolip chiqarib tashlanadi) — adolatli." Only machine faults/operator errors affect operator card GSD. "иш йук", material shortage, qolip delay are excluded.

**OEE fix:** Inject `DrizzleService` properly into `GetOeeHandler` (remove `new` instantiation). Formula: Availability = (smena_hours - downtime_mins/60) / smena_hours · Performance = actual_count / norma_per_12h · Quality = (actual_count - brak_count) / actual_count. Store daily snapshot in `oee_snapshots` table (DDL approval needed if not exists).

**Norma vs actual (EP-IOT-032/066):** Andon-style endpoint `GET /api/iot/machines/:id/live-status` returns: `{ machine_id, status, norma_target, actual_count, performance_pct, active_session_id }`. FE live-status widget on operator tablet dashboard and factory floor Andon board.

**GSD→Card (EP-IOT-025/081):** At smena completion (`MesCompletedEvent`): calculate operator's fair OEE (exclude иш йук/material/qolip downtime) → write to `card_gsd_log` (`card_id`, `date`, `metric_code=EP-IOT-025`, `value`, `smena`). This feeds HR KPI/bonus pipeline. Adolatli: if ALL downtime was planning failures, operator GSD = 100%.

**"Norma bajarilmadi" auto-analysis (EP-IOT-074):** If session ends with performance_pct < 80%: auto-generate breakdown text: "3 soat иш йук + 1 soat sozlash + 0.5 soat ta'mir = 4.5 soat yo'qotish." Saved to `session_analysis` field. ShVB shows this breakdown.

**MesCompletedEvent → QC/HR wiring (gap fix):** Verify `@OnEvent('MES_COMPLETED')` exists in QC module (QC pickup) and HR module (360° trigger). If missing → add `@EventsHandler(MesCompletedEvent)` in the correct module, following existing EventBridge pattern.

**Verify:** Complete a test session → `oee_snapshots` row inserted → `card_gsd_log` row inserted (fair OEE) → `GET /api/iot/machines/:id/live-status` returns real data → `tsc 0`.

**DoD:** OEE real (3 factors, DI-proper) · norma vs actual live endpoint · GSD log written per smena completion · MesCompleted events wired to QC+HR · adolatli exclusion logic · EP-IOT-003/014/025/032/048/074/081/082 logged · commit + Uzbek report.

---

### PHASE 5 — AI Camera: Room Inspection + PPE Safety + Attendance

**Why:** AI-camera is the most decided part of IoT (460 owner answers; Q57/Q88/Q97/Q98/Q108/Q128). This is the **primary unique deliverable** of this module — sensors are future, camera is now.

**EP codes:** EP-IOT-010 (room inspection every 2h), EP-IOT-011 (inspection criteria 5-7 mezon), EP-IOT-012 (violation correction log — closed loop), EP-IOT-077 (PPE check: qo'lqop/ko'zoynak), EP-IOT-078 (danger zone — no unauthorized person).

**Owner overrides (all CONFIRMED ✅):**
- Q97: har bo'lim/xona ideal-rasm AI nazorat (every room has reference "ideal" photo).
- Q98: ideal-xona bilan **har 2 soatda** taqqoslash (every 2 hours comparison).
- Q57: AI kamera: yuz qo'shish + inspeksiya + real-time davomat.
- Q108: kirish vaqti + ish-joyi vaqti + xudud vaqti — 2 timestamps.
- Q128: jarima AI kameralar orqali xodim profiliga — **FAQAT inson TASDIG'i bilan** (global principle E1).
- EP-IOT-011: 5-7 mezon: tozalik/himoya vositasi/yo'lak/tartib/xavfsizlik.
- EP-IOT-012: har buzilish → mas'ul → muddat → tuzatildi (yopiq sikl, Q40/Q69/Q128).

**Tech stack:** AI = **Gemini API** (per TS-1 in LOYIHA-QOIDALARI A8); per-camera VLM calls (A8). Camera feed → frame grab every N minutes → Gemini VLM prompt → structured JSON result (violation/score/items).

**DDL needed (owner approval):**
- `camera_zones` (id, name, room, department_id, ideal_photo_url, active)
- `room_inspections` (id, camera_zone_id, inspected_at, score_0_100, violations JSONB, ai_model, raw_response TEXT)
- `inspection_violations` (id, inspection_id, criterion_code, description, photo_url, assigned_to_card_id, due_date, resolved_at, resolved_by_card_id)
- `ppe_alerts` (id, camera_zone_id, detected_at, worker_card_id NULLABLE, violation_type, photo_url, confirmed_by_card_id NULLABLE, confirmed_at NULLABLE, action_taken TEXT)
- `attendance_camera_log` (id, worker_card_id, camera_zone_id, detected_at, event_type ENUM entry/exit/workspace_arrival/workspace_departure)

Write `migrations/add-camera-inspection-tables.sql` with `APPROVED:` comment. **STOP for owner DDL approval before migration.**

**BE services:**
- `CameraInspectionService`: `runInspection(cameraZoneId)` → fetches ideal photo → calls Gemini VLM → parses result → inserts `room_inspections` + `inspection_violations` rows.
- Cron job: every 2 hours → `runInspection` for all active camera zones. Use `@Cron` decorator.
- `POST /api/iot/camera/inspection/:zoneId/run` — manual trigger (admin/inspector role).
- `GET /api/iot/camera/inspection/:zoneId/latest` — latest inspection result + open violations.
- `POST /api/iot/camera/violations/:id/resolve` — mark resolved (assigned person confirms; adds `resolved_at` + photo proof URL). Permission: the assigned card holder.
- `POST /api/iot/camera/ppe-alerts/:id/confirm` — human confirms PPE alert (global principle E1: AI flags, human confirms before any HR action).
- `GET /api/iot/camera/attendance` — daily attendance log (entry/exit/workspace times, Q108).

**FE pages:**
- `src/pages/iot/CameraInspection.tsx` — list of camera zones + latest score + open violations; inspector can run manual check and resolve violations. Uses `DetailPage` template.
- `src/pages/iot/PpeAlerts.tsx` — list of unconfirmed PPE alerts; confirm button (human gate); resolved history.
- `src/pages/iot/AttendanceCamera.tsx` — daily attendance: entry time + workspace arrival time + duration, per employee. Links to HR attendance.

**Violation closed loop (EP-IOT-012):** On new violation: auto-assign to responsible card (department head) + set due_date (24h default, configurable). Telegram notification to assigned card holder. After resolve → confirmation photo uploaded → `resolved_at` set. Unresolved after due_date → escalate up org-chart (vertikal).

**Human gate (E1 principle):** PPE alert or attendance anomaly → `is_confirmed = false`. Jarima/HR action can ONLY be initiated after `confirmed_by_card_id` is set (human pressed "Tasdiqlash"). AI never auto-applies penalty.

**Verify:** Run `CameraInspectionService.runInspection()` with mock camera zone → `room_inspections` row inserted → violations inserted → FE shows score → resolve flow saves `resolved_at` → `tsc 0`.

**DoD:** Camera inspection CRUD real · 2h cron working · violation closed loop (assign→resolve) · PPE alert with human gate · attendance log real · EP-IOT-010/011/012/077/078 logged · commit + Uzbek report.

---

### PHASE 6 — Machine Maintenance History + Downtime Reporting + Telegram Alerts

**Why:** Machine maintenance history digitizes the "ремонтда" paper records (Q77 all documents in ERP). Downtime Pareto reporting closes the ShVB loop. Telegram alerts complete the org-chart routing (EP-IOT-024/028).

**EP codes:** EP-IOT-072 (maintenance history — ремонт tarixi), EP-IOT-016 (PM schedule), EP-IOT-017 (maintenance tasks master-data), EP-IOT-004/005 (downtime analytics/Pareto), EP-IOT-024 (alert routing → card), EP-IOT-028 (Telegram per-module bot), EP-IOT-027 (smena auto-report), EP-IOT-054 (norma tasdiq zanjiri — РД4 → Direktor).

**Owner overrides:**
- EP-IOT-072 (✅): maintenance history exists on paper "ремонтда" → digitize (Q77).
- EP-IOT-028 (✅): faqat muhim hodisalar Telegram'ga (uzun to'xtash, anomaliya, ta'mir kerak). Q101/Q102: per-module bot. Q140: bildirishnoma vaqtlari sozlanadi.
- EP-IOT-027 (✅): avto smena hisoboti → sex boshlig'iga/Telegram'ga. Q116/Q119: avto PDF invoys (operator: qancha ishladi/kutilgan natija/oylik/avans/qarz).
- EP-IOT-054 (✅): norma o'zgarishi → РД (ishlab chiqarish boshlig'i) → Direktor (audit log). Org-chart routing.

**DDL needed (owner approval):**
- `machine_maintenance_logs` (id, machine_id, log_date, work_type, parts_replaced JSONB, cost, technician_card_id, duration_hours, notes)
- `pm_schedules` (id, machine_id, task_code, interval_hours, last_done_at, next_due_at)
- `pm_task_master` (id, machine_type, task_name_uz, task_name_ru, interval_hours, description)
- `norma_change_log` (id, machine_id, old_norma, new_norma, changed_by_card_id, rd4_approved_by NULLABLE, director_approved_by NULLABLE, approved_at NULLABLE, status ENUM pending/rd4/director/active)

Write `migrations/add-maintenance-norma-tables.sql`. **STOP for owner DDL approval.**

**BE:**
- `GET/POST /api/iot/machines/:id/maintenance` — maintenance history CRUD.
- `GET /api/iot/machines/:id/pm-schedule` — upcoming PM tasks.
- `GET /api/iot/analytics/downtime-pareto` — Pareto chart data: reason_code → total_minutes, sorted desc. Filterable by machine/smena/date-range.
- `GET /api/iot/analytics/smena-report/:sessionId` — smena auto-report (OEE + norma% + brak% + downtime breakdown + operator GSD).
- `POST /api/iot/machines/:id/norma-change` — propose norma change → creates `norma_change_log` row (status=pending) → Telegram notification to РД4 card holder → then Director. Org-chart routing (EP-IOT-054 + E5 principle).
- Telegram integration (Telegraf.js, per TS-2): IoT bot sends: (a) long downtime alert (>30 min → sex boshliq), (b) maintenance overdue, (c) brak% > threshold, (d) smena auto-report PDF at smena end, (e) norma change pending approvals. Time window configurable (Q140 — no night alerts unless critical).

**FE:**
- `src/pages/iot/MachineDetail.tsx` — machine detail page (DetailPage template): status history chart, OEE trend, maintenance log, norma value + change request button. Tab 1 = Umumiy, Tab 2 = Ta'mirlash, Tab 3 = Downtime Pareto. Max 2 tab levels (Q-42).
- `src/pages/iot/DowntimePareto.tsx` — Pareto chart (reason × minutes); filterable.
- `src/pages/iot/NormaApproval.tsx` — pending norma change requests (for РД4 and Director roles): approve/reject with comment. Org-chart gated (only РД4 card holder can approve their step).

**Verify:** POST maintenance log → DB row saved → GET returns it. Downtime Pareto query returns sorted data. Norma change creates log row + Telegram message sent (use Telegram test bot). `tsc 0`.

**DoD:** Maintenance history real · PM schedule seeded · Downtime Pareto working · smena auto-report real · norma approval flow (РД4→Director) working · Telegram alerts for critical events · EP-IOT-016/017/027/028/054/072 logged · commit + Uzbek report.

---

### PHASE 7 — IoT Dashboard + Factory Floor Andon Board + Energy Stub

**Why:** The final phase assembles all data into the IoT overview dashboard (for production manager and Director ShVB) and creates the Andon board view (EP-IOT-021/066). Energy tracking is stubbed correctly (sensor not installed — honest 501 with explanation, NOT fake data).

**EP codes:** EP-IOT-021 (Andon tablo — factory floor), EP-IOT-066 (target vs actual, real-time), EP-IOT-018/030 (energy stub — sensor not installed), EP-IOT-023 (sensor disconnect → "aloqa yo'q"), EP-IOT-006 (anomaly alerts), EP-IOT-019/020 (energy report stub), EP-IOT-081 (IoT→ShVB GSD push).

**Owner override (EP-IOT-018/030):** "mashina darajasida → tannarxga avto (sensor o'rnatilguncha umumiy sex hisoblagichidan boshlanadi)." Energy tracking = HONEST STUB for now (sensor not installed). FE shows "Energiya sensori ulanmagan — qurilma o'rnatilgach faollashadi" message. Backend energy endpoints return `501` with `{ message: "Energiya sensori o'rnatilmagan", code: "EP-IOT-018-PENDING" }`. No fake data.

**Andon Board (EP-IOT-021/066):** `GET /api/iot/andon/live` — returns all machines with current status, active session, norma_target, actual_count, performance_pct, brak_count, longest_downtime_min. Auto-refreshes every 60 seconds (configurable). FE `src/pages/iot/AndonBoard.tsx` — fullscreen-optimized layout (tablet/TV display): each machine = colored tile (green=ishlayapti, red=to'xtagan, yellow=sozlanmoqda, black=nosoz, gray=o'chiq per EP-IOT-002). Shows norma vs actual live. Large font. No sidebar (fullscreen mode).

**IoT Overview Dashboard:** `src/pages/iot/IotDashboard.tsx` — DashboardPage template. Widgets: (1) Factory-wide OEE today (3 factors), (2) Machine status grid (mini Andon), (3) Active downtime events (top 5 by duration), (4) Today's brak% by machine, (5) Open camera violations, (6) Upcoming PM tasks. All from real DB.

**"Aloqa yo'q" state (EP-IOT-023):** Machine status = `aloqa_yoq` when sensor signal absent > N minutes (configurable threshold). Shown as distinct gray tile with "?" icon on Andon. NOT counted as downtime (halol hisob). Technician Telegram alert sent.

**ShVB GSD push (EP-IOT-081):** Existing `card_gsd_log` (Phase 4) is the feed. Add `GET /api/iot/gsd-summary?date=&card_id=` endpoint so ShVB (Director module) can pull IoT-based GSD without re-querying. Confirms the EP-IOT-081 → ShVB connection.

**Verify:** Andon live endpoint returns real data (all machines with status). Dashboard widgets load from DB. Energy endpoints return 501 with correct code. `tsc 0`. FE renders without console errors.

**DoD:** Andon board real-time · IoT dashboard 6 widgets real · energy = honest 501 stub (not fake) · "aloqa yo'q" state handled · ShVB GSD endpoint · EP-IOT-021/023/066/081 logged · commit + Uzbek report.

═══════════════════════════════════════════════════════════════
## DoD — 7 CONDITIONS (per ERP-SIFAT-STANDARTLARI, all 7 required)

1. **BE real:** CRUD + Result\<T\> + Zod + real DB INSERT/UPDATE/SELECT — no fake returns.
2. **FE real:** EP Linear Soft template + token, loading/error states, form round-trip persists (kirit → saqla → qayta och → ko'rinadimi).
3. **Docs:** gap table updated, phase completion noted in `docs/IOT-RE-AUDIT-2026-06-08.md`.
4. **Tests:** BE unit test for OEE calculation + Result pattern; FE test for tablet checklist flow.
5. **i18n:** all new keys in `uz` + `ru` namespaces; no hardcoded strings in TSX.
6. **Edge cases:** machine with no sessions → graceful; operator without card_id → guard rejects; camera zone with no ideal photo → skip with warning (not crash); sensor disconnect → "aloqa yo'q" (not downtime); иш йук downtime → excluded from operator KPI.
7. **Automation:** cron for 2h inspection, smena auto-report, PM overdue alert, energy stub message. Each cron documented. Each IoT operation logs its **EP-IOT-### op-code** (`level=info code=EP-IOT-010 ...` in NestJS logger).

═══════════════════════════════════════════════════════════════
## RAILS (enforced per phase)

- **Permission gate:** state `file:line` + exact change + reason before any edit; no implicit approval.
- **Verify-don't-trust:** every existing claim re-verified live before proceeding (hit the endpoint, count DB rows).
- **Separate commit per phase:** `git add <specific-files>` only; commit message includes phase number + EP codes.
- **No regressions:** after every phase, run existing reviewer scripts (`bash scripts/run-all-reviewers.sh`); FAIL = fix before moving on.
- **No rewrite:** system is ~70% built — extend, connect, fix gaps. Do not replace working code.
- **Honest 501 over fake:** if a feature requires sensor hardware not yet installed (energy, predictive maintenance, compressor) → return `501` with `code: "EP-IOT-###-PENDING"` and a human-readable message. NEVER fake sensor data.
- **DDL = owner approval:** any new `CREATE TABLE` → write migration file with `APPROVED: <owner-name> <date>` comment → STOP → wait for owner "ha, bajar" before `db.migrate()`.
- **AI observes, human confirms (E1):** camera AI flags violations/PPE issues/attendance anomalies → these are SAVED but `is_confirmed = false`. No HR action (jarima/ball/blok) until human presses "Tasdiqlash" on the specific alert. This is enforced at service layer, not just UI.
- **Report in Uzbek:** after each phase, post completion report in Uzbek (lotin) to owner: nima qilindi / qaysi EP kodlar / commit hash / qaysi test o'tdi / keyingi bosqich.

═══════════════════════════════════════════════════════════════
## STOP POINTS (mandatory — do not proceed past these without explicit "continue")

1. **After Phase 0 RE-AUDIT** — show `docs/IOT-RE-AUDIT-2026-06-08.md` to owner, get approval before any build.
2. **Before any DDL migration** — show migration SQL + justification; owner must say "APPROVED:" before running.
3. **Phase 1 DDL** — `add-machines-registry.sql` + session canonicalization.
4. **Phase 4 DDL** — `oee_snapshots` table (if not exists).
5. **Phase 5 DDL** — `camera_zones / room_inspections / inspection_violations / ppe_alerts / attendance_camera_log`.
6. **Phase 6 DDL** — `machine_maintenance_logs / pm_schedules / pm_task_master / norma_change_log`.
7. **Before touching canonical tables** (`sales_orders`, `warehouse_stock`, `entries`) — confirm with owner; these tables are read-only from IoT perspective (IoT writes to its own tables, reads canonical tables for context).
8. **After each phase** — show report in Uzbek, wait for "davom" before starting next phase.
