# 05 — HR: Employees

**Date:** 2026-05-27
**Auditor:** forensic-agent (read-only)
**Scope:** `apps/api/src/modules/hr/`, `artifacts/erp-dashboard/src/`

---

## 1. Module Overview

The employee module is split across two persistence models:

- **`users` table** (schema-core.ts) — used by `DrizzleEmployeesRepository` (hr/employees/) for listing/CRUD via `@europrint/schemas` import.
- **`hrEmployees` table** (`@workspace/db` / lib/db) — used by attendance, leave balance, face embedding, and org assignment logic.

Both tables appear to represent "employees" but have different columns, creating an impedance mismatch. The `users` table is the primary CRUD target; `hrEmployees` is used for operational (attendance, biometrics) data.

Backend is layered:
- `HrEmployeesController` — CQRS (GET queries via QueryBus, writes via hrRepo directly)
- `HrEmployeesExtController` — extended operations (profile image, org assignment, assets, complaints)
- `EmployeesService` — alternative service layer using `DrizzleEmployeesRepository` directly (non-CQRS path)
- `DrizzleHrPayrollRepository` uses `salaryHistory`, `payrollPeriods`, `payrollRows`

---

## 2. Page/Screen Inventory

| Screen | File | Route URL |
|--------|------|-----------|
| Employee profile (17 tabs) | `artifacts/erp-dashboard/src/pages/employee-profile/` (65 files) | `/employees/:id` or `/hr/employee/:id` |
| Employee list (component) | `artifacts/erp-dashboard/src/components/employee/` | embedded in HR dashboard |
| Edit employee dialog | `artifacts/erp-dashboard/src/components/employee/dialogs/EditEmployeeDialog.tsx` | modal |
| Salary dialog | `artifacts/erp-dashboard/src/components/employee/dialogs/SalaryDialog.tsx` | modal |
| Passport dialog | `artifacts/erp-dashboard/src/components/employee/dialogs/PassportDialog.tsx` | modal |
| Bank account dialog | `artifacts/erp-dashboard/src/components/employee/dialogs/BankAccountDialog.tsx` | modal |
| Leave request dialog | `artifacts/erp-dashboard/src/components/employee/dialogs/LeaveRequestDialog.tsx` | modal |
| Bonus / Fine / Overtime | `dialogs/BonusDialog.tsx`, `FineDialog.tsx`, `OvertimeDialog.tsx` | modal |
| Emergency contact | `dialogs/EmergencyContactDialog.tsx` | modal |
| Business trip | `dialogs/BusinessTripDialog.tsx` | modal |
| Cash advance | `dialogs/CashAdvanceDialog.tsx` | modal |
| Contract dialog | `dialogs/ContractDialog.tsx` | modal |
| Sick leave | `dialogs/SickLeaveDialog.tsx` | modal |
| Password change | `dialogs/PasswordDialog.tsx` | modal |
| HR dashboard tabs | `artifacts/erp-dashboard/src/pages/hr-dashboard/` | `/hr` |

### Employee Profile Tabs (all in `pages/employee-profile/`)

PersonalTab, WorkTab, AttendanceTab, LeaveTab, FinanceTab, CareerTab, AssessmentTab, DocumentsTab, AssetsTab, CorporateInventoryTab, PerformanceTab, AdaptationTab, HRCapitalTab, GoalsTab, ObligationsTab, MachineOperatorTab, MonthlyReportTab, DailyReportsTab, OneOnOneTab, OffboardingTab, TechAccessTab, RemainingTabs (Discipline, Learning)

---

## 3. Data Flow Chains

### 3.1 Employee List

```
HrEmployeesController.getEmployees() [hr-employees.controller.ts:51]
  -> GET /hr/employees?status=&department=&search=&page=&limit=
  -> @Roles('HR_MANAGER','HR_SPECIALIST','SUPER_ADMIN','DIRECTOR')
  -> queryBus.execute(new GetEmployeesQuery({ department, status, page, limit }))
     [GetEmployeesQuery handler not read -- delegates to hrRepo]
  -> hrRepo.findAll(...) [domain/repositories/i-hr.repo.ts]
     SELECT from users (via @europrint/schemas import)
  <- { data: Employee[], pagination: {...} }
```

### 3.2 Employee Detail (single)

```
HrEmployeesController.getEmployee(':id') [hr-employees.controller.ts:62]
  -> GET /hr/employees/:id
  -> hrRepo.findEmployeeById(id)
     SELECT * FROM users WHERE id=$1 (or from hrEmployees -- unconfirmed)
  <- raw row
```

### 3.3 Employee KPI

```
HrEmployeesController.getEmployeeKpi(':employeeId') [hr-employees.controller.ts:72]
  -> GET /hr/employees/:employeeId/kpi
  -> Promise.all([
       hrRepo.getAttendanceStats(employeeId, period),
       hrRepo.getLeaveBalance(employeeId)
     ])
  <- { employeeId, period, attendance, leaveBalance }
```

### 3.4 Create Employee

```
HrEmployeesController.createEmployee() [hr-employees.controller.ts:91]
  -> POST /hr/employees
  -> @Roles('HR_MANAGER','SUPER_ADMIN')
  -> ZodValidationPipe(HrCreateEmployeeSchema)
  -> hrRepo.saveEmployee({ ...body, employeeCode: body.employeeCode ?? 'EMP-'+Date.now(), createdAt, updatedAt })
     INSERT INTO users (via saveEmployee)
  <- saved row
```

### 3.5 Update Employee

```
HrEmployeesController.updateEmployee(':id') [hr-employees.controller.ts:103]
  -> PUT /hr/employees/:id
  -> @Roles('HR_MANAGER','SUPER_ADMIN')
  -> ZodValidationPipe(HrUpdateEmployeeSchema)
  -> hrRepo.updateEmployee(id, body)
     UPDATE users SET ... WHERE id=$1
  <- updated row
```

### 3.6 Update Employee Status

```
HrEmployeesController.updateEmployeeStatus(':id/status') [hr-employees.controller.ts:114]
  -> PATCH /hr/employees/:id/status
  -> @Roles('HR_MANAGER','DIRECTOR','SUPER_ADMIN')
  -> hrRepo.updateEmployee(id, { status: body.status, employmentStatus: body.status })
  <- { message, data }
```

### 3.7 Salary Review (STUB)

```
HrEmployeesController.reviewSalary(':employeeId/salary-review') [hr-employees.controller.ts:126]
  -> POST /hr/employees/:employeeId/salary-review
  -> @Roles('DIRECTOR','SUPER_ADMIN')
  -> RETURNS ONLY: { message, employeeId, proposedIncrease, reviewedBy, reviewedAt }
     *** NO DB WRITE — pure stub returning request echo ***
```

### 3.8 Org Assignment

```
HrEmployeesExtController.assignOrgFunctions(':id/assign-org-functions') [hr-employees-ext.controller.ts:65]
  -> POST /hr/employees/:id/assign-org-functions
  -> svc.assignOrgFunctions(id, departmentId, positionId)
     UPDATE hrEmployees SET department_id=$2, position_id=$3 WHERE id=$1
  <- { data }
```

### 3.9 Frontend Edit Employee Dialog

```
EditEmployeeDialog.tsx [components/employee/dialogs/EditEmployeeDialog.tsx]
  -> form fields -> onSave() callback in parent
  -> parent calls PUT /hr/employees/:id or PATCH via apiRequest
  -> response -> queryClient.invalidateQueries
  -> table re-renders
```

---

## 4. DB Tables & Columns Used

### `users` table — primary employee CRUD target (schema-core.ts:28, also @europrint/schemas)

| Column | Type | Used by |
|--------|------|---------|
| id | uuid PK | all |
| email | text UNIQUE | auth, employee list |
| password_hash | text | auth only |
| full_name | text | list, profile |
| role | userRoleEnum | RBAC |
| is_active | boolean | status filter |
| phone | text | contact |
| department | text (denorm) | list filter |
| last_login_at | timestamp | profile |
| failed_login_attempts | integer | auth lockout |
| locked_until | timestamp | auth lockout |
| created_at | timestamp | sorting |
| updated_at | timestamp | sorting |

Additional columns referenced in `DrizzleEmployeesRepository` queries (from `@europrint/schemas` users):
- `departmentId` (integer FK)
- `positionId` (integer FK)
- `status` (text, e.g. 'active','on_leave','terminated')
- `deletedAt` (timestamp, soft-delete)
- `salaryType` (text)
- `shift` (text)
- `workshopZone` (text)
- `telegramChatId` (text)
- `birthDate` (date)
- `hireDate` (date)
- `attestationDate` (date)
- `address` (text)
- `gender` (text)
- `maritalStatus` (text)
- `childrenCount` (integer)
- `childrenEducation` (text)
- `housingType` (text)
- `householdSize` (integer)
- `householdMembers` (text)
- `latitude` (numeric)
- `longitude` (numeric)

These are visible in `EditEmployeeDialog.tsx` form but whether they exist in `schema-core.ts`'s users definition is **UNVERIFIED** — `@europrint/schemas` is a separate library package.

### `hrEmployees` table (from `@workspace/db` / shared/db/schema-hr-lms.ts or similar)

Referenced by attendance repo and leave accrual. Confirmed columns:
- `id` (integer PK)
- `face_embedding` (vector(512)) — pgvector
- `face_embedding_updated_at` (timestamp)
- `is_active` (boolean)
- `hire_date` (date)
- `first_name`, `last_name` (text) — used in attendance SQL

### `salary_history` (schema-business-c-2-hr-payroll.ts:13)

| Column | Type |
|--------|------|
| id | serial PK |
| employee_id | integer |
| salary_period_start | date |
| salary_period_end | date |
| base_salary | numeric(15,2) |
| salary_earned | numeric(15,2) |
| total_bonuses | numeric(15,2) |
| other_bonuses | numeric(15,2) |
| created_at | timestamp |
| updated_at | timestamp |

---

## 5. UI Elements & Handlers

### EditEmployeeDialog.tsx — All form fields

| Field | DB Column target | Section |
|-------|-----------------|---------|
| Full Name input | `full_name` / `users.full_name` | Main Info |
| Tabel No (employeeId) input | `employee_code` / `users.id` | Main Info |
| Phone input | `phone` | Main Info |
| Telegram ID input | `telegram_chat_id` | Main Info |
| Gender select | `gender` | Main Info |
| Department select | `department_id` (FK) | Job Info |
| Position select | `position_id` (FK) | Job Info |
| Shift select (A/B/C/D) | `shift` | Job Info |
| Status select (active/on_leave/sick/inactive/terminated) | `status` + `employment_status` | Job Info |
| Salary type select (monthly/hourly/piecework/contract) | `salary_type` | Job Info |
| Workshop/Zone input | `workshop_zone` | Job Info |
| Birth date | `birth_date` | Dates |
| Hire date | `hire_date` | Dates |
| Attestation date | `attestation_date` | Dates |
| Age input | `age` (redundant with birth_date) | Dates |
| Address input | `address` | Address |
| Latitude input | `latitude` | Address |
| Longitude input | `longitude` | Address |
| Marital status select | `marital_status` | Personal |
| Children count input | `children_count` | Personal |
| Children education select | `children_education` | Personal |
| Housing type select | `housing_type` | Housing |
| Household size input | `household_size` | Housing |
| Household members input | `household_members` | Housing |

### Employee Status buttons

| Status Value | Label | Handler |
|-------------|-------|---------|
| active | Active | PATCH /hr/employees/:id/status |
| on_leave | Tatilda | PATCH /hr/employees/:id/status |
| sick | Kasalxonada | PATCH /hr/employees/:id/status |
| inactive | Inactive | PATCH /hr/employees/:id/status |
| terminated | Ishdab boshatilgan | PATCH /hr/employees/:id/status |

### Profile Tabs (employee-profile/)

| Tab File | Status | API calls |
|---------|--------|-----------|
| PersonalTab.tsx | Functional | GET /hr/employees/:id |
| WorkTab.tsx | Functional | GET /hr/employees/:id, contract data |
| AttendanceTab.tsx | Functional | GET /hr/attendance?employeeId= |
| LeaveTab.tsx | Functional | GET /hr/leave?employeeId= |
| FinanceTab.tsx | Functional | GET /hr/payroll?userId= |
| DocumentsTab.tsx | STUB (501) | GET /hr/employees/:id/documents -> 501 |
| CareerTab.tsx | Partial | career history data (unverified endpoint) |
| AssessmentTab.tsx | Partial | 360 assessment data |
| AssetsTab.tsx | Functional | GET /hr/employees/:id/assets |
| CorporateInventoryTab.tsx | Partial | unknown endpoint |
| PerformanceTab.tsx | Partial | KPI data from /hr/employees/:id/kpi |
| AdaptationTab.tsx | Status unknown | |
| HRCapitalTab.tsx | Status unknown | |
| GoalsTab.tsx | Status unknown | GET /hr/employees/:id/goals? |
| ObligationsTab.tsx | Status unknown | |
| MachineOperatorTab.tsx | Status unknown | |
| MonthlyReportTab.tsx | Functional | GET /hr/employees/:id/monthly-card |
| DailyReportsTab.tsx | Partial | |
| OneOnOneTab.tsx | Status unknown | |
| OffboardingTab.tsx | Partial | offboarding checklist |
| TechAccessTab.tsx | Status unknown | |
| RemainingTabs (Discipline/Learning) | Partial | |

---

## 6. What Is Missing or Broken

1. **Salary review endpoint is a stub (P1):** `POST /hr/employees/:employeeId/salary-review` [hr-employees.controller.ts:126] returns `{ message, employeeId, proposedIncrease, reviewedBy, reviewedAt }` with zero DB writes. No record of the salary review is persisted.

2. **Documents endpoint returns 501 (P1):** `GET /hr/employees/:employeeId/documents` [hr-employees-ext.controller.ts:~130] calls `notImplemented()`. The `DocumentsTab.tsx` in the profile would always show an error or empty state.

3. **Two employee tables — impedance mismatch (P2):** `users` table (schema-core.ts) is the CRUD target for `HrEmployeesController`, but `hrEmployees` (from @workspace/db) is used by attendance, leave, and face recognition. Columns like `first_name`/`last_name` exist on `hrEmployees` but not `users` (which uses `full_name`). Joining these for a complete profile requires knowing which table to query.

4. **`users.department` is a text string, not FK (P2):** The `users` schema has `department text` (denormalized) but the repo and UI use `departmentId integer FK`. If `@europrint/schemas` has the FK version but `schema-core.ts` does not, there is a persistent schema drift.

5. **`age` field redundant with `birthDate` (P3):** `EditEmployeeDialog.tsx` has both `age` and `birthDate` inputs. `age` is a computed value and should not be stored separately — risk of stale data.

6. **Multiple unverified tab endpoints (P2):** At least 8 employee profile tabs (AdaptationTab, HRCapitalTab, GoalsTab, ObligationsTab, MachineOperatorTab, OneOnOneTab, TechAccessTab, RemainingTabs) have unknown backend endpoints. Cannot confirm if these tabs load real data or show empty states.

7. **No DB table for employee documents (P2):** No `employee_documents` Drizzle schema was found. The 501 endpoint suggests no table exists.

8. **`GetEmployeesQuery` handler not found (P2):** `HrEmployeesController.getEmployees()` dispatches `new GetEmployeesQuery(...)` via CQRS QueryBus. The handler file was not found in `hr/application/queries/`. If missing or mis-registered, the endpoint throws at runtime.

9. **Soft-delete relies on `deletedAt` column (P3):** `DrizzleEmployeesRepository.softDelete()` sets `users.deletedAt = now()`. But `schema-core.ts` users table definition has no `deletedAt` column. Works only if `@europrint/schemas` defines it.

---

## Summary

The employee module has a rich frontend (22+ profile tabs, 16 dialogs) backed by a reasonably structured backend (CQRS queries, Result pattern). However, two critical issues undermine data integrity: the salary review endpoint is a stub with no persistence, and the documents endpoint always returns 501. The dual-table architecture (`users` vs `hrEmployees`) creates ongoing mapping confusion. Several profile tabs have unknown or unverified backend wiring.

---

## Gaps Table

| Issue | Severity | Evidence file:line | Impact | Suggested Fix |
|-------|----------|--------------------|--------|---------------|
| Salary review stub — no DB write | P1 | `hr-employees.controller.ts:126-138` | Salary proposals lost | Implement salary_review_requests table insert |
| Documents endpoint 501 | P1 | `hr-employees-ext.controller.ts:~130` + comment "P3-26" | DocumentsTab always broken | Create employee_documents table + CRUD |
| Two employee tables mismatch | P2 | `drizzle-employees.repo.ts` uses `users`; `drizzle-attendance.repo.ts` uses `hrEmployees` | Profile joins break | Consolidate or create clear view/join layer |
| users.department is text not FK | P2 | `schema-core.ts:37` `department: text` | Department filter unreliable | Add `department_id integer FK` to schema-core users |
| GetEmployeesQuery handler not found | P2 | `hr-employees.controller.ts:51`; no handler file confirmed | List endpoint may throw | Verify CQRS handler registration in hr.module.ts |
| deletedAt not in schema-core users | P2 | `drizzle-employees.repo.ts:72`; `schema-core.ts:28` | Soft delete may fail | Add deletedAt column to schema |
| 8+ tabs with unknown endpoints | P2 | `pages/employee-profile/*.tsx` | Tabs may show empty state silently | Audit each tab for actual API call and endpoint |
| age field redundant with birthDate | P3 | `EditEmployeeDialog.tsx:~120` | Stale computed data | Remove age field; compute from birthDate |

---

## Open Questions / UNVERIFIED

- What columns does `@europrint/schemas` users export? It may have more columns than schema-core.ts.
- Where is the `GetEmployeesQuery` CQRS handler defined? Not found in `hr/application/queries/`.
- Do `GoalsTab`, `AdaptationTab`, `HRCapitalTab`, `OneOnOneTab`, `TechAccessTab` have real backend routes?
- What is `EmployeeMonthlyCardService` in `hr/employees/employee-monthly-card.service.ts`? Not read.
- Is there a separate `employees` DB table distinct from `users`? `DrizzleAttendanceRepository` references `employees` table in raw SQL (`JOIN employees e ON e.id = a.employee_id`).
