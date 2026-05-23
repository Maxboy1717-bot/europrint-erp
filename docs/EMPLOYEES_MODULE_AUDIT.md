# Employees Moduli — To'liq Chuqur Audit Hisoboti

> **Sahifa:** `/erp-dashboard/employees/` (Xodimlar ro'yxati) + `/employees/:id` (Xodim profili)
> **Sana:** 2026-05-21 | **Holat:** Tahlil (1 ta tuzatish bajarilgan — pastga qarang)
> **Ko'lam:** Umumiy jadval · Kiritish formasi · Xodim profili · Backend data qatlami · CSV import

---

## 0. Qisqacha xulosa

Employees moduli **ishlaydi, lekin yarim-stub holatda**: asosiy ma'lumot oqimi 200 qaytaradi, biroq ko'p ustun/karta soxta (0/NULL) qiymat ko'rsatadi, org-bog'lanish ikki xil mexanizmga bo'linib uzilgan, profil sahifasida ma'lumot kelmasa crash bo'ladi, kiritish formasi gibrid (legacy + org) chalkash. Eng kritik 4 ta muammo profil crash, bo'sh KPI, va org-bog'lanish uzilishidir.

| Daraja | Soni |
|--------|------|
| 🔴 Kritik | 6 |
| 🟠 Muhim | 5 |
| 🟡 Kichik | 4 |

---

## 1. UMUMIY JADVAL (`Employees.tsx` + `EmployeeTable.tsx`)

### 1.1 "LMS jadvaliga o'xshab qolgan" — sabab
Jadval ustunlari **LMS/training metrikalari bilan to'lgan**, asosiy HR ustunlari yo'q.

Hozirgi 11 ustun (`EmployeeTable.tsx:165-342`):

| # | Ustun | Bog'lanish | Holat |
|---|-------|-----------|-------|
| 1 | Xodim (ism+avatar) | `fullName` | ✅ HR |
| 2 | Telegram ID | `telegramChatId` | ⚠️ ortiqcha |
| 3 | Tabel raqami | `employeeId` | ✅ HR |
| 4 | Ish staji | `hireDate` (hisob) | ✅ HR |
| 5 | Tashkiliy tuzilma | `orgStructure` | ✅ (tuzatildi) |
| 6 | Attestatsiya | `attestationDate` | ⚠️ har doim bo'sh |
| 7 | Reyting ⭐ | `rating` | 🔴 LMS, 0/"—" |
| 8 | Yiqilgan testlar ❌ | `failedTests` | 🔴 LMS, 0/"—" |
| 9 | Bonus 💰 | `bonusAmount` | ⚠️ 0/"—" |
| 10 | Holati | `status` | ✅ HR |
| 11 | Amallar | dropdown | ✅ |

### 1.2 Yo'q bo'lib qolgan asosiy HR ustunlar
`departmentName`, `positionName`, **Maosh**, `phone` — `EmployeeRow` interfeysida bor (`Employees.tsx:39-61`), lekin jadvalga chiqarilmagan.

### 1.3 Stub maydonlar (har doim 0)
`Employees.tsx:161-165`: `rating`, `failedTests`, `bonusAmount`, `coursesTotal` — backend 0 qaytaradi → ustunlar "—" → jadval buzilgandek.

### 1.4 ✅ To'g'ri ishlaydigan
- Yuqoridagi 4 KPI karta (Jami/Faol/Yangi bu oy/Nofaol) — real `filter()` natijasi
- `Array.isArray()` himoyasi (`EmployeeTable.tsx:158`), `key={employee.id}` ✅
- Loading skeletonlar, pagination, qidiruv, bo'lim filtri ✅

---

## 2. KIRITISH / TAHRIRLASH FORMASI (`EmployeeDialog.tsx` + sub-bo'limlar)

### 2.1 🔴 Gibrid forma — ikki bog'lanish aralashgan
- **Eski:** `departmentId`+`positionId` → `employees.department_id`/`position_id`
- **Yangi:** `selectedOrgDepts[]` → `employee_org_departments` junction
- Foydalanuvchi qaysi birini to'ldirishni bilmaydi (`EmployeeDialog.tsx:258-269`).

### 2.2 🔴 Yagona FK hech qachon yozilmaydi
Forma `employees.org_department_id` / `org_function_id` ni **hech qachon yozmaydi** — faqat junction jadvalga yozadi. Lekin o'qish yo'li (3.D bo'lim) aynan shu yagona FK'ni ishlatadi → **yangi yoki tahrirlangan xodim org bo'lim/lavozimini ko'rsatmaydi**.

### 2.3 🔴 2-fazali saqlash xavfi
Org-funksiya xodim saqlangach ALOHIDA `assign-org-functions` chaqiruvda saqlanadi. Xato bersa: xodim yaratiladi, org bog'lanmaydi, retry yo'q, xato `try/catch`da yutiladi (`EmployeeDialog.tsx:216-226`).

### 2.4 🟡 Boshqalar
- Dropdown'lar (`/api/departments`, `/api/positions`) xato bersa jim qoladi — `onError` yo'q (Rule F2)
- Org-funksiya 0 ta tanlovda ham saqlashga ruxsat (frontend faqat ogohlantiradi)

---

## 3. XODIM PROFILI (`EmployeeProfile.tsx`, 365 qator, route `/employees/:id`)

21 ta tab: shaxsiy, ish, hujjatlar, intizom, rivojlanish, adaptatsiya, karyera, davomat, moliya, samaradorlik, maqsadlar, va h.k.

### 3.1 🔴 "Tugmalar yo'q" — prop bog'lanmagan
`EmployeeProfile.tsx:337` — `AttendanceTab`ga **3 dialog propi uzatilmagan:**
- Ta'til so'rovi · Kasallik · Xizmat safari

State + mutation e'lon qilingan (`:120-122`, `:294-296`), lekin AttendanceTab'ga berilmagan → tugma bosiladi, prop `undefined` → jim ishlamaydi.

### 3.2 🔴 "KPI kartalari yo'q" — ma'lumot null
`PerformanceTabSections.tsx:46-122` — 4 karta (ABC daraja, Kurs, Samaradorlik, Punktuallik):
- `/api/abc-analysis/user/:id`, `/api/progress/user/:id` null/bo'sh qaytaradi → karta "—"/"0%"
- 🔴 `/api/erp/employee/:id/metrics` yuklanadi, lekin KPI kartaga **bog'lanmaydi** (`EmployeeProfile.tsx:163`) — behuda

### 3.3 🔴 "Ma'lumot kelishi xato" — Array crash (Rule 2)
`EmployeeProfile.tsx:305-307`:
```ts
certificatesData?.filter(...) || []   // undefined bo'lsa .filter() CRASH
```
Himoyasiz `.filter()`: `bank-accounts`, `attendance`, `progress`, `certificates`, `employee-complaints` → ma'lumot kelmasa profil **crash**.

### 3.4 ✅ To'g'ri
21 tab komponentlari to'liq yozilgan, stub/TODO yo'q. ProfileHeader, dialoglar (12 ta) ulangan.

---

## 4. BACKEND DATA QATLAMI (ildiz sabablar)

### 4.1 🔴 Org-bog'lanish ikkiga bo'lingan (eng chuqur muammo)
| O'qish yo'li | Yozish yo'li |
|---|---|
| `employees.org_department_id` / `org_function_id` yagona FK | `employee_org_departments` junction (`user_id` orqali) |

- Xodimlarda `user_id` = NULL → junction ularni topa olmaydi
- Ikkala mexanizm sinxron emas → tahrirlash o'qishda ko'rinmaydi
- DB tasdiqi: employee 12 → `org_department_id=45` (singular bor), junction (user_id orqali) bo'sh

### 4.2 🔴 KPI maydonlari soxta (0) — real jadvallar mavjud, JOIN yo'q
`employees-list-extended.service.ts:107-111`:

| Maydon | Real jadval | FK |
|--------|-------------|-----|
| `coursesTotal` | `lms_exam_attempts` | user_id |
| `rating` | `employee_ratings` | employee_id |
| `bonusAmount` | `bonus_payments` | employee_id |
| `failedTests` | `lms_exam_attempts` (status=failed) | user_id |
| `disciplineCount` | `discipline_records` | employee_id |
| `attestationDate` | ❌ jadval yo'q | yaratish kerak |

### 4.3 Ikki parallel employee API (chalkashlik)
- `/api/employees` (camelCase, **sahifa ishlatadi**) → `compatibility/employees-compat*`
- `/api/hr/employees` (snake_case, **ishlatilmaydi**) → `hr/presentation/hr-employees.controller.ts`

---

## 5. CSV IMPORT (`ImportEmployeesDialog.tsx`)

1. 🔴 **Template nomuvofiq** — namuna `fullName` ustun beradi, backend `first_name`+`last_name` kutadi → import jim ishlamaydi (`ImportEmployeesDialog.tsx:83`)
2. 🟡 Zod DTO yo'q, qatorma-qator validatsiya/feedback yo'q
3. 🟡 Dublikat email jim o'tkazib yuboriladi (ON CONFLICT DO NOTHING)

---

## 6. PRIORITET TUZATISH RO'YXATI

| # | Muammo | Fayl | Daraja |
|---|--------|------|--------|
| 1 | Org-bog'lanishni birlashtirish (yozish FK'ni ham yangilasin yoki o'qish junction'dan olsin) | `employees-compat.helpers.ts` / `employees-list-extended.service.ts` | 🔴 |
| 2 | Profil `Array.isArray()` crash himoyasi | `EmployeeProfile.tsx:305-307` | 🔴 |
| 3 | AttendanceTab 3 dialog propini bog'lash | `EmployeeProfile.tsx:337` | 🔴 |
| 4 | KPI JOIN'lar (5 real jadval) | `employees-list-extended.service.ts:107-111` | 🔴 |
| 5 | Profil KPI kartalar null guard | `PerformanceTabSections.tsx:88,101,113` | 🟠 |
| 6 | Jadvaldan LMS ustunlarni alohida tab'ga, HR ustun qo'shish (bo'lim/lavozim/maosh/telefon) | `EmployeeTable.tsx` | 🟠 |
| 7 | CSV template `first_name`/`last_name` | `ImportEmployeesDialog.tsx:83` | 🟠 |
| 8 | Forma: org/legacy birini tanlash + `onError` | `EmployeeDialog.tsx` | 🟡 |
| 9 | `/api/erp/employee/:id/metrics` ni KPI kartaga bog'lash yoki olib tashlash | `EmployeeProfile.tsx:163` | 🟡 |
| 10 | `THIRTY_DAYS_MS` magic number → constants | `Employees.tsx:63` | 🟡 |

---

## 7. BAJARILGAN TUZATISH (shu audit davomida)

✅ **Org bo'lim/lavozim nomi o'qish yo'li tuzatildi** — `employees-list-extended.service.ts` ikkala query (ro'yxat + getById):
```sql
LEFT JOIN org_departments od ON od.id = e.org_department_id
LEFT JOIN org_functions ofn  ON ofn.id = e.org_function_id
-- NULL stub o'rniga:
COALESCE(od.name, od.name_ru)                     AS "orgDepartmentName"
COALESCE(ofn.position_name, ofn.position_name_ru) AS "orgPositionName"
```
Jonli tasdiq: Akmal→"Sotuvlar"/"Sotuvlar Boshlig'i", Aziz→"Preprint bo'limi"/"Dizayn Bo'lim Boshlig'i".

⚠️ **Cheklov:** Bu faqat seed qilingan 30 xodim uchun ishlaydi (ularda yagona FK to'la). Yangi/tahrirlangan xodimda yagona FK NULL bo'lgani uchun (#1, #2.2-bo'lim) org ustun yana bo'sh bo'ladi — to'liq yechim #1 tuzatishni talab qiladi.

---

## 8. Tekshirish (end-to-end)

1. Backend: `pnpm --filter @europrint/api run dev:unsafe` (port 3030)
2. Login: `admin` / `Admin123!`
3. Probe: `GET /api/employees?page=1&limit=3` → org maydonlar to'la
4. Profil: `GET /api/employees/:id` → KPI/sertifikat ma'lumot null bo'lsa crash bo'lmasligi
5. Frontend: `/erp-dashboard/employees/` → jadval HR ustunlari, profil tugmalari ishlashi
