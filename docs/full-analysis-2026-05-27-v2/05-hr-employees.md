# Report 05 — HR Employees

**Date:** 2026-05-27 (second pass)
**Auditor:** forensic-agent (read-only)
**Scope:** `apps/api/src/modules/hr/employees/`, `apps/api/src/modules/hr/presentation/hr-employees*.controller.ts`, `apps/api/src/modules/hr/application/hr-employees-ext.service.ts`, `apps/api/src/modules/hr/infrastructure/repositories/drizzle-hr*.repo.ts`, `apps/api/src/modules/hr/infrastructure/repositories/hr-employees-ext.repository.ts`, `apps/api/src/modules/compatibility/employees-compat*.ts`, `artifacts/erp-dashboard/src/pages/Employees.tsx`, `artifacts/erp-dashboard/src/pages/EmployeeProfile.tsx`, `artifacts/erp-dashboard/src/components/employee/dialogs/*`.

---

## Diff vs round 1

Round 1 was directionally aware but materially wrong on the loudest claim. Verifying each:

| Round 1 claim | Verdict | Evidence |
|---|---|---|
| `POST /hr/employees/:employeeId/salary-review` "echoes request, no DB write" (P0/P1) | **FALSE — fixed (or was always wrong)** | `hr-employees.controller.ts:142-184` reads `base_salary`, INSERTs `salary_history` via `hrRepo.savePayroll(...)`, UPDATEs `hrEmployees.base_salary`. See section 3. |
| `GET /hr/employees/:employeeId/documents` returns 501 (P1) | **FALSE — fixed** | `hr-employees-ext.controller.ts:165-171` delegates to `HrEmployeesExtService.getEmployeeDocuments` which selects from `hr_documents` (`hr-employees-ext.repository.ts:177-197`). The 501 inline comment (`hr-employees-ext.controller.ts:11`) is stale narrative left behind from the prior stub. |
| `users` and `hrEmployees` are two unsynchronized tables (P2) | **HALF-TRUE** | Two Drizzle entities, but they're connected via `users.employee_id` FK and `EmployeesCompatService.createEmployee` calls `ensureUserForEmployee(...)` (`employees-org-assignment.helper.ts:97-149`) inside the same transaction. `HrEmployeesController.createEmployee` (the `/hr/employees` route), however, only writes to `hrEmployees` and never creates the linked `users` row. See section 5. |
| `HrEmployeesController` writes to `users` via `DrizzleEmployeesRepository` | **FALSE** | `HrEmployeesController` injects `HR_REPO` (`HrRepository`), which writes to `hrEmployees` (`drizzle-hr-base.repo.ts:127-191`). `EmployeesService` and `DrizzleEmployeesRepository` (which use the `users` table from `@europrint/schemas`) are registered providers (`hr.providers.ts:207-208`) but **no controller injects `EmployeesService`** — dead code. |
| `GetEmployeesQuery` handler not found (P2) | **FALSE** | `application/queries/get-employees.handler.ts:1-43` defines `GetEmployeesHandler` and it is registered in `hr.providers.ts:147-150` (`hrQueryHandlers`). |
| `users.deletedAt` missing in schema-core (P2) | **TRUE, but in the wrong module** | `schema-core.ts:28-56` users has no `deletedAt`. `DrizzleEmployeesRepository.softDelete` (`drizzle-employees.repo.ts:81-86`) imports `users` from `@europrint/schemas` → `schema-compat-1a.ts:9-27` which DOES have `deletedAt`. Both Drizzle entities map to the same PG `'users'` table, so at runtime the column either exists or doesn't — see report 02/03 for the canonical-vs-compat schema fracture. |
| `employee_documents` table missing (P2) | **FALSE** | `hr_documents` table is real (re-exported via `schema-business-a-1.ts:42`, DDL in `migrations-drift.ts:1239-1240`). |
| 8+ tabs with unknown endpoints (P2) | **STALE — partially verified** | DocumentsTab calls `GET /api/hr/employees/:id/documents` (real). `AdaptationTab`, `CareerTab`, `GoalsTab`, `OneOnOneTab`, `HRCapitalTab` all hit `/api/hr/employees/...` paths — out of scope for this report. |

New findings round 1 missed:

- **`GET /hr/employees/:employeeId/operator-stats` is a P1 stub** returning `{ employeeId, totalOps: 0 }` (`hr-employees-ext.controller.ts:197-198`). Frontend `WorkTabSections.tsx:43-45` consumes it.
- **Route shadowing risk:** `GET hr/employees/operator-stats` (`hr-dashboard.controller.ts:234`) collides with `GET hr/employees/:employeeId/operator-stats` (`hr-employees-ext.controller.ts:197`) — Fastify matches whichever registers first.
- **Frontend salary mutation calls a different endpoint than the API exposes:** `EmployeeProfile.tsx:289` posts to `POST /api/employees/:id/salary-history` (compat sub-controller), not `POST /api/hr/employees/:id/salary-review` (the documented canonical). The `hrApi.salaryReview` helper (`lib/api/hr.ts:15-16`) is exported but never invoked anywhere in the dashboard.
- **`HrCreateEmployeeSchema` / `HrUpdateEmployeeSchema` use `.passthrough()`** (`hr.dto.ts:194,205`), so unknown fields slip past Zod validation and land in the repo `dto` — `DrizzleEmployeesRepository.update` does `db.update(users).set(dto as Partial<...>)` (`drizzle-employees.repo.ts:76`) with no allowlist.

---

## 1. Controller & route inventory

The directory `apps/api/src/modules/hr/employees/` contains **only the dead `EmployeesService` + `DrizzleEmployeesRepository` pair** (plus the unused `EmployeeMonthlyCardService`). The HTTP surface for "HR employees" lives in `apps/api/src/modules/hr/presentation/`:

### 1.1 `HrEmployeesController` — `@Controller('hr/employees')`

File: `apps/api/src/modules/hr/presentation/hr-employees.controller.ts`

| # | Method | Path | Handler | Line | Roles | Notes |
|---|--------|------|---------|------|-------|-------|
| 1 | GET | `/hr/employees` | `getEmployees` | 48-60 | HR_MANAGER, HR_SPECIALIST, SUPER_ADMIN, DIRECTOR | CQRS `queryBus.execute(new GetEmployeesQuery(...))` → `GetEmployeesHandler` → `hrRepo.findAllEmployees(...)` over `hrEmployees`. |
| 2 | GET | `/hr/employees/:id` | `getEmployee` | 65-72 | same | `hrRepo.findEmployeeById(id)` joins `hrEmployees` + `hrDepartments` + `hrPositions`. |
| 3 | GET | `/hr/employees/:employeeId/kpi` | `getEmployeeKpi` | 77-91 | HR_SPECIALIST, HR_MANAGER, SUPER_ADMIN, DIRECTOR | Promise.all of `getAttendanceStats(employeeId, period)` + `getLeaveBalance(employeeId)`. |
| 4 | POST | `/hr/employees` | `createEmployee` | 96-108 | HR_MANAGER, SUPER_ADMIN | Zod `HrCreateEmployeeSchema`. `hrRepo.saveEmployee(...)` INSERTs `hrEmployees` + inline audit (`drizzle-hr-base.repo.ts:127-191`). **Does NOT create a linked `users` row** — only the compat route does. |
| 5 | PUT | `/hr/employees/:id` | `updateEmployee` | 114-119 | HR_MANAGER, SUPER_ADMIN | Zod `HrUpdateEmployeeSchema` (`.passthrough()`). `hrRepo.updateEmployee(id, body)`. |
| 6 | PATCH | `/hr/employees/:id/status` | `updateEmployeeStatus` | 124-134 | HR_MANAGER, DIRECTOR, SUPER_ADMIN | Zod `HrUpdateEmployeeStatusSchema` enum `'active'|'on_leave'|'terminated'|'inactive'`. |
| 7 | POST | `/hr/employees/:employeeId/salary-review` | `reviewSalary` | 142-184 | DIRECTOR, SUPER_ADMIN | Zod `HrReviewSalarySchema`. **REAL — reads, INSERTs salary_history, UPDATEs base_salary.** See section 3. |

### 1.2 `HrEmployeesExtController` — `@Controller('hr/employees')` (second class on the same route prefix)

File: `apps/api/src/modules/hr/presentation/hr-employees-ext.controller.ts`

| # | Method | Path | Handler | Line | Roles | Notes |
|---|--------|------|---------|------|-------|-------|
| 1 | POST | `/hr/employees/:id/profile-image` | `updateProfileImage` | 42-52 | HR_MANAGER, HR_SPECIALIST, SUPER_ADMIN, DIRECTOR, EMPLOYEE | Zod `HrUpdateProfileImageSchema`. Writes `hrEmployees.photo_url`. |
| 2 | POST | `/hr/employees/:id/assign-org-functions` | `assignOrgFunctions` | 57-66 | HR_MANAGER, SUPER_ADMIN, DIRECTOR | Zod `HrAssignOrgFunctionsSchema`. Writes `hrEmployees.{department_id,position_id}` via `COALESCE` (`hr-employees-ext.repository.ts:36-45`). |
| 3 | POST | `/hr/employees/import` | `importEmployees` | 71-82 | HR_MANAGER, SUPER_ADMIN | Zod `HrImportEmployeesSchema`. Loops; per-row calls `repo.importEmployee` → `execHrEmployeeImport`. |
| 4 | GET | `/hr/employees/:id/assets` | `getEmployeeAssets` | 87-92 | HR_MANAGER, HR_SPECIALIST, SUPER_ADMIN, DIRECTOR | Raw SQL on `employee_assets`. |
| 5 | POST | `/hr/employees/:id/assets` | `assignAsset` | 98-105 | HR_MANAGER, SUPER_ADMIN | Zod `HrAssignAssetSchema`. INSERTs `employee_assets`. |
| 6 | GET | `/hr/employees/:employeeId/swap-requests` | `getEmployeeSwapRequests` | 110-115 | …, MANAGER | Joins `shift_schedules` + `hrEmployees`. |
| 7 | GET | `/hr/employees/:employeeId/complaints` | `getEmployeeComplaints` | 119-125 | HR_MANAGER, HR_SPECIALIST, SUPER_ADMIN, DIRECTOR | Reads `hr_conflict_reports`. |
| 8 | POST | `/hr/employees/:employeeId/complaints` | `createComplaint` | 131-138 | HR_MANAGER, HR_SPECIALIST, SUPER_ADMIN | Zod `HrCreateComplaintSchema`. INSERTs `hr_conflict_reports`. |
| 9 | GET | `/hr/employees/:employeeId/assessment-skips` | `getAssessmentSkips` | 143-148 | HR_MANAGER, HR_SPECIALIST, SUPER_ADMIN, DIRECTOR | Joins `employee_360_assessments`. |
| 10 | GET | `/hr/employees/list/for-face` | `getEmployeesForFace` | 152-160 | …, admin | List for face-attendance enrollment. |
| 11 | GET | `/hr/employees/:employeeId/documents` | `getEmployeeDocuments` | 165-171 | (controller-level roles) | SELECT from `hr_documents` (`hr-employees-ext.repository.ts:177-197`). **Round 1 said 501 — false now.** |
| 12 | GET | `/hr/employees/:employeeId/documents/:docId` | `getEmployeeDocumentById` | 176-181 | (controller-level roles) | Single-row SELECT. |
| 13 | DELETE | `/hr/employees/:employeeId/documents/:docId` | `deleteEmployeeDocument` | 187-192 | (controller-level roles) | Soft-delete: `UPDATE hr_documents SET status='deleted'`. |
| 14 | GET | `/hr/employees/:employeeId/operator-stats` | `getOperatorStats` | 197-198 | (controller-level roles) | **STUB — returns `{ employeeId, totalOps: 0 }`. No DB read.** |

### 1.3 Also on `/hr/employees`

- `HrEmployeeGoalsController` (`presentation/hr-employee-goals.controller.ts:64` — `@Controller('hr/employees')`). Out of this report's scope.

### 1.4 Also on `/employees` (compat, used by frontend)

- `EmployeesCompatController` (`modules/compatibility/employees-compat.controller.ts:28` — `@Controller('employees')`). Routes: `GET /`, `GET /v2`, `POST /`, `POST /import`, `GET /for-face`, `GET /:id`, `PUT /:id`, `DELETE /:id`, `PATCH /:id/profile-image`, `PUT /:id/profile-image`, `PATCH /:id/org-functions`, `POST /:id/assign-org-functions`, `GET /:id/org-departments`. This is what `Employees.tsx`, `EmployeeDialog.tsx`, and `EmployeeProfile.tsx` actually hit through `/api/employees`.
- `EmployeesCompatSubController` (`employees-compat-sub.controller.ts:32` — `@Controller('employees')`). Provides `:id/passport`, `:id/salary-history`, `:id/sick-leaves`, `:id/monthly-report`, `:id/org-structure`, etc. — what the profile page actually depends on.
- `EmployeesExtraController` (`employees-extra.controller.ts:45` — `@Controller('employees')`).

### 1.5 `EmployeesService` is dead code

Search for `EmployeesService` from `hr/employees/`:

```
hr.providers.ts:87:  import { EmployeesService } from './employees/employees.service';
hr.providers.ts:208:  EmployeesService,
employees/employees.service.ts:26:  export class EmployeesService { ... }
```

No `private … : EmployeesService` constructor injection anywhere in the codebase. It is registered as a provider but no controller (HR or compat) consumes it. `DrizzleEmployeesRepository` (bound to `EMPLOYEES_REPO`, `hr.providers.ts:207`) is therefore reachable only through `EmployeesService`, which means it is also unreachable. The whole `hr/employees/` folder (`employees.service.ts`, `drizzle-employees.repo.ts`, `i-employees.repo.ts`) is **orphan code** — never instantiated, never on the request path.

---

## 2. Service / repository wiring

### 2.1 Wiring graph for `HrEmployeesController`

```
HrEmployeesController            (hr-employees.controller.ts:39)
  └─ @Inject(HR_REPO)            (line 43)
      → HrRepository             (hr.providers.ts:205,206)
         extends HrBaseRepository (drizzle-hr-base.repo.ts:24)
         constructor takes HrLeaveRepo (drizzle-hr-leave.repo.ts)
         table targets:
           - hrEmployees          (schema-misc-app-a.ts:37 → PG `employees`)
           - hrDepartments        (canonicalDepartments)
           - hrPositions          (canonicalPositions)
           - salary_history       (savePayroll/findPayroll)
  └─ CommandBus, QueryBus
      → GetEmployeesHandler      (queries/get-employees.handler.ts:14)
          @Inject(HR_REPO)
          calls hrRepo.findAllEmployees(filters)
```

### 2.2 `findAllEmployees` is real

`drizzle-hr-base.repo.ts:61-109`:

```ts
const [items, counts] = await Promise.all([
  db.select({ id, employee_code, first_name, last_name, middle_name, status, employment_status, hire_date, base_salary, phone_number, email_work, photo_url, department_name, position_name })
    .from(hrEmployees)
    .leftJoin(hrDepartments, eq(hrDepartments.id, hrEmployees.department_id))
    .leftJoin(hrPositions, eq(hrPositions.id, hrEmployees.position_id))
    .where(where).orderBy(hrEmployees.last_name, hrEmployees.first_name)
    .limit(limit).offset(offset),
  db.select({ cnt: sql<number>`COUNT(*)::int` })
    .from(hrEmployees).leftJoin(...).where(where),
]);
```

Filters honour `deleted_at IS NULL`, optional `status`, ILIKE on department name, ILIKE on first/last name and employee_code. Pagination uses `(page-1) * limit`. This is a real implementation. **Round 1 missed that the handler exists.**

### 2.3 `saveEmployee` wraps an INSERT + audit row in a single transaction

`drizzle-hr-base.repo.ts:127-191`:

```ts
const outcome: TxOutcome = await db.transaction(async (tx): Promise<TxOutcome> => {
  const inserted = await tx.insert(hrEmployees).values(empPayload as typeof hrEmployees.$inferInsert).returning();
  const saved = inserted[0];
  if (!saved) return { kind: 'err', message: 'saveEmployee: INSERT returned no row' };
  await tx.execute(sql`
    INSERT INTO audit_logs (id, table_name, record_id, action, new_values, created_at)
    VALUES (gen_random_uuid()::text, 'employees', ${String(saved.id)}, 'CREATE', ${JSON.stringify(empPayload)}::jsonb, NOW())
  `);
  return { kind: 'ok', saved };
});
```

Real INSERT, real audit, real transaction. No stub.

### 2.4 `updateEmployee` is real (uses COALESCE so missing fields stay)

`drizzle-hr-base.repo.ts:193-213`. Standard `db.update(hrEmployees).set({...COALESCE patterns}).where(eq(hrEmployees.id, parseInt(id,10)))`. Returns the updated row.

### 2.5 The orphan repo (`DrizzleEmployeesRepository`) is real Drizzle code too

`drizzle-employees.repo.ts:18-86` (note `users` import resolves through `@europrint/schemas` → `europrint-compat.ts` → `schema-compat-1` → `schema-compat-1a.ts:9-27`, the integer-keyed variant). Every method does a real SELECT/INSERT/UPDATE. The code is fine; the wiring just never points to it.

### 2.6 `EmployeeMonthlyCardService` — also unused by controllers

`employees/employee-monthly-card.service.ts:43-153`. Heavy raw SQL aggregating `attendance`, `hr_disciplinary_actions`, `employee_ledger`, then UPSERT into `employee_monthly_cards` with ON CONFLICT. The service is well-formed but is not in `hr.providers.ts` and is never injected. There is a different `MonthlyReportTab` on the frontend that hits `GET /api/employees/:id/monthly-report` served by `EmployeesCompatSubController.getMonthlyReport` (`employees-compat-sub.controller.ts:231-232`) — a parallel implementation in `employees-compat-profile.service.ts`. This is dead-code duplication.

---

## 3. Salary review endpoint (round 1 P0 — VERIFIED FALSE)

`hr-employees.controller.ts:142-184`:

```ts
@Post(':employeeId/salary-review')
@Roles('DIRECTOR', 'SUPER_ADMIN')
@UsePipes(new ZodValidationPipe(HrReviewSalarySchema))
async reviewSalary(
  @Param('employeeId') employeeId: string,
  @Body() body: HrReviewSalaryDto,
  @CurrentUser() user: AuthenticatedUser,
) {
  // 1. Read current employee to get existing base_salary
  const empResult = await this.hrRepo.findEmployeeById(employeeId);
  assertOk(empResult);
  const emp = empResult.data;

  const currentSalary = emp ? Number(emp['base_salary'] ?? 0) : 0;
  const newSalary      = currentSalary + body.proposedIncrease;
  const today          = _time.now().toISOString().split('T')[0];

  // 2. INSERT into salary_history: record the salary-review entry
  const histResult = await this.hrRepo.savePayroll({
    employeeId:  parseInt(employeeId, 10),
    employee_id: parseInt(employeeId, 10),
    periodStart: today,
    periodEnd:   today,
    baseSalary:  newSalary,
    gross:       newSalary,
    otherBonuses: 0,
    netSalary:    newSalary,
  });
  assertOk(histResult);

  // 3. UPDATE employees.base_salary with the new salary
  const updateResult = await this.hrRepo.updateEmployee(employeeId, { baseSalary: newSalary });
  assertOk(updateResult);

  return {
    message:          "Maosh muvaffaqiyatli yangilandi",
    employeeId,
    previousSalary:   currentSalary,
    newSalary,
    proposedIncrease: body.proposedIncrease,
    reason:           body.reason ?? null,
    reviewedBy:       user?.id ?? null,
    reviewedAt:       _time.now().toISOString(),
  };
}
```

Trace through the repo methods:

- `hrRepo.findEmployeeById` → `drizzle-hr-base.repo.ts:29-59` — SELECT including `base_salary` from `hrEmployees`. Real.
- `hrRepo.savePayroll` → `drizzle-hr.repo.ts:59-75` — INSERT INTO `salary_history` with `employee_id`, `salary_period_start/end`, `base_salary`, `salary_earned`, `total_bonuses`, `other_bonuses`. Real.
- `hrRepo.updateEmployee` → `drizzle-hr-base.repo.ts:193-213` — UPDATE `hrEmployees` SET `base_salary = COALESCE(...)`. Real.

**Verdict:** the P0 from round 1 is wrong. The endpoint actually persists. However, **subtler issues remain**:

| Issue | Severity | Notes |
|---|---|---|
| The three writes (`findEmployeeById`, `savePayroll`, `updateEmployee`) are **NOT wrapped in `db.transaction`** | **P2** | A failure between INSERT into `salary_history` and UPDATE on `hrEmployees.base_salary` leaves the history row pointing at a non-existent salary change. There's no compensating rollback. |
| The endpoint encodes the new salary in `salary_history` as a full **`salary_period_start = today, salary_period_end = today`** row | **P2** | The schema (`salary_history`) was designed to hold payroll periods (see `findPayroll` in `drizzle-hr.repo.ts:30-57`). Stuffing a salary review record into it pollutes payroll queries: `findPayroll` will return this synthetic single-day "period" as if it were a real run, with `salary_earned = total_bonuses = 0` (but `base_salary = newSalary`). No discriminator column (e.g. `record_type = 'review'`) exists. |
| `body.reason` is **accepted by Zod but discarded** — returned in the response but never written to any column | **P2** | `salary_history` has no `notes`/`reason` field per `savePayroll` (`drizzle-hr.repo.ts:61-69`), and the inline comment in the controller says "Carry review metadata in other_bonuses field (0) and notes via reason" — but nothing actually carries it. Audit trail loses the reason. |
| `reviewedBy` is returned in the response but **never persisted** | **P2** | The compat audit interceptor wraps the request as an envelope, but the per-row "who approved this raise" data is gone. |
| The check on `body.proposedIncrease > 0` (Zod `.positive()`) means **salary cuts cannot be recorded** through this endpoint | **P3** | Schema: `HrReviewSalarySchema = z.object({ proposedIncrease: z.number().positive(), … })` (`hr.dto.ts:29-32`). |
| **Frontend never calls this endpoint** | **P1** | `hrApi.salaryReview` (`lib/api/hr.ts:15-16`) is defined and exported but `Grep` finds no consumers. The actual UI for salary edits (`EmployeeProfile.tsx:289` `saveSalaryChangeMutation`) POSTs `/api/employees/:id/salary-history` (the compat sub-controller, `employees-compat-sub.controller.ts:220-221`). So the canonical "Director-only salary review" workflow is **never triggered** from the dashboard. |

---

## 4. Documents endpoint (round 1 said 501 — VERIFIED FALSE)

The 501 is dead; the endpoint is real.

### 4.1 The misleading comment

`hr-employees-ext.controller.ts:10-11`:

```ts
// P3-26: employee-documents endpoints aren't yet wired; return 501 so the
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
```

This is a dangling comment from the prior stub implementation (the comment is even truncated — it precedes an unrelated import). The 501 it describes no longer exists in this controller.

### 4.2 The real implementation

`hr-employees-ext.controller.ts:165-171`:

```ts
@Get(':employeeId/documents')
async getEmployeeDocuments(@Param('employeeId') employeeId: string) {
  // P3-26: hr_documents table has employee_id FK. Returns docs for this employee.
  const result = await this.svc.getEmployeeDocuments(employeeId);
  if (!result || !result.ok) return { data: [] };
  return { data: Array.isArray(result.data) ? result.data : [] };
}
```

Service: `HrEmployeesExtService.getEmployeeDocuments` (`hr-employees-ext.service.ts:58-60`) → `repo.getEmployeeDocuments(safeInt(employeeId, 0))`.

Repo: `hr-employees-ext.repository.ts:177-197`:

```ts
async getEmployeeDocuments(employeeId: number): Promise<Result<Row[]>> {
  return safeCall(async () => {
    const rows = await db.select({
      id: hr_documents.id, document_type: hr_documents.documentType, title: hr_documents.title,
      status: hr_documents.status, employee_id: hr_documents.employeeId,
      initiated_by: hr_documents.initiatedBy, total_steps: hr_documents.totalSteps,
      current_step: hr_documents.currentStep, created_at: hr_documents.createdAt,
      updated_at: hr_documents.updatedAt,
    })
      .from(hr_documents)
      .where(eq(hr_documents.employeeId, employeeId))
      .orderBy(sql`${hr_documents.createdAt} DESC`)
      .limit(100);
    return castTo<Row[]>(rows);
  }, 'DB_ERROR');
}
```

`hr_documents` is exported through `schema-business-a-1.ts:42` (`hrDocuments as hr_documents` from `@workspace/db`) and has a CREATE-TABLE invariant at `migrations-drift.ts:1239-1240`.

### 4.3 Issue that remains

The controller pattern `if (!result || !result.ok) return { data: [] }` (`hr-employees-ext.controller.ts:169`) **swallows DB errors as an empty list** instead of returning 5xx. A failing DB lookup looks identical to an employee with no documents. The DELETE endpoint at line 190 does the same: `return { message: 'Document not found or already deleted', deleted: false }`. This means destructive failures (e.g. update succeeded but RETURNING returned empty) come back as 200 OK with `deleted: false` — the UI cannot distinguish "no such document" from "DB failed". **P2.**

---

## 5. Dual employee tables (`users` vs `hrEmployees`)

### 5.1 Both tables exist with overlapping but non-identical shapes

`hrEmployees` (`schema-misc-app-a.ts:37-69`) maps to PG table **`employees`** (not `hr_employees`):

```ts
export const hrEmployees = pgTable('employees', {
  id: integer('id').primaryKey(),
  user_id: integer('user_id'),                  // ← link to users
  employee_code: varchar('employee_code'),
  first_name, last_name, middle_name: varchar(...),
  department_id, position_id: integer(...),
  status, employment_status, employment_type: varchar(...),
  is_active, is_blocked: boolean(...),
  telegram_chat_id: varchar(...),
  hire_date: date(...),
  base_salary: text(...),
  phone_number, email_work: varchar(...),
  gender, date_of_birth, birth_date,
  manager_id: integer(...),
  photo_url: text(...),
  face_embedding: pgVector('face_embedding', 512),
  face_embedding_updated_at, created_at, updated_at, deleted_at,
});
```

Three different `users` Drizzle entities map to the PG **`users`** table:

| Module | Path | Type of `id` | Has `deletedAt` | Has `departmentId` | Has `status` | Has `employee_id` FK? |
|---|---|---|---|---|---|---|
| `schema-core.ts:28-56` | canonical | `uuid` | NO | NO | NO | NO |
| `schema-compat-1a.ts:9-27` (from `@europrint/schemas`) | compat | `integer` | YES | YES | YES | NO |
| `schema-misc-app-a.ts:19-35` (`appUsers`) | compat-2 | `integer` | YES | YES | YES | YES (`employee_id`) |

Plus the raw INSERT in `employees-org-assignment.helper.ts:130-144` references columns (`username, email, password_hash, first_name, last_name, full_name, employee_id, role, status, is_active, department_id, position_id, phone, hire_date`) that match **none** of the three Drizzle entities exactly — `schema-core.ts` has no `first_name`/`last_name`/`employee_id`/`department_id`/`position_id`/`hire_date`; `schema-compat-1a.ts` has no `first_name`/`last_name`/`employee_id`/`hire_date`. Whether this INSERT succeeds depends on the live DDL, which `migrations-drift.ts` is supposed to keep aligned but report 03 documents drift. **P1.**

### 5.2 Sync code DOES exist (round 1 said none)

`employees-org-assignment.helper.ts:97-149` — `ensureUserForEmployee(tx, data)`:

1. SELECT id FROM users WHERE `employee_id = :empId` LIMIT 1.
2. If exists, return it.
3. Otherwise INSERT a new `users` row with `employee_id = :empId`, `password_hash = '!' + 40-hex` (intentionally invalid bcrypt → locked account), and role derived from `position_id`.

`EmployeesCompatService.createEmployee` (`employees-compat.service.ts:166-194`) calls `ensureUserForEmployee` inside a `db.transaction(...)` callback **right after** `insertEmployeeRow(tx, a)`. So **POST /api/employees DOES create both rows atomically**.

### 5.3 But the HR canonical route does NOT

`HrEmployeesController.createEmployee` (`hr-employees.controller.ts:99-108`) calls `hrRepo.saveEmployee(...)` directly → `HrBaseRepository.saveEmployee` (`drizzle-hr-base.repo.ts:127-191`) — INSERTs only into `hrEmployees` + `audit_logs`. **No `users` row is created.**

Practical consequence: an employee created through `POST /hr/employees` (the route advertised in the HR Swagger) cannot log in, cannot be looked up by `users.employee_id`, cannot have org assignments (which key on `users.id` via `employee_org_departments.user_id`, `employees-org-assignment.helper.ts:165`), and will fail in any downstream service that joins through `users`. The two HR routes have diverged silently. **P1.**

### 5.4 Update / delete paths also diverge

- `PUT /hr/employees/:id` → `hrRepo.updateEmployee` → UPDATE only `hrEmployees`. The linked `users` row keeps its stale `first_name`, `last_name`, `phone`, `department_id`, `position_id`.
- `PUT /api/employees/:id` (compat) → `EmployeesCompatService.updateEmployee` (`employees-compat.service.ts:196-214`) UPDATEs `employees` and re-syncs `employee_org_departments` — but **also does not write back to the `users` row** for name/phone/department changes (it only re-syncs org assignments). So even compat suffers a partial-sync problem on update.

### 5.5 Frontend integration assumes the compat path

`Employees.tsx:94` — `queryKey: ["/api/employees"]` (compat).
`EmployeeProfile.tsx:285-299` — all mutations POST to `/api/employees/:id/...` (compat sub-controller).
`hrApi.createEmployee` / `hrApi.updateEmployee` in `lib/api/hr.ts:9-12` exist but the only call site I could find is **inside `EditPersonalCardDialogs.tsx`** indirectly. The 14 dialogs under `components/employee/dialogs/` all hand `onSave` to the parent profile, which uses the `/api/employees/...` path. The `/hr/employees` routes are effectively used only by Swagger / explicit programmatic clients (e.g. `apiClient.ts` route table).

---

## 6. DTO validation

### 6.1 Schemas exist and are wired

`presentation/dto/hr.dto.ts` defines Zod schemas for every write route on `HrEmployeesController` and `HrEmployeesExtController`. Each route applies them with `@UsePipes(new ZodValidationPipe(...))`:

| Route | DTO | File:line |
|---|---|---|
| `POST /hr/employees` | `HrCreateEmployeeSchema` | `hr.dto.ts:185-195` |
| `PUT /hr/employees/:id` | `HrUpdateEmployeeSchema` | `hr.dto.ts:197-206` |
| `PATCH /hr/employees/:id/status` | `HrUpdateEmployeeStatusSchema` | `hr.dto.ts:24-27` |
| `POST /hr/employees/:id/salary-review` | `HrReviewSalarySchema` | `hr.dto.ts:29-33` |
| `POST /hr/employees/:id/profile-image` | `HrUpdateProfileImageSchema` | `hr.dto.ts:35-38` |
| `POST /hr/employees/:id/assign-org-functions` | `HrAssignOrgFunctionsSchema` | `hr.dto.ts:40-45` |
| `POST /hr/employees/import` | `HrImportEmployeesSchema` | `hr.dto.ts:47-50` |
| `POST /hr/employees/:id/assets` | `HrAssignAssetSchema` | `hr.dto.ts:208-215` |
| `POST /hr/employees/:id/complaints` | `HrCreateComplaintSchema` | `hr.dto.ts:217-222` |

GET routes are not validated (params are taken as strings).

### 6.2 Real-world holes in those schemas

`HrCreateEmployeeSchema` (`hr.dto.ts:185-195`):

```ts
export const HrCreateEmployeeSchema = z.object({
  firstName, lastName: z.string().min(1).max(MAX_NAME_LENGTH).optional(),
  departmentId, positionId: z.string().optional(),
  employeeCode: z.string().optional(),
  hireDate: z.string().optional(),
  salary: z.number().positive().optional(),
  employmentStatus: z.string().optional(),
}).passthrough();
```

**Issues:**

- **`firstName` and `lastName` are `.optional()`.** Combined with `.passthrough()`, you can `POST /hr/employees` with `{}` and pass validation. The downstream `saveEmployee` will INSERT a row with empty `first_name`/`last_name` (`drizzle-hr-base.repo.ts:131-132` coerces to `''`).
- **`.passthrough()` lets arbitrary keys through to the repo.** The repo's `update` method does `db.update(users).set(dto as Partial<typeof users.$inferInsert>)` (`drizzle-employees.repo.ts:76`) — though that's the orphan repo. The HR repo's `updateEmployee` only reads known fields with COALESCE so passthrough is harmless there. But the import endpoint (`hr-employees-ext.controller.ts:74-82`) loops `body.employees` (typed as `z.record(z.string(), z.unknown())`) and passes each row to `execHrEmployeeImport(emp)` — no schema on the row level at all.
- **`departmentId` and `positionId` are `z.string().optional()`** — but `hrEmployees.department_id` is `integer`. Mismatch is tolerated by Drizzle's COALESCE cast, but invalid integer strings would fail at runtime.
- `HrAssignOrgFunctionsSchema` (`hr.dto.ts:40-45`) accepts `{ nodeId?: string, departmentId?: string, positionId?: string }` — all optional. Posting `{}` is valid and produces an UPDATE that COALESCEs every column to itself. No-op, but also no 400.
- `HrUpdateEmployeeStatusSchema` (`hr.dto.ts:24-27`) restricts status to `'active' | 'on_leave' | 'terminated' | 'inactive'`. But `EmployeeDialog.tsx` references `'sick'` as a status; the dashboard's "Kasalxonada" status (`status === 'sick'`) cannot be set through this canonical endpoint. **P3 — UI/API enum drift.**

### 6.3 No request-size limits, no DDoS protection per-route

The DTOs use `MAX_NAME_LENGTH` and `MAX_NOTES_LENGTH` constants for `string.max(...)`, but `HrImportEmployeesSchema.employees` is `z.array(z.record(z.string(), z.unknown())).optional()` with **no `.max(n)` on the array**. A single POST can import an unbounded number of rows. **P2.**

---

## 7. Stubs & hardcoded responses

`Grep` of `Math.random|notImplemented|TODO|FIXME` across:

- `apps/api/src/modules/hr/employees/` — none.
- `hr-employees.controller.ts` — none.
- `hr-employees-ext.controller.ts` — none of the keywords, but the body of `getOperatorStats` IS a hardcoded stub.

### 7.1 Confirmed stubs

| Route | File:line | Stub returns | Frontend consumer |
|---|---|---|---|
| `GET /hr/employees/:employeeId/operator-stats` | `hr-employees-ext.controller.ts:197-198` | `{ employeeId, totalOps: 0 }` (one-liner, no service call) | `WorkTabSections.tsx:43-45` (`useQuery` of `/api/hr/employees/:id/operator-stats`) |
| `GET /hr/employees/operator-stats` | `hr-dashboard.controller.ts:234-237` | `{ stats: null }` | `HRDashboard.tsx:144-145` reads `dailyStats?.operatorStats?.{submitted,total}` — always undefined → defaults to 0 |

### 7.2 Route collision

Both routes start with `hr/employees/`:

- `:employeeId/operator-stats` (parameterised)
- `operator-stats` (literal)

Fastify resolves these by registration order. The literal route registers in `HrDashboardController` (`hr-dashboard.controller.ts:234`), the parametric in `HrEmployeesExtController`. With Nest, the controller registered first wins for the literal segment. Manual testing required to see which one a request like `GET /hr/employees/operator-stats` lands on — frontend treats `operator-stats` as a literal segment only on the dashboard page. **P2.**

### 7.3 Soft-swallowed errors

`hr-employees-ext.controller.ts:169` — `if (!result || !result.ok) return { data: [] };` masks DB errors.
`hr-employees-ext.controller.ts:179` — same pattern for single-doc lookup.
`hr-employees-ext.controller.ts:190-191` — DELETE returns `{ deleted: false }` instead of a 5xx on failure.

No `Math.random()` anywhere in the employees module. No `notImplemented()` either (that helper is only used in `hr-dashboard-stubs.controller.ts`, which is **commented out of `hrControllers`** in `hr.providers.ts:162-169` — those routes are not wired).

---

## 8. Frontend integration

### 8.1 List page — `pages/Employees.tsx`

- Hits `GET /api/employees` (line 94, `queryKey: ["/api/employees"]`) → `EmployeesCompatController.listEmployees` (`employees-compat.controller.ts:43-57`).
- Expected response shape: `{ items: EmployeeRow[]; total: number }`. The compat controller returns exactly this.
- The `EmployeeRow` interface (lines 39-60) expects camelCase fields: `fullName`, `employeeId`, `telegramChatId`, `birthDate`, `hireDate`, `address`, `attestationDate`, `orgDepartmentId`, `orgDepartmentName`, `orgPositionName`, `phone`, `coursesTotal`, `rating`, `bonusAmount`, `status`, `failedTests`, `disciplineCount`, `profileImageUrl`.
- The compat controller returns snake_case (`first_name`, `last_name`, `employee_code`, `phone_number`, `photo_url`, `department_name`, `position_name`). Field-name drift — fields like `coursesTotal`, `rating`, `bonusAmount`, `failedTests`, `disciplineCount` are not in the SELECT at all. The list page therefore renders empty / placeholder for those columns. **P2 — quiet data loss between API and UI.**

### 8.2 Create / Edit dialog — `components/EmployeeDialog.tsx`

- Uses `useEmployeeMutation` hook (not read here) wrapping `apiRequest` to `POST /api/employees` or `PUT /api/employees/:id`. Hits compat, **so the linked `users` row is created via `ensureUserForEmployee`**. The HR canonical route at `POST /hr/employees` is **not** what the UI hits.
- Includes `OrgStructureSection` with multi-select for `org_department_ids`, which the compat service writes to `employee_org_departments` table. The HR ext controller's `assign-org-functions` only writes one department/position pair into `hrEmployees` — a different model.

### 8.3 Profile page — `pages/EmployeeProfile.tsx`

All 14 mutations POST/PATCH to `/api/employees/:id/{passport, bank-accounts, emergency-contacts, contracts, salary-history, bonuses, fines, overtime, cash-advances, leave-requests, sick-leaves, business-trips, set-password}` (`EmployeeProfile.tsx:285-299`). Every one of these is served by `EmployeesCompatSubController` — **not** by anything in `hr/employees/` or `hr/presentation/`.

`updateEmployeeMutation` (line 299) uses `PATCH /api/employees/:id` with arbitrary `editForm` fields. Compat `PATCH` is not in the compat controller's route table (`employees-compat.controller.ts`) — only `PUT`. **Either the request 404s or there is a separate PATCH handler not yet found.** Worth checking before claiming the profile edit dialog works.

### 8.4 Documents tab — `pages/employee-profile/DocumentsTab.tsx`

- `GET /api/hr/employees/${employeeId}/documents` (line 89) — hits `HrEmployeesExtController.getEmployeeDocuments`. Real SELECT from `hr_documents`.
- `DELETE /api/hr/employees/${employeeId}/documents/${docId}` (line 125) — hits the soft-delete handler. Real UPDATE.

### 8.5 Work tab — `pages/employee-profile/WorkTabSections.tsx`

- `GET /api/hr/employees/${employeeId}/operator-stats` (line 45) — hits the stub returning `{ employeeId, totalOps: 0 }`. The UI is wired to a dead endpoint. **P1.**

### 8.6 Salary dialog mismatch

`SalaryDialog.tsx` (interface at line 15-21) submits `{ effectiveDate, previousSalary, newSalary, changeType, notes }`. The parent's mutation (`EmployeeProfile.tsx:289`) POSTs that body to `/api/employees/:id/salary-history` (compat sub-controller). The canonical `POST /api/hr/employees/:id/salary-review` (`HrReviewSalarySchema = { proposedIncrease, reason? }`) is **never called** from the UI. The two endpoints have different semantics, different role gates (compat is HR_ROLES; canonical is DIRECTOR/SUPER_ADMIN), and different audit guarantees.

### 8.7 Onboarding integration

`OnboardingController` (`apps/api/src/modules/hr/onboarding/onboarding.controller.ts:49` — `@Controller('hr/onboarding')`) is wired in `hrProviders` (line 225 of `hr.providers.ts`). Onboarding tables key off `employeeId` (e.g. `OnboardingService.startEmployeeOnboarding`, line 91 of `onboarding.service.ts`: `this.hrOnboardingRepo.findEmployeeById(dto.employeeId)`). That `findEmployeeById` reads from `hrEmployees` (the same `employees` PG table). So onboarding is consistent with the canonical HR write path — but, because the canonical create route doesn't materialise a `users` row, an onboarding subject created through `POST /hr/employees` won't have a login account or org assignments. Onboarding succeeds at the table level but the new hire has no path into the system. Frontend `HROnboarding.tsx` and `OnboardingRoadmapDialog.tsx` both consume `/api/hr/employees/...` shapes.

---

## 9. Findings summary

### P0 (data-loss or hard-broken)

None confirmed in the employees module after this pass. Round 1's salary-review P0 was incorrect.

### P1

| # | Issue | Evidence |
|---|---|---|
| P1-1 | `GET /hr/employees/:employeeId/operator-stats` is a hardcoded stub returning `{ employeeId, totalOps: 0 }`. Frontend `WorkTabSections.tsx:43-45` is wired to it — Work tab shows zeros for every employee. | `hr-employees-ext.controller.ts:197-198` |
| P1-2 | `POST /hr/employees` creates an `hrEmployees` row but never the linked `users` row, so employees onboarded through the canonical HR route cannot log in, cannot be assigned to `org_departments`, and break joins through `users.employee_id`. The compat route `POST /api/employees` does both — divergence between two HR write paths. | `hr-employees.controller.ts:99-108` vs `employees-compat.service.ts:166-194` + `employees-org-assignment.helper.ts:97-149` |
| P1-3 | Frontend salary-edit UI bypasses the canonical Director-only `POST /hr/employees/:id/salary-review` and instead POSTs to compat `POST /api/employees/:id/salary-history` with an open role list. The Director-only audit/role gate is unenforced in practice. | `EmployeeProfile.tsx:289` → `employees-compat-sub.controller.ts:220-221`; `hr.dto.ts:29-33`; `hr-employees.controller.ts:140` `@Roles('DIRECTOR','SUPER_ADMIN')` |
| P1-4 | Raw `INSERT INTO users(...)` in `ensureUserForEmployee` (`employees-org-assignment.helper.ts:130-144`) writes columns (`first_name`, `last_name`, `employee_id`, `hire_date`) that exist in **none** of the three `users` Drizzle entities consistently. Whether this INSERT succeeds depends on live DDL drift. | helper:130-144 vs `schema-core.ts:28-56`, `schema-compat-1a.ts:9-27`, `schema-misc-app-a.ts:19-35` |

### P2

| # | Issue | Evidence |
|---|---|---|
| P2-1 | `reviewSalary` is NOT wrapped in `db.transaction(...)`. A failure between INSERT into `salary_history` and UPDATE of `hrEmployees.base_salary` leaves the system inconsistent. | `hr-employees.controller.ts:142-184` |
| P2-2 | `reviewSalary` stores the review as a fake one-day `salary_history` period; `body.reason` and `reviewedBy` are returned in the response but never persisted. Audit trail is partial. | `hr-employees.controller.ts:155-183`; `drizzle-hr.repo.ts:59-75` |
| P2-3 | Two `GET /hr/employees/operator-stats` route shapes register (`hr-dashboard.controller.ts:234`, `hr-employees-ext.controller.ts:197`). Fastify resolves by registration order; the literal route may shadow the parametric one or vice versa. | both controllers above |
| P2-4 | Compat `GET /api/employees` returns snake_case + omits `coursesTotal`/`rating`/`bonusAmount`/`failedTests`/`disciplineCount` that `Employees.tsx`'s `EmployeeRow` interface expects (`Employees.tsx:39-60`). UI silently shows placeholders. | `Employees.tsx:39-60` vs `employees-compat.service.ts:30-52` |
| P2-5 | `getEmployeeDocuments` / `getEmployeeDocumentById` / `deleteEmployeeDocument` swallow DB errors as `{ data: [] }` or `{ deleted: false }`. Failures look like "no data". | `hr-employees-ext.controller.ts:169,179,190-191` |
| P2-6 | `HrImportEmployeesSchema.employees` has no `.max(n)` (`hr.dto.ts:47-50`). Unbounded array, per-row schema is `z.record(z.string(), z.unknown())` — no validation on the row level. The loop in `hr-employees-ext.controller.ts:75-81` calls `repo.importEmployee` synchronously, so a 10k-row import will block the event loop. | `hr.dto.ts:47-50`; `hr-employees-ext.controller.ts:71-82` |
| P2-7 | `users.deletedAt` is referenced by `DrizzleEmployeesRepository.softDelete` (`drizzle-employees.repo.ts:83`) but does not exist on `schema-core.ts:28-56` (only on the compat variants). Soft delete depends on whichever Drizzle entity wins at import resolution — the codebase has three of them. The orphan-code status of this repo means it's not a live bug today, but it's a landmine for anyone who wires it in. | `schema-core.ts:28-56` vs `schema-compat-1a.ts:9-27` |
| P2-8 | `EmployeesService`, `DrizzleEmployeesRepository`, and `EmployeeMonthlyCardService` in `hr/employees/` are dead code — registered in `hr.providers.ts:207-208` but injected by no controller. `MonthlyReportTab` instead consumes a duplicate implementation in `employees-compat-profile.service.ts`. Code-rot, dual implementations of the same monthly card. | `hr.providers.ts:207-208`; `employee-monthly-card.service.ts:43-153`; `employees-compat-sub.controller.ts:231-232` |
| P2-9 | `EmployeeProfile.tsx:299` PATCHes `/api/employees/:id` — but `EmployeesCompatController` only defines `PUT :id` (`employees-compat.controller.ts:109-112`). Likely 404 unless served by another compat controller; needs verification. | `EmployeeProfile.tsx:299` vs `employees-compat.controller.ts` |

### P3

| # | Issue | Evidence |
|---|---|---|
| P3-1 | `HrUpdateEmployeeStatusSchema` enum (`'active'|'on_leave'|'terminated'|'inactive'`) doesn't include `'sick'`, but the frontend EditEmployeeDialog lists `'sick'` as a selectable status ("Kasalxonada"). The canonical PATCH endpoint will 400 on that value. | `hr.dto.ts:24-27` |
| P3-2 | `HrReviewSalarySchema.proposedIncrease.positive()` blocks salary cuts. Negative reviews must use a different path. | `hr.dto.ts:29-33` |
| P3-3 | `HrCreateEmployeeSchema` has `firstName` / `lastName` as `.optional()` AND `.passthrough()`. Empty body passes validation, INSERTs a row with empty names. | `hr.dto.ts:185-195`; `drizzle-hr-base.repo.ts:131-132` |
| P3-4 | Dead comment "P3-26: employee-documents endpoints aren't yet wired; return 501" (`hr-employees-ext.controller.ts:11`) misleads anyone reading the file. The 501 was removed. | `hr-employees-ext.controller.ts:10-11` |
| P3-5 | `appUsers` (`schema-misc-app-a.ts:19-35`) is a third Drizzle entity for the `users` table — adding to the schema-core / schema-compat-1a fracture documented in reports 02/03. None of these define `username`, but the raw INSERT in the org helper uses `username`. | `schema-misc-app-a.ts:19-35` |

---

## Appendix A — Files read for this report

```
apps/api/src/modules/hr/employees/employees.service.ts                                 (195 lines)
apps/api/src/modules/hr/employees/drizzle-employees.repo.ts                            (87 lines)
apps/api/src/modules/hr/employees/i-employees.repo.ts                                  (19 lines)
apps/api/src/modules/hr/employees/employee-monthly-card.service.ts                     (153 lines)
apps/api/src/modules/hr/presentation/hr-employees.controller.ts                        (185 lines, full)
apps/api/src/modules/hr/presentation/hr-employees-ext.controller.ts                    (199 lines, full)
apps/api/src/modules/hr/presentation/dto/hr.dto.ts                                     (236 lines, full)
apps/api/src/modules/hr/application/hr-employees-ext.service.ts                        (69 lines, full)
apps/api/src/modules/hr/application/queries/get-employees.handler.ts                   (43 lines, full)
apps/api/src/modules/hr/application/queries/get-employees.query.ts                     (13 lines, full)
apps/api/src/modules/hr/domain/repositories/i-hr.repo.ts                               (78 lines, full)
apps/api/src/modules/hr/infrastructure/repositories/drizzle-hr.repo.ts                 (278 lines, full)
apps/api/src/modules/hr/infrastructure/repositories/drizzle-hr-base.repo.ts            (252 lines, full)
apps/api/src/modules/hr/infrastructure/repositories/hr-employees-ext.repository.ts     (230 lines, full)
apps/api/src/modules/hr/hr.providers.ts                                                 (lines 1-230 sampled)
apps/api/src/modules/hr/onboarding/onboarding.controller.ts                            (lines 1-80, plus grep)
apps/api/src/modules/hr/onboarding/onboarding.service.ts                               (grep only)
apps/api/src/modules/compatibility/employees-compat.controller.ts                      (164 lines, full)
apps/api/src/modules/compatibility/employees-compat.service.ts                         (lines 1-230 sampled)
apps/api/src/modules/compatibility/employees-org-assignment.helper.ts                  (220 lines, full)
apps/api/src/modules/compatibility/employees-compat-sub.controller.ts                  (lines 210-240)
apps/api/src/modules/hr/presentation/hr-dashboard.controller.ts                        (lines 225-248)
apps/api/src/shared/db/schema-core.ts                                                  (lines 1-80)
apps/api/src/shared/db/schema-compat-1a.ts                                             (164 lines)
apps/api/src/shared/db/schema-misc-app-a.ts                                            (lines 1-120)
apps/api/src/shared/db/europrint-compat.ts                                             (60 lines, full)
artifacts/erp-dashboard/src/pages/Employees.tsx                                        (lines 1-120)
artifacts/erp-dashboard/src/pages/EmployeeProfile.tsx                                  (lines 1-80, 285-335)
artifacts/erp-dashboard/src/components/employee/dialogs/SalaryDialog.tsx               (lines 1-80)
artifacts/erp-dashboard/src/components/EmployeeDialog.tsx                              (lines 1-60)
artifacts/erp-dashboard/src/lib/api/hr.ts                                              (lines 1-40)
```

## Appendix B — Things NOT verified (call them out if needed)

- Whether `PATCH /api/employees/:id` is served by **some** compat controller. Only `PUT` was found in `employees-compat.controller.ts`. The frontend `updateEmployeeMutation` (`EmployeeProfile.tsx:299`) PATCHes. Suspected 404.
- Live database column shape — `migrations-drift.ts` is supposed to enforce it but report 03 documents drift.
- Whether `HrEmployeesExtRepository.importEmployee` (`execHrEmployeeImport`) validates each row.
- Whether `EmployeesExtraController` adds yet more conflicting `/employees` routes.
- The actual rendering path of `WorkTabSections.tsx` `operator-stats` data (whether the UI shows zeros or hides the panel).
- Per-tab content of `AdaptationTab`, `CareerTab`, `GoalsTab`, `OneOnOneTab`, `HRCapitalTab`, `TechAccessTab`, `OffboardingTab`, `MachineOperatorTab` — out of scope for this report.
