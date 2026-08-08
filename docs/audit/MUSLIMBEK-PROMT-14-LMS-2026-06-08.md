# EXECUTOR PROMPT #14 — BUILD T2: LMS / Ta'lim (darslik→karta→oylik-gate)
> Foundation (T1) is complete. Now build the T2 learning & certification module.
> Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES
You are the 🟢 **EXECUTOR**. Read `CLAUDE.md` + `docs/agent-constitution.md` first. All hard rules apply:

- **Code style:** Zod · Drizzle ORM · Result<T> pattern · parametrized SQL only (`sql.raw(variable)` PROHIBITED) · file ≤900/func ≤150 · constants in `business.constants.ts` (no magic numbers).
- **Quality:** no fake (Q-40/43) — every form does a REAL DB INSERT/UPDATE; honest 501 over fake; no stub `{ok:true}` / `return []`.
- **Process:** verify-don't-trust (Q-29) · permission gate before each change (Q-28) · DDL = owner approval (Q-35, `APPROVED:` comment required) · no regressions (Q-39) · `git add <specific-file>` only · commit every step · report after each phase in Uzbek (Q-38) · NO REWRITE — fix & connect (~70% may already exist).
- **Design (mandatory, Q-41/Qoida 21):** EP Linear Soft tokens (`var(--ep-*)`, `var(--mod-*)`) + existing page templates (ListPage / FormPage / DetailPage / DashboardPage / BoardPage) — no new design. LMS module color = use the existing `--mod-lms` token (or closest semantic token). Tab nesting MAX 2 levels (Q-42).
- **Architecture:** A1-A8, B1-B6, C1-C7, D1-D6, E1-E6, F1-F6, G1-G4, H1-H5, I1-I7, J1-J4 from `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md`.
- **6 cross-cutting rails (E1-E6):**
  - E1: AI observes → human confirms negative effects (block/salary-cut/demotion) — never automatic.
  - E2: Card-centric — the CARD is primary; training attaches to the card, not the employee. New employee on a card? They inherit that card's courses automatically.
  - E3: AI plans sequences/order (micro-modules, exam schedules, re-certifications) — manager only confirms.
  - E4: Operator IoT-tablet = floor hub — short micro-modules run on the shop floor tablet (POS Monitor).
  - E5: Org-chart routing — exam approvals, razryad decisions, PDF certificates all follow the Vysotskiy-7 vertical hierarchy.
  - E6: One canonical truth — no "two-world" duplicates; use existing canonical tables (`sales_orders`, `warehouse_stock`, `entries`); new table only with `APPROVED:` comment.

**Source of truth for this module (do NOT invent features — build only to the decided vision):**
- `docs/audit/decisions/12-lms.md` — 85 decisions (75 answered, 10 open → all resolved in OCHIQ-JAVOBLAR)
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` → LMS section — 4 owner overrides + 6 A-defaults (these OVERRIDE A-defaults where specified)
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` — project-wide hard rules
- `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` — card folder 6-section model (section 6 = Ta'lim → LMS)
- `docs/audit/IOT-MES-CURRENT-STATE-2026-06-08.md` — existing IoT/tablet state (LMS micro-modules run on the tablet)

═══════════════════════════════════════════════════════════════
## 1. WHY THIS MODULE / GOAL (Q-40 — the measure of "correct")

LMS is the **T2 learning gate** — it enforces the core EuroPrint principle that **an employee cannot be paid (and cannot operate a machine) until the mandatory training for their card is complete**. It is not a simple e-learning platform; it is a safety, compliance, and talent-development pipeline tied directly to the org-chart, payroll, and MES.

Vision in one sentence: **"Darslik kartaga biriktiriladi; darslik tugamasa o'sha karta oyligi yo'q."** (EP-LMS-001/002 — the entire module flows from this.)

Key owner overrides from `OCHIQ-JAVOBLAR-2026-06-08.md` → LMS section:
- **EP-LMS-009** Pass threshold = **per course-type** (TX/safety = 100%; general = 60-80%; HR configures, master-data).
- **EP-LMS-027** Training → salary gate = **YES, hard gate**: incomplete mandatory course → that card's salary is blocked (not just a warning). AI reminds if skipped.
- **EP-LMS-057** Mentor qualification = **min razryad + certificate for that card** + (optional) mentoring module.
- **EP-LMS-082** Mentor rating = **TWO-WAY**: good apprentice → mentor bonus; bad apprentice outcome → mentor minus. (Owner override: mentor is accountable for the outcome.)

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT existing LMS implementation (READ-ONLY — FIRST)

The LMS module may be partially scaffolded (e.g. `lms_*` tables were created in a prior session, stub routes may exist at `/api/lms/*`, `StubPage` routes include `/micro-modules` and `/video-progress`). **Do not rebuild what works. Map what exists vs. what the vision needs.**

**Step 0.1 — Database audit (read-only via `_audit/q.cjs`):**
- List all tables with `lms_` prefix: columns, row counts, FK constraints.
- List `kaizen_suggestions` table (EP-LMS-020) — exists? columns?
- Check `employees` / `org_functions` for any `card_training_status` or `lms_enrollment` FK.
- Check for `lms_courses`, `lms_enrollments`, `lms_modules`, `lms_test_banks`, `lms_certificates`, `lms_nazorat_varaqa`, `lms_kaizen` — columns + data.
- Verify canonical tables not touched: `warehouse_stock`, `sales_orders`, `entries`.

**Step 0.2 — Backend audit:**
- List existing LMS controllers/services/repos under `apps/api/src/modules/lms/` (or equivalent).
- For each endpoint, determine: real DB op vs. stub (`501`/`{ok:true}`/empty array).
- Check `PayrollService` / `MesService` for any existing salary-gate or MES-gate hooks referencing LMS status.

**Step 0.3 — Frontend audit:**
- Check `artifacts/erp-dashboard/src/pages/` for any LMS-related pages.
- Identify which routes in `constants.ts` point to LMS (e.g. `/lms`, `/micro-modules`, `/video-progress`, `/ai-exam`).
- Check if card folder section 6 (Ta'lim) is wired to an LMS page.

**Step 0.4 — Gap table:**
Write `docs/LMS-RE-AUDIT-2026-06-08.md` with columns:
`Feature (EP-LMS-###) | Exists? | State (real/stub/missing) | Gap | Effort (S/M/L)`

→ **STOP. Show owner the re-audit doc. Get approval before building. Do not write a single line of production code until the owner says "continue".**

═══════════════════════════════════════════════════════════════
## BUILD PHASES (each: permission gate → BE+FE parallel → verify (tsc 0 + DB-proof + FE persist round-trip) → DoD → separate commit → report in Uzbek → wait for "continue")

---

### PHASE 1 — Core data model: course/card binding + enrollment (EP-LMS-001/003/023/025/026)

**What this phase delivers:**
- `lms_courses` table: `id`, `title_uz`, `title_ru`, `course_type` (enum: `safety_tx`, `regulation`, `general`, `razryad_exam`, `onboarding`, `replication`), `is_mandatory`, `pass_threshold_pct` (int, per-type), `blocks_mes` (bool), `card_id` (FK → org_functions/cards), `layer` (enum: `company`, `department`, `card`), `version` (int), `created_at`, `updated_at`.
- `lms_course_modules` table: `id`, `course_id`, `sequence_order` (int, sequential — EP-LMS-011), `title_uz`, `title_ru`, `content_type` (enum: `text`, `video`, `pdf`, `quiz`, `exercise`), `is_required`, `created_at`.
- `lms_enrollments` table: `id`, `employee_id`, `course_id`, `card_id`, `status` (enum: `assigned`, `started`, `completed`, `overdue`, `failed` — EP-LMS-023), `enrolled_at`, `started_at`, `completed_at`, `due_date`, `assigned_by`.
- `lms_module_progress` table: `id`, `enrollment_id`, `module_id`, `confirmed_at` (timestamp — "o'qidim" + time+user), `video_progress_pct` (int — EP-LMS-024).

**Card-centric auto-assign (E2 + EP-LMS-003):**
- When an employee is linked to a card → all mandatory courses for that card are auto-enrolled with `due_date`.
- Card transfer (EP-LMS-063) → new card's courses auto-assigned; old enrollment archived.

**Owner overrides applied:**
- `pass_threshold_pct` is stored per-course (not hardcoded); TX/safety defaults to 100, general defaults to 70 (configurable by HR — EP-LMS-009).
- `is_mandatory` flag in `lms_courses` determines whether incomplete status triggers the payroll gate (EP-LMS-027).
- Layer enum: `company` (all staff), `department` (by dept), `card` (per card role) — EP-LMS-068.

**DDL:** All new tables require `APPROVED:` comment before migration is written. Show owner the DDL plan first.

**BE:**
- `LmsCoursesService` + `DrizzleLmsCoursesRepo` — CRUD with Result<T>.
- `LmsEnrollmentService` — auto-enroll on card assignment (event listener `EmployeeCardAssigned`); re-enroll on card transfer.
- Zod schemas for all DTOs.

**FE:**
- LMS course list page (ListPage template): create/edit course, set `card_id`, `is_mandatory`, `pass_threshold_pct`, `blocks_mes`, `layer`.
- Card folder section 6 "Ta'lim" tab: shows enrolled courses for the current card with status badges (EP-LMS-025).
- All forms: loading skeleton + error toast + real persist round-trip (Q-43).

**Verify (DoD gate):** `tsc 0` · create a course → assign to card → create employee on card → enrollment row appears in DB → FE shows it in card folder section 6 (round-trip proof).

**Op-codes logged:** `EP-LMS-001`, `EP-LMS-003`, `EP-LMS-023`, `EP-LMS-025`, `EP-LMS-026`.

---

### PHASE 2 — Nazorat varaqasi + 12-topic template + section gates (EP-LMS-031/032/033/034/060)

**What this phase delivers:**
This phase digitalizes the paper-based "NAZORAT VARAQASI" (kitob source) — the structured checklist every card holds.

- `lms_nazorat_varaqa` table: `id`, `enrollment_id`, `card_id`, `varaqa_type` (enum: `lavozim_yoriqnomasi`, `ishga_xos`), `version`, `created_at`.
- `lms_varaqa_topics` table: `id`, `varaqa_id`, `topic_number` (1-12), `topic_key` (enum: `maqsad`, `orgsxema`, `malaka_talablari`, `ish_joyi_vositalari`, `umumiy_vazifalar`, `lavozimga_xos_vazifalar`, `gsd_ckp`, `kop_uchraydigan_xatolar`, `muvaffaqiyatli_harakatlar`, `huquqlar`, `javobgarlik`, `statistik_korsatkichlar`), `content_uz`, `content_ru`, `confirmed_at` (timestamp — digital "o'qidim"), `confirmed_by` (employee_id).
- `lms_section_finals` table: `id`, `enrollment_id`, `section_number` (int), `passed` (bool), `score_pct`, `attempted_at`, `passed_at` — section gate: next section locked until this passes (EP-LMS-060).

**12-topic template (EP-LMS-033):** When a new course is created, the 12 topic slots are auto-generated empty; the training department fills content. Topics 7 (GSD/ЦКП), 8 (xatolar), 9 (muvaffaqiyatli harakatlar), 11 (javobgarlik), 12 (statistik ko'rsatkichlar) auto-populate from card fields (E2 principle: card is the source).

**Two-varaqa model (EP-LMS-032):** Each card has 2 varaqas: "Lavozim yo'riqnomasi" (12 universal topics) + "Ishga xos yo'riqnoma" (practical); both must be separately completed.

**Per-topic confirmation (EP-LMS-034):** Each topic has a "O'qib chiqqaningizni tasdiqlang" button → records `confirmed_at` + `confirmed_by` (timestamp + employee_id). Progress = confirmed_topics / total_topics (e.g. 7/12).

**Situation-question format (EP-LMS-035):** Each topic ends with: (A) variant selection (auto-scored) + open explanation field (AI rates first, then mentor/manager confirms — E1 principle applies to open-text scoring).

**BE:**
- `LmsNazoratVaraqaService` + repo with Result<T>.
- Auto-generate 12 topic rows when a course is created.
- Auto-populate topics 7/11/12 from `org_functions` card fields (ЦКП, javobgarlik, KPI).
- Section-final gate logic: next section locked until `lms_section_finals.passed = true`.

**FE:**
- Nazorat varaqasi page (DetailPage template): topic list with confirm button per row, progress bar (N/12), section final quiz at bottom of each section.
- Card folder section 6 shows varaqa progress alongside enrollment status.

**Verify:** Create a course → open nazorat varaqasi → confirm 3 topics → DB shows 3 `confirmed_at` timestamps → FE progress bar shows 3/12 → section final blocks until all topics confirmed (round-trip proof).

**Op-codes:** `EP-LMS-031`, `EP-LMS-032`, `EP-LMS-033`, `EP-LMS-034`, `EP-LMS-035`, `EP-LMS-060`.

---

### PHASE 3 — Test bank + exam engine + razryad exam (EP-LMS-005/008/009/015/016/041/044)

**What this phase delivers:**

- `lms_test_questions` table: `id`, `course_id`, `question_type` (enum: `variant`, `open`), `question_text_uz`, `question_text_ru`, `options` (JSONB), `correct_option`, `ai_rubric` (text — for open questions), `difficulty` (1-3), `topic_key` (FK to topic enum), `created_by`.
- `lms_test_attempts` table: `id`, `enrollment_id`, `employee_id`, `attempt_number` (int), `score_pct`, `answers` (JSONB — immutable after submit), `started_at`, `submitted_at`, `passed` (bool), `retake_allowed_after` (timestamp).
- `lms_certificates` table: `id`, `employee_id`, `course_id`, `card_id`, `certificate_number` (unique, auto-generated: `CERT-LMS-2026-NNNNN`), `razryad_level` (nullable), `issued_at`, `expires_at`, `pdf_url`, `issuer_employee_id`.

**Pass threshold (EP-LMS-009 owner override):** stored per-course as `pass_threshold_pct`. TX/safety courses default 100%; general courses HR configures (60-80%). System enforces this — not hardcoded.

**Retake logic (EP-LMS-008):** max 2 retakes (configurable master-data); after 2 fails → mandatory re-study + HR/manager intervention logged; `retake_allowed_after` enforced by backend.

**7-day deadline for regulation tests (EP-LMS-006/007):** Cron job runs daily; if `lms_enrollments.due_date` passed and `status != completed` → notify manager + HR; after 2 days more → trigger salary-gate flag (EP-LMS-002/007).

**TX gate (EP-LMS-044):** If `lms_courses.course_type = 'safety_tx'` and `blocks_mes = true` → employee cannot start a MES production session until `lms_enrollments.status = 'completed'` for that course. BE: `MesService.canStartSession(employeeId)` checks this gate; returns error with `EP-LMS-044` code if blocked.

**Razryad exam (EP-LMS-015/016/017):**
- Minimum 3-month interval between razryad exams for the same card (enforced by backend — EP-LMS-016).
- Employee requests → exam test is assigned → passes → creates an **approval request** (not automatic promotion) → HR + direct manager must approve → only then HR records razryad change + issues certificate (EP-LMS-017, E1 principle).
- `lms_razryad_exam_requests` table: `id`, `employee_id`, `card_id`, `requested_at`, `exam_attempt_id` (FK), `status` (enum: `pending_exam`, `pending_approval`, `approved`, `rejected`), `reviewer_employee_id`, `reviewed_at`, `reviewer_note`.

**Certificate auto-generation (EP-LMS-018):** On course completion (`status = completed`): auto-create `lms_certificates` row + generate PDF (course name, date, razryad, certificate number) + archive. PDF stored via existing Storage service.

**Certificate expiry (EP-LMS-019 A-default):** 1 year default; cron job 30 days before expiry → notification to employee + HR (via existing Notifications module).

**Exam question authoring (EP-LMS-079):** Training department creates questions; HR + manager approves; AI can draft questions from course content (`EP-LMS-080` — draft only, human approves). Store `approved_by` on each question.

**BE:**
- `LmsTestService` — start attempt, submit answers, auto-score variants, flag open answers for AI/mentor review, enforce retake rules.
- `LmsCertificateService` — auto-issue on completion, PDF generation hook.
- `LmsRazryadExamService` — request, 3-month interval check, approval workflow.
- Cron: `LmsDeadlineCron` (daily) — overdue check → notification → salary-gate flag.
- Cron: `LmsCertificateExpiryCron` (daily) — 30-day warning.

**FE:**
- Test-taking page: question list → submit → score result (pass/fail badge) + "qayta topshirish" button if retake allowed.
- Test question bank admin page (training department role): create/edit/approve questions.
- Certificates tab in employee profile: list with expiry dates + PDF download.
- Razryad exam request flow: "Razryad imtihoniga murojaat" button on card folder → triggers exam assignment.

**Verify:** Create a TX safety course → enroll employee → attempt test → score below threshold → fail shown → attempt 2 → pass → certificate row in DB + PDF url set → FE shows certificate → MES gate check returns 200 for that employee (round-trip proof).

**Op-codes:** `EP-LMS-005`, `EP-LMS-006`, `EP-LMS-007`, `EP-LMS-008`, `EP-LMS-009`, `EP-LMS-015`, `EP-LMS-016`, `EP-LMS-017`, `EP-LMS-018`, `EP-LMS-019`, `EP-LMS-044`.

---

### PHASE 4 — Onboarding workflow + mustaqil ishga qo'yish zanjiri (EP-LMS-030/038/039/040/041/042/043/045/067)

**What this phase delivers:**
This phase digitalizes the "Ходимни мустақил иш фаолиятига қўйиш тартиби" (kitob source — the exact sequential chain: RD-4 interview → TX → field instruction → 2-month practical → exams → written conclusion → independence order).

- `lms_onboarding_workflows` table: `id`, `employee_id`, `card_id`, `mentor_employee_id`, `rd4_manager_id`, `started_at`, `practical_end_date` (2 months after start — EP-LMS-040), `status` (enum: `rd4_interview`, `tx_instruction`, `field_instruction`, `practical_training`, `theory_exam`, `practical_exam`, `rd4_conclusion`, `order_issued`, `independent`).
- `lms_onboarding_steps` table: `id`, `workflow_id`, `step_key` (enum matching the 10 kitob steps), `responsible_employee_id`, `completed_at`, `note` (text), `document_url` (nullable) — each step records who completed it and when; next step is locked until previous is confirmed (EP-LMS-038).
- `lms_practical_exam_rubrics` table: `id`, `workflow_id`, `criterion_uz`, `score` (0-5), `examiner_note`, `evaluated_by`, `evaluated_at` — EP-LMS-062 practical exam rubric.

**RD-4 interview step (EP-LMS-039):** First onboarding step records: card assignment, mentor, training duration, probation duration. RD-4 manager is the uchastka supervisor (org-chart level EP-ORG-102).

**2-month practical timer (EP-LMS-040):** `practical_end_date = started_at + 60 days`. Cron job 7 days before → notify mentor + RD-4 manager to schedule exams.

**Two exams before independence (EP-LMS-041):** Both theory (LMS test) + practical (mentor/RD-4 rubric) must pass before the "written conclusion" step unlocks.

**RD-4 written conclusion (EP-LMS-042):** After both exams pass, RD-4 manager writes a conclusion (text field + approval action). Until this is approved, the "independence order" step is locked. (E1: human must approve — not automatic.)

**Independence order (EP-LMS-043):** After RD-4 conclusion approved → system generates an order draft (employee name, card, razryad, mentor, training period) → HR reviews and confirms → employee full salary + ERP rights activate (E2: card salary gate lifts only after this step).

**Onboarding document checklist (EP-LMS-067):** Track: ariza / buyruq / TX instruktaj / nazorat varaqasi / yozma xulosa / mustaqil ish buyrug'i — each as a file attachment or confirmation in the workflow.

**Mentor qualification gate (EP-LMS-057 owner override):** Before assigning a mentor: check `mentor.razryad >= required_razryad` AND `mentor has certificate for this card`. If not qualified: block with error + show who qualifies. HR can override with reason.

**Mentor two-way accountability (EP-LMS-082 owner override):** Mentor rating updated after apprentice's exam result. Good outcome → +N points to mentor bonus pool (HR sets N). Bad outcome → −N. This is a **proposal** to HR, not automatic payment (E1 principle — human confirms bonus/deduction).

**Backup mentor rule (EP-LMS-058 A-default):** If no qualified mentor found → escalate to direct manager (org-chart vertical) or adjacent card holder; AI covers theory via chatbot in the interim.

**BE:**
- `LmsOnboardingService` — create workflow, progress steps sequentially (lock/unlock logic), practical timer cron.
- `LmsMentorService` — qualify mentor check, two-way rating update (Result<T>).
- `LmsIndependenceOrderService` — draft generation, HR approval, salary/rights activation event.

**FE:**
- Onboarding workflow page (DetailPage template): step-by-step stepper with locked/unlocked state, responsible person per step, document attach per step.
- Mentor panel ("mening shogirdlarim") — list of apprentices with per-topic progress (EP-LMS-059).
- HR onboarding queue — pending workflows + "issue independence order" action.

**Verify:** Create onboarding workflow → complete step 1 (RD-4) → step 2 unlocks → complete TX instruction step → confirm field instruction → 2-month timer visible → both exams pass → RD-4 conclusion submitted → independence order draft generated in DB → HR approves → employee salary gate flag cleared (round-trip proof chain).

**Op-codes:** `EP-LMS-030`, `EP-LMS-038`, `EP-LMS-039`, `EP-LMS-040`, `EP-LMS-041`, `EP-LMS-042`, `EP-LMS-043`, `EP-LMS-045`, `EP-LMS-057`, `EP-LMS-058`, `EP-LMS-067`, `EP-LMS-082`.

---

### PHASE 5 — Payroll gate + MES gate + salary-block event (EP-LMS-002/004/027/070/084)

**What this phase delivers:**
This is the most critical integration phase — it wires LMS completion status into Payroll and MES as hard gates.

**Payroll gate (EP-LMS-002/027 — owner override: HARD BLOCK):**
- `lms_salary_blocks` table: `id`, `employee_id`, `card_id`, `course_id`, `reason` (text), `blocked_at`, `unblocked_at` (nullable), `unblocked_by`.
- When a mandatory course enrollment becomes `overdue` or `failed` AND `lms_courses.is_mandatory = true`: create a `lms_salary_blocks` row for that card.
- `PayrollService.computeCardSalary(cardId, employeeId)` must check `lms_salary_blocks` — if active block exists → salary = 0 for that card; log `EP-LMS-002` with block reason.
- Block lifts automatically when enrollment status becomes `completed`; `unblocked_at` + `unblocked_by` recorded.
- CRITICAL (E1): the BLOCK is automatic (status-driven), but the notification to HR must be sent with 3-day advance warning. A "grace period" cron sends warning at T-3 days (EP-LMS-007 escalation chain): day 1 → warning to employee; day 3 → HR + manager alert; day 7 → block activates.

**MES gate (EP-LMS-004):**
- Existing `blocks_mes = true` column in `lms_courses` is the flag.
- `MesProductionSessionService.canEmployeeStart(employeeId, cardId)` → query: any `lms_enrollments` where `employee_id = X AND card_id = Y AND lms_courses.blocks_mes = true AND status != 'completed'`? If yes → return `err` with `EP-LMS-004` code.
- Frontend shows a clear "Kurs tugallanmagan — MES blokli" error with course name + link to enroll.

**"Material to'liq o'zlashtirish" (EP-LMS-070 — 3-condition completion):**
A course is only marked `completed` when ALL three conditions are met:
1. Theory test `score_pct >= pass_threshold_pct` (from `lms_test_attempts`).
2. Practical exam passed (from `lms_practical_exam_rubrics` or mentor confirmation).
3. All topics in nazorat varaqasi `confirmed_at IS NOT NULL` (100% topic confirms).

Any one missing → status stays `started`, not `completed`. Backend enforces this in `LmsEnrollmentService.checkCompletion()`.

**Multi-card employee (EP-LMS-084):** If employee holds multiple cards, primary card's salary gate is evaluated first (highest weight card). Each card is independently evaluated. FE shows per-card training status in employee profile.

**BE:**
- `LmsPayrollGateService` — block/unblock logic, integrates with PayrollService.
- `LmsMesGateService` — canStart check, integrates with MesService.
- `LmsCompletionService` — 3-condition checker, updates enrollment status.
- Cron: `LmsSalaryBlockCron` (daily) — advance warnings T-3/T-0.

**FE:**
- Payroll module: show `lms_salary_blocks` warning banner on employee payroll record if block active.
- Employee profile: per-card training completion % and block status.
- MES start session: display LMS block error with course link.

**Verify:** Enroll employee in mandatory TX course → mark enrollment overdue → check PayrollService returns 0 for that card → complete course → block lifted → salary restores → MES canStart returns true (DB-proof each step).

**Op-codes:** `EP-LMS-002`, `EP-LMS-004`, `EP-LMS-027`, `EP-LMS-070`, `EP-LMS-084`.

---

### PHASE 6 — Kaizen + regulation tests + version-change re-study (EP-LMS-005/020/021/022/028/065/073/074)

**What this phase delivers:**

**Kaizen module (EP-LMS-020/021/022):**
- `kaizen_suggestions` table may already exist (check in Phase 0). If exists: add missing columns. If not: `id`, `employee_id`, `card_id`, `title`, `description`, `status` (enum: `new`, `under_review`, `accepted`, `rejected`, `implemented`), `response_text`, `responded_by`, `responded_at`, `pdca_plan` (text), `pdca_do` (text), `pdca_check` (text), `pdca_act` (text), `pdca_responsible_id`, `pdca_due_date`, `impact_measured` (bool), `bonus_proposed` (decimal), `bonus_approved_by`, `created_at`.
- Full PDCA cycle (EP-LMS-021): each accepted suggestion goes through 4 stages; responsible + deadline + outcome per stage.
- Kaizen bonus: approved suggestion → system proposes bonus (HR configures scale as master-data — EP-LMS-022); bonus proposal → HR/manager approves → goes to payroll (E1: not automatic).

**Regulation tests (EP-LMS-005/006/007/028):**
- New regulation document published → HR/director assigns which cards it applies to → auto-enroll those card's employees in a regulation test with 7-day deadline.
- Regulation tests reuse the `lms_enrollments` + `lms_test_attempts` tables with `course_type = 'regulation'`.
- 7-day deadline enforced by `LmsDeadlineCron` (already built in Phase 3).

**Version-change re-study (EP-LMS-065):**
- `lms_courses.version` tracks document version.
- When version increments → all employees currently assigned to that card receive a new enrollment for the "updated sections" only (delta re-study). New enrollment with shorter deadline (3 days default, configurable).
- `lms_course_versions` table: `id`, `course_id`, `version_number`, `changed_sections` (JSONB — array of topic_keys), `changed_by`, `changed_at`.

**Org policy documents (EP-LMS-073):**
- `lms_policy_assignments` table: `id`, `document_id` (FK to CC/document module), `target_type` (enum: `all_staff`, `department`, `card`), `target_id`, `test_required` (bool), `created_at`.
- Org policy published → auto-enroll targeted employees in read+confirm (or test if `test_required`).

**Confidentiality module (EP-LMS-074):**
- Mandatory `course_type = 'confidentiality'` course. Required for ALL employees on first onboarding. Completion recorded as a NDA-equivalent record (`lms_nda_records` — `id`, `employee_id`, `confirmed_at`, `ip_address`).

**BE:**
- `LmsKaizenService` — CRUD + PDCA + bonus proposal.
- `LmsRegulationService` — new regulation → auto-enroll by card.
- `LmsCourseVersionService` — version bump → delta re-enrollment.

**FE:**
- Kaizen board page (BoardPage template): kanban by status (new/review/accepted/rejected/implemented); PDCA form on accepted items.
- Regulation test list: HR view + deadline countdown badges.
- Course version history tab (DetailPage within course).

**Verify:** Create a kaizen suggestion → accept it → open PDCA form → complete all 4 stages → bonus proposal created in DB → HR approves → payroll record updated. For regulation: publish regulation → employees with matching card auto-enrolled → DB shows new enrollment rows (round-trip proof).

**Op-codes:** `EP-LMS-005`, `EP-LMS-020`, `EP-LMS-021`, `EP-LMS-022`, `EP-LMS-028`, `EP-LMS-065`, `EP-LMS-073`, `EP-LMS-074`.

---

### PHASE 7 — Dashboard + AI features + PDF export + Telegram (EP-LMS-013/014/029/064/069/080)

**What this phase delivers:**

**LMS dashboard (EP-LMS-029):**
- Per-department / per-card completion % (aggregate query).
- Overdue list with days-overdue, card, employee, course.
- HR mini-widget: "X majburiy kurs tugallanmagan" (EP-LMS-029 SHvB spec).
- AI analysis panel: who is falling behind, which courses have highest failure rate, recommended actions (AI generates → displayed as suggestions, not automatic actions — E1).

**AI chatbot O&A (EP-LMS-014/081):**
- "Savol berish" button on each topic page → sends question to AI (Gemini API per A8) → AI answers using course content + glossary.
- If AI confidence < threshold → escalate to mentor (notification via existing Notifications module).
- AI chatbot also available as a Telegram bot command for operators who don't have desktop access (E4 principle, EP-LMS-069).

**AI course draft generation (EP-LMS-080):**
- HR uploads a regulation/instruction document → AI generates draft: 12 topic outlines + glossary terms + 5 test questions per topic.
- Draft stored as `lms_ai_drafts` (id, source_doc_url, generated_content JSONB, status: draft/approved, approved_by). Human reviews + approves before publishing.

**PDF nazorat varaqasi export (EP-LMS-064):**
- "PDF yuklab olish" button on completed nazorat varaqasi → generate PDF: employee name, org, dates, 12 topic confirms + exam result, certificate number.
- Use existing PDF generation utility (check if PDFService/pdfkit exists; reuse, don't rewrite — C6).

**Telegram notifications (EP-LMS-069):**
- Reuse existing Telegram bot infrastructure (per A8/NTF module).
- Events to send: course assigned (with link), deadline T-3 warning, exam result, certificate issued, salary block warning.
- Operators receive short micro-module notifications on the shop floor (E4).

**Video progress tracking (EP-LMS-024):**
- `/api/lms/video-progress` endpoint: POST `{enrollment_id, module_id, progress_pct}` → update `lms_module_progress.video_progress_pct`.
- Module marked complete only when `video_progress_pct >= 95` (configurable).
- FE: video player reports progress every 10 seconds via debounced POST.

**Glossary (EP-LMS-037):**
- `lms_glossary_terms` table: `id`, `course_id`, `term_uz`, `term_ru`, `definition_uz`, `definition_ru`.
- FE: term appears in topic text → hover/tap → tooltip shows definition.
- AI chatbot uses glossary as knowledge base for Q&A.

**BE:**
- `LmsDashboardService` — aggregate queries, completion %, overdue list.
- `LmsAiService` — chatbot Q&A wrapper (Gemini), draft generation, PDF trigger.
- `LmsVideoProgressService` — update + gate check.
- `LmsGlossaryService` — CRUD + lookup.

**FE:**
- LMS dashboard page (DashboardPage template): completion charts, overdue table, AI insight panel.
- Glossary management page (HR role).
- Video progress UI: progress bar on video module, auto-report to backend.

**Verify:** Complete a course → click PDF export → PDF file generated with correct data + certificate number → download works. AI chatbot: ask a question on a topic → response appears within 5 seconds → no crash (round-trip + functional proof).

**Op-codes:** `EP-LMS-013`, `EP-LMS-014`, `EP-LMS-024`, `EP-LMS-029`, `EP-LMS-037`, `EP-LMS-064`, `EP-LMS-069`, `EP-LMS-080`, `EP-LMS-081`.

═══════════════════════════════════════════════════════════════
## DoD — Definition of Done (all 7 conditions per phase, per ERP-SIFAT-STANDARTLARI)

1. **BE real:** every endpoint does real CRUD + Result<T> + Zod validation + actual DB row (no `{ok:true}` / empty-array stubs).
2. **FE real:** EP Linear Soft design tokens + existing page templates; loading skeleton on every `useQuery`; `onError` handler on every `useMutation`; form saves → reopen → data visible (Q-43 round-trip).
3. **Docs:** each phase appends to `docs/LMS-BUILD-LOG.md` (what was built, which EP-LMS-### codes, what was deferred).
4. **Tests:** BE unit tests for salary-gate + MES-gate + 3-condition completion logic; FE smoke test for enrollment create → complete flow.
5. **i18n:** all new UI strings in both UZ + RU translation files (no hardcoded Uzbek text in TSX).
6. **Edge cases handled:** employee has no card → no enrollment; course deleted with active enrollments → soft-delete + warning; exam attempt after max retakes → blocked with clear message; certificate expiry on day 0 → immediate notification.
7. **Automation:** every scheduled job (deadline cron, expiry cron, salary-block cron) has a real cron schedule entry + test mode trigger; every gate (payroll, MES) returns the correct EP-LMS-### op-code in the error payload.

Each operation logs its **EP-LMS-### op-code** at `level=info` (LOYIHA-QOIDALARI §J).

═══════════════════════════════════════════════════════════════
## RAILS (apply to every phase)

- **Permission gate (Q-28):** Before writing any file — state `file:line`, exact change, reason → wait for "ha".
- **Verify-don't-trust (Q-29):** Every audit claim about existing tables/endpoints must be confirmed with `_audit/q.cjs` or a live probe — not assumed.
- **Separate commit per phase:** `git add <specific-files>` only; never `git add -A`; commit message includes phase number + EP-LMS-### codes touched.
- **No regressions (Q-39):** After each phase run `tsc 0` + existing reviewer scripts; if any pre-existing test breaks → fix before proceeding.
- **No rewrite (C6):** If `kaizen_suggestions` already exists, ALTER not DROP+CREATE. If `LmsService` stub exists, extend it.
- **Honest 501 (C3):** Any feature not yet built in a phase returns `HttpStatus.NOT_IMPLEMENTED` — never fake data.
- **DDL = owner approval (Q-35):** Every new `CREATE TABLE` / `ALTER TABLE` must have `-- APPROVED: <owner confirmation>` comment in the migration file. Show DDL plan to owner first.
- **Report in Uzbek (Q-38):** After each phase, write a Uzbek-language status report (nima qilindi / nimalar deferred / commit hash / tsc holati) and present it to the owner before proceeding.
- **AI observe → human confirm (E1):** Salary block activates by status change (automatic), but requires 3-day advance warning. Mentor rating delta is a proposal, not direct payroll write.
- **Card-centric (E2):** Training data belongs to the card. If a feature tries to attach a course directly to an employee without a card reference — reject and redesign.
- **IoT-tablet micro-modules (E4):** Micro-module pages must be mobile-responsive (phone + tablet); short content that fits a 5-minute break. Test at narrow viewport.

═══════════════════════════════════════════════════════════════
## STOP POINTS (mandatory pause — ask owner before continuing)

1. **After Phase 0 RE-AUDIT** — present `docs/LMS-RE-AUDIT-2026-06-08.md` to owner. Get explicit "continue" before writing a single line of production code.
2. **Before any DDL** — show CREATE/ALTER TABLE statements + migration file plan → owner approves with "ha, DDL tasdiqlandi".
3. **Before Phase 5 (payroll gate)** — confirm the exact salary-block logic with owner: "3-kun oldindan ogohlantirish, keyin blok" — get written confirmation before integrating with PayrollService.
4. **Before modifying canonical tables** — `warehouse_stock`, `sales_orders`, `entries`, `payroll_calculations`, `employees` — ask owner explicitly; these are T1 foundation tables.
5. **After each phase** — show Uzbek-language report with: done items / deferred items / commit hash / `tsc 0` status → wait for "davom" before starting the next phase.
