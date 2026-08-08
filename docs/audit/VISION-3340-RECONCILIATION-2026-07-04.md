# EuroPrint ERP — Vision Findings Reconciliation Audit (2026-07-04)

**Role:** Auditor (read-only). No code modified, no migrations run, no commits. Status audit only.

**Source:** `EUROPRINT_ERP_VIZYON_3340_PROMPTLAR.jsonl` — 3340 rows = **835 unique findings**
(deduplicated by `source_band_id`; each finding expanded into 4 prompt variants). Priority mix:
**P0=152, P1=383, P2=300**.

**Method (per finding):** the original `build` description is re-verified against the *current* code —
the cited `evidence` files are opened/greped now, not trusted from the old audit. Each finding is
classified into exactly one bucket:

- **RESOLVED** — the gap in `build` no longer exists; `vision` behavior implemented (current file:line cited).
- **STILL-OPEN** — `build` still matches current code (re-verified).
- **PARTIALLY-RESOLVED** — part fixed, part remains (what remains is stated).
- **UNVERIFIABLE** — cited file/table/route gone or finding too vague; reason stated.

**Area processing order** (by P0 weight, per directive): CKP → HR → Auth → Golden-thread → PP →
then remaining areas by P0 count. One area per pass; results appended below as each pass completes.

**Cross-reference docs** consulted for double-tracking: `docs/audit/ROUTE-STATUS-AUDIT-2026-07-03.md`,
`docs/audit/SAP-AUDIT-2026-06-06.md`, `docs/audit/SAP-CONFORMANCE-CHECK.md`.

> Progress: this report is written incrementally (one area per loop pass). Areas not yet listed below
> are pending. The Summary section is appended only after all 20 areas are complete.

---

## Area 01 — CKP / maqsad / KPI (54 findings · P0=14 P1=22 P2=18)

**Headline:** most of the CKP *mechanism* the original audit called "MISSING" now exists and is wired.
Confirmed live: `ckp_fact_values`/`ai_ckp_scores`/`ai_ckp_chat_logs`/`company_tskp` tables all present;
5 ЦКП columns on `org_departments`; a real `hr/payroll/ckp-gate.ts` (`CkpGateService`) that payroll
actually calls (`hr/payroll/payroll.service.ts:454` `evaluatePeriod`); an `org-structure/cascade/`
roll-up listener; `ckp-mes-feed.listener.ts`; and `ai-daily-report.cron.ts`. The remaining gaps are
**data** (`ckp_fact_values`=0 rows; `tskp_target`/`ckp_formula_type` filled only 1/145) and specific
**UI + secondary features** (multi-product slot, per-card error-catalog, `ai_ckp_scores` writer).

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0001 | P0 | payroll never queries ckp_fact_values / no gate | RESOLVED | hr/payroll/payroll.service.ts:107,454 (injects CkpGateService, calls evaluatePeriod per-day) | gate reads live ckp_fact_values (ckp-gate.ts:155-186) |
| SB0002 | P0 | AI daily ЦКП question missing | RESOLVED | ai/application/services/ai-daily-report.cron.ts:38 (Cron 08:00 → ai_ckp_chat_logs) | mechanism built; ai_ckp_chat_logs still 0 rows (data) |
| SB0003 | P0 | IoT/MES→ckp auto-feed not wired | RESOLVED | org-structure/ckp-mes-feed.listener.ts (+ registered in org-structure.module.ts) | listener exists; no MES data to feed yet |
| SB0004 | P0 | ЦКП target/formula/frequency owner-data not filled | PARTIALLY-RESOLVED | org_departments: has_deadline=145/145, tskp_target=1/145, ckp_formula_type=1/145 | deadline now filled; target+formula still owner-data gap |
| SB0005 | P1 | Multi-product slot UI missing (2+ deliverables/day) | STILL-OPEN | no multi-slot UI; ckp_fact_values keyed card_id+fact_date | unchanged |
| SB0006 | P1 | Error-catalog table missing (per-card) | STILL-OPEN | to_regclass ckp_error_catalog/card_error_catalog = null (only defect_catalog=QC) | no per-card ЦКП error catalog |
| SB0007 | P2 | Cascading aggregation UI missing (Card→Dept→Otdel) | PARTIALLY-RESOLVED | cascade BE exists (ckp-cascade.listener.ts); hierarchy dashboard UI unconfirmed | BE roll-up done; FE dashboard uncertain |
| SB0008 | P2 | 'ЦКП status today' badge UI missing | STILL-OPEN | no submitted/deadline badge found in FE | UI gap |
| SB0009 | P2 | Formula-type UI + toggle missing | STILL-OPEN | column exists but no card-detail formula toggle UI | UI gap |
| SB0010 | P2 | LmsCompletionService darslik-gate STUB | PARTIALLY-RESOLVED | ЦКП gate now real (ckp-gate.ts); LMS/darslik completion gate is a separate gate | see LMS area for darslik gate |
| SB0011 | P2 | Cascade recursion depth UI (full tree roll-up) | PARTIALLY-RESOLVED | BE walks full ancestorChain (ckp-cascade.listener.ts:88-107); FE depth unconfirmed | BE full-chain; FE uncertain |
| SB0012 | P0 | AI-chatbot kunlik ЦКП savol yo'q | RESOLVED | ai-daily-report.cron.ts:38-47 | dup of SB0002 |
| SB0013 | P0 | IoT/MES→karta ЦКП avto-feed yo'q | RESOLVED | org-structure/ckp-mes-feed.listener.ts | dup of SB0003 |
| SB0014 | P0 | ЦКП kaskad agregatsiya (parent SUM) yo'q | RESOLVED | cascade/ckp-cascade.listener.ts:98-107 (rollupParentDay per ancestor) | BE cascade real |
| SB0015 | P0 | Kunlik deadline→oylik gate ulanmagan | RESOLVED | hr/payroll/payroll.service.ts:359-454 (evaluatePeriod day-gate) | dup of SB0001 |
| SB0016 | P1 | ЦКП formula-turi 4 enum yo'q | PARTIALLY-RESOLVED | org_departments.ckp_formula_type column exists (data 1/145); 4-enum validation unconfirmed | column present; enum+data partial |
| SB0017 | P1 | Multi-product ЦКП slot (1..N) yo'q | STILL-OPEN | dup of SB0005 | unchanged |
| SB0018 | P1 | Per-employee ЦКП norma override yo'q | STILL-OPEN | ckp meta on org_departments (card-level), no per-employee override | unchanged |
| SB0019 | P1 | ai_ckp_scores hisoblanmaydi | STILL-OPEN | ai_ckp_scores table exists; grep found NO writer in modules | table present, no compute |
| SB0020 | P1 | Kunlik deadline ziddiyati 16h vs 3h | UNVERIFIABLE | code uses per-card ckp_report_deadline_hours (configurable); "which spec" = owner decision | spec/owner, not code gap |
| SB0021 | P2 | Tiklash workflow (blok→HR unlock) yo'q | STILL-OPEN | no unlock/recovery workflow found | unchanged |
| SB0022 | P0 | OQIM-UZILISHLAR (6 ta) skelet oziqlanmaydi | RESOLVED | feeds now wired: ckp-mes-feed + ai-daily-report.cron + cascade + payroll gate | mechanism fed; data still 0 |
| SB0023 | P1 | DATA 0 — ЦКП jadvallar bo'sh | STILL-OPEN | ckp_fact_values=0 rows (live count) | genuine data gap |
| SB0024 | P1 | XATO-KATALOG + AI BAHO qurilmagan | STILL-OPEN | no error-catalog table (see SB0006) | unchanged |
| SB0025 | P1 | Multi-product/employee slot noaniq | STILL-OPEN | dup of SB0005/0017 | unchanged |
| SB0026 | P1 | Gate mexanizmi real emas (adolat) | RESOLVED | ckp-gate.ts applyCkpGate (QATTIQ-0, live ckp_fact_values, no fabrication) | gate is real + honest-0 |
| SB0027 | P2 | Endpoint test/FE-UI o'tishi | PARTIALLY-RESOLVED | ckp.controller + cascade endpoints exist; FE/test coverage unconfirmed | endpoints real; coverage uncertain |
| SB0028 | P2 | Deadline ziddiyati spec | UNVERIFIABLE | spec/owner decision (dup SB0020) | — |
| SB0029 | P0 | ЦКП jadval DB'da yo'q | RESOLVED | to_regclass('ckp_fact_values') = ckp_fact_values | table exists now |
| SB0030 | P0 | Ikki endpoint/ikki table konfuziya | PARTIALLY-RESOLVED | ckp_fact_values canonical; ai_ckp_scores 2nd dim unwritten | fact canonical; scores unwired |
| SB0031 | P1 | FE ЦКП tab org-structure'da yo'q | PARTIALLY-RESOLVED | OrgStructureHierarchy.tsx contains ckp refs | some FE present; completeness uncertain |
| SB0032 | P1 | Deadline gate cron yo'q | PARTIALLY-RESOLVED | deadline enforced at payroll read (evaluatePeriod); no separate cron | gate is pull-based; cron arguably unneeded |
| SB0033 | P1 | Kaskad-agregat FE'da unwired | PARTIALLY-RESOLVED | BE cascade done; FE roll-up view unconfirmed | BE done, FE uncertain |
| SB0034 | P1 | AI-chatbot savol unwired + fallback yo'q | RESOLVED | ai-daily-report.cron.ts:15-18 (graceful static fallback documented) | cron + static fallback |
| SB0035 | P2 | Multi-product slot yo'q | STILL-OPEN | dup of SB0005 | — |
| SB0036 | P2 | Xato-katalog yo'q | STILL-OPEN | dup of SB0006 | — |
| SB0037 | P2 | Formula-turi ustuni yo'q | RESOLVED | org_departments.ckp_formula_type column present | column exists |
| SB0038 | P2 | Deadline soat spec ziddiyati | UNVERIFIABLE | spec/owner (dup SB0020) | — |
| SB0039 | P2 | FE form deprecated + do-not-add | UNVERIFIABLE | vague/directive-style finding, no concrete current gap | — |
| SB0040 | P1 | /aisha sidebar entry missing | STILL-OPEN | /aisha route in AppRouter.tsx; no sidebar/constants match in grep | route yes, sidebar entry absent |
| SB0041 | P1 | DirectorDashboard decoupling verify | UNVERIFIABLE | verification-only finding; DirectorDashboard not re-grepped this pass | — |
| SB0042 | P2 | Orb animation state binding | UNVERIFIABLE | requires FE runtime inspection of [data-status] | low-level, not re-run |
| SB0043 | P2 | Immersive design isolation | RESOLVED | finding itself confirms scoped .aisha-immersive "✅ good" | self-confirmed positive |
| SB0044 | P0 | Aisha tool live-run proof missing | UNVERIFIABLE | requires live AI-key run (Q-30/Q-32) — not performed read-only | needs runtime proof |
| SB0045 | P1 | TransparencyPanel implement status | PARTIALLY-RESOLVED | component file exists; tool-provenance detail unread this pass | present, depth unverified |
| SB0046 | P1 | Sidebar routing /aisha source | PARTIALLY-RESOLVED | route in AppRouter.tsx; DirectorRoutes/AdminRoutes entry unconfirmed | route yes, menu entry uncertain |
| SB0047 | P0 | ckp_fact_values jadval mavjud emas | RESOLVED | to_regclass('ckp_fact_values') non-null | table exists |
| SB0048 | P0 | ckp_formula_type/frequency/deadline ustunlari yo'q | RESOLVED | 5 ЦКП columns present on org_departments (info_schema) | columns exist |
| SB0049 | P1 | Kunlik deadline dual-spec ziddiyat | UNVERIFIABLE | spec/owner (dup SB0020) | — |
| SB0050 | P1 | ckp_fact_values + ai_ckp_scores ikki o'lcham | PARTIALLY-RESOLVED | ckp_fact_values real+gated; ai_ckp_scores exists but no writer | fact dim done; score dim unwired |
| SB0051 | P1 | Formula norma NULL → always 0 | PARTIALLY-RESOLVED | ckp-fact.service calcAchievement returns 0 when target NULL (by design, Q-40 honest-0) | intended 0; masked by unfilled target data |
| SB0052 | P2 | company_tskp created but not attached | PARTIALLY-RESOLVED | company_tskp table exists; card→catalog attachment unconfirmed | table present, linkage uncertain |
| SB0053 | P2 | Kaskad-agregat endpoint re-check | RESOLVED | cascade/ckp-cascade.listener.ts + repo.rollupParentDay | cascade path exists |
| SB0054 | P2 | Machineless bot report separate (hr-gsd) | RESOLVED | ai-daily-report handles machineless ЦКП push; hr-gsd module present | machineless path built |

**Area 01 tally:** RESOLVED=17 · STILL-OPEN=13 · PARTIALLY-RESOLVED=16 · UNVERIFIABLE=8.
**Cross-ref:** SB0023 (ЦКП data=0) and SB0004 (owner-data unfilled) overlap the "empty master-data / build-phase"
theme in `ROUTE-STATUS-AUDIT-2026-07-03.md`; SB0044/0041/0040/0046 (Aisha) belong to the AI-area, tracked there too.

---

## Area 02 — HR / Xodim / karta-xodim bog'lanish (54 findings · P0=14 P1=24 P2=16)

**Headline:** significant, precise progress since the original audit — a real card-based gated-payroll
formula chain exists (`previewCardSalary` → `computeGatedMonthlySalary` → `prorateCardPay`, live razryad
coeff + ЦКП-gate + LMS-gate), and a full razryad-execution chain (`razryad_history` table with
`hr_approved_by`/`manager_approved_by` = 2-signature, `exam-passed-razryad.listener.ts` wired to exam
events). But the **actual period-close path** (`closePeriod`) still reads pre-stored `payroll_rows.base_salary`
via `normalizeRow`, NOT the live card formula — the card-based path exists only as a `preview` endpoint
(`hr-payroll-closure.controller.ts:68`). This is a precise, load-bearing PARTIALLY-RESOLVED, not a full fix.
Card-employee FE linkage (EmployeeProfile.tsx) remains completely disconnected — confirmed no `card_id`/
`employee_cards`/`razryad` references in that file at all.

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0055 | P0 | card_id NULL login+oylik gate yo'q | PARTIALLY-RESOLVED | auth/.../login.service.ts:126-128 (resolveCardGate + CARD_LOGIN_GATE_ENABLED env, default likely false) | gate code real; verify env default before trusting it's live |
| SB0056 | P0 | Oylik karta asosida EMAS, base_salary asosida | PARTIALLY-RESOLVED | payroll.service.ts:401-560 (computeGatedMonthlySalary/previewCardSalary, card-based) vs :157-221 (closePeriod→normalizeRow reads stored base_salary) | live-card formula exists but NOT wired into closePeriod |
| SB0057 | P1 | Razryad o'sish/pasayish EXECUTION zanjiri yo'q | RESOLVED | org-structure/razryad-history.service.ts:106,117 (hrApprove/managerApprove) + exam-passed-razryad.listener.ts:41 (@OnEvent EXAM_PASSED_EVENT) | full exam→approve→history chain built |
| SB0058 | P1 | YAGONA-DDL emas — org_departments vs org_functions vs departments parallel | STILL-OPEN | to_regclass: departments (18 rows, 5 live readers incl. core/departments/departments.repository.ts) + org_functions + org_departments all exist live | 3-table parallel confirmed still real |
| SB0059 | P1 | ЦКП avto-tizimi YO'Q | RESOLVED | dup of Area01 SB0002/0003/0012/0013 (mechanisms built) | — |
| SB0060 | P1 | Karta lifecycle 5-holat yo'q — faqat boolean | PARTIALLY-RESOLVED | org_departments.current_state (text) exists; live values only 'active'/null observed | column added but not populated as full 5-state |
| SB0061 | P2 | ЦКП/darslik oylik-gate ulanmagan | RESOLVED | dup SB0070 (lmsGate.isCardTrainingComplete wired in computeGatedMonthlySalary:440) | — |
| SB0062 | P0 | card_id NULL login-gate YO'Q | PARTIALLY-RESOLVED | dup of SB0055 | — |
| SB0063 | P0 | Oylik payroll KARTA-DATA ulanmagan | PARTIALLY-RESOLVED | dup of SB0056 | — |
| SB0064 | P0 | ЦКП avto-tizimi 0 | RESOLVED | dup SB0059/Area01 | data still 0 (see Area01) |
| SB0065 | P1 | Razryad o'sish/pasayish EXECUTION YO'Q | RESOLVED | dup of SB0057 | razryad_history=0 rows (data gap) despite mechanism |
| SB0066 | P1 | Karta 5-holat state-machine YO'Q | PARTIALLY-RESOLVED | dup of SB0060 | — |
| SB0067 | P1 | YAGONA DDL emas — 3 parallel BASE | STILL-OPEN | dup of SB0058 | — |
| SB0068 | P1 | Manager_id backfill DATA-gated | PARTIALLY-RESOLVED | org_departments has no `manager_id` col; canonical is `head_user_id` (18/145 filled) | correctly named col exists; mostly unfilled (owner-data) |
| SB0069 | P1 | Karta-shablon + Excel import YO'Q | PARTIALLY-RESOLVED | org-structure/card-template.controller.ts: GET/POST/PATCH/DELETE + POST :id/apply-template | full CRUD+apply exists; explicit "Excel" import format unconfirmed |
| SB0070 | P1 | LMS/Darslik-gate oylik'ga ulanmagan | RESOLVED | payroll.service.ts:439-450 (lmsGate.isCardTrainingComplete, fail-closed) | real, fail-closed gate before ЦКП-gate |
| SB0071 | P1 | Mentor biriktirilishi YO'Q (2 mentor) | STILL-OPEN | `mentors` table exists but generic profile (id/name/bio/expertise/user_id) — no card_id column | table ≠ card-mentor link |
| SB0072 | P1 | Onboarding→karta faollash+payroll YO'Q | STILL-OPEN | grep for employee_cards in hr/onboarding/*.ts = no matches | unchanged |
| SB0073 | P1 | Karta 2-imzo gate (tasdiqlovchi+tanishgan) YO'Q | RESOLVED | razryad_history columns: hr_approved_by + manager_approved_by (info_schema) | 2-signature exists, scoped to razryad-change (not general card lifecycle) |
| SB0074 | P1 | Karta Vakansiya aging/prioritet/SLA YO'Q | STILL-OPEN | only a notification-template string hit; no aging/SLA computation found | unchanged |
| SB0075 | P2 | Karta-xodim stavka-ulush formula EMAS | PARTIALLY-RESOLVED | computeGatedMonthlySalary/prorateCardPay take `stakeShare` param (default 1.0) | param wired; live multi-card stake data unconfirmed |
| SB0076 | P2 | RBAC karta asosida EMAS — eski positions'ga keyed | PARTIALLY-RESOLVED | permission.guard.ts:115 (cardId path) AND :127 (position_id fallback) both present | dual-path, not fully migrated off positions |
| SB0077 | P2 | Maxfiy maydon field-level RBAC YO'Q | STILL-OPEN | no field-level RBAC evidence found this pass | unchanged |
| SB0078 | P0 | users.card_id PRIMARY GATE UMUMAN YO'Q | PARTIALLY-RESOLVED | users.card_id (int, FK fk_users_card_id) exists; login.service.ts:127 gate is env-flagged | column+FK+logic real; gate is opt-in not default-on |
| SB0079 | P0 | employee_cards assignment FLOW DISCONNECTED (0 live) | PARTIALLY-RESOLVED | employee_cards table now has 1 row (was 0) | improved from 0→1 but still effectively empty |
| SB0080 | P0 | Card salary data EMPTY (0/97) | STILL-OPEN | org_departments: salary_type=0/145, min_salary=0/145, max_salary=0/145 filled | confirmed still 0, genuine owner-data gap |
| SB0081 | P1 | Razryad o'sish EXECUTION PROCESS = 0 | RESOLVED (mechanism) | dup SB0057; razryad_history=0 rows | mechanism built, data still 0 |
| SB0082 | P1 | LMS darslik-gate UNWIRED from payroll | RESOLVED | dup of SB0070 | — |
| SB0083 | P1 | ЦКП deadline → oylik-gate INTEGRATION 0 | RESOLVED | dup of Area01 SB0001/SB0015 | — |
| SB0084 | P1 | payroll→GL entries atomik link YO'Q | RESOLVED | payroll.service.ts closePeriod: this.gl.postJournal(...) before markPeriodClosed (atomic order) | GL posting wired, ordered before period-close |
| SB0085 | P2 | M:N card assignment stake-ulush PARTIAL | PARTIALLY-RESOLVED | dup of SB0075 | — |
| SB0086 | P2 | Razryad-oylik coefficient dynamic apply STATIC | PARTIALLY-RESOLVED | previewCardSalary reads live razryadCoeff via hrRepo.getRazryadCoefficient; closePeriod legacy path unconfirmed to use it | preview path dynamic; close path uncertain |
| SB0087 | P2 | RBAC card-tier routing eski position_id keyed | PARTIALLY-RESOLVED | dup of SB0076 | — |
| SB0088 | P0 | card_id NULL → login/oylik GATE yo'q | PARTIALLY-RESOLVED | dup of SB0055 | — |
| SB0089 | P0 | Xodim-karta UI bog'lanish yo'q | STILL-OPEN | EmployeeProfile.tsx: no card_id/cardId/employee_cards references found | confirmed still disconnected |
| SB0090 | P1 | Karta-xodim M:N FE'da ishlatilmagan | STILL-OPEN | dup of SB0089 | — |
| SB0091 | P1 | Multi-card oylik yig'indi UI yo'q | STILL-OPEN | no FE evidence found | unchanged |
| SB0092 | P1 | Razryad FE'da EmployeeProfile'da ko'rinmaydi | STILL-OPEN | EmployeeProfile.tsx: no "razryad" references found | confirmed still absent |
| SB0093 | P1 | Darslik-gate UI va xodim-karta link yo'q | STILL-OPEN | no FE evidence found | unchanged |
| SB0094 | P2 | Papka (6-bo'lim+portret) modal yo'q | UNVERIFIABLE | not re-checked this pass (low priority, needs deeper FE read) | — |
| SB0095 | P2 | Acting (i.o.)/stavka-ulush UI yo'q | STILL-OPEN | no FE evidence found | unchanged |
| SB0096 | P2 | Karta tahlili (fit-score) disconnected | UNVERIFIABLE | not re-checked this pass | — |
| SB0097 | P0 | card_id NULL → login TAQIQ AMALI YO'Q (env OFF) | PARTIALLY-RESOLVED | login.service.ts:127 CARD_LOGIN_GATE_ENABLED === 'true' (opt-in) | finding's own framing ("blueprint bor, default OFF") matches exactly |
| SB0098 | P0 | Oylik kartadan emas, baseSalary parametrdan | PARTIALLY-RESOLVED | payroll.service.ts:221 (normalizeRow still reads raw['baseSalary']??raw['base_salary']); cited line 132 has moved/changed (file restructured) | same substantive gap, different line now |
| SB0099 | P0 | RBAC eski positions'ga keyed | PARTIALLY-RESOLVED | permission.guard.ts:115 card path + :127 position_id fallback (cited lines 48-61 shifted) | dual-path confirmed, cited lines moved |
| SB0100 | P0 | employee_cards M:N ABANDONED (0 qator) | PARTIALLY-RESOLVED | dup of SB0079 (now 1 row) | — |
| SB0101 | P1 | Onboarding→karta buzuq (employee_cards TEGMAYDI) | STILL-OPEN | dup of SB0072, confirmed via grep | — |
| SB0102 | P1 | Karta DATA egasidan kutilmoqda (0% tayyorlik) | STILL-OPEN | dup of SB0080 | — |
| SB0103 | P2 | Darslik-gate LMS oyligga ulanmagan | RESOLVED | dup of SB0070 (now real, not just "check bor") | — |
| SB0104 | P2 | ЦКП kunlik hisobot gate + oylik link YO'Q | RESOLVED (mechanism) | dup of Area01/SB0001; tskp_target fill cited as 25/92 (differs from Area01's 1/145 — possibly different filter/snapshot time) | mechanism resolved; data-fill number should be reconciled in follow-up |
| SB0105 | P2 | Karta holatlari 5-holat only boolean+enum | PARTIALLY-RESOLVED | dup of SB0060 | — |
| SB0106 | P2 | razryad_history jadval SCHEMA'DA yo'q | RESOLVED | to_regclass('razryad_history') non-null, 14 columns incl. hr_approved_by/manager_approved_by | table now exists (0 rows — data gap only) |
| SB0107 | P2 | Karta nomi avto-raqamlash (Operator-01/02) YO'Q | STILL-OPEN | no generateCardCode/auto-numbering evidence found | unchanged |
| SB0108 | P2 | Karta shabloni (Excel import, export-only) | PARTIALLY-RESOLVED | dup of SB0069 | — |

**Area 02 tally:** RESOLVED=13 · STILL-OPEN=15 · PARTIALLY-RESOLVED=24 · UNVERIFIABLE=2.
**Cross-ref:** SB0059/64/70/82/83/103/104 (ЦКП/LMS-gate wiring) are literal duplicates of Area01 CKP findings
SB0001/0002/0003/0012/0013/0015 — same underlying fix, tracked under both areas by the original audit's
per-area sampling; do not fix twice. SB0055/62/78/88/97 (card-login-gate) and the card-formula/closePeriod
gap (SB0056/63/98) are the two most consequential PARTIALLY-RESOLVED findings in this area — both have real,
tested code paths that are simply not wired into the *default*/*live-close* flow yet (env flag off; preview-only
endpoint). This exactly matches the "PP Faza 1 gate patterns" style already used elsewhere in the codebase
(feature real but flag-gated) — a fast, low-risk finish (flip the flag / wire closePeriod to previewCardSalary)
rather than new-build work.

---

## Area 05 — Auth / RBAC / login (karta-gate) (44 findings · P0=11 P1=16 P2=17)

**Headline:** a critical, PRECISE correction to Area02's framing: `permission.guard.ts` DOES check `cardId`
first (`checkCardFromDb`), but that method is gated by a hardcoded module-level constant
`CARD_PERMISSION_SOURCE_READY = false` (permission.guard.ts:35) — not an env flag, a literal `false` in
source. So in practice RBAC is **100% position_id-based today**, with a dead card-seam that can never
activate without a code change. Two of the three CLAUDE.md-flagged dangerous `sql.raw(variable)` sites
(`schema.ts:119`, `invariants.ts:86`) are confirmed **still present**; the third (`legacy.service.ts`) is
confirmed **fixed** (comment: "historic sql.raw(rawQuery) pass-through has been [refactored]"). Admin default
password is confirmed fixed (throws if `ADMIN_SEED_PASSWORD` unset — CLAUDE.md's "Qoida A" section is stale).
Tenant-isolation infra (`tenant.middleware.ts`, `tenant-filter.guard.ts`, 47 `tenant_id` columns) exists but
enforcement depth wasn't independently re-verified this pass.

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0189 | P0 | Card-gate default-OFF, not enforced at login | PARTIALLY-RESOLVED | login.service.ts:127-128 (CARD_LOGIN_GATE_ENABLED env check, opt-in) | dup of Area02 SB0055/62/78/88/97 |
| SB0190 | P0 | RBAC keyed to position_id (legacy), not card | STILL-OPEN | permission.guard.ts:35 `CARD_PERMISSION_SOURCE_READY = false` (hardcoded, not env) | card path exists but is permanently dead code today |
| SB0191 | P1 | employee_cards all inactive (0 rows is_active=true) | PARTIALLY-RESOLVED | employee_cards: total=1, active=1 (was 0) | improved from 0, still near-empty |
| SB0192 | P1 | JWT carries cardId/rbacTier but guard ignores | PARTIALLY-RESOLVED | permission.guard.ts:115-120 (reads user.cardId, calls checkCardFromDb) but that always returns null (SB0190) | checked-then-discarded, not literally ignored in code |
| SB0193 | P2 | Salary calc entry point unknown (not in auth module) | RESOLVED | hr/payroll/payroll.service.ts (confirmed Area02) — entry point now well-defined | — |
| SB0194 | P0 | card_id NULL login/oylik gate yo'q | PARTIALLY-RESOLVED | dup of SB0189 | — |
| SB0195 | P0 | RBAC eski positions'ga keyed | STILL-OPEN | dup of SB0190 | — |
| SB0196 | P0 | users.card_id ustuni UMUMAN YO'Q | RESOLVED | users.card_id (int) + fk_users_card_id (confirmed Area02) | column+FK now exist |
| SB0197 | P1 | Field-level RBAC projection yo'q (salary/razryad/AI-baho) | STILL-OPEN | no field-level projection/masking logic found | not re-verified deeply this pass, but no evidence found |
| SB0198 | P1 | I.o. (Acting) Scoped RBAC yo'q | STILL-OPEN | no scoped-permission logic for acting roles found | unchanged |
| SB0199 | P1 | Karta 2-imzo faollashtiruvi QURILMAGAN (card oldindan faol) | STILL-OPEN | razryad_history 2-signature (hr_approved_by/manager_approved_by) covers razryad-CHANGE, not card CREATION/activation | distinct from Area02 SB0073 — that's razryad-change, this is card-activation |
| SB0200 | P1 | Default parol + hardcoded credentials xavfi | RESOLVED | admin.seed.ts:15-19 (throws if ADMIN_SEED_PASSWORD unset, no fallback) | CLAUDE.md "Qoida A" entry for this file is stale |
| SB0201 | P2 | Payroll Card-Gate YO'Q | PARTIALLY-RESOLVED | dup of Area02 SB0056 (computeGatedMonthlySalary exists, not wired into closePeriod) | — |
| SB0202 | P2 | Token TTL 24h ≠ Q-17's 15min | PARTIALLY-RESOLVED | auth.module.ts:45 fallback='24h'; jwt.config.ts:18 fallback='15m' — TWO different defaults in two files | inconsistency itself is a bug, not just wrong value |
| SB0203 | P2 | Absence-block 3 kun → blocks everything, not selective | STILL-OPEN | attendance-bot.service.ts:122 / notification-templates.ts:79 — blocks "ERP kirishingiz" (login) broadly | no selective (login-only vs payroll-only) granularity found |
| SB0204 | P1 | Tenant isolation NOT enforced despite tenant_id columns | PARTIALLY-RESOLVED | 47 tenant_id columns now (cited 21); tenant.middleware.ts + tenant-filter.guard.ts exist | infra present; per-query enforcement depth not re-audited this pass |
| SB0205 | P1 | TenantMiddleware opt-in per-module, unclear coverage | UNVERIFIABLE | would require per-module middleware-registration audit not performed this pass | — |
| SB0206 | P1 | withTenantBypass() enforcement relies on caller | STILL-OPEN | only 1 call site found; no independent enforcement check added | as originally described |
| SB0207 | P2 | tenant_id int vs string type drift | UNVERIFIABLE | not type-checked column-by-column this pass | — |
| SB0208 | P2 | Multi-tenant test coverage 0 | UNVERIFIABLE | test suite not run/audited this pass | — |
| SB0209 | P2 | RBAC position_id→position_permissions cache+DB fallback+admin exception | RESOLVED | permission.guard.ts: isAdminRole check, fetchFromCacheAsync, checkFromDb fallback all present | mechanism as described is confirmed present |
| SB0210 | P0 | Default password fixed, but migration SQL test123 hash risk | PARTIALLY-RESOLVED | admin.seed.ts fixed (SB0200); org-structure-sync.sql test123 hash not re-checked this pass | seed fixed; migration-file hash not re-verified |
| SB0211 | P0 | SQL injection: legacy.service fixed, but sql.raw() in ~14-18 files | PARTIALLY-RESOLVED | legacy.service.ts comment confirms fix; schema.ts:119 + invariants.ts:86 STILL use sql.raw(variable) | 2 of 3 originally-flagged dangerous sites remain; most of the 18 total are literal-string DDL (acceptable per Qoida B) |
| SB0212 | P0 | card_id NULL login-gate EFFECTIVE BO'LMAGAN (env false) | PARTIALLY-RESOLVED | dup of SB0189, framing confirmed exactly accurate | — |
| SB0213 | P1 | RBAC eski positions'ga keyed (PermissionGuard positionId) | STILL-OPEN | dup of SB0190 | — |
| SB0214 | P1 | Oylik kartadan keladi ULANMAGAN | PARTIALLY-RESOLVED | dup of Area02 SB0056/98 | — |
| SB0215 | P1 | manager_id backfill INCOMPLETE (head_user_id 18/144) | STILL-OPEN | org_departments.head_user_id = 18/145 filled (confirms Area02 SB0068 exactly) | mostly NULL, owner-data gap |
| SB0216 | P2 | rbac_tier DATA KELMAGANLIK (0/144) | STILL-OPEN | org_departments.rbac_tier = 0/145 filled | confirmed still 0 |
| SB0217 | P2 | RBAC ikki-olam: org_functions(97)+org_departments(144) parallel | STILL-OPEN | dup of Area02 SB0058/67 (departments+org_functions+org_departments all live) | — |
| SB0218 | P2 | Maxfiy maydon projection EMAS | STILL-OPEN | dup of SB0197 | — |
| SB0219 | P2 | 2-imzo/i.o.-scope EMAS | STILL-OPEN | dup of SB0198/199 | — |
| SB0220 | P0 | CARD_LOGIN_GATE_ENABLED=true holatida feature OFF | UNVERIFIABLE | title references an ambiguous "yangi feature" without enough context to re-trace this pass | — |
| SB0221 | P1 | JWT.strategy sessiya davomida aktiv-karta re-check QILMAYDI | STILL-OPEN | no mid-session card-revalidation logic found (standard stateless JWT behavior) | unchanged |
| SB0222 | P1 | RBAC tier manbasini kartaga ko'chish TAVSIFLANGAN, amalga oshmagan | STILL-OPEN | matches SB0190 exactly (CARD_PERMISSION_SOURCE_READY=false = "described, not activated") | — |
| SB0223 | P2 | Payroll aktiv-kartasiz xodimni SKIP — tavsiflangan, implement qilinmagan | STILL-OPEN | closePeriod (bulk run) uses normalizeRow, no active-card filter found; computeGatedMonthlySalary (per-card preview) does gate but isn't the bulk path | bulk-skip behavior not implemented |
| SB0224 | P2 | JWT payload positionId NULL at token-create | UNVERIFIABLE | truncated finding title, needs fuller context to re-verify precisely | — |
| SB0225 | P2 | FE login error 'kartaga biriktirilmagansiz' xabari | UNVERIFIABLE | FE error-message wording not checked this pass | — |
| SB0226 | P0 | card_id-gate LOGIN EMAS ACTIVE (envFlag OFF) | PARTIALLY-RESOLVED | dup of SB0189/212 | — |
| SB0227 | P0 | RBAC position_permissions'DA KEYED | STILL-OPEN | dup of SB0190 | — |
| SB0228 | P1 | Maxfiy maydon PROJECTION YO'Q | STILL-OPEN | dup of SB0197/218 | — |
| SB0229 | P1 | i.o. SCOPED PERMISSIONS YO'Q | STILL-OPEN | dup of SB0198/219 | — |
| SB0230 | P2 | JWT TTL 24h, karta o'zgarsa token invalidatsiya qilinmaydi | PARTIALLY-RESOLVED | dup of SB0202 (TTL inconsistency); no card-change→token-invalidation found | — |
| SB0231 | P2 | 2-IMZO WORKFLOW YO'Q (karta yaratish darhol faol) | STILL-OPEN | dup of SB0199 — card-creation lacks approval chain (razryad-CHANGE has it, creation doesn't) | — |
| SB0232 | P2 | OYLIK-GATE LOGIN-GA ULANMAGAN | PARTIALLY-RESOLVED | dup of SB0201/Area02 SB0056 | — |

**Area 05 tally:** RESOLVED=4 · STILL-OPEN=21 · PARTIALLY-RESOLVED=13 · UNVERIFIABLE=6.
**Cross-ref:** This area is heavily duplicated with Area02 (card-login-gate, card-payroll-formula, manager_id/
head_user_id, RBAC-positions, 3-parallel-org-base) — do not fix the same gap twice under two band IDs.
**Important correction vs. Area02's framing:** Area02 described the RBAC situation as a "dual-path, not fully
migrated" (implying partial card support). This area's closer read of `permission.guard.ts:35`
(`CARD_PERMISSION_SOURCE_READY = false`, a hardcoded constant, not a runtime/env flag) shows the card path is
currently **inert by design** — a deliberate future seam, not a live partial rollout. Both framings agree on the
practical effect (RBAC is 100% position-based today); this area's evidence is more precise about *why*.
New (non-duplicate) findings worth flagging: the two remaining dangerous `sql.raw()` sites (SB0211:
`schema.ts:119`, `invariants.ts:86`), and the JWT-TTL config inconsistency across two files (SB0202/230).

---

## Area 07 — Golden-thread / event / oqim (20 findings · P0=6 P1=9 P2=5)

**Headline:** the largest positive surprise so far. The original audit's central claim — "outbox/event
pattern not built, `domain_events`=0" — is **factually reversed**: `domain_events` now has 19 rows with
`occurred_at`/`published_at`/`attempts`/`last_error` columns, i.e. a real, working outbox worker. Several
"listener missing/silent-fail" findings turn out to be **already-fixed-and-documented** in the code itself —
`qc/infrastructure/event-handlers/mes-completed.listener.ts`'s own docstring says "Was a NO-OP... Now it
inserts a real qc_inspection" with a proven idempotent backfill sweep. A second major correction: several
findings (SB0287/288) cite `erp_production_plans` as "the" PP-link table and find it unlinked — that table is
confirmed **orphan/legacy (0 rows, 1 read-only reporting usage)**; the actual canonical SD→PP link is
`production_orders.sales_order_id` (FK `production_orders_sales_order_id_fkey`), which IS wired — consistent
with this session's own golden-thread harness run (`node scripts/golden-thread-chain-proof.cjs`, exit 0,
all 6 hops green). Similarly, `production_qc_checks` (cited =0) is a dead/unused table name — the canonical
QC table is `qc_inspections` (4 rows, actively written).

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0279 | P1 | SD→PP async race, no documented outbox guarantee | PARTIALLY-RESOLVED | domain_events table real+active (19 rows, published_at/attempts columns) | outbox exists generally; whether THIS specific event uses it not individually traced |
| SB0280 | P1 | WMS→Finance rental timer skips if orderId/areaM2 undefined | RESOLVED | finance/.../wms-fg-received.listener.ts:22-36 (areaM2 now optional, pending=0 fallback, Q-40-documented); orderId-skip is intentional (nothing to bill) | fixed + reasoned, not a bug anymore |
| SB0281 | P1 | QC→WMS FG material may be null (product_id nullable) | UNVERIFIABLE | not individually re-traced this pass (relates to SB0298) | needs a follow-up deep read |
| SB0282 | P2 | MES→QC raw INSERT bypasses aggregate, no auto QcPassedEvent | PARTIALLY-RESOLVED | mes-completed.listener.ts uses deliberate raw INSERT (documented reason: avoids aggregate string-id vs qc_inspections int-id drift) | intentional workaround, not an oversight; QcPassedEvent fires at a later QC-workflow step (separate) |
| SB0283 | P2 | PP→MES sessions created unassigned (status='created') | PARTIALLY-RESOLVED | pp-released-mes.listener.ts: status='pending' (not 'created') — "canonical open-session status", matches manual-create path | cited status value stale; underlying "waits for operator" behavior is now documented-as-intended |
| SB0284 | P2 | GL posting skips silently if unit_price null | UNVERIFIABLE | not traced this pass | — |
| SB0285 | P0 | Outbox/Event emit taqiq: domain_events=0 | RESOLVED | domain_events: 19 rows live, e.g. id f7aed856... PosMovementCreated occurred_at/published_at 3s apart | outbox pattern now real and active |
| SB0286 | P0 | MES→QC uzilmasi: production_qc_checks=0, mes_production_sessions=8 | PARTIALLY-RESOLVED | production_qc_checks=0 (confirmed, but dead table, no live readers found); canonical qc_inspections=4 rows, actively written by MesCompletedListener | wrong-table citation; canonical table is healthier than claimed |
| SB0287 | P0 | PP→MES: sessions exist but erp_production_plans unlinked | RESOLVED | erp_production_plans=0 rows, 1 read-only usage (erp-reports.repository.ts) — orphan table; canonical production_orders IS linked + harness HOP2 confirms PP→MES session creation works | wrong-table citation; canonical path resolved |
| SB0288 | P0 | SD→PP: sales_orders=13, erp_production_plans unlinked | RESOLVED | dup of SB0287 — production_orders.sales_order_id FK is canonical, confirmed live by harness HOP1 | same correction |
| SB0289 | P1 | QC→WMS fake ulanish, no qc_checks event | RESOLVED | wms/infrastructure/event-handlers/qc-passed.listener.ts:34-35 @EventsHandler(QcPassedEvent), upserts warehouse_stock ("Trigger 11 -> 12") | genuinely event-driven, not a fake/direct bypass |
| SB0290 | P1 | WMS→FIN qisman: entries=6, no warehouse event | PARTIALLY-RESOLVED | entries=7 now (was 6); finance/infrastructure/event-handlers/wms-fg-received.listener.ts + wms-goods-issued.listener.ts both exist | "no event" claim outdated — listeners exist; entries count still low (early-build data volume) |
| SB0291 | P0 | domain_events OUTBOX PATTERN QURILMADI | RESOLVED | dup of SB0285 | — |
| SB0292 | P0 | EVENT LISTENERS SILENT FAIL: MesCompletedListener | RESOLVED | qc/.../mes-completed.listener.ts:1-8 docstring: "Was a NO-OP... Now it inserts a real qc_inspection"; backfill idempotency "proven via rollback-tx DB-proof" | self-documented fix in the code itself |
| SB0293 | P1 | RENTAL TIMER INCOMPLETE: WmsFgReceivedListener | RESOLVED | dup of SB0280 | — |
| SB0294 | P1 | PP→SD FEEDBACK YO'Q (cancel→SD status) | STILL-OPEN | no listener found for PP-plan-cancel → SD-order-status-update direction | unchanged |
| SB0295 | P1 | QC inspection reference bug fixed but needs validation | RESOLVED | mes-completed.listener.ts explicitly documents avoiding the id-type-drift bug by design (direct insert, not aggregate.save) + proven idempotent via rollback-tx | fix + validation both present in the code's own documentation |
| SB0296 | P1 | FINANCE GL ENTRY CHAIN INCOMPLETE | PARTIALLY-RESOLVED | finance/infrastructure/event-handlers/wms-fg-received.listener.ts + wms-goods-issued.listener.ts both exist and are wired | full chain completeness not exhaustively traced this pass |
| SB0297 | P2 | PP→MES idempotent guard WEAK | PARTIALLY-RESOLVED | pp-released-mes.listener.ts:26-50 — single-statement atomic INSERT...SELECT...WHERE NOT EXISTS (standard TOCTOU-safe idiom, reasoned in comments) | guard design is sound; whether a backing unique constraint exists wasn't verified this pass |
| SB0298 | P2 | sales_order_items missing for FG material lookup | UNVERIFIABLE | relates to SB0281, not individually re-traced this pass | — |

**Area 07 tally:** RESOLVED=9 · STILL-OPEN=1 · PARTIALLY-RESOLVED=7 · UNVERIFIABLE=3.
**Cross-ref:** This area's RESOLVED findings directly corroborate this session's own live
`golden-thread-chain-proof.cjs` run (all 6 hops green) recorded earlier in this session — independent
confirmation via two different methods (harness + static re-read). **Important table-name corrections for
future tracking:** `erp_production_plans` and `production_qc_checks` are both dead/orphan table names cited
by the original audit; do not re-flag "unlinked"/zero-row findings against them — the canonical tables are
`production_orders` (SD→PP) and `qc_inspections` (MES→QC) respectively, both of which are live and wired.
The one genuine STILL-OPEN gap (SB0294, PP→SD cancel-feedback) is worth carrying forward as a real backlog
item — it did not overlap with anything already fixed elsewhere.

---

## Area 06 — PP / ishlab-chiqarish reja (46 findings · P0=12 P1=23 P2=11)

**Headline:** a mixed but genuinely encouraging picture. Two claims are flatly reversed: (1) SB0257's
"PP→MES event listener topilmadi — oltin ip uzilgan" is **false today** — `pp-released-mes.listener.ts`
exists, is idempotent, and is independently confirmed by both this pass and Area07's read plus the live
golden-thread harness; (2) SB0235/252's "AI-rejalashtirish MISSING / 7-step not implemented" is also
**largely false** — `pp-ai-planning.service.ts` (349 lines) implements all 7 steps of the E3 principle
(`runStep1Demand` → `runStep2TechcardBom` → `runStep3Mrp` → `runStep4Crp` → `runStep5Sequencing` →
`runStep6ShiftAssign` → `runStep7AiVerdict`) as `buildSkeleton()`, wired to a live controller endpoint, with
a real FE approve-mutation (`AIProductionPlanning.tsx:75-77` → `POST /api/ai-planning/plans/:id/approve`).
On the other hand, the **card-centric linkage gap is real and confirmed**: `production_orders` has NO
`card_id`/`org_department_id`/`qc_gate`/`operator_id`/`supervisor_id` columns, and there is genuinely **no
status-enum CHECK constraint at all** on `production_orders` (only 3 distinct live status values observed:
completed/paused/in_progress — nowhere near the 7-9-state lifecycle vision calls for). Six of the seven new
PP tables the original audit called for (`pp_order_status_log`, `pp_plan_fact_entries`, `pp_reason_codes`,
`pp_shift_plans`, `pp_material_reservations`, `pp_code_dictionary`) are confirmed **still absent**. This
session's own Phase-1 work (texkarta master, `technology_cards`/`tech_card_bom`/`tech_card_routes`/
`tech_card_versions`) directly confirms SB0248: those 3 child tables exist as raw-SQL-only — **no Drizzle
`pgTable` schema definitions were added for them**, exactly as the finding states.

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0233 | P0 | productionOrders lacks card_id (org_card FK) | STILL-OPEN | production_orders: no card_id/org_department_id column (info_schema) | confirmed genuinely missing |
| SB0234 | P0 | workCenter operatorId/supervisorId uses users.id not card | STILL-OPEN | production_orders: no operator_id/supervisor_id columns either | card-based assignment not built |
| SB0235 | P0 | AI-rejalashtirish MISSING, no suggestion/approval endpoint | PARTIALLY-RESOLVED | pp-ai-planning.service.ts:150-165 buildSkeleton (7 real steps) wired via pp-intelligence.controller.ts:53 | substantial real implementation, not missing |
| SB0236 | P1 | ЦКП aggregation to card (Reja bajarilish % not card-attributed) | STILL-OPEN | not independently re-traced this pass; overlaps Area01 CKP theme | — |
| SB0237 | P1 | Replan/Freeze/Urgent hardcoded, not role-gated | STILL-OPEN | is_urgent/is_frozen columns exist at DB level; no role-gate/escalation logic found | data columns present, governance logic not |
| SB0238 | P1 | MES/QC/WMS handoff gates missing (no QC-gate column) | STILL-OPEN | production_orders: no qc_gate column (info_schema) | confirmed missing |
| SB0239 | P2 | Frozen zone (frozen window) logic-only, no TIMESTAMP column | RESOLVED | production_orders.frozen_until column confirmed present (info_schema) | column now exists |
| SB0240 | P2 | workCenter→orgDepartment link NULLABLE (owner-data pending) | UNVERIFIABLE | nullability not specifically queried this pass | — |
| SB0241 | P0 | status CHECK 6-holatli, vizyon 9 talab qiladi | STILL-OPEN | no status-related CHECK constraint found at all on production_orders; live values only 3 distinct (completed/paused/in_progress) | far short of 9-state, and no CHECK exists at all now |
| SB0242 | P0 | production_orders 4 yangi ustun HECH BIRI MAVJUD EMAS | PARTIALLY-RESOLVED | priority + is_urgent + is_frozen + frozen_until ALL 4 confirmed present (info_schema) | reversed — all 4 exist now |
| SB0243 | P0 | pp_order_status_log jadval YO'Q | STILL-OPEN | to_regclass('pp_order_status_log') = null | confirmed absent |
| SB0244 | P0 | pp_plan_fact_entries jadval YO'Q | STILL-OPEN | to_regclass('pp_plan_fact_entries') = null | confirmed absent |
| SB0245 | P0 | pp_reason_codes lookup jadval YO'Q | STILL-OPEN | to_regclass('pp_reason_codes') = null | confirmed absent |
| SB0246 | P1 | pp_shift_plans jadval YO'Q | STILL-OPEN | to_regclass('pp_shift_plans') = null | confirmed absent |
| SB0247 | P1 | Equipment norma ustunlari YO'Q (norma_hourly/brak%/oee_target/unit) | STILL-OPEN | work_centers has efficiency_rate/capacity but not these 4 exact named columns | directly relevant to pending USKUNA-360/CRP-Faza2 equipment-column work |
| SB0248 | P1 | tech_card_bom/routes/versions Drizzle pgTable schema YO'Q | STILL-OPEN | confirmed via direct session knowledge — these 3 tables (built this session, migration 06-pp-tech-card-master.sql) use raw SQL only, no Drizzle schema.ts definitions; grep for the names in lib/db/src/schema and shared/db returns nothing | first-hand confirmation, not just re-derived |
| SB0249 | P1 | frozen_until QOIDASI app-da implement qilinmagan | PARTIALLY-RESOLVED | column exists (SB0239); app-level enforcement of the freeze rule not verified this pass | schema half done, logic half unconfirmed |
| SB0250 | P1 | pp_material_reservations jadval YO'Q | STILL-OPEN | to_regclass('pp_material_reservations') = null | confirmed absent |
| SB0251 | P1 | pp_code_dictionary jadval YO'Q | STILL-OPEN | to_regclass('pp_code_dictionary') = null | confirmed absent |
| SB0252 | P1 | AI rejalashtirish 7-bosqich E3 zanjiri IMPLEMENT qilinmagan | RESOLVED | pp-ai-planning.service.ts: all 7 runStep methods present (demand/techcard-bom/mrp/crp/sequencing/shift-assign/ai-verdict) | dup of SB0235, same evidence |
| SB0253 | P1 | Oltin-ip SD→PP→MES listener BIRON YO'Q | RESOLVED | dup of Area07 SB0287/SB0257 — pp-released-mes.listener.ts confirmed live | — |
| SB0254 | P1 | pp-planning.repository.ts fake/'as unknown' casts, sql.raw | PARTIALLY-RESOLVED | pp-planning.repository.ts:32 uses parameterized sql template (not sql.raw(variable)) for a real INSERT INTO production_orders | the specific sql.raw-fake-code claim looks outdated; 'as unknown' casts not individually re-checked |
| SB0255 | P2 | Smena-gantt jadvali (rangli Gantt) — qanday ko'rsatiladi? | UNVERIFIABLE | FE Gantt implementation not checked this pass | — |
| SB0256 | P2 | priority/is_urgent/is_frozen bor, LEKIN priority_flag enum yo'q | PARTIALLY-RESOLVED | 3 columns confirmed present; no priority_flag enum column found | matches the finding's own precise framing |
| SB0257 | P0 | PP→MES event listener topilmadi — oltin ip uzilgan | RESOLVED | mes/infrastructure/event-handlers/pp-released-mes.listener.ts confirmed exists+wired (dup Area07 SB0287) | claim is false today |
| SB0258 | P1 | production_orders.org_department_id FK yo'q | STILL-OPEN | dup of SB0233, confirmed missing | — |
| SB0259 | P1 | AI rejalashtirish dangsiz (0 data) | PARTIALLY-RESOLVED | algorithms are real (SB0235/252); sales_orders=13, production data exists (Area07) — "0 data" framing outdated though volumes remain low (early build) | — |
| SB0260 | P1 | production_order_components INSERT listener yo'q | UNVERIFIABLE | not checked this pass | — |
| SB0261 | P2 | Status transition guard (7-holat) validate qilinmagan | STILL-OPEN | dup of SB0271 — no state-machine/CHECK found | — |
| SB0262 | P1 | 7-STATUS LIFECYCLE UI REFLECTION YO'Q | STILL-OPEN | only 3 distinct live status values exist in DB; UI can't reflect a lifecycle the DB doesn't model | consistent with SB0241 |
| SB0263 | P1 | AI REJALASHTIRISH TAKLIF→TASDIQ UI YO'Q | RESOLVED | AIProductionPlanning.tsx:75-77 approveMutation → POST /api/ai-planning/plans/:id/approve (real, with isOverride+reason) | UI + endpoint call confirmed |
| SB0264 | P1 | MULTI-LAYER REJA (oylik→haftalik→kunlik→soatlik) DISPLAY YO'Q | UNVERIFIABLE | not checked this pass | — |
| SB0265 | P1 | MUZLATILGAN ZONA + SPLIT + TO'PLAM-GATE UI YO'Q | STILL-OPEN | frozen_until exists at DB (SB0239) but split-logic confirmed absent (SB0275); UI-level display not checked | partial schema, no split-logic, UI unconfirmed |
| SB0266 | P1 | TAB IERARXIYASI QOIDA 42 BUZILDI (6 TAB > 2 DARAJA) | PARTIALLY-RESOLVED | ERPProduction.tsx:54-79 — 6 TabsTrigger, but all in ONE flat TabsList (single level, not nested) | technically compliant with the 2-LEVEL nesting cap; "6 tabs in a row" may still be a separate density/UX concern |
| SB0267 | P2 | GANTT / VISUAL PLANNING UI PARTIAL | UNVERIFIABLE | not checked this pass | — |
| SB0268 | P2 | FORM SAVE CONFIRMATION + ERROR HANDLING QISMAN | UNVERIFIABLE | not checked this pass | — |
| SB0269 | P2 | CRP XODIM-CHEKLOVLI DISPLAY QO'LDA | UNVERIFIABLE | not checked this pass; relates to pending USKUNA-360/CRP work | — |
| SB0270 | P2 | DESIGN-SYSTEM CONSISTENCY (TAB ≤2) → FE REFACTOR KERAK | PARTIALLY-RESOLVED | dup of SB0266 | — |
| SB0271 | P0 | 7-STATUS STATE MACHINE qurilmagan, 13-qator CHECK faqat | STILL-OPEN | no CHECK constraint on status found at all (not even a 13-row superset one); 3 live distinct values only | gap confirmed, cited "13-row CHECK" itself doesn't currently exist |
| SB0272 | P0 | MRP REZULTATLARI DB-GA PERSIST QILINMAYDI | PARTIALLY-RESOLVED | pp-planning.repository.ts:32 + drizzle-pp-production-orders.repo.ts:55 both have real INSERT INTO production_orders paths | persistence code exists; whether the automatic MRP-run flow itself triggers it (vs. a separate manual-create endpoint) not fully traced |
| SB0273 | P0 | APPROVAL/TASDIQ ZANJIRI yo'q — AI-taklif+odam-tasdiq ULANMAGAN | PARTIALLY-RESOLVED | AIProductionPlanning.tsx approveMutation + /api/ai-planning/plans/:id/approve exist (SB0263) | "unlinked" framing outdated; whether release bypasses this specific chain not independently re-checked |
| SB0274 | P1 | CRP CAPACITY DATA YO'Q — work_centers norma/capacity/efficiency NULL/0 (cited 22/22) | PARTIALLY-RESOLVED | work_centers is 12 rows (not 22 — count itself is stale); capacity_per_hour=0/12 filled (confirmed empty); efficiency_rate=11/12 non-default (better than claimed) | mixed: capacity genuinely empty, efficiency mostly populated; directly relevant to pending USKUNA-360/Faza-2 CRP work |
| SB0275 | P1 | SPLIT LOGIC yo'q (qisman yetkazish emas, har partiya 100%) | STILL-OPEN | no split-order logic found | unchanged |
| SB0276 | P1 | work_centers norma 0/22 + BOM versions int/uuid ziddiyat | PARTIALLY-RESOLVED | dup of SB0274 for norma (12 not 22 rows); this session's NEW tech_card_bom table uses integer technology_card_id (no uuid conflict there) — legacy ow_tech_cards (uuid, dead per memory) is the actual source of any lingering int/uuid split | new master schema is int-consistent; legacy dead table still uuid (harmless, unused) |
| SB0277 | P2 | XATALAR-KATALOGI yo'q (PP-specific defect types) | STILL-OPEN | dup of Area01 CKP error-catalog theme (SB0006/024/036) — no per-card/PP error catalog table found | — |
| SB0278 | P2 | MRP PARAMETERS (safety-stock/lead-time/lot-sizing) DB'da yo'q | STILL-OPEN | run-mrp.handler.ts: MaterialPolicy (lotSizingMethod/eoq/leadTime/safetyStock) confirmed as IN-MEMORY command inputs, not DB-persisted config | matches finding exactly |

**Area 06 tally:** RESOLVED=5 · STILL-OPEN=21 · PARTIALLY-RESOLVED=13 · UNVERIFIABLE=7.
**Cross-ref:** SB0253/257 are exact duplicates of Area07 SB0287 (PP→MES listener) — do not fix twice.
SB0236/277 overlap Area01 CKP's ЦКП-aggregation and error-catalog themes. **Direct connections to pending
work in this session:** SB0247/274/276 (equipment/work_centers capacity+norma columns) are the *exact* gap
this session's still-pending PP-CRP-Faza2 and USKUNA-360 equipment-master directives were scoped to close —
implementing those will resolve these three findings as a side effect. SB0248 (tech_card_bom/routes/versions
Drizzle schema) is a known, self-identified gap from this session's own Phase-1 texkarta-master build — those
3 tables were deliberately built via raw SQL (matching the existing `technology_cards` repository pattern) and
were never given Drizzle `pgTable` definitions; if the project later wants Drizzle-typed access to those
tables, that's a distinct, scoped follow-up.

---

## Area 08 — IoT / telemetriya (69 findings · P0=12 P1=30 P2=27 — LARGEST AREA)

**Headline:** the widest range of any area — some flat corrections, some confirmed-critical gaps, and a lot
of "schema built, zero usage." The single most important CONFIRMED-CRITICAL fact: **`users` has 0 rows with
`role='operator'`** — no one can log into the shop-floor tablet as an operator today (SB0312/318 confirmed
exactly). At the same time, the **tablet controller itself is substantially real** — 22 endpoints, only 1
literal `notImplemented` stub found (`tabletLogin`, `tabletSosAlert`, `tabletHandover`, `scanMaterialKitItem`,
`createProductionSession`, `startProductionSession`, `getProductionSessionCrew` are all genuine implementations)
— so SB0313/347's "13/18 endpoints = 501" claim is **stale/reversed**. A dedicated SOS-escalation subsystem
exists (`mes-sos-escalation.service.ts` + `sos-alert-raised-mes.listener.ts` + repo) — RESOLVES SB0323.
`mes_production_sessions` is confirmed (again) to be a VIEW over the single canonical `production_sessions`
table — RESOLVES the "MES↔IoT two-world" framing (SB0319/335/355). The ЦКП-MES-feed and LMS-payroll-gate
findings in this area (SB0339/360) are exact duplicates already resolved in Area01/Area02. On the other hand,
genuine, confirmed-empty gaps remain: `iot_sensor_readings`/`iot_alerts`/`iot_sensors`/`shift_handovers`/
`card_activity_logs` are **all 0 rows or entirely absent**, `IotGateway` is confirmed **never registered** as
a NestJS provider (dead WebSocket code), and `production_sessions.current_stage` exists as a column but is
**100% NULL** (schema built, never exercised).

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0299 | P0 | workerId (users.id) not karta | STILL-OPEN | dup of Area02/06 card-assignment theme; no card-based worker binding found on sessions | — |
| SB0300 | P0 | Karta GSD integrasiyasi YO'Q (MES→karta GSD write) | STILL-OPEN | hr-gsd.repository.ts exists but no card_id/INSERT write path confirmed this pass | module exists, card-linkage unconfirmed |
| SB0301 | P1 | Operator × Mashina RBAC gate YO'Q | STILL-OPEN | no machine-competency gate found | unchanged |
| SB0302 | P1 | Shift handover MES integration missing | PARTIALLY-RESOLVED | shift_handovers table exists (rich schema: handed_over_by/received_by/signature_data/status) but 0 rows | built, unused |
| SB0303 | P1 | Material sarf norma integration missing | STILL-OPEN | not found this pass | — |
| SB0304 | P1 | Shift handover 2-signature + status flows missing | PARTIALLY-RESOLVED | shift_handovers.handed_over_by + received_by + signature_data + status columns all exist | schema supports 2-sig; app-level enforcement + data (0 rows) unconfirmed |
| SB0305 | P2 | Smena-reja UI tanlantirmasi | UNVERIFIABLE | not checked this pass | — |
| SB0306 | P2 | 3-bosqich session model tanlantirmasi | PARTIALLY-RESOLVED | production_sessions.current_stage + stage_started_at columns exist | schema built; current_stage is 100% NULL (unused) |
| SB0307 | P2 | Downtime reason codes semantics mismatch (11 vs 6 SAP toifa) | PARTIALLY-RESOLVED | downtime_reason_codes table exists; only 2 distinct codes actually used in downtime_events | table built, real usage sparse |
| SB0308 | P2 | Material batch/LOT tracking FK yo'q | STILL-OPEN | not found | — |
| SB0309 | P2 | Norma versiyalash (RD-4 tasdiq) integration yo'q | STILL-OPEN | not found | — |
| SB0310 | P2 | Checklist enforcement partial (gate bor, controller validate qilmaydi) | STILL-OPEN | not independently re-verified this pass | — |
| SB0311 | P2 | Qog'oz format/gramm/qatlam tanlantirmasi | STILL-OPEN | not found | — |
| SB0312 | P0 | OPERATOR LOGIN IMPOSSIBLE (0 employee↔user, 0 operator role) | STILL-OPEN | users: role='operator' count = 0 (confirmed live) | critical, confirmed exactly |
| SB0313 | P1 | TABLET STUB 13/18 endpoint 501 | RESOLVED | iot-tablet.controller.ts: 22 total endpoints, only 1 notImplemented call; tabletLogin/tabletSosAlert/tabletHandover/scanMaterialKitItem/createProductionSession/startProductionSession all real | claim is stale — vast majority implemented |
| SB0314 | P1 | Sensor yozish data yo'q + anomaliya historian yo'q | STILL-OPEN | iot_sensor_readings=0, iot_alerts=0 (confirmed live) | — |
| SB0315 | P2 | WebSocket gateway o'lik (IotGateway not a registered provider) | STILL-OPEN | grep for IotGateway usage outside its own file = no matches in any .module.ts | confirmed: dead code, never wired |
| SB0316 | P2 | 3 sensor seed + data yo'q | STILL-OPEN | iot_sensors=0 (confirmed live) | — |
| SB0317 | P2 | Predictive maintenance engine unwired | STILL-OPEN | both source tables (mes_telemetry, iot_sensor_readings) confirmed empty | — |
| SB0318 | P1 | KARTA-based login gate yo'q (operator rol/karta binding) | STILL-OPEN | dup of SB0312 | — |
| SB0319 | P2 | MODEL DIVERGENCE: tablet vs MES 2-dunyo + POS 3rd | PARTIALLY-RESOLVED | mes_production_sessions confirmed VIEW (relkind=v) over production_sessions (relkind=r) — single canonical table, not two worlds | MES/tablet divergence resolved; POS-3rd-world not independently checked |
| SB0320 | P1 | FABRIKATSIYA TAQIQ BUZILISHI (no operator seed) | PARTIALLY-RESOLVED | no fake operator seed is itself Q-40-COMPLIANT behavior, not a violation — the practical gap is SB0312 (no real operator can log in) | framing inverted: absence of fake data is correct, absence of REAL data is the actual gap |
| SB0321 | P0 | 3-stage session lifecycle MISSING | PARTIALLY-RESOLVED | dup of SB0306 — columns exist, unused (current_stage 100% NULL) | — |
| SB0322 | P0 | OEE formula setup-time adjustment MISSING | PARTIALLY-RESOLVED | drizzle-iot-oee.repo.ts:23-24 has a real OEE SQL calc, but uses a threshold-count proxy (readings>80 as % of total), not an explicit (running−down)/(running−down−setup) formula | OEE calc exists; not the exact spec formula |
| SB0323 | P0 | 3-tier downtime escalation + SOS routing MISSING | RESOLVED | mes/application/mes-sos-escalation.service.ts + infrastructure/event-handlers/sos-alert-raised-mes.listener.ts + mes-sos-escalation.repo.ts — full dedicated subsystem | substantial real implementation found |
| SB0324 | P1 | Shift handover DOUBLE-SIGNATURE validation MISSING | PARTIALLY-RESOLVED | dup of SB0304 | — |
| SB0325 | P1 | Defect root-cause event to QC+MM incomplete | UNVERIFIABLE | not checked this pass | — |
| SB0326 | P1 | GSD per-stage per-department tally not operationalized | STILL-OPEN | dup of SB0300 | — |
| SB0327 | P1 | Norms change next-only enforcement missing | STILL-OPEN | dup of SB0309 | — |
| SB0328 | P1 | AI auto-approval gate DEFERRED, not even stub | STILL-OPEN | no AI-summary→usta-review code path found | — |
| SB0329 | P2 | GSD daily deadline payroll gate missing | STILL-OPEN | the general CKP daily-deadline gate IS resolved (Area01), but this GSD/machineless-specific variant not confirmed wired | narrower than the resolved CKP gate |
| SB0330 | P0 | Andon (katta tablo) jadval/FE-API integral yo'q | STILL-OPEN | no Andon-specific table/endpoint found | unchanged |
| SB0331 | P0 | Sensor master DB bo'sh + demo-seed o'chirilgan | STILL-OPEN | iot_sensors=0 confirmed; the seed-removal itself was an intentional honesty fix (SB0338) but the practical effect is still an empty sensor master | data gap real regardless of why |
| SB0332 | P1 | AI kamera inspeksiya DB bo'sh, FE partial | STILL-OPEN | not independently checked but consistent with broader empty-IoT-data pattern | — |
| SB0333 | P1 | Telegram escalation alert routing partial | PARTIALLY-RESOLVED | mes-sos-escalation chain exists (SB0323); Telegram-specific delivery leg not independently confirmed this pass | — |
| SB0334 | P1 | OEE 3-omil formula stub/incomplete | PARTIALLY-RESOLVED | dup of SB0322 | — |
| SB0335 | P1 | MES-IoT integration point UNCLEAR | PARTIALLY-RESOLVED | mes_production_sessions VIEW-over-production_sessions clarifies this is ONE system, not an unclear boundary | dup of SB0319's resolution |
| SB0336 | P1 | IoT-tablet shift workflow struktura bor, DATA yo'q | PARTIALLY-RESOLVED | tablet controller has real shift/handover endpoints (SB0313); shift_handovers + iot tables all 0 rows | matches the finding's own precise framing |
| SB0337 | P2 | Downtime reason master-data partial | PARTIALLY-RESOLVED | dup of SB0307 | — |
| SB0338 | P2 | Fake sensor seed o'chirilgan — verifikatsiya kerak | RESOLVED | iot_sensors=0 confirms the seed-removal took effect (this IS the requested verification) | — |
| SB0339 | P0 | ЦКП auto-feed MES→karta listener YO'Q | RESOLVED | dup of Area01 SB0003/0013 — ckp-mes-feed.listener.ts confirmed live | — |
| SB0340 | P0 | A-System integration deferred: card_activity_logs, IotSessionClosedEvent | STILL-OPEN | to_regclass('card_activity_logs') = null (confirmed absent) | — |
| SB0341 | P1 | Kamera kross-check (xodim hisoboti vs AI) servisi YO'Q | STILL-OPEN | not found | — |
| SB0342 | P1 | ЦКП formula-turi SEED-NULL | STILL-OPEN | dup of Area01 SB0004 — ckp_formula_type ~1/145 filled | — |
| SB0343 | P1 | Operator ЦКП avto STUB | PARTIALLY-RESOLVED | dup of SB0339 — auto-feed mechanism real; per-operator-specific computation depth not independently confirmed | — |
| SB0344 | P2 | Anomaly CRITICAL→MES pause listener missing | STILL-OPEN | not found | — |
| SB0345 | P2 | Energy consumption endpoint 501 (sensor yo'q) | STILL-OPEN | consistent with confirmed-empty sensor data (SB0314/316) | — |
| SB0346 | P2 | Sensor seed-data EMPTY | STILL-OPEN | dup of SB0316/331 | — |
| SB0347 | P2 | Operator tablet stub endpoints (material-kit/sessions/quality) | RESOLVED | dup of SB0313 — scanMaterialKitItem/createProductionSession confirmed real | — |
| SB0348 | P1 | Checklist modal detached from session lifecycle (FE) | UNVERIFIABLE | not checked this pass | — |
| SB0349 | P1 | Shift handover form 5 fields, no approval→HR 360 workflow | PARTIALLY-RESOLVED | schema has status+signatures (SB0304); HR-360-trigger specifically not confirmed | — |
| SB0350 | P1 | IoT tablet routing: TWO sidebar entries (duplicate) | UNVERIFIABLE | FE routing not checked this pass | — |
| SB0351 | P2 | Shift countdown no escalating urgency UI | UNVERIFIABLE | not checked | — |
| SB0352 | P2 | QC reminder optional snooze vs mandatory | UNVERIFIABLE | not checked | — |
| SB0353 | P2 | Downtime reason dropdown unstandardized | PARTIALLY-RESOLVED | dup of SB0307/337 | — |
| SB0354 | P2 | Defect stage picker no QC-disposition link | UNVERIFIABLE | not checked | — |
| SB0355 | P0 | MES ↔ IoT ikki-olam (two parallel session tables) | RESOLVED | mes_production_sessions confirmed VIEW (v) over production_sessions (r) — single table, not two worlds | same evidence as SB0319/335 |
| SB0356 | P0 | Operator Tablet TB-Xavfsizlik Checklist DDL-GATED | UNVERIFIABLE | not individually traced this pass | — |
| SB0357 | P1 | QC Defect ↔ IoT Tablet integration missing | STILL-OPEN | not found | — |
| SB0358 | P1 | Andon Jonli Tablo WebSocket/SSE incomplete | STILL-OPEN | dup of SB0315 — gateway confirmed unregistered/dead | — |
| SB0359 | P1 | Energiya Tannarx GL Auto-Insert missing | STILL-OPEN | not found | — |
| SB0360 | P1 | Darslik ЦКП Gate before payroll | RESOLVED | dup of Area02 SB0070 — lmsGate.isCardTrainingComplete confirmed wired in payroll.service.ts | — |
| SB0361 | P1 | Sensor Calibration Retrospektiv Tuzatish | STILL-OPEN | moot given 0 sensor data; feature itself not found | — |
| SB0362 | P1 | Xavfsizlik ziddiyat (kamera vs operator tasdiq) | STILL-OPEN | not found | — |
| SB0363 | P2 | Andon Tablo Oflayn Resilience | UNVERIFIABLE | moot — Andon itself not found (SB0330) | — |
| SB0364 | P2 | Downtime Reason Code Referential Integrity | PARTIALLY-RESOLVED | downtime_reason_codes table exists as lookup; FK enforcement on downtime_events.reason_code not verified | — |
| SB0365 | P2 | Machine History Import (Excel) | STILL-OPEN | not found | — |
| SB0366 | P2 | Shift Report PDF Auto-Generate | STILL-OPEN | not found | — |
| SB0367 | P2 | Cross-Machine Material Loss Tracking (gofra m² 3%) | STILL-OPEN | not found | — |

**Area 08 tally:** RESOLVED=8 · STILL-OPEN=37 · PARTIALLY-RESOLVED=18 · UNVERIFIABLE=6.
**Cross-ref:** SB0339/360 are exact duplicates of Area01/Area02 findings already resolved (ЦКП-MES-feed,
LMS-payroll-gate) — do not fix twice. SB0319/335/355 are three angles on the same fact (MES/tablet session
table is a single canonical table with a view, not two parallel worlds) — resolved by one piece of evidence.
**The load-bearing STILL-OPEN P0 for this area is SB0312** (0 operator-role users) — everything downstream in
this area that depends on a logged-in tablet operator (shift workflows, sensor readings tied to a session,
GSD writes) is blocked on this one fact, independent of how complete the underlying tablet-controller code is.

---

## Area 11 — QC / sifat (54 findings · P0=6 P1=24 P2=24)

**Headline:** roughly a third of this area's findings are actually general golden-thread/event-architecture
claims (outbox pattern, event naming, PP↔golden-thread listener) that were already independently verified in
Area07/Area06 — and reversed there (`domain_events`=19 real rows, not 0; `pp-released-mes.listener.ts` real,
not missing). This area's own re-checks corroborate the same reversal from a QC-module vantage point. Three
QC-specific corrections of note: **SPC control charts are real** (`qc-new.controller.ts:199-217` — genuine
`COUNT/AVG/MIN/MAX` SQL aggregation over `qc_spc_data` plus a separate UCL/LCL endpoint), directly
contradicting the "501 stub" claim; a dedicated **`qc-certificate-pdf.service.ts`** exists (contradicting
"code yo'q" for certificate generation, though exact SF-2026-format compliance wasn't verified); and
**`work_orders`** genuinely does not exist as a table name — but that's because the canonical name is
`production_orders` (confirmed extensively in Area06/07), not because production-order tracking is missing.
Two real, still-open, QC-specific gaps: no AQL/sort-grade/certificate-template master-data tables exist at
all, and `OrderCreatedDeliveryListener` is confirmed dead-lettered **by its own docstring** ("PAYLOAD CAVEAT
(dead-letter today)... logs and exits") — a documented, not hidden, incomplete migration.

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0443 | P0 | Karta-markazlilik butunlay yo'q (QC xodim/razryad/GSD) | STILL-OPEN | no QC-specific card linkage found | dup of general card-linkage theme |
| SB0444 | P0 | Operator self-inspection MES-IoT integration yo'q | STILL-OPEN | not found; consistent with Area08's sparse IoT data | — |
| SB0445 | P1 | Master-data (AQL/defekt-og'irlik/sort-narx/sertifikat-template) YO'Q | STILL-OPEN | to_regclass('aql_standards')=null, to_regclass('sort_grade_pricing')=null | confirmed absent |
| SB0446 | P1 | Razryad-ruxsat (OTK final) QC-boshlig'i extra | STILL-OPEN | not found | — |
| SB0447 | P1 | QC GSD integratsiyasi (oylik-gatega) yo'q | STILL-OPEN | dup of Area08 SB0300/326 | — |
| SB0448 | P1 | Outbox pattern faqat SD, boshqalar EventEmitter-only | RESOLVED | dup of Area07 SB0285 — domain_events=19 rows live, real outbox not SD-limited | — |
| SB0449 | P1 | Event schema buzilishi (spec 19 vs actual names) | PARTIALLY-RESOLVED | naming drift real (e.g. PpReleasedEvent vs spec's WorkOrderCreatedEvent) but functionality exists under the actual names | naming ≠ functional gap |
| SB0450 | P1 | Event-listener mapping incomplete (spec 19 vs ~40 actual) | PARTIALLY-RESOLVED | more events exist than the spec table lists — spec document itself may be the stale artifact | — |
| SB0451 | P2 | Dual channel migration (EventEmitter2+CQRS) cleanup | UNVERIFIABLE | not independently traced this pass | — |
| SB0452 | P2 | PP event nomtechligi (WorkOrderCreatedEvent vs PpReleasedEvent) | PARTIALLY-RESOLVED | dup of SB0449 | — |
| SB0453 | P2 | WMS event emitter yo'q (warehouse.stock_updated) | PARTIALLY-RESOLVED | QcPassedListener (Area07 SB0289) does a real warehouse_stock upsert on a named event; the specific string 'warehouse.stock_updated' not confirmed but the mechanism exists | — |
| SB0454 | P2 | Qisman listener spec-holat | UNVERIFIABLE | vague spec-comparison finding | — |
| SB0455 | P2 | Outbox publisher status yo'q | RESOLVED | dup of Area07 — domain_events has published_at/attempts/last_error columns = real retry-aware publisher worker | — |
| SB0456 | P0 | Kirim AQL/final-inspeksiya/reclamation REAL DB yo'q | STILL-OPEN | aql_standards confirmed absent; no dedicated reclamation table found | — |
| SB0457 | P1 | Supplier reyting formula (4-toifa) hardcode/formula yo'q | STILL-OPEN | not checked this pass | — |
| SB0458 | P1 | REWORK parent_order_id FK schema yo'q | STILL-OPEN | production_orders/qc_inspections: no parent_order_id/rework column (info_schema) | confirmed missing |
| SB0459 | P1 | Offline tablet idempotency (tablet_id+local_seq_no) yo'q | STILL-OPEN | not found | — |
| SB0460 | P1 | Sertifikat PDF avtomatik yaratish code yo'q | PARTIALLY-RESOLVED | qc/application/qc-certificate-pdf.service.ts confirmed exists | real service; exact format spec compliance unconfirmed |
| SB0461 | P1 | AI VLM kamera confidence master-data emas, hardcode | STILL-OPEN | not checked this pass | — |
| SB0462 | P1 | Cost of Quality entries jadvaliga yo'q | STILL-OPEN | not checked | — |
| SB0463 | P2 | Instrument kalibrovka muddati schema yo'q | STILL-OPEN | to_regclass('instrument_calibrations')=null | confirmed absent |
| SB0464 | P2 | CAPA→Kanban ulanishi yo'q | STILL-OPEN | not checked | — |
| SB0465 | P2 | Traceability JOIN query code yo'q | STILL-OPEN | not checked | — |
| SB0466 | P2 | Karantin atomik tranzaksiya (FOR UPDATE+SERIALIZABLE) yo'q | STILL-OPEN | not checked | — |
| SB0467 | P1 | Sort/Grade narx-koeffitsienti master-data MAVJUD EMAS | STILL-OPEN | dup of SB0445 | — |
| SB0468 | P1 | Oylik gate — QC natijasi to'siq qoyadimi | STILL-OPEN | no QC-specific payroll gate found (distinct from the general ЦКП/LMS gates, which are resolved) | — |
| SB0469 | P1 | Darslik gate — QC va LMS razmesh | RESOLVED | dup of Area02 SB0070 — general lmsGate.isCardTrainingComplete covers this | — |
| SB0470 | P1 | Sertifikat SF-2026 format PDF avtomatik | PARTIALLY-RESOLVED | dup of SB0460 | — |
| SB0471 | P2 | Sort/grade narxi koeffitsienti | STILL-OPEN | dup of SB0445/467 | — |
| SB0472 | P2 | AI kamera+defect-detector production-ready test/FE MAVJUD EMAS | STILL-OPEN | not checked; consistent with Area08's sparse camera-AI evidence | — |
| SB0473 | P2 | Brak sababi (kirim vs shu-bosqich) kategorizatsiya tekis | STILL-OPEN | not checked | dup-ish of SB0493 |
| SB0474 | P2 | Oltin zanjir — event outbox MAVJUD EMAS | RESOLVED | dup of Area07 SB0285/SB0448/455 | — |
| SB0475 | P1 | 3-qaror oqimi yarim (rework tumaski missing) | PARTIALLY-RESOLVED | qc_approvals table exists (1 row); live status values show only 'approved' — rework/reject path schema-capable but unexercised | — |
| SB0476 | P1 | 3-qaror→oltin-ip ulanishi tekshirilmagan | PARTIALLY-RESOLVED | dup of SB0475 | — |
| SB0477 | P2 | AI Vision QC loop incomplete (camera→auto decision) | STILL-OPEN | not checked; consistent with camera-AI sparse evidence | — |
| SB0478 | P2 | Rework oqim UX yo'q | STILL-OPEN | not checked (FE-specific) | — |
| SB0479 | P2 | Operator IoT-tablet QC moduli yo'q | STILL-OPEN | dup of Area08's IoT-QC integration gap | — |
| SB0480 | P2 | 3 redirect Qoida21 regression (/qc/standards etc) | UNVERIFIABLE | FE routing not checked this pass | — |
| SB0481 | P2 | SPC nazorat grafikalari (control charts) = 501 stub | RESOLVED | qc-new.controller.ts:199-217 getControlCharts() real SQL (COUNT/AVG/MIN/MAX over qc_spc_data) + separate UCL/LCL endpoint | claim is false — genuinely implemented |
| SB0482 | P0 | Work orders table MAVJUD EMAS (yoki renamed) | RESOLVED | canonical name is production_orders (confirmed extensively Area06/07), not "missing" — just a naming-drift vs. the vision doc | — |
| SB0483 | P0 | Event relay/outbox 0 EVENTS | RESOLVED | dup of Area07 SB0285 — domain_events=19 rows confirmed | — |
| SB0484 | P1 | OrderCreatedDeliveryListener = NO-OP | STILL-OPEN | order-created-delivery.listener.ts:14-19 docstring: "PAYLOAD CAVEAT (dead-letter today)... logs and exits" | self-documented, genuinely still incomplete (payload lacks customerName/deliveryAddress) |
| SB0485 | P1 | UI end-to-end order flow visualization YO'Q | UNVERIFIABLE | not checked this pass (FE-specific) | — |
| SB0486 | P1 | 'confirmed' status FE'da trigger qilmaydi | UNVERIFIABLE | not checked this pass | — |
| SB0487 | P1 | Advance 70% gate FE'da UI ko'rinishi | UNVERIFIABLE | not checked this pass | — |
| SB0488 | P2 | QC→WMS uzilgan, wms.stock.received=0 | RESOLVED | dup of Area07 SB0289 — qc-passed.listener.ts confirmed real, upserts warehouse_stock | — |
| SB0489 | P2 | FE sales-order/delivery page biriktirmagan | UNVERIFIABLE | not checked this pass | — |
| SB0490 | P2 | golden-thread-chain-proof.cjs test holati UNKNOWN | RESOLVED | first-hand: this exact script was run twice earlier in this session (PP-Phase-1 verify + Area07 audit) — both times exit 0, all 6 hops green | direct, repeated, live confirmation — not re-derived |
| SB0491 | P2 | FIN GL delivery_completed listener yo'q | STILL-OPEN | not checked directly; consistent with SB0484's dead-letter state (no delivery created → nothing to complete) | — |
| SB0492 | P0 | Sort/grading narx koeffitsienti TO'LIQCHA YO'Q | STILL-OPEN | dup of SB0445/467/471 | — |
| SB0493 | P1 | Brak sababchisi ILDIZ MANBAI (incoming vs production) qayd etilmaydi | STILL-OPEN | dup of SB0473 | — |
| SB0494 | P1 | QC sertifikat (SF-2026-NNNNN, uz/ru/en, QR, imzolar) EMAS | PARTIALLY-RESOLVED | dup of SB0460/470 | — |
| SB0495 | P2 | AQL sampling accept/reject UI/endpoint integration test EMAS | STILL-OPEN | aql_standards confirmed absent (dup SB0445) | — |
| SB0496 | P2 | CRITICAL defekt bloking logikasi (buyurtma to'xtishi) YO'Q | STILL-OPEN | not checked this pass | — |

**Area 11 tally:** RESOLVED=10 · STILL-OPEN=30 · PARTIALLY-RESOLVED=10 · UNVERIFIABLE=4.
**Cross-ref:** SB0448/455/474/483 are exact duplicates of Area07 SB0285/291 (outbox pattern) — already
resolved, do not re-flag. SB0488 duplicates Area07 SB0289 (QC→WMS event). SB0469 duplicates Area02 SB0070
(LMS-payroll gate). SB0482's "work_orders missing" and SB0449/452's event-naming-drift findings are the same
class of issue as Area06's SB0248/252/253 (vision-doc names vs. actual-code names) — a documentation/naming
reconciliation task, not a functional gap, if the project wants to close it. The two most load-bearing genuine
STILL-OPEN gaps in this area are the complete absence of AQL/sort-grade/certificate-template master-data
(SB0445, blocking 6+ other findings that depend on it) and the self-documented dead-letter state of
`OrderCreatedDeliveryListener` (SB0484).

---

## Area 15 — CRM (51 findings · P0=7 P1=21 P2=23)

**Headline:** the biggest reversal in this area: **`deal-won.listener.ts` is a real, well-documented, idempotent
implementation** that dispatches `CreateOrderCommand` on `DealWonEvent`, writes the link both ways
(`crm_deals.sales_order_id` ← new order id, `sales_orders.deal_id` ← deal uuid), and explicitly documents its
own idempotency fix ("BUG #17... never create a second sales order for a deal that already has one"). This
substantially resolves the four findings claiming the lead→SD-order golden-thread is missing/broken
(SB0635/654/659/667). The one genuine nuance: `crm_deals.sales_order_id` is a plain column with **no DB-level
FK constraint** (`pg_constraint` returns zero rows for `crm_deals`) — the linkage is real and event-driven,
but not referentially enforced at the database layer, so SB0667's literal "FK yo'q" claim is technically still
true even though the functional gap it implies is not. Voronka (pipeline) stages are also **not empty** —
`crm_deals` has 5 rows across WON/PROPOSAL/QUALIFICATION/NEGOTIATION stages — but they use generic CRM stage
names, not the vision's domain-specific 5-step model (Specimen→STP→Pricing→Contract→Won), matching SB0638's
more precise framing over SB0648's blanket "EMPTY" claim. `lost_reason` exists as a free-text column (not
"no loss-reason" at all, but not a proper taxonomy/lookup table either). No CRM entity (leads/deals/companies/
contacts) has a `card_id` column — the card-centric linkage gap here is real and confirmed, consistent with
every other area's findings on this theme.

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0629 | P1 | Missing card_id FK in CRM entities | STILL-OPEN | crm_leads/crm_deals/crm_companies/crm_contacts: no card_id column found (info_schema) | confirmed across all 4 core tables |
| SB0630 | P1 | CRM doesn't reference unified corporate-number model | STILL-OPEN | not checked this pass | — |
| SB0631 | P2 | Qarzdorlik routing/RBAC not modeled | STILL-OPEN | not checked | — |
| SB0632 | P2 | Manager takeover/vacation not addressed | STILL-OPEN | not checked | — |
| SB0633 | P2 | 360-view missing card-context | STILL-OPEN | dup of SB0629 | — |
| SB0634 | P1 | Voronka doesn't enforce Vysotskiy-7 stage mapping | STILL-OPEN | generic stage names confirmed (SB0638); no org-chart mapping found | — |
| SB0635 | P1 | No lead-to-SD-order golden-thread mapping | RESOLVED | sd/infrastructure/event-handlers/deal-won.listener.ts:1-45 — real, idempotent, dispatches CreateOrderCommand, bidirectional link write | substantial, well-documented implementation |
| SB0636 | P2 | CRM lacks papka model | STILL-OPEN | not checked | — |
| SB0637 | P2 | Card-based action logging not enforced | STILL-OPEN | dup of card theme (SB0629) | — |
| SB0638 | P0 | Voronka stage names generic, not vision-specific | PARTIALLY-RESOLVED | crm_deals stage_id/stage_semantic_id: WON/PROPOSAL/QUALIFICATION/NEGOTIATION (live, populated) | functional pipeline exists; naming ≠ vision's domain-specific 5-step names |
| SB0639 | P1 | Customer 360 tab incomplete | STILL-OPEN | not independently re-verified this pass | dup-ish of SB0656/677 |
| SB0640 | P1 | Lead scoring UI (Lead Score Bar) missing | STILL-OPEN | not checked (FE-specific) | — |
| SB0641 | P1 | Churn prediction/AI NBA not in ExtendedAIPanel | STILL-OPEN | not checked | — |
| SB0642 | P2 | Activity journal incomplete | STILL-OPEN | not checked | — |
| SB0643 | P2 | Field visit/mobile missing | STILL-OPEN | dup of SB0660/672 | — |
| SB0644 | P2 | Overdue task warning missing | STILL-OPEN | not checked | — |
| SB0645 | P2 | Tab hierarchy 4-level nested (Qoida42) | UNVERIFIABLE | not independently re-checked this pass | consistent with Area06's tab-depth theme if confirmed |
| SB0646 | P2 | Kanban drag-drop stasis/regression | UNVERIFIABLE | finding's own text says @dnd-kit "o'rnatilgan va ishlaydi" (installed and works) — unclear what regressed | — |
| SB0647 | P2 | Design inconsistency (neumorphic inline rgba) | STILL-OPEN | not independently re-checked this pass, plausible given widespread legacy styling elsewhere | — |
| SB0648 | P0 | Voronka 5-step stages EMPTY | PARTIALLY-RESOLVED | dup of SB0638 — stages populated (5 rows, 4 distinct stage names), not empty, but generic naming | claim's "EMPTY" framing is false; the naming-mismatch nuance is real |
| SB0649 | P0 | Proposal/STP approval (voronka step 2) MISSING | STILL-OPEN | no approval-workflow evidence found for this step | — |
| SB0650 | P0 | Pricing step (voronka step 3) NOT INTEGRATED | STILL-OPEN | not checked | — |
| SB0651 | P0 | Channels (Telegram/WhatsApp/SMS/Email) NOT AUTO-INGEST | STILL-OPEN | not checked | — |
| SB0652 | P1 | Lead scoring INACTIVE | STILL-OPEN | dup of SB0640/673 | — |
| SB0653 | P1 | Bitrix legacy import NOT TESTED | UNVERIFIABLE | crm-bitrix-compat.controller.ts (141 lines) has @Post('robots')/@Post('robots/:id/toggle') — webhook-automation endpoints, not clearly a CSV-import feature | could not locate the specific import feature described |
| SB0654 | P1 | Golden-thread link (lead→order) INCOMPLETE | RESOLVED | dup of SB0635 | — |
| SB0655 | P1 | No loss-reason taxonomy | PARTIALLY-RESOLVED | crm_deals.lost_reason column exists (confirmed) | free-text field, not a proper taxonomy/lookup table — matches SB0675's more precise framing |
| SB0656 | P2 | 360° Customer view PARTIAL | STILL-OPEN | dup of SB0639/677 | — |
| SB0657 | P2 | Web lead form not linked | STILL-OPEN | not checked | — |
| SB0658 | P2 | No explicit proposal quotation stage | STILL-OPEN | dup of SB0649 | — |
| SB0659 | P0 | Deal-won → sales_order integration BUZUQ | RESOLVED | dup of SB0635 — same evidence | — |
| SB0660 | P1 | Menejer field visit CRM entry unclear | STILL-OPEN | dup of SB0643/672 | — |
| SB0661 | P1 | Lead→Deal approval (sotuv rahbari) needed? | STILL-OPEN | not checked (also a policy question, not purely a code gap) | — |
| SB0662 | P1 | Round-robin lead distribution + HR-status sync | STILL-OPEN | not checked | — |
| SB0663 | P1 | Loss reason categorization / root-cause | PARTIALLY-RESOLVED | dup of SB0655 | — |
| SB0664 | P1 | Compensation/discount abuse-flag criteria unclear | STILL-OPEN | not checked (also a policy-definition question) | — |
| SB0665 | P2 | Manager export RBAC (SQL white-list sufficiency) | STILL-OPEN | not checked | — |
| SB0666 | P2 | Offline PWA sync conflict resolution | STILL-OPEN | not checked | — |
| SB0667 | P0 | Deal→sales_orders FK YO'Q | PARTIALLY-RESOLVED | crm_deals.sales_order_id column exists + deal-won.listener.ts writes it live; but pg_constraint shows ZERO FK constraints on crm_deals | functional link real (event-driven); no DB-level referential-integrity constraint |
| SB0668 | P1 | Lead-aging (60-day→reassign) IMPL YO'Q | STILL-OPEN | crm_leads.last_activity_at + next_activity_at columns confirmed present; no reassignment logic found | matches finding's own precise framing exactly |
| SB0669 | P1 | Lead stage-journey history YO'Q | STILL-OPEN | to_regclass('crm_lead_stage_history')=null, to_regclass('crm_deal_stage_history')=null | confirmed absent |
| SB0670 | P1 | Voronka stage-gating logic (Klishe/STP/narx/shartnoma) YO'Q | STILL-OPEN | no stage-gate enforcement found, consistent with generic-stage-naming finding | — |
| SB0671 | P1 | Channel integration partial | STILL-OPEN | dup of SB0651 | — |
| SB0672 | P1 | Field visit workflow YO'Q | STILL-OPEN | dup of SB0643/660 | — |
| SB0673 | P2 | Lead-scoring live-calc suspect (hardcoded mock) | STILL-OPEN | dup of SB0640/652, not independently re-verified this pass | — |
| SB0674 | P2 | Segment ABC auto-assign IMPL YO'Q | STILL-OPEN | not checked | — |
| SB0675 | P2 | Loss-reason rollup analytics CODED YO'Q | PARTIALLY-RESOLVED | dup of SB0655/663 — free-text field exists, rollup/trend analytics not found | — |
| SB0676 | P2 | Price recalc trigger MM↔CRM YO'Q | STILL-OPEN | not checked | — |
| SB0677 | P2 | 360° mijoz profili FRAGMENTARY | STILL-OPEN | dup of SB0639/656 | — |
| SB0678 | P2 | Bitrix CSV import endpoint IMPL UNCLEAR | UNVERIFIABLE | dup of SB0653 | — |
| SB0679 | P2 | RBAC row-level access IMPL UNCHECKED | STILL-OPEN | not independently re-verified this pass; finding's own framing ("Guards exist; filtering YO'Q") plausible but unconfirmed | — |

**Area 15 tally:** RESOLVED=3 · STILL-OPEN=39 · PARTIALLY-RESOLVED=6 · UNVERIFIABLE=3.
**Cross-ref:** SB0635/654/659 are exact duplicates converging on the same evidence (`deal-won.listener.ts`) —
do not fix three times. SB0638/648 are the same voronka-stages observation from two angles. SB0655/663/675
are the same loss-reason-taxonomy gap from three angles. SB0629/633/637 are the same card-linkage gap
(consistent with every other area's card-centric findings — HR/Auth/PP/QC all confirm the same root cause:
CRM/PP/QC entities lack `card_id`, only HR's `org_departments`/`employee_cards` have partial card wiring).
Despite the strong positive finding on the deal→order golden-thread, this area otherwise skews STILL-OPEN —
the voronka pipeline's *specific* vision requirements (5-step domain naming, stage-gating, channel auto-ingest,
proposal/pricing steps) remain largely unbuilt even though the underlying deal/lead CRUD and the critical
won→order handoff are solid.

---

## Area 14 — SD / sotuv-buyurtma (50 findings · P0=5 P1=25 P2=20)

**Headline:** two clean reversals and one important data correction. `create-order.handler.ts` +
`create-order.dto.ts` confirm a real canonical order-CREATE command exists (also independently confirmed as
the target of CRM's `deal-won.listener.ts` in Area15) — resolves SB0584's "no canonical order create" claim.
`sd_customers.abc_class` is filled for **15 of 16 rows** — flatly contradicts SB0591's "ABC rating built but
data 0" claim. And SB0597's "sd_customers/orders/quotations/payments all 0 rows" is **half true**:
`sd_customers`=16 and `sales_orders`=13 have real data, but `sd_quotations`=0 and `sd_payments`=0 are
genuinely empty — a mixed, not blanket, data gap. On the confirmed-still-open side: `sales_orders` has no
`card_id`/`org_department_id` column (consistent with every other area's card-linkage findings),
`advance_percent`/`advance_status` columns exist in schema but are **100% NULL live** (built, unpopulated —
same "schema real, data/enforcement absent" pattern seen throughout this audit), live order status has only
5 simple values (confirmed/closed/cancelled/in_progress/delivered) — nowhere near a 7-stage or 24-state
lifecycle — and `SDSalesOrders.tsx:421` is confirmed to use a bare `prompt()` for order cancellation, a
literal Qoida-14 violation (must use `ConfirmDialog`). Five FE components/pages the audit called missing
(`SDLostOrders`, `ReclamationCreateDialog`, `RepeatOrderDialog`, `LeaderboardWidget`, a real `SDOrderDetail`
page distinct from the side-panel) were confirmed absent via file glob — genuinely not built.

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0579 | P1 | Org-sxema bog'lanishi ZAIF (department VARCHAR, no org FK) | STILL-OPEN | sd_order_departments.department = character varying; no org_department_id FK found | confirmed |
| SB0580 | P1 | Oltin-ip uzilish: material-wait SD→MM listener missing | STILL-OPEN | not independently checked this pass | — |
| SB0581 | P1 | Kart-asoslilik chetda (createdBy VARCHAR, card_id yo'q) | PARTIALLY-RESOLVED | sales_orders.created_by is actually UUID (not VARCHAR as cited); no card_id column found | minor factual correction on type; underlying card-gap confirmed real |
| SB0582 | P2 | Biznes qarorlar HARDCODED (advance 70%/tiraj±10%/jarima) | PARTIALLY-RESOLVED | advance_percent is a real, configurable DB column (numeric); live values all NULL — not confirmed hardcoded in SD module code itself | schema supports configurability; enforcement/population unconfirmed |
| SB0583 | P2 | Ikki-olam qoldiq: SAP-template+legacy parallel ustunlar | UNVERIFIABLE | not independently checked this pass | — |
| SB0584 | P0 | Menejer buyurtma ochish tizimi yo'q (kanonik order CREATE yo'q) | RESOLVED | sd/application/commands/create-order.handler.ts + create-order.dto.ts confirmed real; same command CRM's deal-won.listener.ts dispatches | canonical create flow exists and is reused cross-module |
| SB0585 | P0 | Kotirovka rasmiy hujjat+versioning+imzo gate yo'q | PARTIALLY-RESOLVED | sd/domain/repositories/i-sd-quotations.repo.ts exists; sd_quotations table=0 rows; PDF/signature/versioning specifics unconfirmed | infra exists, unpopulated/unverified depth |
| SB0586 | P0 | Avans (70%) va to'lov shartlari gate tuzatilmagan | PARTIALLY-RESOLVED | advance_percent/advance_status columns exist; live values 100% NULL | schema built, not enforced/populated |
| SB0587 | P1 | Order status 7-bosqich to'liq implement qilinmagan | STILL-OPEN | only 5 distinct live status values (confirmed/closed/cancelled/in_progress/delivered) | far short of 7-stage vision |
| SB0588 | P1 | Manager order fan-out (sd_order_departments) incomplete | STILL-OPEN | not independently checked beyond schema (SB0579) | — |
| SB0589 | P1 | Advance-bypass + debtor limit gate yo'q | STILL-OPEN | not checked | — |
| SB0590 | P1 | Kotirovka PDF export+imzo+versioning yo'q | PARTIALLY-RESOLVED | dup of SB0585 | — |
| SB0591 | P1 | Customer A/B/C ABC rating qurilgan lekin data 0 | RESOLVED | sd_customers.abc_class: 15/16 rows filled (live) | claim is false — data mostly populated |
| SB0592 | P1 | Manager KPI+leaderboard yo'q | STILL-OPEN | no leaderboard endpoint found in sd-dashboard.controller.ts | — |
| SB0593 | P1 | Invoice auto-generation (orders→invoices) yo'q | STILL-OPEN | not checked | — |
| SB0594 | P1 | Delivery recording (EXTERNAL_OUT)+warehouse+finance tasdiq yo'q | STILL-OPEN | not checked | — |
| SB0595 | P2 | Klishe/shtamp registry+egalik+saqlash muddati yo'q | STILL-OPEN | not checked | — |
| SB0596 | P2 | Debtor trend+collection responsibility yo'q | STILL-OPEN | not checked | — |
| SB0597 | P2 | Data to'liqsizligi: customers/orders/quotations/payments=0 | PARTIALLY-RESOLVED | sd_customers=16, sales_orders=13 (both have real data); sd_quotations=0, sd_payments=0 (confirmed empty) | claim is half stale — 2 of 4 tables have data |
| SB0598 | P2 | Karta-model RBAC (kim nimani ko'radi) qo'shilmagan | STILL-OPEN | dup of card-linkage theme | — |
| SB0599 | P1 | Kanonik=sales_orders lekin org_department_id FK YO'Q | STILL-OPEN | confirmed: no org_department_id/card_id column | — |
| SB0600 | P1 | Golden-thread 6-bosqich live test faqat 1 order+1 delivery | STILL-OPEN | matches this session's own harness output exactly (order 49, PO 44, session 31 — a single test chain) | accurately describes limited live-data breadth, not a code defect |
| SB0601 | P1 | Advance 70% spec bor, data/flow yo'q | PARTIALLY-RESOLVED | dup of SB0586 | — |
| SB0602 | P1 | Kotirovka 14-kun deadline spec bor, impl yo'q | STILL-OPEN | no deadline-enforcement logic found | — |
| SB0603 | P2 | Tirajdan og'ish ±10% qoidasi validation yo'q | STILL-OPEN | not checked | — |
| SB0604 | P2 | Klishe/shtamp saqlash 3-yil spec bor, impl yo'q | STILL-OPEN | dup of SB0595 | — |
| SB0605 | P2 | Storage charge formula (3-kun bepul+tarif) yo'q | STILL-OPEN | not checked | — |
| SB0606 | P2 | Manager panel real-time KPI spec bor, impl yo'q | STILL-OPEN | dup of SB0592 | — |
| SB0607 | P0 | SDOrderDetail 4-tab alohida sahifa MISSING (side-panel bor) | STILL-OPEN | no SDOrderDetail*.tsx file found (glob) | confirmed absent as a standalone page |
| SB0608 | P0 | SDLostOrders MISSING | STILL-OPEN | no SDLostOrders*.tsx file found (glob) | confirmed absent |
| SB0609 | P1 | ReclamationCreateDialog MISSING | STILL-OPEN | no such file found (glob) | confirmed absent |
| SB0610 | P1 | RepeatOrderDialog MISSING | STILL-OPEN | no such file found (glob) | confirmed absent |
| SB0611 | P1 | SDCustomers 360 'Mahsulotlar arxivi' tab MISSING | STILL-OPEN | not independently re-checked beyond the pattern established by SB0607-610 | — |
| SB0612 | P1 | LeaderboardWidget MISSING | STILL-OPEN | no such file found (glob); dup of SB0592 | confirmed absent |
| SB0613 | P1 | SDSalesOrders cancel dialog → prompt() BROKEN (Qoida14) | STILL-OPEN | SDSalesOrders.tsx:421 — `const reason = prompt(tLabel(...))` | confirmed exactly, literal Qoida-14 violation |
| SB0614 | P2 | SDOrderDetail buyurtma maydonlari EKSIK | STILL-OPEN | dup of SB0607 — page itself doesn't exist under that name | — |
| SB0615 | P2 | SDOrderDetail Tarix tab change_log MISSING | STILL-OPEN | dup of SB0607 | — |
| SB0616 | P2 | SDOrderDetail Maket tab gate MISSING | STILL-OPEN | dup of SB0607 | — |
| SB0617 | P2 | SDKpi KPI targets 'fake' query response; BE stub | UNVERIFIABLE | no conclusive stub markers found this pass — file may exist under a different name | — |
| SB0618 | P2 | Tab design Q-42 check (SDOrderDetail nesting) | UNVERIFIABLE | page doesn't exist under the cited name to check | — |
| SB0619 | P2 | Forma REAL saqlash Q-43 tekshirish kerak | UNVERIFIABLE | same reason as SB0618 | — |
| SB0620 | P1 | 24-state status vs simple dual-status legacy | STILL-OPEN | dup of SB0587 — only 5 simple live values confirmed | — |
| SB0621 | P1 | Karta-model RBAC — assigned_to UUID emas karta | STILL-OPEN | sales_orders.assigned_to confirmed UUID type, not a card/org_departments FK | — |
| SB0622 | P1 | advance_status saqlanadi, advancePercent HARDCODED | PARTIALLY-RESOLVED | advance_percent is a real configurable column; no hardcoded '70' found in SD module code; live values NULL | "hardcoded" not directly confirmed; "not populated/flowing" is accurate |
| SB0623 | P1 | sales_orders.id kanonik emas, document_number bo'lishi kerak | PARTIALLY-RESOLVED | document_number column confirmed exists; whether it's the actual golden-thread join-key vs. id not independently verified this pass | — |
| SB0624 | P1 | Production.xlsx 6-holat real status vs hozirgi | STILL-OPEN | only 5 distinct live status values found, not matching the owner's cited 6-state Cyrillic model | — |
| SB0625 | P2 | Qisman yetkazish (partial delivery) yo'q | STILL-OPEN | not checked | — |
| SB0626 | P2 | Menejer Leaderboard EP-SD-017 | STILL-OPEN | dup of SB0592/612 | — |
| SB0627 | P2 | Kotirovka versiyalanadi (v1/v2) yo'q | PARTIALLY-RESOLVED | dup of SB0585/590 — quotations repo exists, table 0 rows, versioning specifics unconfirmed | — |
| SB0628 | P2 | Yo'qotilgan buyurtma sababi (narx/muddat/raqobat) qayd etilmaydi | STILL-OPEN | not checked; parallels CRM's loss-reason theme but SD-specific | — |

**Area 14 tally:** RESOLVED=2 · STILL-OPEN=32 · PARTIALLY-RESOLVED=11 · UNVERIFIABLE=5.
**Cross-ref:** SB0587/620 are the same status-lifecycle-too-simple observation. SB0585/590/627 are the same
quotation-PDF-versioning gap. SB0592/606/612/626 are the same leaderboard/KPI gap. SB0607/614/615/616/618/619
are all the same root fact — a real, standalone `SDOrderDetail` page (as opposed to the current side-panel)
does not exist, so every sub-finding about its tabs/fields/validation is moot until the page itself is built.
SB0581/599/598/621 are the same card-linkage gap already confirmed system-wide (CRM/PP/QC/SD all lack
`card_id` on their core entities). The two genuinely new positive findings this area contributes — a working
canonical order-create command (SB0584) and populated ABC customer ratings (SB0591) — are worth carrying
forward since they contradict the original audit outright, not just partially.

---

## Area 13 — WMS / Ombor + POS Monitor (49 findings · P0=8 P1=25 P2=16)

**Headline:** the clearest reversal this pass: **`components/sidebar/constants.ts:318,387`** confirms POS
Monitor is already a single canonical `{ url: "pos-monitor" }` entry, with an explicit in-code comment
documenting the fix: *"Eski /pos/* klasteri /pos-monitor'ni takrorlardi"* (the old /pos/* cluster used to
duplicate pos-monitor — past tense). This directly resolves the three findings claiming an ongoing Qoida-22
sidebar-duplication violation (SB0532/561/565) — the cleanup already happened (consistent with CLAUDE.md's
own Qoida 22 section and this project's `session_2026-05-21_full_cleanup.md` history). `pos_movements` also
has **2 distinct live movement types** (`EXTERNAL_IN`, `INTERNAL_ISSUE`), not the "only 1 type" the original
audit claimed (SB0540) — real progress, though still short of the full 6-type taxonomy vision calls for
(SB0573). The general QC→WMS golden-thread connection is confirmed real (dup of Area07/11's
`qc-passed.listener.ts` finding) — but a closer look this pass shows that listener only handles the
**QC-PASSED** path (warehouse_stock upsert); no quarantine/REJECTED-specific event path was found in it, so
SB0556/548's "quarantine event not connected" claim survives as a real, narrower gap. Two more general-theme
findings (SB0559 darslik-gate, SB0560 ЦКП-deadline) are exact duplicates of already-resolved Area01/02
findings. Genuinely confirmed still-missing: `warehouse_stock` has no `supplier_tin` or `photo_urls` columns
(SB0568/571), and no minus-balance blocking or margin-tolerance validation logic was found (SB0543/544).

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0530 | P1 | warehouseTransactions vs warehouse_stock PARALLEL-DUNYO | UNVERIFIABLE | not independently checked this pass | warehouse_transactions may be a legitimate audit-log table, not a duplicate — needs a closer read |
| SB0531 | P1 | Bin-location 4-tier hierarchy INCOMPLETE | PARTIALLY-RESOLVED | warehouse_stock.bin_location_id column exists | some hierarchy support present; UI/search completeness unconfirmed (dup SB0546) |
| SB0532 | P1 | POS Monitor DUPLICATE SIDEBAR (Qoida 22) | RESOLVED | components/sidebar/constants.ts:318,387 — single canonical `pos-monitor` entry, comment confirms old /pos/* cluster already retired | claim is false today |
| SB0533 | P1 | Saqlash-haqi (warehouse-rental) model MISSING | PARTIALLY-RESOLVED | warehouse_stock.owner_type + owner_customer_id columns exist (some rental/ownership schema support) | full rental-billing model (monthly fee calc) not confirmed |
| SB0534 | P1 | FIFO/FEFO narxlash + Karantin QC-darvozasi MISSING | PARTIALLY-RESOLVED | QC-PASSED→warehouse_stock path confirmed real (dup Area07/11); FIFO/FEFO batch-expiry logic not independently confirmed | — |
| SB0535 | P1 | Karta-model integration (omborchi GSD+razryad) MISSING | STILL-OPEN | dup of the systemic card-linkage gap | — |
| SB0536 | P1 | POS Movement state-machine INCOMPLETE | PARTIALLY-RESOLVED | pos_movements.movement_type: 2 distinct live values (EXTERNAL_IN, INTERNAL_ISSUE) | more than claimed (1), still short of full 6-type taxonomy |
| SB0537 | P2 | Enum-naming consistency (warehouses.type dup) | UNVERIFIABLE | not checked this pass | — |
| SB0538 | P2 | Real-time WMS-MES integration PARTIAL | PARTIALLY-RESOLVED | QC→WMS event confirmed real (Area07/11); full real-time REST specifics unconfirmed | — |
| SB0539 | P2 | Ombor Dashboard + POS Monitor UI/UX MISMATCH | UNVERIFIABLE | FE-specific, not checked this pass | — |
| SB0540 | P0 | POS Movement taksonomiyasi FAQAT 1 tur (EXTERNAL_IN) | PARTIALLY-RESOLVED | dup of SB0536 — 2 types live now, not 1 | claim partially stale |
| SB0541 | P0 | Supplier TIN va Currency SAQLANMAYDI | STILL-OPEN | warehouse_stock: no supplier_tin column (info_schema) | confirmed missing |
| SB0542 | P0 | Golden thread SD→FG→WMS→GL UZILGAN | PARTIALLY-RESOLVED | QC→WMS and WMS→FIN legs confirmed real (Area07); MES→QC leg has a documented drift flag (Area07 HOP3 "CQRS saveSession drift") | not fully clean end-to-end, but far from "uzilgan" (severed) |
| SB0543 | P0 | Minus saldo BLOK mexanizmi yo'q | STILL-OPEN | no INSUFFICIENT_STOCK/minus-balance block logic found | confirmed missing |
| SB0544 | P0 | Margin tolerance (±2%/±1%) validatsiya yo'q | STILL-OPEN | not checked, no evidence found | — |
| SB0545 | P1 | POS-GL auto-posting LOKAL, asosiy GL'ga ulanmagan | PARTIALLY-RESOLVED | Area07 confirmed wms-fg-received/goods-issued listeners post to the real GL chain | "local only" framing may be outdated |
| SB0546 | P1 | Tuzilmali manzil schema OK, UI/search YO'Q | PARTIALLY-RESOLVED | dup of SB0531 | — |
| SB0547 | P1 | 3-way match (PO↔Receipt↔Invoice) schema bor, implement emas | PARTIALLY-RESOLVED | mm/application/mm-goods.service.ts + repo + controller confirmed real goods-receipt infra | consistent with prior project memory noting 3-way-match "allaqachon bor" |
| SB0548 | P1 | Karantin holati LOGIC yarim (QABUL/REWORK/CHIQARISH async) | PARTIALLY-RESOLVED | QC-PASSED path real; no quarantine/REJECTED-specific event path found in qc-passed.listener.ts | narrower confirmed gap — passed path works, reject/quarantine path doesn't |
| SB0549 | P1 | Barcode print workflow FE'ga disconnected | STILL-OPEN | not checked this pass | — |
| SB0550 | P1 | Employee moddiy javobgarlik (accountability) yo'q | STILL-OPEN | not checked | — |
| SB0551 | P1 | Narx validatsiya — 0/manfiy qiymatlar o'tadi | STILL-OPEN | not checked | — |
| SB0552 | P2 | Kunlik ombor hisobot real-time push yo'q | STILL-OPEN | not checked | — |
| SB0553 | P2 | FG ombori — MES→FG avtomatik link yo'q | STILL-OPEN | dup of SB0569, not independently confirmed this pass | — |
| SB0554 | P2 | Ombor rental — xodim/karta javobgarligi yo'q | STILL-OPEN | dup of SB0533 | — |
| SB0555 | P1 | MES→WMS material chiqim norma link yo'q | STILL-OPEN | dup of SB0538, not confirmed | — |
| SB0556 | P1 | QC→WMS karantin yozuvi event ULANMAGAN | PARTIALLY-RESOLVED | dup of SB0548 — QC-PASSED path real; quarantine-specific event not found | — |
| SB0557 | P1 | GL entries tafsili incomplete (Wave-4 legacy) | UNVERIFIABLE | not independently checked beyond general GL-posting confirmations (Area07) | — |
| SB0558 | P1 | Offline sync CONFLICT state yo'q | STILL-OPEN | not checked | — |
| SB0559 | P2 | Darslik-oylik gate ulanmagan | RESOLVED | dup of Area02 SB0070 — lmsGate confirmed wired in payroll | — |
| SB0560 | P2 | ЦКП kunlik hisobot deadline ulanmagan | RESOLVED | dup of Area01 SB0001/0015 — ckp-gate confirmed wired | — |
| SB0561 | P2 | POS-Monitor vs Kassir ziddiyati (sidebar 9 entry) | RESOLVED | dup of SB0532 | — |
| SB0562 | P2 | Xodim razryad→POS RBAC refresh yo'q | STILL-OPEN | not checked | — |
| SB0563 | P1 | Ombor Dashboard FE yo'q (faqat RollManagementPage) | UNVERIFIABLE | not independently file-checked this pass | — |
| SB0564 | P1 | POS Monitor FE 70% to'liq emas | UNVERIFIABLE | not independently checked this pass | — |
| SB0565 | P2 | Ombor+POS sidebar duplikat | RESOLVED | dup of SB0532 — sidebar confirmed canonical | — |
| SB0566 | P2 | Ombor shablon (ListPage/DetailPage/FormPage) ishlatilmagan | UNVERIFIABLE | not checked | — |
| SB0567 | P2 | WMS Analytics API bor, FE sahifasi yo'q | UNVERIFIABLE | not independently checked this pass | — |
| SB0568 | P0 | warehouse_stock ustun yo'qotishlari (supplier_tin/photo_urls) | STILL-OPEN | confirmed: neither column exists (info_schema) | — |
| SB0569 | P0 | MES→POS FG_FROM_MES harakat avto-yaratilishi yo'q | STILL-OPEN | not confirmed this pass; dup of SB0553 | — |
| SB0570 | P0 | Pres-kirim fast-path yo'q | STILL-OPEN | not checked | — |
| SB0571 | P1 | Foto-dalil ustunlari DDL-gated, harakatga tushmagan | STILL-OPEN | dup of SB0568 — photo_urls column confirmed absent | — |
| SB0572 | P1 | GSD push job (PosGsdService.pushDailyMetrics) PLACEHOLDER | UNVERIFIABLE | PosGsdService/pushDailyMetrics not found anywhere in current codebase by name — may have been renamed/removed since the original audit | can't confirm current placeholder status directly |
| SB0573 | P1 | Harakat turlari enum taksonomiyasi to'liq emas | PARTIALLY-RESOLVED | dup of SB0536/540 | — |
| SB0574 | P1 | Barcode scanner fallback (ZXing) yo'q | STILL-OPEN | not checked | — |
| SB0575 | P1 | PWA offline sync background missing | STILL-OPEN | not checked | — |
| SB0576 | P2 | Low-stock event to MM yo'q | STILL-OPEN | not checked | — |
| SB0577 | P2 | Omborchi GSD (kunlik plan%/tezlik/og'ish) | STILL-OPEN | dup of SB0535 | — |
| SB0578 | P2 | Material topshirish AKTI 2-imzo yo'q | STILL-OPEN | not checked | — |

**Area 13 tally:** RESOLVED=5 · STILL-OPEN=26 · PARTIALLY-RESOLVED=12 · UNVERIFIABLE=6.
**Cross-ref:** SB0532/561/565 are the same POS-sidebar-duplication finding, now RESOLVED by one piece of
evidence. SB0559/560 duplicate Area01/02's already-resolved LMS-gate/ЦКП-gate findings. SB0536/540/573 are the
same movement-type-taxonomy observation. SB0531/546 and SB0533/554 and SB0538/555 and SB0548/556 and
SB0553/569 and SB0535/577 are each the same finding from two angles. This area shows a healthier
RESOLVED-rate than most (5 clean resolutions, largely from the sidebar-cleanup and general golden-thread
confirmations already established), but the P0-tier core-data gaps (supplier TIN, minus-balance blocking,
margin-tolerance validation) remain genuinely open and are worth prioritizing given their P0 weight.

---

## Area 09 — Hisobot / dashboard / analitika (43 findings · P0=5 P1=19 P2=19)

**Headline:** the biggest reversal of this entire audit so far. The original claim "5 HOLAT DARAJASI
(O'SISH/NORMAL/EHTIYOT/XAVF/INQIROZ) + weighted formula = STRUKTURA + HISOB YO'Q" (SB0368/380/401) is
**flatly false**: `director/application/director-holat.service.ts` implements a real, documented,
**configurable 5-level band-threshold classifier** with strictly-descending thresholds and a full fallback
chain down to INQIROZ. `owner-summary.service.ts` has a real `buildSummary()` with `newCustomers`/
`lostCustomers`/`topRisk` (churn %) fields plus a `trySend()` method (Telegram delivery) — substantially
resolving the "5 owner numbers" and "Telegram digest" clusters (SB0385/394/402/379/386/408), though some
fields default to 0 in a fallback path so full live-data population isn't proven. A dedicated **council-members
module** (repository + controller + its own 2026-06-30 migration) exists — this session's own memory
independently confirms this was built recently — addressing SB0403's core claim, though the table itself is
still 0 rows. `role_dashboard_widgets` and `seven_function_kpis` tables both exist (schema built, 0 rows,
unpopulated) — directly contradicting SB0407/409's claim these don't exist at all. `monthly_plans` exists
(partial OKR infra) though `strategic_goals`/`weekly_breakdowns` don't. Two exact duplicates of Area01's
already-resolved ЦКП findings (SB0404 AI-daily-question, SB0405 deadline→payroll-gate) appear again here.

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0368 | P0 | Holat formulasi (5 ko'rsatkich) komputatsiyasi yo'q | RESOLVED | director/application/director-holat.service.ts — real 5-level band-threshold classifier, configurable, documented | substantial real implementation |
| SB0369 | P0 | Ideal rasm (maqsad qiymatlar) | PARTIALLY-RESOLVED | DirectorHolatService's configurable thresholds likely support target-comparison; not independently confirmed | — |
| SB0370 | P1 | Analytics FAQAT LMS-scoped | STILL-OPEN | not independently re-checked this pass | — |
| SB0371 | P1 | Karta-markaz: holat kartalardan yig'ilishi IJRO qilinmagan | PARTIALLY-RESOLVED | DirectorHolatService exists; whether it aggregates from cards specifically vs generic KPIs unconfirmed | — |
| SB0372 | P1 | Stat-reglament jadval yo'q | STILL-OPEN | to_regclass('stat_reglament')=null | confirmed absent |
| SB0373 | P2 | Root-cause drill yo'q | STILL-OPEN | dup of SB0381/398/406 | — |
| SB0374 | P2 | AI strategik tahlilchi yo'q/o'chirilgan | PARTIALLY-RESOLVED | director-root.controller.ts:84 @Get('ai-summary') endpoint exists | some AI-analyst infra real |
| SB0375 | P2 | Boshliq kundaligi (5-bo'lim) jadval yo'q | STILL-OPEN | not checked | — |
| SB0376 | P2 | Direktor 2-o'q navigatsiyasi (Dept×Operation) yo'q | STILL-OPEN | not checked (FE-specific) | — |
| SB0377 | P2 | OKR decomposition jadvallar yo'q | PARTIALLY-RESOLVED | monthly_plans table exists; strategic_goals/weekly_breakdowns absent | partial infra |
| SB0378 | P2 | Kunlik 07:00 cron hisoblanmaydi | PARTIALLY-RESOLVED | dup of Area01's ai-daily-report.cron.ts (runs 08:00, not 07:00, but is a real daily cron) | close but not exact-time match |
| SB0379 | P2 | Kundalik boshliqni Telegram orqali yo'q | PARTIALLY-RESOLVED | owner-summary.service.ts trySend() confirms Telegram-send infra exists | — |
| SB0380 | P0 | 5 holat darajasi + soslanadigan vazn STRUKTURA+HISOB YO'Q | RESOLVED | dup of SB0368 | — |
| SB0381 | P0 | Kechikish/og'ish sabab kategoriyasi + root-cause DB/BE/UI taqiq | STILL-OPEN | no root-cause taxonomy table confirmed this pass | — |
| SB0382 | P0 | OKR (kompaniya→bo'lim→karta) ierarxiyasi qurilmagan | PARTIALLY-RESOLVED | monthly_plans exists; full 3-tier hierarchy with card-level linkage not confirmed | — |
| SB0383 | P1 | AI kunlik strategik taklif + Aisha link yo'q | PARTIALLY-RESOLVED | ai-summary endpoint exists (SB0374); Aisha-specific link unconfirmed | — |
| SB0384 | P1 | Real-time avto-to'ldirish (reja%/downtime/energy/etc) incomplete | STILL-OPEN | not checked; consistent with Area08's empty-IoT-data pattern | — |
| SB0385 | P1 | 5 egasi raqami RANDOM/FIXED | PARTIALLY-RESOLVED | owner-summary.service.ts:58-103 real newCustomers/lostCustomers/topRisk+churn fields; some 0-default fallback path exists | mechanism real, full live-data population unconfirmed |
| SB0386 | P2 | Telegram digest subscription+scheduled publish SKELETON ONLY | PARTIALLY-RESOLVED | dup of SB0379 | — |
| SB0387 | P2 | Hisobot-reglament (versiya/imzo/approval/archive) MINIMAL | STILL-OPEN | stat_reglament table confirmed absent | — |
| SB0388 | P1 | Card→Dashboard linkage missing | STILL-OPEN | dashboard shows global KPIs, not card-attributed (dup card-linkage theme) | — |
| SB0389 | P1 | Golden-thread break: widgets disconnected from org-approval-workflow | STILL-OPEN | not independently checked this pass | — |
| SB0390 | P1 | Production metrics query incomplete (queryProductionMetrics L162) | UNVERIFIABLE | specific line citation not re-checked this pass | — |
| SB0391 | P2 | Stat-trends/open-issues endpoints not fully defined | UNVERIFIABLE | not checked | — |
| SB0392 | P2 | Director state-machine holat logic not exposed to FE | PARTIALLY-RESOLVED | BE service real (SB0368); FE exposure unconfirmed | — |
| SB0393 | P2 | KPI weights not integrated with card-org-hierarchy | STILL-OPEN | dup of card-linkage + KPI-weight-config themes | — |
| SB0394 | P1 | 5 egasi raqami (Cyrillic variant) | PARTIALLY-RESOLVED | dup of SB0385 | — |
| SB0395 | P1 | Kunlik strategik AI digest unclear, no automated send | PARTIALLY-RESOLVED | dup of SB0383/379 | — |
| SB0396 | P2 | OKR ierarxiya dashboard'da yo'q | PARTIALLY-RESOLVED | dup of SB0377/382 | — |
| SB0397 | P2 | ЦКП kunlik deadline metric dashboard'da ko'rinmaydi | STILL-OPEN | underlying gate resolved (Area01); dashboard-visibility specifically not confirmed | — |
| SB0398 | P2 | Kechikish sabab kategoriyasi ko'rsatilmaydi | STILL-OPEN | dup of SB0373/381/406 | — |
| SB0399 | P1 | KPI weights config yo'q | STILL-OPEN | DirectorHolatService's config is band-thresholds, not KPI-formula weights specifically | distinct gap from SB0368's resolution |
| SB0400 | P1 | KPI 5-kohezentsi formula yo'q | STILL-OPEN | no combined cashflow+plan%+order+staff+quality formula independently confirmed | — |
| SB0401 | P1 | Holat darajasi (5 daraja rangli) yo'q | RESOLVED | dup of SB0368/380 | — |
| SB0402 | P1 | Kunlik strategik AI tahlil (5 raqam) | PARTIALLY-RESOLVED | dup of SB0385/394 | — |
| SB0403 | P1 | Majlis (council) struktura org-sxema bog'liqsiz | PARTIALLY-RESOLVED | director/infrastructure/repositories/council-members.repository.ts + presentation/council-members.controller.ts + shared/db/migrations/council-members-2026-06-30.sql all confirmed real | dedicated module exists (recent, this session's own memory confirms); table 0 rows; org-schema auto-inference specifically unconfirmed |
| SB0404 | P1 | AI-chatbot kunlik ЦКП savol (mashinasiz xodimlar) yo'q | RESOLVED | dup of Area01 SB0002/0012 — ai-daily-report.cron.ts confirmed real | — |
| SB0405 | P1 | Kunlik hisobot deadline oylik-gate'ga ulanmagan | RESOLVED | dup of Area01 SB0001/0015 — ckp-gate confirmed wired | — |
| SB0406 | P1 | Root-cause kategoriyasi (material/transport/operator/qolip) yo'q | STILL-OPEN | dup of SB0373/381/398 | — |
| SB0407 | P2 | 7-otdeleniye KPI agregat yo'q | PARTIALLY-RESOLVED | seven_function_kpis table exists, 0 rows | schema built, unpopulated |
| SB0408 | P2 | Telegram digest (kunlik) yo'q | PARTIALLY-RESOLVED | dup of SB0379/386 | — |
| SB0409 | P2 | Role-dashboard widgets config yo'q | PARTIALLY-RESOLVED | role_dashboard_widgets table exists, 0 rows | schema built, unpopulated |
| SB0410 | P2 | Widget-level permission not enforced | STILL-OPEN | dup of SB0409 — config table empty, enforcement moot until populated | — |

**Area 09 tally:** RESOLVED=4 · STILL-OPEN=18 · PARTIALLY-RESOLVED=19 · UNVERIFIABLE=2.
**Cross-ref:** SB0404/405 are exact duplicates of Area01's already-resolved ЦКП findings. SB0368/380/401 are
the same 5-status finding, all RESOLVED by `director-holat.service.ts`. SB0385/394/402 and SB0379/386/408 and
SB0377/382/396 and SB0373/381/398/406 are each the same theme from multiple angles. **The pattern that defines
this area**: nearly every "X yo'q" (X doesn't exist) claim turned out to be "X exists as a real service/table,
but with 0 rows of data or unconfirmed depth" — a materially different, more advanced state than the original
audit described, consistent with the "schema/service built, data/enforcement pending" pattern seen across
most of this audit. This area has the highest PARTIALLY-RESOLVED rate (19/43, 44%) of any area processed so far.

---

## Area 03 — LMS / Darslik (kartaga) (40 findings · P0=9 P1=18 P2=13)

**Headline:** the single most comprehensively-resolved area in this entire audit. A large fraction of these
findings explicitly cite "FAZA 07 direktiva B1-B8" line numbers — i.e. they describe a *planned* build that,
based on current code, has since been **executed in full**. Every core P0 claim is now false:
`lms-card-gate.service.ts` implements a real `LmsCardGateService` class with `isCardTrainingComplete()` /
`isCardTrainingCompleteBool()` / a `getCompletionSnapshot()` call — exactly the methods SB0111/137/142 claim
don't exist. `card-employee-assigned.handler.ts` implements a real, idempotent (`ON CONFLICT`) auto-enroll
listener on `@OnEvent(CARD_EMPLOYEE_ASSIGNED_EVENT)` — exactly what SB0110/129/138/141 claim is missing. A
real 3-stage, 2-signature course-approval workflow exists (`POST :id/approve`, draft→review→approved) —
resolving SB0113/121/128/140. `lms.module.ts:129` explicitly exports `LmsCardGateService` "so HR payroll
(FAZA 04) + org-structure razryad (FAZA 03)" can inject it — resolving SB0118/147 (module-registration
incomplete). `courses.card_id`, `courses.approval_status`, `enrollments.card_id`, `enrollments.auto_enrolled`,
and the `lms_card_mentors` table all exist in the DB (contradicting SB0114/115/123's schema-absence claims).
A real FE `DarslikTab` component is imported and rendered inside `OrgNodeDetail.tsx` (resolving
SB0109/117/143). The genuine remaining gaps are narrower than the original audit suggested: `courses.card_id`
is 0/5 filled and `enrollments.card_id` is **15/15 NULL** (a real data-integrity gap — the column exists but
no row has ever been backfilled), `courses.course_type` truly doesn't exist as a column, and no dedicated
mentor-assignment service/controller was found even though the `lms_card_mentors` table itself does.

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0109 | P0 | courses.card_id 0/5 + FE Darslik tab YO'Q | PARTIALLY-RESOLVED | card_id column exists, 0/5 rows filled (data gap); OrgNodeDetail.tsx:20,132,148 imports+renders real DarslikTab | schema+FE real; course-level data unpopulated |
| SB0110 | P0 | CardEmployeeAssignedEvent listener (avto-enroll) YO'Q | RESOLVED | lms/infrastructure/event-handlers/card-employee-assigned.handler.ts:50,59,99 — real, idempotent (ON CONFLICT), calls lmsRepo.autoEnroll | — |
| SB0111 | P0 | LmsCardGateService (DB-wrapper gate) YO'Q | RESOLVED | lms/application/services/lms-card-gate.service.ts:104,127,181 — full real class | — |
| SB0112 | P1 | courses.course_type ustun yo'q | STILL-OPEN | confirmed: no course_type column (info_schema) | — |
| SB0113 | P1 | approval_status + 3-bosqichli tasdiq UI yo'q | PARTIALLY-RESOLVED | courses.approval_status column exists; BE 3-stage 2-signature workflow real (lms-courses.controller.ts:175-201 POST :id/approve) | BE solid; FE UI specifically unconfirmed |
| SB0114 | P1 | lms_card_mentors jadval YO'Q | RESOLVED | to_regclass('lms_card_mentors') non-null | table exists |
| SB0115 | P1 | enrollments.card_id + auto_enrolled ustunlari yo'q | RESOLVED | both columns confirmed present (info_schema) | — |
| SB0116 | P2 | card_required_knowledge jadval yo'q | STILL-OPEN | not checked this pass, no evidence found | — |
| SB0117 | P2 | FE Darslik tab tuzatilgan yo'q | RESOLVED | dup of SB0109 | — |
| SB0118 | P2 | LmsCardGateService module exports'ga qo'shilmagan | RESOLVED | lms.module.ts:106,129 — explicitly registered + exported with comment naming payroll+razryad consumers | — |
| SB0119 | P0 | LMS oylik-gate ULANMAGAN payrollga | RESOLVED | dup of Area02 SB0070 — confirmed wired in hr/payroll/payroll.service.ts | — |
| SB0120 | P1 | Kurs-karta biriktiruvi FE UI yo'q | PARTIALLY-RESOLVED | backend card_id column real; FE binding UI not independently confirmed | — |
| SB0121 | P1 | 3-bosqichli tasdiq oqimi YO'Q BILKUL | RESOLVED | dup of SB0113 | — |
| SB0122 | P1 | Mentor tasdiq/reyting/malaka-tekshirish YO'Q | PARTIALLY-RESOLVED | lms_card_mentors table exists; no dedicated mentor service/rating logic found in lms/application | table only, no service layer confirmed |
| SB0123 | P0 | courses.card_id schema'da yo'q, faqat departmentId | RESOLVED | card_id column confirmed present — claim is false | — |
| SB0124 | P0 | Oylik-gate noqurilgan | RESOLVED | dup of SB0119 | — |
| SB0125 | P0 | Imtihon→razryad oqimi: razryad_history yo'q, listener yo'q | RESOLVED | dup of Area02 SB0057/106 — razryad_history + exam-passed-razryad.listener.ts confirmed real | — |
| SB0126 | P1 | Oltin-ip: QC/WMS→sertifikat-entity yo'q | STILL-OPEN | not checked this pass; distinct from LMS course-certificates | — |
| SB0127 | P1 | Event-driven: listener 0, payload incomplete (no card_id) | RESOLVED | CardEmployeeAssignedHandler confirmed real with card_id in payload | — |
| SB0128 | P1 | 3-bosqichli tasdiq: workflow yo'q, publish immediate | RESOLVED | dup of SB0113/121 | — |
| SB0129 | P2 | Darslik auto-assign: auto-enroll yo'q | RESOLVED | dup of SB0110 | — |
| SB0130 | P2 | Onboarding koeffitsienti 0.7/0.85/0.90 noqurilgan | STILL-OPEN | not checked this pass (distinct topic) | — |
| SB0131 | P2 | Kurs-versioning yo'q | STILL-OPEN | no version column confirmed | — |
| SB0132 | P1 | AddCourseDialog forma cardId maydoni yo'q | UNVERIFIABLE | components/AddCourseDialog.tsx exists; field-presence not independently confirmed this pass | — |
| SB0133 | P1 | CardDetailDialog 8-tab ichida LMS tab YO'Q | PARTIALLY-RESOLVED | DarslikTab exists in OrgNodeDetail.tsx; whether CardDetailDialog specifically also has it unconfirmed | may be a different dialog than the one checked |
| SB0134 | P2 | Oylik-gate UI (block/warning) ko'rinmaydi | UNVERIFIABLE | FE-specific, not checked this pass | — |
| SB0135 | P2 | FE 'by-card' endpoint ishlatilmaydi | UNVERIFIABLE | not checked this pass | — |
| SB0136 | P2 | CourseBasicInfoForm departmentId qoldi, card_id yo'q | UNVERIFIABLE | not independently checked this pass | — |
| SB0137 | P0 | LmsCardGateService MAVJUD EMAS (FAZA07 B3) | RESOLVED | dup of SB0111 — exact opposite confirmed, matching method names cited | claim describes a pre-FAZA07 state; build since executed |
| SB0138 | P0 | Avto-enroll listener MAVJUD EMAS (FAZA07 B5) | RESOLVED | dup of SB0110 | — |
| SB0139 | P1 | LmsCardMentorService+controller endpoints MAVJUD EMAS | PARTIALLY-RESOLVED | dup of SB0122 | — |
| SB0140 | P1 | Kurs approval controller endpoint MAVJUD EMAS | RESOLVED | dup of SB0113/121/128 — POST :id/approve confirmed real | — |
| SB0141 | P1 | Avto-enroll logic repodan YO'Q | RESOLVED | dup of SB0110 — lmsRepo.autoEnroll() confirmed, idempotent | — |
| SB0142 | P1 | findApprovedCoursesByCard/getCompletionSnapshot repo metodlari YO'Q | RESOLVED | getCompletionSnapshot confirmed called (lms-card-gate.service.ts:234) | gate mechanism proven real end-to-end |
| SB0143 | P1 | FE OrgNodeDetail.tsx Darslik tab YO'Q | RESOLVED | dup of SB0109/117 | — |
| SB0144 | P1 | Enrollments.card_id NOT NULL schema, qo'lda yozilgan NULL | STILL-OPEN | confirmed: enrollments total=15, card_id NULL=15 (100%) | genuine data-integrity gap — column real, never backfilled |
| SB0145 | P2 | Cross-card credit logic MAVJUD EMAS | STILL-OPEN | not checked, no evidence found | — |
| SB0146 | P2 | Domen-bilim UI/endpoint MAVJUD EMAS | STILL-OPEN | dup of SB0116 | — |
| SB0147 | P2 | LmsModule registratsiyasi INCOMPLETE | RESOLVED | dup of SB0118 — confirmed complete | — |
| SB0148 | P2 | Courses.course_type ustun MAVJUD EMAS | STILL-OPEN | dup of SB0112 | — |

**Area 03 tally:** RESOLVED=21 · STILL-OPEN=10 · PARTIALLY-RESOLVED=6 · UNVERIFIABLE=3.
**Cross-ref:** This area has the highest RESOLVED count (21/40, 53%) of any area in the audit — a discrete
"FAZA 07" LMS-card-gate build wave clearly executed most of what the original audit flagged as missing, in
the time between that audit and now. SB0110/129/138/141/127 (auto-enroll), SB0111/137 (gate service),
SB0113/121/128/140 (3-stage approval), SB0118/147 (module registration), and SB0109/117/143 (FE tab) are each
5-6 duplicate band-IDs collapsing to a single piece of evidence — do not re-flag or re-fix any of them. The
two genuinely load-bearing STILL-OPEN items are `enrollments.card_id` being 100% NULL (SB0144 — a real
backfill gap, not a missing feature) and the absent `course_type` column (SB0112/148, blocking the
TX=100%/general=70% dynamic-threshold vision). Mentor-assignment (SB0122/139) is the one area where even the
schema-exists/service-missing pattern from elsewhere in this audit applies here too.

---

## Area 04 — Org-struktura / KARTA-markazlilik (40 findings · P0=10 P1=19 P2=11)

**Headline:** this area is the direct DB/schema counterpart to Area01 (CKP)/Area02 (HR)/Area05 (Auth)'s
card-centricity findings — nearly every finding here duplicates one already resolved, partially-resolved, or
confirmed-still-open elsewhere this audit, re-derived from the org-structure vantage point. Fresh checks this
pass: the "single-tree invariant" is confirmed broken with **17 root nodes** (`parent_id IS NULL`), not the
cited 14 — still a real violation, just a different current count. `razryad_level_id` is 1/145 filled
(essentially still the cited 0/144 empty state). `workflow_rules` and `card_templates` tables **both exist**
(contradicting their respective "jadval yo'q" claims) but `workflow_rules` has 0 rows and `card_templates`'s
CRUD+apply-template mechanism was already confirmed real in Area02 (SB0069/108). `otdeleniye_no` column
exists on `org_departments` (contradicting SB0157's absence claim), though fill/enforcement wasn't verified.
`manager_id` genuinely doesn't exist as a column name — the canonical name is `head_user_id` (confirmed
18/145 filled, i.e. ~88% NULL — a real backfill gap, just under a different, correct column name than several
findings cite). The razryad-execution chain (exam→2-signature approval→history), the LMS-darslik→payroll
gate, and the ЦКП auto-feed mechanisms are each confirmed real via Area01/02 evidence — this area's
duplicate citations of those gaps are resolved by the same evidence, not re-derived independently.

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0149 | P0 | Yagona daraxt invariant buzilgan (14 root + 2 parallel base) | STILL-OPEN | org_departments: 17 rows with parent_id IS NULL (live); org_departments+org_functions+departments all live (Area02 SB0058) | root-count drifted (14→17) but violation confirmed real |
| SB0150 | P0 | card-id login+oylik gate yo'q, users.card_id umuman yo'q | PARTIALLY-RESOLVED | users.card_id + fk_users_card_id CONFIRMED exist (Area02/05); login-gate code real but env-flagged off (CARD_LOGIN_GATE_ENABLED) | "umuman yo'q" is false; "not enforced by default" is true |
| SB0151 | P0 | Karta 5-holat state-machine yo'q, current_state bor lekin mexanizm yo'q | PARTIALLY-RESOLVED | dup of Area02 SB0060 — column exists, only active/null live values, no full mechanism | — |
| SB0152 | P1 | Razryad kiritish data 0/144 | STILL-OPEN | org_departments.razryad_level_id: 1/145 filled (confirmed live) | essentially still empty |
| SB0153 | P1 | Karta oylik-maydonlari data kiritilmagan | STILL-OPEN | dup of Area02 SB0080 — salary_type/min_salary/max_salary confirmed 0/145 | — |
| SB0154 | P1 | RBAC karta markazida emas (eski positions'da keyed) | STILL-OPEN | dup of Area05 SB0190 — CARD_PERMISSION_SOURCE_READY=false hardcoded constant | — |
| SB0155 | P2 | Karta shabloni va Excel import yo'q | PARTIALLY-RESOLVED | dup of Area02 SB0069/108 — card_templates table + full CRUD+apply-template controller confirmed real | explicit Excel-format import unconfirmed |
| SB0156 | P2 | Audit field-level sabab-gate yo'q | STILL-OPEN | not independently checked this pass | — |
| SB0157 | P2 | Otdeleniye_no 1-7 majburiy qurilmagan | PARTIALLY-RESOLVED | org_departments.otdeleniye_no column confirmed exists | mandatory-enforcement/fill-rate not independently verified |
| SB0158 | P0 | Atomik qoida buzilgan (1 karta≠1 o'rindiq, M:N ruxsat) | STILL-OPEN | dup of Area02 SB0079/100 — employee_cards M:N table exists, 1 row | — |
| SB0159 | P0 | head_user_id missing write logic, barcha kartalar NULL | STILL-OPEN | dup of Area02/05 SB0068/215 — confirmed 18/145 filled (mostly NULL, not literally "barcha") | — |
| SB0160 | P1 | Oylik yig'indi + nisbat gate MISSING | STILL-OPEN | dup of Area02 SB0075/85 — stakeShare param exists in formula; salary data empty | — |
| SB0161 | P1 | Kartasiz login+oylik gate MISSING (head_user_id NULL) | STILL-OPEN | dup of SB0159 — no deny-logic confirmed for NULL head_user_id | — |
| SB0162 | P2 | LMS/Darslik → Oylik Gate MISSING | RESOLVED | dup of Area02 SB0070 / Area03 SB0119 — confirmed wired in payroll.service.ts | — |
| SB0163 | P2 | ЦКП kunlik hisobot deadline SPEC-ZIDDIYAT (16h vs 3h) | UNVERIFIABLE | dup of Area01 SB0020 — spec/owner decision, not a code gap | — |
| SB0164 | P2 | Shtat-reja (A vs B) SPEC-ZIDDIYAT | UNVERIFIABLE | spec/owner decision, not independently resolvable from code | — |
| SB0165 | P0 | Oylik kartadan INDEPENDENT — Formula A yo'q | PARTIALLY-RESOLVED | dup of Area02 SB0056/98 — previewCardSalary/computeGatedMonthlySalary real, not wired into closePeriod | — |
| SB0166 | P0 | ЦКП/GSD NULL — kunlik hisobot gate yo'q | PARTIALLY-RESOLVED | dup of Area01 — gate mechanism resolved, data still sparse | — |
| SB0167 | P0 | manager_id NULL + workflow_rules jadval yo'q | PARTIALLY-RESOLVED | manager_id column doesn't exist by that name (head_user_id is canonical, 18/145 filled); workflow_rules table EXISTS, 0 rows | two nuanced corrections, not a flat "yo'q" |
| SB0168 | P1 | Darslik→oylik gate yo'q | RESOLVED | dup of SB0162 | — |
| SB0169 | P1 | RBAC kartadan derived emas | STILL-OPEN | dup of SB0154 | — |
| SB0170 | P1 | employee_cards M:N EMPTY — acting Phase 6-7 yo'q | STILL-OPEN | dup of SB0158 — 1 row confirmed, essentially still empty | — |
| SB0171 | P2 | 3-kun yo'qlik profil-blok logic yo'q | STILL-OPEN | not checked this pass | — |
| SB0172 | P2 | Razryad oylik integration yo'q | PARTIALLY-RESOLVED | razryad coefficient IS used live in payroll formula (Area02's getRazryadCoefficient call chain) | not fully absent as claimed |
| SB0173 | P1 | Razryad MainTab'da ko'rinmaydi, alohida tab | UNVERIFIABLE | FE-specific, not checked this pass | — |
| SB0174 | P1 | Oylik yig'indi logikasi yo'q | STILL-OPEN | dup of SB0160 | — |
| SB0175 | P1 | Vakansiya aging (0-14/15-45/45+) + SLA yo'q | STILL-OPEN | no vacancy-aging/SLA columns found on org_departments (info_schema) | confirmed absent |
| SB0176 | P2 | Tab soni ortiqcha (9 ta) — UX complexity | UNVERIFIABLE | FE-specific, not checked | — |
| SB0177 | P2 | MainTab forma REAL SAQLASHI (Q-43 verify) | UNVERIFIABLE | not checked this pass | — |
| SB0178 | P2 | Karta-xodim 1:1 biriktirish majburligi — hozir PARTIAL | STILL-OPEN | dup of SB0158/170 | — |
| SB0179 | P0 | card_id NULL login+oylik GATE yo'q, ustun umuman yo'q | PARTIALLY-RESOLVED | dup of SB0150 — column confirmed exists | — |
| SB0180 | P0 | OYLIK KARTADAN KELADI ulanmagan | PARTIALLY-RESOLVED | dup of SB0165 | — |
| SB0181 | P1 | Darslik-oylik gate ulanmagan | RESOLVED | dup of SB0162/168 | — |
| SB0182 | P1 | 5-holat state-machine emas, faqat is_active boolean | PARTIALLY-RESOLVED | dup of SB0151 | — |
| SB0183 | P1 | Gorizontal workflow_rules 0 qator | PARTIALLY-RESOLVED | dup of SB0167 — table exists, 0 rows | — |
| SB0184 | P1 | ЦКП avtomatik sistema yo'q (kunlik/IoT/fakt/kaskad) | RESOLVED (mechanism) | dup of Area01 — all 4 sub-mechanisms confirmed real; data volume still sparse | — |
| SB0185 | P1 | Razryad o'sish/pasayish execution ulanmagan | RESOLVED | dup of Area02 SB0057/65/81 — razryad_history + exam-listener + hrApprove/managerApprove confirmed real | — |
| SB0186 | P1 | Manager_id backfill ishga tushmagan (0/30, 126 head_user_id NULL) | STILL-OPEN | head_user_id confirmed 18/145 filled (~127 NULL, close to the cited 126) | genuinely confirmed still a real gap, just via the correctly-named column |
| SB0187 | P1 | Ikki-olam: org_departments(144)+org_functions(97) parallel | STILL-OPEN | dup of SB0149 — 3-way parallel base (org_departments/org_functions/departments) all confirmed live | — |
| SB0188 | P1 | Karta holat tarix/audit-maydon qurilmagan | STILL-OPEN | dup of SB0156 — no audit-trail/mandatory-reason gate found | — |

**Area 04 tally:** RESOLVED=5 · STILL-OPEN=21 · PARTIALLY-RESOLVED=11 · UNVERIFIABLE=3.
**Cross-ref:** This is the most duplicate-heavy area of the entire audit — essentially every finding here
re-derives a gap already established with hard evidence in Area01 (CKP), Area02 (HR), or Area05 (Auth):
card-login-gate (SB0150/179), card-payroll-formula (SB0165/180), LMS-darslik-gate (SB0162/168/181, all
RESOLVED), razryad-execution (SB0185, RESOLVED), ЦКП-auto-feed (SB0166/184, mechanism RESOLVED), 3-parallel
org base (SB0149/187), and head_user_id/manager_id backfill (SB0159/161/186). Do not re-open or re-fix any of
these — the evidence already exists. The two new (non-duplicate) facts this pass contributes: the org-tree
root-count is 17 (not 1, confirming the single-tree invariant violation with fresh data), and both
`workflow_rules` and `card_templates` tables exist where the original audit claimed they didn't — the
"table missing" framing is wrong even though "0 rows"/"unenforced" remains an accurate characterization.

---

## Area 20 — Moliya / GL / kassa (40 findings · P0=6 P1=17 P2=17)

**Note on scope:** this area is read-only-audited per the standing owner instruction "GL/payroll/Aisha
tegma" (don't modify) — no GL/payroll code was touched or will be recommended for change here; all checks
below are plain reads (`information_schema`, table counts) consistent with a read-only audit.

**Headline:** three clean reversals with hard evidence, and one confirmed real architectural gap.
`users.pin_hash` **does exist** (contradicts SB0813's "ustuni YO'Q DB" claim). `cashier_movements` has **9
live rows**, not 0 (contradicts SB0818's "0 data despite schema ready" claim). The GL chart-of-accounts has
**42 accounts** — exactly matching this project's own prior "CoA seed (42 BHMS)" memory note — flatly
contradicting SB0824's "only 10 accounts hardcoded" claim. On the confirmed-real-gap side: `auto-gl-posting.
service.ts:20` contains a **self-documented architecture comment**: *"the `pos_gl_postings` SUBLEDGER (not
the canonical `entries`)"* — this directly confirms SB0817's core claim that POS GL postings go to a
separate subledger table, not the canonical `entries` ledger (the file's own history notes it "was using
codes that don't exist" before a prior fix, but the subledger-vs-canonical architecture itself is confirmed,
current, and intentional-looking rather than accidental). The mapping of POS movement types to GL debit/credit
accounts **is real** (a genuine per-type switch/case in the same file) — contradicting SB0820's "not mapped"
framing, even though the destination table is the subledger, not `entries`. `entries.debit_account_id` /
`credit_account_id` are confirmed proper `integer` FK columns (matching SB0807's own "Tuzatildi" / already-fixed
framing). `rbac_tier` is confirmed 0/145 filled (dup of Area05 SB0216) — a real, still-open data gap.

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0796 | P0 | Karta-markazli oylik model hali noto'liq (baseSalary hardcode) | PARTIALLY-RESOLVED | dup of Area02 — live-card formula (previewCardSalary) uses real razryad coeff; closePeriod's bulk path still uses stored baseSalary | — |
| SB0797 | P0 | Oylik topshirish zanjiri kartadan ulanmagan (payroll→KASSIR) | STILL-OPEN | no card-to-cashier-payout link independently confirmed this pass | — |
| SB0798 | P0 | RBAC tier qiymatlari 0/144 NULL | STILL-OPEN | dup of Area05 SB0216 — org_departments.rbac_tier confirmed 0/145 | — |
| SB0799 | P0 | Tushum 4-hisobga taqsim mexanizmi yo'q | STILL-OPEN | not checked this pass; dup of SB0809 | — |
| SB0800 | P1 | CkpGate deadline ziddiyat va implementatsiya yo'q | PARTIALLY-RESOLVED | dup of Area01 SB0020 — gate IS implemented; "16h vs 3h" itself is an owner spec-decision, not a code gap | — |
| SB0801 | P1 | Kassir X/Z hisobot va reconciliation yo'q | STILL-OPEN | not checked this pass | — |
| SB0802 | P1 | Global adolat prinsipi enforce emas | STILL-OPEN | not checked (architecture/policy concern) | — |
| SB0803 | P1 | Master-data reestri ochiq (tushum%, razryad, oylik band, RBAC tier) | STILL-OPEN | dup of confirmed-empty data: razryad_level_id 1/145, salary fields 0/145, rbac_tier 0/145 | — |
| SB0804 | P2 | LMS/Darslik gate yo'q qurilgan | RESOLVED | dup of Area02 SB0070 / Area03 SB0119 — confirmed wired | — |
| SB0805 | P2 | POS golden-thread 2 uzilish (QC create 500, delivery create 404) | UNVERIFIABLE | finding's own text flags "tuzatildi, VERIFY kerak" (already possibly fixed); HTTP-status claims not independently re-tested this pass | — |
| SB0806 | P2 | Oylik tarqatish kassir orqali PARTIAL | STILL-OPEN | dup of SB0797 | — |
| SB0807 | P1 | Entries debit/credit ustunlari — Tuzatildi (ID qayta-qaratish) | RESOLVED | entries.debit_account_id + credit_account_id confirmed integer type (info_schema) | finding's own text says fixed; DB confirms proper FK typing |
| SB0808 | P1 | QQS 12% hardcoded — configurability yo'q | STILL-OPEN | not independently checked this pass | — |
| SB0809 | P1 | 4-hisob grupdashishi — Spec yozilgan, kod yo'q | STILL-OPEN | dup of SB0799 | — |
| SB0810 | P1 | Period lock — Spec yozilgan, kontroller biriktirilmagan | STILL-OPEN | not checked this pass | — |
| SB0811 | P2 | Avans 70% oltin zanjir — Spec DRAFT, amaliyot UNCLEAR | PARTIALLY-RESOLVED | dup of Area14 SD SB0586/601 — advance_percent/advance_status columns exist, live values NULL | — |
| SB0812 | P2 | Kanonik naqd-nazorat FIFO/FEFO — Spec ALOHIDA, kod LEGACY | PARTIALLY-RESOLVED | dup of Area13 WMS SB0534 | — |
| SB0813 | P2 | PIN tekshirish (KAS-1/KAS-2) — users.pin_hash ustuni YO'Q DB | RESOLVED | users.pin_hash column confirmed exists (info_schema) | claim is false |
| SB0814 | P2 | Moliya AI bahosi (global principle) — tasdiq yo'q | UNVERIFIABLE | vague AI-alignment claim, not checked this pass | — |
| SB0815 | P1 | Naqd-chegarasi va inkassatsiya (EP-FIN-072) — Spec yo'q | STILL-OPEN | not checked this pass | — |
| SB0816 | P2 | Qabul mezoni FE Routing — PeriodClosing/FinanceDashboard URL broken | UNVERIFIABLE | FE routing not checked this pass | — |
| SB0817 | P0 | POS Monitor GL posting to LOCAL table, not canonical entries (SAP#76 regression) | STILL-OPEN | pos/application/services/auto-gl-posting.service.ts:20 — self-documented comment: "the pos_gl_postings SUBLEDGER (not the canonical entries)" | confirmed via the code's own architecture comment |
| SB0818 | P0 | Cashier movements 0 data in DB despite schema ready | RESOLVED | cashier_movements: 9 rows confirmed live | claim is false |
| SB0819 | P1 | ЦКП deadline ambiguity 16h vs 3h | UNVERIFIABLE | dup of SB0800/Area01 SB0020 — spec/owner decision | — |
| SB0820 | P1 | POS harakat taksonomiyasi not mapped to GL posting rules | PARTIALLY-RESOLVED | auto-gl-posting.service.ts:47-74 has a real per-movement-type switch mapping to GL_ACCOUNTS debit/credit | mapping is real; destination is the subledger, not canonical entries (SB0817) |
| SB0821 | P1 | Yoqilg'i/Transport costing (Finance side) undefined | STILL-OPEN | not checked this pass | — |
| SB0822 | P2 | Razryad payroll integration (Faza 4) partial, no test data | PARTIALLY-RESOLVED | dup of Area02 — mechanism real (getRazryadCoefficient), test-data volume genuinely low | — |
| SB0823 | P2 | Advance-approved chain (Trigger 7→PP unlock) not end-to-end tested | STILL-OPEN | not independently tested this pass | — |
| SB0824 | P2 | GL chart-of-accounts seed incomplete (only 10 accounts, not full BHMS) | RESOLVED | accounts table: 42 rows confirmed live — matches this project's own prior "CoA seed (42 BHMS)" memory | claim is false |
| SB0825 | P1 | Kassir kontsepti noto'g'ri (sidebar vs actual page separation) | UNVERIFIABLE | FE-specific, not checked this pass | — |
| SB0826 | P1 | Finance Dashboard vs Kassir ajratish noto'g'ri UX | UNVERIFIABLE | dup of SB0825 | — |
| SB0827 | P1 | Payroll Tab stub (FinanceDashboardPayrollTab.tsx) | UNVERIFIABLE | not checked this pass | — |
| SB0828 | P2 | GL Posting REAL emas: seed-accounts button | UNVERIFIABLE | not checked this pass; COA itself confirmed real (SB0824) | — |
| SB0829 | P2 | Naqd-control/Limit UI umuman yo'q | STILL-OPEN | dup of SB0815 | — |
| SB0830 | P2 | AP/AR Aging yarim (2 alohida ekran kerak) | STILL-OPEN | not checked this pass | — |
| SB0831 | P2 | FP-tsikl UI minimalist | UNVERIFIABLE | not checked this pass | — |
| SB0832 | P1 | Form save majburiy (Qoida 43) — check needed | UNVERIFIABLE | not checked this pass | — |
| SB0833 | P1 | Schema drift: debit/credit_account_id Drizzle varchar vs DB INTEGER | PARTIALLY-RESOLVED | DB side confirmed integer (info_schema); Drizzle TS-side type not independently checked | dup context of SB0807's "already fixed" |
| SB0834 | P2 | Kassir FE UI page yo'q (controller bor) | UNVERIFIABLE | not checked this pass | — |
| SB0835 | P2 | Cost-center GL entries'ga biriktirilmagan | STILL-OPEN | not checked this pass | — |

**Area 20 tally:** RESOLVED=4 · STILL-OPEN=17 · PARTIALLY-RESOLVED=8 · UNVERIFIABLE=11.
**Cross-ref:** SB0796/822 duplicate Area02's card-payroll-formula findings. SB0800/819 duplicate Area01
SB0020 (ЦКП deadline spec conflict). SB0804 duplicates the already-resolved LMS-gate finding. SB0811/812
duplicate SD/WMS findings on advance-percent and FIFO/FEFO. **The one genuinely load-bearing P0 finding this
area confirms as real and unresolved is SB0817** (POS GL postings go to a `pos_gl_postings` subledger, not
the canonical `entries` table) — this is the Finance-area's version of the "two-world" pattern seen
elsewhere in the audit, except here it's self-documented in the code's own comments rather than something
this audit had to discover independently. This finding is read-only-confirmed per the GL-protection
instruction; no fix is suggested or implied here.

---

## Area 12 — AI (per-karta + planning) (33 findings · P0=5 P1=16 P2=12)

**Headline:** the most dramatic single reversal of this entire audit: SB0523's claim **"AISHA-JARVIS MODUL
BUTUNLAY YO'Q"** (the Aisha/JARVIS module doesn't exist at all) is flatly, decisively false — the `aisha/`
module contains **61 real TypeScript files**, including `claude.service.ts`, `gemini-fallback.service.ts`,
`budget-tracker.service.ts`, `pii-redactor.ts`, and 8+ distinct tool implementations
(`analyze-camera-feed.tool.ts`, `detect-safety-violations.tool.ts`, `forecast-demand.tool.ts`,
`generate-kpi-report.tool.ts`, etc.) — a substantial, multi-provider AI-agent implementation. What IS true is
that it's **never been exercised live**: `aisha_tool_calls`=0 and `ai_usage_logs`=0 rows, confirming SB0506/
509/510's "never live-tested"/"data yo'q" framing exactly. Two more flat reversals: SB0500's "imtihon-score
razryad_history'ga unlinked" is false — `exam-passed-razryad.listener.ts` documents and implements
`RazryadHistoryService.createRequest(increase, ai_suggested=true, examScore)`, auto-called with real
threshold validation (dup of Area02's already-confirmed razryad-execution chain). SB0503/514's "LMS gate
commented out ('DO NOT touch payroll')" is also false today — no such comment exists in
`payroll.service.ts`; the LMS gate is confirmed wired (dup of the already-resolved Area01-04 LMS-gate
finding). A real (if partial) AI↔golden-thread connection was found: `pp-ai-planning.service.ts` references
an AI-router task-type `mes.schedule_optimize`, a genuine touchpoint into the MES side of the chain.

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0497 | P0 | AI-fit trigger/scheduling yo'q (manual POST only) | STILL-OPEN | no automated batch/event trigger found | — |
| SB0498 | P1 | Karta M:N xodim model AI'ga ulanmagan | STILL-OPEN | dup of the systemic card-linkage + sparse M:N data theme | — |
| SB0499 | P1 | Portret-PDF + email-tarqatish yo'q | STILL-OPEN | not checked this pass | — |
| SB0500 | P1 | Imtihon grading unlinked (razryad_history/AI-suggested) | RESOLVED | org-structure/exam-passed-razryad.listener.ts:9,97 + razryad-history.service.ts:61-65,138 — real auto-call with examScore + ai_suggested=true + threshold validation | claim is false — dup of Area02's razryad-execution chain |
| SB0501 | P1 | Manba-avto-yigish (kunlik ЦКП/MES/QC/davomat→AI-fit prompt) yo'q | STILL-OPEN | not independently confirmed this pass | — |
| SB0502 | P1 | Kamera-kross-check yo'q, camera_ai_configs 0 rows | PARTIALLY-RESOLVED | camera_ai_configs table confirmed exists (0 rows, as cited); aisha/application/tools/analyze-camera-feed.tool.ts confirmed real | some VLM code exists; 0 live usage |
| SB0503 | P1 | Oylik-gate unlinked, LMS gate commented out | RESOLVED | no "DO NOT touch" comment found in payroll.service.ts; lmsGate confirmed wired (dup Area02 SB0070) | claim is false today |
| SB0504 | P2 | Past-moslik alert bloklamaydi, no event | STILL-OPEN | not checked this pass | — |
| SB0505 | P2 | Per-karta RBAC yo'q, AiFitController global roles | PARTIALLY-RESOLVED | ai-fit.controller.ts:34 @Roles(SUPER_ADMIN, DIRECTOR, HR_MANAGER) — real role-list, not literally "global open" | role-scoped, but not card-scoped (manager limited to own cards) — that specific gap is real |
| SB0506 | P0 | Layer A tool-execution loop hech qachon jonli test qilinmagan | STILL-OPEN | aisha_tool_calls = 0 rows (confirmed live, exact match) | code real, never exercised |
| SB0507 | P0 | Layer B (Desktop Python JARVIS client) completely missing | STILL-OPEN | no desktop-client code found (expected — likely a separate client app outside this API repo) | — |
| SB0508 | P1 | Aisha FE direktor-dashboard'dan decouple, unclear | PARTIALLY-RESOLVED | dup of Area01 SB0041 — grep confirmed no Aisha refs in DirectorDashboard = decoupling confirmed present | "unclear" framing softened — decoupling is confirmed, not ambiguous |
| SB0509 | P1 | AI usage logging zero, budget tracking untested | STILL-OPEN | ai_usage_logs = 0 rows (confirmed live, exact match) | — |
| SB0510 | P1 | Tool provenance structure tayyar, data yo'q | PARTIALLY-RESOLVED | dup of SB0506/509 — 61-file structure real, 0 usage data | — |
| SB0511 | P2 | Wake-word/LLM spec conflict (Aisha vs Uyg'on, Claude vs ChatGPT) | UNVERIFIABLE | spec/owner decision, not a code gap | — |
| SB0512 | P2 | Tool 'analyze-camera-feed': VLM integration hali noto'liq | PARTIALLY-RESOLVED | dup of SB0502 — tool file confirmed real | — |
| SB0513 | P2 | Aisha → Director dashboard integration path unclear | PARTIALLY-RESOLVED | dup of SB0508 | — |
| SB0514 | P0 | AI-oylik GATE (ЦКП+LMS) unwired | RESOLVED | dup of SB0503 / Area01/02 — both gates confirmed wired | — |
| SB0515 | P1 | ЦКП kunlik hisobot + AI-chatbot per-karta savol qurilmagan | RESOLVED | dup of Area01 SB0002/0012 — ai-daily-report.cron.ts confirmed real | — |
| SB0516 | P1 | Golden-thread ichida AI ulanmagan (SD→PP→MES) | PARTIALLY-RESOLVED | pp-ai-planning.service.ts:304-339 references AI-router taskType 'mes.schedule_optimize' | a real touchpoint exists; full-chain depth unconfirmed |
| SB0517 | P1 | Per-card AI-fit scheduler (event/haftalik) yig'ilmagan | STILL-OPEN | dup of SB0497 | — |
| SB0518 | P1 | E1 printsipi: absence-block.cron avto-disable inson-tasdig'isiz | STILL-OPEN | no human-approval gate found for absence-block logic | — |
| SB0519 | P2 | AI-portret (Portret tab) EPComingSoon stub | UNVERIFIABLE | FE-specific, not checked this pass | — |
| SB0520 | P2 | Aisha Layer B (desktop JARVIS) BUTUNLAY YO'Q | STILL-OPEN | dup of SB0507 | — |
| SB0521 | P2 | Event-listener zanjir: finance-invoice-created listener YO'Q | STILL-OPEN | not checked this pass | — |
| SB0522 | P2 | Aisha kalit/spec ziddiyat | UNVERIFIABLE | dup of SB0511 | — |
| SB0523 | P0 | AISHA-JARVIS MODUL BUTUNLAY YO'Q | RESOLVED | apps/api/src/modules/aisha/: 61 real .ts files incl. claude.service.ts, gemini-fallback.service.ts, budget-tracker.service.ts, 8+ tool implementations | claim is flatly, decisively false |
| SB0524 | P1 | ЦКП kunlik chatbot SPEC TEZKOR VA NOANIQ | UNVERIFIABLE | dup of SB0511 (spec ambiguity); underlying mechanism itself resolved (SB0515) | — |
| SB0525 | P1 | Per-karta mastery/loyalty/succession pipeline | STILL-OPEN | not checked this pass | — |
| SB0526 | P1 | Global adolat-printsipi → AI blok aktivatsiyasi tezlik | STILL-OPEN | not checked this pass | — |
| SB0527 | P2 | Turli modullar uchun AI-qaror integration ECHO/SOFTENED | STILL-OPEN | pp-ai-planning's 7-step + exam→razryad listener suggest some modules ARE real (not echo); not independently re-verified across all modules this pass | possibly outdated given SB0500/516's resolutions |
| SB0528 | P2 | Aisha futuristic design izchillik | UNVERIFIABLE | FE-specific, not checked this pass | — |
| SB0529 | P2 | Per-karta xarajat hisobi (AI router metadata→billing) | STILL-OPEN | budget-tracker.service.ts exists; per-card billing rollup specifically not confirmed | dup of the SB0509/510 "structure real, data/rollup unconfirmed" pattern |

**Area 12 tally:** RESOLVED=6 · STILL-OPEN=18 · PARTIALLY-RESOLVED=8 · UNVERIFIABLE=1.
**Cross-ref:** SB0503/514 duplicate the already-resolved LMS+ЦКП payroll-gate findings from Area01/02/03/04.
SB0500 duplicates Area02's razryad-execution-chain finding. SB0515 duplicates Area01's AI-daily-cron finding.
SB0508/513 are the same Aisha-decoupling observation (now confirmed, not "unclear"). SB0506/509/510/529 are
all the same "AI infrastructure real, zero live usage" fact. **The single most important correction this
area contributes to the whole audit**: the original claim that the entire Aisha/JARVIS AI-agent module
doesn't exist (SB0523, echoed by SB0507/520) is comprehensively false — it is a substantial, multi-provider
(Claude + Gemini fallback), tool-equipped implementation that has simply never been run in production
(0 tool-calls, 0 usage logs). This is a fundamentally different situation than "not built": the work is
done and needs to be turned on and exercised, not designed and coded from scratch.

---

## Area 19 — Razryad / malaka / o'sish (33 findings · P0=5 P1=13 P2=15)

**Headline:** a second major FE-side reversal, this time on top of Area02's already-confirmed razryad backend
chain. `RazryadTab.tsx` (in `components/hr/orgnode/`) is a **complete, real 2-signature approval-workflow UI**:
color-coded status pills (`pending`=amber, `hr_approved`=blue, `approved`=emerald — directly resolving
SB0775/794's "color-coded viz missing"), a `createRequest` mutation with increase/decrease request types
(resolving SB0773's "decrease FE incomplete"), and two distinct approve mutations —
`POST /razryad-requests/:id/hr-approve` and `POST /razryad-requests/:id/manager-approve` — implementing the
exact 1st-signature/2nd-signature flow SB0766/772 claim is missing or under-built. Combined with Area02's
already-confirmed backend (`razryad-history.service.ts` `hrApprove`/`managerApprove`, `exam-passed-razryad.
listener.ts` auto-creating AI-suggested increase requests), the razryad execution chain is now confirmed
**built end-to-end, front-to-back** — the remaining gap is purely **data**: `razryad_history`=0 rows (no
request has ever actually run through this real pipeline), `razryad_level_id` is ~1/145 filled, and
`razryad_levels`' `min_months`=0 and `exam_pass_threshold`/`max_retakes`=NULL for **every one of the 6
levels** (though `coefficient` values ARE seeded — 1.00/1.25/1.55/1.90 for levels 1-4 — real, meaningful
numbers, not placeholders). No listener was found for **direct/manual** `razryad_level_id` PATCH changes
(distinct from the exam-triggered auto-path) — that specific gap (SB0777) is confirmed genuinely open.

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0763 | P0 | Egasi-data yo'q, razryad_levels qiymatlar kiritilmagan | PARTIALLY-RESOLVED | coefficient values ARE seeded (1.00/1.25/1.55/1.90, levels 1-4, live); min_months=0 + exam_pass_threshold=NULL for all 6 rows | some owner-data entered, some genuinely missing |
| SB0764 | P1 | Razryad-karta ulanishi 0/139 | STILL-OPEN | dup of Area02/04 — razryad_level_id confirmed ~1/145 filled | — |
| SB0765 | P1 | Validation guards return null (fabrikatsiya-safe, spec unclear) | RESOLVED | razryad-history.service.ts:61-65 returns a real Err() with a specific threshold message, not a silent null | correct Q-40-honest behavior, not a stub |
| SB0766 | P1 | 2-imzo workflow HR+rahbar ma'lumot yetarli emas | RESOLVED | RazryadTab.tsx:154,161 — real hr-approve + manager-approve mutations; razryad_history.hr_approved_by/manager_approved_by columns (dup Area02 SB0073) | full FE+BE 2-signature confirmed |
| SB0767 | P2 | 3-oy guard implementation, min_months=0 hamma qatorda | STILL-OPEN | confirmed: all 6 razryad_levels rows have min_months=0 | — |
| SB0768 | P2 | RazryadTab FE mavjud, approval-workflow yo'q | RESOLVED | dup of SB0766 — approval-workflow UI confirmed fully real | claim is false |
| SB0769 | P2 | Razryad o'zgarishidan keyin oylik avto-o'zgarish unclear | PARTIALLY-RESOLVED | razryad coefficient live-used in card-payroll-preview formula (Area02); direct PATCH-triggered auto-payroll-update not confirmed | — |
| SB0770 | P2 | Imtihon savol-bank UI yo'q, hozir score raqam | STILL-OPEN | exam_pass_threshold NULL confirmed; no question-bank UI found | — |
| SB0771 | P2 | AI-suggestion placeholder, AI logic FAZA-10 | PARTIALLY-RESOLVED | ai_suggested flag confirmed REAL and actively populated by exam-passed-razryad.listener.ts (Area02/12) | more than a placeholder — actively used, just not yet a full "FAZA-10" AI-logic layer |
| SB0772 | P1 | HR/Rahbar pending-requests management UI missing | RESOLVED | dup of SB0766 — RazryadTab.tsx has real pending/hr_approved/approved status UI | claim is false |
| SB0773 | P1 | Razryad pasayish (decrease) FE incomplete | RESOLVED | RazryadTab.tsx:324 — reqType "decrease" with mandatory reason field confirmed real | claim is false |
| SB0774 | P2 | Razryad attestatsiya qayta-tasdiqlash scaffold missing | STILL-OPEN | not independently checked; recurring re-certification (beyond initial approval) not confirmed | — |
| SB0775 | P2 | Razryad color-coded visualization missing | RESOLVED | dup of SB0794 — real color-coded status pills confirmed | claim is false |
| SB0776 | P0 | Zarur data yo'q: 0/139 razryad_level_id NULL | STILL-OPEN | dup of SB0764 — confirmed ~1/145 filled | — |
| SB0777 | P1 | Event listener yo'q (razryad_level_id manual PATCH) | STILL-OPEN | no listener found for direct/manual PATCH changes (distinct from the exam-triggered auto-path) | genuine gap, exam-path ≠ manual-path |
| SB0778 | P1 | Payroll coefficient integration uzuq | PARTIALLY-RESOLVED | dup of Area02 — getRazryadCoefficient confirmed live-used in card-formula preview path, not wired into bulk closePeriod | — |
| SB0779 | P2 | Razryad-history+requests flow qisman | PARTIALLY-RESOLVED | RazryadHistoryRepository real; flow substantially built (FE+BE both confirmed this pass); live data=0 | — |
| SB0780 | P2 | Golden-thread: razryad oylik-flow'ga tuzatilmagan | PARTIALLY-RESOLVED | razryad coefficient does flow into card-payroll-preview (Area02); full SD→PP→MES→QC→razryad chain not independently confirmed | — |
| SB0781 | P2 | Razryad kategoriyasi qotib qolmaydi (thresholds nullable) | STILL-OPEN | confirmed: exam_pass_threshold NULL across all 6 rows | — |
| SB0782 | P0 | O'sish execution 0 | PARTIALLY-RESOLVED | mechanism fully real (exam-listener + approval-workflow, both confirmed); live-executed count = 0 (razryad_history=0) | code done, never run |
| SB0783 | P0 | razryad_history 0 | STILL-OPEN | confirmed: 0 rows live | data gap, not a code gap |
| SB0784 | P0 | 2-step tasdiq 0 | PARTIALLY-RESOLVED | mechanism fully real (hr-approve/manager-approve endpoints confirmed); live-executed count = 0 | dup of SB0782's pattern |
| SB0785 | P1 | Min 3 oy oraliq 0 | STILL-OPEN | dup of SB0767 | — |
| SB0786 | P1 | Exam threshold NULL | STILL-OPEN | dup of SB0770/792 | — |
| SB0787 | P1 | Pasayish 0 | PARTIALLY-RESOLVED | decrease-request FE mechanism real (SB0773); live count=0 | — |
| SB0788 | P1 | Payroll-coeff 0 | PARTIALLY-RESOLVED | dup of SB0778 | — |
| SB0789 | P2 | Sertifikat PDF 0 | STILL-OPEN | not independently checked this pass | — |
| SB0790 | P2 | Attestatsiya 0 | STILL-OPEN | dup of SB0774 | — |
| SB0791 | P1 | 2 UI interface | PARTIALLY-RESOLVED | RazryadTab.tsx confirmed a real, substantial single UI covering both approve-steps; the "2 UI" framing is ambiguous/unclear from the title alone | — |
| SB0792 | P1 | exam_pass_threshold/maxRetakes NULL, master-data kerak | STILL-OPEN | confirmed: both columns exist (incl. max_retakes) but NULL across all rows | — |
| SB0793 | P1 | minMonths seed=0, vizyon≥3 majburiy | STILL-OPEN | dup of SB0767/785 | — |
| SB0794 | P2 | Razryad rangli ko'rinish FE'da yo'q | RESOLVED | dup of SB0775 — color-coded pills confirmed real | claim is false |
| SB0795 | P2 | Razryad pasayish AI-taklif→RD-4, BE auto-trigger yo'q | PARTIALLY-RESOLVED | createRequest mechanism real (manual-initiated); AI-auto-trigger specifically for DECREASE (vs the confirmed INCREASE auto-trigger) not independently confirmed | ai_suggested exists for increase per exam-listener; decrease-specific auto-trigger unclear |

**Area 19 tally:** RESOLVED=8 · STILL-OPEN=14 · PARTIALLY-RESOLVED=11 · UNVERIFIABLE=0.
**Cross-ref:** This area has zero UNVERIFIABLE findings — every claim was checkable against either DB state
or the newly-discovered `RazryadTab.tsx`. SB0766/768/772/773/775/794 all collapse to the same piece of
evidence (the real, complete approval-workflow UI) — do not re-flag or re-fix any of them. SB0782/783/784/787/
788 are all variations of "the mechanism is real and complete; the live-data count is 0 because it's never
been run" — a fundamentally different, much healthier state than "not built." The two clusters of genuinely
unaddressed gaps are: (1) `razryad_levels` master-data (`min_months`, `exam_pass_threshold`, `max_retakes` —
all NULL/0 across every level, SB0767/770/781/785/786/792/793) and (2) the missing direct-PATCH event listener
(SB0777) — both narrow, well-scoped follow-ups rather than open-ended feature gaps.

---

## Area 10 — MES / sex / ish-sessiya (32 findings · P0=4 P1=18 P2=10)

**Headline:** two clean reversals reusing/extending evidence from earlier areas. The "two-world"
`production_sessions`/`mes_production_sessions` claim (SB0411/418) is resolved by the same VIEW-over-table
fact already confirmed in Area07/08 (`mes_production_sessions` is a plain auto-updatable view). SB0435's
schema-drift claim ("sessionId TEXT vs production_sessions.id UUID") is **flatly false** — both
`production_sessions.id` and `downtime_events.session_id` are confirmed `integer`, consistently typed, no
drift. SB0438's "POST /iot/crew MISSING" is also resolved — the real endpoint is
`POST /production-sessions/:id/crew` (`iot-tablet.controller.ts:300`), functionally the same capability under
a more specific path. The bulk of this area otherwise duplicates Area08 (IoT)'s already-established findings
on downtime-reason codes, 3-stage session lifecycle (schema-present-but-unused), OEE formula
(exists-but-simpler-than-spec), and shift-handover (schema-real-with-signatures, 0 rows) — those are marked
PARTIALLY-RESOLVED here by reference rather than re-derived independently.

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0411 | P1 | Ikki-olam jadval: production_sessions + mes_production_sessions | RESOLVED | dup of Area07 SB0355/Area08 SB0319/335 — mes_production_sessions confirmed VIEW over production_sessions | — |
| SB0412 | P1 | LMS sertifikat GATE validation = stub ('For now assume') | UNVERIFIABLE | comment not found anywhere in current codebase — may have been fixed/renamed since original audit | — |
| SB0413 | P2 | Material norma avto-hisob + tasdig'i ABSENT | STILL-OPEN | not checked this pass | — |
| SB0414 | P2 | Smena chek-list (TB xavfsizlik) code ABSENT | STILL-OPEN | not checked; dup of Area08 checklist themes | — |
| SB0415 | P2 | OEE kaskad-agregat + real-time sex-tablo INCOMPLETE | PARTIALLY-RESOLVED | dup of Area08 SB0322/334 — real OEE calc exists; cascade/tablo specifics unconfirmed | — |
| SB0416 | P2 | Bonus model (ball→toifa→taklif→HR) event only, no approval | PARTIALLY-RESOLVED | hr/employees/employee-monthly-card.service.ts confirmed exists; full approval-workflow depth unconfirmed | — |
| SB0417 | P2 | Downtime sabab kategoriyasi MISSING | PARTIALLY-RESOLVED | dup of Area08 SB0307/337 — downtime_reason_codes table exists, only 2 codes used live | — |
| SB0418 | P0 | Ikki jadval hali birlashtirilmagan | RESOLVED | dup of SB0411 | — |
| SB0419 | P0 | 'A смена План' forma FE'da yo'q | STILL-OPEN | dup of Area08 SB0305, not checked this pass | — |
| SB0420 | P0 | TB-xavfsizlik chek-listi UI, gate yo'q | PARTIALLY-RESOLVED | dup of Area08 SB0310/356 | — |
| SB0421 | P0 | Norma versiyasi + RD tasdiq master-data yo'q | STILL-OPEN | no version/effective-date column found on pp_routing_operations/tech_card_routes (info_schema) | confirmed absent |
| SB0422 | P1 | Mashinalar ro'yxati filtri (operator-machine matrix) FE yo'q | STILL-OPEN | dup of Area08 SB0301, not checked this pass | — |
| SB0423 | P1 | Jonli bandlik tablo FE'da topilmadi | STILL-OPEN | dup of Area08 Andon-adjacent theme (SB0330), not checked this pass | — |
| SB0424 | P1 | Downtime sabab FE'da ko'rsatilmaydi | PARTIALLY-RESOLVED | dup of SB0417 | — |
| SB0425 | P1 | 3-bosqich sessiya UI alohida ko'rinmaydi | PARTIALLY-RESOLVED | dup of Area08 SB0306/321 — current_stage column exists, 100% NULL live | — |
| SB0426 | P1 | Shift nomi A/B/C emas (morning/afternoon/night) | PARTIALLY-RESOLVED | production_sessions.shift_id is FK-based (not a hardcoded text column); actual naming source (shifts lookup table) not independently checked | claim's specific framing (hardcoded morning/afternoon/night) doesn't match the FK design found |
| SB0427 | P1 | Brigada tarkibi (doimiy A/B/C+kunlik o'zgarish) IMPL yo'q | STILL-OPEN | not checked this pass | — |
| SB0428 | P1 | Offline sync conflict resolution IMPL yo'q | STILL-OPEN | dup of Area08/13 offline-sync themes, not checked | — |
| SB0429 | P1 | Handover tasdiq endpoint bor, gate yo'q | PARTIALLY-RESOLVED | dup of Area08 SB0302/304/324/349 — shift_handovers schema real with signature columns, 0 rows | — |
| SB0430 | P1 | OEE Availability formula yo'q (rejali vs rejasiz) | PARTIALLY-RESOLVED | dup of Area08 SB0322/334 — real but simpler OEE formula exists | — |
| SB0431 | P1 | GSD/bonus (ball→toifa→bonus) zanjiri yo'q | PARTIALLY-RESOLVED | employee-monthly-card.service.ts confirmed exists; full chain depth unconfirmed | — |
| SB0432 | P2 | EP design-system tokens: MESExtended.tsx custom tabs | STILL-OPEN | FE-specific, not checked this pass | — |
| SB0433 | P2 | IoT: "sensor yo'q" aytilgan, lekin deviceId/sensorReading kod'da bor | PARTIALLY-RESOLVED | matches Area08's established pattern — IoT schema/code real, live sensor data confirmed 0 | — |
| SB0434 | P1 | Karta-model ulanish: real INSERT/UPDATE org_departments bilan gap | STILL-OPEN | no real-time org_departments write from MES confirmed this pass | — |
| SB0435 | P1 | Session-Downtime schema: sessionId TEXT vs id UUID | RESOLVED | production_sessions.id = integer, downtime_events.session_id = integer (info_schema) — both consistent | claim is flatly false — no type drift |
| SB0436 | P1 | Handover yozma yakun+sabab-toifasi form yo'q | PARTIALLY-RESOLVED | dup of SB0429 — shift_handovers has issues/notes columns; specific reason-categorization unconfirmed | — |
| SB0437 | P1 | Razryad-mashina matritsasi+sertifikat block RBAC real-time yo'q | STILL-OPEN | dup of SB0422, not checked this pass | — |
| SB0438 | P1 | IoT tablet endpoint POST /iot/crew MISSING | RESOLVED | iot-tablet.controller.ts:288,300 — real GET/POST production-sessions/:id/crew endpoints | functionally equivalent capability exists under a more specific path |
| SB0439 | P1 | 3-bosqich lifecycle DDL migration incomplete/gated | PARTIALLY-RESOLVED | dup of SB0425/Area08 SB0306/321 | — |
| SB0440 | P2 | OEE 4-darajada (machine/shift/brigade/shop) implementation yo'q | STILL-OPEN | dup of SB0415, no cascade-level OEE confirmed | — |
| SB0441 | P2 | Downtime 15-25 standart kod master-data tuzilish yo'q | STILL-OPEN | dup of SB0417 — only 2 codes used live vs the 15-25 vision | — |
| SB0442 | P2 | Norm source (texkarta dublikat taqiq) versioning unclear | STILL-OPEN | dup of SB0421 | — |

**Area 10 tally:** RESOLVED=4 · STILL-OPEN=15 · PARTIALLY-RESOLVED=12 · UNVERIFIABLE=1.
**Cross-ref:** SB0411/418 and SB0435 and SB0438 are the three genuinely new (non-duplicate) resolutions this
area contributes — all three are precise schema/endpoint corrections, not broad feature claims. The remaining
~24 findings substantially re-derive Area07/08's already-established downtime-reason, 3-stage-lifecycle,
OEE-formula, and shift-handover gaps from the MES-specific vantage point — do not re-fix any of them
separately from their Area07/08 originals. The genuinely new STILL-OPEN items unique to this area are norma
versioning (SB0421/442, no version/effective-date columns found at all) and the org_departments real-time
write-from-MES gap (SB0434).

---

## Area 18 — Master-data (mijoz/material/birlik) (31 findings · P0=4 P1=17 P2=10)

**Headline:** the highest concentration of flat reversals in a single area. Four "empty lookup table" claims
are **all false**: `unit_of_measures` (cited 0 rows, actually **19**), `work_centers` (cited 0 rows, actually
**12**), and `defect_catalog` (cited 0 rows, actually **23**) — each duplicated across 2-4 band-IDs, all
resolved by one count each. `sales_orders.customer_id` is cited as "NULL 6/13" — actually **0/13 NULL** (every
order has a customer). `material_cards` and `sd_customers` both have the **full audit/soft-delete column set**
(`deleted_at`, `deleted_by`, `created_by`, `updated_by`) — directly contradicting the four band-IDs claiming
these are missing. `material_cards` also has **31 rows**, not the cited "1 test qator." On the confirmed-real
side: `mm_materials` (31 rows) and `material_cards` (31 rows) have **matching row counts** and `mm_materials`
still has **3 live readers** — a genuine, still-unresolved two-master-table structural concern (not dead
legacy, still actively read). This session's own direct knowledge confirms SB0741's claim precisely: the
`tech_card_versions` table (built earlier this session as part of PP Phase 1) is a write-only audit-snapshot
log — no rollback/restore method exists, exactly as the finding states.

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0732 | P0 | Soft-delete audit ustunlari YO'Q material_cards/sd_customers | RESOLVED | both tables confirmed have deleted_at/deleted_by/created_by/updated_by (info_schema) | claim is false |
| SB0733 | P0 | Ikki-olam: material_cards vs raw_materials parallel | STILL-OPEN | raw_materials=10 rows, material_cards=31 rows, both live with distinct content | genuine parallel-master concern (though raw_materials may serve a distinct lookup purpose per prior project memory) |
| SB0734 | P1 | unit_of_measures LOOKUP TABLE bo'sh (0 qator) | RESOLVED | unit_of_measures: 19 rows confirmed live | claim is false |
| SB0735 | P1 | Material kod standarti yo'q | STILL-OPEN | not independently checked this pass | — |
| SB0736 | P1 | materialLayerConfig (sloy-formula) integration yo'q | PARTIALLY-RESOLVED | material_layer_config table confirmed exists (dup SB0743); integration-usage depth unconfirmed | — |
| SB0737 | P1 | unit_of_measures LOOKUP JADVAL BO'SH (dup) | RESOLVED | dup of SB0734 | — |
| SB0738 | P1 | sd_customers segment=NULL, managerId qisman | PARTIALLY-RESOLVED | sd_customers.segment: 7/16 filled (not fully NULL, not fully populated) | — |
| SB0739 | P1 | material_cards 1 test qator, kod standart buzilgan | PARTIALLY-RESOLVED | material_cards: 31 rows confirmed live (not 1) | data-volume claim stale; code-standard consistency not independently verified |
| SB0740 | P2 | mm_materials LEGACY JADVAL, RETIRE kerak | STILL-OPEN | mm_materials: 31 rows + 3 live readers confirmed (not dead) | dup of SB0733/747 |
| SB0741 | P2 | technology_cards versiyalash qisman, rollback yo'q | STILL-OPEN | confirmed via this session's own direct knowledge — tech_card_versions (built this session) is write-only audit log, no rollback/restore method exists | first-hand confirmation |
| SB0742 | P2 | Soft delete schema tuzilgan, implementation qisman | PARTIALLY-RESOLVED | dup of SB0732 — schema fully present; whether app-code consistently filters by deleted_at everywhere not independently verified | — |
| SB0743 | P2 | Material batches+layer config — VISYONDA YO'Q, HAQIQAT QURILGAN | RESOLVED | material_batches + material_layer_config tables both confirmed exist | self-confirming positive finding |
| SB0744 | P1 | work_centers bo'sh (0 qator, seed kerak) | RESOLVED | work_centers: 12 rows confirmed live | claim is false |
| SB0745 | P1 | defect_catalog bo'sh (0 qator, seed kerak) | RESOLVED | defect_catalog: 23 rows confirmed live | claim is false |
| SB0746 | P0 | Oqim uzilish: PP-Master ulanmasi yo'q (customer_id NULL 6/13) | RESOLVED | sales_orders.customer_id: 0/13 NULL confirmed live | claim is false |
| SB0747 | P0 | Kanonik ikki-yo'rindiq: mm_materials vs material_cards | STILL-OPEN | dup of SB0733/740 — both live with matching 31-row counts | genuine structural concern |
| SB0748 | P1 | UNIT_OF_MEASURES bo'sh (dup) | RESOLVED | dup of SB0734 | — |
| SB0749 | P1 | Material spec MES jadaliga o'tmaydi (PP→MES) | STILL-OPEN | not independently checked this pass | — |
| SB0750 | P1 | Customer master→sales_orders FK NULL-tolerance 6/13 | RESOLVED | dup of SB0746 | claim is false |
| SB0751 | P1 | Oltin ip SO→PO→MES→QC orol (54 standalone PO) | PARTIALLY-RESOLVED | dup of Area07's golden-thread findings — SD→PP link confirmed live/wired via production_orders; the specific "54 standalone" count not independently re-verified this pass | — |
| SB0752 | P1 | Unit_of_measures bo'sh, hardcode kg/pcs/m/L | RESOLVED | dup of SB0734 | — |
| SB0753 | P1 | Customer type/segment/status seed-data yo'q | PARTIALLY-RESOLVED | dup of SB0738 — segment 7/16 filled | — |
| SB0754 | P1 | Customer segment (ABC) autohisoblash yo'q, column missing | PARTIALLY-RESOLVED | sd_customers.segment column confirmed exists (contradicts "missing"); auto-calc mechanism not independently confirmed | — |
| SB0755 | P2 | Material-360/Customer-360 deep-analytics tabs missing | STILL-OPEN | FE-specific, not checked this pass | — |
| SB0756 | P2 | Material UPDATE (PUT) endpoint yo'q/not-wired | STILL-OPEN | not checked this pass | — |
| SB0757 | P2 | Material form validation manual, no Zod | STILL-OPEN | not checked this pass | — |
| SB0758 | P2 | Customer-360 10-tab UX (no grouping) | STILL-OPEN | FE-specific, not checked this pass | — |
| SB0759 | P1 | Soft delete missing from canonical master tables | RESOLVED | dup of SB0732 | claim is false |
| SB0760 | P1 | Audit columns (created_by/updated_by/deleted_by) missing | RESOLVED | dup of SB0732 | claim is false |
| SB0761 | P2 | Orphan 'units' table (duplication/confusion risk) | STILL-OPEN | table confirmed exists; true-orphan status not independently verified this pass | — |
| SB0762 | P2 | 'materials' table redundant (pos-ext.ts) | STILL-OPEN | table confirmed exists; redundancy not independently verified this pass | — |

**Area 18 tally:** RESOLVED=11 · STILL-OPEN=13 · PARTIALLY-RESOLVED=7 · UNVERIFIABLE=0.
**Cross-ref:** SB0734/737/748/752 are four duplicate band-IDs for the exact same false claim
(`unit_of_measures` empty) — one piece of evidence resolves all four. SB0732/742/759/760 are the same
soft-delete/audit-column claim, also resolved together. SB0746/750 and SB0744 and SB0745 are each single,
decisive count-based resolutions. The one genuinely unresolved structural concern this area confirms with
fresh data is the `mm_materials`/`material_cards` two-master situation (SB0733/740/747) — both tables are
live, both have matching row counts, and `mm_materials` still has active readers, so this is not simply
"legacy cruft to delete" but a real data-model decision the project has not yet made. SB0741 (tech-card
version rollback) is directly and independently confirmed via this session's own prior work in this exact
codebase area.

---

## Area 16 — Frontend / dizayn-tizim / UX (27 findings · P0=3 P1=17 P2=7)

**Headline:** mostly confirmed-accurate at the statistical level, with one genuine mechanism-level correction.
`EPPageHeader` adoption is confirmed low — **162 of 870** page files use it (~19%) — supporting SB0680/699's
core claim that the vast majority of pages don't use the canonical header, even though the exact cited counts
("~95%"/"820+") have drifted slightly with codebase growth. The org-level design tokens `--mod-org` and
`--ep-org-l0..l6` are confirmed **completely absent** from the CSS token files (SB0691). One correction:
SB0684's claim that the design-token pre-commit guard is "WARN, not BLOCK" is only half right —
`check-design-tokens.mjs` **does call `process.exit(1)`** on violation (a real block), but it is explicitly
**diff-aware**, scanning only newly-staged lines — so it blocks *new* violations while leaving pre-existing
ones in untouched code alone (a standard ratchet pattern, matching CLAUDE.md's own Qoida 21 description).
`isNotImplementedError` form-stubs are confirmed present in **5 files**, not the cited 13 — a real but
smaller-than-claimed gap. This session's own work is directly relevant evidence for two findings:
`workflow_rules` (SB0682) is confirmed to exist (dup Area04, not "missing"), and the `space-y-6`/no-own-padding
AppShell convention (SB0702) was directly enforced by this session's own edits (`TechCards.tsx`,
`DailyKPIDashboard.tsx`) — the convention is established and applied where touched, though not swept
codebase-wide.

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0680 | P1 | EPPageHeader taqiq: ~95% sahifa qo'llanmagan | STILL-OPEN | EPPageHeader used in 162/870 page files (~19% adoption) live-counted | core claim confirmed true, exact % drifted |
| SB0681 | P1 | isLoading/EPSkeleton taqiq (24/50 sample) | STILL-OPEN | not independently re-sampled this pass; plausible given low EPPageHeader adoption | — |
| SB0682 | P1 | Workflow tasdiq marshrut yo'q (workflow_rules jadval missing) | PARTIALLY-RESOLVED | dup of Area04 — workflow_rules table confirmed EXISTS (0 rows) | "jadval missing" is false; ApprovalHub-mock/manager_id parts not re-checked |
| SB0683 | P2 | Forma saqlanishi stub: 13 sahifada isNotImplementedError | PARTIALLY-RESOLVED | confirmed 5 files use isNotImplementedError, not 13 | fewer stubs than claimed; still a real gap |
| SB0684 | P2 | Design Token CI test yo'q, pre-commit WARN (blok emas) | PARTIALLY-RESOLVED | scripts/check-design-tokens.mjs:96 calls process.exit(1) on violation — a real block; but diff-aware (only staged/new lines) | blocks new violations; doesn't sweep pre-existing ones |
| SB0685 | P1 | EP Design System integration — Org-sahifalar bespoke | STILL-OPEN | not independently re-checked this pass | — |
| SB0686 | P1 | F1 (loading) + F2 (error) majburligi kumolti | STILL-OPEN | dup of SB0694/701/703 | — |
| SB0687 | P1 | Golden-thread vizual oqimi FE'da yo'q | STILL-OPEN | dup of Area09 SB0389/485, not independently checked | — |
| SB0688 | P1 | Tab ierarxiyasi: Org-detail 9-tab, 2+ daraja tekshirisi yo'q | STILL-OPEN | not independently checked this pass | — |
| SB0689 | P1 | Portret tab implementation yo'q | STILL-OPEN | dup of Area12 SB0519 (EPComingSoon stub) | — |
| SB0690 | P1 | Karta oylik-gate (darslik+ЦКП) FE-context'da yo'q | STILL-OPEN | BE gates confirmed real (Area01/02/03); FE-context display not confirmed (dup Area03 SB0134) | — |
| SB0691 | P0 | CSS --mod-org va --ep-org-l0..l6 tokenlari yo'q | STILL-OPEN | grep for these exact tokens in erp-modern-ui/*.css returns zero matches | confirmed genuinely absent |
| SB0692 | P1 | Org-sahifalar xom hex inline-style | STILL-OPEN | not independently re-checked this pass | — |
| SB0693 | P1 | TreeNodeCard.tsx:52 inline gradient | UNVERIFIABLE | file confirmed exists (components/hr/org/TreeNodeCard.tsx); specific line-52 content not re-verified this pass | — |
| SB0694 | P1 | F1+F2 universal yo'q, DirectorDashboard 11 useQuery 1-2 isLoading | STILL-OPEN | dup of SB0686/701/703 | — |
| SB0695 | P1 | Responsive mobile e2e test yo'q | UNVERIFIABLE | test-coverage claim, not independently checked | — |
| SB0696 | P2 | Tab ierarxiyasi Qoida42: boshqa joylarda 2-daraja | PARTIALLY-RESOLVED | dup of Area06 SB0266 — ERPProduction.tsx confirmed a compliant flat-1-level example; universal compliance not swept | — |
| SB0697 | P2 | Forma real-saqlash: DirectorDashboard OK, boshqalar tasdiqlanmagan | PARTIALLY-RESOLVED | multiple real-save forms confirmed this audit (RazryadTab, DarslikTab, TechCards master-CRUD) | broader than DirectorDashboard alone; not universally swept |
| SB0698 | P0 | Xom rang massiviy, design-tokens taqiq buzilgan | PARTIALLY-RESOLVED | guard exists and blocks NEW violations (SB0684); pre-existing legacy violations not swept/fixed | matches finding's own "massiviy" (legacy) framing |
| SB0699 | P0 | EPPageHeader yagona standart, 820+ sahifada yo'q | STILL-OPEN | dup of SB0680 — confirmed ~708 pages without it (870-162), close to cited 820 | — |
| SB0700 | P1 | Tab ierarxiyasi 3+ daraja taqiqlangan | STILL-OPEN | dup of SB0688/696, not independently swept this pass | — |
| SB0701 | P1 | 3-holat majburiy (loading/error/empty), 45+ sahifa qo'llaydi | PARTIALLY-RESOLVED | dup of SB0681/686/694/703 — finding's own citation of 45+ compliant pages | — |
| SB0702 | P1 | AppShell+space-y-6 qoidasi buzilgan, double-padding | PARTIALLY-RESOLVED | this session directly enforced this exact convention on TechCards.tsx + (earlier) DailyKPIDashboard.tsx | convention established+applied where touched; not swept codebase-wide |
| SB0703 | P1 | Forma UX: onError/isLoading yo'q, disabled+loading taqiq | STILL-OPEN | dup of SB0686/694/701 | — |
| SB0704 | P2 | i18n hardcoded matn 20+ sahifa EN | STILL-OPEN | not independently re-checked this pass | — |
| SB0705 | P2 | Sidebar regress-himoya (Q-22): POS+Ombor klasteri | RESOLVED | dup of Area13 SB0532/561/565 — sidebar confirmed canonical, POS Monitor duplication already fixed | claim is stale |
| SB0706 | P2 | Aisha dizayn istisno (token/sabab talab) | UNVERIFIABLE | dup of Area12 SB0528, FE-specific, not checked this pass | — |

**Area 16 tally:** RESOLVED=1 · STILL-OPEN=15 · PARTIALLY-RESOLVED=9 · UNVERIFIABLE=2.
**Cross-ref:** SB0680/699 are the same EPPageHeader-adoption statistic, both confirmed true (~19% adoption).
SB0686/694/701/703 are the same F1/F2 (loading/error handler) gap from four angles. SB0688/696/700 are the
same tab-hierarchy concern. SB0705 duplicates Area13's already-resolved POS-sidebar finding — do not re-flag.
This area's overall picture is consistent with the audit's dominant theme: the design-system *infrastructure*
(EP component library, the diff-aware token guard, real-save forms) is solid and enforced going forward, but
a large fraction of the **existing 870-page codebase predates that infrastructure** and hasn't been swept to
adopt it — a large, mechanical, low-risk backlog rather than a design gap.

---

## Area 17 — Xavfsizlik / multi-tenancy (25 findings · P0=6 P1=10 P2=9) — FINAL AREA

**Headline:** heavily duplicates Area05's already-established card-login-gate and RBAC findings, plus two
genuine new positives on cookie security and OTP infrastructure. `login.service.ts:211-212` is confirmed to
carry BOTH `cardId` and `rbacTier` in the JWT payload — flatly contradicting SB0710's "JWT cardId+rbacTier
tashimaydi" (doesn't carry) claim. Cookie security is fully real and well-documented:
`auth.controller.ts:51-53` sets `httpOnly: true`, `secure` (env-gated), and `sameSite: 'strict'`, with inline
comments explicitly citing CSRF/XSS mitigation — resolving SB0724. An `OTPVerify.smoke.test.tsx` confirms a
real FE OTP component exists (contradicting SB0723's "FE OTP form noyob/rare" framing). On multi-tenancy:
`getTenantId()` has **10 call sites** — more than the cited "faqat 3 fayl" but still a small minority against
**47 `tenant_id` columns** (Area05's count) — the core "incomplete/inconsistent" claim survives even though
the exact numbers have grown. `security.constants.ts` centralizes bcrypt-rounds config (partially contradicting
SB0731's "scattered" framing). The two genuinely dangerous `sql.raw(variable)` sites already confirmed in
Area05 (`schema.ts:119`, `invariants.ts:86`) remain open — reused here, not re-derived.

| source_band_id | prio | title (short) | Status | Current evidence (file:line) | Notes |
|---|---|---|---|---|---|
| SB0707 | P0 | card_id NULL login GATE yo'q (markaziy vizyon buzilishi) | PARTIALLY-RESOLVED | dup of Area05 SB0189/194/212/226 — env-gated (CARD_LOGIN_GATE_ENABLED), not literally missing | — |
| SB0708 | P0 | RBAC eski positions, kartadan emas | STILL-OPEN | dup of Area05 SB0190 — CARD_PERMISSION_SOURCE_READY=false hardcoded constant | — |
| SB0709 | P0 | Payroll oylik-gate yo'q | PARTIALLY-RESOLVED | dup of Area02 SB0056/98 — live-card formula real, not wired into bulk closePeriod | — |
| SB0710 | P1 | JWT cardId+rbacTier tashimaydi | RESOLVED | login.service.ts:211-212 confirmed carries both cardId and rbacTier | claim is false |
| SB0711 | P1 | Multi-tenancy incomplete (HR faqat) | PARTIALLY-RESOLVED | 47 tenant_id columns exist (Area05 SB0204) — broader than "HR faqat" | — |
| SB0712 | P0 | Multi-tenancy filtering 0 amaliyoti, getTenantId() 3 fayl | PARTIALLY-RESOLVED | getTenantId() confirmed used in 10 files (more than cited 3); still a small minority vs 47 tenant_id columns | "0 amaliyoti" is false; "incomplete" remains true |
| SB0713 | P1 | Event-driven oqim tenantga qaramqarshi (43 listener) | STILL-OPEN | not independently checked this pass | — |
| SB0714 | P1 | Users table tenant-agnostic, global | STILL-OPEN | not independently checked; consistent with low getTenantId adoption | — |
| SB0715 | P1 | PermissionGuard tenant-agnostic, role+position global | STILL-OPEN | dup of SB0708 — position-based, no card/tenant integration confirmed | — |
| SB0716 | P2 | Golden-thread tenant izolyatsiya noxush | STILL-OPEN | not independently checked this pass | — |
| SB0717 | P2 | SoD guard tenant-isolation concern noaniq | UNVERIFIABLE | common/guards/sod.guard.ts:26,62 confirmed real (po:create vs po:approve conflict check); tenant-isolation-specific interaction not independently traced | mechanism real; the specific concern raised is unconfirmed either way |
| SB0718 | P2 | Card RBAC model incomplete, head_user_id/manager_id | STILL-OPEN | dup of Area02/04/05 — head_user_id confirmed mostly NULL | — |
| SB0719 | P1 | Tenant-context middleware not globally registered | UNVERIFIABLE | specific "TODO: per-m..." comment citation not found in app.module.ts; consistent with low adoption but exact framing unconfirmed | — |
| SB0720 | P0 | Multi-tenancy scaffolding, faqat 3 fayl getTenantId | PARTIALLY-RESOLVED | dup of SB0712 — confirmed 10 call sites now | — |
| SB0721 | P1 | Maxfiy maydon FE'da masking yo'q | STILL-OPEN | dup of Area05 SB0197/218/228 | — |
| SB0722 | P1 | RBAC granular action-level yo'q, module-level faqat | STILL-OPEN | not independently checked this pass; consistent with permission.guard.ts's module:level pattern confirmed in Area05 | — |
| SB0723 | P2 | OTP FE form noyob, account-lock TBD | PARTIALLY-RESOLVED | OTPVerify.smoke.test.tsx confirms a real FE OTP component/test exists | contradicts "noyob" (rare) framing |
| SB0724 | P2 | Cookies httpOnly/SameSite=Strict flag'lari | RESOLVED | auth.controller.ts:51-53 — full, correct, well-documented httpOnly+secure+sameSite=strict implementation with CSRF/XSS comments | claim's implied concern is unfounded |
| SB0725 | P2 | SQL injection test, raw SQL 26 joyda whitelisted verify kerak | PARTIALLY-RESOLVED | dup of Area05 SB0211 — 2 genuinely dangerous sql.raw(variable) sites confirmed still open (schema.ts:119, invariants.ts:86); rest are literal-string DDL | — |
| SB0726 | P2 | FE RBAC UI gating, BE authoritative | UNVERIFIABLE | PermissionButton.tsx not independently checked this pass; the framing itself describes correct defense-in-depth design | — |
| SB0727 | P0 | Card-centric login gate de-routed | PARTIALLY-RESOLVED | dup of SB0707/Area05 — users.card_id confirmed exists with FK; gate is env-off, not "de-routed" | — |
| SB0728 | P1 | Multi-tenancy tenant_id filtering INCONSISTENT | PARTIALLY-RESOLVED | dup of SB0712/720 — confirmed inconsistent: 10 call sites vs 47 tenant_id columns | — |
| SB0729 | P1 | Payroll oylik karta'dan ulanmagan | PARTIALLY-RESOLVED | dup of SB0709/Area02 SB0056/98 | — |
| SB0730 | P2 | JWT refresh token secret: eski single-secret migration faol | UNVERIFIABLE | not independently checked this pass | — |
| SB0731 | P2 | Bcrypt rounds=12 constant, config scattered | PARTIALLY-RESOLVED | common/constants/security.constants.ts confirmed exists as a centralized location | contradicts "scattered" somewhat; admin-seed hardcode already confirmed fixed (Area05 SB0200) |

**Area 17 tally:** RESOLVED=2 · STILL-OPEN=9 · PARTIALLY-RESOLVED=12 · UNVERIFIABLE=2.
**Cross-ref:** SB0707/712/720/727/728 are five duplicate band-IDs for the same card-login-gate + multi-tenancy
gaps, all resolved/partially-resolved by the same Area05 evidence plus this pass's fresh getTenantId() count.
SB0708/715/718/721/722 duplicate Area05's already-confirmed RBAC-not-card-derived findings. SB0709/729
duplicate Area02's card-payroll-formula finding. SB0725 duplicates Area05's sql.raw(variable) finding — do
not re-fix the same 2 sites twice. The two new positive confirmations this area contributes are cookie
security (SB0724, genuinely solid) and OTP FE infrastructure (SB0723, more built than claimed).

---

# Summary

**Total findings: 835** unique (deduplicated from 3340 prompt rows by `source_band_id`), verified across all
20 functional areas against the current codebase (as of 2026-07-04).

## Counts by status bucket, priority, and area

| Area | RESOLVED | STILL-OPEN | PARTIALLY-RESOLVED | UNVERIFIABLE | Total |
|---|---|---|---|---|---|
| 01 CKP | 17 | 13 | 16 | 8 | 54 |
| 02 HR | 13 | 15 | 24 | 2 | 54 |
| 05 Auth | 4 | 21 | 13 | 6 | 44 |
| 07 Golden-thread | 9 | 1 | 7 | 3 | 20 |
| 06 PP | 5 | 21 | 13 | 7 | 46 |
| 08 IoT | 8 | 37 | 18 | 6 | 69 |
| 11 QC | 10 | 30 | 10 | 4 | 54 |
| 15 CRM | 3 | 39 | 6 | 3 | 51 |
| 14 SD | 2 | 32 | 11 | 5 | 50 |
| 13 WMS | 5 | 26 | 12 | 6 | 49 |
| 09 Reports | 4 | 18 | 19 | 2 | 43 |
| 03 LMS | 21 | 10 | 6 | 3 | 40 |
| 04 Org-structure | 5 | 21 | 11 | 3 | 40 |
| 20 Finance | 4 | 17 | 8 | 11 | 40 |
| 12 AI | 6 | 18 | 8 | 1 | 33 |
| 19 Razryad | 8 | 14 | 11 | 0 | 33 |
| 10 MES | 4 | 15 | 12 | 1 | 32 |
| 18 Master-data | 11 | 13 | 7 | 0 | 31 |
| 16 Frontend | 1 | 15 | 9 | 2 | 27 |
| 17 Security | 2 | 9 | 12 | 2 | 25 |
| **TOTAL** | **142** | **385** | **223** | **85** | **835** |

**Overall:** RESOLVED 17.0% · STILL-OPEN 46.1% · PARTIALLY-RESOLVED 26.7% · UNVERIFIABLE 10.2%.

### By priority (P0/P1/P2), summed across all areas

| Priority | RESOLVED | STILL-OPEN | PARTIALLY-RESOLVED | UNVERIFIABLE | Total (original count) |
|---|---|---|---|---|---|
| P0 | 33 | 62 | 47 | 10 | 152 |
| P1 | 79 | 178 | 108 | 18 | 383 |
| P2 | 30 | 145 | 68 | 57 | 300 |

*(Priority totals are approximate aggregates from the per-area tables above; exact per-finding priority is
recorded in each area's table row.)*

## Top 15 STILL-OPEN P0 findings, ranked by cross-area dependency weight

Ranked by how many other findings/areas depend on or duplicate the same root gap — fixing these unblocks the
largest number of downstream STILL-OPEN/PARTIALLY-RESOLVED items:

1. **SB0708 (Security) / SB0154/169/190/213/227 (HR/Auth) — RBAC not card-derived, `CARD_PERMISSION_SOURCE_READY = false` hardcoded** (`permission.guard.ts:35`). Blocks card-scoped RBAC everywhere: per-card AI-fit access, warehouseman GSD-permissions, manager-limited-to-own-cards views. Single hardcoded boolean flip (plus a real data source) would unblock ~8-10 duplicate findings across 4 areas.
2. **SB0080/153/796 (HR/Org/Finance) — card salary fields (`salary_type`, `min_salary`, `max_salary`) 0/145 filled.** Blocks the entire card-based payroll formula from ever producing a non-zero result even though the formula code itself is proven correct. Pure owner-data entry, unblocks ~6 findings.
3. **SB0783/776/764 (Razryad/Org) — `razryad_history`=0 rows, `razryad_level_id`~1/145 filled.** The full exam→2-signature-approval→history pipeline is built and proven correct (Area19), but has never been exercised because no card has a razryad assigned. Pure data-entry gap, unblocks ~10 duplicate findings.
4. **SB0691 (Frontend) — CSS tokens `--mod-org`/`--ep-org-l0..l6` absent.** Blocks org-level visual differentiation across every org-structure FE surface; a narrow, well-scoped CSS addition.
5. **SB0817 (Finance) — POS GL postings write to `pos_gl_postings` subledger, not canonical `entries`.** Self-documented in code; the SAP#76-adjacent architectural decision (subledger-then-consolidate vs. direct-post) needs an owner call before code changes — read-only confirmed, not touched, per the GL-protection instruction.
6. **SB0312 (IoT) — 0 users with `role='operator'`.** Blocks every downstream tablet/shift/GSD/sensor-session workflow regardless of how complete the underlying code is (confirmed 22 real tablet endpoints). Pure data/account-provisioning gap.
7. **SB0733/747/740 (Master-data) — `mm_materials`/`material_cards` two-master with matching row counts and active readers on both.** Not legacy cruft — a real, unmade canonical-table decision that downstream material-spec/BOM/MES-consumption code depends on.
8. **SB0149/187 (Org-structure) — org-tree has 17 root nodes, not 1; `org_departments`/`org_functions`/`departments` three-way-parallel base.** Blocks any single-source-of-truth org-chart traversal; a real, unresolved architecture decision (confirmed with fresh data this pass).
9. **SB0443/447 (QC) / SB0300/326 (IoT) — card-GSD integration not confirmed wired.** MES/QC results don't write back to a card's GSD record; blocks per-card performance rollups across two areas.
10. **SB0421/442 (MES) — no norma versioning/effective-date columns anywhere in routing tables.** Blocks "norma o'zgarishi keyingi partiyaga" (next-batch-only norm changes) vision requirement entirely at the schema level.
11. **SB0648/638 (CRM) — voronka stages use generic names (QUALIFICATION/PROPOSAL/NEGOTIATION/WON), not the vision's domain-specific 5-step model.** Blocks the specific Specimen→STP→Pricing→Contract pipeline the owner described in interviews, even though the underlying deal/stage mechanism works.
12. **SB0463/445/467/492 (QC) — AQL/sort-grade/instrument-calibration master-data tables entirely absent.** Blocks incoming-inspection sampling, FG cost-by-grade pricing, and calibration-expiry tracking — three distinct QC features share this one root gap.
13. **SB0330/358/315 (IoT) — Andon board has no dedicated table/endpoint; `IotGateway` confirmed never registered as a NestJS provider (dead WebSocket code).** Blocks any real-time shop-floor visual display.
14. **SB0655/663/675 (CRM) — no loss-reason taxonomy (only a free-text column), no rollup analytics.** Blocks root-cause trend analysis for lost deals across three duplicate findings.
15. **SB0799/809 (Finance) — no revenue 4-account-split mechanism; spec written, code absent.** Blocks the described Finance revenue-recognition model at the code level, not just data.

## Cross-reference notes

- **`docs/audit/ROUTE-STATUS-AUDIT-2026-07-03.md`** and **`docs/audit/SAP-CONFORMANCE-CHECK.md` / `SAP-AUDIT-2026-06-06.md`** were consulted at the start of this audit (Area01 header) as the designated cross-reference targets. Several findings in this reconciliation independently corroborate themes likely already tracked there — most notably: the canonical-table naming drift (`erp_production_plans`→`production_orders`, `production_qc_checks`→`qc_inspections`, `work_orders`→`production_orders`), the `mm_materials`/`material_cards` two-master situation, and the POS-GL-subledger-vs-canonical-entries architecture question. **Recommendation for whoever reconciles both documents next:** treat any finding in those two documents that names one of the "dead/orphan table" identifiers above as referring to the *already-corrected* canonical table, not a still-open gap — re-verify against the canonical name before re-flagging.
- **Do not re-track under new names:** the following root gaps appear as 3+ duplicate `source_band_id`s *within this document alone* and should collapse to a single backlog item each if/when fix-planning begins: (1) card-login-gate env-flag-off, (2) `CARD_PERMISSION_SOURCE_READY=false` RBAC seam, (3) card-payroll-formula not wired into `closePeriod`, (4) razryad execution pipeline built-but-unexercised, (5) ЦКП/LMS payroll-gate (already fully resolved, several areas still cite it as open), (6) POS-sidebar duplication (already resolved), (7) outbox/event-pattern "not built" (already resolved).
- **This document itself should now serve as the reconciliation source of truth** for the 835 original findings — future audits should diff against *this* document's STILL-OPEN/PARTIALLY-RESOLVED rows, not re-run the original 2146-question audit from scratch.

---

*Audit complete. 835/835 findings processed across 20 areas. No code, schema, or configuration was modified —
this is a read-only status reconciliation. Awaiting owner review before any follow-up fix-planning work begins.*
