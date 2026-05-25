# HR Module — Full Audit (2026-05-16)

> Comprehensive audit of the EuroPrint ERP HR module across three axes: **architecture rules**, **DDD maturity**, and **frontend integration**. Performed against the 22-rule reviewer suite (`bash scripts/run-all-reviewers.sh`) and CLAUDE.md conventions.

## Scope

| Layer | Files | Sub-domains |
|---|---:|---:|
| Backend (`apps/api/src/modules/hr/`) | 230 | 26+ |
| Frontend (`artifacts/erp-dashboard/src/pages/HR*` + `hr-dashboard/` + `employee-profile/`) | 91+ | — |
| Tests (`apps/api/test/hr/`) | 43 | — |

**Sub-domains (backend):** ai-interview-v2, analytics, application (compatibility), attendance, career-path, common, daily-report, discipline-v2, document-workflow, domain, employees, enps, events, gamification, infrastructure, inspection, leave, offboarding, onboarding, payroll, pip, presentation, reception, recruitment, safety, shift, skills-matrix, telegram-bots.

---

## Executive Verdict

| Axis | Grade | One-line |
|---|:---:|---|
| Architecture rules | **B** | Strong on security/typing. One Rule 16 violation, several controllers leak business logic. |
| DDD maturity | **C-** | 3 aggregates exist; 23+ sub-domains procedural. LeaveRequest is anemic. |
| Frontend pages | **A-** | 45 real routes, no stubs. F1/F2/F3 ≈100%. 6 oversize pages. |

**Production-safety:** safe. **Long-term maintainability:** needs sprint-2/3 effort on DDD + file-splitting.

---

## 1 · Backend Architecture Rules (22 reviewers, HR-scoped)

### 1.1 Pass/Fail snapshot

Live aggregator state (HR slice of `bash scripts/run-all-reviewers.sh`, today):

| Rule | Status | HR-specific evidence |
|---|:---:|---|
| 1 — Result<T> | ✅ PASS | Repos/services return `Promise<Result<T>>` consistently. 4 helper exceptions noted below. |
| 2 — Array.isArray | ✅ PASS | Verified via reviewer (PASS=1276 total). |
| 3 — Zod validation | ✅ PASS | 33/35 HR controllers use Zod on `@Body()`. |
| 4 — No raw SQL | ✅ PASS | Zero `sql.raw(variable)` in HR. |
| 5 — No `as unknown` stubs | ✅ PASS | None. |
| 6 — Controller transport-only | ⚠️ **5-7 leaks** | See §1.3. |
| 7 — `ConfigService` only | ✅ PASS (minor) | 1 direct `process.env` in `inspection.service.ts:27`. |
| 8 — `@UseGuards(JwtAuthGuard)` | ✅ PASS | All 35 HR controllers covered. |
| 9 — try/catch on DB | ✅ PASS | Repository methods uniformly wrap in `safeCall`/`try`. |
| 10 — Repository layer only | ✅ PASS | No service calls `db.*` directly. |
| 11 — No circular deps | ✅ PASS (assumed) | madge run in CI. |
| 12 — No magic numbers | ✅ PASS (some smells) | KPI weights still inline in `employee-kpi.handler.ts:94`. |
| 13 — No `!` assertions | ⚠️ 3 in HR | `face-recognition.service.ts`, `learning-bot.service.ts` (already in CLAUDE.md). |
| 14 — No `console.log` | ✅ PASS | All via `Logger`. |
| 15 — No sensitive logs | ✅ PASS | No password/token/jwt in HR logger statements. |
| 16 — File ≤ 300 lines | ❌ **FAIL × 1** | `hr-vacancies-pipeline.controller.ts` — 310 lines. |
| 17 — Function ≤ 30 lines | ⚠️ 5 long fns | `learning-bot.onProgressCompleted` ≈65, `recruitment-bot.publishVacancy` ≈55. |
| 18 — No `any` | ✅ PASS | 0 in HR. |
| 22 — Tests required | ✅ PASS | 43 HR spec files + `hr-exhaustive.spec.ts` domain coverage. |

### 1.2 Verified hot files (line-count, descending)

```
310  apps/api/src/modules/hr/recruitment/hr-vacancies-pipeline.controller.ts   ← Rule 16 FAIL
292  apps/api/src/modules/hr/attendance/face-recognition.service.ts            ← approaching
292  apps/api/src/modules/hr/application/hr-compat-safety.repository.ts        ← approaching
292  apps/api/src/modules/hr/ai-interview-v2/ai-interview-v2.gateway.ts        ← approaching
291  apps/api/src/modules/hr/telegram-bots/learning-bot.service.ts             ← approaching
289  apps/api/src/modules/hr/application/hr-dashboard.repository.ts
288  apps/api/src/modules/hr/application/hr-compat-a.repository.ts
287  apps/api/src/modules/hr/inspection/inspection.repository.ts
281  apps/api/src/modules/hr/attendance/late-arrival.service.ts
279  apps/api/src/modules/hr/shift/shift.repository.ts
```

Only **1 file actually exceeds the 300-line bar**; the rest are "approaching" — to be tracked, not yet violating.

### 1.3 Rule 6 (controller business logic) — 5–7 leaks

Controllers that contain `.map / .filter / .reduce / Date arithmetic / cumulative score` chains (rather than pure delegation):

| Controller | Lines | Evidence |
|---|---|---|
| `hr-dashboard-extra.controller.ts:24-58` | risk-score `filter`+`map` | risk-bucket count + color binding |
| `hr-vacancies-pipeline.controller.ts:86-240` | funnel stage mapping + percentage calc | move to `HrVacanciesService.getPipeline()` |
| `ai-interview-v2.controller.ts:112-117` | `body.answers?.length` scoring | move to handler |
| `hr-compat-a.controller.ts:30-45` | data transformation chains | move to compat service |
| `hr-compat-safety.controller.ts:15-55` | safety data normalization | move to compat service |
| `hr-employees.controller.ts:18-42` | employee filter + projection | move to `EmployeesQueryService` |
| `hr-dashboard-stubs.controller.ts:23-60` | stub objects directly returned | replace with `HttpStatus.NOT_IMPLEMENTED` |

### 1.4 Result-pattern stragglers (Rule 1)

```
face-recognition.service.ts:121,266,267,269   _validateEmbedding(): number[] | null
boomerang-embedding.service.ts:64,79          returns null on error
inspection.service.ts:271                     null instead of Result<null>
notification-bot.service.ts:198               returns undefined
```

Effort: ≈1–2 h to wrap each in `Result<T>` and update call sites.

### 1.5 Stub / fake-response inventory

All current stub endpoints in HR (none of them silently fake DB writes — they're explicit placeholders):

```
hr-dashboard-stubs.controller.ts:25,30,46,51,56   { adaptation: null }, { items: [], total: 0 }
hr-dashboard-stubs.controller.ts:36               return {}
telegram-bots.controller.ts:65,76,87              return {}
ai-interview-v2.controller.ts:117                 return {}
hr-dashboard-extra.controller.ts:108              return {}
territory.gateway.ts:128                          return {}
```

**Recommendation:** replace each with `throw new HttpException('Not implemented', HttpStatus.NOT_IMPLEMENTED)` so the FE doesn't treat empty responses as "no data".

---

## 2 · DDD Maturity

### 2.1 Existing aggregates (3 files)

| Aggregate | Lines | Public mutable fields | Methods | Result<void> on transitions | Domain events | Grade |
|---|---:|---:|---:|:---:|:---:|:---:|
| `employee.aggregate.ts` | 169 | 0 (private props) | 7 | n/a (queries) | ✅ `SalaryCalculatedEvent` | **B+** |
| `attendance.aggregate.ts` | 94 | 0 (private props) | 5 | n/a (simple setters) | ✅ `AttendanceRecordedEvent` | **B** |
| `leave-request.aggregate.ts` | 99 | **6** (status, approvedBy, approvedAt, rejectedBy, rejectionReason, updatedAt) | 4 | ❌ throws | ❌ none | **D-** |

`leave-request.aggregate.ts` is the **single worst aggregate** in the HR module — public mutables, throws instead of `Result<void>`, no events, no factory, no VOs. It's the highest-leverage refactor target.

### 2.2 Sub-domain DDD maturity map

A = aggregate + VOs + events + repo iface · B = aggregate + repo iface · C = service + repo iface, no aggregate · D = service only · F = procedural/coupled.

| Sub-domain | Aggregate? | VOs? | Events? | Repo iface? | Grade | Recommendation |
|---|:---:|:---:|:---:|:---:|:---:|---|
| employees | partial | ✅ EmployeeId/Email/Phone | — | ✅ | **C+** | Wire `Employee.fromRaw()` into `EmployeesService` read path. |
| payroll | ❌ | ❌ | ❌ | ✅ | **C** | Promote `PayrollRecord`. Add `Salary` VO + events (`SalaryIncreased`, `PayrollRunCompleted`). |
| recruitment | ❌ | ⚠ FunnelStage enum | ❌ | partial | **C-** | **Top promotion target.** Move `VALID_TRANSITIONS` into a `Funnel` aggregate. |
| leave | ✅ (anemic) | ❌ | ❌ | ✅ | **C** | **Rescue:** private props + `Result<void>` + `LeaveApprovedEvent/RejectedEvent/CancelledEvent`. |
| attendance | ✅ | — | ✅ | ✅ | **B-** | Stable — only add granular `AttendanceLateEvent` / `AttendanceAbsentEvent` for dashboards. |
| onboarding | ❌ | ❌ | ❌ | partial | **C-** | Promote `OnboardingPlan` with 6-week checkpoint state machine. |
| offboarding | ❌ | ❌ | ❌ | ❌ | **D** | Promote `OffboardingChecklist` (INITIATED → … → COMPLETED). |
| kpi | service only | ❌ | ❌ | — | **D** | Keep as domain service; optionally emit `KpiCalculated`. |
| gamification | ❌ | ❌ | ❌ | ❌ | **D** | Promote `EmployeeGamification` (badges, levels, points). |
| discipline-v2 | ❌ | ❌ | ❌ | ❌ | **D** | Promote `DisciplineRecord` (state machine: investigation → hearing → decision). |
| career-path | ❌ | ❌ | ❌ | ❌ | **D** | Promote `CareerPath` with `PromotionEarned`/`SkillAcquired`. |
| skills-matrix | ❌ | ❌ | ❌ | ❌ | **D** | Promote `SkillProfile` (0–5 levels + `SkillLevelChanged`). |
| shift | ❌ | ❌ | ❌ | ❌ | **D** | Promote `ShiftAssignment` (state lifecycle + events). |
| safety | ❌ | ❌ | ❌ | ❌ | **D** | Promote `SafetyIncident` (REPORTED → INVESTIGATED → …). |
| inspection | ❌ | ❌ | ❌ | ❌ | **D** | Promote `SafetyInspection`. |
| ai-interview-v2 | ❌ | ❌ | ❌ | ❌ | **D** | Promote `AIInterviewSession`. |
| daily-report | ❌ | ❌ | ❌ | ❌ | **D** | Promote `DailyReport` with submission/approval state. |
| enps | ❌ | ❌ | ❌ | ❌ | **D** | Promote `EmployeeNPSSurvey`. |
| pip | ❌ | ❌ | ❌ | ❌ | **D** | Promote `PIPPlan` (CREATED → ACTIVE 30/60/90 → PASSED/FAILED). |
| telegram-bots | n/a | — | — | — | **n/a** | Pure infrastructure / adapter — no aggregate needed. |
| reception | n/a | — | — | — | **n/a** | Guest check-in utility — no aggregate needed. |

### 2.3 Top 5 promotion candidates (ranked)

1. **Recruitment Funnel** — Multi-step pipeline with explicit `VALID_TRANSITIONS`. Highest invariant density.
   - Methods: `moveStage(to): Result<void>`, `reject(reason): Result<void>`, `makeOffer(money, startDate): Result<void>`, `hire(employeeId): Result<void>`.
   - Events: `CandidateMovedFunnelStage`, `CandidateRejected`, `OfferMade`, `CandidateHired`.
2. **LeaveRequest refactor** — Rescue from anemic. Same scope as 1; less new code, more rewrite.
   - Methods: `approve(approverId): Result<void>`, `reject(rejectorId, reason): Result<void>`, `cancel(): Result<void>` (all currently `void`/throw).
   - Events: `LeaveApprovedEvent`, `LeaveRejectedEvent`, `LeaveCancelledEvent`.
   - **Invariant:** `checkAnnualLeaveBalance(remaining): Result<void>` + `checkNoOverlapWithApproved(others): Result<void>` (today in handler).
3. **PayrollRecord** — Monthly run with 3 tax-rate calculations.
   - VO: `Salary { gross, inps, jshd, net }` with non-negative `net` invariant.
   - Methods: `static createFromEmployee(emp, period): Result<PayrollRecord>`, `completeRun(): Result<void>`.
   - Events: `SalaryIncreased`, `SalaryDecreased`, `PayrollRunCompleted`.
4. **OnboardingPlan** — 6-week state machine with weekly checkpoint pass/fail.
   - Methods: `submitWeeklyCheckpoint(week, proof): Result<void>`, `completeOnboarding(): Result<void>`, `probationCheckpoint(day, feedback): Result<void>`.
   - Events: `OnboardingStarted`, `WeeklyCheckpointPassed/Failed`, `OnboardingCompleted`, `ProbationPeriodStarted`.
5. **DisciplineRecord** — REPORTED → INVESTIGATION → HEARING → DECISION → RESOLVED.
   - Methods: `initiateInvestigation`, `scheduleHearing`, `conductHearing`, `issueDecision(outcome, justification): Result<void>`, `resolve(): Result<void>`.
   - Events: 6 lifecycle events (per state).

### 2.4 Orphan-event scan

Both existing HR domain events are wired:
- `attendance-recorded.event.ts` → emitted by `Attendance.emitAttendanceRecorded()`.
- `salary-calculated.event.ts` → emitted by `Employee.emitSalaryCalculation()`.

No orphan VOs either — `EmployeeId`, `Email`, `PhoneNumber` are all used by `Employee`.

---

## 3 · Frontend HR Pages

### 3.1 Route coverage

**45 HR-related routes** in `AppRouter.tsx`, all pointing at real components. **Zero stubs.** Examples: `/employees`, `/hr-map`, `/hr/recruiting`, `/skills-matrix`, `/hr/onboarding`, `/hr/offboarding`, `/hr/alumni`, `/hr/safety`, `/hr/gamification`, `/hr/pip`, `/hr/enps`, `/hr/documents`, `/ai-hr/dashboard`, `/ai-hr/interviews`, etc.

### 3.2 F1/F2/F3 compliance

| Rule | Compliance | Notes |
|---|:---:|---|
| F1 — `isLoading` skeleton on every `useQuery` | ~95% | All 27 sampled files have it. Only `HRAssetManagement.tsx` uses imperative callback fetches. |
| F2 — `onError` on every `useMutation` | 100% | All 19 sampled files include `onError` + toast. |
| F3 — `apiRequest(method, url, body?)` signature | 100% | Zero wrong-signature calls across 40+ samples. |

### 3.3 `any` usage / array safety / delete confirmation

- **`any`**: 0 occurrences in HR pages.
- **`Array.isArray()` guards**: pervasive. Pattern seen in `HRSafety.tsx:56-77`, `HRDashboardSections.tsx:52`, `HRCapitalTests.tsx:81-82`.
- **Delete confirmation**: all 3 destructive mutations (HRCapitalTests, HRSafety, HRExtended) gated by `ConfirmDialog`.

### 3.4 Oversize page files (>300 lines)

| File | Lines | Suggested split |
|---|---:|---|
| `HROnboarding.tsx` | **438** | Sections + Dialogs + Types |
| `HRZnoPage.tsx` | 352 | Sections + Helpers |
| `HRCareerPath.tsx` | 339 | Sections + Dialogs |
| `HRCapitalCourses.tsx` | 321 | Sections + Dialogs |
| `HRHealthMonitoring.tsx` | 318 | Sections + Dialogs |
| `HRAlumni.tsx` | 315 | Sections |
| `HRExtended.tsx` | 308 | Monitor |

### 3.5 Smoke-test coverage

22 HR pages have `.smoke.test.tsx`. Missing tests for ≈23 secondary pages: `Discipline.tsx`, `SkillsMatrix.tsx`, `Mentorship.tsx`, `EventsCalendar.tsx`, `Applications.tsx`, `Questionnaire.tsx`, `ShiftSchedule.tsx`, `HRSuccessionPlanning.tsx` (already covered), `ReferralPage.tsx`, `MilestonePage.tsx`, `BirthdayWidget.tsx`, `ENPSPage.tsx`, `PIPPage.tsx`, `DailyReportPage.tsx`, `ReceptionPage.tsx`, `WeeklyPlanPage.tsx`, `InspectionPage.tsx`, `AIInterviewPage.tsx`, etc.

### 3.6 i18n parity

- `locales/uz/hr.json`: 643 keys
- `locales/ru/hr.json`: 674 keys
- Δ: **+31 keys** on the RU side (newer AI/risk/safety features). Confirm whether the UZ counterparts are intentionally missing or owed.

Hardcoded-Cyrillic / hardcoded-Latin strings still in JSX (low severity — mostly labels):

```
HRDashboardTabs.tsx              ~8
HRDashboardMockup.tsx            ~12   (mockup file — candidate for fixture extraction)
agents/HRPerformanceDashboard    ~10
HRBrandPageTabsB.tsx             ~7
HROnboarding.tsx                 ~6
HRMap.tsx, HRMapDialogs.tsx      ~9
HRLMSSkills.tsx                  ~5
HRSuccessionPlanningSections    ~4
HROffboardingDialogs.tsx         ~4
HRBrandPage.tsx                  ~3
```

---

## 4 · Prioritized Remediation Backlog

### Tier 1 — Sprint 2 (critical; ≈18 h) — ✅ CLOSED (2026-05-17)

All 8 Tier-1 items landed across `b9f12d05` (prior work) and `62c5c94e` (Tier-1 follow-up closeout). Status keys: ✅ DONE.

| # | Task | Status | Files | Evidence |
|---|---|:---:|---|---|
| H.1 | Split `hr-vacancies-pipeline.controller.ts` (310 lines) — extract pipeline mapping into `HrVacanciesService`; close Rule 16 + Rule 6 together | ✅ DONE | `recruitment/hr-vacancies-pipeline.controller.ts` 386 → 245 + `HrVacanciesProbationController` (117) + `HrVacanciesAnalyticsController` (97); wired in `hr.module.ts` | `62c5c94e` |
| H.2 | Rescue `LeaveRequest` aggregate: private props + `Result<void>` + 3 events | ✅ DONE | `domain/aggregates/leave-request.aggregate.ts` + handlers | `b9f12d05` |
| H.3 | Add 3 `leave-*.event.ts` files extending `DomainEvent`; wire emission + listeners | ✅ DONE | `domain/events/` | `b9f12d05` |
| H.4 | Move 5–7 controller `.map`/`.filter` chains into services (Rule 6) | ✅ DONE | `hr-dashboard-extra.controller.ts` (5 chains → `HrDashboardExtraService`); `ai-interview-v2.controller.ts` (transcript template + `answers.map(...).join()` → `AiInterviewV2Service.submitPublicAnswers`); other controllers covered in `b9f12d05` | `62c5c94e`, `b9f12d05` |
| H.5 | Replace stub `return {}` / `return { items: [], total: 0 }` with `HttpException(NOT_IMPLEMENTED)` | ✅ DONE | `hr-dashboard-stubs.controller.ts`, `telegram-bots.controller.ts`, `territory.gateway.ts`, `ai-interview-v2.controller.ts` | `b9f12d05`; Wave 11 cataloged remaining stubs (`4814ea7b`) |
| H.6 | Wrap `face-recognition._validateEmbedding`, `boomerang-embedding.embed`, `inspection.service` null-returns in `Result<T>` | ✅ DONE | 4 service files | `b9f12d05` |
| H.7 | Move `inspection.service.ts:27` `ROOM_AI_SERVICE_URL` to `ConfigService` (Rule 7) | ✅ DONE | `inspection.service.ts` | `b9f12d05` |
| H.8 | Inline KPI weight constants from `employee-kpi.handler.ts:94` into `business.constants.ts` (Rule 12) | ✅ DONE | `employee-kpi.handler.ts`, `business.constants.ts` | `b9f12d05` |

Tier-1 grade impact: Backend `B → B+` · DDD `C- → C+` (LeaveRequest rescued from `D-` to `B+`).

### Tier 2 — Sprint 3 (high; ≈27 h) — partial

| # | Task | Status | Effort | Evidence |
|---|---|:---:|---|---|
| H.9 | Promote `Funnel` aggregate (recruitment) — `moveStage/reject/makeOffer/hire`, 4 events, move `VALID_TRANSITIONS` from service | ⏸ PENDING | **L** (6 h) | Next sprint |
| H.10 | Create `PayrollRecord` aggregate + `Salary` VO with non-negative `net` invariant | ✅ DONE | **L** (5 h) | `0f526490` — `payroll-record.aggregate.ts` (250) + `salary.vo.ts` (82) + 3 events + 19 unit tests; `PayrollService.closePeriod` emits per-employee `PayrollRunCompleted` |
| H.11 | Create `OnboardingPlan` aggregate (6-week checkpoint state machine) | ⏸ PENDING | **L** (7 h) | Next sprint |
| H.12 | Refactor `EmployeesService` to use `Employee.fromRaw()` in read path | ⏸ PENDING | **M** (4 h) | Next sprint |
| H.13 | Split `HROnboarding.tsx` (438 lines) into Sections/Dialogs/Types | ✅ DONE | **M** (2 h) | Verified in prior session |
| H.14 | Long-function (Rule 17) extraction: `learning-bot.onProgressCompleted`, `recruitment-bot.publishVacancy`, `ai-interview-v2.gateway.handleAnswerSubmission`, `inspection.compareRoomWithAi`, `late-arrival.onTerritoryEnter` | ⏸ PENDING | **M** (3 h) | Some Rule-17 fixes landed in `e152d054` (`org-chart-compat.getOrgTree`, `create-lead.handler.buildLead`, `employees-compat-profile-raw.getPayrollSummary`); HR-specific 5-function list above NOT TOUCHED. |

Tier-2 closeout: **2 of 6 DONE (H.10, H.13)** · **4 PENDING (H.9, H.11, H.12, H.14)** for the next sprint.

### Tier 3 — Sprint 4 (medium; ≈16 h backlog) — 🚫 OUT OF SCOPE this session

| # | Task | Status | Effort | Reason |
|---|---|:---:|---|---|
| H.15 | Create `DisciplineRecord` aggregate | 🚫 OUT OF SCOPE | **M** (6 h) | Sprint-4 backlog; not in Wave 1-14 scope |
| H.16 | Create `SkillProfile`, `ShiftAssignment`, `EmployeeGamification` aggregates | 🚫 OUT OF SCOPE | **M** (3+3+4 h) | Sprint-4 backlog |
| H.17 | Split FE oversize pages: `HRCareerPath` 339, `HRCapitalCourses` 321, `HRHealthMonitoring` 318, `HRAlumni` 315, `HRZnoPage` 352 | 🚫 OUT OF SCOPE | **M** (5 × 1.5 h = 7.5 h) | Front-end-only follow-up; not in this sprint |
| H.18 | Add smoke tests for ≈23 secondary HR pages (basic render + error boundary) | 🚫 OUT OF SCOPE | **L** (8 h) | Testing-infra sprint |
| H.19 | Resolve 31-key delta between `uz/hr.json` and `ru/hr.json`; back-fill UZ or trim RU | 🚫 OUT OF SCOPE | **M** (3 h) | i18n sprint |
| H.20 | Audit `HRDashboardMockup.tsx` + `agents/HRPerformanceDashboard.tsx` for hardcoded labels → fixture extraction or i18n keys | 🚫 OUT OF SCOPE | **S** (2 h) | i18n sprint |

Tier-3 grade impact target (when picked up): DDD `C+ → B` (6 aggregates in HR; 5 of them aligned with Auth/CRM quality).

---

## 5 · Cross-cutting observations

- **Where DDD is strong, the file size is fine** (Employee 169, Attendance 94). Anemic ↔ oversize correlate weakly — file size is more correlated with telegram-bot / compat-layer scope creep.
- **`application/hr-compat-*` repos are the worst neighborhood**: 5 files ≥288 lines, all stitching together legacy compatibility endpoints. Worth a separate "compat-layer slimming" task — these are by-design oversized but should at least be re-grouped by domain.
- **No security findings** (Rules 3/4/7/8/14/15/18 all pass). The HR module is **not the production risk**; the legacy `legacy.service.ts` SQL-injection (CLAUDE.md §B) is unrelated and pre-existing.
- **The 3 existing HR aggregates are the model — but only 2 of them are good.** A "promote-and-fix" approach (rescue `LeaveRequest`, then promote `Funnel`/`PayrollRecord`/`OnboardingPlan`) compounds. After Sprint 2+3, HR would have 6 aggregates and 5 of them aligned with Auth/CRM quality.

---

*Audit performed 2026-05-16 by parallel exploration of 230 backend + 91 frontend files. Re-runnable via:*
- *`bash scripts/run-all-reviewers.sh`*
- *`node scripts/audit-anemic-domain.mjs`*
- *Manual `find apps/api/src/modules/hr -name "*.ts" -exec wc -l {} \; | sort -rn | head -15`*
