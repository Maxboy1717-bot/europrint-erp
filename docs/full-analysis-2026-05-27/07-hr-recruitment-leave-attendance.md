# 07 — HR: Recruitment, Leave & Attendance

**Date:** 2026-05-27
**Auditor:** forensic-agent (read-only)
**Scope:** `apps/api/src/modules/hr/recruitment/`, `apps/api/src/modules/hr/leave/`, `apps/api/src/modules/hr/attendance/`

---

## 1. Module Overview

Three sub-modules under `apps/api/src/modules/hr/`:

**Recruitment** — most complete. Has vacancies, pipeline (Kanban), funnel history, probation journal, market analysis, channel publishing, assessment tools (tool test, productivity interview, reference checks), job offers, and analytics. Frontend has a Kanban board.

**Leave** — implemented with CQRS commands for write operations (create, approve, reject, cancel, delete) and QueryBus for reads. Leave balance accrual is automated via cron (`LeaveAccrualJobService`). Two leave table definitions exist (`leave_requests` and `hr_leave_requests`).

**Attendance** — operational check-in/check-out, face-recognition-based entry, territory gateway (WebSocket), late arrival detection. Core attendance table has a **confirmed schema drift**: raw SQL uses `check_in_time text`, ORM uses `checkIn timestamp`.

---

## 2. Page/Screen Inventory

### Recruitment Frontend

| Screen | File |
|--------|------|
| Kanban board grid | `artifacts/erp-dashboard/src/components/recruiting/KanbanBoardGrid.tsx` |
| Kanban column | `artifacts/erp-dashboard/src/components/recruiting/KanbanColumn.tsx` |
| Candidate card | `artifacts/erp-dashboard/src/components/recruiting/CandidateCard.tsx` |
| Draggable candidate card | `artifacts/erp-dashboard/src/components/recruiting/DraggableCandidateCard.tsx` |
| Candidates base table | `artifacts/erp-dashboard/src/components/recruiting/CandidatesBaseTable.tsx` |
| Vacancy filter panel | `artifacts/erp-dashboard/src/components/recruiting/VacancyFilterPanel.tsx` |
| Recruiting header actions | `artifacts/erp-dashboard/src/components/recruiting/RecruitingHeaderActions.tsx` |
| Portret wizard (6 steps) | `artifacts/erp-dashboard/src/components/recruiting/portret/Step*.tsx` |
| Job offer dialog | `artifacts/erp-dashboard/src/components/hr/JobOfferDialog.tsx` |
| Probation journal panel | `artifacts/erp-dashboard/src/components/hr/ProbationJournalPanel.tsx` + entries/dialogs |
| Onboarding roadmap dialog | `artifacts/erp-dashboard/src/components/hr/OnboardingRoadmapDialog.tsx` |
| Labor market sheet | `artifacts/erp-dashboard/src/components/hr/LaborMarketSheet.tsx` |
| IQ scale chart | `artifacts/erp-dashboard/src/components/hr/IQScaleChart.tsx` |

### Leave Frontend (employee profile)

| Screen | File |
|--------|------|
| Leave tab | `artifacts/erp-dashboard/src/pages/employee-profile/LeaveTab.tsx` |
| Leave dialogs | `artifacts/erp-dashboard/src/pages/employee-profile/LeaveTabDialogs.tsx` |
| Leave sections | `artifacts/erp-dashboard/src/pages/employee-profile/LeaveTabSections.tsx` |
| Leave request dialog | `artifacts/erp-dashboard/src/components/employee/dialogs/LeaveRequestDialog.tsx` |
| Sick leave dialog | `artifacts/erp-dashboard/src/components/employee/dialogs/SickLeaveDialog.tsx` |

### Attendance Frontend (employee profile)

| Screen | File |
|--------|------|
| Attendance tab | `artifacts/erp-dashboard/src/pages/employee-profile/AttendanceTab.tsx` |
| Attendance calendar | `artifacts/erp-dashboard/src/pages/employee-profile/AttendanceTabCalendar.tsx` |
| Attendance sections | `artifacts/erp-dashboard/src/pages/employee-profile/AttendanceTabSections.tsx` |

---

## 3. Data Flow Chains

### 3.1 Recruitment — Vacancy List

```
GET /hr/vacancies
  -> HrVacanciesController [hr-vacancies.controller.ts]
  -> HrVacanciesService.findAll()
  -> DrizzleHrVacanciesRepository.findAll()
     SELECT * FROM hr_vacancies (table name inferred -- not confirmed from schema files)
  <- Row[]
```

### 3.2 Recruitment — Pipeline (Kanban)

```
GET /hr/vacancies/pipeline?vacancyId=
  -> HrVacanciesPipelineController [hr-vacancies-pipeline.controller.ts]
  -> HrVacanciesService.findPipeline(vacancyId?)
  -> DrizzleHrVacanciesRepository.findPipeline(vacancyId?)
     SELECT * FROM hr_recruitment_pipeline [unconfirmed table name]
  <- pipeline rows grouped by stage for Kanban

PATCH /hr/vacancies/pipeline/:id/stage
  -> updatePipelineStage(id, stage, userId)
  -> DrizzleHrVacanciesRepository.updatePipelineStage(id, stage, userId)
     UPDATE hr_recruitment_pipeline SET stage=$2, changed_by=$3 WHERE id=$1
  <- updated row

Frontend: KanbanColumn.tsx / DraggableCandidateCard.tsx
  -> onDrop -> moveFunnelStage -> PATCH /hr/vacancies/pipeline/:id/stage
```

### 3.3 Recruitment — Funnel (RecruitmentService / CQRS path)

```
POST /hr/recruitment/funnels
  -> RecruitmentController [recruitment.controller.ts]
  -> RecruitmentService.createFunnel(dto, createdById)
  -> RecruitmentFunnelService.createFunnel(dto, createdById)
  -> DrizzleHrRecruitmentFunnelRepository.createFunnel(...)
     INSERT INTO recruitment_funnels (inferred)

GET /hr/recruitment/funnels/kanban?vacancyId=
  -> RecruitmentService.getFunnelKanban(vacancyId)
  -> RecruitmentFunnelService.getFunnelKanban(vacancyId)

PATCH /hr/recruitment/funnels/:id/stage
  -> RecruitmentService.moveFunnelStage(funnelId, dto, changedById)
  -> RecruitmentFunnelService.moveFunnelStage(...)
```

### 3.4 Recruitment — Vacancy Publish

```
POST /hr/vacancies/:id/publish
  -> HrVacanciesController
  -> HrVacanciesService.publishVacancy(vacancyId, channels, userId)
     [hr-vacancies.service.ts:~60]
  -> for each channel:
       'telegram': eventEmitter.emit('vacancy.published', {...})
         *** Telegram: event only, no direct send ***
       other channels: { status:'queued', message:'...integratsiyasi navbatga qoshildi' }
         *** Non-telegram channels are stubs — queued but never processed ***
  -> repo.recordFunnelHistory(vacancyId, 'channel_published:'+channel, userId)
  <- { vacancyId, title, publishedTo, results }
```

### 3.5 Recruitment — Assessment Tools

```
POST /hr/recruitment/assessments/tool-tests
  -> RecruitmentService.createToolTest(dto, testedById)
  -> RecruitmentAssessmentService.createToolTest(dto, testedById)
  -> DrizzleRecruitmentAssessmentRepository.createToolTest(...)

POST /hr/recruitment/assessments/:toolTestId/match-position/:positionKey
  -> RecruitmentService.matchPositionProfile(toolTestId, positionKey)
  -> *** AI-backed matching -- exact implementation not read ***

POST /hr/recruitment/offers
  -> RecruitmentService.createJobOffer(dto, createdById)
  -> RecruitmentAssessmentService.createJobOffer(dto, createdById)
  -> INSERT INTO recruitment_job_offers (inferred)

PATCH /hr/recruitment/offers/:id/status
  -> RecruitmentService.updateJobOfferStatus(id, dto)
```

### 3.6 Recruitment — Probation

```
GET /hr/vacancies/probation/journal/:pipelineId
  -> HrVacanciesProbationController [hr-vacancies-probation.controller.ts]
  -> HrVacanciesService.findProbationJournal(pipelineId)
  -> repo.findProbationJournal(pipelineId)

GET /hr/vacancies/probation/dates/:pipelineId
  -> HrVacanciesService.findProbationDates(pipelineId)
```

### 3.7 Leave — Create Request

```
POST /hr/leave
  -> HrLeaveController.createLeaveRequest() [hr-leave.controller.ts:77]
  -> @Roles('EMPLOYEE','HR_MANAGER','SUPER_ADMIN','DIRECTOR')
  -> CreateLeaveRequestDtoSchema.parse(body)
  -> commandBus.execute(new CreateLeaveRequestCommand(
       validated.employeeId, userId, validated.leaveType,
       validated.startDate, validated.endDate, validated.reason
     ))
  -> CreateLeaveRequestHandler [application/commands/create-leave-request.command.ts]
     -> leaveRepo OR hrLeaveSvcRepo.create(dto)
        INSERT INTO leave_requests (leaveType, startDate, endDate, status='pending', reason, employeeId, userId)
  <- created row
```

### 3.8 Leave — Approval Flow

```
PATCH /hr/leave/:id/approve
  -> HrLeaveController.approveLeave() [hr-leave.controller.ts:97]
  -> @Roles('HR_MANAGER','SUPER_ADMIN','DIRECTOR')
  -> ApproveLeaveDtoSchema.parse(body)
  -> commandBus.execute(new ApproveLeaveCommand(leaveId, userId, notes))
  -> ApproveLeaveHandler
     -> hrRepo.findLeaveById(leaveId) OR hrLeaveSvcRepo.findById(id)
     -> validate status === 'pending'
     -> UPDATE leave_requests SET status='approved' WHERE id=$1

PATCH /hr/leave/:id/reject
  -> commandBus.execute(new RejectLeaveCommand(leaveId, userId, reason))
  -> UPDATE leave_requests SET status='rejected' WHERE id=$1

PATCH /hr/leave/:id/cancel
  -> commandBus.execute(new CancelLeaveCommand(leaveId, userId))
  -> UPDATE leave_requests SET status='cancelled' (or deleted)

DELETE /hr/leave/:id
  -> commandBus.execute(new DeleteLeaveCommand(id))
  -> soft delete or hard delete
```

### 3.9 Leave — Balance Accrual (automated)

```
LeaveAccrualJobService (cron / @Cron)
  -> hrLeaveSvcRepo.listActiveEmployeesWithHireDate()
     SELECT id, hire_date, is_active FROM hrEmployees WHERE is_active=true
  -> for each employee:
       -> calculateAccrual(hireDate, leaveType) -- business logic
       -> hrLeaveSvcRepo.upsertBalance({employeeId, leaveType, year, total_days, ...})
          INSERT INTO hr_leave_balances ... ON CONFLICT UPDATE
```

### 3.10 Attendance — Check-In

```
POST /hr/attendance/check-in
  -> HrAttendanceController [hr-attendance.controller.ts] (not read -- inferred from service)
  -> AttendanceService.checkIn(userId, dto) [attendance.service.ts:22]
  -> attendanceRepo.checkIn(userId, dto) [drizzle-attendance.repo.ts:52]
     INSERT INTO attendance (employeeId, userId, date, status='present', checkIn=now())
     *** Uses ORM column `checkIn` (timestamp) ***
```

### 3.11 Attendance — Today List with Late Check

```
GET /hr/attendance/today
  -> DrizzleAttendanceRepository.findTodayAll() [drizzle-attendance.repo.ts:25]
     SELECT a.*, e.first_name||' '||e.last_name AS employee_name,
            (a.check_in_time IS NOT NULL AND a.check_in_time::time > '09:15:00'::time) AS is_late
     FROM attendance a JOIN employees e ON e.id = a.employee_id
     WHERE a.attendance_date = $today
     *** Uses raw SQL column `check_in_time` (text) -- SCHEMA DRIFT ***
```

### 3.12 Attendance — Face Recognition

```
POST /hr/attendance/face
  -> AttendanceFaceController [attendance-face.controller.ts]
  -> FaceRecognitionService.recognizeAndCheckIn(imageBuffer)
  -> generate 512-dim embedding from image
  -> DrizzleAttendanceRepository.findEmployeeByEmbedding(vectorLiteral, threshold)
     SELECT id, (face_embedding <=> $vector::vector(512)) AS distance
     FROM hrEmployees WHERE face_embedding IS NOT NULL
     ORDER BY distance LIMIT 1
  -> if distance >= threshold: checkIn(employeeId, ...)
     -> attendanceRepo.checkIn(...)
```

---

## 4. DB Tables & Columns Used

### `attendance` (schema-compat-2.ts:30, also hr_attendance in schema-business-c-2-hr-payroll.ts:43)

**Confirmed schema drift — two definitions:**

| Column | schema-compat-2.ts (ORM) | schema-business-c-2-hr-payroll.ts (raw) |
|--------|--------------------------|------------------------------------------|
| id | integer PK | serial PK |
| employeeId | text | integer (employee_id) |
| userId | integer | (none) |
| date | text | attendance_date date |
| checkIn | timestamp | check_in_time TEXT |
| checkOut | timestamp | check_out_time TEXT |
| status | text | text |
| notes | text | (none) |
| late_minutes | (none) | integer |
| early_leave_minutes | (none) | integer |
| overtime_minutes | (none) | integer |
| source | (none) | text |
| createdAt | timestamp | created_at timestamp |

**The raw SQL in `findTodayAll()` uses `check_in_time` (TEXT) and casts it with `::time` for late detection. The ORM path uses `checkIn` (timestamp). These are different column names on the same table — one of these definitions is wrong with respect to the actual DB schema.**

This is the "known drift" mentioned in the report spec: Drizzle ORM says timestamp, the other Drizzle stub says TEXT, and raw SQL confirms TEXT usage (with `::time` cast).

### `leave_requests` (schema-compat-2.ts:42)

| Column | Type | Notes |
|--------|------|-------|
| id | integer PK | |
| userId | integer | |
| employeeId | text | NOT NULL |
| leaveType | text | NOT NULL |
| startDate | text | NOT NULL |
| endDate | text | NOT NULL |
| status | text | default 'pending' |
| reason | text | nullable |
| approvedBy | text | nullable |
| approvedAt | timestamp | nullable |
| createdAt | timestamp | |
| updatedAt | timestamp | |
| deletedAt | timestamp | soft delete |

**Second definition:** `schema-business-c-2-hr-safety.ts:78` also defines `hr_leave_requests` as a separate table with different columns:
- `hr_leave_requests`: id, employee_id(int), leave_type, start_date, end_date, reason, status, approved_by(int), approved_at, days_requested, days_approved, is_paid, created_at

Two separate tables for leave requests — unclear which is active.

### `hr_leave_balances` (from @workspace/db via schema-ext-b-2.ts:123)

Canonical columns (inferred from `DrizzleHrLeaveSvcRepository.upsertBalance()`):
- `id` (integer PK)
- `employeeId` (integer)
- `leaveType` (text)
- `year` (integer)
- `totalDays` (integer)
- `usedDays` (integer)
- `remainingDays` (integer)
- `updatedAt` (timestamp)

### Recruitment tables (all inferred from repo method names — no Drizzle schema found in files read)

| Inferred table | Used by |
|----------------|---------|
| `hr_vacancies` | DrizzleHrVacanciesRepository |
| `hr_recruitment_pipeline` | DrizzleHrVacanciesFunnelRepository |
| `recruitment_funnels` | DrizzleHrRecruitmentFunnelRepository |
| `recruitment_funnel_history` | repo.recordFunnelHistory() |
| `recruitment_assessments` | DrizzleRecruitmentAssessmentRepository |
| `recruitment_job_offers` | assessmentSvc.createJobOffer() |
| `probation_journal` | repo.findProbationJournal() |

None of these table names were found in any Drizzle schema file read during this audit.

---

## 5. UI Elements & Handlers

### KanbanBoardGrid.tsx / KanbanColumn.tsx

| Element | Handler | Notes |
|---------|---------|-------|
| Kanban columns (stages) | rendered from pipeline data | |
| Drag candidate card | `@dnd-kit/core` drag drop | |
| Drop on column | `moveFunnelStage()` -> PATCH /pipeline/:id/stage | |
| Vacancy filter dropdown | `VacancyFilterPanel` | filters by vacancyId |

### CandidateCard.tsx

| Element | Handler |
|---------|---------|
| Candidate name, position | display |
| Stage badge | display |
| Click to open detail | -> candidate profile modal |

### Portret Wizard (6 steps)

| Step | File | Fields |
|------|------|--------|
| Basic Info | `StepBasicInfo.tsx` | name, position, department |
| Demographics | `StepDemographics.tsx` | age, gender, education |
| Experience | `StepExperience.tsx` | years, skills |
| Duties | `StepDuties.tsx` | responsibilities |
| Conditions | `StepConditions.tsx` | salary range, schedule |
| Tool Test | `StepToolTest.tsx` | assessment tool selection |
| Presentation | `StepPresentation.tsx` | summary review |

### LeaveTab.tsx (employee profile)

| Element | Handler | Notes |
|---------|---------|-------|
| Leave request list | GET /hr/leave?employeeId= | |
| "New Leave Request" button | -> POST /hr/leave | |
| Approve button | PATCH /hr/leave/:id/approve | HR roles only |
| Reject button | PATCH /hr/leave/:id/reject | HR roles only |
| Cancel button | PATCH /hr/leave/:id/cancel | employee own |
| Balance display | GET /hr/leave/balance/:employeeId | |

### AttendanceTab.tsx (employee profile)

| Element | Handler |
|---------|---------|
| Monthly calendar grid | AttendanceTabCalendar.tsx |
| Daily row (date, check-in, check-out, status, late) | display from GET /hr/attendance?employeeId= |
| Stats summary (present days, late days, absent) | AttendanceTabSections.tsx |

---

## 6. What Is Missing or Broken

### Recruitment

1. **Non-Telegram channel publishing is stub (P2):** `publishVacancy()` for LinkedIn, hhuz, uzjob, myjob sets status `'queued'` but no queue processor exists — jobs are never sent. [hr-vacancies.service.ts:~70]

2. **Recruitment table schemas not in Drizzle files (P2):** `hr_vacancies`, `recruitment_funnels`, `hr_recruitment_pipeline`, `recruitment_job_offers` are queried by repos but no Drizzle `pgTable()` definition found in `apps/api/src/shared/db/`. They may be in `@europrint/schemas` library but this is unverified.

3. **`matchPositionProfile` AI integration unknown (P2):** `RecruitmentService.matchPositionProfile(toolTestId, positionKey)` is called but the implementation in `RecruitmentAssessmentService` was not read. May be an AI stub.

4. **Recruitment WebSocket gateway exists but not analyzed (P3):** `recruitment.gateway.ts` was found but not read.

### Leave

5. **Two `leave_requests` tables (P1):** `leave_requests` (schema-compat-2.ts:42) and `hr_leave_requests` (schema-business-c-2-hr-safety.ts:78) both exist with different columns. Leave service imports `leaveRequests` from `schema-compat-2.ts`. The `hr_leave_requests` table may be unused or used by a different module — creating inconsistency.

6. **`startDate` / `endDate` stored as TEXT not DATE (P2):** `leave_requests.startDate` is `text('start_date')` in schema-compat-2.ts. Date range queries and overlap detection will fail without cast. Should be `date` type.

7. **No email/notification on leave approval (P2):** `approve()` in `DrizzleHrLeaveSvcRepository` only does `UPDATE SET status='approved'`. No event is emitted, no notification is sent. The approved employee is never notified.

8. **Leave balance cron schedule not confirmed (P3):** `LeaveAccrualJobService` exists but the cron expression was not read. Unknown if it runs daily, monthly, or yearly.

### Attendance

9. **Schema drift: `check_in_time` (TEXT) vs `checkIn` (timestamp) (P0):** Raw SQL in `findTodayAll()` [drizzle-attendance.repo.ts:25] queries `check_in_time` as TEXT and casts `::time`. ORM in `checkIn()` writes `checkIn: ts('check_in')` (timestamp). These are different column names. One path reads the wrong column or the column doesn't exist. Late detection (`::time > '09:15:00'::time`) will fail if the column is actually a timestamp.

10. **`JOIN employees` in raw SQL — third employee table (P1):** `findTodayAll()` raw SQL joins `FROM attendance a JOIN employees e ON e.id = a.employee_id`. This references an `employees` table which is different from both `users` and `hrEmployees`. A third employee table exists (or attendance data is broken on a DB with only `users`/`hrEmployees`).

11. **Territory WebSocket gateway (P3):** `territory.gateway.ts` exists for real-time location tracking but was not analyzed. Unknown if functional.

12. **Late arrival threshold hardcoded (P3):** `check_in_time::time > '09:15:00'::time` [drizzle-attendance.repo.ts:28] — the 09:15 threshold is hardcoded in SQL. Should be configurable per department/shift.

13. **No check-in duplicate prevention (P2):** `attendanceRepo.checkIn()` inserts a new attendance row without checking for an existing record for the same employee+date. Multiple check-ins per day would create duplicate rows.

---

## Summary

**Recruitment** is the most feature-complete of the three modules: Kanban pipeline, full assessment flow, probation journal, vacancy publication. The main gaps are non-Telegram channels being stubs and recruitment table schemas not found in Drizzle files.

**Leave** has a clean CQRS implementation for writes and automated balance accrual. Critical issues: two competing leave tables with different schemas, date fields stored as TEXT, and no notification on approval/rejection.

**Attendance** has the most severe structural issue: a confirmed schema drift between two Drizzle definitions of the `attendance` table (`check_in_time TEXT` vs `checkIn timestamp`) and a raw SQL join against a third `employees` table. The late-arrival detection logic operates on the TEXT column with a time cast — if the actual DB column is a timestamp, this query silently returns incorrect results.

---

## Gaps Table

| Issue | Severity | Evidence file:line | Impact | Suggested Fix |
|-------|----------|--------------------|--------|---------------|
| attendance check_in_time TEXT vs checkIn timestamp | P0 | `drizzle-attendance.repo.ts:25` raw SQL `check_in_time text`; `schema-compat-2.ts:35` `checkIn: ts('check_in')` | Late detection broken; ORM writes wrong column | Pick one column name/type, run migration, update both code paths |
| JOIN employees (third table) in attendance SQL | P1 | `drizzle-attendance.repo.ts:27` `JOIN employees e` | findTodayAll() breaks if employees table absent | Clarify which table is canonical; update JOIN target |
| Two leave_requests tables | P1 | `schema-compat-2.ts:42`; `schema-business-c-2-hr-safety.ts:78` | Leave data split or duplicated | Consolidate to one table; drop or migrate the other |
| leave startDate/endDate stored as TEXT | P2 | `schema-compat-2.ts:45-46` `text('start_date')` | Date range queries unreliable without cast | Change to `date` type |
| No notification on leave approval | P2 | `drizzle-hr-leave-svc.repo.ts:69` only UPDATE | Employees not informed of approval | Emit event, add notification listener |
| Non-Telegram publish channels are stubs | P2 | `hr-vacancies.service.ts:~70` `status:'queued'` | LinkedIn/hhuz/uzjob vacancies never sent | Implement queue processor or remove from UI |
| Recruitment table schemas not in Drizzle | P2 | grep for hr_vacancies in shared/db = 0 matches | Schema drift risk, migration gaps | Add Drizzle definitions or confirm @europrint/schemas exports |
| No duplicate check-in prevention | P2 | `drizzle-attendance.repo.ts:52` INSERT without check | Multiple attendance rows per employee per day | Add UNIQUE (employee_id, date) constraint or upsert logic |
| Late arrival threshold hardcoded | P3 | `drizzle-attendance.repo.ts:28` `'09:15:00'::time` | Cannot configure by shift/department | Move to settings table |
| Leave balance cron schedule unknown | P3 | `leave-accrual-job.service.ts` exists; schedule not read | May over- or under-accrue | Read and document cron expression |

---

## Open Questions / UNVERIFIED

- What Drizzle schema does `DrizzleHrVacanciesRepository` use? It imports from `@europrint/schemas` — not confirmed.
- Does an `employees` table (distinct from `users` and `hrEmployees`) physically exist in the DB?
- What does `recruitment.gateway.ts` (WebSocket) expose?
- Does `territory.gateway.ts` work independently of attendance check-in?
- What is the actual DB column type for `attendance.check_in_time`? Only a DB `\d attendance` would resolve the drift conclusively.
- Are there `@OnEvent()` listeners for `vacancy.published` in the Telegram bot/notification modules?
- Does `LeaveAccrualJobService` run on a schedule or is it manually triggered?
