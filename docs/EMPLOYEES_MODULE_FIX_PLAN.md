# Employees Moduli — To'liq Tuzatish Rejasi

> **Maqsad:** `/erp-dashboard/employees/` (ro'yxat) va `/employees/:id` (profil) **to'liq ishlashi**.
> **Asos:** `docs/EMPLOYEES_MODULE_AUDIT.md` (10 muammo).
> **Yondashuv:** Kodni DB ga moslash (raw SQL alias) + yetishmagan bog'lanishni yozish. ADD-ONLY — ishlaydigan kod buzilmaydi.

---

## Faza 1 — Profil CRASH va bo'sh KPI (frontend, tezkor) 🔴

Profil sahifasi ma'lumot kelmasa qulab tushadi va KPI kartalar bo'sh — eng ko'rinarli muammo.

### 1.1 Array crash himoyasi
**Fayl:** `artifacts/erp-dashboard/src/pages/EmployeeProfile.tsx:305-307` (va shunga o'xshash `.filter()` joylar)
- `certificatesData?.filter(...)` → `(Array.isArray(certificatesData) ? certificatesData : []).filter(...)`
- Xuddi shunday: `bank-accounts`, `attendance`, `progress`, `employee-complaints` query natijalari uchun (Rule 2)
- **Verifikatsiya:** ma'lumotsiz xodim profili crashsiz ochiladi

### 1.2 AttendanceTab 3 dialog propini bog'lash
**Fayl:** `artifacts/erp-dashboard/src/pages/EmployeeProfile.tsx:337`
- State + mutation allaqachon bor (`:120-122`, `:294-296`) — faqat `AttendanceTab`ga uzatish:
  `leaveRequestDialogOpen/set...`, `sickLeaveDialogOpen/set...`, `businessTripDialogOpen/set...` + tegishli form/mutation
- AttendanceTab props interfeysini tekshirib mos kelishini ta'minlash
- **Verifikatsiya:** Davomat tab'da Ta'til/Kasallik/Safari tugmalari dialog ochadi

### 1.3 PerformanceTab KPI kartalar null guard + metrics bog'lash
**Fayl:** `artifacts/erp-dashboard/src/pages/employee-profile/PerformanceTabSections.tsx:88,101,113`
- Har karta uchun `?? 0` / `Array.isArray()` guard
- `EmployeeProfile.tsx:163` `/api/erp/employee/:id/metrics` — yo KPI kartaga bog'lash, yo olib tashlash
- **Verifikatsiya:** kartalar ma'lumot bo'lsa son, bo'lmasa "—" (crash emas)

---

## Faza 2 — KPI ma'lumotlarini real qilish (backend) 🔴

### 2.1 Ro'yxat KPI maydonlarini real JOIN qilish
**Fayl:** `apps/api/src/modules/compatibility/employees-list-extended.service.ts:107-111`
Hozir 0 deb yozilgan 5 maydonni real sub-query bilan:
```sql
COALESCE((SELECT COUNT(*) FROM lms_exam_attempts la WHERE la.user_id = e.user_id), 0)            AS "coursesTotal",
COALESCE((SELECT AVG(er.overall_rating) FROM employee_ratings er WHERE er.employee_id = e.id), 0) AS "rating",
COALESCE((SELECT SUM(bp.bonus_amount) FROM bonus_payments bp WHERE bp.employee_id = e.id), 0)     AS "bonusAmount",
COALESCE((SELECT COUNT(*) FROM lms_exam_attempts la WHERE la.user_id = e.user_id AND la.status='failed'), 0) AS "failedTests",
COALESCE((SELECT COUNT(*) FROM discipline_records dr WHERE dr.employee_id = e.id AND dr.deleted_at IS NULL), 0) AS "disciplineCount"
```
- Ustun nomlari avval DB da tekshiriladi (employee_ratings.overall_rating, bonus_payments.bonus_amount, lms_exam_attempts.status)
- `RULE4_EXCEPTION:` izoh qo'shiladi
- **Verifikatsiya:** `GET /api/employees` real son qaytaradi

### 2.2 attestationDate
- `employees` yoki `employment_contracts` da attestatsiya ustuni bor-yo'qligini tekshirish; bo'lmasa NULL qoldirish (jadvaldan ustunni olib tashlash variantı Faza 4 da)

### 2.3 Profil KPI endpointlari
- `/api/abc-analysis/user/:id`, `/api/progress/user/:id`, `/api/erp/employee/:id/metrics`, `/api/certificates/user/:id` — har birini probe qilib, 503/bo'sh bo'lsa repo'ni DB ga moslash (schema drift bo'lishi mumkin)

---

## Faza 3 — Org-bog'lanishni BIRLASHTIRISH (eng chuqur) 🔴

**Qaror:** bitta izchil model — xodim 1 ta org bo'lim + 1 ta org lavozim (yagona FK). Junction faqat qo'shimcha tayinlovlar uchun (ixtiyoriy).

### 3.1 Yozish yo'li yagona FK ni yangilasin
**Fayl:** `apps/api/src/modules/compatibility/employees-compat.helpers.ts` (insertEmployeeRow / updateEmployeeRow)
- INSERT/UPDATE ga `org_department_id`, `org_function_id` ustunlarini qo'shish
- `adaptEmployeePayload` ga `orgDepartmentId`/`orgFunctionId` ni map qilish
- **Verifikatsiya:** yangi xodim yaratilganda org bo'lim/lavozim ro'yxatda darhol ko'rinadi

### 3.2 Forma org selektorlari (yagona)
**Fayl:** `artifacts/erp-dashboard/src/components/hr/employee-dialog/OrgStructureSection.tsx` + `EmployeeDialog.tsx`
- 1 ta "Org Bo'lim" (org_departments) + 1 ta "Org Lavozim" (org_functions, bo'limga bog'liq) selektori
- Forma payload'ga `orgDepartmentId` + `orgFunctionId` qo'shish (singular)
- Legacy department/position'ni ixtiyoriy/yashirin qilish (chalkashlikni kamaytirish)
- **Verifikatsiya:** tahrirlashda joriy org qiymat ko'rinadi, saqlangach ro'yxatda yangilanadi

### 3.3 Mavjud ma'lumot izchilligi
- 30 seed xodimda yagona FK to'la — ular ishlaydi
- (ixtiyoriy) junction'dagi ma'lumotni yagona FK ga backfill qiluvchi bir martalik migration

---

## Faza 4 — Jadvalni HR-ga moslash 🟠

**Fayl:** `artifacts/erp-dashboard/src/components/EmployeeTable.tsx`
- **Qo'shish:** Bo'lim, Lavozim, Maosh, Telefon ustunlari (asosiy HR)
- **Ko'chirish/ikkinchi darajaga:** Reyting ⭐, Yiqilgan testlar, Attestatsiya — LMS/training metrikalari (alohida "O'qitish" tab yoki yig'iladigan ustun)
- `EmployeeRow` ga `baseSalary` qo'shish (`Employees.tsx:39-61` + service select)
- **Verifikatsiya:** jadval personnel roster ko'rinishida (bo'lim/lavozim/maosh ko'rinadi)

---

## Faza 5 — CSV import + forma sayqal 🟠🟡

### 5.1 CSV import
**Fayl:** `artifacts/erp-dashboard/src/components/ImportEmployeesDialog.tsx` + `employees-compat-sub.service.ts`
- Template ustunlarini backend bilan moslash (`first_name`,`last_name` yoki backend `fullName`ni split qilsin)
- Zod DTO + qatorma-qator xato feedback
- **Verifikatsiya:** namuna CSV yuklab → import muvaffaqiyatli, xato qatorlar ko'rsatiladi

### 5.2 Mayda
- `EmployeeDialog` `useQuery`larga `onError` toast (Rule F2)
- `THIRTY_DAYS_MS` → `business.constants.ts` (Rule 12)
- Status o'zgartirish (active/resigned) ga ConfirmDialog (Rule 14)
- Rasm yuklashga fayl tip/hajm validatsiyasi

---

## Faza 6 — Yakuniy verifikatsiya

1. Backend: `pnpm --filter @europrint/api run dev:unsafe` (3030)
2. Login `admin`/`Admin123!`
3. Endpoint probe:
   - `GET /api/employees?page=1&limit=5` → org + KPI maydonlar real
   - `GET /api/employees/:id` → crashsiz, KPI ma'lumot
   - profil KPI endpointlari 200
4. Brauzer (`Ctrl+Shift+R`):
   - Ro'yxat: bo'lim/lavozim/maosh ustunlari to'la
   - Profil: tugmalar ishlaydi, KPI kartalar son ko'rsatadi, crash yo'q
   - Yangi xodim yaratish → org bo'lim/lavozim darhol ro'yxatda
5. `pnpm exec tsc -p apps/api/tsconfig.json --noEmit` + frontend tsc → 0 yangi xato

---

## Bajarilish tartibi (tavsiya)
**1-kun:** Faza 1 (profil crash/KPI) + Faza 2.1 (ro'yxat KPI) — eng ko'rinarli natija
**2-kun:** Faza 3 (org birlashtirish) — eng chuqur, ehtiyotkorlik bilan
**3-kun:** Faza 4 (jadval HR) + Faza 5 (import/sayqal) + Faza 6 (verifikatsiya)

## Xavf eslatmasi
- Backend HMR'da beqaror (564 commit qilinmagan o'zgarish) — har faza oxirida recompile + probe
- Faza 3.2 (forma o'zgarishi) — mavjud saqlash oqimini sinab ko'rish shart
- DB ustun nomlari har sub-query oldidan `information_schema` bilan tasdiqlanadi (schema drift)
