# Migration Audit — departments + positions → org-sxema

**Sana**: 2026-05-20
**Backup**: `backups/2026-05-20-pre-migration.dump` (2.6 MB, 774 jadval, 6057 ob'ekt)

## Real hajm (qayta hisoblandi)

| Element | Soni | Manba |
|---|---:|---|
| FK references schema'da | **58** | `docs/migration/fk-references.txt` |
| Backend import qiluvchi fayllar | **13** | `docs/migration/be-files.txt` |
| Frontend API chaqiruvchi fayllar | **19** | `docs/migration/fe-files.txt` |
| Distinct schema fayllar | **15** | Quyida |

## 15 ta schema fayl (FK egasi)

1. `core/core-users.ts` — 2 FK (users.positionId, users.departmentId)
2. `core-schema.ts` — 5 FK (employees, work-centers, responsible-dept × 2, master-data)
3. `employees.ts` — 3 FK (departmentId, positionId, managerDepartmentId)
4. `fi-gl.ts` — 1 FK (departmentId)
5. `hr-architecture-additions.ts` — 3 FK (positionId, targetPositionId, positionId)
6. `hr-compensation.ts` — 2 FK (positionId, departmentId)
7. `hr-performance-ext.ts` — 1 FK (departmentId)
8. `hr-personal-core.ts` — 1 FK (positionId)
9. `hr-tz2-schema.ts` — N FK (TBD)
10. `hr-v2-schema.ts` — N FK (TBD)
11. `position-permissions.ts` — N FK
12. `users.ts` — N FK
13. `hr-safety.ts` — N FK
14. `hr-architecture-additions.ts` — 3 FK
15. Boshqa qolgan FK'lar — 58 ta jami

## 13 BE fayl (import qiladigan)

1. `apps/api/src/database/seeds/master-data.seed.ts` — seed manbai
2. `apps/api/src/modules/admin/position-permissions/position-permissions.repository.ts`
3. `apps/api/src/modules/admin/position-permissions/position-permissions.service.ts`
4. `apps/api/src/modules/core/core.module.ts`
5. `apps/api/src/modules/core/departments/departments.repository.ts`
6. `apps/api/src/modules/core/departments/departments.service.ts`
7. `apps/api/src/modules/core/infrastructure/repositories/drizzle-core.repo.ts`
8. `apps/api/src/modules/core/positions/positions.repository.ts`
9. `apps/api/src/modules/core/positions/positions.service.ts`
10. `apps/api/src/modules/core/presentation/departments.controller.ts`
11. `apps/api/src/modules/core/presentation/positions.controller.ts`
12. `apps/api/src/shared/db/schema-compat-2.ts` — barrel re-export
13. `apps/api/src/shared/db/schema-misc-app-a.ts` — barrel re-export

## 19 FE fayl (API chaqiruvchi)

1. `components/AddTestDialog.tsx`
2. `components/EmployeeDialog.tsx`
3. `components/finance/CostCentersTab.tsx`
4. `pages/Adaptation.tsx`
5. `pages/Applications.tsx`
6. `pages/Courses.tsx`
7. `pages/DailyReportPage.tsx`
8. `pages/Departments.tsx`
9. `pages/EmployeeProfile.tsx`
10. `pages/EventsCalendar.tsx`
11. `pages/GoalsKPI.tsx`
12. `pages/HRAssetManagement.tsx`
13. `pages/HRMap.tsx`
14. `pages/Positions.tsx`
15. `pages/QuestionnaireTemplatesHooks.ts`
16. `pages/Settings.tsx`
17. `pages/ShiftSchedule.tsx`
18. `pages/__tests__/Departments.test.tsx`
19. `pages/__tests__/Settings.test.tsx`

## Migration strategiyasi

### Bosqich 1 (D2): Backfill
- 7 Otdeleniye yaratish `org_departments` ga (level=2, parent=root)
- 30+ bo'lim har Otdeleniye ichida (level=3)
- 112 `positions` rekordi → 112 `org_functions` rekordi (departmentId + positionName)
- 400 employee:
  - `employee_org_departments` (employeeUserId, orgDeptId, isPrimary=true)
  - `employee_functions` (employeeUserId, orgFunctionId, workloadPercent=100, isPrimary=true)

### Bosqich 2 (D3): FK swap
- 58 FK'ni `references(orgDepartments.id)` / `references(orgFunctions.id)` ga ko'chirish
- Drizzle migration: ADD new column, UPDATE FROM mapping, DROP old column
- Per-FK transaction (atomic per fayl)

### Bosqich 3 (D4): BE refactor 13 fayl
- `db.select().from(departments)` → `db.select().from(orgDepartments)`
- Service'lar yangi schema'dan o'qiydi
- Yangi endpoint'lar: `/api/org-structure/departments` (mavjud), eski `/api/departments` keyinroq deprecate

### Bosqich 4 (D5): FE refactor 19 fayl + DROP
- 19 ta FE fayl: `useQuery(['/api/departments'])` → `useQuery(['/api/org-structure/departments'])`
- `DROP TABLE departments + positions`
- Schema fayllarni o'chirish: `departments.ts`, `positions.ts`

## Rollback rejasi
- `pg_restore -d europrint backups/2026-05-20-pre-migration.dump`
- Git revert oxirgi 5 commit
- 30 daqiqalik recovery
