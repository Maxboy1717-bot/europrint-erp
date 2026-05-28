# Modul Kanon Registry

> **MUHIM:** Har yangi AI sessiyasi bu faylni o'qisin.
> Bu yerda har modul uchun KANON fayllar ko'rsatilgan.
> Yangi fayl yaratishdan OLDIN shu ro'yxatni tekshiring — duplikat yaratilmasin.

---

## Foydalanish qoidasi

- `← KANON` — shu faylni o'zgartiring, boshqa yerda ekvivalent yaratmang
- `← SHIM` — legacy bridge, to'g'ridan KANON ishlatsin, bu faylni kengaytirmang
- `← DEPRECATED` — o'chirilishi kerak, yangi kod yozmang

---

## HR Moduli (tz03)

| Qatlam | Kanon fayl | Izoh |
|--------|-----------|------|
| **BE Controller (asosiy)** | `apps/api/src/modules/hr/presentation/hr-compat-a.controller.ts` ← KANON | Employees, skills, health, discipline |
| **BE Controller (safety)** | `apps/api/src/modules/hr/presentation/hr-compat-safety.controller.ts` ← KANON | Incidents, trainings, leave-requests |
| **BE Controller (dashboard)** | `apps/api/src/modules/hr/presentation/hr-dashboard.controller.ts` ← KANON | Birthdays, milestones, stats |
| **Query handler** | `apps/api/src/modules/hr/application/queries/get-employees.handler.ts` ← KANON | **camelCase projection bu yerda** |
| **Repository** | `apps/api/src/modules/hr/infrastructure/repositories/drizzle-hr-base.repo.ts` ← KANON | |
| **BE Controller (legacy)** | `apps/api/src/modules/compatibility/employees-compat.controller.ts` ← SHIM | |
| **FE Sahifa** | `artifacts/erp-dashboard/src/pages/Employees.tsx` ← KANON | |
| **FE Dashboard** | `artifacts/erp-dashboard/src/pages/HRDashboard.tsx` ← KANON | |
| **FE Leave** | `artifacts/erp-dashboard/src/pages/HRVacationSick.tsx` ← KANON | |
| **FE Health** | `artifacts/erp-dashboard/src/pages/HRHealthMonitoring.tsx` ← KANON | |
| **FE Safety** | `artifacts/erp-dashboard/src/pages/HRSafety.tsx` ← KANON | |
| **FE Discipline** | `artifacts/erp-dashboard/src/pages/Discipline.tsx` ← KANON | |

---

## Finance Moduli (tz04)

| Qatlam | Kanon fayl |
|--------|-----------|
| **BE Module** | `apps/api/src/modules/finance/` ← KANON |
| **GL Controller** | `apps/api/src/modules/finance/presentation/finance-gl.controller.ts` ← KANON |
| **FE Dashboard** | `artifacts/erp-dashboard/src/pages/FinanceDashboard.tsx` ← KANON |

---

## WMS / Ombor (tz08)

| Qatlam | Kanon fayl |
|--------|-----------|
| **BE Module** | `apps/api/src/modules/wms/` ← KANON |
| **FE Hub** | `artifacts/erp-dashboard/src/pages/warehouse/WarehouseHub.tsx` ← KANON |

---

## LMS / Ta'lim (tz13)

| Qatlam | Kanon fayl |
|--------|-----------|
| **BE Module** | `apps/api/src/modules/lms/` ← KANON |
| **FE Dashboard** | `artifacts/erp-dashboard/src/pages/LMSDashboard.tsx` ← KANON |
| **FE Kurslar** | `artifacts/erp-dashboard/src/pages/Courses.tsx` ← KANON |

---

## CRM / Savdo (tz01)

| Qatlam | Kanon fayl |
|--------|-----------|
| **BE Module** | `apps/api/src/modules/crm/` ← KANON |
| **FE Workspace** | `artifacts/erp-dashboard/src/pages/crm/CRMWorkspace.tsx` ← KANON |

---

## Sidebar / Navigation

| Fayl | Maqsad |
|------|--------|
| `artifacts/erp-dashboard/src/components/sidebar/constants.ts` ← KANON | tz01-tz10 navigation |
| `artifacts/erp-dashboard/src/components/sidebar/constants-hr-lms.ts` ← KANON | tz11 (HR) + tz13 (LMS) |
| `artifacts/erp-dashboard/src/components/sidebar/types.ts` ← KANON | MenuGroup interface |

---

## DB Schema

| Fayl | Maqsad |
|------|--------|
| `lib/db/src/schema/` ← KANON | Barcha Drizzle schema'lar |
| `apps/api/src/shared/db/schema-misc-app-a.ts` | HR employees, hrEmployees table |

---

## Eslatmalar

- `apps/api/src/modules/compatibility/` — BARCHA fayllar SHIM, ularni kengaytirmang
- `apps/api/src/modules/legacy/` — DEPRECATED, yangi kod yozmang
- Yangi endpoint kerak bo'lsa: KANON controller'ga qo'shing, yangi controller yaratmang
