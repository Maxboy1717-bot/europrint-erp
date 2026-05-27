# Modul: HR Employees (Xodimlar)

> **Status:** INVENTORY 2026-05-27 — kanonik tanlangan, duplikatlar belgilangan
> **Owner:** muslimbeknosirov1995@gmail.com (@Maxboy1717-bot)
> **Asosiy sahifa:** `/employees` + `/employees/:id`
> **Asosiy endpoint prefix:** `/api/hr/employees`

---

## 🎯 Yagona Haqiqat Manbai (Single Source of Truth)

| Qism | Kanonik fayl | Maqsad |
|------|-------------|--------|
| **DB jadval — employees** | `lib/db/src/schema/employees.ts` (59 ustun, serial int PK) | Xodim asosiy ma'lumotlari |
| **DB jadval — users** | `lib/db/src/schema/users.ts` (52 ustun, serial int PK) | Foydalanuvchi (auth + HR) |
| **DB jadval — passports** | `lib/db/src/schema/employees.ts` (`employeePassports`) | Pasport ma'lumotlari |
| **DB jadval — bank accounts** | `lib/db/src/schema/employees.ts` (`employeeBankAccounts`) | Bank rekvizitlari |
| **DB jadval — emergency contacts** | `lib/db/src/schema/employees.ts` (`employeeEmergencyContacts`) | Favqulodda aloqa |
| **DB jadval — contracts** | `lib/db/src/schema/employees.ts` (`employmentContracts`) | Mehnat shartnomalari |
| **DB jadval — files** | `lib/db/src/schema/employees.ts` (`employeeFiles`) | Hujjat fayllari |
| **Controller (CRUD)** | `apps/api/src/modules/hr/presentation/hr-employees.controller.ts` | List, get, create, update, status |
| **Controller (Ext)** | `apps/api/src/modules/hr/presentation/hr-employees-ext.controller.ts` | Profile-image, assets, docs, complaints |
| **Controller (Face)** | `apps/api/src/modules/hr/presentation/employees-for-face.controller.ts` | Face recognition uchun ro'yxat |
| **Controller (Goals)** | `apps/api/src/modules/hr/presentation/hr-employee-goals.controller.ts` | KPI maqsadlari |
| **Service (Core)** | `apps/api/src/modules/hr/employees/employees.service.ts` | Asosiy biznes logika |
| **Service (Ext)** | `apps/api/src/modules/hr/application/hr-employees-ext.service.ts` | Kengaytirilgan amaliyotlar |
| **Repo (Core)** | `apps/api/src/modules/hr/employees/drizzle-employees.repo.ts` | DB qatlam |
| **Repo (Ext)** | `apps/api/src/modules/hr/infrastructure/repositories/hr-employees-ext.repository.ts` | Kengaytirilgan DB |
| **CQRS Handler** | `apps/api/src/modules/hr/application/commands/create-employee.handler.ts` | Yaratish (TxOutcome qaytaramiz!) |
| **DTO** | `apps/api/src/modules/hr/presentation/dto/hr.dto.ts` | Zod sxemalar |
| **Frontend (Ro'yxat)** | `artifacts/erp-dashboard/src/pages/Employees.tsx` | Ro'yxat sahifasi |
| **Frontend (Profil)** | `artifacts/erp-dashboard/src/pages/EmployeeProfile.tsx` | Bitta xodim profili |
| **Frontend (Add/Edit)** | `artifacts/erp-dashboard/src/components/EmployeeDialog.tsx` | Yaratish/tahrirlash dialogi |
| **Frontend (Sections)** | `artifacts/erp-dashboard/src/components/hr/employee-dialog/*.tsx` | Dialog bo'limlari (7 ta) |
| **Frontend (Import)** | `artifacts/erp-dashboard/src/components/ImportEmployeesDialog.tsx` | Excel/CSV import |
| **Routing** | `artifacts/erp-dashboard/src/routes/HRRoutes.tsx` | `/employees`, `/employees/:id` |

---

## 🚫 @deprecated Fayllar — Yangi kod ulardan import qilmaydi

Ushbu fayllar **o'chirilmaydi** (Git history saqlanadi, mavjud consumer'lar buzilmaydi), lekin yangi kod yozish faqat yuqoridagi kanonik fayllar bilan amalga oshiriladi. Har bir fayl tepasiga `@deprecated` JSDoc header qo'shilgan.

### DB schema duplikatlar

| Fayl | Sabab | Kanonik o'rni |
|------|-------|---------------|
| `apps/api/src/shared/db/schema-core.ts` (users — uuid PK) | UUID PK, minimal (14 ustun), modern shim | `lib/db/src/schema/users.ts` |
| `apps/api/src/shared/db/schema-compat-1a.ts` (users — integer, 17 ustun) | Legacy fallback, `password_hash` naming | `lib/db/src/schema/users.ts` |
| `apps/api/src/shared/db/schema-hr-lms.ts` (employees — uuid PK, 13 ustun) | Mini employees, UUID FK mismatch | `lib/db/src/schema/employees.ts` |

### Backend duplikatlar (compatibility module)

| Fayl | Sabab | Kanonik o'rni |
|------|-------|---------------|
| `apps/api/src/modules/compatibility/employees-compat.controller.ts` | `@deprecated` shim, legacy `/employees` route | `hr-employees.controller.ts` |
| `apps/api/src/modules/compatibility/employees-compat-sub.controller.ts` | Sub-routes legacy | `hr-employees-ext.controller.ts` |
| `apps/api/src/modules/compatibility/employees-extra.controller.ts` | Bitrix-style legacy | `hr-employees.controller.ts` |
| `apps/api/src/modules/compatibility/employee-kpi-compat.controller.ts` | Legacy KPI | (Yangi KPI moduli kerak) |
| `apps/api/src/modules/compatibility/employee-files-compat.controller.ts` | Legacy fayllar | `hr-employees-ext.controller.ts` (documents) |
| `apps/api/src/modules/compatibility/employees-compat.service.ts` | Raw SQL + to'g'ridan DB (Rule 15 buzilgan) | `employees.service.ts` |
| `apps/api/src/modules/compatibility/employees-compat-sub.service.ts` | Sub legacy | `hr-employees-ext.service.ts` |
| `apps/api/src/modules/compatibility/employees-compat-profile.service.ts` | Profile shim | `hr-employees-ext.service.ts` |
| `apps/api/src/modules/compatibility/employees-compat-profile-orm.service.ts` | ORM variant | Yagona service'da |
| `apps/api/src/modules/compatibility/employees-compat-profile-raw.service.ts` | Raw SQL variant | Yagona service'da |
| `apps/api/src/modules/compatibility/employees-compat-financials.service.ts` | Finance shim | Finance moduli alohida |
| `apps/api/src/modules/compatibility/employees-list-extended.service.ts` | Legacy list | `employees.service.ts` |
| `apps/api/src/modules/compatibility/employee-kpi-compat.service.ts` | KPI shim | (Yangi KPI moduli kerak) |
| `apps/api/src/modules/compatibility/employee-files-compat.service.ts` | Files shim | `hr-employees-ext.service.ts` |

### Frontend duplikatlar

| Fayl | Sabab | Kanonik o'rni |
|------|-------|---------------|
| `artifacts/erp-dashboard/src/pages/EmployeeStats.tsx` | EmployeeProfile tablariga qo'shilishi kerak | `EmployeeProfile.tsx` (PersonalTab/PerformanceTab) |
| `artifacts/erp-dashboard/src/pages/EmployeeRating.tsx` | Profile PerformanceTab ichida bor | `EmployeeProfile.tsx → PerformanceTab` |
| `artifacts/erp-dashboard/src/pages/EmployeeDailyKPIPanel.tsx` | Profile PerformanceTab ichida bor | `EmployeeProfile.tsx → PerformanceTab` |
| `artifacts/erp-dashboard/src/pages/camera-employees.tsx` | EmployeeTrackingReport bilan duplikat | `EmployeeTrackingReport.tsx` |
| `artifacts/erp-dashboard/src/pages/camera-employee-ratings.tsx` | EmployeeRating bilan duplikat | (PerformanceTab) |
| `artifacts/erp-dashboard/src/components/employee/dialogs/EditEmployeeDialog.tsx` | EmployeeDialog bilan birlashtirilishi mumkin | `EmployeeDialog.tsx` |

### Alohida domain (duplikat EMAS — o'z domeni)

| Fayl | Domain | Sabab |
|------|--------|-------|
| `apps/api/src/modules/pos/presentation/employee.controller.ts` | POS Inventory | Material javobgarligi (HR emas) |
| `apps/api/src/modules/pos/application/services/employee-*.service.ts` | POS | Inventar, write-off, liability |
| `apps/api/src/modules/iot/presentation/camera-alerts.controller.ts` | IoT Camera | Kamera reytinglari |
| `artifacts/erp-dashboard/src/pages/EmployeesForFacePage.tsx` | Face Recognition | Yuz tanish ro'yxati |
| `artifacts/erp-dashboard/src/pages/EmployeeTrackingReport.tsx` | Camera Tracking | Kuzatuv hisoboti |
| `artifacts/erp-dashboard/src/pages/erp/ERPEmployeeTab.tsx` | Production | Work center assignment |
| `artifacts/erp-dashboard/src/pages/adaptation/NewEmployeesTab.tsx` | Onboarding | Yangi xodim adaptatsiyasi |

---

## 📡 Endpoint Inventarizatsiya

### ✅ KANONIK Endpoint'lar (`/api/hr/employees/*`)

| Method | URL | Controller | Maqsad |
|--------|-----|-----------|--------|
| GET | `/api/hr/employees` | hr-employees | Ro'yxat (filter, pagination) |
| POST | `/api/hr/employees` | hr-employees | Yaratish |
| GET | `/api/hr/employees/:id` | hr-employees | Bitta xodim |
| PUT | `/api/hr/employees/:id` | hr-employees | Tahrir |
| PATCH | `/api/hr/employees/:id/status` | hr-employees | Status |
| GET | `/api/hr/employees/:id/kpi` | hr-employees | KPI ko'rsatkichlari |
| POST | `/api/hr/employees/:employeeId/salary-review` | hr-employees | Maosh ko'rib chiqish |
| POST | `/api/hr/employees/:id/profile-image` | hr-employees-ext | Profile rasm |
| POST | `/api/hr/employees/:id/assign-org-functions` | hr-employees-ext | Org funksiyalar |
| POST | `/api/hr/employees/import` | hr-employees-ext | Excel/CSV import |
| GET | `/api/hr/employees/:id/assets` | hr-employees-ext | Aktivlar |
| POST | `/api/hr/employees/:id/assets` | hr-employees-ext | Aktiv biriktirish |
| GET | `/api/hr/employees/:id/swap-requests` | hr-employees-ext | Smena almashish |
| GET | `/api/hr/employees/:id/complaints` | hr-employees-ext | Shikoyatlar |
| POST | `/api/hr/employees/:id/complaints` | hr-employees-ext | Shikoyat yaratish |
| GET | `/api/hr/employees/:id/documents` | hr-employees-ext | Hujjatlar |
| GET | `/api/hr/employees/:id/documents/:docId` | hr-employees-ext | Bitta hujjat |
| DELETE | `/api/hr/employees/:id/documents/:docId` | hr-employees-ext | Hujjatni o'chirish |
| GET | `/api/hr/employees/:id/goals` | hr-employee-goals | KPI maqsadlari |
| POST | `/api/hr/employees/:id/goals` | hr-employee-goals | Maqsad yaratish |
| GET | `/api/employees-for-face` | employees-for-face | Yuz tanish ro'yxati |

### 🚫 @deprecated Endpoint'lar (`/api/employees/*` — yangi frontend chaqirmaydi)

| Method | URL | Controller | Yangi o'rni |
|--------|-----|-----------|-------------|
| GET | `/api/employees` | employees-compat | `/api/hr/employees` |
| POST | `/api/employees` | employees-compat | `/api/hr/employees` |
| GET | `/api/employees/:id` | employees-compat | `/api/hr/employees/:id` |
| PUT | `/api/employees/:id` | employees-compat | `/api/hr/employees/:id` |
| DELETE | `/api/employees/:id` | employees-compat | (NO equivalent — kanonik soft-delete patch ishlatadi) |
| GET | `/api/employees/extra/:id` | employees-extra | `/api/hr/employees/:id` |
| PATCH | `/api/employees/:id` | employees-extra | `/api/hr/employees/:id` |
| ... | (~25 ta legacy sub-route) | employees-compat-sub | `/api/hr/employees/:id/*` |

### ⚠️ Frontend ↔ Backend URL drift

Frontend hozir `apiRequest('GET', '/api/employees')` chaqiradi (legacy). Backend kanonik route `/api/hr/employees`. **Ikkita variant ishlaydi** (compat shim hali faol), lekin yangi kod faqat `/api/hr/employees` ishlatishi kerak.

**Action:** Sahifalardagi URL'larni asta-sekin (PR review orqali) `/api/hr/employees`'ga ko'chirish. **Bu modulning BLESSED bo'lishidan oldin ham, keyin ham bajariladi.**

---

## 🔧 Ochiq Muammolar (BLESSED bo'lishdan oldin hal qilinishi kerak)

1. ~~**`create-employee.handler.ts` TxOutcome regress**~~ ✅ **2026-05-27 commit `2f69191b` da tuzatildi** — `type TxOutcome` qayta qo'shildi, `return { kind: 'err' }` tiklandi.
2. ~~**FE URL drift**~~ ✅ **2026-05-27 commit `2f69191b` da tuzatildi** — `Employees.tsx`, `EmployeeProfile.tsx` (main GET), `EmployeeDialog.tsx` (profile-image, assign-org-functions, invalidateQueries) → `/api/hr/employees`.
   > ⚠️ EmployeeProfile.tsx sub-routes (`/api/employees/${id}/passport`, `/bank-accounts`, vs.) hali compat orqali ishlaydi — BLESSED uchun zarur emas (compat hali faol).
3. **EmployeeProfile.tsx 365 qator** — Hozircha qabul qilinadi (300 qator chegarasidan oshgan lekin katta refactor kerak emas).
4. ~~**Type definitions tarqalgan**~~ ✅ **2026-05-27 commit `2f69191b`** — `lib/types/src/employee.ts` mavjud (canonical); `lib/types/employee.ts` re-export qo'shildi.
5. **E2E test yo'q** — `e2e/hr-employees.spec.ts` yaratish: login → list → add → edit → delete oqimi. **BLOCKED (hali).**

---

## 🧪 Verifikatsiya (BLESSED holatga keltirish uchun majburiy)

```bash
# 1. Backend typecheck
cd apps/api && pnpm typecheck       # 0 xato

# 2. Frontend typecheck
cd artifacts/erp-dashboard && pnpm typecheck       # 0 xato

# 3. Test suite
pnpm test --testPathPattern="hr|employee"       # all green

# 4. E2E test (yangi)
pnpm test:e2e -- hr-employees.spec.ts

# 5. Endpoint smoke
curl -X GET http://localhost:3000/api/hr/employees -H "Authorization: Bearer ..."
# 200 OK, JSON array of employees
```

---

## 📜 BLESSED bo'lish sharti

Modul **BLESSED** statusiga o'tishi uchun:

- [x] Bu hujjat to'liq yangilangan (2026-05-27) ✅
- [x] Barcha @deprecated fayllar header bilan belgilangan — 14 BE + 3 DB schema + 6 FE (commit `2f69191b`) ✅
- [x] `lib/types/employee.ts` markaziy tip ta'rifi mavjud (`lib/types/src/employee.ts` + re-export) ✅
- [x] `create-employee.handler.ts` TxOutcome pattern qaytarilgan (commit `2f69191b`) ✅
- [ ] `e2e/hr-employees.spec.ts` yashil — **HALI YO'Q**
- [x] Frontend URL'lari `/api/hr/employees` ga ko'chirilgan (asosiy CRUD) ✅
- [x] `.github/CODEOWNERS` LOCAL-CRITICAL-GUARD blokiga qo'shilgan (commit `2026-05-27`) ✅

**BLESSED kunidan boshlab:** Bu modul fayllarini faqat owner kommit qila oladi. Yangi funksiya qo'shish 1-2 soatlik ish bo'lishi kerak (yangi command handler + endpoint + FE mutation + e2e test case).

---

## 🗓️ Tarix

- **2026-05-27** — Inventory tugadi, kanonik tanlandi, @deprecated header'lar qo'shilmoqda.
- **(kelajakda)** — STATUS: BLESSED 2026-XX-XX
