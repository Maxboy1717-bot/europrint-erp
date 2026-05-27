# Report 07 — HR Recruitment / Leave / Attendance

**Date:** 2026-05-27 (v2 audit)
**Scope (v2):** `apps/api/src/modules/hr/recruitment/`, `apps/api/src/modules/hr/leave/`, `apps/api/src/modules/hr/attendance/` plus the cross-cutting `lib/db/src/schema/` canonical tables, the cron jobs that read/write these tables, and frontend hooks/pages.
**Method:** every claim from round 1 was re-verified by reading file + line. Round-1 claims that turned out to be wrong or incomplete are listed in the next section before the body.

---

## Diff vs round 1

| # | Round-1 claim | v2 status | What v2 found |
|---|---------------|-----------|----------------|
| 1 | Recruitment table schemas (`hr_vacancies`, `recruitment_funnels`, `recruitment_job_offers`, etc.) "not found in any Drizzle schema file" (P2) | **FALSE — withdraw** | All of them live in `lib/db/src/schema/hr-recruiter.ts` (lines 78, 143, 190, 209, 252, 569, 608) and `lib/db/src/schema/recruitment.ts` (line 12). The repos import them via `@europrint/schemas`. No drift here. |
| 2 | Round-1 named the recruitment top-level route as bare `/hr` (e.g. `POST /hr/recruitment/funnels`, `PATCH /hr/vacancies/...`) | **Partially wrong** | Every recruitment controller is mounted under `@Controller('hr/recruitment')` — including `HrVacanciesController`. The actual paths are `/hr/recruitment/vacancies/...`, `/hr/recruitment/pipeline/...`, `/hr/recruitment/funnel`, etc. Round-1 routes like `/hr/vacancies/...` do not exist. |
| 3 | "Two `leave_requests` tables" | **Understated — actually THREE Drizzle entities map to the same physical table** | `leaveRequests` in `schema-compat-2.ts:42`, `leaveRequestsApp` in `schema-misc-app-a.ts:80`, plus the canonical `leaveRequests` re-exported from `lib/db/src/schema/leave.ts:12` (re-exported as `leave_requests` in `schema-hr-lms.ts:11`). All three target physical table `leave_requests`. There is also a SEPARATE 4th table `hr_leave_requests` (`schema-business-c-2-hr-safety.ts:78`). |
| 4 | The `hr_leave_requests` table "may be unused or used by a different module" | **Used — for Telegram-bot sync** | `LeaveRepository.saveLeave` (`drizzle-leave.repo.ts:81-92`) does a dual-table write: primary INSERT into `leave_requests`, mirror INSERT into `hr_leave_requests`. The comment in-file explicitly says "Telegram bot writes to `hr_leave_requests`". |
| 5 | "No notification on leave approval" (P2) | **Partly true** | `ApproveLeaveHandler` (lines 79-82) DOES drain domain events (`LeaveApprovedEvent`) onto `EventEmitter2`. But a grep for `@OnEvent('LeaveApproved'\|leave\.approved')` over the whole repo returns ZERO listeners. So the event fires into the void: no Telegram message, no email, no push. |
| 6 | "attendance `check_in_time TEXT` vs ORM `checkIn timestamp` — schema drift" (P0) | **Drift is real, but the type and shape are different from what round 1 said** | Canonical (`lib/db/src/schema/attendance.ts:18`) defines `checkInTime: timestamp("check_in_time")`. So real DB column is **timestamp**, not text. The drift is: (a) `schema-business-c-2-hr-payroll.ts:48` declares `check_in_time: text(...)` — incorrect type label, but never actually used to write/read; (b) ORM in `DrizzleAttendanceRepository.checkIn` writes to `attendance.checkIn` which is the DIFFERENT canonical column `check_in` (also timestamp, line 33 of canonical). So `checkIn(...)` and `findTodayAll()` operate on two physically different columns. |
| 7 | "JOIN employees (third employee table) in raw SQL" (P1) | **Confirmed** | `drizzle-attendance.repo.ts:29` and `late-arrival-fine.cron.ts:55` JOIN `employees` (uuid-keyed). The ORM code elsewhere uses `hrEmployees` (integer-keyed). `lib/db/src/schema/hr-lms.ts` defines `employees` with uuid PK. So queries against `attendance.employee_id INTEGER` JOIN `employees.id UUID` — type mismatch unless DB coerces. |
| 8 | "No check-in duplicate prevention" (P2) | **Partly wrong — depends on path** | The `HR_REPO.saveAttendance` path used by `HrAttendanceController.checkIn/checkOut` (drizzle-hr-base.repo.ts:237) DOES `ON CONFLICT (employee_id, attendance_date) DO UPDATE`. Only the unused `DrizzleAttendanceRepository.checkIn` path lacks dedup. Canonical schema also has `uniqueIndex("uq_attendance_emp_date")` (attendance.ts:46). |
| 9 | "Late arrival threshold hardcoded `'09:15:00'`" (P3) | **Confirmed + worse** | `drizzle-attendance.repo.ts:29` hardcodes `09:15:00`. `late-arrival-fine.cron.ts:20` hardcodes `GRACE_PERIOD_MIN = 5`. `late-arrival-fine.cron.ts:21` hardcodes `DEFAULT_FINE_UZS = 50000`. None are settings-table driven. |
| 10 | "Leave balance cron schedule unknown" (P3) | **Resolved** | `LeaveAccrualJobService.monthlyAccrualCron` (line 42): `@Cron('0 2 1 * *')` — every 1st of month at 02:00. |
| 11 | "Non-Telegram channel publishing is stub" (P2) | **Confirmed** | `hr-vacancies.service.ts:122-124` literally sets `{ status: 'queued', message: 'integratsiyasi navbatga qo\'shildi' }` for any non-telegram channel. No consumer of that queue exists. |
| 12 | Round-1 also listed `email.account.disable` / `access.chip.revoke` / `iot.attendance.block` as silent | **Confirmed** | `orphan-events.listener.ts:118, 127, 136` — three listeners exist BUT each is a TODO that only logs (lines 121, 130, 139). |

The big effective deltas vs round 1:
* Recruitment schemas are NOT drifting; only the route prefix mapping in round 1 was wrong.
* Leave drift is wider (3 ORMs on one table + a 4th `hr_leave_requests`) AND the dual-table sync to `hr_leave_requests` is intentional (Telegram bot).
* Attendance drift is real but located differently: `check_in_time` IS canonical timestamp, the bug is one ORM stub mislabels it as TEXT and one ORM writes to the wrong column `check_in`.

---

## 1. Recruitment module

### 1.1 Folder layout

```
apps/api/src/modules/hr/recruitment/
├── dto/
│   ├── create-funnel.dto.ts
│   ├── hr-vacancies.dto.ts
│   ├── job-offer.dto.ts
│   ├── productivity-interview.dto.ts
│   ├── references-check.dto.ts
│   └── tool-test.dto.ts
├── hr-vacancies-analytics.controller.ts
├── hr-vacancies-pipeline.controller.ts
├── hr-vacancies-probation.controller.ts
├── hr-vacancies.controller.ts
├── hr-vacancies.service.ts
├── recruitment-assessment.service.ts
├── recruitment-funnel.service.ts
├── recruitment-offers.controller.ts
├── recruitment-stats.repository.ts
├── recruitment-stats.service.ts
├── recruitment.controller.ts
├── recruitment.gateway.ts
├── recruitment.service.ts
└── repos/
    ├── drizzle-hr-recruitment-funnel.repo.ts
    ├── drizzle-hr-vacancies-funnel.repo.ts
    ├── drizzle-hr-vacancies.repo.ts
    ├── drizzle-recruitment-assessment.repo.ts
    └── i-hr-recruitment-funnel.repo.ts
```

### 1.2 Controllers (all under `/hr/recruitment`)

All 6 controllers register the same `@Controller('hr/recruitment')` prefix.

**`RecruitmentController`** (`recruitment.controller.ts:53`) — funnel + tool tests + productivity + analytics:

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| `GET`  | `/` | hr roles | List funnels (page=1,limit=`RECRUITMENT_LIST_LIMIT`) — line 60 |
| `POST` | `/funnel` | recruiter | Add candidate to funnel (`createFunnel`) — line 68 |
| `GET`  | `/funnel` | open | List funnels with filters — line 78 |
| `GET`  | `/funnel/kanban?vacancyId=` | open | Kanban grouping — line 84 |
| `GET`  | `/funnel/:id` | open | Single funnel — line 91 |
| `PATCH`| `/funnel/:id/move` | recruiter | State-machine transition — line 97 |
| `PATCH`| `/funnel/:id/screening` | recruiter | Quick screening — line 110 |
| `POST` | `/tool-test` | recruiter | A-J personality test result — line 124 |
| `GET`  | `/tool-test/candidate/:candidateId` | open | Per-candidate tool tests — line 133 |
| `POST` | `/tool-test/match` | open | Match Tool Test to position ideal profile — line 139 |
| `POST` | `/productivity-interview` | recruiter | Productivity classification — line 148 |
| `GET`  | `/productivity-interview/candidate/:candidateId` | open | Per-candidate productivity — line 160 |
| `GET`  | `/channel-analytics` | open | Channel conversion analytics — line 168 |
| `POST` | `/job-offers` | recruiter | Legacy alias for createJobOffer — line 177 |
| `GET`  | `/statistics/weekly?recruiterId=&weekStart=` | recruiter | Weekly stats — line 188 |
| `GET`  | `/health-check` | admin, hr_manager | "13 ta belgi" HR health score — line 206 |

**`RecruitmentOffersController`** (`recruitment-offers.controller.ts:40`):

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| `POST` | `/references-check` | recruiter | Reference check (line 45) |
| `GET`  | `/references-check/funnel/:funnelId` | recruiter | List by funnel (57) |
| `PATCH`| `/references-check/:id` | recruiter | Update (65) |
| `POST` | `/job-offer` | recruiter | Create job offer (78) |
| `GET`  | `/job-offer/candidate/:candidateId` | recruiter | By candidate (90) |
| `GET`  | `/job-offer/:id` | recruiter | By id (98) |
| `PATCH`| `/job-offer/:id/status` | recruiter | SENT/ACCEPTED/DECLINED/EXPIRED (106) |

**`HrVacanciesController`** (`hr-vacancies.controller.ts:72`) — vacancy CRUD + publish:

| Method | Path | Notes |
|--------|------|-------|
| `GET`  | `/vacancies` (80) | List, hard-capped 200 (`drizzle-hr-vacancies.repo.ts:40`) |
| `GET`  | `/vacancies/:id` (90) | Single |
| `POST` | `/vacancies` (174) | **STUB** — returns `{ id: Date.now(), ...dto, created: true }` without DB insert (line 177) |
| `POST` | `/vacancies/:id/publish` (183) | See §1.5 |
| `POST` | `/vacancies/:id/channel-status` (99) | Append funnel history entry |
| `PATCH`| `/vacancies/:id/channel-status` (200) | Same — duplicate of POST |
| `POST` | `/vacancies/:id/telegram-announce` (115) | Records history `telegram_announced` |
| `POST` | `/vacancies/:id/alumni-notify` (129) | Records history `alumni_notified` (no actual send) |
| `GET`  | `/vacancies/:id/market-analysis` (143) | Delegated to repo |
| `POST` | `/vacancies/:id/market-analysis` (228) | Same data via POST |
| `GET`  | `/vacancies/:id/portret` (153) | Read |
| `PATCH`| `/vacancies/:id/portret` (240) | **STUB** — echoes body, no DB write |
| `GET`  | `/vacancies/:id/channels` (163) | Delegated |
| `PATCH`| `/vacancies/:id/channels` (217) | **STUB** — echoes body |

**`HrVacanciesPipelineController`** (`hr-vacancies-pipeline.controller.ts:59`):

| Method | Path | Notes |
|--------|------|-------|
| `GET`  | `/pipeline` (66) | All pipeline rows |
| `GET`  | `/pipeline/:id/stage` (76) | Stage of one |
| `POST` | `/pipeline/:id/stage` (86) | Move (state machine) |
| `PATCH`| `/pipeline/:id/stage` (103) | Same as POST |
| `GET`  | `/pipeline/:id/roadmap` (120) | Roadmap |
| `GET`  | `/roadmaps` (129) | All |
| `GET`  | `/pipeline/:id/report` (139) | Pipeline + history bundle |
| `POST` | `/pipeline/:id/nda-request` (153) | History entry |
| `POST` | `/pipeline/:id/offer` (167) | History entry only |
| `POST` | `/pipeline/:id/checklist` (182) | Stores notes (not items) |
| `GET`  | `/pipeline/:id/checklist` (198) | **STUB** — returns empty `{ items: [] }` |
| `PATCH`| `/pipeline/:id/checklist` (206) | Same as POST |
| `POST` | `/pipeline/:id/roadmap` (223) | **STUB** — echoes body |
| `POST` | `/vacancy/candidates` (234) | Add candidate to pipeline |

**`HrVacanciesProbationController`** (`hr-vacancies-probation.controller.ts:43`):

| Method | Path | Notes |
|--------|------|-------|
| `GET`  | `/pipeline/:id/probation-journal` (51) | List entries |
| `GET`  | `/pipeline/:id/probation-dates` (61) | Start/end |
| `POST` | `/pipeline/:id/probation-review` (72) | Records funnel history |
| `PATCH`| `/pipeline/:id/probation-dates` (89) | **STUB** — echoes body |
| `POST` | `/pipeline/:id/probation-journal` (98) | Records history |
| `GET`  | `/pipeline/:id/probation-review` (113) | **STUB** — returns `review: null` |

**`HrVacanciesAnalyticsController`** (`hr-vacancies-analytics.controller.ts:32`):
* `GET /checklist-alerts` (39) — first 20 of pipeline
* `GET /kpi` (47) — count by vacancy
* `GET /urgent` (56) — active vacancies
* `GET /worker-type-stats` (65) — count by vacancy
* `GET /internal-board` (74)
* `POST /internal-apply/:id` (85) — apply internally

### 1.3 Funnel stage tracking (state machine)

Yes, stages are tracked. The canonical 12-stage list is defined in `recruitment-funnel.service.ts:94-98`:

```
'NEW', 'QUESTIONNAIRE_SENT', 'PHONE_SCREENING', 'INTERVIEW_SCHEDULED',
'INTERVIEWED', 'TEST_SENT', 'TEST_ANALYSIS', 'REFERENCES_CHECK',
'PROBATION', 'OFFER_SENT', 'HIRED', 'REJECTED'
```

Transitions are validated through the `Funnel` aggregate (`apps/api/src/modules/hr/domain/aggregates/funnel.aggregate.ts`) and the `VALID_TRANSITIONS` map (re-exported from `recruitment-funnel.service.ts:36`). The service:

1. Pulls current funnel row (`recruitment-funnel.service.ts:109`)
2. Hydrates `Funnel.fromProps(...)` aggregate (line 122)
3. For `REJECTED` calls `aggregate.reject(notes)` → emits `CandidateRejectedEvent`
4. For `HIRED` calls `aggregate.hire(placeholderEmployeeId)` → emits `CandidateHiredEvent`
5. Otherwise `aggregate.moveStage(stageVO)`
6. Persists via `updateFunnel(...)` then `insertFunnelHistory(...)`
7. Emits `CANDIDATE_STAGE_CHANGED_EVENT` (`candidate.stage-changed`) for the websocket gateway
8. Drains and DISCARDS typed domain events (line 222 — comments admit this is a TODO)

Special guard at line 137: moving to `REFERENCES_CHECK` requires `countReferencesChecks(funnelId) >= 1`.

Quick-rejection bypasses the aggregate entirely (line 230 — also tagged TODO H.9-FOLLOW-UP).

### 1.4 Drizzle tables backing recruitment

All in `lib/db/src/schema/`:

| Table | File / line | Purpose |
|-------|-------------|---------|
| `vacancies` | `recruitment.ts:12` | Vacancy master. Multi-tenant (`tenantId`), bilingual columns (titleRu, descriptionRu, etc.) |
| `hr_vacancy_profiles` | `hr-recruiter.ts:78` | Portret/ideal-profile per vacancy |
| `hr_candidate_funnels` | `hr-recruiter.ts:143` | Pipeline rows |
| `hr_funnel_history` | `hr-recruiter.ts:190` | Stage transition audit |
| `hr_tool_test_results` | `hr-recruiter.ts:209` | A-J personality tests |
| `hr_productivity_interviews` | `hr-recruiter.ts:252` | Productivity classification (FLAGMAN/PROTSESSNIK/TRABLDAYKER) |
| `hr_references_checks` | `hr-recruiter.ts:569` | Navedenie spravok |
| `hr_job_offers` | `hr-recruiter.ts:608` | Offers |
| `hr_weekly_statistics` | `hr-recruiter.ts:529` | Recruiter weekly KPI |
| `candidates` | exported from `schema-compat-1` (`apps/api/src/shared/db/index.ts:13-17`) | Candidate master |

Round-1 P2 "Recruitment table schemas not in Drizzle" is FALSE.

### 1.5 Vacancy publish flow (`hr-vacancies.service.ts:100-139`)

```
POST /hr/recruitment/vacancies/:id/publish
  body: { channels?: string[] }   // default ['telegram']
  -> svc.publishVacancy(id, channels, userId)
     1. fetch vacancy row via repo.findById
     2. for each channel ∈ SUPPORTED ('telegram','linkedin','hhuz','uzjob','myjob'):
        if telegram:
          events.emit('vacancy.published', { vacancyId, title, description, publishedBy })
          results[ch] = { status: 'sent', ... }
        else:
          results[ch] = { status: 'queued', ... }   ⚠ stub — never sent
        repo.recordFunnelHistory(vacancyId, 'channel_published:'+ch, userId, 'Published to '+ch)
     3. return { vacancyId, title, publishedTo, results }
```

`vacancy.published` HAS one listener: `TelegramBotsCronRecruitmentService.onVacancyPublished` (`telegram-bots-cron-recruitment.service.ts:94`) which rank-matches boomerang ex-employees by embedding and sends them Telegram + SMS via `BOOMERANG_OFFER` template. Good. But the 4 non-Telegram external channels just get a `queued` status with no queue processor — confirmed P2.

### 1.6 Recruitment WebSocket (`recruitment.gateway.ts`)

- Namespace: `/recruitment` (line 44)
- Roles allowed: SUPER_ADMIN, DIRECTOR, HR_MANAGER, HR_SPECIALIST, admin, hr_manager, hr_recruiter, hr (line 32-41)
- Auth: JWT via `handshake.auth.token` or `Authorization` header
- Listens for `CANDIDATE_STAGE_CHANGED_EVENT` (line 119) and broadcasts `candidate:moved` to all connected clients (line 122)
- No `@SubscribeMessage` handlers — server-push only

---

## 2. Leave module (dual `leave_requests` tables)

### 2.1 Folder layout

```
apps/api/src/modules/hr/leave/
├── drizzle-hr-leave-svc.repo.ts      # uses leaveRequests from @shared/db (= schema-compat-2)
├── hr-leave-accrual.controller.ts    # /hr/leave/accrual/run (manual trigger)
├── i-hr-leave-svc.repo.ts            # interface
├── leave-accrual-job.service.ts      # Cron 0 2 1 * *
├── leave-accrual.service.ts          # computeAccrual / applyAccrual
└── leave.service.ts                  # generic service (not wired to hr/leave route — see below)

apps/api/src/modules/hr/presentation/
└── hr-leave.controller.ts            # /hr/leave routes — uses HR_REPO + CommandBus

apps/api/src/modules/hr/infrastructure/repositories/
├── drizzle-hr-leave.repo.ts          # uses leaveRequestsApp (schema-misc-app-a)
└── drizzle-leave.repo.ts             # raw SQL into leave_requests; dual-writes hr_leave_requests
```

### 2.2 Endpoints (`/hr/leave` — `presentation/hr-leave.controller.ts:39`)

| Method | Path | Roles | Flow |
|--------|------|-------|------|
| `GET`  | `/` | HR_MANAGER, SUPER_ADMIN, DIRECTOR | `QueryBus → GetLeavesQuery` |
| `GET`  | `/stats` | HR_MANAGER, SUPER_ADMIN, DIRECTOR | `hrRepo.getLeaveStats()` |
| `GET`  | `/balance/:employeeId` | HR_MANAGER, SUPER_ADMIN, DIRECTOR | `QueryBus → GetLeaveBalanceQuery` |
| `GET`  | `/:id` | HR_MANAGER, SUPER_ADMIN, DIRECTOR | `hrRepo.findLeaveById(id)` |
| `POST` | `/` | EMPLOYEE, HR_MANAGER, SUPER_ADMIN, DIRECTOR | `CommandBus → CreateLeaveRequestCommand` |
| `PATCH`| `/:id/approve` | HR_MANAGER, SUPER_ADMIN, DIRECTOR | `CommandBus → ApproveLeaveCommand` |
| `PATCH`| `/:id/reject` | HR_MANAGER, SUPER_ADMIN, DIRECTOR | `CommandBus → RejectLeaveCommand` |
| `PATCH`| `/:id/cancel` | EMPLOYEE, HR_MANAGER, SUPER_ADMIN, DIRECTOR | `CommandBus → CancelLeaveCommand` |
| `DELETE`| `/:id` | HR_MANAGER, SUPER_ADMIN, DIRECTOR | `CommandBus → DeleteLeaveCommand` |

Additional: `POST /hr/leave/accrual/run` (`hr-leave-accrual.controller.ts:27`) — manual trigger for `LeaveAccrualJobService.runForMonth(year, month)`.

`LeaveService` in `leave/leave.service.ts` is registered as a provider (`hr.providers.ts:215`) but is NOT wired to an HTTP route — it appears to be dead code (the controller goes through CommandBus and `HR_REPO` instead). It uses `DrizzleHrLeaveSvcRepository` which writes to `leaveRequests` (the camelCase compat alias of `leave_requests`).

### 2.3 The four-table situation

Physical PostgreSQL has at least two tables:

* `leave_requests` — primary leave table
* `hr_leave_requests` — secondary (Telegram-bot view)

But the Drizzle TypeScript layer exposes **four** ORM entities pointing at them:

| ORM symbol | File | Maps to physical table | Column shape |
|-----------|------|-------------------------|--------------|
| `leaveRequests` (canonical) | `lib/db/src/schema/leave.ts:12` | `leave_requests` | Full superset: `tenant_id`, `manager_status`, `hr_status`, `director_status`, `medical_certificate_url`, plus convergence cols (`user_id`, `approved_by`, `notes`, `deleted_at`, `days_requested`, `approved_at`, `rejected_by`, `rejection_reason`) |
| `leaveRequests` (compat) | `apps/api/src/shared/db/schema-compat-2.ts:42` | `leave_requests` | Minimal: id, userId, employeeId(**text**), leaveType, startDate(**text**), endDate(**text**), status, reason, approvedBy(**text**), approvedAt, createdAt, updatedAt, deletedAt |
| `leaveRequestsApp` | `apps/api/src/shared/db/schema-misc-app-a.ts:80` | `leave_requests` | snake_case full workflow: id, employee_id(int), leave_type, start_date(date), end_date(date), duration_days, status, reason, user_id, submitted_by, submitted_date, manager_status, manager_notes, hr_status, hr_notes, director_status, director_notes, created_at, updated_at, deleted_at |
| `leaveRequests as leave_requests` | `apps/api/src/shared/db/schema-hr-lms.ts:11` | `leave_requests` | Re-export of canonical from `@workspace/db` |
| `hr_leave_requests` | `apps/api/src/shared/db/schema-business-c-2-hr-safety.ts:78` | `hr_leave_requests` | Standalone separate table: id, employee_id, start_date(date), end_date(date), reason, status, requested_at, reviewed_at, notes |

Three of these (`leaveRequests` compat, `leaveRequestsApp`, canonical re-export) all map to the SAME physical table `leave_requests`. Their `$inferInsert` types are mutually incompatible because column types differ (text vs date, text employeeId vs int).

`apps/api/src/shared/db/schema-compat-2.ts:42` explicitly notes the date columns as `text('start_date')` instead of `date(...)` — round-1 P2 about date-as-text is correct on this surface, but the canonical schema does use `date`. So writes through `leaveRequestsApp` or canonical are OK; writes through the compat barrel use text.

### 2.4 Which repo is actually wired to which controller

Wiring (`hr.providers.ts`):

| Token | Implementation | Table accessed |
|-------|----------------|----------------|
| `HR_REPO` | `HrRepository` (`drizzle-hr.repo.ts:29`) → delegates leave methods to `HrLeaveRepo` | `leaveRequestsApp` (snake_case, full workflow) |
| `HR_LEAVE_SVC_REPO` | `DrizzleHrLeaveSvcRepository` (`drizzle-hr-leave-svc.repo.ts:16`) | `leaveRequests` from compat (text dates) |
| Plain registered | `LeaveRepository` (`drizzle-leave.repo.ts:19`) — used by HR_REPO `saveLeave/updateLeave/getLeaveBalance/getLeaveStats` | Raw SQL into `leave_requests`; ALSO inserts into `hr_leave_requests` for Telegram-bot sync (line 81-92) |

`HrLeaveController` uses `HR_REPO` + CommandBus. The command handlers in turn call `repo.saveLeave(...)`, `repo.updateLeave(...)`, `repo.findLeaveById(...)`. Trace:

```
POST /hr/leave
  -> HrLeaveController.createLeaveRequest (line 99)
  -> CommandBus → CreateLeaveRequestCommand
  -> CreateLeaveRequestHandler (line 17)
  -> repo.saveLeave(...)            // HR_REPO → HrRepository → leaveRepo (HrLeaveRepo)
  -> drizzle-hr-leave.repo.ts:saveLeave → LeaveRepository.saveLeave
     INSERT INTO leave_requests (..., submitted_date, ...)
     INSERT INTO hr_leave_requests (...)   // Telegram bot sync, onConflictDoNothing intent (no real unique key)
  <- created row
```

`LeaveService` (`leave/leave.service.ts`) and `DrizzleHrLeaveSvcRepository` form a parallel branch used only by the accrual code paths (`listActiveEmployeesWithHireDate`, `upsertBalance`, `findBalance`).

### 2.5 Accrual cron

`leave-accrual-job.service.ts:42`:

```typescript
@Cron('0 2 1 * *')   // 02:00 on the 1st of every month
async monthlyAccrualCron(): Promise<void> {
  const year  = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  await this.runForMonth(year, month);
}
```

`runForMonth(year, month)` (line 59):
1. `repo.listActiveEmployeesWithHireDate()` (line 63)
2. For each employee with a hire_date: `accrual.computeAccrual({ employeeId, hireDate, year, month })` → returns lines per leave type
3. For each line: read current balance via `repo.findBalance`, apply with `accrual.applyAccrual`, then `repo.upsertBalance`
4. Returns `{ year, month, processed, updated, skipped, errors }`

Balance table is `hr_leave_balances` (canonical `leaveBalances` in `lib/db/src/schema/leave.ts:112` with `uniqueIndex("uq_leave_balance_emp_type_year")`). Default `total_entitlement: 24`.

### 2.6 Approval event flow — listeners missing

`ApproveLeaveHandler` (`approve-leave.handler.ts:25-86`):

1. Find by id (`repo.findLeaveById`)
2. Hydrate `LeaveRequest` aggregate
3. `leaveRequest.approve(approverId)` — this pushes `LeaveApprovedEvent` onto the aggregate's domain-event buffer (`leave-request.aggregate.ts:145`)
4. Persist update
5. **`for (const ev of leaveRequest.getDomainEvents()) this.eventEmitter.emit(ev.eventName, ev);`** (line 79-81)
6. Clear domain events

`LeaveApprovedEvent.eventName` = `'LeaveApproved'` (constructor on `leave-approved.event.ts:18` passes `'LeaveApproved'` to `super(...)`).

```
grep -rn "@OnEvent('LeaveApproved'\\|leave\\.approved')" apps/api/src
→ 0 hits
```

So the event fires but nothing listens. Employees are not notified of approval via any channel. Same for `LeaveRejectedEvent`.

### 2.7 Leave-balance enforcement on create

`CreateLeaveRequestHandler` (line 31-49):

```typescript
const daysRequested = LeaveRequest.calcWorkDays(command.startDate, command.endDate);
if (command.leaveType === LeaveType.ANNUAL) {
  const balanceResult = await this.repo.getLeaveBalance(command.employeeId);
  ...
  const remaining = balanceResult.data.annual.remaining;
  if (remaining < daysRequested) {
    return Err(`Insufficient annual leave. Remaining: ${remaining}, Requested: ${daysRequested}`);
  }
}
```

`getLeaveBalance` is in `drizzle-leave.repo.ts:112`, hardcoded `ANNUAL_TOTAL = 24` — does NOT read the `leaveBalances` table; computes remaining as `24 - SUM(duration_days WHERE leave_type='annual' AND status IN ('approved','draft') AND year matches)`. So the cron-accrued balances in `hr_leave_balances` are written but never read by the request-creation path.

---

## 3. Attendance module (`check_in_time` type conflict)

### 3.1 Folder

```
apps/api/src/modules/hr/attendance/
├── attendance-face.controller.ts     # /hr/attendance/face/register, /territory, /live, /territory/logs, /face/health, /late-arrivals/today
├── attendance.service.ts              # AttendanceService → DrizzleAttendanceRepository (NOT wired to HTTP)
├── discipline-record.repository.ts
├── drizzle-attendance.repo.ts         # ORM checkIn writes attendance.checkIn ("check_in"); raw SQL findTodayAll reads "check_in_time"
├── face-recognition.service.ts
├── i-attendance.repo.ts
├── late-arrival.service.ts            # @OnEvent('attendance.territory_enter'/'attendance.late_arrival')
├── room-snapshot.cron.ts              # @Cron('0 */2 * * *')
├── territory-log.repository.ts
├── territory-log.service.ts
└── territory.gateway.ts               # /territory ws namespace

apps/api/src/modules/hr/presentation/
└── hr-attendance.controller.ts        # /hr/attendance routes — uses HR_REPO.saveAttendance + HrAttendanceService
```

### 3.2 Routes

**`HrAttendanceController`** (`hr-attendance.controller.ts:29`, prefix `/hr/attendance`):

| Method | Path | Roles | Behaviour |
|--------|------|-------|-----------|
| `GET`  | `/today` (39) | HR roles | `attendanceSvc.getTodayAll()` → `findTodayAll()` raw SQL |
| `GET`  | `/` (48) | HR roles | If `employeeId`: `hrRepo.findAttendance(...)` else `getTodayAll` |
| `GET`  | `/:employeeId/summary/:period` (62) | HR roles | findAttendance + getAttendanceStats |
| `POST` | `/check-in` (83) | HR_SPECIALIST, HR_MANAGER, SUPER_ADMIN | `hrRepo.saveAttendance(...)` — writes `check_in_time` |
| `POST` | `/check-out` (103) | HR_SPECIALIST, HR_MANAGER, SUPER_ADMIN | `hrRepo.saveAttendance(...)` — writes `check_out_time` |

**`AttendanceFaceController`** (`attendance-face.controller.ts:58`, prefix `/hr/attendance`):

| Method | Path | Behaviour |
|--------|------|-----------|
| `POST` | `/face/register` (70) | 3-image enrollment OR single embedding |
| `POST` | `/territory` (106) | Camera event ingestion |
| `GET`  | `/live` (124) | Live status from territory service |
| `GET`  | `/territory/logs?date=&employee_id=` (135) | Day logs |
| `GET`  | `/face/health` (151) | Face AI health |
| `GET`  | `/late-arrivals/today` (162) | In-memory map of today's late notifications |

### 3.3 The `check_in_time` drift (P0 — confirmed but reshaped)

**Canonical Drizzle schema** (`lib/db/src/schema/attendance.ts:12-50`):

```typescript
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().default(1),
  employeeId: integer("employee_id").references(() => employees.id, ...).notNull(),
  attendanceDate: date("attendance_date").notNull(),
  checkInTime: timestamp("check_in_time"),              // line 18 — canonical
  checkOutTime: timestamp("check_out_time"),            // line 19
  status: varchar("status", { length: 20 }).default("present"),
  lateMinutes: integer("late_minutes").default(0),
  earlyLeaveMinutes: integer("early_leave_minutes").default(0),
  overtimeMinutes: integer("overtime_minutes").default(0),
  ...
  // Convergence additions (live-DB superset)
  checkIn: timestamp("check_in"),                       // line 33 — SECOND, separate column
  checkOut: timestamp("check_out"),                     // line 34
  userId: integer("user_id"),
  date: date("date"),                                   // line 36 — separate from attendance_date
  ...
}, (table) => [
  ...
  uniqueIndex("uq_attendance_emp_date").on(table.employeeId, table.attendanceDate),  // line 46
  ...
]);
```

So the canonical DB has BOTH `check_in_time` and `check_in` as two distinct timestamp columns. The unique index is on (employee_id, attendance_date).

**Compat stub** (`apps/api/src/shared/db/schema-compat-2.ts:30-40`):

```typescript
export const attendance = pgTable('attendance', {
  id: integer('id').primaryKey(),
  employeeId: text('employee_id').notNull(),           // wrong — canonical is integer
  userId: integer('user_id'),
  date: text('date').notNull(),                         // text, not date
  checkIn: ts('check_in'),                              // timestamp, but only the "check_in" column
  checkOut: ts('check_out'),
  status: text('status').notNull().default('present'),
  notes: text('notes'),
  createdAt: ts('created_at').defaultNow(),
});
```

**Wrong-type stub** (`apps/api/src/shared/db/schema-business-c-2-hr-payroll.ts:42-57`):

```typescript
// hr_attendance: used with snake_case columns (status) in drizzle-hr-leave.repo.ts
// Canonical attendance uses camelCase — kept as local stub.
export const hr_attendance = pgTable('attendance', {
  id:                   serial('id').primaryKey(),
  employee_id:          integer('employee_id'),
  attendance_date:      date('attendance_date'),
  check_in_time:        text('check_in_time'),         // ⚠ canonical says timestamp
  check_out_time:       text('check_out_time'),
  status:               text('status').default('present'),
  late_minutes:         integer('late_minutes').default(0),
  early_leave_minutes:  integer('early_leave_minutes').default(0),
  overtime_minutes:     integer('overtime_minutes').default(0),
  source:               text('source'),
  created_at:           timestamp('created_at').defaultNow(),
  updated_at:           timestamp('updated_at').defaultNow(),
});
```

**Migration drift hint** (`apps/api/src/shared/db/invariants/migrations-drift.ts:63`):

```typescript
{ name: 'attendance.check_in_time ADD COLUMN',
  sql: `ALTER TABLE IF EXISTS attendance ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMP` },
```

So the runtime migration drift table also affirms `TIMESTAMP`.

**Use sites of the `check_in_time` column**:

| File | Line | Operation | Column type assumed |
|------|------|-----------|---------------------|
| `drizzle-attendance.repo.ts:29` | raw SQL `SELECT a.check_in_time, ... (a.check_in_time::time > '09:15:00'::time) AS is_late` | read + cast to time | timestamp (works) |
| `drizzle-hr-base.repo.ts:235` | raw SQL `INSERT INTO attendance (..., check_in_time, ...) VALUES (..., ${r.checkInTime ?? r.check_in_time ?? null}, ...) ON CONFLICT (employee_id, attendance_date) DO UPDATE SET check_in_time = EXCLUDED.check_in_time` | write + upsert | timestamp expected, but pushes raw value — may be string from controller |
| `late-arrival-fine.cron.ts:53` | `EXTRACT(EPOCH FROM (a.check_in_time - (a.check_in_date::date + st.start_time::time)))/60` | arithmetic | timestamp (required) |
| `dashboard-query.repository.ts:68` | `DATE(check_in_time)` | function | timestamp (required) |

**Use sites of the `check_in` column** (the other timestamp):

| File | Line | Operation |
|------|------|-----------|
| `drizzle-attendance.repo.ts:54` | `db.insert(attendance).values({ ..., checkIn: _time.now() })` | INSERT into `check_in` |
| `drizzle-attendance.repo.ts:61` | `db.update(attendance).set({ checkOut: _time.now() })` | UPDATE `check_out` |

**Effective drift**: there are TWO physical columns and two write paths in the codebase that write to different columns:

* `HrAttendanceController.checkIn` → `hrRepo.saveAttendance` → INSERT into `check_in_time` ✅ this column is read by the rest of the system
* (Theoretical) `AttendanceService.checkIn` → `attendanceRepo.checkIn` → INSERT into `check_in` ❌ no one reads this column

The second path is currently UNROUTED (no controller calls `AttendanceService`), so the bug is latent. But the wrong-type stub `schema-business-c-2-hr-payroll.ts` is imported by `drizzle-hr-leave.repo.ts:14`:

```typescript
import { leaveRequestsApp, hrEmployees, hr_360_feedback, hr_attendance } from '@shared/db';
```

…although a follow-up grep shows `hr_attendance` is only listed in the import; the file doesn't actually invoke it. Still: the type label is wrong and any future read through `hr_attendance.check_in_time` would receive `string` instead of `Date`.

Also note round-1 said the column is TEXT — that's only because round 1 read the wrong-type stub. The real DB column is TIMESTAMP.

### 3.4 Late-detection logic

`drizzle-attendance.repo.ts:29`:

```sql
SELECT a.id, a.employee_id, a.attendance_date, a.check_in_time, a.check_out_time,
       a.status, a.late_minutes, a.overtime_minutes,
       COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS employee_name,
       (a.check_in_time IS NOT NULL AND a.check_in_time::time > '09:15:00'::time) AS is_late
FROM attendance a JOIN employees e ON e.id = a.employee_id
WHERE a.attendance_date = ${today}
LIMIT ${MAX_QUERY_LIMIT}
```

Hardcoded `09:15:00`. JOINs `employees` (uuid PK per `lib/db/src/schema/hr-lms.ts:42`) against `attendance.employee_id INTEGER` — type mismatch. Live DB may have a separate `employees` table; otherwise this JOIN fails or returns 0 rows.

### 3.5 Face-recognition check-in

`AttendanceFaceController.cameraEvent` (line 108) → `TerritoryLogService.handleCameraEvent(dto)` → uses `FaceRecognitionService` for matching. Embedding-based search lives in `drizzle-attendance.repo.ts:66` (`findEmployeeByEmbedding`) — uses pgvector `<=>` cosine distance on `hrEmployees.face_embedding`.

`saveEmployeeFaceEmbedding` (line 97) implements a weighted-average update: `0.7 * old + 0.3 * new`, re-normalised, then stored on `hrEmployees.face_embedding` and a new active `face_embeddings` row with previous one deactivated.

### 3.6 Late-arrival workflow

`late-arrival.service.ts:44-67` listens for `attendance.territory_enter` and `attendance.late_arrival`. On a late event:

1. De-dupe per employee per day (`_notified` Map)
2. Send Telegram message via `NotificationBotService.handleErpEvent({ event: 'attendance.late', ... })`
3. Optionally send to `HR_TELEGRAM_CHAT_ID` env var (single chat id)
4. Start a 30-minute timer; if reason arrives via `@OnEvent('telegram.late_reason_received')` create a LATE_ARRIVAL document via `DocumentWorkflowService.createDocument(...)`; otherwise on timeout create the document with "Sabab ko'rsatilmadi (muddati o'tdi)"
5. If approver rejects the LATE_ARRIVAL document later (`@OnEvent('document.rejected')`), insert a `FINE` discipline record via `DisciplineRecordRepository`

Notes:
- `_notified` and `_pending` are in-memory only (file comment line 35) — lost on restart, not safe for multi-instance.
- All employee-side notifications go through Telegram. Non-Telegram absence channels are STUBS (see §4).

### 3.7 Territory WebSocket (`territory.gateway.ts`)

- Namespace: `/territory` (line 25)
- CORS: only `ERP_FRONTEND_URL` and `REPLIT_DEV_DOMAIN` (line 19-22)
- Roles: SUPER_ADMIN, DIRECTOR, HR_MANAGER, HR_SPECIALIST, admin, security, SECURITY (line 67-70)
- Listens & re-broadcasts: `attendance.territory_enter`, `attendance.territory_exit`, `attendance.late_arrival`, `security.unknown_face`, `hr.room_anomaly`, `hr.fatigue_alert` (lines 100-128)
- No subscribe handlers — server push only

### 3.8 Room snapshot cron

`room-snapshot.cron.ts:42` `@Cron('0 */2 * * *')` — every 2 hours: acquire camera_events screenshots in the last 2h, store as `hr_tz2_attendance_photos`, then analyse via FaceRecognitionService. Emits `hr.room_anomaly`, `hr.fatigue_alert`, `security.unknown_face`.

---

## 4. Absence notification channels

### 4.1 Telegram path (works)

* `LateArrivalService` → `NotificationBotService.handleErpEvent({ event: 'attendance.late', ... })` → sends Telegram DM
* `LateArrivalService` → optional `HR_TELEGRAM_CHAT_ID` env var → group HR chat
* `AbsenceBlockCron` (3-day absence escalation) → Telegram to employee, HR managers, directors, department lead
* `LateArrivalFineCron` (10:00 daily) → Telegram fine proposal to employee
* `BoomerangHireCron` (every 30 min) → Telegram + SMS to ex-employees about new vacancies
* `VacancyDeadlineCron` (09:00 daily) → Telegram to vacancy department head
* `DailyReportDeadlineCron` (23:00 daily) → Telegram to employees who didn't submit daily report (file at `cron/daily-report-deadline.cron.ts:31`)

### 4.2 Non-Telegram absence channels (all STUBS)

`apps/api/src/modules/notifications/infrastructure/event-handlers/orphan-events.listener.ts`:

```typescript
// Line 118
@OnEvent('access.chip.revoke')
async handleChipRevoke(payload: EmployeeEventPayload): Promise<void> {
  this.logger.log(`access.chip.revoke employeeId=${payload.employee_id} reason="${payload.reason ?? 'absence block'}"`);
  // TODO: call hardware access control integration to deactivate RFID chip
}

// Line 127
@OnEvent('iot.attendance.block')
async handleIotAttendanceBlock(payload: EmployeeEventPayload): Promise<void> {
  this.logger.log(`iot.attendance.block employeeId=${payload.employee_id}`);
  // TODO: push block command to IoT tablet/terminal for this employee
}

// Line 136
@OnEvent('email.account.disable')
async handleEmailAccountDisable(payload: EmployeeEventPayload): Promise<void> {
  this.logger.log(`email.account.disable employeeId=${payload.employee_id}`);
  // TODO: call email provider integration to suspend the employee's email account
}
```

Each is purely a `logger.log` — no integration calls. Round-1 P2 confirmed.

`AbsenceBlockCron._blockDay3` (line 170-173) emits all three events but they go nowhere actionable:

```typescript
this.events.emit('employee.blocked', { employee_id: emp.employee_id, reason: blockReason, source: 'AbsenceBlockCron' });
this.events.emit('access.chip.revoke',   { employee_id: emp.employee_id });
this.events.emit('iot.attendance.block',  { employee_id: emp.employee_id });
this.events.emit('email.account.disable', { employee_id: emp.employee_id });
```

### 4.3 Leave-approval notifications (none)

`LeaveApprovedEvent` and `LeaveRejectedEvent` are emitted by the aggregate (`leave-request.aggregate.ts:145, 166`) and forwarded onto `EventEmitter2` by `ApproveLeaveHandler:79` and `RejectLeaveHandler` respectively. ZERO listeners across `apps/api/src` for either `'LeaveApproved'` or `'LeaveRejected'`. So:

* employee not notified when their leave is approved
* employee not notified when rejected
* HR manager not CC'd
* no email, no Telegram, no in-app notification

Round-1 P2 confirmed. Effect on user: an employee submits a leave request and never learns its decision through the system.

### 4.4 Vacancy publish notification

`'vacancy.published'` HAS a listener: `TelegramBotsCronRecruitmentService.onVacancyPublished` (`telegram-bots-cron-recruitment.service.ts:94-141`). Ranks ex-employees by embedding similarity and sends Telegram (and SMS if phone present) to top matches using `BOOMERANG_OFFER` template. Works.

---

## 5. Related cron jobs

All cron jobs that touch HR-relevant tables:

| Cron | File | Schedule | Trigger / behaviour |
|------|------|----------|---------------------|
| `LeaveAccrualJobService.monthlyAccrualCron` | `modules/hr/leave/leave-accrual-job.service.ts:42` | `0 2 1 * *` (1st of month, 02:00) | Per-employee compute & upsert `hr_leave_balances` |
| `AbsenceBlockCron.blockAbsentEmployees` | `cron/absence-block.cron.ts:27` | `0 10 * * *` | 1-day warn, 2-day escalate to HR, 3-day block + revoke + Telegram |
| `AttendanceCheckCron.run` | `cron/attendance-check.cron.ts:13` | `0 10 * * *` | **STUB** — has only logging, no DB ops or notifications (lines 16-23) |
| `LateArrivalFineCron.generateLateArrivalProposals` | `cron/late-arrival-fine.cron.ts:40` | `0 10 * * *` | Detect late arrivals (5 min grace), insert `hr_disciplinary_actions` proposal, Telegram fine to employee |
| `DailyReportDeadlineCron.markMissingReports` | `cron/daily-report-deadline.cron.ts:31` | `0 23 * * *` | Mark employees with no daily report as "ishlamagan", Telegram |
| `BoomerangHireCron.notifyAlumniOfNewVacancies` | `cron/boomerang-hire.cron.ts:33` | `*/30 * * * *` | Match new vacancies → alumni via Telegram |
| `VacancyDeadlineCron.remindUpcomingDeadlines` | `cron/vacancy-deadline.cron.ts:18` | `0 9 * * *` | Telegram dept head 3 days before closing |
| `CandidateArchiveCron.archiveRejectedCandidates` | `cron/candidate-archive.cron.ts:17` | `0 2 * * *` | Archive candidates rejected > 6 months ago |
| `RoomSnapshotCron.runSnapshot` | `modules/hr/attendance/room-snapshot.cron.ts:42` | `0 */2 * * *` | Camera screenshot acquisition + Face AI analysis; emits `hr.room_anomaly`, `hr.fatigue_alert`, `security.unknown_face` |
| `BirthdayCron` | `cron/birthday.cron.ts` | (not read) | Birthday greetings |
| `BadgeAwardCron` | `cron/badge-award.cron.ts` | (not read) | Gamification badges |
| `CertExpiryCron` | `cron/cert-expiry.cron.ts` | (not read) | Certificate expiry warnings |
| `DisciplineCron` | `cron/discipline.cron.ts` | (not read) | Discipline summary |
| `MonthlyCardDispatchCron` | `cron/monthly-card-dispatch.cron.ts` | (not read) | Employee monthly cards |
| `EnpsCron` | `cron/enps.cron.ts` | (not read) | eNPS survey |
| `BoomerangHireCron` | see above | | |

(I read the HR-specific ones; the unread ones in the list above are present in the cron folder but were not opened in this pass.)

### 5.1 No "shift handover" cron

A grep over `apps/api/src/cron/` for "shift" or "handover" returns no results. Round-1 mentioned shift handover as a category — no such cron exists. Shift assignment is read by `LateArrivalFineCron` via the `shift_assignments` and `shift_types` tables but no cron writes or rotates shifts.

### 5.2 Hardcoded magic numbers in HR crons

| File:line | Constant | Value |
|-----------|----------|-------|
| `late-arrival-fine.cron.ts:20` | `GRACE_PERIOD_MIN` | 5 |
| `late-arrival-fine.cron.ts:21` | `DEFAULT_FINE_UZS` | 50 000 |
| `late-arrival-fine.cron.ts:74` | per-minute fine | 5 000 UZS/min |
| `drizzle-attendance.repo.ts:29` | late threshold | `'09:15:00'` |
| `leave-accrual.service.ts` (not opened) | `ANNUAL_TOTAL` 24 | per `drizzle-leave.repo.ts:113` |
| `late-arrival.service.ts:26` | `REASON_TIMEOUT_MS` | 30 × 60 × 1000 |
| `room-snapshot.cron.ts:18` | `FATIGUE_THRESHOLD` | 0.7 |

None are settings-table driven.

---

## 6. Frontend integration

### 6.1 Recruitment screens

Components (`artifacts/erp-dashboard/src/components/recruiting/`):

* `KanbanBoardGrid.tsx` — pipeline Kanban container
* `KanbanColumn.tsx` — one stage column
* `DraggableCandidateCard.tsx` — card (`@dnd-kit/core`)
* `CandidateCard.tsx` — display
* `CandidatesBaseTable.tsx` — tabular alternative
* `VacancyFilterPanel.tsx` — filters
* `RecruitingHeaderActions.tsx` — actions
* `portret/Step*.tsx` — 6/7-step Portret wizard
* `helpers-*.tsx` — atoms, dialogs, channel-status helpers

Components (`artifacts/erp-dashboard/src/components/hr/`):

* `JobOfferDialog.tsx`
* `ProbationJournalPanel.tsx` + `ProbationReviewDialog.tsx`
* `OnboardingRoadmapDialog.tsx`
* `LaborMarketSheet.tsx`

Hook: `artifacts/erp-dashboard/src/hooks/use-hr-recruitment.ts` exposes:

* `useVacancies()` → `GET /hr/recruitment/vacancies` ✅
* `useCreateVacancy()` → `POST /hr/recruitment/vacancies` ✅ (controller returns stub data — no DB write)
* `useUpdateVacancy()` → `PUT /hr/recruitment/vacancies/:id` ⚠ **route does not exist** — backend has no PUT vacancy endpoint
* `useCandidates()` → `GET /hr/recruitment/candidates` ⚠ **route does not exist** — no `/candidates` controller, candidates are surfaced via `/funnel` instead
* `useCreateCandidate()` → `POST /hr/recruitment/candidates` ⚠ **route does not exist**
* `useUpdateCandidate()` → `PUT /hr/recruitment/candidates/:id` ⚠ **route does not exist**

### 6.2 Leave screens (employee profile)

* `pages/employee-profile/LeaveTab.tsx`
* `pages/employee-profile/LeaveTabDialogs.tsx` — `BusinessTripDialog`, `LeaveRequestDialog`, `SickLeaveDialog`
* `pages/employee-profile/LeaveTabSections.tsx` — `LeaveStatCards`, `LeaveRequestsSection`, `SickLeavesSection`, `BusinessTripsSection`

Hook `use-hr-leave.ts`:

* `useLeaveTypes()` → `GET /hr/leave/types` ⚠ **no such route** in `HrLeaveController` (no `/types` endpoint)
* `useLeaveRequests()` → `GET /hr/leave/requests` ⚠ **backend mounts at `GET /hr/leave`**, no `/requests`
* `useCreateLeaveRequest()` → `POST /hr/leave/requests` ⚠ **backend is `POST /hr/leave`**
* `useApproveLeave()` → `PUT /hr/leave/requests/:id/approve` ⚠ **backend is `PATCH /hr/leave/:id/approve`**
* `useRejectLeave()` → `PUT /hr/leave/requests/:id/reject` ⚠ **backend is `PATCH /hr/leave/:id/reject`**
* `useLeaveBalances()` → `GET /hr/leave/balances` ⚠ **backend is `GET /hr/leave/balance/:employeeId`**

So the frontend leave UI is completely route-mismatched against the backend. The Tab is rendered but every mutation 404s.

### 6.3 Attendance screens

* `pages/employee-profile/AttendanceTab.tsx`
* `pages/employee-profile/AttendanceTabCalendar.tsx`
* `pages/employee-profile/AttendanceTabSections.tsx`
* `pages/employee-profile/AttendanceTabTypes.ts`

Hook `use-hr-attendance.ts`:

* `useAttendance({ date, employeeId })` → `GET /hr/attendance?date=&emp_id=` ⚠ backend reads `employeeId`, not `emp_id`
* `useAttendanceSummary()` → `GET /hr/attendance/summary` ⚠ backend is `GET /hr/attendance/:employeeId/summary/:period`
* `useCheckIn()` → `POST /hr/attendance/check-in` ✅
* `useCheckOut()` → `POST /hr/attendance/check-out` ✅
* `useAbcResults()` → `GET /hr/attendance/abc-results` ⚠ no such route in `HrAttendanceController` (ABC table lives in canonical schema as `abc_analysis` but is not surfaced through this controller)

Sidebar (`components/sidebar/constants-hr-lms.ts`, etc.) lists HR menu items including recruiting Kanban, leave, attendance — but the wired URLs partially mismatch the controllers.

### 6.4 e2e tests

`artifacts/erp-dashboard/e2e/hr-attendance-flow.spec.ts` exists and is mentioned in the grep list above. It exercises the attendance flow but was not opened in this pass.

---

## 7. Findings summary

### P0 (production-blocking)

| # | Issue | Evidence | Impact | Fix |
|---|-------|----------|--------|-----|
| P0-1 | Multiple Drizzle ORM entities map to the same physical `leave_requests` table with incompatible column types (canonical date + multi-stage workflow vs compat text-dates vs snake_case full workflow) | `lib/db/src/schema/leave.ts:12`, `apps/api/src/shared/db/schema-compat-2.ts:42`, `apps/api/src/shared/db/schema-misc-app-a.ts:80`, `schema-hr-lms.ts:11` | Reads/writes through different ORM aliases see different column types; `$inferInsert` types disagree; runtime PostgreSQL coercion masks the bug until a column it didn't expect is written | Drop the two compat stubs; route every leave query/mutation through the canonical `leaveRequests` (or `leaveRequestsApp`) only. Remove the alias re-export to prevent re-introduction. |
| P0-2 | Frontend leave UI is uniformly route-mismatched against the backend (`/hr/leave/requests` vs backend `/hr/leave`, `PUT` vs backend `PATCH`) | `artifacts/erp-dashboard/src/hooks/use-hr-leave.ts:16,26,33,42,47` vs `apps/api/src/modules/hr/presentation/hr-leave.controller.ts:52,97,115,134,74` | Every leave list/approve/reject/cancel mutation returns 404 in the live app | Either rewrite the hook to match backend or add `@Controller('hr/leave/requests')` alias + accept `PUT` aliases for `PATCH` |

### P1 (urgent)

| # | Issue | Evidence | Impact | Fix |
|---|-------|----------|--------|-----|
| P1-1 | Attendance ORM `checkIn` writes to column `check_in`, but reads everywhere else use `check_in_time` | `drizzle-attendance.repo.ts:54` writes `checkIn`; `drizzle-attendance.repo.ts:29`, `drizzle-hr-base.repo.ts:235`, `late-arrival-fine.cron.ts:53`, `dashboard-query.repository.ts:68` read/write `check_in_time` | If any future controller routes through `AttendanceService.checkIn`, those records will be invisible to the rest of the system | Drop the `attendance.checkIn`/`attendance.checkOut` "convergence" columns from canonical, OR rename ORM symbol to `checkInTime` and use everywhere; settle on one column |
| P1-2 | `hr_attendance` Drizzle stub declares `check_in_time TEXT` but canonical and migrations say `TIMESTAMP` | `schema-business-c-2-hr-payroll.ts:48` vs `lib/db/src/schema/attendance.ts:18` and `migrations-drift.ts:63` | Imported into `drizzle-hr-leave.repo.ts:14` (currently unused there); any future read returns string instead of Date and time comparisons silently fail | Delete the `hr_attendance` stub and import canonical `attendance` |
| P1-3 | Raw SQL JOINs `employees` table (uuid PK per canonical) against `attendance.employee_id INTEGER` | `drizzle-attendance.repo.ts:29`, `late-arrival-fine.cron.ts:55`, `daily-report-deadline.cron.ts:50` | Type mismatch: uuid vs integer. Live DB likely has a separate `employees` table (otherwise these queries fail). Cross-references between `employees`, `hrEmployees`, and `users` are unreconciled | Pick canonical employees table; rewrite JOINs; add CI assert that schema.employee_id type matches |
| P1-4 | Leave approval emits `LeaveApprovedEvent` / `LeaveRejectedEvent` but no listeners exist | `approve-leave.handler.ts:79-82`; grep for `@OnEvent('LeaveApproved'` returns 0 hits | Employees never notified that their request was decided | Add a `LeaveNotificationListener` that sends Telegram (via `NotificationBotService`) + creates an in-app notification |
| P1-5 | Non-Telegram absence channels are stubs (chip revoke, IoT block, email disable) | `orphan-events.listener.ts:118, 127, 136` (each ends `// TODO`) | Blocked employees retain RFID access, IoT terminal access, and email — only Telegram block delivers | Implement hardware/IoT/email integrations or remove the corresponding emits from `AbsenceBlockCron._blockDay3` (170-173) |

### P2

| # | Issue | Evidence | Fix |
|---|-------|----------|-----|
| P2-1 | `POST /hr/recruitment/vacancies` is a STUB — returns `{ id: Date.now(), ...dto, created: true }` with no DB write | `hr-vacancies.controller.ts:174-178` | Wire to `repo.createVacancy(...)` or remove the route |
| P2-2 | Several PATCH/POST endpoints in `HrVacanciesController` / `HrVacanciesPipelineController` / `HrVacanciesProbationController` echo body without persisting | `hr-vacancies.controller.ts:217 (channels), 240 (portret), 228 (market-analysis)`; `hr-vacancies-pipeline.controller.ts:198 (checklist GET), 223 (roadmap POST)`; `hr-vacancies-probation.controller.ts:89 (dates PATCH), 113 (review GET)` | Replace stubs with real repo writes |
| P2-3 | Vacancy publish to non-Telegram channels returns `{ status: 'queued' }` but no queue processor exists | `hr-vacancies.service.ts:122-124` | Either implement LinkedIn/hhuz/uzjob/myjob adapters or remove from `SUPPORTED_CHANNELS` |
| P2-4 | Leave `getLeaveBalance` uses hardcoded `ANNUAL_TOTAL = 24` and ignores `hr_leave_balances` table that the accrual cron writes | `drizzle-leave.repo.ts:113` vs `leave-accrual-job.service.ts` writing to `hr_leave_balances` | Read `remainingDays` from `hr_leave_balances` table |
| P2-5 | Frontend `useUpdateVacancy`, `useCandidates`, `useCreateCandidate`, `useUpdateCandidate` call non-existent routes | `use-hr-recruitment.ts:24, 32, 39, 47` | Either implement controllers or rewrite hooks to use `/funnel` instead |
| P2-6 | Frontend `useAttendanceSummary`, `useAbcResults`, `useLeaveTypes` call non-existent routes | `use-hr-attendance.ts:20, 43`; `use-hr-leave.ts:9` | Implement or remove |
| P2-7 | `LateArrivalService` `_notified` / `_pending` maps are in-memory only — lost on restart, broken on multi-instance | `late-arrival.service.ts:33-36` (own comment) | Persist to Redis HASH or DB |
| P2-8 | `LeaveService` (`leave/leave.service.ts`) and `DrizzleHrLeaveSvcRepository` form a parallel branch with no HTTP wiring — dead code | `hr.providers.ts:215` registers `LeaveService` but no controller injects it (only the accrual classes are wired) | Delete or remove from providers |
| P2-9 | `RecruitmentFunnelService.moveFunnelStage` HIRED branch uses `candidateId` as placeholder `employeeId` because OnboardingService link isn't wired | `recruitment-funnel.service.ts:151-158` (file's own TODO H.9-FOLLOW-UP) | Add a dedicated `hireCandidate(funnelId, employeeId)` API |
| P2-10 | `RecruitmentFunnelService.drainAggregateEvents` discards typed domain events without forwarding | `recruitment-funnel.service.ts:215-228` (file's own TODO) | Wire the typed events onto `EventEmitter2` channels |
| P2-11 | `LateArrivalFineCron` uses a `EXTRACT EPOCH (..._time - (..._date + ..._time))` over `check_in_date` column that does not exist in canonical schema | `late-arrival-fine.cron.ts:53` (`a.check_in_date::date`) — canonical has `attendance_date`, not `check_in_date` | Rename to `attendance_date` or add migration |
| P2-12 | `DailyReportDeadlineCron` references `a.check_in_date` too | `daily-report-deadline.cron.ts:53` | Same fix |
| P2-13 | `RecruitmentController.quickScreening` REJECTED branch skips the aggregate (no `CandidateRejectedEvent`) | `recruitment-funnel.service.ts:230-261` (own TODO line 230) | Drive the rejection through `aggregate.reject(...)` |

### P3

| # | Issue | Evidence | Fix |
|---|-------|----------|-----|
| P3-1 | Late threshold `'09:15:00'` hardcoded in SQL | `drizzle-attendance.repo.ts:29` | Settings table |
| P3-2 | Fine constants hardcoded | `late-arrival-fine.cron.ts:20-21` | Settings table |
| P3-3 | `attendance.checkIn`/`attendance.date` etc. labelled "Convergence additions (live-DB superset)" on canonical schema (`attendance.ts:32-40`) — indicates intentional column duplication that should be cleaned up post-migration | `lib/db/src/schema/attendance.ts:32-40` | Migration to drop redundant columns once all writers settle on `check_in_time`/`attendance_date` |
| P3-4 | `AttendanceCheckCron` is an empty stub — registered as `@Cron('0 10 * * *')` but does literally nothing | `cron/attendance-check.cron.ts:13-28` | Either delete or implement |
| P3-5 | `HR_TELEGRAM_CHAT_ID` is a single env var — only one HR group can be notified for late arrivals | `late-arrival.service.ts:132` | Support multiple, or route through DB-driven recipient list |
| P3-6 | `hr_leave_requests` has no unique key on `(employee_id, start_date, end_date)` — dual-table sync inserts duplicates | `drizzle-leave.repo.ts:79-80` (own comment) | Add unique index or use upsert |
| P3-7 | Recruitment hook tests exist (`use-hr-recruitment.test.ts`) but the mismatched URLs above suggest tests use the wrong endpoints too | not deeply read | Re-align tests after fixing routes |

---

### Cross-references

* The recruitment / funnel state machine is documented in `apps/api/src/modules/hr/domain/aggregates/funnel.aggregate.ts` (`VALID_TRANSITIONS` exposed via the legacy export at `recruitment-funnel.service.ts:36`).
* The leave aggregate lives at `apps/api/src/modules/hr/domain/aggregates/leave-request.aggregate.ts` (emits `LeaveApprovedEvent` line 145, `LeaveRejectedEvent` line 166).
* The attendance aggregate lives at `apps/api/src/modules/hr/domain/aggregates/attendance.aggregate.ts` (not deeply read this pass).
* The shared `hr.providers.ts` is the single source of truth for which repo implementation backs each DI token — see §2.4 for the leave wiring matrix.
