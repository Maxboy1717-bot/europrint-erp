# EXECUTOR PROMPT #11 — BUILD T2: HR / XODIMLAR (7-faktor reyting, AI-rekruter)
> ORG/KARTALAR (T1) tayyor bo'lganidan keyin HR quriladi — karta birlamchi, xodim ikkilamchi.
> Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES
You are the 🟢 **EXECUTOR**. Before writing a single line of code read:
- `CLAUDE.md` (rules A/B/1-23, Q-24..Q-45)
- `docs/agent-constitution.md`
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` (project rules A..J — these override everything)

All hard rules apply without exception:
- **Zod** validation only (class-validator banned)
- **Drizzle ORM** (raw SQL only for LATERAL/complex, with comment; `sql.raw(variable)` banned)
- **Result<T>** pattern — no `throw`/`return null`
- File ≤ 900 lines / function ≤ 150 lines
- **No fake** (Q-40/C3/C4): every form INSERT/UPDATE real DB; honest **501** over fake `{ok:true}`
- **Verify-don't-trust** (Q-29/C2): audit claims → confirm with `_audit/q.cjs` + live probe
- **Permission gate** (Q-28/I3): show `file:line` + exact change + reason → wait for owner "yes"
- **DDL = owner approval** (Q-35/H4): new table → `APPROVED:` comment required before running
- **No regressions** (Q-39/C5): previously working features must still work after your change
- **No rewrite** (C6): system is ~70% built — fix & connect; full rewrite banned
- **EP Linear Soft design** (G1/G2/Q-41): `var(--ep-*)` / `var(--mod-*)` tokens; ListPage / FormPage / DetailPage / DashboardPage templates; no new design; HR module color = purple family
- `git add <specific-file>` only (add -A banned · I6)
- Commit every step, separate commit per phase
- Report after each phase in **Uzbek (lotin)** (Q-38/I4), then wait for owner "davom"
- **Two-world check** (H4): before any new table → verify no other name exists for same concept

═══════════════════════════════════════════════════════════════
## 1. WHY / GOAL
HR is a **T2 module** — it depends on ORG/KARTALAR (T1) being clean, and feeds Payroll, Finance, LMS, and AI. Vision measure of "correct" (Q-40/C1): every feature must match the decided vision in `docs/audit/`. The measure is NOT "endpoint returns 200" — it is "does this match the owner's exact decision?".

**HR vision in one line:** Card-centric HR where the CARD defines the job, the person fills it; all salary/rating/onboarding flows from the card upward to the employee profile; AI observes and suggests — humans confirm all negative effects.

**Source documents (read all before building):**
- `docs/audit/decisions/02-hr.md` — 82 decisions (73 answered, 9 open with A-defaults)
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` → **HR section** — 9 owner overrides (these override A-defaults)
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` — project rules block
- `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` → HR/Oylik section (7-factor rating, daily-report rules, salary flow, Kassir navbat)
- `docs/audit/MUSLIMBEK-PROMT-02-ORG-BUILD-2026-06-08.md` — format reference (follow same skeleton)

**Key owner overrides from OCHIQ-JAVOBLAR (HR section — these are final):**
- **EP-HR-012** Rating threshold = CONFIGURABLE (admin panel sets A=85+ / B=70-84 / C<70)
- **EP-HR-014** Rating→bonus = system SUGGESTS bonus %, HR/manager CONFIRMS → Payroll (not automatic)
- **EP-HR-021** Referral bonus = CONFIGURABLE per position (sum/leave); paid after probation passes
- **EP-HR-037** Stat auto-link = A (formula-metric, real numbers from modules; same as ORG-113)
- **EP-HR-042** Energy saving = A (responsibility clause; no measurement yet; later IoT/meter)
- **EP-HR-047** Glossary = A (per-position term dictionary + tooltip; same as ORG-129)
- **EP-HR-057** Defect→responsible = defect entered on IoT tablet from start + checked at receiving; if found later → QC / section lead / technologist answers (NOT auto-fine; addressed accountability)
- **EP-HR-079** Safety checklist = YES + IoT tablet shows checklist BEFORE every work start; worker CONFIRMS (→ IoT/MES module owns this)
- **EP-HR-082** Downtime = Yes, linked to responsible position; AI cameras monitor every employee; negative effect ONLY after human confirmation (no auto-fine; equipment-caused stops not counted)

**Global principle (all modules):** AI observes and flags (camera, downtime, defect, low-match, late-arrival); NEGATIVE effect (fine / score drop / block / demotion) ONLY with human confirmation — never automatic.

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT existing HR implementation (READ-ONLY) — MANDATORY FIRST

The HR module is **partially built** (LeaveModule, PayrollRecord aggregate, SkillsMatrix.tsx, adaptation controller, hr-dashboard, recruitment kanban, onboarding checklist, eNPS stubs). **Do not rebuild anything.** Map what EXISTS vs what the vision NEEDS:

**What to map:**
- **DB tables:** `employees`, `hr_requests`, `node_hr_requests`, `org_node_portret`, leave/payroll tables, adaptation tables, recruitment tables — list columns + real row counts via `_audit/q.cjs`
- **BE:** list every `/api/hr/*` endpoint; mark each: REAL (hits DB, saves, returns real data) vs STUB (501/mock/echo)
- **FE pages:** list every HR page under `src/pages/`; mark: REAL (saves, round-trips) vs STUB (EPComingSoon/static)
- **Rating system:** does any 7-factor rating logic exist? Where?
- **Recruitment pipeline:** does 7-stage kanban exist? Real or stub?
- **Onboarding:** does checklist, mentor assignment, card-linking exist?
- **Attendance/tabel:** does AI-camera integration exist or is it placeholder?

**Output:** write `docs/HR-RE-AUDIT-2026-06-08.md`:
```
| Feature (EP-HR-###) | Exists? | Real/Stub | Gap | Effort |
```
Include count: tables / real endpoints / stub endpoints / real FE pages / stub FE pages.

→ **STOP. Show owner the re-audit report. Get approval before building anything.**

═══════════════════════════════════════════════════════════════
## BUILD PHASES
Each phase: permission gate → BE + FE parallel → verify (tsc 0 + DB-proof + FE persist round-trip) → DoD check → separate commit → Uzbek report → wait for owner "davom".

---

### PHASE 1 — Employee profile + card linkage (foundation)

**Cross-cutting principles:** E2 (card-centric), E6 (single truth — no two-world for employees)

**What to build / fix:**
- Employee profile = card-aggregated data: `employees` table linked to `org_functions` (cards) many-to-many via `employee_card_assignments`
- Profile fields: personal (full state-level: passport/INPS/diplom/contact/family) + work history + awards/discipline + development + learning; read-only for employee (Q-64), HR edits
- **Card → profile aggregation:** salary sum from all assigned cards (EP-HR-023, ORG-142 override); ERP role from card (RBAC, E2); GSD/ЦКП from card
- `card_id NULL` → no login, no salary (ORG-003 rule, verify in Auth guard)
- Personal cabinet ("O'zim haqimda") — EP-HR-072: employee sees own data (read-only view of profile + career-path + tabel + rating)
- Multi-card employee: stavka share 0.5+0.5=1.0 cap (ORG-066); each card shows full own salary; profile = sum of all cards

**Verify:** create employee → assign 2 cards → profile salary = card1 salary + card2 salary → re-open page → still correct (round-trip). `tsc 0`.

**DoD:** BE CRUD + Result + Zod + real DB · FE DetailPage template + loading/error + persists · docs · i18n UZ/RU · edge-cases (no card = no login/salary) · op-codes logged (EP-HR-022/023/067).

---

### PHASE 2 — Onboarding 90-day + mentor assignment

**Cross-cutting principles:** E2 (card-centric onboarding plan), E5 (approval via org-chart manager_id)

**What to build / fix:**
- Onboarding plan comes from position CARD (not per-employee): one card = one plan, everyone in that card gets same onboarding (EP-HR-002)
- 3 phases: month 1 = acquaint → month 2 = learn → month 3 = independent; each phase has milestone check (EP-HR-001)
- Milestones at 1/3/6 months: assessment + HR reminder + badge (EP-HR-001, BARCHA_JAVOBLAR Q169)
- Onboarding completion: probation auto-pass → full card binding → Payroll/ERP access unlocked (EP-HR-003); event fires on completion
- Probation result: reminder + assessment + auto-transition; manager assessment recorded (EP-HR-017)
- **Mentor assignment:** 2 mentors per employee — adaptation mentor + professional master (EP-HR-018); org-chart / position suggested + confirmed
- Mentor activity: confirms practical tasks in ERP (not paper); comment per milestone; incentive initiated by mentor + section-head + HR (EP-HR-019)
- **Control sheet (Nazorat varaqasi):** electronic checklist per instruction-band (read-confirmed + date); mentor checks + mini-test (EP-HR-043/044/045/046)
- Control sheet: start + end date; overdue → alert to manager/HR (EP-HR-044, cron)
- Case-study final task: variant + open comment → mentor/AI evaluates → affects adaptation pass (EP-HR-046)
- NDA: separate form on onboarding + mandatory signature; ethics rules signed on onboarding + annually + on change (EP-HR-041)

**Owner overrides (OCHIQ-JAVOBLAR):** EP-HR-047 glossary = per-position term dict + tooltip (linked to ORG-129). EP-HR-079 TB-checklist → IoT/MES module owns; HR only stores the "confirmed" event from IoT.

**Verify:** assign employee to card → onboarding plan auto-populates from card → mentor assigned → milestone 1 logged → re-open → persists. `tsc 0`.

**DoD:** 7 conditions · op-codes EP-HR-001/002/003/017/018/019/041/043/044/045/046.

---

### PHASE 3 — 7-Factor Rating system (CHAT-TARIXI core)

**Cross-cutting principles:** E1 (AI observes → human confirms negatives), E2 (rating feeds card-profile)

**This is the critical feature from CHAT-TARIXI — build exactly as specified:**

7 rating factors (weights CONFIGURABLE in admin panel, EP-HR-012):
1. **Norma %** — completed work vs norm (from tabel/MES)
2. **Davomat** — attendance (AI camera input, confirmed)
3. **Sifat / brak** — quality/defect rate (from QC; EP-HR-057 override: defect→responsible after human confirmation, NOT auto)
4. **Staj** — seniority (from employment start date)
5. **Intizom** — discipline (from discipline journal, EP-HR-054/055)
6. **O'zaro baho** — ONLY within service chain (who serves whom; e.g. roulette-puller rates tigel-worker) — NOT general peer review
7. **AI kunlik KPI** — daily report quality + ЦКП completion (AI analyzes)

Rating thresholds: A=85+ / B=70-84 / C<70 — **CONFIGURABLE** (EP-HR-012 owner override), stored in admin-configurable master-data table.

Rating → bonus: system **SUGGESTS** bonus % by threshold, **HR/manager confirms** → Payroll (EP-HR-014 owner override — never automatic).

**CHAT-TARIXI override (navbat):** this 7-factor rating determines **salary/advance PAYMENT ORDER** (kassir navbat). Higher rating = earlier in queue.

Rating → badge: "Oy yaxshi xodimi" — criteria auto-computed + manager confirms (EP-HR-039).

AI behavioral signals: positive actions logged to profile (EP-HR-039); typical errors catalog per card (EP-HR-038, ORG-097); discrepancy report: instruction-band ↔ real action (EP-HR-077).

**Verify:** enter attendance=100, norm=90, discipline clean → compute rating → A category → system suggests bonus → HR confirms → Payroll receives. Re-open rating page → same values. `tsc 0` + DB-proof.

**DoD:** 7 conditions · op-codes EP-HR-013/039/077/012/014.

---

### PHASE 4 — Attendance / Tabel + Discipline journal

**Cross-cutting principles:** E1 (AI flags, human confirms fines), E4 (IoT tablet = floor hub for attendance)

**Attendance / Tabel (EP-HR-049/050/051/062/068/069):**
- Tabel data source = AI camera (turniket replacement when ERP live, EP-HR-049)
- Per-employee unique work schedule; time-in-zone tracked (EP-HR-050)
- Work status catalog: worked / leave / otgul / sick / late / absent (EP-HR-062) — each maps differently to salary
- Daily report: AI asks for today's report first → then tomorrow's plan; **only non-machine workers** (machine operators use IoT); everyone from director to cleaner; **if not submitted by 16:00 → that day not counted** (CHAT-TARIXI override, EP-HR-006)
- Late arrival → auto-document (EP-HR-062, BARCHA_JAVOBLAR Q108); fine only after confirmation (E1 global principle)
- Leaving during work hours → Telegram request + reason (BARCHA_JAVOBLAR Q112)
- Norm → completion% → salary (piece-work, EP-HR-051); machine-worker invoice-PDF (how much done vs expected, EP-HR-051)
- Tabel period close (monthly): lock → idempotent transfer to Payroll → corrections only via amendment (EP-HR-069)
- Cron: period-close reminder → HR approval → Payroll trigger (EP-HR-069)

**Discipline journal (EP-HR-054/055/056):**
- Violation types catalog (severity-graded master-data, EP-HR-054); linked to inspection/AI buzilish catalog per card (ORG-097)
- Escalation chain: verbal → written → fine → dismissal (EP-HR-055); journal + staged penalty
- Reprimand: 6-month duration on profile; manager + employee sign; HR template document (BARCHA_JAVOBLAR Q189)
- Fine → salary deduction: fine = documented (reason + amount/% + confirmation) → auto salary deduction (EP-HR-056); **fine NOT recorded without approval** (BARCHA_JAVOBLAR Q108)
- Responsibility levels: material / moral / disciplinary / legal + legal-code field (EP-HR-040)
- NDA violation → separate clause (EP-HR-041)

**EP-HR-082 owner override:** downtime → linked to responsible position; AI cameras monitor all employees; negative score effect ONLY after human confirmation; equipment-caused stops (material/mold) NOT counted against employee.

**Verify:** mark employee late → system creates auto-document → manager sees + confirms fine → fine appears in Payroll deduction → re-open → still there. `tsc 0` + DB-proof.

**DoD:** 7 conditions · op-codes EP-HR-049/050/051/054/055/056/062/068/069/006.

---

### PHASE 5 — Recruitment pipeline (7-stage kanban + AI recruiter)

**Cross-cutting principles:** E1 (AI scores/selects 80%, human makes final call), E2 (card → vacancy), E5 (org-chart routing for approval)

**Pipeline (EP-HR-015/016/065):**
- Vacancy auto-created from empty card (EP-HR-065): empty card → auto-vacancy with card requirements
- 7-stage kanban (EP-HR-016): портрет→упаковка→поток→fast-process→assessment→card-assignment→amplification
- AI stages: resume → AI video (Gemini LIVE) → live manager interview
- AI recruiter: scores/filters 80% based on card requirements; final hire decision = human (EP-HR-015)
- AI CV matching: structured requirements (education/years/software/skills, EP-HR-034, ORG-106) vs resume auto-compare (soft score)
- Question bank per card-type + razryad (EP-HR-053): text/variant/answer/difficulty; AI interview uses this bank

**Org-chart routing (E5):**
- Vacancy SLA: critical 14d / medium 30d / low 60d (ORG-074 owner override)
- Vacancy aging: 0-14 green / 15-45 yellow / 45+ red + alert (ORG-072)
- Vacancy priority: 3 levels critical/medium/low (ORG-073)
- Empty card visible on org-chart (ORG-135)

**Boomerang + referral:**
- When vacancy opens → Telegram alert to previous employees matching that card (EP-HR-065, BARCHA_JAVOBLAR Q67)
- Referral: employee submits candidate → tracked → if hired → bonus triggered after probation passes (EP-HR-020)
- Referral bonus: **CONFIGURABLE** per position (sum/leave, EP-HR-021 owner override); stored in admin master-data

**Bulk import:** Excel template + errors list returned (ORG-075/076)

**Verify:** create empty card → vacancy auto-created → candidate enters pipeline stage 1 → AI scores → HR moves to stage 4 → referral bonus triggered on hire → re-open pipeline → state persists. `tsc 0` + DB-proof.

**DoD:** 7 conditions · op-codes EP-HR-015/016/020/021/034/053/065.

---

### PHASE 6 — Leave management + offboarding + HR documents

**Cross-cutting principles:** E5 (approval via org-chart manager_id), F5 (immutable signed documents)

**Leave (EP-HR-060/061/062):**
- Leave types: labor / study / maternity — balance + request → approval → tabel auto-sync; Payroll auto-calculated (existing LeaveModule — verify real or stub, fix if stub)
- Approval chain: employee → direct manager (manager_id) → org-chart vertical+horizontal auto-routing → HR; leave 24h / advance 4h (BARCHA_JAVOBLAR Q186)
- One-day leave / late arrival: Telegram request + reason template (EP-HR-062)

**Business trip / komandirovka (EP-HR-024/025):**
- Application: date/location/purpose/cost → manager approval (org-chart vertical+horizontal) → recorded
- Approved expense linked to Finance (advance/payment); items taken from warehouse visible on card, deducted from salary if lost (BARCHA_JAVOBLAR Q182/Q119)

**Employment contracts (EP-HR-058/059):**
- Contract types: fixed-term / permanent / probation / project; 30-day expiry warning (cron)
- Document list: passport/INPS/diploma/sanitary/NDA → onboarding checklist (submitted/missing) + expiry warning; all docs on ERP server, printable (BARCHA_JAVOBLAR Q46/Q77)

**Offboarding (EP-HR-063/064):**
- Exit flow: ERP access block + final settlement/payment + inventory return checklist + exit interview
- No settlement unless reason documented (BARCHA_JAVOBLAR Q187)
- Exit interview: ERP Q&A → turnover dashboard by department/position (EP-HR-064)
- Vacancy re-opens automatically from empty card (EP-HR-065)

**HR weekly digest (EP-HR-029):** cron Monday — Telegram short summary + ERP full report; HR manager 3x daily routine notifications (BARCHA_JAVOBLAR Q113/Q163)

**eNPS / satisfaction survey (EP-HR-010/011):** quarterly cycle (not annual — owner override); anonymous; Telegram auto-send + ERP dashboard analysis + AI recommendation; cycle locked on close, results stored, side-by-side trend analysis

**Career path + grade promotion (EP-HR-027/073):**
- Career path steps visible to employee (EP-HR-027); HR plans; department career ladder
- Grade promotion: attestation + case-test/leadership-test + manager approval → salary auto-changes (EP-HR-073)
- Internal job posting (EP-HR-073, BARCHA_JAVOBLAR Q168)
- Document responsible: HR creates + Director approves; role on org-chart (EP-HR-074 owner: HR creates + Director approves)
- Document versioning: full history (who/when/what); approved = immutable; on change → all holders re-sign (EP-HR-066)

**Verify:** create leave request → manager approves → tabel entry appears → salary reflects deduction. Offboarding: block ERP access → inventory return checklist → settlement. Re-open → state persists. `tsc 0`.

**DoD:** 7 conditions · op-codes EP-HR-024/025/058/059/060/061/063/064/066/073/074/029/010/011.

---

### PHASE 7 — AI integration: card-AI match report + daily report AI + HR dashboard

**Cross-cutting principles:** E1 (AI observes, human confirms negatives), E2 (card AI = per-card), E3 (AI plans/analyzes)

**Card-AI match report (EP-HR-028/070/077):**
- Each card has its own AI: compares employee real results (tabel/assessment/daily-report) against card requirements (instruction/ЦКП/statistics) → match score + text report (vision core: karta-model)
- Discrepancy report per instruction band: instruction requirement ↔ real action (matched/violated) — concrete band-level feedback (EP-HR-077)
- Cross-card AI signal (EP-HR-071): "related departments" in instruction → horizontal workflow_rules auto-link; AI-to-AI signal via gorizontal routing (ORG-7)

**Daily report AI flow (CHAT-TARIXI):**
- AI asks today's report first → then tomorrow's plan
- Next day: AI checks → PDF generated → AI analysis → manager approval (one-read-through)
- AI camera cross-checks report truth (rost-yolg'on)
- 16:00 deadline (not submitted = day not counted)

**SkillsMatrix (EP-HR-052/053):**
- Operation types catalog (name + norm + unit, master-data) — HR↔Production bridge (single source)
- Employee-operation skill matrix (who knows what + level) — existing `SkillsMatrix.tsx` extended
- Shift planning auto-suggestion based on skills (EP-HR-053)

**HR dashboard (EP-HR-029/064/072/078):**
- Director dashboard: all module metrics visible (BARCHA_JAVOBLAR Q123)
- Section-head card: personal + subordinates' aggregated result (department %)
- Employee personal cabinet: personal + docs + work history + awards/discipline + development + learning
- Turnover dashboard: by department/position; employee movement report (EP-HR-064)
- eNPS quarterly trend (EP-HR-011)
- Rating leaderboard + "Oy yaxshi xodimi" (EP-HR-039)

**Verify:** assign employee to card → AI generates match report after 1 daily report submitted → report visible in HR dashboard → manager can confirm/reject suggested bonus → Payroll receives confirmed bonus. `tsc 0` + DB-proof.

**DoD:** 7 conditions · op-codes EP-HR-028/070/071/077/052/053/072/078.

═══════════════════════════════════════════════════════════════
## DoD — Definition of Done (all 7 conditions, per phase)
1. **BE real** — CRUD + Result<T> + Zod + real DB INSERT/UPDATE/SELECT; no `{ok:true}` / echo / `[] as unknown`
2. **FE real** — EP Linear Soft token + existing template (ListPage/FormPage/DetailPage/DashboardPage); loading skeleton + error state; form saves and round-trips (kirit → saqla → qayta och → ko'rinadimi)
3. **Docs** — gap table updated; new tables in `docs/HR-RE-AUDIT-2026-06-08.md` diff section
4. **Tests** — BE unit (Result pattern, repo injection, rollback-throw) + FE smoke
5. **i18n** — all UZ + RU keys; no hardcoded Cyrillic/Latin strings in TSX
6. **Edge-cases** — no card → no login/salary enforced; duplicate doc warning; overdue cron fires; fine not applied without confirmation
7. **Automation** — each op-code logged (`level=info code=EP-HR-### ...`); cron jobs registered; AI triggers wired; Telegram notifications sent

═══════════════════════════════════════════════════════════════
## RAILS (applied every phase)
- **Permission gate per phase** — show exact files + lines + change + reason before touching anything; wait for owner "ha"
- **BE + FE parallel** — never finish BE without FE, never finish FE without BE; both done before commit
- **Verify** — `tsc 0` + DB-proof (run real query, show row count change) + FE persist round-trip (screenshot or curl proof)
- **Separate commit per phase** — `git add <specific-file>` only; commit message includes phase + op-codes
- **No regression** — run `bash scripts/run-all-reviewers.sh` after each phase; all PASS counts must not decrease
- **No rewrite** — read existing `LeaveModule`, `PayrollRecord`, `adaptation.controller.ts`, `SkillsMatrix.tsx`, `RecruitingKanban.tsx` FIRST; only fix gaps
- **Honest 501** — if DB schema not ready for a feature, return `501 NOT_IMPLEMENTED` (never fake success)
- **DDL = owner approval** — any new `CREATE TABLE` / `ALTER TABLE` → write proposed DDL → STOP → wait for `APPROVED:` comment from owner → then run
- **Report in Uzbek** after each phase: what was done, commit hash, what was skipped (defer), what is next
- **AI negative effects** — any feature where AI flags a negative (fine/score drop/block/demotion): always require human confirmation UI before applying to Payroll/profile; no auto-apply path

═══════════════════════════════════════════════════════════════
## STOP POINTS (mandatory — stop and wait for owner response)
1. **After Phase 0 RE-AUDIT** — show `docs/HR-RE-AUDIT-2026-06-08.md`; wait for "qurish boshlang" signal
2. **Before any new table / DDL** (Q-35) — propose DDL, wait for `APPROVED:` from owner
3. **Before touching canonical tables** (`employees`, `warehouse_stock`, `entries`, `sales_orders`) — confirm exact change
4. **Phase 3 (7-factor rating)** — confirm rating weight formula + navbat logic with owner before saving to Payroll
5. **Phase 5 (recruitment)** — confirm referral bonus amounts + AI scoring threshold with owner before wiring to Payroll
6. **After each phase** — show Uzbek report + commit hash → wait for "davom"

═══════════════════════════════════════════════════════════════
## 6-CROSS-CUTTING PRINCIPLES (HR-specific application)
- **E1 (AI observes → human confirms negatives):** Rating drops, fines, discipline entries, defect responsibility — all AI-flagged but human-confirmed. No auto-fine path. EP-HR-056/057/082 owner overrides explicitly require this.
- **E2 (Card-centric):** Onboarding plan, GSD/ЦКП, salary, ERP role, training, rating — all originate from the CARD. Employee profile = aggregation of cards. Card is the primary truth; employee is secondary.
- **E3 (AI plans orders):** Daily report → AI analyzes → PDF → manager reviews. Recruitment AI scores 80% of candidates. SkillsMatrix → AI suggests shift assignments. Manager confirms.
- **E4 (Operator IoT-tablet = floor hub):** TB-checklist (EP-HR-079) and defect entry (EP-HR-057) are IoT/MES module responsibilities — HR only stores the "confirmed" event + result. Do NOT build the IoT UI here; just wire the incoming events.
- **E5 (Org-chart routing):** All approvals (leave/komandirovka/document/hire/grade/offboarding) route via org-chart manager_id (vertical) + workflow_rules (horizontal). No hardcoded approver.
- **E6 (Single canonical truth):** `employees` table is the canonical. No parallel `users_hr` or `staff` table. Multi-card = `employee_card_assignments` junction. Rating = single `employee_ratings` table with 7 factor columns. Navbat = derived from rating (no separate navbat table unless owner approves).
